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

import {
  CollectionReference,
  DocumentReference,
  Query,
  WriteBatch,
} from 'firebase/firestore';
import firebase from 'firebase/compat/app';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import FirebaseService from 'ember-cloud-firestore-adapter/services/-firebase';
import FirestoreDataManager from 'ember-cloud-firestore-adapter/services/-firestore-data-manager';
import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

interface ModelClass {
  modelName: string;
}

interface AdapterOption {
  isRealtime?: boolean;
  queryId?: string;

  buildReference?(db: firebase.firestore.Firestore): CollectionReference;
  filter?(db: CollectionReference): Query;
  include?(batch: WriteBatch, db: firebase.firestore.Firestore): void;
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

    buildReference?(db: firebase.firestore.Firestore, record: unknown): CollectionReference,
    filter?(db: CollectionReference | Query, record: unknown): Query,
  };
}

export default class CloudFirestoreModularAdapter extends Adapter {
  @service('-firebase')
  protected declare firebase: FirebaseService;

  @service('-firestore-data-manager')
  private declare firestoreDataManager: FirestoreDataManager;

  protected referenceKeyName = 'referenceTo';

  private get isFastBoot(): boolean {
    const fastboot = getOwner(this).lookup('service:fastboot');

    return fastboot && fastboot.isFastBoot;
  }

