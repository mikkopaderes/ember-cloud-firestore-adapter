import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

import { click, find, findAll, visit } from 'ember-native-dom-helpers';

moduleForAcceptance('Acceptance | mirage');

test('should create record', async function(assert) {
  assert.expect(3);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="create-record"]');

  // Assert
  assert.equal(find('[data-test-id="new"]').textContent.trim(), 'new');
  assert.equal(find('[data-test-name="new"]').textContent.trim(), 'New User');
  assert.equal(find('[data-test-age="new"]').textContent.trim(), '25');
});

test('should update record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="update-record"]');

  // Assert
  assert.equal(find('[data-test-name="user_a"]').textContent.trim(), 'Updated');
});

test('should delete record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="delete-record"]');

  // Assert
  assert.notOk(find('[data-test-id="user_a"]'));
});

test('should find all record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="find-all"]');

  // Assert
  assert.equal(findAll('[data-test-id]').length, 5);
});

test('should find record', async function(assert) {
  assert.expect(1);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="find-record"]');

  // Assert
  assert.equal(find('[data-test-id="user_a"]').textContent.trim(), 'user_a');
});

test('should query with filter, sort (asc), startAt, and endAt', async function(assert) {
  assert.expect(3);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="query-1"]');

  // Assert
  const idElements = findAll('[data-test-id]');

  assert.equal(idElements.length, 2);
  assert.equal(idElements[0].textContent.trim(), 'user_e');
  assert.equal(idElements[1].textContent.trim(), 'user_a');
});

test('should query with filter, sort (asc), startAfter, and endBefore', async function(assert) {
  assert.expect(2);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="query-2"]');

  // Assert
  const idElements = findAll('[data-test-id]');

  assert.equal(idElements.length, 1);
  assert.equal(idElements[0].textContent.trim(), 'user_e');
});

test('should query with filter, sort (desc), startAt, endAt, and limit', async function(assert) {
  assert.expect(2);

  // Arrange
  await visit('/mirage');

  // Act
  await click('[data-test-button="query-3"]');

  // Assert
  const idElements = findAll('[data-test-id]');

  assert.equal(idElements.length, 1);
  assert.equal(idElements[0].textContent.trim(), 'user_a');
});
