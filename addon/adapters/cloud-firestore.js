import { assign } from '@ember/polyfills';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import Adapter from '@ember-data/adapter';

import {
  buildCollectionName,
  buildRefFromPath,
  flattenDocSnapshotData,
} from 'ember-cloud-firestore-adapter/utils/parser';
import RealtimeTracker from 'ember-cloud-firestore-adapter/utils/realtime-tracker';

export default class CloudFirestoreAdapter extends Adapter {
  @service firebase;

  get isFasboot() {
    const fastboot = getOwner(this).lookup('service:fastboot');

    return fastboot && fastboot.isFastBoot;
  }

  constructor(...args) {
    super(...args);

    if (this.firestoreSettings) {
      const db = this.firebase.firestore();

      db.settings(this.firestoreSettings);
    }

    if (this.useEmulator) {
      const db = this.firebase.firestore();
      const { host, port } = this.emulatorSettings || { host: 'localhost', port: 8080 };

      if (db.useEmulator) {
        db.useEmulator(host, Number(port));
      }
    }

    if (!this.referenceKeyName) {
      this.referenceKeyName = 'referenceTo';
    }

    this.realtimeTracker = new RealtimeTracker();
  }

  generateIdForRecord(store, type) {
    const db = this.firebase.firestore();
    const collectionName = buildCollectionName(type);

    return db.collection(collectionName).doc().id;
  }

  async createRecord(...args) {
    return this.updateRecord(...args);
  }

  async updateRecord(store, type, snapshot) {
    const docRef = this.buildCollectionRef(type, snapshot.adapterOptions).doc(snapshot.id);
    const batch = this.buildWriteBatch(docRef, snapshot);

    await batch.commit();

    if (this.getAdapterOptionConfig(snapshot, 'isRealtime') && !this.isFastBoot) {
      return this.findRecord(store, type, snapshot.id, snapshot);
    }

    const data = this.serialize(snapshot, { includeId: true });

    return data;
  }

  async deleteRecord(store, type, snapshot) {
    const db = this.firebase.firestore();
    const docRef = this.buildCollectionRef(type, snapshot.adapterOptions).doc(snapshot.id);
    const batch = db.batch();

    batch.delete(docRef);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch.commit();
  }

