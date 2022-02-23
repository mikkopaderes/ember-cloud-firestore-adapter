import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Store from '@ember-data/store';

import CloudFirestoreSerializer from 'ember-cloud-firestore-adapter/serializers/cloud-firestore-modular';

module('Unit | Serializer | cloud-firestore modular', function (hooks) {
  setupTest(hooks);

  module('extractRelationship()', function () {
    test('should return object containing the type and id of a relationship', function (assert) {
      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular');

      // Act
      const result = serializer.extractRelationship('user', {
        path: 'users/user_a',
        firestore: {},
      });

      // Assert
      assert.deepEqual(result, { id: 'user_a', type: 'user' });
    });

    test('should return null when without any relationship hash', function (assert) {
      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular');

      // Act
      const result = serializer.extractRelationship('user', null);

      // Assert
      assert.deepEqual(result, null);
    });

    test('should extract polymorphic relationships', function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store') as Store;
      const serializer = this.owner.lookup('serializer:cloud-firestore-modular') as CloudFirestoreSerializer;
      const payload = {
        id: 'event_a',
        owner: {
          path: 'users/user_a',
        },
        body: 'Test',
      };

      // Act
      const result = serializer.normalize(store.modelFor('event'), payload);

      // Assert
      assert.deepEqual(result, {
        data: {
          attributes: {
            body: 'Test',
          },
          id: 'event_a',
          relationships: {
            owner: {
              data: {
                id: 'user_a',
                type: 'user',
              },
            },
          },
          type: 'event',
        },
      });
    });
  });

  // NOTE: Other public methods are hard to test because they rely on private APIs from ember-data
});
