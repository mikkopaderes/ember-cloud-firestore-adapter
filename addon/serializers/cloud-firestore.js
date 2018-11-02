import { inject } from '@ember/service';
import { pluralize } from 'ember-inflector';
import { typeOf } from '@ember/utils';
import JSONSerializer from 'ember-data/serializers/json';

import {
  buildCollectionName,
  buildPathFromRef,
  buildRefFromPath,
} from 'ember-cloud-firestore-adapter/utils/parser';

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
  
  getNamespace(snapshot) {
    return null;
  },
  
  /**
   * Overriden to properly get the data of a `Reference` type relationship
   *
   * @override
   */
  extractRelationship(relationshipModelName, relationshipHash) {
    if (typeOf(relationshipHash) === 'object' && relationshipHash.firestore) {
      const path = buildPathFromRef(relationshipHash);
      const pathNodes = path.split('/');
      const belongsToId = pathNodes[pathNodes.length - 1];

      return { id: belongsToId, type: relationshipModelName };
    }

    return null;
  },

  /**
   * Extended to add links for a relationship that's derived from its
   * `Reference` value
   *
   * @override
   */
  extractRelationships(modelClass, resourceHash) {
    const links = {};

    modelClass.eachRelationship((name, descriptor) => {
      if (descriptor.kind === 'belongsTo') {
        const key = this.keyForRelationship(name, 'belongsTo', 'serialize');
        
        if (
          Object.prototype.hasOwnProperty.call(resourceHash, key)
          && typeOf(resourceHash[key]) === 'object'
          && resourceHash[key].firestore
        ) {
          const path = buildPathFromRef(resourceHash[key]);

          links[name] = path;
        }
      } else {
        const cardinality = modelClass.determineRelationshipType(descriptor, this.get('store'));
        let hasManyPath;

        if (cardinality === 'manyToOne') {
          hasManyPath = pluralize(descriptor.type);
        } else {
          const collectionName = buildCollectionName(modelClass.modelName);
          const docId = resourceHash.id;

          hasManyPath = [collectionName, docId, name].compact().join('/');
        }

        links[name] = hasManyPath;
      }
    });

    resourceHash.links = links;

    return this._super(modelClass, resourceHash);
  },

  /**
   * @override
   */
  serializeBelongsTo(snapshot, json, relationship) {
    this._super(snapshot, json, relationship);
    
    const key = this.keyForRelationship(relationship.key, 'belongsTo', 'serialize');
    
    if (json[key]) {
      const namespace = this.getNamespace(snapshot);
      const collectionName = buildCollectionName(relationship.type);
      const docId = json[key];
      const path = [namespace, collectionName, docId].compact().join('/');

      if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
        json[key] = path;
      } else {
        json[key] = buildRefFromPath(this.get('firebase').firestore(), path);
      }
    }
  },

  /**
   * @override
   */
  serializeHasMany(snapshot, json, relationship) {
    this._super(snapshot, json, relationship);
    
    const key = this.keyForRelationship(relationship.key, 'hasMany', 'serialize');

    if (json[key]) {
      const references = [];

      json[key].forEach((id) => {
        const namespace = this.getNamespace(snapshot);
        const collectionName = buildCollectionName(relationship.type);
        const path = [namespace, collectionName, id].compact().join('/');

        if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
          references.push(path);
        } else {
          references.push(buildRefFromPath(this.get('firebase').firestore(), path));
        }
      });

      delete json[key];

      json[key] = references;
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

  /**
   * @param {Object} snapshot
   * @param {string} key
   * @return {*} Attribute value
   * @function
   * @private
   */
  getAdapterOptionAttribute(snapshot, key) {
    if (
      snapshot.adapterOptions
      && Object.prototype.hasOwnProperty.call(snapshot.adapterOptions, key)
    ) {
      return snapshot.adapterOptions[key];
    }

    return null;
  },
});
