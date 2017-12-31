import { camelize } from '@ember/string';
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
      relationshipHash !== null &&
      typeof relationshipHash === 'object' &&
      relationshipHash.hasOwnProperty('firestore')
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
          resourceHash.hasOwnProperty(name) &&
          resourceHash[name] !== null &&
          typeof resourceHash[name] === 'object' &&
          resourceHash[name].hasOwnProperty('firestore')
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
   * Extended to return an array for Cloud Firestore batch writing
   *
   * e.g.
   *
   * For a post model of
   *
   * ```javascript
   * import { belongsTo, hasMany } from 'ember-data/relationships';
   * import Model from 'ember-data/model';
   * import attr from 'ember-data/attr';
   *
   * export default Model.extend({
   *   title: attr('string'),
   *   body: attr('string'),
   *   author: belongsTo('user'),
   *   comments: hasMany('comment'),
   * });
   * ```
   *
   * And a post record that's initially serialized to
   *
   * ```javascript
   * post = {
   *   id: 'post_a',
   *   title: 'Foo',
   *   body: 'Bar',
   *   author: 'user_a',
   *   likes: ['user_a', 'user_b'],
   * }
   * ```
   *
   * The output would be
   *
   * ```javascript
   * serializedPayloads = [{
   *   id: 'post_a',
   *   path: '<path to post (e.g. groups/posts)>',
   *   data: {
   *     title: 'Foo',
   *     body: 'Bar',
   *     author: <cloud firestore reference to user_a document>,
   *   }
   * }, {
   *   id: 'user_a',
   *   path: '<path to post likes (e.g. groups/posts/likes)>',
   *   data: {
   *     cloudFirestoreReference: <reference to user_a document>
   *   }
   * }, {
   *   id: 'user_b',
   *   path: '<path to post likes (e.g. groups/posts/likes)>',
   *   data: {
   *     cloudFirestoreReference: <reference to user_a document>
   *   }
   * }]
   * ```
   *
   * @override
   */
  serialize(snapshot, options) {
    const mainData = this._super(snapshot, options);

    if (!this.getAdapterOptionAttribute(snapshot, 'onServer')) {
      const mainPath = this.getPath(snapshot);

      const payloads = [{
        id: mainData.id,
        path: mainPath,
        data: mainData,
      }];

      delete mainData.id;
      delete mainData.cloudFirestoreReference;

      snapshot.eachRelationship((name, relationship) => {
        if (relationship.kind === 'hasMany') {
          if (mainData[name]) {
            mainData[name].forEach((reference) => {
              const record = this.get('store').peekRecord(
                relationship.type,
                reference.id,
              );

              payloads.push({
                id: reference.id,
                path: `${mainPath}/${payloads[0].id}/${name}`,
                data: {
                  cloudFirestoreReference: record.get('cloudFirestoreReference'),
                },
              });
            });

            delete mainData[name];
          }
        }
      });

      this.serializeBatch(snapshot, payloads);

      return payloads;
    }

    delete mainData.cloudFirestoreReference;

    return mainData;
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
   * Serializes extra data for batch write
   *
   * @param {DS.Snapshot} snapshot
   * @param {Array} payloads
   * @private
   */
  serializeBatch(snapshot, payloads) {
    const batch = this.getAdapterOptionAttribute(snapshot, 'batch');

    if (batch) {
      batch.forEach((payload) => {
        payloads.push(payload);
      });
    }
  },

  /**
   * Gets the path of a snapshot
   *
   * @param {DS.Snapshot} snapshot
   * @return {string} Path
   * @private
   */
  getPath(snapshot) {
    const path = this.getAdapterOptionAttribute(snapshot, 'path');

    if (path) {
      return path;
    } else {
      const record = this.get('store').peekRecord(
        snapshot.modelName,
        snapshot.id,
      );

      if (record.get('cloudFirestoreReference')) {
        const path = buildPathFromRef(record.get('cloudFirestoreReference'));
        const pathNodes = path.split('/');

        pathNodes.pop();

        return pathNodes.join('/');
      }
    }

    return camelize(pluralize(snapshot.modelName));
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
      snapshot.adapterOptions &&
      snapshot.adapterOptions.hasOwnProperty(key)
    ) {
      return snapshot['adapterOptions'][key];
    }

    return null;
  },
});
