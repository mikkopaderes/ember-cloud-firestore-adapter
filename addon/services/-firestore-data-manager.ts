import { next } from '@ember/runloop';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import DS from 'ember-data';
import Service, { inject as service } from '@ember/service';
import StoreService from '@ember-data/store';

import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { onSnapshot } from 'ember-cloud-firestore-adapter/firebase/firestore';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

interface Listeners {
  [key: string]: Unsubscribe;
}

interface QueryFetchConfig {
  modelName: string;
  referenceKeyName: string;
  recordArray: DS.AdapterPopulatedRecordArray<unknown>;
  queryRef: Query,
  queryId?: string,
}

interface HasManyFetchConfig {
  modelName: string;
  id: string;
  field: string;
  referenceKeyName: string;
  queryRef: Query;
}

export default class FirestoreDataManager extends Service {
  @service
  private declare store: StoreService;

  private docListeners: Listeners = {};

  private colListeners: Listeners = {};

  private queryListeners: Listeners = {};

  private hasManyListeners: Listeners = {};

  public willDestroy(): void {
    super.willDestroy();

    Object.values(this.docListeners).forEach((unsubscribe) => unsubscribe());
    Object.values(this.colListeners).forEach((unsubscribe) => unsubscribe());
    Object.values(this.queryListeners).forEach((unsubscribe) => unsubscribe());
    Object.values(this.hasManyListeners).forEach((unsubscribe) => unsubscribe());
  }

  public findRecord(docRef: DocumentReference): Promise<DocumentSnapshot> {
    return new Promise((resolve, reject) => {
      // Use `onSnapshot` instead of `getDoc` because the former fetches from cache if there's
      // already an existing listener for it
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        unsubscribe();
        resolve(docSnapshot);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async findRecordRealtime(
    modelName: string,
    docRef: DocumentReference,
  ): Promise<DocumentSnapshot> {
    const { path: listenerKey } = docRef;

    if (!Object.prototype.hasOwnProperty.call(this.docListeners, listenerKey)) {
      await this.setupDocRealtimeUpdates(modelName, docRef);
    }

    return this.findRecord(docRef);
  }

  public findAll(colRef: CollectionReference): Promise<QuerySnapshot> {
    return new Promise((resolve, reject) => {
      // Use `onSnapshot` instead of `getDocs` because the former fetches from cache if there's
      // already an existing listener for it
      const unsubscribe = onSnapshot(colRef, (querySnapshot) => {
        unsubscribe();
        resolve(querySnapshot);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async findAllRealtime(
    modelName: string,
    colRef: CollectionReference,
  ): Promise<QuerySnapshot> {
    const { path: listenerKey } = colRef;

    if (!Object.prototype.hasOwnProperty.call(this.colListeners, listenerKey)) {
      await this.setupColRealtimeUpdates(modelName, colRef);
    }

    return this.findAll(colRef);
  }

  public query(
    config: QueryFetchConfig | HasManyFetchConfig,
    isRealtime = false,
  ): Promise<DocumentSnapshot[]> {
    return new Promise((resolve, reject) => {
      // Use `onSnapshot` instead of `getDocs` because the former fetches from cache if there's
      // already an existing listener for it
      const unsubscribe = onSnapshot(config.queryRef, (querySnapshot) => {
        unsubscribe();

        const promises = querySnapshot.docs.map((docSnapshot) => (
          this.getReferenceToDoc(docSnapshot, config.modelName, config.referenceKeyName, isRealtime)
        ));

        Promise.all(promises).then((result) => {
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      }, (error) => {
        reject(error);
      });
    });
  }

  public async queryRealtime(config: QueryFetchConfig): Promise<DocumentSnapshot[]> {
    const queryId = config.queryId || Math.random().toString(32).slice(2).substring(0, 5);

    if (!Object.prototype.hasOwnProperty.call(this.queryListeners, queryId)) {
      await this.setupQueryRealtimeUpdates(config, queryId);
    }

    return this.query(config, true);
  }

  public async findHasManyRealtime(config: HasManyFetchConfig): Promise<DocumentSnapshot[]> {
    const queryId = `${config.modelName}_${config.id}_${config.field}`;

    if (!Object.prototype.hasOwnProperty.call(this.hasManyListeners, queryId)) {
      await this.setupHasManyRealtimeUpdates(config, queryId);
    }

    return this.query(config, true);
  }

  private setupDocRealtimeUpdates(
    modelName: string,
    docRef: DocumentReference,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { path: listenerKey } = docRef;
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (Object.prototype.hasOwnProperty.call(this.docListeners, listenerKey)) {
          this.handleSubsequentDocRealtimeUpdates(docSnapshot, modelName, listenerKey);
        } else {
          this.handleInitialDocRealtimeUpdates(docSnapshot, listenerKey, unsubscribe);
          resolve();
        }
      }, (error) => {
        this.destroyListener('doc', listenerKey);
        reject(error);
      });
    });
  }

  private setupColRealtimeUpdates(
    modelName: string,
    colRef: CollectionReference,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const { path: listenerKey } = colRef;
      const unsubscribe = onSnapshot(colRef, (querySnapshot) => {
        if (Object.prototype.hasOwnProperty.call(this.colListeners, listenerKey)) {
          this.handleSubsequentColRealtimeUpdates(modelName, querySnapshot);
        } else {
          this.colListeners[listenerKey] = unsubscribe;

          resolve();
        }
      }, (error) => {
        this.destroyListener('col', listenerKey);
        reject(error);
      });
    });
  }

  public setupQueryRealtimeUpdates(config: QueryFetchConfig, queryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(config.queryRef, () => {
        if (Object.prototype.hasOwnProperty.call(this.queryListeners, queryId)) {
          this.handleQueryRealtimeUpdates(queryId, config.recordArray);
        } else {
          this.queryListeners[queryId] = unsubscribe;

          resolve();
        }
      }, (error) => {
        this.destroyListener('query', queryId);
        reject(error);
      });
    });
  }

  public setupHasManyRealtimeUpdates(config: HasManyFetchConfig, queryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(config.queryRef, () => {
        if (Object.prototype.hasOwnProperty.call(this.hasManyListeners, queryId)) {
          this.handleHasManyRealtimeUpdates(config, queryId);
        } else {
          this.hasManyListeners[queryId] = unsubscribe;

          resolve();
        }
      }, (error) => {
        this.destroyListener('hasMany', queryId);
        reject(error);
      });
    });
  }