  async findRecord(store, type, id, snapshot = {}) {
    return new Promise((resolve, reject) => {
      const docRef = this.buildCollectionRef(type, snapshot.adapterOptions).doc(id);
      const unsubscribe = docRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          if (this.getAdapterOptionConfig(snapshot, 'isRealtime') && !this.isFastBoot) {
            this.realtimeTracker.trackFindRecordChanges(type.modelName, docRef, store);
          }

          resolve(flattenDocSnapshotData(docSnapshot));
        } else {
          reject(new Error(`Record ${id} for model type ${type.modelName} doesn't exist`));
        }

        unsubscribe();
      }, (error) => reject(new Error(error.message)));
    });
  }

  async findAll(store, type, sinceToken, snapshotRecordArray) {
    return new Promise((resolve, reject) => {
      const db = this.firebase.firestore();
      const collectionRef = db.collection(buildCollectionName(type.modelName));
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        if (this.getAdapterOptionConfig(snapshotRecordArray, 'isRealtime') && !this.isFastBoot) {
          this.realtimeTracker.trackFindAllChanges(type.modelName, collectionRef, store);
        }

        const requests = querySnapshot.docs.map((docSnapshot) => (
          this.findRecord(store, type, docSnapshot.id, snapshotRecordArray)
        ));

        Promise.all(requests).then((records) => resolve(records)).catch((error) => (
          reject(new Error(error.message))
        ));

        unsubscribe();
      }, (error) => reject(new Error(error.message)));
    });
  }

  async findBelongsTo(store, snapshot, url, relationship) {
    const type = { modelName: relationship.type };
    const urlNodes = url.split('/');
    const id = urlNodes.pop();

    return this.findRecord(store, type, id, {
      adapterOptions: {
        isRealtime: relationship.options.isRealtime,

        buildReference(db) {
          return buildRefFromPath(db, urlNodes.join('/'));
        },
      },
    });
  }

  async findHasMany(store, snapshot, url, relationship) {
    return new Promise((resolve, reject) => {
      const collectionRef = this.buildHasManyCollectionRef(store, snapshot, url, relationship);
      const unsubscribe = collectionRef.onSnapshot((querySnapshot) => {
        if (relationship.options.isRealtime && !this.isFastBoot) {
          this.realtimeTracker.trackFindHasManyChanges(
            snapshot.modelName,
            snapshot.id,
            relationship,
            collectionRef,
            store,
          );
        }

        const requests = this.findHasManyRecords(store, relationship, querySnapshot);

        Promise.all(requests).then((records) => resolve(records)).catch((error) => (
          reject(new Error(error.message))
        ));

        unsubscribe();
      }, (error) => reject(new Error(error.message)));
    });
  }

  async query(store, type, query, recordArray) {
    return new Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef(type, query);
      const firestoreQuery = this.buildQuery(collectionRef, query);
      const unsubscribe = firestoreQuery.onSnapshot((querySnapshot) => {
        if (
          this.getAdapterOptionConfig({ adapterOptions: query }, 'isRealtime')
          && !this.isFastBoot
        ) {
          this.realtimeTracker.trackQueryChanges(firestoreQuery, recordArray, query.queryId);
        }

        const requests = this.findQueryRecords(store, type, query, querySnapshot);

        Promise.all(requests).then((records) => resolve(records)).catch((error) => (
          reject(new Error(error.message))
        ));

        unsubscribe();
      }, (error) => reject(new Error(error.message)));
    });
  }

  buildCollectionRef(type, adapterOptions = {}) {
    const db = this.firebase.firestore();

    if (Object.prototype.hasOwnProperty.call(adapterOptions, 'buildReference')) {
      return adapterOptions.buildReference(db);
    }

    return db.collection(buildCollectionName(type.modelName));
  }

  addDocRefToWriteBatch(batch, docRef, snapshot) {
    const data = this.serialize(snapshot);

    batch.set(docRef, data, { merge: true });
  }

  addIncludeToWriteBatch(batch, adapterOptions = {}) {
    const db = this.firebase.firestore();

    if (Object.prototype.hasOwnProperty.call(adapterOptions, 'include')) {
      adapterOptions.include(batch, db);
    }
  }

  buildWriteBatch(docRef, snapshot) {
    const db = this.firebase.firestore();
    const batch = db.batch();

    this.addDocRefToWriteBatch(batch, docRef, snapshot);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch;
  }

  buildQuery(collectionRef, option = {}, record) {
    if (Object.prototype.hasOwnProperty.call(option, 'filter')) {
      return option.filter(collectionRef, record);
    }

    return collectionRef;
  }

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
  }

  findHasManyRecords(store, relationship, querySnapshot) {
    return querySnapshot.docs.map((docSnapshot) => {
      const type = { modelName: relationship.type };
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        return this.findRecord(store, type, referenceTo.id, {
          adapterOptions: {
            isRealtime: relationship.options.isRealtime,

            buildReference() {
              return referenceTo.parent;
            },
          },
        });
      }

      const adapterOptions = assign({}, relationship.options, {
        buildReference() {
          return docSnapshot.ref.parent;
        },
      });

      return this.findRecord(store, type, docSnapshot.id, { adapterOptions });
    });
  }

  findQueryRecords(store, type, option, querySnapshot) {
    return querySnapshot.docs.map((docSnapshot) => {
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        const request = this.findRecord(store, type, referenceTo.id, {
          adapterOptions: {
            isRealtime: option.isRealtime,

            buildReference() {
              return referenceTo.parent;
            },
          },
        });

        return request;
      }

      const adapterOptions = assign({}, option, {
        buildReference() {
          return docSnapshot.ref.parent;
        },
      });

      return this.findRecord(store, type, docSnapshot.id, { adapterOptions });
    });
  }

  getAdapterOptionConfig(snapshot, prop) {
    try {
      return snapshot.adapterOptions[prop];
    } catch (error) {
      return null;
    }
  }
}
