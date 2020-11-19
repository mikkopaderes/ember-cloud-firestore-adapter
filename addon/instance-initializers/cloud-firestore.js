/* eslint-disable consistent-return */
import { Promise } from 'rsvp';
import { isNone } from '@ember/utils';
import { computed, get } from '@ember/object';
import { dasherize } from '@ember/string';
import { getOwner } from '@ember/application';
import { inject } from '@ember/service';
import { next } from '@ember/runloop';
import { singularize } from 'ember-inflector';
import { parseDocSnapshot } from 'ember-cloud-firestore-adapter/utils/parser';
import { updatePaginationMeta } from 'ember-cloud-firestore-adapter/utils/pagination';
import config from 'ember-get-config';

/**
 * @param {Application} appInstance
 * @function
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
    fastboot: computed(function () {
      return getOwner(this).lookup('service:fastboot');
    }),

    /**
     * @override
     */
    query(modelName, query) {
      return this._super(modelName, query).then((records) => {
        if (
          this.adapterFor(modelName).get('dbType') === 'cloud-firestore'
          && query.queryId
        ) {
          this.get('tracker')._query[query.queryId].recordArray = records;
        }

        return records;
      });
    },

    /**
     * @param {DS.Model} type
     * @param {firebase.firestore.DocumentReference} docRef
     * @function
     */
    listenForDocChanges(type, docRef) {
      if (
        !this.isInFastBoot()
        && !this.hasListenerForDoc(type.modelName, docRef.id)
      ) {
        this.trackDocListener(type.modelName, docRef.id);

        docRef.onSnapshot((docSnapshot) => {
          next(() => {
            if (docSnapshot.exists) {
              const payload = parseDocSnapshot(type, docSnapshot);
              payload._snapshot = docSnapshot;
              payload._docRef = payload._docRef || docRef;
              payload._docRefPath = payload._docRefPath || docRef.path;
              const normalizedPayload = this.normalize(type.modelName, payload);

              this.push(normalizedPayload);
            } else {
              this.unloadRecordUsingModelNameAndId(type.modelName, docRef.id);
            }
          });
        }, () => {
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
     * @param {firebase.firestore.CollectionReference} collectionRef
     * @function
     */
    listenForCollectionChanges(collectionRef) {
      const modelName = this.buildModelName(collectionRef.id);

      if (!this.isInFastBoot() && !this.hasListenerForCollection(modelName)) {
        this.trackCollectionListener(modelName);

        collectionRef.onSnapshot((querySnapshot) => {
          next(() => {
            if (config.environment === 'test') {
              querySnapshot.forEach(docSnapshot => this.findRecord(modelName, docSnapshot.id));
            } else {
              querySnapshot
                .docChanges()
                .forEach((change) => {
                  const { doc: docSnapshot } = change;
                  return this.findRecord(modelName, docSnapshot.id);
                });
            }
          });
        });
      }
    },

    /**
     * @param {string} modelName
     * @param {Object} option
     * @param {firebase.firestore.Query} queryRef
     * @function
     */
    listenForQueryChanges(modelName, option, queryRef) {
      if (!this.isInFastBoot()) {
        let queryTracker;

        if (this.hasListenerForQuery(option.queryId)) {
          queryTracker = this.get('tracker')._query[option.queryId];

          queryTracker.unsubscribe();

          if (!queryTracker.recordArray.get('isUpdating')) {
            queryTracker.recordArray = null;
          }
        } else {
          this.trackQueryListener(option.queryId);

          queryTracker = this.get('tracker')._query[option.queryId];
        }

        const unsubscribe = queryRef.onSnapshot((querySnapshot) => {
          if (queryTracker.recordArray) {
            const requests = this.findQueryRecords(modelName, option, querySnapshot);

            Promise.all(requests).then((responses) => {
              next(() => {
                queryTracker.recordArray.get('content').clear();

                responses.forEach((record) => {
                  queryTracker.recordArray.get('content').pushObject(record._internalModel);
                });
              });
            });
          }
        });

        queryTracker.unsubscribe = unsubscribe;
      }
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @param {Object} relationship
     * @param {firebase.firestore.CollectionReference} collectionRef
     * @function
     */
    listenForHasManyChanges(modelName, id, relationship, collectionRef) {
      if (!this.isInFastBoot()) {
        const { type, key: field } = relationship;
        let hasManyTracker;

        if (this.hasListenerForHasMany(modelName, id, field)) {
          hasManyTracker = this.get('tracker')[modelName].document[id].relationship[field];
          hasManyTracker.unsubscribe();
        } else if (this.trackHasManyListener(modelName, id, field)) {
          hasManyTracker = this.get('tracker')[modelName].document[id].relationship[field];
        }

        const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
          const processedChanges = this._handleDocChanges(type, querySnapshot);
          const { changedRecords, promises } = processedChanges;

          Promise.all(promises).then((updatedRecords) => {
            const record = this.peekRecord(modelName, id);
            if (!record) return;

            const currentRecords = get(record, field);

            changedRecords.forEach(({ data: { id: changeId, changeType } }) => {
              const current = currentRecords.findBy('id', changeId);
              const updated = updatedRecords.findBy('id', changeId);

              // Remove
              if (changeType === 'removed') {
                if (current) currentRecords.removeObject(current);
                return;
              }

              // Update
              if (current) {
                const index = currentRecords.indexOf(current);
                currentRecords.replace(index, 1, [updated]);
              } else {
                // Add
                currentRecords.addObject(updated);
              }
            });

            updatePaginationMeta(relationship, currentRecords);
          });
        });

        if (hasManyTracker) hasManyTracker.unsubscribe = unsubscribe;
      }
    },

    _handleDocChanges(type, querySnapshot) {
      const promises = [];
      const changedRecords = [];
      const involvedChangeTypes = [];
      const { environment } = config;

      if (environment === 'test') {
        querySnapshot.forEach((docSnapshot) => {
          promises.push(this.findRecord(type, docSnapshot.id, {
            adapterOptions: {
              docRef: docSnapshot.ref,
            },
          }));

          changedRecords.push({
            data: { type, id: docSnapshot.id },
          });
        });
      } else {
        const changes = querySnapshot.docChanges();

        changes.forEach((change) => {
          const { type: changeType, doc: docSnapshot } = change;

          if (changeType === 'added' || changeType === 'modified') {
            promises.push(this.findRecord(type, docSnapshot.id, {
              adapterOptions: {
                docRef: docSnapshot.ref,
              },
            }));
          }

          changedRecords.push({
            data: { type, id: docSnapshot.id, changeType },
          });
        });
      }

      return { changedRecords, promises, involvedChangeTypes };
    },

    /**
     * @param {string} collectionName
     * @return {string} Dasherized and singularized model name
     * @function
     * @private
     */
    buildModelName(collectionName) {
      return dasherize(singularize(collectionName));
    },

    /**
     * @override
     */
    _pushResourceIdentifier(relationship, resourceIdentifier) {
      if (isNone(resourceIdentifier)) return;

      // this.assertRelationshipData(this, relationship.internalModel, resourceIdentifier, relationship.relationshipMeta);

      const internalModel = this
        ._internalModelsFor(resourceIdentifier.type)
        .get(resourceIdentifier.id);

      if (internalModel) return internalModel;

      return this._buildInternalModel(
        resourceIdentifier.type,
        resourceIdentifier.id,
        resourceIdentifier.data,
      );
    },

    /**
     * @return {boolean} True if in FastBoot. Otherwise, false.
     * @function
     * @private
     */
    isInFastBoot() {
      const fastboot = this.get('fastboot');

      return fastboot && fastboot.get('isFastBoot');
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @function
     * @private
     */
    hasListenerForDoc(modelName, id) {
      if (Object.prototype.hasOwnProperty.call(this.get('tracker'), modelName)) {
        if (this.get('tracker')[modelName].document[id]) {
          return true;
        }
      }

      return false;
    },

    /**
     * @param {string} modelName
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @function
     * @private
     */
    hasListenerForCollection(modelName) {
      if (Object.prototype.hasOwnProperty.call(this.get('tracker'), modelName)) {
        if (this.get('tracker')[modelName].collection) {
          return true;
        }
      }

      return false;
    },

    /**
     * @param {string} queryId
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @function
     * @private
     */
    hasListenerForQuery(queryId) {
      if (
        Object.prototype.hasOwnProperty.call(this.get('tracker'), '_query')
        && Object.prototype.hasOwnProperty.call(this.get('tracker._query'), queryId)
      ) {
        return true;
      }

      return false;
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @param {string} field
     * @return {boolean} True if there's a listener. Otherwise, false.
     * @function
     * @private
     */
    hasListenerForHasMany(modelName, id, field) {
      if (
        Object.prototype.hasOwnProperty.call(this.get('tracker'), modelName)
        && Object.prototype.hasOwnProperty.call(this.get('tracker')[modelName].document, id)
        && this.get('tracker')[modelName].document[id].relationship[field]
      ) {
        return true;
      }

      return false;
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @function
     * @private
     */
    trackDocListener(modelName, id) {
      if (!Object.prototype.hasOwnProperty.call(this.get('tracker'), modelName)) {
        this.get('tracker')[modelName] = { collection: false, document: {} };
      }

      this.get('tracker')[modelName].document[id] = {
        relationship: {},
      };
    },

    /**
     * @param {string} modelName
     * @function
     * @private
     */
    trackCollectionListener(modelName) {
      if (!Object.prototype.hasOwnProperty.call(this.get('tracker'), modelName)) {
        this.get('tracker')[modelName] = { collection: false, document: {} };
      }

      this.get('tracker')[modelName].collection = true;
    },

    /**
     * @param {string} queryId
     * @function
     * @private
     */
    trackQueryListener(queryId) {
      if (!Object.prototype.hasOwnProperty.call(this.get('tracker'), '_query')) {
        this.get('tracker')._query = {};
      }

      this.get('tracker')._query[queryId] = {};
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @param {string} field
     * @function
     * @private
     */
    trackHasManyListener(modelName, id, field) {
      if (!this.get('tracker')[modelName].document[id]) return;
      this.get('tracker')[modelName].document[id].relationship[field] = {};
      return true;
    },

    /**
     * @param {string} modelName
     * @param {string} id
     * @function
     * @private
     */
    unloadRecordUsingModelNameAndId(modelName, id) {
      const record = this.peekRecord(modelName, id);

      if (record && !record.get('isSaving')) {
        this.unloadRecord(record);
      }
    },

    /**
     * @param {string} modelName
     * @param {Object} option
     * @param {firebase.firestore.QuerySnapshot} querySnapshot
     * @return {Array.<Promise>} Find record promises
     * @function
     * @private
     */
    findQueryRecords(modelName, option, querySnapshot) {
      return querySnapshot.docs.map((docSnapshot) => {
        const referenceKeyName = this.adapterFor(modelName).get('referenceKeyName');
        const referenceTo = docSnapshot.get(referenceKeyName) || docSnapshot.ref;

        if (referenceTo && referenceTo.firestore) {
          const request = this.findRecord(modelName, referenceTo.id, {
            adapterOptions: {
              buildReference() {
                return referenceTo.parent;
              },
            },
          });

          return request;
        }

        return this.findRecord(modelName, docSnapshot.id, { adapterOptions: option });
      });
    },
  });
}

/**
 * @param {Application} appInstance
 * @function
 */
export function initialize(appInstance) {
  reopenStore(appInstance);
}

export default { initialize };
