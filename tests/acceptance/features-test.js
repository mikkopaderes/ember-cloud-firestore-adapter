import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | features');

test('should create record', async function(assert) {
  assert.expect(3);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="create-record"]');

  // Assert
  assert.dom('[data-test-id="new"]').hasText('new');
  assert.dom('[data-test-username="new"]').hasText('new_user');
  assert.dom('[data-test-age="new"]').hasText('25');
});

test('should update record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="update-record"]');

  // Assert
  assert.dom('[data-test-username="user_a"]').hasText('updated_user');
});

test('should delete record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="delete-record"]');

  // Assert
  assert.dom('[data-test-id="user-a"]').doesNotExist();
});

test('should find all record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="find-all"]');

  // Assert
  assert.dom('[data-test-id]').exists({ count: 3 });
});

test('should find record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="find-record"]');

  // Assert
  assert.dom('[data-test-id="user_a"]').hasText('user_a');
});

test('should query', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="query-1"]');

  // Assert
  assert.dom('[data-test-id]').exists({ count: 2 });
});

test('should return nothing when querying to a path that does not exist', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/features');

  // Act
  await click('[data-test-button="query-2"]');

  // Assert
  assert.dom('[data-test-id]').doesNotExist();
});
