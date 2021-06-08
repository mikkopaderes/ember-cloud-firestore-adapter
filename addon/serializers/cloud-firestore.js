import JSONSerializer from 'ember-data/serializers/json';
import { inject } from '@ember/service';
import { typeOf } from '@ember/utils';

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

  buildCollectionName(modelName) {
    return buildCollectionName(modelName);
  },

  // getNamespace(snapshot) {
  //   return null;
  // },

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

      return {
        id: belongsToId,
        type: relationshipModelName,
        data: { docRef: relationshipHash }
      };
    }

    return this._super(...arguments);
  },

  /**
   * Extended to add links for a relationship that's derived from its
   * `Reference` value
   *
   * @override
   */
  extractRelationships(modelClass, resourceHash) {
    const links = {};

    modelClass.eachRelationship((name, relationship) => {
      if (relationship.kind === 'belongsTo') {
        const key = this.keyForRelationship(name, 'belongsTo', 'serialize');

        if (Object.prototype.hasOwnProperty.call(resourceHash, key)) {
          if (
            typeOf(resourceHash[key]) === 'object'
            && resourceHash[key].firestore
          ) {
            const path = buildPathFromRef(resourceHash[key]);

            links[name] = path;
          } else if (typeOf(resourceHash[key]) === 'string') {
            const path = resourceHash[key];

            links[name] = path;
          }
        } else if (resourceHash._docRefPath) {
          // Resolve relationships to parents via document path
          const collectionName = this.buildCollectionName(key);
          const path = this.getParentPath(resourceHash._docRefPath, collectionName);

          if (path) links[name] = path;
        }
      } else {
        let hasManyPath;

        const key = this.keyForRelationship(name, 'hasMany', 'serialize');

        if (relationship.meta.options.isReference) return;

        const cardinality = modelClass.determineRelationshipType(relationship, this.get('store'));

        if (cardinality === 'manyToOne') {
          resourceHash.modelName = modelClass.modelName;
          const collectionName = this.buildCollectionName(
            modelClass.modelName,
            resourceHash,
            relationship.meta,
          );

          // hasManyPath = pluralize(relationship.type);

          hasManyPath = collectionName;
        } else {
          const collectionName = this.buildCollectionName(modelClass.modelName);
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
      const collectionName = this.buildCollectionName(relationship.type, snapshot, relationship.meta);
      // const namespace = this.getNamespace(snapshot, collectionName);
      const docId = json[key];
      const path = [collectionName, docId].compact().join('/');
      // const path = [namespace, collectionName, docId].compact().join('/');

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
        const collectionName = this.buildCollectionName(relationship.type, snapshot, relationship.meta);
        // const namespace = this.getNamespace(snapshot, collectionName);
        const path = [collectionName, id].compact().join('/');
        // const path = [namespace, collectionName, id].compact().join('/');

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
      // We want to save hasMany references as well with the model
      if (relationship.kind === 'hasMany' && !relationship.options.isReference) {
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

  getParentPath(documentPath, parentType) {
    const pathArray = documentPath.split('/');
    const idx = pathArray.indexOf(parentType);

    if (idx === -1) return false;

    return pathArray.slice(0, idx + 2).join('/');
  },
});
