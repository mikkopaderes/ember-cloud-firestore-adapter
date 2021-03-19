/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable consistent-return */
import { updatePaginationMeta } from 'ember-cloud-firestore-adapter/utils/pagination';
import { parseDocSnapshot } from 'ember-cloud-firestore-adapter/utils/parser';
import { diff } from 'ember-cloud-firestore-adapter/utils/array';
import { getOwner } from '@ember/application';
import { singularize } from 'ember-inflector';
import { computed, get } from '@ember/object';
import { dasherize } from '@ember/string';
import { inject } from '@ember/service';
import { isNone } from '@ember/utils';
import { next } from '@ember/runloop';
import config from 'ember-get-config';
import { Promise } from 'rsvp';

/**
 * @param {Application} appInstance
 * @function
 */
function reopenStore(appInstance) {
  appInstance.lookup('service:store').reopen({
    activeSnapshotListeners: { collection: {}, document: {} },
    snapshotListenerCount: 0,

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

        console.log(
          'Adding new snapshot listener for DOC',
          { modelName: type.modelName, id: docRef.id }
        );

        this.snapshotListenerCount++;

        docRef.onSnapshot((docSnapshot) => {
          next(() => {
            if (docSnapshot.exists) {
              const payload = parseDocSnapshot(type, docSnapshot, docRef);
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

        this.logActiveSnapshotListeners({ doc: { modelName: type.modelName, id: docRef.id } });
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

        console.log('Adding new snapshot listener for COLLECTION', { collectionRef });
        this.snapshotListenerCount++;

        collectionRef.onSnapshot((querySnapshot) => {
          next(() => {
            if (config.environment === 'test') {
              querySnapshot.forEach(docSnapshot =>
                this.findRecord(
                  modelName,
                  docSnapshot.id,
                  { adapterOptions: { attachSnapshotListener: false } },
                ));
            } else {
              querySnapshot
                .docChanges()
                .forEach((change) => {
                  const { doc: docSnapshot } = change;
                  return this.findRecord(
                    modelName,
                    docSnapshot.id,
                    { adapterOptions: { attachSnapshotListener: false } },
                  );
                });
            }
          });
        });

        console.log('SNAPSHOT LISTENERS ACTIVE', this.snapshotListenerCount);
      }
    },

    /**
     * @param {string} modelName
     * @param {Object} option
     * @param {firebase.firestore.Query} queryRef
     * @function
     */
    listenForQueryChanges(modelName, option, collectionRef) {
      if (!this.isInFastBoot()) {
        let queryTracker;

        if (this.hasListenerForQuery(option.queryId)) {
          queryTracker = this.get('tracker')._query[option.queryId];

          console.log('Removing existing snapshot listener for QUERY');
          this.snapshotListenerCount--;

          queryTracker.unsubscribe();

          if (!queryTracker.recordArray.get('isUpdating')) {
            queryTracker.recordArray = null;
          }
        } else {
          this.trackQueryListener(option.queryId);

          queryTracker = this.get('tracker')._query[option.queryId];
        }

        console.log('Adding new snapshot listener for QUERY', { modelName, option, collectionRef });
        this.snapshotListenerCount++;

        const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
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

        console.log('SNAPSHOT LISTENERS ACTIVE', this.snapshotListenerCount);
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
              attachSnapshotListener: false,
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

    /**
     * @param {string} modelName
     * @param {string} id
     * @param {Object} relationship
     * @param {firebase.firestore.CollectionReference} collectionRef
     * @function
     */
    listenForHasManyChanges(modelName, id, relationship, collectionRef) {
      if (!this.isInFastBoot()) {
        const { type: relatedModelType, key: field } = relationship;

        let hasManyTracker;

        if (this.hasListenerForHasMany(modelName, id, field)) {
          hasManyTracker = this.get('tracker')[modelName].document[id].relationship[field];

          console.log('Removing existing snapshot listener for HASMANY');
          this.snapshotListenerCount--;

          hasManyTracker.unsubscribe();
        } else if (this.trackHasManyListener(modelName, id, field)) {
          hasManyTracker = this.get('tracker')[modelName].document[id].relationship[field];
        } else {
          this.trackDocListener(modelName, id);
          this.trackHasManyListener(modelName, id, field);
          hasManyTracker = this.get('tracker')[modelName].document[id].relationship[field];
        }

        console.log(
          'Adding new snapshot listener for HASMANY',
          {
            modelName,
            type: relatedModelType,
            field,
            id,
          },
        );

        this.snapshotListenerCount++;

        const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
          console.time('Handle Collection-Snapshot Listener');

          const normalizedChanges = this._normalizeDocChanges(relatedModelType, querySnapshot);

          const ownerRecord = this.peekRecord(modelName, id);
          if (!ownerRecord) return;

          const hasManyRecords = get(ownerRecord, field);

          const initialSnapshotListenerInfo = this._getInitialSnapshotListenerInfo(
            hasManyTracker,
            hasManyRecords,
            normalizedChanges,
          );

          const {
            isInitialCall,
            isRedundantCall,
          } = initialSnapshotListenerInfo;

          if (isInitialCall) {
            hasManyTracker.initialized = true;

            if (isRedundantCall) {
              const { changedRecords } = initialSnapshotListenerInfo;
              hasManyRecords.replace(0, hasManyRecords.length, changedRecords);
              console.timeEnd('Handle Collection-Snapshot Listener');
              return;
            }
          }

          // Update records
          normalizedChanges.forEach(({
            id: recordId,
            changeType,
            record,
          }) => {
            const currentRecord = hasManyRecords.findBy('id', recordId);

            if (changeType === 'removed') {
              // Remove
              if (currentRecord) hasManyRecords.removeObject(currentRecord);
            } else if (currentRecord) {
              // Update
              const index = hasManyRecords.indexOf(currentRecord);
              hasManyRecords.replace(index, 1, [record]);
            } else {
              // Add
              hasManyRecords.pushObject(record);
            }
          });

          updatePaginationMeta(relationship, hasManyRecords);

          console.timeEnd('Handle Collection-Snapshot Listener');
        });

        if (hasManyTracker) hasManyTracker.unsubscribe = unsubscribe;

        this.logActiveSnapshotListeners({
          collection: {
            modelName,
            field,
            type: relatedModelType,
            id,
          },
        });
      }
    },

    _getInitialSnapshotListenerInfo(hasManyTracker, hasManyRecords, changes) {
      const info = {
        changedRecords: [],
        isRedundantCall: changes.length === hasManyRecords.length,
        isInitialCall: (
          config.environment !== 'test'
          && hasManyTracker
          && !hasManyTracker.initialized
        ),
      };

      if (!info.isRedundantCall) {
        return info;
      }

      const changedRecords = changes.mapBy('record').compact();

      const recordIdDiffs = diff(
        hasManyRecords.compact().mapBy('id'),
        changedRecords.mapBy('id'),
      );

      const hasSameRecords = !recordIdDiffs.length;

      info.isRedundantCall = hasSameRecords;
      if (hasSameRecords) info.changedRecords = changedRecords;

      return info;
    },

    _normalizeDocChanges(relatedModelType, querySnapshot) {
      const normalizedChanges = [];
      const { environment } = config;

      if (environment === 'test') {
        querySnapshot.forEach((docSnapshot) => {
          const payload = parseDocSnapshot(relatedModelType, docSnapshot);
          const normalizedPayload = this.normalize(relatedModelType, payload);
          const record = this.push(normalizedPayload);

          normalizedChanges.push({
            id: docSnapshot.id,
            record,
          });
        });
      } else {
        const docChanges = querySnapshot.docChanges();

        docChanges.forEach((change) => {
          const { type: changeType, doc: docSnapshot } = change;
          const payload = parseDocSnapshot(relatedModelType, docSnapshot);

          let normalizedChange = {
            id: docSnapshot.id,
            changeType,
          };

          if (changeType !== 'removed') {
            const normalizedPayload = this.normalize(relatedModelType, payload);
            const record = this.push(normalizedPayload);
            normalizedChange = { ...normalizedChange, record };
          }

          normalizedChanges.push(normalizedChange);
        });
      }

      return normalizedChanges;
    },

    logActiveSnapshotListeners({ isActive = true, collection, doc }) {
      const {
        modelName,
        field,
        type,
        id,
      } = { ...(collection || {}), ...(doc || {}) };

      const listenerKey = collection
        ? `${modelName}:${id} -> ${field}:${type}`
        : `${modelName}:${id}`;

      this.activeSnapshotListeners[collection ? 'collection' : 'document'][listenerKey] = isActive;

      console.log('DOCUMENT SNAPSHOT LISTENERS');
      console.table(this.activeSnapshotListeners.document);

      console.log('COLLECTION SNAPSHOT LISTENERS');
      console.table(this.activeSnapshotListeners.collection);

      console.log('TOTAL SNAPSHOT LISTENERS ACTIVE', this.snapshotListenerCount);
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
      const tracker = this.get('tracker')[modelName];
      if (!tracker || !tracker.document[id]) return;
      tracker.document[id].relationship[field] = {};
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
