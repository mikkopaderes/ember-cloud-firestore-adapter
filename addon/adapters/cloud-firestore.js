import { Promise } from 'rsvp';
import { camelize } from '@ember/string';
import { inject } from '@ember/service';
import { pluralize } from 'ember-inflector';
import { run } from '@ember/runloop';
import RESTAdapter from 'ember-data/adapters/rest';

import {
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
    const collectionName = this.buildCollectionName(type);

    return db.collection(collectionName).doc().id;
  },

  /**
   * @override
   */
  createRecord(store, type, snapshot) {
    const onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    if (onServer) {
      return this._super(store, type, snapshot).then(() => {
        return this.findRecord(store, type, snapshot.id, snapshot);
      });
    } else {
      return this.updateRecord(store, type, snapshot);
    }
  },

  /**
   * @override
   */
  updateRecord(store, type, snapshot) {
    const onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    if (onServer) {
      return this._super(store, type, snapshot);
    } else {
      return new Promise((resolve, reject) => {
        const db = this.get('firebase').firestore();
        const payloads = this.serialize(snapshot, { includeId: true });
        const batch = db.batch();
        const mainDocRef = this.buildBatchedWrites(
          store,
          type.modelName,
          payloads,
          batch,
        );

        batch.commit().then(() => {
          // Only relevant when used by `createRecord()` as this will
          // setup realtime changes to the newly created record.
          // On `updateRecord()`, this basically does nothing as
          // `onSnapshot()` will resolve to the cached record and
          // `listenForDocChanges()` will do nothing since there's
          // already a listener for the record to be updated.
          const unsubscribe = mainDocRef.onSnapshot((docSnapshot) => {
            store.listenForDocChanges(type, mainDocRef);
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
    const onServer = this.getAdapterOptionAttribute(snapshot, 'onServer');

    if (onServer) {
      return this._super(store, type, snapshot);
    } else {
      return new Promise((resolve, reject) => {
        const db = this.get('firebase').firestore();
        const payloads = this.serialize(snapshot, { includeId: true });

        payloads[0].data = null;

        const batch = db.batch();

        this.buildBatchedWrites(
          store,
          type.modelName,
          payloads,
          batch,
        );

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
      const collectionName = this.buildCollectionName(type.modelName);
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
      const db = this.get('firebase').firestore();
      const cardinality = snapshot.type.determineRelationshipType(
        relationship,
        store,
      );
      let collectionRef;

      if (cardinality === 'manyToOne') {
        const inverse = snapshot.type.inverseFor(relationship.key, store);
        const reference = snapshot.record.get('cloudFirestoreReference');

        collectionRef = db.collection(url).where(inverse.name, '==', reference);
      } else {
        collectionRef = buildRefFromPath(db, url);
      }

      collectionRef = this.buildQuery(collectionRef, relationship.options);

      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        const requests = [];

        querySnapshot.forEach((docSnapshot) => {
          const type = { modelName: relationship.type };

          if (cardinality === 'manyToOne') {
            const request = this.findRecord(store, type, docSnapshot.id);

            requests.push(request);
          } else {
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
          }
        });

        Promise.all(requests).then((responses) => {
          store.listenForHasManyChanges(
            snapshot.modelName,
            snapshot.id,
            relationship.key,
            collectionRef,
          );

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
   * Camelizes and pluralizes the model name
   *
   * @param {string} modelName
   * @return {string} Camelized and pluralized model name
   * @private
   */
  buildCollectionName(modelName) {
    return camelize(pluralize(modelName));
  },

  /**
   * Builds a reference to a collection
   *
   * @param {string} modelName
   * @param {Object} [option={}]
   * @param {firebase.firestore} db
   * @return {firebase.firestore.CollectionReference} Collection reference
   */
  buildCollectionRef(modelName, option = {}, db) {
    if (option.hasOwnProperty('buildReference')) {
      return option.buildReference(db);
    }

    return db.collection(pluralize(modelName));
  },

  /**
   * Builds a query for a collection reference
   *
   * @param {firebase.firestore.CollectionReference} collectionRef
   * @param {Object} [option={}]
   * @return {firebase.firestore.Query} Query
   */
  buildQuery(collectionRef, option = {}) {
    if (option.hasOwnProperty('filter')) {
      return option.filter(collectionRef);
    }

    return collectionRef;
  },

  /**
   * Builds a batched write
   *
   * @param {DS.Store} store
   * @param {string} modelName
   * @param {Array} payloads
   * @param {firebase.firestore.WriteBatch} batch
   * @return {firebase.firestore.DocumentReference} Doc ref of main payload
   */
  buildBatchedWrites(store, modelName, payloads, batch) {
    const db = this.get('firebase').firestore();
    let mainDocRef;

    payloads.forEach((payload, index) => {
      if (!payload.id) {
        payload.id = this.generateIdForRecord(store, modelName);
      }

      const path = `${payload.path}/${payload.id}`;
      const docRef = buildRefFromPath(db, path);

      if (index === 0) {
        mainDocRef = docRef;
      }

      if (payload.data !== null) {
        batch.set(docRef, payload.data, { merge: true });
      } else {
        batch.delete(docRef);
      }
    });

    return mainDocRef;
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

      if (referenceTo && referenceTo.hasOwnProperty('firestore')) {
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
      snapshot.adapterOptions &&
      snapshot.adapterOptions.hasOwnProperty(key)
    ) {
      return snapshot['adapterOptions'][key];
    }

    return null;
  },
});
