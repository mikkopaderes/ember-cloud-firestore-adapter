/*
  eslint
  ember/use-ember-data-rfc-395-imports: off,
  ember/no-ember-super-in-es-classes: off
*/

import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import Adapter from '@ember-data/adapter';
import DS from 'ember-data';
import RSVP from 'rsvp';
import Store from '@ember-data/store';

import FirebaseService from 'ember-firebase-service/services/firebase';
import firebase from 'firebase/app';

import RealtimeTracker from 'ember-cloud-firestore-adapter/-private/realtime-tracker';
import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

interface ModelClass {
  modelName: string;
}

interface AdapterOption {
  isRealtime?: boolean;
  queryId?: string;

  buildReference?(db: firebase.firestore.Firestore): firebase.firestore.CollectionReference;
  filter?(db: firebase.firestore.CollectionReference): firebase.firestore.Query;
  include?(batch: firebase.firestore.WriteBatch, db: firebase.firestore.Firestore): void;
}

interface Snapshot extends DS.Snapshot {
  adapterOptions: AdapterOption;
}

interface SnapshotRecordArray extends DS.SnapshotRecordArray<string | number> {
  adapterOptions: AdapterOption;
}

interface BelongsToRelationshipMeta {
  type: string;
  options: { isRealtime?: boolean };
}

interface HasManyRelationshipMeta {
  key: string;
  type: string;
  options: {
    isRealtime?: boolean,

    buildReference?(
      db: firebase.firestore.Firestore,
      record: unknown,
    ): firebase.firestore.CollectionReference,
    filter?(
      db: firebase.firestore.CollectionReference | firebase.firestore.Query,
      record: unknown,
    ): firebase.firestore.Query,
  };
}

export default class CloudFirestoreAdapter extends Adapter {
  @service
  private firebase!: FirebaseService;

  private referenceKeyName = 'referenceTo';

  private realtimeTracker: RealtimeTracker | null = null;

  private get isFastBoot(): boolean {
    const fastboot = getOwner(this).lookup('service:fastboot');

    return fastboot && fastboot.isFastBoot;
  }

  public init(...args: unknown[]): void {
    this._super(...args);

    this.realtimeTracker = new RealtimeTracker(getOwner(this).lookup('service:store'));
  }

  public generateIdForRecord(_store: Store, type: string): string {
    const db = this.firebase.firestore();
    const collectionName = buildCollectionName(type);

    return db.collection(collectionName).doc().id;
  }

  public createRecord(
    store: Store,
    type: ModelClass,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return this.updateRecord(store, type, snapshot);
  }

