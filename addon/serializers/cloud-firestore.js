import { inject as service } from '@ember/service';
import { typeOf } from '@ember/utils';
import JSONSerializer from '@ember-data/serializer/json';

import {
  buildCollectionName,
  buildPathFromRef,
  buildRefFromPath,
} from 'ember-cloud-firestore-adapter/utils/parser';

function isDocumentReference(value) {
  return typeOf(value) === 'object' && value.firestore;
}

export default class CloudFirestoreSerializer extends JSONSerializer {
  @service firebase;

  extractRelationship(relationshipModelName, relationshipHash) {
    if (isDocumentReference(relationshipHash)) {
      const path = buildPathFromRef(relationshipHash);
      const pathNodes = path.split('/');
      const belongsToId = pathNodes[pathNodes.length - 1];

      return { id: belongsToId, type: relationshipModelName };
    }

    return null;
  }

  extractRelationships(modelClass, resourceHash) {
    const links = {};

    modelClass.eachRelationship((name, descriptor) => {
      if (descriptor.kind === 'belongsTo') {
        if (
          Object.prototype.hasOwnProperty.call(resourceHash, name)
          && isDocumentReference(resourceHash[name])
        ) {
          const path = buildPathFromRef(resourceHash[name]);

          links[name] = path;
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

    resourceHash.links = links;

    return super.extractRelationships(modelClass, resourceHash);
  }

  serializeBelongsTo(snapshot, json, relationship) {
    super.serializeBelongsTo(snapshot, json, relationship);

    if (json[relationship.key]) {
      const collectionName = buildCollectionName(relationship.type);
      const docId = json[relationship.key];
      const path = `${collectionName}/${docId}`;

      json[relationship.key] = buildRefFromPath(this.firebase.firestore(), path);
    }
  }

  serialize(snapshot, ...args) {
    const json = super.serialize(snapshot, ...args);

    snapshot.eachRelationship((name, relationship) => {
      if (relationship.kind === 'hasMany') {
        delete json[name];
      }
    });

    return json;
  }
}