  private handleInitialDocRealtimeUpdates(
    docSnapshot: DocumentSnapshot,
    listenerKey: string,
    unsubscribe: Unsubscribe,
  ): void {
    if (docSnapshot.exists()) {
      this.docListeners[listenerKey] = unsubscribe;
    } else {
      unsubscribe();
    }
  }

  private handleSubsequentDocRealtimeUpdates(
    docSnapshot: DocumentSnapshot,
    modelName: string,
    listenerKey: string,
  ): void {
    if (docSnapshot.exists()) {
      this.pushRecord(modelName, docSnapshot);
    } else {
      this.unloadRecord(modelName, docSnapshot.id, listenerKey);
    }
  }

  private handleSubsequentColRealtimeUpdates(
    modelName: string,
    querySnapshot: QuerySnapshot,
  ): void {
    querySnapshot.forEach((docSnapshot) => {
      this.pushRecord(modelName, docSnapshot);
    });

    querySnapshot.docChanges().forEach((change) => {
      if (change.type === 'removed') {
        this.unloadRecord(modelName, change.doc.id);
      }
    });
  }

  private handleQueryRealtimeUpdates(
    queryId: string,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
  ): void {
    // Schedule for next runloop to avoid race condition errors. This can happen when a listener
    // exists for a record that's part of the query array. When that happens, doing an update
    // in the query array while the record is being unloaded from store can cause an error.
    // To avoid the issue, we run the reload in the next runloop so that we allow the unload
    // to happen first.
    next(() => {
      const unsubscribe = this.queryListeners[queryId];

      // New listener will be set after the update
      delete this.queryListeners[queryId];
      recordArray.update().then(() => unsubscribe());
    });
  }

  private handleHasManyRealtimeUpdates(config: HasManyFetchConfig, queryId: string): void {
    // Schedule for next runloop to avoid race condition errors. This can happen when a listener
    // exists for a record that's part of the hasMany array. When that happens, doing a reload
    // in the hasMany array while the record is being unloaded from store can cause an error.
    // To avoid the issue, we run the reload in the next runloop so that we allow the unload
    // to happen first.
    next(() => {
      const hasManyRef = this.store.peekRecord(config.modelName, config.id).hasMany(config.field);
      const unsubscribe = this.hasManyListeners[queryId];

      // New listener will be set after the reload
      delete this.hasManyListeners[queryId];
      hasManyRef.reload().then(() => unsubscribe());
    });
  }

  private async getReferenceToDoc(
    docSnapshot: DocumentSnapshot,
    modelName: string,
    referenceKeyName: string,
    isRealtime = false,
  ): Promise<DocumentSnapshot> {
    const referenceTo = docSnapshot.get(referenceKeyName);

    if (referenceTo && referenceTo.firestore) {
      return isRealtime
        ? this.findRecordRealtime(modelName, referenceTo)
        : this.findRecord(referenceTo);
    }

    return docSnapshot;
  }

  private pushRecord(modelName: string, snapshot: DocumentSnapshot): void {
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

  private unloadRecord(modelName: string, id: string, path?: string): void {
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
      this.docListeners[key]();
      delete this.docListeners[key];
    }

    if (type === 'col' && this.colListeners[key]) {
      this.colListeners[key]();
      delete this.colListeners[key];
    }

    if (type === 'query' && this.queryListeners[key]) {
      this.queryListeners[key]();
      delete this.queryListeners[key];
    }

    if (type === 'hasMany' && this.hasManyListeners[key]) {
      this.hasManyListeners[key]();
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
