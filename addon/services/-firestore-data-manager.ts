import { next } from '@ember/runloop';
import Service, { inject as service } from '@ember/service';
import Store from '@ember-data/store';

import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import {
  getDoc,
  getDocs,
  onSnapshot,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';
import type {
  TypeFromInstance,
  TypedRecordInstance,
} from '@warp-drive/core-types/record';
import type { Collection } from '@ember-data/store/-private/record-arrays/identifier-array';

interface DocListeners {
  [key: string]: {
    snapshot: DocumentSnapshot;
    unsubscribe: Unsubscribe;
  };
}

interface ColListeners {
  [key: string]: {
    snapshot: QuerySnapshot;
    unsubscribe: Unsubscribe;
  };
}

interface QueryListeners {
  [key: string]: {
    snapshots: DocumentSnapshot[];
    unsubscribe: Unsubscribe;
  };
}

interface QueryFetchConfig<T> {
  modelName: TypeFromInstance<T>;
  referenceKeyName: string;
  recordArray: Collection;
  queryRef: Query;
  queryId?: string;
}

interface HasManyFetchConfig<T> {
  modelName: TypeFromInstance<T>;
  id: string | null;
  field: string;
  referenceKeyName: string;
  queryRef: Query;
}

export default class FirestoreDataManager extends Service {
  @service
  private declare store: Store;

  private docListeners: DocListeners = {};

  private colListeners: ColListeners = {};

  private queryListeners: QueryListeners = {};

  private hasManyListeners: QueryListeners = {};

  public willDestroy(): void {
    super.willDestroy();

    Object.values(this.docListeners).forEach((listener) =>
      listener.unsubscribe(),
    );
    Object.values(this.colListeners).forEach((listener) =>
      listener.unsubscribe(),
    );
    Object.values(this.queryListeners).forEach((listener) =>
      listener.unsubscribe(),
    );
    Object.values(this.hasManyListeners).forEach((listener) =>
      listener.unsubscribe(),
    );
  }

  public async findRecordRealtime<T>(
    modelName: TypeFromInstance<T>,
    docRef: DocumentReference,
  ): Promise<DocumentSnapshot> {
    const { path: listenerKey } = docRef;

    if (!Object.prototype.hasOwnProperty.call(this.docListeners, listenerKey)) {
      await this.setupDocRealtimeUpdates(modelName, docRef);
    }

    return this.docListeners[listenerKey]!.snapshot;
  }

  public async findAllRealtime<T>(
    modelName: TypeFromInstance<T>,
    colRef: CollectionReference,
  ): Promise<QuerySnapshot> {
    const { path: listenerKey } = colRef;

    if (!Object.prototype.hasOwnProperty.call(this.colListeners, listenerKey)) {
      await this.setupColRealtimeUpdates(modelName, colRef);
    }

    return this.colListeners[listenerKey]!.snapshot;
  }

  public async queryRealtime<T>(
    config: QueryFetchConfig<T>,
  ): Promise<DocumentSnapshot[]> {
    const queryId =
      config.queryId || Math.random().toString(32).slice(2).substring(0, 5);
    let unsubscribe: Unsubscribe | undefined;

    if (this.queryListeners[queryId]) {
      unsubscribe = this.queryListeners[queryId]!.unsubscribe;
      delete this.queryListeners[queryId];
    }

    await this.setupQueryRealtimeUpdates(config, queryId);

    if (unsubscribe !== undefined) {
      unsubscribe();
    }

    return this.queryListeners[queryId]!.snapshots;
  }

  public async findHasManyRealtime<T>(
    config: HasManyFetchConfig<T>,
  ): Promise<DocumentSnapshot[]> {
    const queryId = `${config.modelName}_${config.id}_${config.field}`;

    let unsubscribe: Unsubscribe | undefined;

    if (this.hasManyListeners[queryId]) {
      unsubscribe = this.hasManyListeners[queryId]!.unsubscribe;
      delete this.hasManyListeners[queryId];
    }

    await this.setupHasManyRealtimeUpdates(config, queryId);

    if (unsubscribe !== undefined) {
      unsubscribe();
    }

    return this.hasManyListeners[queryId]!.snapshots;
  }

  public async queryWithReferenceTo<T>(
    queryRef: Query,
    referenceKey: string,
  ): Promise<DocumentSnapshot[]> {
    const querySnapshot = await getDocs(queryRef);
    const promises = querySnapshot.docs.map((docSnapshot) =>
      this.getReferenceToDoc<T>(docSnapshot, '' as never, referenceKey),
    );

    return Promise.all(promises);
  }

  private setupDocRealtimeUpdates<T>(
    modelName: TypeFromInstance<T>,
    docRef: DocumentReference,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { path: listenerKey } = docRef;
      const unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          if (
            Object.prototype.hasOwnProperty.call(this.docListeners, listenerKey)
          ) {
            this.handleSubsequentDocRealtimeUpdates(
              docSnapshot,
              modelName,
              listenerKey,
            );
          } else {
            this.handleInitialDocRealtimeUpdates(
              docSnapshot,
              listenerKey,
              unsubscribe,
            );
          }

          resolve();
        },
        (error) => {
          this.destroyListener('doc', listenerKey);
          reject(error);
        },
      );
    });
  }

  private setupColRealtimeUpdates<T>(
    modelName: TypeFromInstance<T>,
    colRef: CollectionReference,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { path: listenerKey } = colRef;
      const unsubscribe = onSnapshot(
        colRef,
        (querySnapshot) => {
          if (
            Object.prototype.hasOwnProperty.call(this.colListeners, listenerKey)
          ) {
            this.handleSubsequentColRealtimeUpdates(
              modelName,
              listenerKey,
              querySnapshot,
            );
          } else {
            this.colListeners[listenerKey] = {
              unsubscribe,
              snapshot: querySnapshot,
            };
          }

          resolve();
        },
        (error) => {
          this.destroyListener('col', listenerKey);
          reject(error);
        },
      );
    });
  }

  public setupQueryRealtimeUpdates<T>(
    config: QueryFetchConfig<T>,
    queryId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        config.queryRef,
        (querySnapshot) => {
          if (
            Object.prototype.hasOwnProperty.call(this.queryListeners, queryId)
          ) {
            this.handleSubsequentQueryRealtimeUpdates(
              queryId,
              config.recordArray,
            );
            resolve();
          } else {
            this.handleInitialQueryRealtimeUpdates(
              queryId,
              config,
              querySnapshot,
              unsubscribe,
            ).then(() => {
              resolve();
            });
          }
        },
        (error) => {
          this.destroyListener('query', queryId);
          reject(error);
        },
      );
    });
  }

  public setupHasManyRealtimeUpdates<T>(
    config: HasManyFetchConfig<T>,
    queryId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        config.queryRef,
        (querySnapshot) => {
          if (
            Object.prototype.hasOwnProperty.call(this.hasManyListeners, queryId)
          ) {
            this.handleSubsequentHasManyRealtimeUpdates(config);
            resolve();
          } else {
            this.handleInitialHasManyRealtimeUpdates(
              queryId,
              config,
              querySnapshot,
              unsubscribe,
            ).then(() => {
              resolve();
            });
          }
        },
        (error) => {
          this.destroyListener('hasMany', queryId);
          reject(error);
        },
      );
    });
  }

  private handleInitialDocRealtimeUpdates(
    docSnapshot: DocumentSnapshot,
    listenerKey: string,
    unsubscribe: Unsubscribe,
  ): void {
    if (docSnapshot.exists()) {
      this.docListeners[listenerKey] = { unsubscribe, snapshot: docSnapshot };
    } else {
      unsubscribe();
    }
  }

  private handleSubsequentDocRealtimeUpdates<T>(
    docSnapshot: DocumentSnapshot,
    modelName: TypeFromInstance<T>,
    listenerKey: string,
  ): void {
    if (docSnapshot.exists()) {
      this.docListeners[listenerKey]!.snapshot = docSnapshot;
      this.pushRecord(modelName, docSnapshot);
    } else {
      this.unloadRecord(modelName, docSnapshot.id, listenerKey);
    }
  }

  private handleSubsequentColRealtimeUpdates<T>(
    modelName: TypeFromInstance<T>,
    listenerKey: string,
    querySnapshot: QuerySnapshot,
  ): void {
    this.colListeners[listenerKey]!.snapshot = querySnapshot;

    querySnapshot.forEach((docSnapshot) => {
      this.pushRecord(modelName, docSnapshot);
    });

    querySnapshot.docChanges().forEach((change) => {
      if (change.type === 'removed') {
        this.unloadRecord(modelName, change.doc.id);
      }
    });
  }

  private async handleInitialQueryRealtimeUpdates<T>(
    queryId: string,
    config: QueryFetchConfig<T>,
    querySnapshot: QuerySnapshot,
    unsubscribe: Unsubscribe,
  ): Promise<void> {
    const docSnapshots = querySnapshot.docs.map((docSnapshot) =>
      this.getReferenceToDoc(
        docSnapshot,
        config.modelName,
        config.referenceKeyName,
      ),
    );

    const result = await Promise.all(docSnapshots);

    this.queryListeners[queryId] = { unsubscribe, snapshots: result };
  }

  private handleSubsequentQueryRealtimeUpdates(
    queryId: string,
    recordArray: Collection,
  ): void {
    // Schedule for next runloop to avoid race condition errors. This can happen when a listener
    // exists for a record that's part of the query array. When that happens, doing an update
    // in the query array while the record is being unloaded from store can cause an error.
    // To avoid the issue, we run .update() in the next runloop so that we allow the unload
    // to happen first.
    next(() => {
      // In case multiple docs within the query were updated, this block can potentially happen
      // multiple times. Race condition can happen where queryId no longer exists inside
      // queryListeners so we have this check.
      if (Object.prototype.hasOwnProperty.call(this.queryListeners, queryId)) {
        const { unsubscribe } = this.queryListeners[queryId]!;

        delete this.queryListeners[queryId];
        recordArray.update().then(() => unsubscribe());
      }
    });
  }

  private async handleInitialHasManyRealtimeUpdates<T>(
    queryId: string,
    config: HasManyFetchConfig<T>,
    querySnapshot: QuerySnapshot,
    unsubscribe: Unsubscribe,
  ): Promise<void> {
    const docSnapshots = querySnapshot.docs.map((docSnapshot) =>
      this.getReferenceToDoc(
        docSnapshot,
        config.modelName,
        config.referenceKeyName,
      ),
    );

    const result = await Promise.all(docSnapshots);

    this.hasManyListeners[queryId] = { unsubscribe, snapshots: result };
  }

  private handleSubsequentHasManyRealtimeUpdates<T>(
    config: HasManyFetchConfig<T>,
  ): void {
    // Schedule for next runloop to avoid race condition errors. This can happen when a listener
    // exists for a record that's part of the hasMany array. When that happens, doing a reload
    // in the hasMany array while the record is being unloaded from store can cause an error.
    // To avoid the issue, we run .reload() in the next runloop so that we allow the unload
    // to happen first.
    next(() => {
      const hasManyRef = this.store
        .peekRecord<T>(config.modelName, config.id!)
        ?.hasMany(config.field);

      hasManyRef.reload();
    });
  }

  public async getReferenceToDoc<T>(
    docSnapshot: DocumentSnapshot,
    modelName: TypeFromInstance<T>,
    referenceKeyName: string,
    isRealtime = false,
  ): Promise<DocumentSnapshot> {
    const referenceTo = docSnapshot.get(referenceKeyName);

    if (referenceTo && referenceTo.firestore) {
      return isRealtime
        ? this.findRecordRealtime(modelName, referenceTo)
        : getDoc(referenceTo);
    }

    return docSnapshot;
  }

  private pushRecord<T>(
    modelName: TypeFromInstance<T>,
    snapshot: DocumentSnapshot,
  ): void {
    const flatRecord = flattenDocSnapshot(snapshot);
    const normalizedRecord = this.store.normalize(modelName, flatRecord);

    // Race condition can happen because of the realtime nature. We handle that in a try-catch
    // to avoid unexpected side-effects. When this happens, we just ignore it.
    try {
      this.store.push(normalizedRecord);
    } catch {
      // Do nothing
    }
  }

  private unloadRecord<T>(
    modelName: TypeFromInstance<T>,
    id: string | number,
    path?: string,
  ): void {
    const record = this.store.peekRecord(modelName, id);

    if (record !== null) {
      // Race condition can happen because of the realtime nature. We handle that in a try-catch
      // to avoid unexpected side-effects. When this happens, we just ignore it.
      try {
        this.store.unloadRecord(record);
      } catch {
        // Do nothing
      }
    }

    if (path !== undefined) {
      this.destroyListener('doc', path);
    }
  }

  private destroyListener(type: string, key: string): void {
    if (type === 'doc' && this.docListeners[key]) {
      this.docListeners[key]!.unsubscribe();
      delete this.docListeners[key];
    }

    if (type === 'col' && this.colListeners[key]) {
      this.colListeners[key]!.unsubscribe();
      delete this.colListeners[key];
    }

    if (type === 'query' && this.queryListeners[key]) {
      this.queryListeners[key]!.unsubscribe();
      delete this.queryListeners[key];
    }

    if (type === 'hasMany' && this.hasManyListeners[key]) {
      this.hasManyListeners[key]!.unsubscribe();
      delete this.hasManyListeners[key];
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    '-firestore-data-manager': FirestoreDataManager;
  }
}