  public updateRecord(
    _store: Store,
    type: ModelClass,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve) => {
      const docRef = this.buildCollectionRef(
        type.modelName,
        snapshot.adapterOptions,
      ).doc(snapshot.id);
      const batch = this.buildWriteBatch(docRef, snapshot);

      await batch.commit();

      if (snapshot.adapterOptions?.isRealtime && !this.isFastBoot) {
        const record = await this.fetchRecord(type, snapshot.id, snapshot.adapterOptions);

        resolve(record);
      } else {
        const data = this.serialize(snapshot, { includeId: true });

        resolve(data);
      }
    });
  }

  public deleteRecord(
    _store: Store,
    type: ModelClass,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve) => {
      const db = this.firebase.firestore();
      const docRef = this.buildCollectionRef(
        type.modelName,
        snapshot.adapterOptions,
      ).doc(snapshot.id);
      const batch = db.batch();

      batch.delete(docRef);
      this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

      await batch.commit();
      resolve();
    });
  }

  public findRecord(
    _store: Store,
    type: ModelClass,
    id: string,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return this.fetchRecord(type, id, snapshot.adapterOptions);
  }

  public findAll(
    _store: Store,
    type: ModelClass,
    _sinceToken: string,
    snapshotRecordArray?: SnapshotRecordArray,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const db = this.firebase.firestore();
      const collectionRef = db.collection(buildCollectionName(type.modelName));
      const unsubscribe = collectionRef.onSnapshot(async (querySnapshot) => {
        if (snapshotRecordArray?.adapterOptions?.isRealtime && !this.isFastBoot) {
          this.realtimeTracker?.trackFindAllChanges(type.modelName, collectionRef);
        }

        const requests = querySnapshot.docs.map((docSnapshot) => (
          this.fetchRecord(type, docSnapshot.id, snapshotRecordArray?.adapterOptions)
        ));

        try {
          resolve(await RSVP.Promise.all(requests));
        } catch (error) {
          reject(error);
        }

        unsubscribe();
      }, (error) => reject(error));
    });
  }

  public findBelongsTo(
    _store: Store,
    _snapshot: Snapshot,
    url: string,
    relationship: BelongsToRelationshipMeta,
  ): RSVP.Promise<unknown> {
    const type = { modelName: relationship.type };
    const urlNodes = url.split('/');
    const id = urlNodes[urlNodes.length - 1];

    urlNodes.pop();

    return this.fetchRecord(type, id, {
      isRealtime: relationship.options.isRealtime,

      buildReference(db: firebase.firestore.Firestore) {
        return db.collection(urlNodes.join('/'));
      },
    });
  }

  public findHasMany(
    store: Store,
    snapshot: Snapshot,
    url: string,
    relationship: HasManyRelationshipMeta,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildHasManyCollectionRef(store, snapshot, url, relationship);
      const unsubscribe = collectionRef.onSnapshot(async (querySnapshot) => {
        if (relationship.options.isRealtime && !this.isFastBoot) {
          this.realtimeTracker?.trackFindHasManyChanges(
            snapshot.modelName,
            snapshot.id,
            relationship.key,
            collectionRef,
          );
        }

        const requests = this.findHasManyRecords(relationship, querySnapshot);

        try {
          resolve(await RSVP.Promise.all(requests));
        } catch (error) {
          reject(error);
        }

        unsubscribe();
      }, (error) => reject(error));
    });
  }

  public query(
    _store: Store,
    type: ModelClass,
    query: AdapterOption,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef(type.modelName, query);
      const firestoreQuery = query.filter?.(collectionRef) || collectionRef
      const unsubscribe = firestoreQuery.onSnapshot(async (querySnapshot) => {
        if (query.isRealtime && !this.isFastBoot) {
          this.realtimeTracker?.trackQueryChanges(firestoreQuery, recordArray, query.queryId);
        }

        const requests = this.findQueryRecords(type, query, querySnapshot);

        try {
          resolve(await RSVP.Promise.all(requests));
        } catch (error) {
          reject(error);
        }

        unsubscribe();
      }, (error) => reject(error));
    });
  }

  private buildCollectionRef(
    modelName: string,
    adapterOptions?: AdapterOption,
  ): firebase.firestore.CollectionReference {
    const db = this.firebase.firestore();

    return adapterOptions?.buildReference?.(db) || db.collection(buildCollectionName(modelName));
  }

  private fetchRecord(
    type: ModelClass,
    id: string,
    adapterOption?: AdapterOption,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const docRef = this.buildCollectionRef(type.modelName, adapterOption).doc(id);
      const unsubscribe = docRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          if (adapterOption?.isRealtime && !this.isFastBoot) {
            this.realtimeTracker?.trackFindRecordChanges(type.modelName, docRef);
          }

          resolve(flattenDocSnapshot(docSnapshot));
        } else {
          reject(new Error(`Record ${id} for model type ${type.modelName} doesn't exist`));
        }

        unsubscribe();
      }, (error) => reject(error));
    });
  }

  private addDocRefToWriteBatch(
    batch: firebase.firestore.WriteBatch,
    docRef: firebase.firestore.DocumentReference,
    snapshot: Snapshot,
  ): void {
    const data = this.serialize(snapshot, {});

    batch.set(docRef, data, { merge: true });
  }

  private addIncludeToWriteBatch(
    batch: firebase.firestore.WriteBatch,
    adapterOptions?: AdapterOption,
  ): void {
    const db = this.firebase.firestore();

    adapterOptions?.include?.(batch, db);
  }

  private buildWriteBatch(
    docRef: firebase.firestore.DocumentReference,
    snapshot: Snapshot,
  ): firebase.firestore.WriteBatch {
    const db = this.firebase.firestore();
    const batch = db.batch();

    this.addDocRefToWriteBatch(batch, docRef, snapshot);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch;
  }

  private buildHasManyCollectionRef(
    store: Store,
    snapshot: Snapshot,
    url: string,
    relationship: HasManyRelationshipMeta,
  ): firebase.firestore.CollectionReference | firebase.firestore.Query {
    const db = this.firebase.firestore();
    const cardinality = snapshot.type.determineRelationshipType(relationship, store);

    if (cardinality === 'manyToOne') {
      const inverse = snapshot.type.inverseFor(relationship.key, store);
      const collectionName = buildCollectionName(snapshot.modelName);
      const parentDocRef = db.doc(`${collectionName}/${snapshot.id}`);
      const collectionRef = db.collection(url).where(inverse.name, '==', parentDocRef);

      return relationship.options.filter?.(collectionRef, snapshot.record) || collectionRef;
    } if (relationship.options.buildReference) {
      const collectionRef = relationship.options.buildReference(db, snapshot.record);

      return relationship.options.filter?.(collectionRef, snapshot.record) || collectionRef;
    }

    const collectionRef = db.collection(url);

    return relationship.options.filter?.(collectionRef, snapshot.record) || collectionRef;
  }

  private findHasManyRecords(
    relationship: HasManyRelationshipMeta,
    querySnapshot: firebase.firestore.QuerySnapshot,
  ): RSVP.Promise<unknown>[] {
    return querySnapshot.docs.map((docSnapshot) => {
      const type = { modelName: relationship.type };
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        return this.fetchRecord(type, referenceTo.id, {
          isRealtime: relationship.options.isRealtime,

          buildReference(db: firebase.firestore.Firestore) {
            return db.collection(referenceTo.parent.path);
          },
        });
      }

      const adapterOptions = {
        isRealtime: relationship.options.isRealtime,

        buildReference(db: firebase.firestore.Firestore) {
          return db.collection(docSnapshot.ref.parent.path);
        },
      };

      return this.fetchRecord(type, docSnapshot.id, adapterOptions);
    });
  }

  private findQueryRecords(
    type: ModelClass,
    option: AdapterOption,
    querySnapshot: firebase.firestore.QuerySnapshot,
  ): RSVP.Promise<unknown>[] {
    return querySnapshot.docs.map((docSnapshot) => {
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        const request = this.fetchRecord(type, referenceTo.id, {
          isRealtime: option.isRealtime,

          buildReference() {
            return referenceTo.parent;
          },
        });

        return request;
      }

      return this.fetchRecord(type, docSnapshot.id, {
        ...option,

        buildReference() {
          return docSnapshot.ref.parent;
        },
      });
    });
  }
}

declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    'cloud-firestore': CloudFirestoreAdapter;
  }
}
