import { click, visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import firebase from 'firebase/compat/app';

import resetFixtureData from '../helpers/reset-fixture-data';

module('Acceptance | features', function (hooks) {
  let db: firebase.firestore.Firestore;

  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    db = this.owner.lookup('service:-firebase').firestore();

    await resetFixtureData(db);
  });

  hooks.afterEach(async function () {
    await resetFixtureData(db);
  });

  test('should create record with ID', async function (assert) {
    assert.expect(3);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="create-record-with-id"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id="new"]').hasText('new');
    assert.dom('[data-test-name="new"]').hasText('new_user_created_with_id');
    assert.dom('[data-test-age="new"]').hasText('25');
  });

  test('should create record without ID', async function (assert) {
    assert.expect(3);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="create-record-without-id"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id]').hasAnyText();
    assert.dom('[data-test-name]').hasText('new_user_created_without_id');
    assert.dom('[data-test-age]').hasText('30');
  });

  test('should be able to create record without belongs to relationship', async function (assert) {
    assert.expect(3);

    // Arrange
    await visit('/features');

    // Act
    await click(
      '[data-test-button="create-record-without-belongs-to-relationship"]'
    );

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id="user_a"]').hasText('user_a');
    assert.dom('[data-test-name="user_a"]').hasText('user_a');
    assert.dom('[data-test-age="user_a"]').hasNoText();
  });

  test('should be able to create record with belongs to build reference', async function (assert) {
    assert.expect(4);

    // Arrange
    await visit('/features');

    // Act
    await click(
      '[data-test-button="create-record-with-belongs-to-build-reference"]'
    );

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id="user_a"]').hasText('user_a');
    assert.dom('[data-test-name="user_a"]').hasText('user_a');
    assert.dom('[data-test-age="user_a"]').hasNoText();

    const createdRecord = await db.doc('posts/new_post').get();

    assert.strictEqual(
      createdRecord.get('publisher').path,
      'publishers/user_a'
    );
  });

  test('should update record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="update-record"]');

    // Assert
    await waitFor('[data-test-name]', { timeout: 5000 });
    assert.dom('[data-test-name="user_a"]').hasText('updated_user');
  });

  test('should delete record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="delete-record"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id="user-a"]').doesNotExist();
  });

  test('should find all record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="find-all"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id]').exists({ count: 3 });
  });

  test('should find record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="find-record"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id="user_a"]').hasText('user_a');
  });

  test('should query', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="query-1"]');

    // Assert
    await waitFor('[data-test-id]', { timeout: 5000 });
    assert.dom('[data-test-id]').exists({ count: 2 });
  });

  test('should return nothing when querying to a path that does not exist', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="query-2"]');

    // Assert
    try {
      await waitFor('[data-test-id]', { timeout: 5000 });
    } catch (e) {
      // Do nothing
    }

    assert.dom('[data-test-id]').doesNotExist();
  });
});
