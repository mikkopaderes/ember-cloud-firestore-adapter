import { Promise, all } from 'rsvp';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import RESTAdapter from 'ember-data/adapters/rest';
import { updatePaginationOfRelationship } from 'ember-cloud-firestore-adapter/utils/pagination';
import { buildCollectionName, buildRefFromPath, parseDocSnapshot } from 'ember-cloud-firestore-adapter/utils/parser';


/**
 * @class CloudFirestore
 * @namespace Adapter
 * @extends DS.RESTAdapter
 */
export default RESTAdapter.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: service(),

  /**
   * @type {string}
   * @readonly
   */
  dbType: 'cloud-firestore',

  /**
   * @override
   */
  defaultSerializer: 'cloud-firestore',

  /**
   * @type {Object}
   */
  firestoreSettings: {},

  /**
   * @override
   */
  headers: { 'Content-Type': 'application/json' },

  /**
   * @type {string}
   */
  referenceKeyName: 'cloudFirestoreReference',

  /**
   * @type {boolean}
   */
  willUnloadRecordOnListenError: true,

  /**
   * @override
   */
  init(...args) {
    this._super(...args);

    if (this.get('firestoreSettings')) {
      const db = this.get('firebase').firestore();

      db.settings(this.get('firestoreSettings'));
    }
  },

  buildCollectionName(modelName, relationship, snapshot) {
    return buildCollectionName(modelName);
  },

  /**
   * @override
   */
  generateIdForRecord(store, type, context) {
    const db = this.get('firebase').firestore();
    const collectionName = this.buildCollectionName(type, context);

    return db.collection(collectionName).doc().id;
  },

  /**
   * @override
   */
  createRecord(store, type, snapshot) {
    const config = getOwner(this).resolveRegistration('config:environment');
    let onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    // TODO: Figure out a better way to solve this
    if (onServer && config.environment === 'test') {
      // Force to false so we could mock our tests
      snapshot.adapterOptions.onServer = false;
      onServer = false;
    }

    if (onServer) {
      return this._super(store, type, snapshot).then(() => (
        this.findRecord(store, type, snapshot.id, snapshot)
      ));
    }

    if (snapshot.adapterOptions) {
      snapshot.adapterOptions.isCreate = true;
    } else {
      snapshot.adapterOptions = { isCreate: true };
    }

    return this.updateRecord(store, type, snapshot);
  },

  /**
   * @override
   */
  updateRecord(store, type, snapshot) {
    const config = getOwner(this).resolveRegistration('config:environment');
    let onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    // TODO: Figure out a better way to solve this
    if (onServer && config.environment === 'test') {
      // Force to false so we could mock our tests
      snapshot.adapterOptions.onServer = false;
      onServer = false;
    }

    if (onServer) {
      return this._super(store, type, snapshot);
    }

    return new Promise((resolve, reject) => {
      const docRef = this.buildUpdateRecordDocRef(type, snapshot);
      const batch = this.buildWriteBatch(type, snapshot, docRef, false);

      const batches = {
        queue: [],

        commit() {
          const { queue } = this;
          if (!queue.length) return null;
          if (queue.length === 1) return queue[0].commit();
          return all(queue.map(b => b.commit()));
        },

        push(b) {
          this.queue.push(b);
        },
      };

      if (batch._mutations && batch._mutations.length >= 500) {
        const db = this.get('firebase').firestore();
        while (batch._mutations.length > 0) {
          const splitBatch = db.batch();
          const mutations = batch._mutations.splice(0, 500);
          splitBatch._mutations = mutations;
          batches.push(splitBatch);
        }
      } else {
        batches.push(batch);
      }

      batches.commit().then(() => {
        // Only relevant when used by `createRecord()` as this will
        // setup realtime changes to the newly created record.
        // On `updateRecord()`, this basically does nothing as
        // `onSnapshot()` will resolve to the cached record and
        // `listenForDocChanges()` will do nothing since there's
        // already a listener for the record to be updated.
        const unsubscribe = docRef.onSnapshot((docSnapshot) => {
          store.listenForDocChanges(type, docRef);
          run(null, resolve, parseDocSnapshot(type, docSnapshot));
          unsubscribe();
        });
      }).catch(error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  deleteRecord(store, type, snapshot) {
    const config = getOwner(this).resolveRegistration('config:environment');
    let onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    // TODO: Figure out a better way to solve this
    if (onServer && config.environment === 'test') {
      // Force to false so we could mock our tests
      snapshot.adapterOptions.onServer = false;
      onServer = false;
    }

    if (onServer) {
      return this._super(store, type, snapshot);
    }

    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      const docRef = this.buildUpdateRecordDocRef(type, snapshot); //db.collection(buildCollectionName(type.modelName)).doc(snapshot.id);
      const batch = this.buildWriteBatch(type, snapshot, docRef, true);

      batch.commit().then(() => run(null, resolve)).catch(error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  findAll(store, type) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      const collectionName = this.buildCollectionName(type.modelName);
      const collectionRef = db.collection(collectionName);
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        store.listenForCollectionChanges(collectionRef);

        const requests = querySnapshot.docs.map(docSnapshot => (
          this.findRecord(store, type, docSnapshot.id)
        ));

        Promise.all(requests).then((responses) => {
          run(null, resolve, responses);
          unsubscribe();
        }).catch(error => run(null, reject, error));
      }, error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  findRecord(store, type, id, snapshot = {}) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();

      let docRef =  snapshot._internalModel &&
                    snapshot._internalModel.getAttributeValue('docRef') ||
                    snapshot.adapterOptions &&
                    snapshot.adapterOptions.docRef ||
                    snapshot.adapterOptions &&
                    snapshot.adapterOptions.buildReference &&
                    this.buildCollectionRef(type.modelName, snapshot.adapterOptions, db).doc(id);

      if (!docRef) {
        const collectionName = this.buildCollectionName(type.modelName, snapshot);
        docRef = db.collection(collectionName).doc(id);
      }

      const unsubscribe = docRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          store.listenForDocChanges(type, docRef);
          run(null, resolve, parseDocSnapshot(type, docSnapshot));
        } else if (docSnapshot.metadata && docSnapshot.metadata.fromCache) {
          run(null, reject, new Error('Connection to Firestore unavailable'));
        } else {
          run(null, reject, new Error('Document doesn\'t exist'));
        }

        unsubscribe();
      }, error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  findBelongsTo(store, snapshot, url, relationship) {
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
  findHasMany(store, snapshot, url, relationship) {
    return new Promise((resolve, reject) => {
      const collectionRef = this.buildHasManyCollectionRef(store, snapshot, url, relationship);
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        const requests = this.findHasManyRecords(store, relationship, querySnapshot);

        Promise.all(requests).then((responses) => {
          updatePaginationOfRelationship(snapshot, relationship, responses);
          responses.map(payload => this._injectCollectionRef(payload, url));

          store.listenForHasManyChanges(
            snapshot.modelName,
            snapshot.id,
            relationship,
            collectionRef,
          );

          run(null, resolve, responses);
          unsubscribe();
        }).catch(error => run(null, reject, error));
      }, error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  query(store, type, option = {}) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      let collectionRef = this.buildCollectionRef(type.modelName, option, db);

      collectionRef = this.buildQuery(collectionRef, option);

      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        const requests = this.findQueryRecords(
          store,
          type,
          option,
          querySnapshot,
        );

        Promise.all(requests).then((responses) => {
          if (option.queryId) {
            store.listenForQueryChanges(type.modelName, option, collectionRef);
          }

          run(null, resolve, responses);
          unsubscribe();
        }).catch(error => run(null, reject, error));
      }, error => run(null, reject, error));
    });
  },

  /**
   * @override
   */
  methodForRequest(params) {
    const method = this._super(params);

    if (method === 'PUT') {
      return 'PATCH';
    }

    return method;
  },

  /**
   * @override
   */
  shouldBackgroundReloadRecord() {
    return false;
  },

  /**
   * @param {string} modelName
   * @param {Object} [option={}]
   * @param {firebase.firestore} db
   * @return {firebase.firestore.CollectionReference} Collection reference
   * @function
   * @private
   */
  buildCollectionRef(modelName, option = {}, db) {
    if (Object.prototype.hasOwnProperty.call(option, 'buildReference')) {
      return option.buildReference(db);
    } else if (option.collectionPath) {
      return db.collection(option.collectionPath);
    }

    return db.collection(this.buildCollectionName(modelName));
  },

  /**
   * @param {DS.Store} store
   * @param {Object} snapshot
   * @param {string} url
   * @param {Object} relationship
   * @return {firebase.firestore.CollectionReference|firebase.firestore.Query} Reference
   * @function
   * @private
   */
  buildHasManyCollectionRef(store, snapshot, url, relationship) {
    const db = this.get('firebase').firestore();
    const cardinality = snapshot.type.determineRelationshipType(relationship, store);
    let collectionRef;

    if (cardinality === 'manyToOne') {
      const path = this.buildCollectionName(relationship.type, snapshot, relationship.meta);
      const inverseRelationship = snapshot.type.inverseFor(relationship.key, store);
      const referencePath = this.buildCollectionName(snapshot.modelName, snapshot, inverseRelationship);
      const reference = db.collection(referencePath).doc(snapshot.id);
      const { filterByInverse } = relationship.options;

      if (!inverseRelationship || !filterByInverse) {
        collectionRef = buildRefFromPath(db, path);
      } else {
        collectionRef = db.collection(path).where(inverseRelationship.name, '==', reference);
      }
    } else if (Object.prototype.hasOwnProperty.call(relationship.options, 'buildReference')) {
      collectionRef = relationship.options.buildReference(db, snapshot.record);
    } else {
      const path = this.buildCollectionName(relationship.type, snapshot, relationship.meta);
      collectionRef = buildRefFromPath(db, path);
    }

    return this.buildQuery(collectionRef, relationship.options, snapshot.record);
  },

  /**
   * @param {DS.Model} type
   * @param {Object} snapshot
   * @return {firebase.firestore.DocumentReference} Document reference
   * @function
   * @private
   */
  buildUpdateRecordDocRef(type, snapshot) {
    const isCreate = this.getAdapterOptionAttribute(snapshot, 'isCreate');

    return this.buildCollectionRef(
      type.modelName,
      snapshot.adapterOptions,
      this.get('firebase').firestore(),
    ).doc(snapshot.id);
  },

  /**
   * @param {DS.Model} type
   * @param {Object} snapshot
   * @param {firebase.firestore.DocumentReference} docRef
   * @param {boolean} isDeletingMainDoc
   * @return {firebase.firestore.WriteBatch} Write batch
   * @function
   * @private
   */
  buildWriteBatch(type, snapshot, docRef, isDeletingMainDoc) {
    const db = this.get('firebase').firestore();
    const payload = this.serialize(snapshot);
    const batch = db.batch();

    if (isDeletingMainDoc) {
      batch.delete(docRef);
    } else {
      batch.set(docRef, payload, { merge: true });
    }

    this.addIncludesToBatch(batch, db, snapshot);

    return batch;
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
    let newRef = collectionRef;

    if (Object.prototype.hasOwnProperty.call(option, 'filter')) {
      newRef = option.filter(collectionRef, record);
    }

    if (Object.prototype.hasOwnProperty.call(option, 'limit')) {
      newRef = newRef.limit(option.limit);
    }

    return newRef;
  },

  /**
   * @param {firebase.firestore.WriteBatch} batch
   * @param {firebase.firestore} db
   * @param {Object} snapshot
   * @function
   * @private
   */
  addIncludesToBatch(batch, db, snapshot) {
    const meta = this.getAdapterOptionAttribute(snapshot, 'meta');
    const include = this.getAdapterOptionAttribute(snapshot, 'include');

    if (include) {
      include(batch, db, meta);
    }
  },

  /**
   * @param {DS.Store} store
   * @param {Object} relationship
   * @param {firebase.firestore.QuerySnapshot} querySnapshot
   */
  findHasManyRecords(store, relationship, querySnapshot) {
    return querySnapshot.docs.map((docSnapshot) => {
      const type = { modelName: relationship.type };
      const referenceTo = docSnapshot.get(this.get('referenceKeyName')) || docSnapshot.ref;

      if (referenceTo && referenceTo.firestore) {
        const request = this.findRecord(store, type, referenceTo.id, {
          adapterOptions: {
            buildReference() {
              return referenceTo.parent;
            },
          },
        });

        return request;
      }

      const request = this.findRecord(store, type, docSnapshot.id);

      return request;
    });
  },

  /**
   * @param {DS.Store} store
   * @param {DS.Model} type
   * @param {Object} option
   * @param {firebase.firestore.QuerySnapshot} querySnapshot
   * @return {Array.<Promise>} Find record promises
   * @function
   * @private
   */
  findQueryRecords(store, type, option, querySnapshot) {
    return querySnapshot.docs.map((docSnapshot) => {
      const referenceTo = docSnapshot.get(this.get('referenceKeyName')) || docSnapshot.ref;

      if (referenceTo && referenceTo.firestore) {
        const request = this.findRecord(store, type, referenceTo.id, {
          adapterOptions: {
            buildReference() {
              return referenceTo.parent;
            },
          },
        });

        return request;
      }

      return this.findRecord(store, type, docSnapshot.id, { adapterOptions: option });
    });
  },

  /**
   * @param {Object} snapshot
   * @param {string} key
   * @return {*} Attribute value
   * @function
   * @private
   */
  getAdapterOptionAttribute(snapshot, key) {
    if (
      snapshot.adapterOptions
      && Object.prototype.hasOwnProperty.call(snapshot.adapterOptions, key)
    ) {
      return snapshot.adapterOptions[key];
    }

    return null;
  }
});
