/*
  eslint
  @typescript-eslint/no-empty-function: off,
  ember/use-ember-data-rfc-395-imports: off
*/

import { next } from '@ember/runloop';
import DS from 'ember-data';
import Store from '@ember-data/store';

import firebase from 'firebase';

import flattenDocSnapshotData from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

interface Model {
  [key: string]: {
    record: {
      [key: string]: { hasOnSnapshotRunAtLeastOnce: boolean },
    },
    meta: { hasOnSnapshotRunAtLeastOnce: boolean, hasTrackedAllRecords: boolean },
  };
}

interface Query {
  [key: string]: {
    hasOnSnapshotRunAtLeastOnce: boolean,

    unsubscribe(): void,
  };
}

export default class RealtimeTracker {
  private model: Model = {};

  private query: Query = {};

  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  public trackFindRecordChanges(
    modelName: string,
    docRef: firebase.firestore.DocumentReference,
  ): void {
    const { id } = docRef;

    if (!this.isRecordTracked(modelName, id)) {
      this.trackModel(modelName);

      this.model[modelName].record[id] = { hasOnSnapshotRunAtLeastOnce: false };

      const unsubscribe = docRef.onSnapshot((docSnapshot) => {
        if (this.model[modelName].record[id].hasOnSnapshotRunAtLeastOnce) {
          if (docSnapshot.exists) {
            const record = this.store.peekRecord(modelName, id);

            if (record && !record.isSaving) {
              const flatRecord = flattenDocSnapshotData(docSnapshot);
              const normalizedRecord = this.store.normalize(modelName, flatRecord);

              this.store.push(normalizedRecord);
            }
          } else {
            unsubscribe();
            this.unloadRecord(modelName, id);
          }
        } else {
          this.model[modelName].record[id].hasOnSnapshotRunAtLeastOnce = true;
        }
      }, (error) => {
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

        delete this.model[modelName].record[id];
      });
    }
  }

  public trackFindAllChanges(
    modelName: string,
    collectionRef: firebase.firestore.CollectionReference,
  ): void {
    if (!this.model[modelName]?.meta.hasTrackedAllRecords) {
      this.trackModel(modelName);

      collectionRef.onSnapshot((querySnapshot) => {
        if (this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce) {
          querySnapshot.forEach((docSnapshot) => (
            this.store.findRecord(modelName, docSnapshot.id, {
              adapterOptions: { isRealtime: true },
            })
          ));
        } else {
          this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce = true;
        }
      }, () => {
        this.model[modelName].meta.hasTrackedAllRecords = false;
      });

      this.model[modelName].meta.hasTrackedAllRecords = true;
      this.model[modelName].meta.hasOnSnapshotRunAtLeastOnce = false;
    }
  }

  public trackFindHasManyChanges(
    modelName: string | number,
    id: string,
    field: string,
    collectionRef: firebase.firestore.CollectionReference | firebase.firestore.Query,
  ): void {
    const queryId = `${modelName}_${id}_${field}`;

    if (!Object.prototype.hasOwnProperty.call(this.query, queryId)) {
      this.query[queryId] = {
        hasOnSnapshotRunAtLeastOnce: false,
        unsubscribe: () => {},
      };
    }

    const unsubscribe = collectionRef.onSnapshot(() => {
      if (this.query[queryId].hasOnSnapshotRunAtLeastOnce) {
        // Schedule for next runloop to avoid race condition errors for when a record is unloaded
        // in the find record tracker because it was deleted in the database. Basically, we should
        // unload any deleted records first before refreshing the has-many array.
        next(() => {
          const hasManyRef = this.store.peekRecord(modelName, id).hasMany(field);

          hasManyRef.reload().then(() => this.query[queryId].unsubscribe());
        });
      } else {
        this.query[queryId].hasOnSnapshotRunAtLeastOnce = true;
      }
    }, () => delete this.query[queryId]);

    this.query[queryId].unsubscribe = unsubscribe;
  }

  public trackQueryChanges(
    firestoreQuery: firebase.firestore.Query,
    recordArray: DS.AdapterPopulatedRecordArray<unknown>,
    queryId?: string,
  ): void {
    const finalQueryId = queryId || Math.random().toString(32).slice(2).substr(0, 5);

    if (!Object.prototype.hasOwnProperty.call(this.query, finalQueryId)) {
      this.query[finalQueryId] = {
        hasOnSnapshotRunAtLeastOnce: false,
        unsubscribe: () => {},
      };
    }

    const unsubscribe = firestoreQuery.onSnapshot(() => {
      if (this.query[finalQueryId].hasOnSnapshotRunAtLeastOnce) {
        // Schedule for next runloop to avoid race condition errors for when a record is unloaded
        // in the find record tracker because it was deleted in the database. Basically, we should
        // unload any deleted records first before refreshing the query array.
        next(() => (
          recordArray.update().then(() => this.query[finalQueryId].unsubscribe())
        ));
      } else {
        this.query[finalQueryId].hasOnSnapshotRunAtLeastOnce = true;
      }
    }, () => delete this.query[finalQueryId]);

    this.query[finalQueryId].unsubscribe = unsubscribe;
  }

  private isRecordTracked(modelName: string, id: string): boolean {
    return this.model[modelName]?.record?.[id] !== undefined;
  }

  private trackModel(type: string): void {
    if (!Object.prototype.hasOwnProperty.call(this.model, type)) {
      this.model[type] = {
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

    delete this.model[modelName].record[id];
  }
}
