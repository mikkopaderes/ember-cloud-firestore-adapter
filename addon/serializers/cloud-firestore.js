import { inject } from '@ember/service';
import { pluralize } from 'ember-inflector';
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
  firestore: inject(),

  /**
   * Overriden to properly get the data of a `Reference` type relationship
   *
   * @override
   */
  extractRelationship(relationshipModelName, relationshipHash) {
    if (
      relationshipHash !== null
      && typeof relationshipHash === 'object'
      && relationshipHash.firestore
    ) {
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
        if (
          Object.prototype.hasOwnProperty.call(resourceHash, name)
          && resourceHash[name] !== null
          && typeof resourceHash[name] === 'object'
          && resourceHash[name].firestore
        ) {
          const path = buildPathFromRef(resourceHash[name]);

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

          hasManyPath = `${collectionName}/${docId}/${name}`;
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

    if (json[relationship.key]) {
      const collectionName = buildCollectionName(relationship.type);
      const docId = json[relationship.key];
      const path = `${collectionName}/${docId}`;

      if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
        json[relationship.key] = path;
      } else {
        json[relationship.key] = buildRefFromPath(this.get('firestore.instance'), path);
      }
    }
  },

  /**
   * @override
   */
  serializeHasMany(snapshot, json, relationship) {
    this._super(snapshot, json, relationship);

    if (json[relationship.key]) {
      const references = [];

      json[relationship.key].forEach((id) => {
        const collectionName = buildCollectionName(relationship.type);
        const path = `${collectionName}/${id}`;

        if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
          references.push(path);
        } else {
          references.push(buildRefFromPath(this.get('firestore.instance'), path));
        }
      });

      delete json[relationship.key];

      json[relationship.key] = references;
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
      && Object.prototype.hasOwnProperty.call(snapshot, key)
    ) {
      return snapshot.adapterOptions[key];
    }

    return null;
  },
});
