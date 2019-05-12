import { next } from '@ember/runloop';

import { flattenDocSnapshotData } from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * @class RealtimeTracker
 * @namespace Utils
 */
export default class RealtimeTracker {
  /**
   * @function
   */
  constructor() {
    this.model = {};
    this.query = {};
  }

  /**
   * @param {string} modelName
   * @param {firebase.firestore.DocumentReference} docRef
   * @param {DS.Store} store
   * @function
   */
  trackFindRecordChanges(modelName, docRef, store) {
    const { id } = docRef;

    if (!this.isRecordForTypeTracked(modelName, id)) {
      this.trackModel(modelName);

      docRef.onSnapshot((docSnapshot) => {
        if (this.model[modelName].record[id].hasOnSnapshotRunAtLeastOnce) {
          if (docSnapshot.exists) {
            const record = store.peekRecord(modelName, id);

            if (record && !record.isSaving) {
              const flatRecord = flattenDocSnapshotData(docSnapshot);
              const normalizedRecord = store.normalize(modelName, flatRecord);

              store.push(normalizedRecord);
            }
          } else {
            this.unloadRecord(store, modelName, id);
          }
        } else {
          this.model[modelName].record[id].hasOnSnapshotRunAtLeastOnce = true;
        }
      }, (error) => {
        const record = store.peekRecord(modelName, id);

        if (record) {
          // When we lose permission to view the document, we unload it from the store. However,
          // any template that has rendered the record will still be intact even if it no longer
          // exists in store.
          //
          // We set a flag here to give us the opportunity to change what the template should show.
          record.set('isUnloaded', true);
          record.set('unloadReason', error);
          this.unloadRecord(store, modelName, id);
        }

        delete this.model[modelName].record[id];
      });

      this.model[modelName].record[id] = { hasOnSnapshotRunAtLeastOnce: false };
    }
  }

  /**
   * @param {string} modelName
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {DS.Store} store
   * @function
   */
  trackFindAllChanges(modelName, collectionRef, store) {
    if (!this.isAllRecordsForTypeTracked(modelName)) {
      this.trackModel(modelName);

      collectionRef.onSnapshot((querySnapshot) => {
        if (this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce) {
          querySnapshot.forEach(docSnapshot => (
            store.findRecord(modelName, docSnapshot.id, {
              adapterOptions: { isRealtime: true },
            })
          ));
        } else {
          this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce = true;
        }
      }, () => {
        this.model[modelName].meta.isAllRecordsTracked = false;
      });

      this.model[modelName].meta.isAllRecordsTracked = true;
      this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce = false;
    }
  }

  /**
   * @param {string} modelName
   * @param {string} id
   * @param {Object} relationship
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {DS.Store} store
   * @function
   */
  trackFindHasManyChanges(modelName, id, relationship, collectionRef, store) {
    const { key: field } = relationship;
    const queryId = `${modelName}_${id}_${field}`;

    if (!this.isQueryTracked(queryId)) {
      this.trackQuery(queryId);
    }

    const unsubscribe = collectionRef.onSnapshot(() => {
      if (this.query[queryId].hasOnSnapshotRunAtLeastOnce) {
        // Schedule for next runloop to avoid race condition errors for when a record is unloaded
        // in the find record tracker because it was deleted in the database. Basically, we should
        // unload any deleted records first before refreshing the has-many array.
        next(() => {
          const hasManyRef = store.peekRecord(modelName, id).hasMany(field);

          hasManyRef.reload().then(() => this.query[queryId].unsubscribe());
        });
      } else {
        this.query[queryId].hasOnSnapshotRunAtLeastOnce = true;
      }
    }, () => delete this.query[queryId]);

    this.query[queryId].hasOnSnapshotRunAtLeastOnce = false;
    this.query[queryId].unsubscribe = unsubscribe;
  }

  /**
   * @param {firebase.firestore.Query} firestoreQuery
   * @param {DS.AdapterPopulatedRecordArray} recordArray
   * @param {string} [queryId]
   * @function
   */
  trackQueryChanges(firestoreQuery, recordArray, queryId) {
    const finalQueryId = queryId || Math.random().toString(32).slice(2).substr(0, 5);

    if (!this.isQueryTracked(finalQueryId)) {
      this.trackQuery(finalQueryId);
    }

    const unsubscribe = firestoreQuery.onSnapshot(() => {
      if (this.query[finalQueryId].hasOnSnapshotRunAtLeastOnce) {
        // Schedule for next runloop to avoid race condition errors for when a record is unloaded
        // in the find record tracker because it was deleted in the database. Basically, we should
        // unload any deleted records first before refreshing the query array.
        next(() => (
          recordArray.update().then(() => this.query[finalQueryId].unsubscribe())
        ));
      } else {
        this.query[finalQueryId].hasOnSnapshotRunAtLeastOnce = true;
      }
    }, () => delete this.query[finalQueryId]);

    this.query[finalQueryId].hasOnSnapshotRunAtLeastOnce = false;
    this.query[finalQueryId].unsubscribe = unsubscribe;
  }

  /**
   * @param {string} type
   * @param {string} id
   * @return {boolean} True if record for a type is being tracked for changes.
   * @function
   * @private
   */
  isRecordForTypeTracked(type, id) {
    try {
      return Object.prototype.hasOwnProperty.call(this.model[type].record, id);
    } catch (error) {
      return false;
    }
  }

  /**
   * @param {string} type
   * @return {boolean} True if all records for a type is being tracked for changes.
   * @function
   * @private
   */
  isAllRecordsForTypeTracked(type) {
    try {
      return Object.prototype.hasOwnProperty.call(this.model[type].meta, 'isAllRecordsTracked');
    } catch (error) {
      return false;
    }
  }

  /**
   * @param {string} id
   * @return {boolean} True if query ID is being tracked for changes.
   * @function
   * @private
   */
  isQueryTracked(id) {
    return Object.prototype.hasOwnProperty.call(this.query, id);
  }

  /**
   * @param {string} type
   * @function
   * @private
   */
  trackModel(type) {
    if (!Object.prototype.hasOwnProperty.call(this.model, type)) {
      this.model[type] = { meta: {}, record: {} };
    }
  }

  /**
   * @param {string} id
   * @function
   * @private
   */
  trackQuery(id) {
    if (!Object.prototype.hasOwnProperty.call(this.query, id)) {
      this.query[id] = {};
    }
  }

  /**
   * @param {DS.Store} store
   * @param {string} modelName
   * @param {string} id
   * @private
   */
  unloadRecord(store, modelName, id) {
    const record = store.peekRecord(modelName, id);

    if (record && !record.isSaving) {
      store.unloadRecord(record);
    }

    delete this.model[modelName].record[id];
  }
}