  public generateIdForRecord(_store: Store, type: string): string {
    const db = this.firebase.firestore();
    const collectionName = buildCollectionName(type);

    return doc(collection(db, collectionName)).id;
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
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef(type.modelName, snapshot.adapterOptions);
      const docRef = doc(collectionRef, snapshot.id);
      const batch = this.buildWriteBatch(docRef, snapshot);

      batch.commit().then(() => {
        const data = this.serialize(snapshot, { includeId: true });

        resolve(data);

        if (snapshot.adapterOptions?.isRealtime && !this.isFastBoot) {
          // Setup realtime listener for record
          this.firestoreDataManager.findRecordRealtime(type.modelName, docRef);
        }
      }).catch((e) => {
        reject(e);
      });
    });
  }

  public deleteRecord(
    _store: Store,
    type: ModelClass,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const db = this.firebase.firestore();
      const collectionRef = this.buildCollectionRef(type.modelName, snapshot.adapterOptions);
      const docRef = doc(collectionRef, snapshot.id);
      const batch = writeBatch(db);

      batch.delete(docRef);
      this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

      batch.commit().then(() => {
        resolve();
      }).catch((e) => {
        reject(e);
      });
    });
  }

  public findRecord(
    _store: Store,
    type: ModelClass,
    id: string,
    snapshot: Snapshot,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const colRef = this.buildCollectionRef(type.modelName, snapshot.adapterOptions);
        const docRef = doc(colRef, id);
        const docSnapshot = snapshot.adapterOptions?.isRealtime && !this.isFastBoot
          ? await this.firestoreDataManager.findRecordRealtime(type.modelName, docRef)
          : await getDoc(docRef);

        if (docSnapshot.exists()) {
          resolve(flattenDocSnapshot(docSnapshot));
        } else {
          reject(new Error(`Record ${id} for model type ${type.modelName} doesn't exist`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public findAll(
    _store: Store,
    type: ModelClass,
    _sinceToken: string,
    snapshotRecordArray?: SnapshotRecordArray,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const db = this.firebase.firestore();
        const colRef = collection(db, buildCollectionName(type.modelName));
        const querySnapshot = snapshotRecordArray?.adapterOptions?.isRealtime && !this.isFastBoot
          ? await this.firestoreDataManager.findAllRealtime(type.modelName, colRef)
          : await getDocs(colRef);

        const result = querySnapshot.docs.map((docSnapshot) => flattenDocSnapshot(docSnapshot));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  public query(
    _store: Store,
    type: ModelClass,
    queryOption: AdapterOption,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const colRef = this.buildCollectionRef(type.modelName, queryOption);
        const queryRef = queryOption.filter?.(colRef) || colRef;
        const config = {
          recordArray,
          queryRef,
          modelName: type.modelName,
          referenceKeyName: this.referenceKeyName,
          queryId: queryOption.queryId,
        };
        const docSnapshots = queryOption.isRealtime && !this.isFastBoot
          ? await this.firestoreDataManager.queryRealtime(config)
          : await this.firestoreDataManager.queryWithReferenceTo(queryRef, this.referenceKeyName);

        const result = docSnapshots.map((docSnapshot) => (flattenDocSnapshot(docSnapshot)));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  public findBelongsTo(
    _store: Store,
    _snapshot: Snapshot,
    url: string,
    relationship: BelongsToRelationshipMeta,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const urlNodes = url.split('/');
        const id = urlNodes[urlNodes.length - 1];

        urlNodes.pop();

        const db = this.firebase.firestore();
        const docRef = doc(db, urlNodes.join('/'), id);
        const modelName = relationship.type;
        const docSnapshot = relationship.options.isRealtime && !this.isFastBoot
          ? await this.firestoreDataManager.findRecordRealtime(modelName, docRef)
          : await getDoc(docRef);

        if (docSnapshot.exists()) {
          resolve(flattenDocSnapshot(docSnapshot));
        } else {
          reject(new Error(`Record ${id} for model type ${modelName} doesn't exist`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public findHasMany(
    store: Store,
    snapshot: Snapshot,
    url: string,
    relationship: HasManyRelationshipMeta,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const queryRef = this.buildHasManyCollectionRef(store, snapshot, url, relationship);
        const config = {
          queryRef,
          modelName: snapshot.modelName as string,
          id: snapshot.id,
          field: relationship.key,
          referenceKeyName: this.referenceKeyName,
        };
        const documentSnapshots = relationship.options.isRealtime && !this.isFastBoot
          ? await this.firestoreDataManager.findHasManyRealtime(config)
          : await this.firestoreDataManager.queryWithReferenceTo(queryRef, this.referenceKeyName);

        const result = documentSnapshots.map((docSnapshot) => (flattenDocSnapshot(docSnapshot)));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildCollectionRef(
    modelName: string,
    adapterOptions?: AdapterOption,
  ): CollectionReference {
    const db = this.firebase.firestore();

    return adapterOptions?.buildReference?.(db) || collection(db, buildCollectionName(modelName));
  }

  private addDocRefToWriteBatch(
    batch: WriteBatch,
    docRef: DocumentReference,
    snapshot: Snapshot,
  ): void {
    const data = this.serialize(snapshot, {});

    batch.set(docRef, data, { merge: true });
  }

  private addIncludeToWriteBatch(batch: WriteBatch, adapterOptions?: AdapterOption): void {
    const db = this.firebase.firestore();

    adapterOptions?.include?.(batch, db);
  }

  private buildWriteBatch(docRef: DocumentReference, snapshot: Snapshot): WriteBatch {
    const db = this.firebase.firestore();
    const batch = writeBatch(db);

    this.addDocRefToWriteBatch(batch, docRef, snapshot);
    this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

    return batch;
  }

  private buildHasManyCollectionRef(
    store: Store,
    snapshot: Snapshot,
    url: string,
    relationship: HasManyRelationshipMeta,
  ): CollectionReference | Query {
    const db = this.firebase.firestore();

    if (relationship.options.buildReference) {
      const collectionRef = relationship.options.buildReference(db, snapshot.record);

      return relationship.options.filter?.(collectionRef, snapshot.record) || collectionRef;
    }

    const cardinality = snapshot.type.determineRelationshipType(relationship, store);

    if (cardinality === 'manyToOne') {
      const inverse = snapshot.type.inverseFor(relationship.key, store);
      const snapshotCollectionName = buildCollectionName(snapshot.modelName.toString());
      const snapshotDocRef = doc(db, `${snapshotCollectionName}/${snapshot.id}`);
      const collectionRef = collection(db, url);
      const queryRef = query(collectionRef, where(inverse.name, '==', snapshotDocRef));

      return relationship.options.filter?.(queryRef, snapshot.record) || queryRef;
    }

    const collectionRef = collection(db, url);

    return relationship.options.filter?.(collectionRef, snapshot.record) || collectionRef;
  }
}

declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    'cloud-firestore-modular': CloudFirestoreModularAdapter;
  }
}
