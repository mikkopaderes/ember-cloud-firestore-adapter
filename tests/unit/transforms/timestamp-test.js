import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import firebase from 'firebase';

module('Unit | Transform | timestamp', function(hooks) {
  setupTest(hooks);

  test('should deserialize to a Date when already a Date', function(assert) {
    assert.expect(1);

    // Arrange
    const date = new Date();
    const transform = this.owner.lookup('transform:timestamp');

    // Act
    const result = transform.deserialize(date);

    // Assert
    assert.deepEqual(result, date);
  });

  test('should deserialize reusing the Date transform when value is not a date', function(assert) {
    assert.expect(1);

    // Arrange
    const date = new Date();
    const transform = this.owner.lookup('transform:timestamp');

    // Act
    const result = transform.deserialize(date.getTime());

    // Assert
    assert.deepEqual(result, date);
  });

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
