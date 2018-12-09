import { click, visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import { mockFirebase } from 'ember-cloud-firestore-adapter/test-support';
import getFixtureData from '../helpers/fixture-data';

module('Acceptance | features', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockFirebase(this.owner, getFixtureData());
  });

  test('should create record', async function (assert) {
    assert.expect(3);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="create-record"]');

    // Assert
    await waitFor('[data-test-id]'); // FIXME: Shouldn't be necessary
    assert.dom('[data-test-id="new"]').hasText('new');
    assert.dom('[data-test-username="new"]').hasText('new_user');
    assert.dom('[data-test-age="new"]').hasText('25');
  });

  test('should update record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="update-record"]');

    // Assert
    await waitFor('[data-test-username]'); // FIXME: Shouldn't be necessary
    assert.dom('[data-test-username="user_a"]').hasText('updated_user');
  });

  test('should delete record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="delete-record"]');

    // Assert
    await waitFor('[data-test-id]'); // FIXME: Shouldn't be necessary
    assert.dom('[data-test-id="user-a"]').doesNotExist();
  });

  test('should find all record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="find-all"]');

    // Assert
    await waitFor('[data-test-id]'); // FIXME: Shouldn't be necessary
    assert.dom('[data-test-id]').exists({ count: 3 });
  });

  test('should find record', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="find-record"]');

    // Assert
    await waitFor('[data-test-id]'); // FIXME: Shouldn't be necessary
    assert.dom('[data-test-id="user_a"]').hasText('user_a');
  });

  test('should query', async function (assert) {
    assert.expect(1);

    // Arrange
    await visit('/features');

    // Act
    await click('[data-test-button="query-1"]');

    // Assert
    await waitFor('[data-test-id]'); // FIXME: Shouldn't be necessary
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
      await waitFor('[data-test-id]', { timeout: 5000 }); // FIXME: Shouldn't be necessary
    } catch (e) {
      // Do nothing
    }

    assert.dom('[data-test-id]').doesNotExist();
  });
});
