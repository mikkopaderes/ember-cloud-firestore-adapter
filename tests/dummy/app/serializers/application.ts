import CloudFirestoreSerializer from 'ember-cloud-firestore-adapter/serializers/cloud-firestore-modular';

export default class ApplicationSerializer extends CloudFirestoreSerializer {}

// DO NOT DELETE: this is how TypeScript knows how to look up your serializers.
declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    application: ApplicationSerializer;
  }
}
