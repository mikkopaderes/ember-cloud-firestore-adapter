import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import Adapter from 'ember-data/adapter';

import { buildCollectionName, buildRefFromPath } from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * @class CloudFirestore
 * @namespace Adapter
 * @extends DS.Adapter
 */
export default Adapter.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: service(),

  /**
   * @type {Object}
   */
  firestoreSettings: { timestampsInSnapshots: true },

  /**
   * @type {string}
   */
  referenceKeyName: 'referenceTo',

  /**
   * @override
   */
  defaultSerializer: 'cloud-firestore',

  /**
   * @override
   */
  init(...args) {
    this._super(...args);

    if (this.firestoreSettings) {
      const db = this.firebase.firestore();

      db.settings(this.firestoreSettings);
    }
  },

  /**
   * @override
   */
  generateIdForRecord(store, type) {
    const db = this.firebase.firestore();
    const collectionName = buildCollectionName(type);

    return db.collection(collectionName).doc().id;
  },

  /**
   * @override
   */
  async createRecord(store, type, snapshot) {
    const docRef = this.buildCollectionRef(type, snapshot.adapterOptions).doc(snapshot.id);
    const batch = this.buildWriteBatch(docRef, snapshot);

    await batch.commit();

    return this.serialize(snapshot, { includeId: true });
  },

  /**
   * @override
   */
  async updateRecord(store, type, snapshot) {
    const db = this.firebase.firestore();
    const docRef = db.collection(buildCollectionName(type.modelName)).doc(snapshot.id);
    const batch = this.buildWriteBatch(docRef, snapshot);

    await batch.commit();

    return this.serialize(snapshot, { includeId: true });
  },

  /**
   * @override
   */
  async deleteRecord(store, type, snapshot) {
    const db = this.firebase.firestore();
    const docRef = db.collection(buildCollectionName(type.modelName)).doc(snapshot.id);
    const batch = db.batch();

    batch.delete(docRef);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch.commit();
  },

  /**
   * @override
   */
  async findAll(store, type) {
    const db = this.firebase.firestore();
    const collectionRef = db.collection(buildCollectionName(type.modelName));
    const querySnapshot = await collectionRef.get();

    return querySnapshot.docs.map(docSnapshot => this.flattenDocSnapshotData(docSnapshot));
  },

  /**
   * @override
   */
  async findRecord(store, type, id, snapshot = {}) {
    const docSnapshot = await this.buildCollectionRef(type, snapshot.adapterOptions).doc(id).get();

    return this.flattenDocSnapshotData(docSnapshot);
  },

  /**
   * @override
   */
  async findBelongsTo(store, snapshot, url, relationship) {
    const type = { modelName: relationship.type };
    const urlNodes = url.split('/');
    const id = urlNodes.pop();

    return this.findRecord(store, type, id, {
      adapterOptions: {
        buildReference(db) {
          return buildRefFromPath(db, urlNodes.join('/'));
        },
      },
    });
  },

  /**
   * @override
   */
  async findHasMany(store, snapshot, url, relationship) {
    const collectionRef = this.buildHasManyCollectionRef(store, snapshot, url, relationship);
    const querySnapshot = await collectionRef.get();
    const requests = this.findHasManyRecords(store, relationship, querySnapshot);

    return Promise.all(requests);
  },

  /**
   * @override
   */
  async query(store, type, query) {
    const collectionRef = this.buildCollectionRef(type, query);
    const firestoreQuery = this.buildQuery(collectionRef, query);
    const querySnapshot = await firestoreQuery.get();

    return querySnapshot.docs.map(docSnapshot => this.flattenDocSnapshotData(docSnapshot));
  },

  /**
   * @param {DS.Model} type
   * @param {Object} [adapterOptions={}]
   * @return {firebase.firestore.CollectionReference} Collection reference
   * @function
   * @private
   */
  buildCollectionRef(type, adapterOptions = {}) {
    const db = this.firebase.firestore();

    if (Object.prototype.hasOwnProperty.call(adapterOptions, 'buildReference')) {
      return adapterOptions.buildReference(db);
    }

    return db.collection(buildCollectionName(type.modelName));
  },

  /**
   * @param {firebase.firestore.WriteBatch} batch
   * @param {firebase.firestore.DocumentReference} docRef
   * @param {DS.Snapshot} snapshot
   * @function
   * @private
   */
  addDocRefToWriteBatch(batch, docRef, snapshot) {
    const data = this.serialize(snapshot);

    batch.set(docRef, data, { merge: true });
  },

  /**
   * @param {firebase.firestore.WriteBatch} batch
   * @param {Object} [adapterOptions={}]
   * @function
   * @private
   */
  addIncludeToWriteBatch(batch, adapterOptions = {}) {
    const db = this.firebase.firestore();

    if (Object.prototype.hasOwnProperty.call(adapterOptions, 'include')) {
      adapterOptions.include(batch, db);
    }
  },

  /**
   * @param {firebase.firestore.DocumentReference} docRef
   * @param {DS.Snapshot} snapshot
   * @return {firebase.firestore.WriteBatch} Batch instance
   * @function
   * @private
   */
  buildWriteBatch(docRef, snapshot) {
    const db = this.firebase.firestore();
    const batch = db.batch();

    this.addDocRefToWriteBatch(batch, docRef, snapshot);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch;
  },

  /**
   * @param {firebase.firestore.DocumentSnapshot} docSnapshot
   * @return {Object} Flattened doc snapshot data
   * @function
   * @private
   */
  flattenDocSnapshotData(docSnapshot) {
    const { id } = docSnapshot;
    const data = docSnapshot.data();

    return assign({}, data, { id });
  },

  /**
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {Object} [option={}]
   * @param {Model.<*>} [record]
   * @return {firebase.firestore.Query} Query
   * @function
   * @private
   */
  buildQuery(collectionRef, option = {}, record) {
    if (Object.prototype.hasOwnProperty.call(option, 'filter')) {
      return option.filter(collectionRef, record);
    }

    return collectionRef;
  },

  /**
   * @param {DS.Store} store
   * @param {DS.Snapshot} snapshot
   * @param {string} url
   * @param {Object} relationship
   * @return {firebase.firestore.CollectionReference|firebase.firestore.Query} Reference
   * @function
   * @private
   */
  buildHasManyCollectionRef(store, snapshot, url, relationship) {
    const db = this.firebase.firestore();
    const cardinality = snapshot.type.determineRelationshipType(relationship, store);
    let collectionRef;

    if (cardinality === 'manyToOne') {
      const inverse = snapshot.type.inverseFor(relationship.key, store);
      const collectionName = buildCollectionName(snapshot.modelName);
      const reference = db.collection(collectionName).doc(snapshot.id);

      collectionRef = db.collection(url).where(inverse.name, '==', reference);
    } else if (Object.prototype.hasOwnProperty.call(relationship.options, 'buildReference')) {
      collectionRef = relationship.options.buildReference(db, snapshot.record);
    } else {
      collectionRef = buildRefFromPath(db, url);
    }

    return this.buildQuery(collectionRef, relationship.options, snapshot.record);
  },

  /**
   * @param {DS.Store} store
   * @param {Object} relationship
   * @param {firebase.firestore.QuerySnapshot} querySnapshot
   * @return {Array} Has many record requests
   * @function
   * @private
   */
  findHasManyRecords(store, relationship, querySnapshot) {
    return querySnapshot.docs.map((docSnapshot) => {
      const type = { modelName: relationship.type };
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        return this.findRecord(store, type, referenceTo.id, {
          adapterOptions: {
            buildReference() {
              return referenceTo.parent;
            },
          },
        });
      }

      return this.findRecord(store, type, docSnapshot.id);
    });
  },
});
