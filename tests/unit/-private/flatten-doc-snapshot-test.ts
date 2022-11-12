import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { doc, getDoc, getFirestore } from 'ember-cloud-firestore-adapter/firebase/firestore';
import flattenDocSnapshot from 'ember-cloud-firestore-adapter/-private/flatten-doc-snapshot';

module('Unit | -Private | flatten-doc-snapshot-data', function (hooks) {
  setupTest(hooks);

  test('should return a merged doc snapshot ID and data in a single object', async function (assert) {
    // Arrange
    const db = getFirestore();

    const snapshot = await getDoc(doc(db, 'users/user_a'));

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
