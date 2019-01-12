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
      this.createModelNameForData(modelName);

      docRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          const flatRecord = flattenDocSnapshotData(docSnapshot);
          const normalizedRecord = store.normalize(modelName, flatRecord);
          const record = store.peekRecord(modelName, id);

          if (record && !record.isSaving) {
            store.push(normalizedRecord);
          }
        } else {
          this.unloadRecord(store, modelName, id);
        }
      }, () => this.unloadRecord(store, modelName, id));

      this.model[modelName].record[id] = true;
    }
  }

  /**
   * @param {string} modelName
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {DS.Store} store
   * @function
   */
  trackFindAllChanges(modelName, collectionRef, store) {
    if (!this.isAllRecordForTypeTracked(modelName)) {
      this.createModelNameForData(modelName);

      collectionRef.onSnapshot((querySnapshot) => {
        querySnapshot.forEach(docSnapshot => (
          store.findRecord(modelName, docSnapshot.id, {
            adapterOptions: { isRealtime: true },
          })
        ));
      }, () => {
        store.unloadAll(modelName);
        delete this.model[modelName];
      });

      this.model[modelName].meta.isAllRecords = true;
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
      collectionRef.onSnapshot(() => (
        store.peekRecord(modelName, id).hasMany(field).reload()
      ), () => delete this.query[queryId]);

      this.query[queryId] = true;
    }
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
      firestoreQuery.onSnapshot(() => recordArray.update(), () => delete this.query[finalQueryId]);
      this.query[finalQueryId] = true;
    }
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
  isAllRecordForTypeTracked(type) {
    try {
      return Object.prototype.hasOwnProperty.call(this.model[type].meta, 'isAllRecords');
    } catch (error) {
      return false;
    }
  }

  /**
   * @param {string} queryId
   * @return {boolean} True if queryId is being tracked for changes.
   * @function
   * @private
   */
  isQueryTracked(queryId) {
    return Object.prototype.hasOwnProperty.call(this.query, queryId);
  }

  /**
   * @param {string} type
   * @function
   * @private
   */
  createModelNameForData(type) {
    if (!Object.prototype.hasOwnProperty.call(this.model, type)) {
      this.model[type] = { meta: {}, record: {} };
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
