import { inject } from '@ember/service';
import { typeOf } from '@ember/utils';
import JSONSerializer from 'ember-data/serializers/json';

import {
  buildCollectionName,
  buildPathFromRef,
  buildRefFromPath,
} from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * @param {*} value
 * @return {boolean} True if is a document reference. Otherwise, false.
 */
function isDocumentReference(value) {
  return typeOf(value) === 'object' && value.firestore;
}

/**
 * @class CloudFirestore
 * @namespace Serializer
 * @extends DS.JSONSerializer
 */
export default JSONSerializer.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: inject(),

  /**
   * Overriden to convert a DocumentReference into an JSON API relationship object
   *
   * @override
   */
  extractRelationship(relationshipModelName, relationshipHash) {
    if (isDocumentReference(relationshipHash)) {
      const path = buildPathFromRef(relationshipHash);
      const pathNodes = path.split('/');
      const belongsToId = pathNodes[pathNodes.length - 1];

      return { id: belongsToId, type: relationshipModelName };
    }

    return null;
  },

  /**
   * Extended to add links for all relationship
   *
   * @override
   */
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

    return this._super(modelClass, resourceHash);
  },

  /**
   * Overriden to convert a belongs-to relationship to a DocumentReference
   *
   * @override
   */
  serializeBelongsTo(snapshot, json, relationship) {
    this._super(snapshot, json, relationship);

    if (json[relationship.key]) {
      const collectionName = buildCollectionName(relationship.type);
      const docId = json[relationship.key];
      const path = `${collectionName}/${docId}`;

      json[relationship.key] = buildRefFromPath(this.firebase.firestore(), path);
    }
  },

  /**
   * @override
   */
  serialize(snapshot, ...args) {
    const json = this._super(snapshot, ...args);

    snapshot.eachRelationship((name, relationship) => {
      if (relationship.kind === 'hasMany') {
        delete json[name];
      }
    });

    return json;
  },
});
