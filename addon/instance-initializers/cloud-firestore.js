import { Promise } from 'rsvp';
import { computed } from '@ember/object';
import { dasherize } from '@ember/string';
import { getOwner } from '@ember/application';
import { inject } from '@ember/service';
import { run } from '@ember/runloop';
import { singularize } from 'ember-inflector';

import {
  buildPathFromRef,
  parseDocSnapshot,
} from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * Initializer
 *
 * @param {Application} appInstance
 */
export function initialize(appInstance) {
  reopenStore(appInstance);
}

export default {
  initialize,
};

/**
 * Reopens the Store service for extension
 *
 * @param {Application} appInstance
 */
function reopenStore(appInstance) {
  appInstance.lookup('service:store').reopen({
    /**
     * @type {Ember.Service}
     */
    firebase: inject(),

    /**
     * @type {Object}
     */
    tracker: {},

    /**
     * @type {Ember.Service}
     */
    fastboot: computed(function() {
      return getOwner(this).lookup('service:fastboot');
    }),

    /**
     * @override
     */
    query(modelName, query) {
      return this._super(modelName, query).then((records) => {
        if (
          this.adapterFor(modelName).get('dbType') === 'cloud-firestore' &&
          query.queryId
        ) {
          this.get('tracker')['_query'][query.queryId]['recordArray'] = records;
        }

        return records;
      });
    },

    /**
     * Listen for changes to a document
     *
     * @param {DS.Model} type
     * @param {firebase.firestore.DocumentReference} docRef
     */
    listenForDocChanges(type, docRef) {
      if (
        !this.isInFastBoot() &&
        !this.hasListenerForDoc(type.modelName, docRef.id)
      ) {
        this.trackDocListener(type.modelName, docRef.id);

        docRef.onSnapshot((docSnapshot) => {
          run(() => {
            if (docSnapshot.exists) {
              const payload = parseDocSnapshot(type, docSnapshot);
              const normalizedPayload = this.normalize(type.modelName, payload);

              this.push(normalizedPayload);
            } else {
              this.unloadRecordUsingModelNameAndId(type.modelName, docRef.id);
            }
          });
        }, (error) => {
          const willUnloadRecordOnListenError = this
            .adapterFor(type.modelName)
            .get('willUnloadRecordOnListenError');

          if (willUnloadRecordOnListenError) {
            this.unloadRecordUsingModelNameAndId(type.modelName, docRef.id);
          }
        });
      }
    },

    /**
     * Listen for changes to a collection
     *
     * @param {firebase.firestore.CollectionReference} collectionRef
     */
    listenForCollectionChanges(collectionRef) {
      const modelName = this.buildModelName(collectionRef.id);

      if (!this.isInFastBoot() && !this.hasListenerForCollection(modelName)) {
        this.trackCollectionListener(modelName);

        collectionRef.onSnapshot((querySnapshot) => {
          run(() => {
            querySnapshot.forEach((docSnapshot) => {
              this.findRecord(modelName, docSnapshot.id);
            });
          });
        });
      }
    },

    /**
     * Listen for changes to a query
     *
     * @param {string} modelName
     * @param {Object} option
     * @param {firebase.firestore.Query} queryRef
     */
    listenForQueryChanges(modelName, option, queryRef) {
      if (!this.isInFastBoot()) {
        let queryTracker;

        if (this.hasListenerForQuery(option.queryId)) {
          queryTracker = this.get('tracker')['_query'][option.queryId];

          queryTracker.unsubscribe();

          if (!queryTracker.recordArray.get('isUpdating')) {
            queryTracker.recordArray = null;
          }
        } else {
          this.trackQueryListener(option.queryId);

          queryTracker = this.get('tracker')['_query'][option.queryId];
        }

        const unsubscribe = queryRef.onSnapshot((querySnapshot) => {
          if (queryTracker.recordArray) {
            const requests = [];

            querySnapshot.forEach((docSnapshot) => {
              const reference = docSnapshot.get('cloudFirestoreReference');

              if (reference && reference.hasOwnProperty('firestore')) {
                const pathNodes = buildPathFromRef(reference).split('/');
                const id = pathNodes.pop();
                const path = pathNodes.join('/');
                const request = this.findRecord(modelName, id, {
                  adapterOptions: { path },
                });

                requests.push(request);
              } else {
                const request = this.findRecord(modelName, docSnapshot.id, {
                  adapterOptions: { path: option.path },
                });

                requests.push(request);
              }
            });

            Promise.all(requests).then((responses) => {
              run(() => {
                queryTracker.recordArray.get('content').clear();

                responses.forEach((record) => {
                  queryTracker.recordArray.get('content').pushObject(
                    record._internalModel,
                  );
                });
              });
            });
          }
        });

        queryTracker.unsubscribe = unsubscribe;
      }
    },

    /**
     * Listen for changes to a hasMany collection
     *
     * @param {string} modelName
     * @param {string} id
     * @param {string} field
     * @param {firebase.firestore.CollectionReference} collectionRef
     */
    listenForHasManyChanges(modelName, id, field, collectionRef) {
      if (
        !this.isInFastBoot() &&
        !this.hasListenerForHasMany(modelName, id, field)
      ) {
        this.trackHasManyListener(modelName, id, field);

        collectionRef.onSnapshot(() => {
          run(() => {
            this.peekRecord(modelName, id).hasMany(field).reload();
          });
        });
      }
    },

    /**
     * Camelizes and pluralizes the collection name
     *
     * @param {string} collectionName
     * @return {string} Dasherized and singularized model name
     * @private
     */
    buildModelName(collectionName) {
      return dasherize(singularize(collectionName));
    },

    /**
     * Checks if in FastBoot
     *
     * @return {boolean} True if in FastBoot. Otherwise, false.
     * @private
     */
    isInFastBoot() {
      const fastboot = this.get('fastboot');

      return fastboot && fastboot.get('isFastBoot');
    },

    /**
     * Checks if there's already an active change listener for a document
     *
     * @param {string} modelName
     * @param {string} id
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @private
     */
    hasListenerForDoc(modelName, id) {
      if (this.get('tracker').hasOwnProperty(modelName)) {
        if (this.get('tracker')[modelName]['document'][id]) {
          return true;
        }
      }

      return false;
    },

    /**
     * Checks if there's already a change listener for a collection
     *
     * @param {string} modelName
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @private
     */
    hasListenerForCollection(modelName) {
      if (this.get('tracker').hasOwnProperty(modelName)) {
        if (this.get('tracker')[modelName]['collection']) {
          return true;
        }
      }

      return false;
    },

    /**
     * Checks if there's already a change listener for a query
     *
     * @param {string} queryId
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @private
     */
    hasListenerForQuery(queryId) {
      if (this.get('tracker').hasOwnProperty('_query')) {
        if (this.get('tracker._query').hasOwnProperty(queryId)) {
          return true;
        }
      }

      return false;
    },

    /**
     * Checks if there's already an active change listener for a hasMany
     *
     * @param {string} modelName
     * @param {string} id
     * @param {string} field
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @private
     */
    hasListenerForHasMany(modelName, id, field) {
      if (
        this.get('tracker').hasOwnProperty(modelName) &&
        this.get('tracker')[modelName]['document'].hasOwnProperty(id) &&
        this.get('tracker')[modelName]['document'][id]['relationship'][field]
      ) {
        return true;
      }

      return false;
    },

    /**
     * Tracks a document change listener
     *
     * @param {string} modelName
     * @param {string} id
     * @private
     */
    trackDocListener(modelName, id) {
      if (!this.get('tracker').hasOwnProperty(modelName)) {
        this.get('tracker')[modelName] = { collection: false, document: {} };
      }

      this.get('tracker')[modelName]['document'][id] = {
        relationship: {},
      };
    },

    /**
     * Tracks a collection change listener
     *
     * @param {string} modelName
     * @private
     */
    trackCollectionListener(modelName) {
      if (!this.get('tracker').hasOwnProperty(modelName)) {
        this.get('tracker')[modelName] = { collection: false, document: {} };
      }

      this.get('tracker')[modelName]['collection'] = true;
    },

    /**
     * Tracks a query change listener
     *
     * @param {string} queryId
     * @private
     */
    trackQueryListener(queryId) {
      if (!this.get('tracker').hasOwnProperty('_query')) {
        this.get('tracker')['_query'] = {};
      }

      this.get('tracker')['_query'][queryId] = {};
    },

    /**
     * Tracks a collection change listener for a hasMany
     *
     * @param {string} modelName
     * @param {string} id
     * @param {string} field
     * @private
     */
    trackHasManyListener(modelName, id, field) {
      this.get('tracker')[modelName]['document'][id]['relationship'][field] =
        true;
    },

    /**
     * Unloads a record using model name and ID
     * @param {string} modelName
     * @param {string} id
     * @private
     */
    unloadRecordUsingModelNameAndId(modelName, id) {
      const record = this.peekRecord(modelName, id);

      if (record && !record.get('isSaving')) {
        this.unloadRecord(record);
      }
    },
  });
}
