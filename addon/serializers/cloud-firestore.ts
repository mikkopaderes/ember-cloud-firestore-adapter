/*
  eslint
  @typescript-eslint/ban-types: off,
  ember/use-ember-data-rfc-395-imports: off,
  no-param-reassign: off,
*/

import { inject as service } from '@ember/service';
import { isNone } from '@ember/utils';
import DS from 'ember-data';
import JSONSerializer from '@ember-data/serializer/json';
import Store from '@ember-data/store';

import FirebaseService from 'ember-cloud-firestore-adapter/services/-firebase';
import firebase from 'firebase/compat/app';

import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';

interface Links {
  [key: string]: string;
}

interface ResourceHash {
  id: string;
  links: Links;
  [key: string]: string | Links | firebase.firestore.CollectionReference;
}

interface RelationshipDefinition {
  key: string;
  type: string;
  options: {
    buildReference?(db: firebase.firestore.Firestore): firebase.firestore.CollectionReference
  };
}

interface ModelClass {
  modelName: string;
  determineRelationshipType(descriptor: { kind: string, type: string }, store: Store): string;
  eachRelationship(callback: (name: string, descriptor: {
    kind: string,
    type: string,
  }) => void): void;
}

export default class CloudFirestoreSerializer extends JSONSerializer {
  @service('-firebase')
  private firebase!: FirebaseService;

  public extractRelationship(
    relationshipModelName: string,
    relationshipHash: firebase.firestore.DocumentReference,
  ): { id: string, type: string } | {} {
    if (isNone(relationshipHash)) {
      return super.extractRelationship(relationshipModelName, relationshipHash);
    }

    const pathNodes = relationshipHash.path.split('/');
    const belongsToId = pathNodes[pathNodes.length - 1];

    return { id: belongsToId, type: relationshipModelName };
  }

  public extractRelationships(modelClass: ModelClass, resourceHash: ResourceHash): {} {
    const newResourceHash = { ...resourceHash };
    const links: { [key: string]: string } = {};

    modelClass.eachRelationship((name, descriptor) => {
      if (descriptor.kind === 'belongsTo') {
        if (resourceHash[name]) {
          const data = resourceHash[name] as firebase.firestore.CollectionReference;

          links[name] = data.path;
        }
      } else {
        const cardinality = modelClass.determineRelationshipType(descriptor, this.store);
        let hasManyPath;

        if (cardinality === 'manyToOne') {
          hasManyPath = buildCollectionName(descriptor.type);
        } else {
          const collectionName = buildCollectionName(modelClass.modelName);
          const docId = resourceHash.id;

          hasManyPath = `${collectionName}/${docId}/${name}`;
        }

        links[name] = hasManyPath;
      }
    });

    newResourceHash.links = links;

    return super.extractRelationships(modelClass, newResourceHash);
  }

  public serializeBelongsTo(
    snapshot: DS.Snapshot,
    json: { [key: string]: string | null | firebase.firestore.DocumentReference },
    relationship: RelationshipDefinition,
  ): void {
    super.serializeBelongsTo(snapshot, json, relationship);

    if (json[relationship.key]) {
      const db = this.firebase.firestore();
      const docId = json[relationship.key] as string;

      if (relationship.options.buildReference) {
        json[relationship.key] = relationship.options.buildReference(db).doc(docId);
      } else {
        const collectionName = buildCollectionName(relationship.type);
        const path = `${collectionName}/${docId}`;

        json[relationship.key] = db.doc(path);
      }
    }
  }

  public serialize(snapshot: DS.Snapshot, options: {}): {} {
    const json: { [key: string]: unknown } = { ...super.serialize(snapshot, options) };

    snapshot.eachRelationship((name: string, relationship) => {
      if (relationship.kind === 'hasMany') {
        delete json[name];
      }
    });

    return json;
  }
}

declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    'cloud-firestore': CloudFirestoreSerializer;
  }
}
