/*
  eslint
  no-param-reassign: off,
*/

import { isNone } from '@ember/utils';
import type DS from 'ember-data';
import { type ModelSchema } from 'ember-data';
import JSONSerializer from '@ember-data/serializer/json';
import type Store from '@ember-data/store';

import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';

import {
  doc,
  getFirestore,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';

interface Links {
  [key: string]: string;
}

interface ResourceHash {
  id: string;
  links: Links;
  [key: string]: string | Links | CollectionReference;
}

interface RelationshipDefinition {
  key: string;
  type: string;
  options: {
    buildReference?(db: Firestore, record: unknown): CollectionReference;
  };
}

type ModelClass = ModelSchema & {
  determineRelationshipType(
    descriptor: { kind: string; type: string },
    store: Store,
  ): string;
};

export default class CloudFirestoreSerializer extends JSONSerializer {
  public extractRelationship(
    relationshipModelName: string,
    relationshipHash: DocumentReference,
  ): { id: string; type: string } | Record<string, unknown> {
    if (isNone(relationshipHash)) {
      return super.extractRelationship(relationshipModelName, relationshipHash);
    }

    const pathNodes = relationshipHash.path.split('/');
    const belongsToId = pathNodes[pathNodes.length - 1];

    return { id: belongsToId, type: relationshipModelName };
  }

  public extractRelationships(
    modelClass: ModelClass,
    resourceHash: ResourceHash,
  ): Record<string, unknown> {
    const newResourceHash = { ...resourceHash };
    const links: { [key: string]: string } = {};

    modelClass.eachRelationship((name, descriptor) => {
      if (descriptor.kind === 'belongsTo') {
        if (resourceHash[name]) {
          const data = resourceHash[name] as CollectionReference;

          links[name] = data.path;
        }
      } else {
        const cardinality = modelClass.determineRelationshipType(
          descriptor,
          this.store,
        );
        let hasManyPath;

        if (cardinality === 'manyToOne') {
          hasManyPath = buildCollectionName(descriptor.type);
        } else {
          const collectionName = buildCollectionName(
            modelClass.modelName as string,
          );
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
    json: { [key: string]: string | null | DocumentReference },
    relationship: RelationshipDefinition,
  ): void {
    super.serializeBelongsTo(snapshot, json, relationship);

    if (json[relationship.key]) {
      const db = getFirestore();
      const docId = json[relationship.key] as string;

      if (relationship.options.buildReference) {
        json[relationship.key] = doc(
          relationship.options.buildReference(db, snapshot.record),
          docId,
        );
      } else {
        const collectionName = buildCollectionName(relationship.type);
        const path = `${collectionName}/${docId}`;

        json[relationship.key] = doc(db, path);
      }
    }
  }

  public serialize(
    snapshot: DS.Snapshot,
    options: Record<string, unknown>,
  ): Record<string, unknown> {
    const json: { [key: string]: unknown } = {
      ...super.serialize(snapshot, options),
    };

    snapshot.eachRelationship((name, relationship) => {
      if (relationship.kind === 'hasMany') {
        delete json[name as string];
      }
    });

    return json;
  }
}

declare module 'ember-data/types/registries/serializer' {
  export default interface SerializerRegistry {
    'cloud-firestore-modular': CloudFirestoreSerializer;
  }
}
