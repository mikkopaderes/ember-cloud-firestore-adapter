/*
  eslint
  @typescript-eslint/no-empty-function: off,
  ember/use-ember-data-rfc-395-imports: off
*/

import { next } from '@ember/runloop';
import DS from 'ember-data';
import Store from '@ember-data/store';

import {
  CollectionReference,
  DocumentReference,
  Query,
} from 'firebase/firestore';

import { onSnapshot } from 'ember-cloud-firestore-adapter/firebase/firestore';
import flattenDocSnapshotData from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

interface ModelTracker {
  [key: string]: {
    record: {
      [key: string]: { hasOnSnapshotRunAtLeastOnce: boolean };
    };
    meta: {
      hasOnSnapshotRunAtLeastOnce: boolean;
      hasTrackedAllRecords: boolean;
    };
  };
}

interface QueryTracker {
  [key: string]: {
    hasOnSnapshotRunAtLeastOnce: boolean;

    unsubscribe(): void;
  };
}

export default class RealtimeTracker {
  private modelTracker: ModelTracker = {};

  private queryTracker: QueryTracker = {};

  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  public trackFindRecordChanges(
    modelName: string,
    docRef: DocumentReference
  ): void {
    const { id } = docRef;

    if (!this.isRecordTracked(modelName, id)) {
      this.trackModel(modelName);

      this.modelTracker[modelName].record[id] = {
        hasOnSnapshotRunAtLeastOnce: false,
      };

      const unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          if (
            this.modelTracker[modelName].record[id].hasOnSnapshotRunAtLeastOnce
          ) {
            if (docSnapshot.exists()) {
              const record = this.store.peekRecord(modelName, id);

              if (record && !record.isSaving) {
                const flatRecord = flattenDocSnapshotData(docSnapshot);
                const normalizedRecord = this.store.normalize(
                  modelName,
                  flatRecord
                );

                this.store.push(normalizedRecord);
              }
            } else {
              unsubscribe();
              this.unloadRecord(modelName, id);
            }
          } else {
            this.modelTracker[modelName].record[
              id
            ].hasOnSnapshotRunAtLeastOnce = true;
          }
        },
        (error) => {
          const record = this.store.peekRecord(modelName, id);

          if (record) {
            // When we lose permission to view the document, we unload it from the store. However,
            // any template that has rendered the record will still be intact even if it no longer
            // exists in the store.
            //
            // We set some properties here to give our templates the opportunity to react to this
            // scenario.
            record.set('isUnloaded', true);
            record.set('unloadReason', error);
            this.unloadRecord(modelName, id);
          }

          delete this.modelTracker[modelName].record[id];
        }
      );
    }
  }

  public trackFindAllChanges(
    modelName: string,
    collectionRef: CollectionReference
  ): void {
    if (!this.modelTracker[modelName]?.meta.hasTrackedAllRecords) {
      this.trackModel(modelName);

      onSnapshot(
        collectionRef,
        (querySnapshot) => {
          if (this.modelTracker[modelName].meta.hasOnSnapshotRunAtLeastOnce) {
            querySnapshot.forEach((docSnapshot) =>
              this.store.findRecord(modelName, docSnapshot.id, {
                adapterOptions: { isRealtime: true },
              })
            );
          } else {
            this.modelTracker[modelName].meta.hasOnSnapshotRunAtLeastOnce =
              true;
          }
        },
        () => {
          this.modelTracker[modelName].meta.hasTrackedAllRecords = false;
        }
      );

      this.modelTracker[modelName].meta.hasTrackedAllRecords = true;
      this.modelTracker[modelName].meta.hasOnSnapshotRunAtLeastOnce = false;
    }
  }

  public trackFindHasManyChanges(
    modelName: string | number,
    id: string,
    field: string,
    collectionRef: CollectionReference | Query
  ): void {
    const queryId = `${modelName}_${id}_${field}`;

    if (!Object.prototype.hasOwnProperty.call(this.queryTracker, queryId)) {
      this.queryTracker[queryId] = {
        hasOnSnapshotRunAtLeastOnce: false,
        unsubscribe: () => {},
      };
    }

    const unsubscribe = onSnapshot(
      collectionRef,
      () => {
        if (this.queryTracker[queryId].hasOnSnapshotRunAtLeastOnce) {
          // Schedule for next runloop to avoid race condition errors for when a record is unloaded
          // in the find record tracker because it was deleted in the database. Basically, we should
          // unload any deleted records first before refreshing the has-many array.
          next(() => {
            const hasManyRef = this.store
              .peekRecord(modelName, id)
              .hasMany(field);

            hasManyRef
              .reload()
              .then(() => this.queryTracker[queryId].unsubscribe());
          });
        } else {
          this.queryTracker[queryId].hasOnSnapshotRunAtLeastOnce = true;
        }
      },
      () => delete this.queryTracker[queryId]
    );

    this.queryTracker[queryId].unsubscribe = unsubscribe;
  }

  public trackQueryChanges(
    firestoreQuery: Query,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
    queryId?: string
  ): void {
    const finalQueryId =
      queryId || Math.random().toString(32).slice(2).substr(0, 5);

    if (
      !Object.prototype.hasOwnProperty.call(this.queryTracker, finalQueryId)
    ) {
      this.queryTracker[finalQueryId] = {
        hasOnSnapshotRunAtLeastOnce: false,
        unsubscribe: () => {},
      };
    }

    const unsubscribe = onSnapshot(
      firestoreQuery,
      () => {
        if (this.queryTracker[finalQueryId].hasOnSnapshotRunAtLeastOnce) {
          // Schedule for next runloop to avoid race condition errors for when a record is unloaded
          // in the find record tracker because it was deleted in the database. Basically, we should
          // unload any deleted records first before refreshing the query array.
          next(() =>
            recordArray
              .update()
              .then(() => this.queryTracker[finalQueryId].unsubscribe())
          );
        } else {
          this.queryTracker[finalQueryId].hasOnSnapshotRunAtLeastOnce = true;
        }
      },
      () => delete this.queryTracker[finalQueryId]
    );

    this.queryTracker[finalQueryId].unsubscribe = unsubscribe;
  }

  private isRecordTracked(modelName: string, id: string): boolean {
    return this.modelTracker[modelName]?.record?.[id] !== undefined;
  }

  private trackModel(type: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.modelTracker, type)) {
      this.modelTracker[type] = {
        meta: {
          hasOnSnapshotRunAtLeastOnce: false,
          hasTrackedAllRecords: false,
        },
        record: {},
      };
    }
  }

  private unloadRecord(modelName: string, id: string): void {
    const record = this.store.peekRecord(modelName, id);

    if (record && !record.isSaving) {
      this.store.unloadRecord(record);
    }

    delete this.modelTracker[modelName].record[id];
  }
}
