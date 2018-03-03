import { pluralize } from 'ember-inflector';
import JSONSerializer from 'ember-data/serializers/json';

import { buildPathFromRef } from 'ember-cloud-firestore-adapter/utils/parser';

/**
 * @class CloudFirestore
 * @namespace Serializer
 * @extends DS.JSONSerializer
 */
export default JSONSerializer.extend({
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
          resourceHash.hasOwnProperty(name)
          && resourceHash[name] !== null
          && typeof resourceHash[name] === 'object'
          && resourceHash[name].firestore
        ) {
          const path = buildPathFromRef(resourceHash[name]);

          links[name] = path;
        }
      } else {
        const cardinality = modelClass.determineRelationshipType(
          descriptor,
          this.get('store'),
        );
        let hasManyPath;

        if (cardinality === 'manyToOne') {
          hasManyPath = pluralize(descriptor.type);
        } else {
          const path = buildPathFromRef(resourceHash.cloudFirestoreReference);

          hasManyPath = `${path}/${name}`;
        }

        links[name] = hasManyPath;
      }
    });

    resourceHash.links = links;

    return this._super(modelClass, resourceHash);
  },

  /**
   * Overriden to delete cloudFirestoreReference attribute
   *
   * @override
   */
  serialize(snapshot, options) {
    const data = this._super(snapshot, options);

    delete data.cloudFirestoreReference;

    return data;
  },

  /**
   * @override
   */
  serializeBelongsTo(snapshot, json, relationship) {
    this._super(snapshot, json, relationship);

    if (json[relationship.key]) {
      const record = this.get('store').peekRecord(
        relationship.type,
        json[relationship.key],
      );

      // Don't include the relationship in the payload if we can't
      // get its cloud firestore reference.
      if (record) {
        if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
          json[relationship.key] = buildPathFromRef(
            record.get('cloudFirestoreReference'),
          );
        } else {
          json[relationship.key] = record.get('cloudFirestoreReference');
        }
      } else {
        delete json[relationship.key];
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
        const record = this.get('store').peekRecord(relationship.type, id);

        if (record) {
          if (this.getAdapterOptionAttribute(snapshot, 'onServer')) {
            references.push(buildPathFromRef(
              record.get('cloudFirestoreReference'),
            ));
          } else {
            references.push(record.get('cloudFirestoreReference'));
          }
        }
      });

      delete json[relationship.key];

      json[relationship.key] = references;
    }
  },

  /**
   * Returns an attribute from the snapshot adapter options if it exists
   *
   * @param {Object} snapshot
   * @param {string} key
   * @return {*} Attribute value
   * @private
   */
  getAdapterOptionAttribute(snapshot, key) {
    if (
      snapshot.adapterOptions
      && snapshot.adapterOptions.hasOwnProperty(key)
    ) {
      return snapshot['adapterOptions'][key];
    }

    return null;
  },
});
