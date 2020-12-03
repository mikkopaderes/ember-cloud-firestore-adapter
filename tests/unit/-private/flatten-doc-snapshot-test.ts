import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

module('Unit | -Private | flatten-doc-snapshot-data', function (hooks) {
  setupTest(hooks);

  test('should return a merged doc snapshot ID and data in a single object', async function (assert) {
    // Arrange
    const firebase = this.owner.lookup('service:firebase');
    const db = firebase.firestore();

    db.useEmulator('localhost', 8080);

    const snapshot = await db.doc('users/user_a').get();

    // Act
    const result = flattenDocSnapshot(snapshot);

    // Assert
    assert.deepEqual(result, {
      age: 15,
      id: 'user_a',
      name: 'user_a',
      username: 'user_a',
    });
  });
});
