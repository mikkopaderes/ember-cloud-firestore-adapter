import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import sinon from 'sinon';

import RealtimeTracker from 'dummy/utils/realtime-tracker';

module('Unit | Utility | realtime-tracker', function (hooks) {
  let db;

  setupTest(hooks);

  hooks.beforeEach(function () {
    db = this.owner.lookup('service:firebase').firestore();
  });

  module('function: trackFindRecordChanges', function () {
    test('should track find record changes', function (assert) {
      assert.expect(1);

      // Arrange
      const type = 'user';
      const docRef = db.doc('users/user_a');
      const store = {
        normalize: sinon.stub(),
        peekRecord: sinon.stub().returns({ isSaving: false }),
        push: sinon.stub(),
      };
      const realtimeTracker = new RealtimeTracker();

      // Act
      realtimeTracker.trackFindRecordChanges(type, docRef, store);

      // Assert
      assert.deepEqual(realtimeTracker.model.user.record.user_a, {
        hasOnSnapshotRunAtLeastOnce: false,
      });
    });
  });

  module('function: trackFindAllChanges', function () {
    test('should track find all changes', function (assert) {
      assert.expect(1);

      // Arrange
      const type = 'user';
      const collectionRef = db.collection('users');
      const store = {
        findRecord: sinon.stub(),
        normalize: sinon.stub(),
        push: sinon.stub(),
      };
      const realtimeTracker = new RealtimeTracker();

      // Act
      realtimeTracker.trackFindAllChanges(type, collectionRef, store);

      // Assert
      assert.deepEqual(realtimeTracker.model.user.meta, {
        isAllRecordsTracked: true,
        hasOnSnapshotRunAtLeastOnce: false,
      });
    });
  });

  module('function: trackFindHasManyChanges', function () {
    test('should track find has many changes', async function (assert) {
      assert.expect(1);

      // Arrange
      const type = 'user';
      const id = 'user_a';
      const relationship = { type: 'post', key: 'posts' };
      const collectionRef = db.collection('users');
      const store = {
        peekRecord: sinon.stub().returns({
          hasMany: sinon.stub().returns({ reload: sinon.stub().returns(Promise.resolve()) }),
        }),
      };
      const realtimeTracker = new RealtimeTracker();

      // Act
      realtimeTracker.trackFindHasManyChanges(type, id, relationship, collectionRef, store);

      // Assert
      assert.ok(Object.keys(realtimeTracker.query).length === 1);
    });
  });

  module('function: trackQueryChanges', function () {
    test('should track query changes', function (assert) {
      assert.expect(2);

      // Arrange
      const collectionRef = db.collection('users');
      const recordArray = { update: sinon.stub().returns(Promise.resolve()) };
      const queryId = 'foo';
      const realtimeTracker = new RealtimeTracker();

      // Act
      realtimeTracker.trackQueryChanges(collectionRef, recordArray, queryId);

      // Assert
      assert.equal(realtimeTracker.query.foo.hasOnSnapshotRunAtLeastOnce, false);
      assert.equal(typeof realtimeTracker.query.foo.unsubscribe, 'function');
    });
  });
});
