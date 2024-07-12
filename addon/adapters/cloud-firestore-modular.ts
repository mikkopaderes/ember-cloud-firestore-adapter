import { getOwner } from '@ember/owner';
import { inject as service } from '@ember/service';
import Adapter from '@ember-data/adapter';
import RSVP from 'rsvp';
import Store from '@ember-data/store';
import type { ModelSchema } from '@ember-data/store/types';
import type { Snapshot } from '@ember-data/legacy-compat/-private';
import type { AdapterPayload } from '@ember-data/legacy-compat';
import type { SnapshotRecordArray } from 'ember-data/-private';
import type {
  TypeFromInstance,
  TypedRecordInstance,
} from '@warp-drive/core-types/record';

import {
  CollectionReference,
  DocumentReference,
  Firestore,
  Query,
  WriteBatch,
} from 'firebase/firestore';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import AdapterRecordNotFoundError from 'ember-cloud-firestore-adapter/utils/custom-errors';
import FirestoreDataManager from 'ember-cloud-firestore-adapter/services/-firestore-data-manager';
import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

export interface AdapterOption {
  isRealtime?: boolean;
  queryId?: string;

  buildReference?(db: Firestore): CollectionReference;
  filter?(db: CollectionReference): Query;
  include?(batch: WriteBatch, db: Firestore): void;

  [key: string]: unknown;
}

interface CloudFirestoreSnapshot extends Snapshot {
  adapterOptions: AdapterOption;
}

interface CloudFirestoreSnapshotRecordArray extends SnapshotRecordArray {
  adapterOptions?: AdapterOption;
}

interface BelongsToRelationshipMeta<T> {
  type: TypeFromInstance<T>;
  options: { isRealtime?: boolean };
}

interface HasManyRelationshipMeta {
  key: string;
  type: string;
  options: {
    isRealtime?: boolean;

    buildReference?(db: Firestore, record: unknown): CollectionReference;
    filter?(db: CollectionReference | Query, record: unknown): Query;
  };
}

export default class CloudFirestoreAdapter extends Adapter {
  @service('-firestore-data-manager')
  protected declare firestoreDataManager: FirestoreDataManager;

  protected referenceKeyName = 'referenceTo';

  protected get isFastBoot(): boolean | undefined {
    const fastboot = getOwner(this)?.lookup('service:fastboot');

    return fastboot && fastboot.isFastBoot;
  }

  public generateIdForRecord(_store: Store, type: unknown): string {
    const db = getFirestore();
    const collectionName = buildCollectionName(type as string); // TODO: EmberData types incorrect

    return doc(collection(db, collectionName)).id;
  }

  public createRecord(
    store: Store,
    type: ModelSchema,
    snapshot: CloudFirestoreSnapshot,
  ): Promise<AdapterPayload> {
    return this.updateRecord(store, type, snapshot);
  }

