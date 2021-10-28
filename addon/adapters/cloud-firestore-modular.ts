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
import classic from 'ember-classic-decorator';

import {
  CollectionReference,
  DocumentReference,
  Query,
  QuerySnapshot,
  WriteBatch,
} from 'firebase/firestore';
import firebase from 'firebase/compat/app';

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import FirebaseService from 'ember-cloud-firestore-adapter/services/-firebase';
import RealtimeTracker from 'ember-cloud-firestore-adapter/-private/realtime-tracker-modular';
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

@classic
export default class CloudFirestoreModularAdapter extends Adapter {
  @service('-firebase')
  declare protected firebase: FirebaseService;

  protected referenceKeyName = 'referenceTo';

  declare private realtimeTracker: RealtimeTracker;

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
          this.fetchRecord(type, snapshot.id, snapshot.adapterOptions);
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
      const collectionRef = collection(db, buildCollectionName(type.modelName));
      const unsubscribe = onSnapshot(collectionRef, async (querySnapshot) => {
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
        return collection(db, urlNodes.join('/'));
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
      const unsubscribe = onSnapshot(collectionRef, async (querySnapshot) => {
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
    queryOption: AdapterOption,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef(type.modelName, queryOption);
      const queryRef = queryOption.filter?.(collectionRef) || collectionRef;
      const unsubscribe = onSnapshot(queryRef, async (querySnapshot) => {
        if (queryOption.isRealtime && !this.isFastBoot) {
          this.realtimeTracker?.trackQueryChanges(queryRef, recordArray, queryOption.queryId);
        }

        const requests = this.findQueryRecords(type, queryOption, querySnapshot);

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
  ): CollectionReference {
    const db = this.firebase.firestore();

    return adapterOptions?.buildReference?.(db) || collection(db, buildCollectionName(modelName));
  }

  private fetchRecord(
    type: ModelClass,
    id: string,
    adapterOption?: AdapterOption,
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef(type.modelName, adapterOption);
      const docRef = doc(collectionRef, id);
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
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

  private findHasManyRecords(
    relationship: HasManyRelationshipMeta,
    querySnapshot: QuerySnapshot,
  ): RSVP.Promise<unknown>[] {
    return querySnapshot.docs.map((docSnapshot) => {
      const type = { modelName: relationship.type };
      const referenceTo = docSnapshot.get(this.referenceKeyName);

      if (referenceTo && referenceTo.firestore) {
        return this.fetchRecord(type, referenceTo.id, {
          isRealtime: relationship.options.isRealtime,

          buildReference(db: firebase.firestore.Firestore) {
            return collection(db, referenceTo.parent.path);
          },
        });
      }

      const adapterOptions = {
        isRealtime: relationship.options.isRealtime,

        buildReference(db: firebase.firestore.Firestore) {
          return collection(db, docSnapshot.ref.parent.path);
        },
      };

      return this.fetchRecord(type, docSnapshot.id, adapterOptions);
    });
  }

  private findQueryRecords(
    type: ModelClass,
    option: AdapterOption,
    querySnapshot: QuerySnapshot,
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
    'cloud-firestore-modular': CloudFirestoreModularAdapter;
  }
}
