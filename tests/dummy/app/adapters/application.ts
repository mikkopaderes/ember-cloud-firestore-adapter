import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore-modular';

export default class ApplicationAdapter extends CloudFirestoreAdapter { }

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    'application': ApplicationAdapter;
  }
}
