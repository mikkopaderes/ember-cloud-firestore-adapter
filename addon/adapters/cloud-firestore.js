import { Promise } from 'rsvp';
import { getOwner } from '@ember/application';
import { inject } from '@ember/service';
import { run } from '@ember/runloop';
import RESTAdapter from 'ember-data/adapters/rest';

import {
  buildCollectionName,
  buildRefFromPath,
  parseDocSnapshot,
} from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * @class CloudFirestore
 * @namespace Adapter
 * @extends DS.RESTAdapter
 */
export default RESTAdapter.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: inject(),

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
   * @override
   */
  headers: { 'Content-Type': 'application/json' },

  /**
   * @type {boolean}
   */
  willUnloadRecordOnListenError: true,

  /**
   * @override
   */
  generateIdForRecord(store, type) {
    const db = this.get('firebase').firestore();
    const collectionName = buildCollectionName(type);

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
      return this._super(store, type, snapshot).then(() => {
        return this.findRecord(store, type, snapshot.id, snapshot);
      });
    } else {
      if (snapshot.adapterOptions) {
        snapshot.adapterOptions.isCreate = true;
      } else {
        snapshot.adapterOptions = { isCreate: true };
      }

      return this.updateRecord(store, type, snapshot);
    }
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
    } else {
      return new Promise((resolve, reject) => {
        const docRef = this.buildUpdateRecordDocRef(type, snapshot);
        const batch = this.buildWriteBatch(type, snapshot, docRef, false);

        batch.commit().then(() => {
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
        }).catch((error) => {
          run(null, reject, error);
        });
      });
    }
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
    } else {
      return new Promise((resolve, reject) => {
        const db = this.get('firebase').firestore();
        const docRef = db
          .collection(buildCollectionName(type.modelName))
          .doc(snapshot.id);
        const batch = this.buildWriteBatch(type, snapshot, docRef, true);

        batch.commit().then(() => {
          run(null, resolve);
        }).catch((error) => {
          run(null, reject, error);
        });
      });
    }
  },

  /**
   * @override
   */
  findAll(store, type) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      const collectionName = buildCollectionName(type.modelName);
      const collectionRef = db.collection(collectionName);
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        store.listenForCollectionChanges(collectionRef);

        const requests = [];

        querySnapshot.forEach((docSnapshot) => {
          const request = this.findRecord(store, type, docSnapshot.id);

          requests.push(request);
        });

        Promise.all(requests).then((responses) => {
          const docs = [];

          responses.forEach((doc) => {
            docs.push(doc);
          });

          run(null, resolve, docs);
          unsubscribe();
        }).catch((error) => {
          run(null, reject, error);
        });
      }, (error) => {
        run(null, reject, error);
      });
    });
  },

  /**
   * @override
   */
  findRecord(store, type, id, snapshot = {}) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      const collectionRef = this.buildCollectionRef(
        type.modelName,
        snapshot.adapterOptions,
        db,
      );
      const docRef = collectionRef.doc(id);
      const unsubscribe = docRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          store.listenForDocChanges(type, docRef);
          run(null, resolve, parseDocSnapshot(type, docSnapshot));
        } else {
          run(null, reject, new Error('Document doesn\'t exist'));
        }

        unsubscribe();
      }, (error) => {
        run(null, reject, error);
      });
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
      const collectionRef = this.buildHasManyCollectionRef(
        store,
        snapshot,
        url,
        relationship,
      );
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        const requests = [];

        querySnapshot.forEach((docSnapshot) => {
          const type = { modelName: relationship.type };

          if (docSnapshot.get('cloudFirestoreReference')) {
            const docRef = docSnapshot.get('cloudFirestoreReference');
            const docId = docRef.id;
            const request = this.findRecord(store, type, docId, {
              adapterOptions: {
                buildReference() {
                  return docRef.parent;
                },
              },
            });

            requests.push(request);
          } else {
            const request = this.findRecord(store, type, docSnapshot.id);

            requests.push(request);
          }
        });

        Promise.all(requests).then((responses) => {
          store.listenForHasManyChanges(
            snapshot.modelName,
            snapshot.id,
            relationship.key,
            collectionRef,
          );

          run(null, resolve, responses);
          unsubscribe();
        }).catch((error) => {
          run(null, reject, error);
        });
      }, (error) => {
        run(null, reject, error);
      });
    });
  },

  /**
   * @override
   */
  query(store, type, query = {}) {
    return new Promise((resolve, reject) => {
      const db = this.get('firebase').firestore();
      let collectionRef = this.buildCollectionRef(type.modelName, query, db);

      collectionRef = this.buildQuery(collectionRef, query);

      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        const requests = this.findQuerySnapshotRecords(
          store,
          type,
          query,
          querySnapshot,
        );

        Promise.all(requests).then((responses) => {
          if (query.queryId) {
            store.listenForQueryChanges(type.modelName, query, collectionRef);
          }

          const docs = [];

          responses.forEach((doc) => {
            docs.push(doc);
          });

          run(null, resolve, docs);
          unsubscribe();
        }).catch((error) => {
          run(null, reject, error);
        });
      }, (error) => {
        run(null, reject, error);
      });
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
   * Builds a reference to a collection
   *
   * @param {string} modelName
   * @param {Object} [option={}]
   * @param {firebase.firestore} db
   * @return {firebase.firestore.CollectionReference} Collection reference
   * @private
   */
  buildCollectionRef(modelName, option = {}, db) {
    if (option.hasOwnProperty('buildReference')) {
      return option.buildReference(db);
    }

    return db.collection(buildCollectionName(modelName));
  },

  /**
   * @param {DS.Store} store
   * @param {Object} snapshot
   * @param {string} url
   * @param {Object} relationship
   * @return {firebase.firestore.CollectionReference|firebase.firestore.Query} Reference
   */
  buildHasManyCollectionRef(store, snapshot, url, relationship) {
    const db = this.get('firebase').firestore();
    const cardinality = snapshot.type.determineRelationshipType(
      relationship,
      store,
    );
    let collectionRef;

    if (cardinality === 'manyToOne') {
      const inverse = snapshot.type.inverseFor(relationship.key, store);
      const collectionName = buildCollectionName(snapshot.modelName);
      const reference = db.collection(collectionName).doc(snapshot.id);

      collectionRef = db.collection(url).where(inverse.name, '==', reference);
    } else {
      if (relationship.options.hasOwnProperty('buildReference')) {
        collectionRef = relationship.options.buildReference(db);
      } else {
        collectionRef = buildRefFromPath(db, url);
      }
    }

    return this.buildQuery(
      collectionRef,
      relationship.options,
      snapshot.record,
    );
  },

  /**
   * Builds a document reference for `updateRecord()`
   *
   * @param {DS.Model} type
   * @param {Object} snapshot
   * @return {firebase.firestore.DocumentReference} Document reference
   * @private
   */
  buildUpdateRecordDocRef(type, snapshot) {
    const isCreate = this.getAdapterOptionAttribute(snapshot, 'isCreate');

    if (!isCreate) {
      if (this.getAdapterOptionAttribute(snapshot, 'buildReference')) {
        delete snapshot.adapterOptions.buildReference;
      }
    }

    return this.buildCollectionRef(
      type.modelName,
      snapshot.adapterOptions,
      this.get('firebase').firestore(),
    ).doc(snapshot.id);
  },

  /**
   * Builds a write batch for `updateRecord()`
   *
   * @param {DS.Model} type
   * @param {Object} snapshot
   * @param {firebase.firestore.DocumentReference} docRef
   * @param {boolean} isDeletingMainDoc
   * @return {firebase.firestore.WriteBatch} Write batch
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
   * Builds a query for a collection reference
   *
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {Object} [option={}]
   * @param {Model.<*>} [record]
   * @return {firebase.firestore.Query} Query
   * @private
   */
  buildQuery(collectionRef, option = {}, record) {
    if (option.hasOwnProperty('filter')) {
      return option.filter(collectionRef, record);
    }

    return collectionRef;
  },

  /**
   * Adds snapshot.adapterOptions.include to batch if any
   *
   * @param {firebase.firestore.WriteBatch} batch
   * @param {firebase.firestore} db
   * @param {Object} snapshot
   * @private
   */
  addIncludesToBatch(batch, db, snapshot) {
    const include = this.getAdapterOptionAttribute(snapshot, 'include');

    if (include) {
      include(batch, db);
    }
  },

  /**
   * Finds all records returned by a query snapshot
   *
   * @param {DS.Store} store
   * @param {DS.Model} type
   * @param {Object} query
   * @param {firebase.firestore.QuerySnapshot} querySnapshot
   * @return {Array.<Promise>} Find record promises
   * @private
   */
  findQuerySnapshotRecords(store, type, query, querySnapshot) {
    const requests = [];

    querySnapshot.forEach((docSnapshot) => {
      const referenceTo = docSnapshot.get('cloudFirestoreTo');

      if (referenceTo && referenceTo.firestore) {
        const docId = referenceTo.id;
        const collectionRef = referenceTo.parent;
        const request = this.findRecord(store, type, docId, {
          adapterOptions: {
            buildReference() {
              return collectionRef;
            },
          },
        });

        requests.push(request);
      } else {
        const request = this.findRecord(store, type, docSnapshot.id, {
          adapterOptions: query,
        });

        requests.push(request);
      }
    });

    return requests;
  },

  /**
   * Returns an attribute from the snapshot adapter options if it exists
   *
   * @param {Object} snapshot
   * @param {string} key
   * @return {*} Attribute value
   * @private
   */
  getAdapterOptionAttribute(snapshot, key) {
    if (
      snapshot.adapterOptions
      && snapshot.adapterOptions.hasOwnProperty(key)
    ) {
      return snapshot['adapterOptions'][key];
    }

    return null;
  },
});
