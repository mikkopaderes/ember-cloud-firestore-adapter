import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import firebase from 'firebase';

module('Unit | Transform | timestamp', function (hooks) {
  setupTest(hooks);

  module('deserialize()', function () {
    test('should return result of toDate', function (assert) {
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

  module('serialize()', function () {
    test('should return the value as-is when value is of type Date or null', function (assert) {
      // Arrange
      const date = new Date();
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(date);

      // Assert
      assert.equal(result, date);
    });

    test('should return a firestore server timestamp when value is not of Date type', function (assert) {
      // Arrange
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(null);

      // Assert
      assert.deepEqual(result, firebase.firestore.FieldValue.serverTimestamp());
    });

    test('should not serialize to Firebase server timestamp when deserialized value is null', function (assert) {
      assert.expect(1);

      // Arrange
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(null);

      // Assert
      assert.equal(result, null);
    });
  });
});
