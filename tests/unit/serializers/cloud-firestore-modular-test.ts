import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Serializer | cloud-firestore modular', function (hooks) {
  setupTest(hooks);

  module('extractRelationship()', function () {
    test('should return object containing the type and id of a relationship', function (assert) {
      // Arrange
      const serializer = this.owner.lookup(
        'serializer:cloud-firestore-modular'
      );

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
      const serializer = this.owner.lookup(
        'serializer:cloud-firestore-modular'
      );

      // Act
      const result = serializer.extractRelationship('user', null);

      // Assert
      assert.deepEqual(result, null);
    });
  });

  // NOTE: Other public methods are hard to test because they rely on private APIs from ember-data
});
