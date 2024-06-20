/*
  eslint
  @typescript-eslint/no-explicit-any: off
*/

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import type CloudFirestoreSerializer from 'ember-cloud-firestore-adapter/serializers/cloud-firestore-modular';

module('Unit | Serializer | cloud-firestore modular', function (hooks) {
  setupTest(hooks);

  module('extractRelationship()', function () {
    test('should return object containing the type and id of a relationship', function (assert) {
      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular') as CloudFirestoreSerializer;

      // Act
      const result = serializer.extractRelationship('user', {
        path: 'users/user_a',
        firestore: {},
      } as any);

      // Assert
      assert.deepEqual(result, { id: 'user_a', type: 'user' });
    });

    test('should return null when without any relationship hash', function (assert) {
      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular') as CloudFirestoreSerializer;

      // Act
      const result = serializer.extractRelationship('user', null as any);

      // Assert
      assert.deepEqual(result, null);
    });
  });

  module('extractRelationships()', function () {
    test('should return object containing manyToMany and manyToOne links', function (assert) {
      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular') as CloudFirestoreSerializer;
      const store = this.owner.lookup('service:store');
      serializer.store = store; // TODO: injected store on serializer is undefined in tests

      // Act
      const result = serializer.extractRelationships(store.modelFor('user') as any, {
        id: 'user_a',
        links: {},
      });

      // Assert
      assert.deepEqual(result, {
        groups: {
          links: {
            related: 'users/user_a/groups',
          },
        },
        posts: {
          links: {
            related: 'posts',
          },
        },
      });
    });
  });

  // NOTE: Other public methods are hard to test because they rely on private APIs from ember-data
});
