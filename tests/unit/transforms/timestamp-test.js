import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import firebase from 'firebase';

module('Unit | Transform | timestamp', function(hooks) {
  setupTest(hooks);

  module('function: deserialize', function() {
    test('should deserialize firestore timestamp', function(assert) {
      assert.expect(1);

      // Arrange
      const timestamp = {
        toDate() {
          return 'foo';
        },
      };
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.deserialize(timestamp);

      // Assert
      assert.equal(result, 'foo');
    });
  });

  module('function: serialize', function() {
    test('should serialize to Firebase server timestamp when deserialized value isn\'t a date', function(assert) {
      assert.expect(1);

      // Arrange
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(null);

      // Assert
      assert.deepEqual(result, firebase.firestore.FieldValue.serverTimestamp());
    });

    test('should not serialize to Firebase server timestamp when deserialized value is a date', function(assert) {
      assert.expect(1);

      // Arrange
      const date = new Date();
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(date);

      // Assert
      assert.equal(result, date);
    });
  });
});
