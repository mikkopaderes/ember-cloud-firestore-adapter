import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Serializer | cloud firestore', function(hooks) {
  setupTest(hooks);

  module('extractRelationship', function() {
    test('should extract a relationship given a document reference', function(assert) {
      assert.expect(1);

      // Arrange
      const serializer = this.owner.lookup('serializer:cloud-firestore');

      // Act
      const relationship = serializer.extractRelationship('user', {
        id: 'user_a',
        parent: { id: 'users' },
        firestore: {},
      });

      // Assert
      assert.deepEqual(relationship, { id: 'user_a', type: 'user' });
    });
  });

  module('extractRelationships', function() {
    // Hard to test due to `this._super()`
    test('nothing to test', function(assert) {
      assert.expect(1);

      assert.ok(this.owner.lookup('serializer:cloud-firestore'));
    });
  });

  module('serialize', function() {
    // Hard to test due to `this._super()`
    test('nothing to test', function(assert) {
      assert.expect(1);

      assert.ok(this.owner.lookup('serializer:cloud-firestore'));
    });
  });
});