  public updateRecord<T>(
    _store: Store,
    type: ModelSchema<T>,
    snapshot: CloudFirestoreSnapshot,
  ): Promise<AdapterPayload> {
    return new RSVP.Promise((resolve, reject) => {
      const collectionRef = this.buildCollectionRef<T>(
        type.modelName as TypeFromInstance<T>,
        snapshot.adapterOptions,
      );
      const docRef = doc(collectionRef, snapshot.id!);
      const batch = this.buildWriteBatch(docRef, snapshot);

      batch
        .commit()
        .then(() => {
          const data = this.serialize(snapshot, { includeId: true });

          resolve(data);

          if (snapshot.adapterOptions?.isRealtime && !this.isFastBoot) {
            // Setup realtime listener for record
            this.firestoreDataManager.findRecordRealtime<T>(
              type.modelName as TypeFromInstance<T>,
              docRef,
            );
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public deleteRecord<T>(
    _store: Store,
    type: ModelSchema,
    snapshot: CloudFirestoreSnapshot,
  ): Promise<AdapterPayload> {
    return new RSVP.Promise((resolve, reject) => {
      const db = getFirestore();
      const collectionRef = this.buildCollectionRef(
        type.modelName as TypeFromInstance<T>,
        snapshot.adapterOptions,
      );
      const docRef = doc(collectionRef, snapshot.id!);
      const batch = writeBatch(db);

      batch.delete(docRef);
      this.addIncludeToWriteBatch(batch, snapshot.adapterOptions);

      batch
        .commit()
        .then(() => {
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public findRecord<T extends TypedRecordInstance>(
    _store: Store,
    type: ModelSchema<T>,
    id: string,
    snapshot: CloudFirestoreSnapshot,
  ): Promise<AdapterPayload> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const colRef = this.buildCollectionRef<T>(
          type.modelName as TypeFromInstance<T>,
          snapshot.adapterOptions,
        );
        const docRef = doc(colRef, id);
        const docSnapshot =
          snapshot.adapterOptions?.isRealtime && !this.isFastBoot
            ? await this.firestoreDataManager.findRecordRealtime(
                type.modelName as TypeFromInstance<T>,
                docRef,
              )
            : await getDoc(docRef);

        if (docSnapshot.exists()) {
          resolve(flattenDocSnapshot(docSnapshot));
        } else {
          reject(
            new AdapterRecordNotFoundError(
              `Record ${id} for model type ${type.modelName} doesn't exist`,
            ),
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public findAll<T>(
    _store: Store,
    type: ModelSchema<T>,
    _neverSet: null,
    snapshotRecordArray?: CloudFirestoreSnapshotRecordArray,
  ): Promise<AdapterPayload> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const db = getFirestore();
        const colRef = collection(db, buildCollectionName(type.modelName));
        const querySnapshot =
          snapshotRecordArray?.adapterOptions?.isRealtime && !this.isFastBoot
            ? await this.firestoreDataManager.findAllRealtime<T>(
                type.modelName as TypeFromInstance<T>,
                colRef,
              )
            : await getDocs(colRef);

        const result = querySnapshot.docs.map((docSnapshot) =>
          flattenDocSnapshot(docSnapshot),
        );

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  public query<T>(
    _store: Store,
    type: ModelSchema<T>,
    queryOption: AdapterOption,
  ): Promise<AdapterPayload> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const colRef = this.buildCollectionRef<T>(
          type.modelName as TypeFromInstance<T>,
          queryOption,
        );
        const queryRef = queryOption.filter?.(colRef) || colRef;
        const config = {
          recordArray: {},
          queryRef,
          modelName: type.modelName as TypeFromInstance<T>,
          referenceKeyName: this.referenceKeyName,
          queryId: queryOption.queryId,
        };
        const docSnapshots =
          queryOption.isRealtime && !this.isFastBoot
            ? await this.firestoreDataManager.queryRealtime<T>(config)
            : await this.firestoreDataManager.queryWithReferenceTo(
                queryRef,
                this.referenceKeyName,
              );

        const result = docSnapshots.map((docSnapshot) =>
          flattenDocSnapshot(docSnapshot),
        );

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  public findBelongsTo<T>(
    _store: Store,
    _snapshot: Snapshot,
    url: string,
    relationship: BelongsToRelationshipMeta<T>,
  ): Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const urlNodes = url.split('/');
        const id = urlNodes[urlNodes.length - 1];

        urlNodes.pop();

        const db = getFirestore();
        const docRef = doc(db, urlNodes.join('/'), id!);
        const modelName = relationship.type;
        const docSnapshot =
          relationship.options.isRealtime && !this.isFastBoot
            ? await this.firestoreDataManager.findRecordRealtime(
                modelName,
                docRef,
              )
            : await getDoc(docRef);

        if (docSnapshot.exists()) {
          resolve(flattenDocSnapshot(docSnapshot));
        } else {
          reject(
            new AdapterRecordNotFoundError(
              `Record ${id} for model type ${modelName} doesn't exist`,
            ),
          );
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public findHasMany<T>(
    store: Store,
    snapshot: Snapshot,
    url: string,
    relationship: HasManyRelationshipMeta,
  ): Promise<unknown> {
    return new RSVP.Promise(async (resolve, reject) => {
      try {
        const queryRef = this.buildHasManyCollectionRef(
          store,
          snapshot,
          url,
          relationship,
        );
        const config = {
          queryRef,
          modelName: snapshot.modelName as TypeFromInstance<T>,
          id: snapshot.id,
          field: relationship.key,
          referenceKeyName: this.referenceKeyName,
        };
        const documentSnapshots =
          relationship.options.isRealtime && !this.isFastBoot
            ? await this.firestoreDataManager.findHasManyRealtime<T>(config)
            : await this.firestoreDataManager.queryWithReferenceTo(
                queryRef,
                this.referenceKeyName,
              );

        const result = documentSnapshots.map((docSnapshot) =>
          flattenDocSnapshot(docSnapshot),
        );

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  protected buildCollectionRef<T>(
    modelName: TypeFromInstance<T>,
    adapterOptions?: AdapterOption,
  ): CollectionReference {
    const db = getFirestore();

    return (
      adapterOptions?.buildReference?.(db) ||
      collection(db, buildCollectionName(modelName))
    );
  }

  private addDocRefToWriteBatch(
    batch: WriteBatch,
    docRef: DocumentReference,
    snapshot: Snapshot,
  ): void {
    const data = this.serialize(snapshot, {});

    batch.set(docRef, data, { merge: true });
  }

  private addIncludeToWriteBatch(
    batch: WriteBatch,
    adapterOptions?: AdapterOption,
  ): void {
    const db = getFirestore();

    adapterOptions?.include?.(batch, db);
  }

  private buildWriteBatch(
    docRef: DocumentReference,
    snapshot: Snapshot,
  ): WriteBatch {
    const db = getFirestore();
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
    const db = getFirestore();

    if (relationship.options.buildReference) {
      const collectionRef = relationship.options.buildReference(
        db,
        snapshot.record,
      );

      return (
        relationship.options.filter?.(collectionRef, snapshot.record) ||
        collectionRef
      );
    }

    const modelClass = store.modelFor(snapshot.modelName);
    const cardinality = modelClass.determineRelationshipType(
      relationship,
      store,
    );

    if (cardinality === 'manyToOne') {
      const inverse = modelClass.inverseFor(relationship.key, store);
      const snapshotCollectionName = buildCollectionName(
        snapshot.modelName.toString(),
      );
      const snapshotDocRef = doc(
        db,
        `${snapshotCollectionName}/${snapshot.id}`,
      );
      const collectionRef = collection(db, url);
      const queryRef = query(
        collectionRef,
        where(inverse.name, '==', snapshotDocRef),
      );

      return (
        relationship.options.filter?.(queryRef, snapshot.record) || queryRef
      );
    }

    const collectionRef = collection(db, url);

    return (
      relationship.options.filter?.(collectionRef, snapshot.record) ||
      collectionRef
    );
  }
}
