import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import firebase from 'firebase/compat/app';

import { serverTimestamp } from 'ember-cloud-firestore-adapter/firebase/firestore';
import resetFixtureData from 'dummy/tests/helpers/reset-fixture-data';

module('Unit | Transform | timestamp', function (hooks) {
  let db: firebase.firestore.Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    db = this.owner.lookup('service:-firebase').firestore();

    await resetFixtureData(db);
  });

  hooks.afterEach(async function () {
    await resetFixtureData(db);
  });

  module('deserialize()', function () {
    test('should return result of value.toDate when value is an instance of firebase.firestore.Timestamp', async function (assert) {
      // Arrange
      const post = await db.doc('posts/post_a').get();
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.deserialize(post.get('createdOn'));

      // Assert
      assert.deepEqual(result, post.get('createdOn').toDate());
    });

    test('should return value as-is when it is not an instance of firebase.firestore.Timestamp', function (assert) {
      // Arrange
      const date = new Date();
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.deserialize(date);

      // Assert
      assert.deepEqual(result, date);
    });
  });

  module('serialize()', function () {
    test('should return the value as-is when value is instance of Date type', function (assert) {
      // Arrange
      const date = new Date();
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(date);

      // Assert
      assert.deepEqual(result, date);
    });

    test('should return a firestore server timestamp when value is not of Date type', function (assert) {
      // Arrange
      const transform = this.owner.lookup('transform:timestamp');

      // Act
      const result = transform.serialize(null);

      // Assert
      assert.deepEqual(result, serverTimestamp());
    });
  });
});
