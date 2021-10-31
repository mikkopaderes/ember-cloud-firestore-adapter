/* eslint ember/use-ember-data-rfc-395-imports: off */

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import ArrayProxy from '@ember/array/proxy';
import DS from 'ember-data';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import RSVP from 'rsvp';

import firebase from 'firebase/compat/app';
import sinon from 'sinon';

import RealtimeTracker from 'ember-cloud-firestore-adapter/-private/realtime-tracker';
import resetFixtureData from '../../helpers/reset-fixture-data';

module('Unit | -Private | realtime-tracker', function (hooks) {
  let db: firebase.firestore.Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    db = this.owner.lookup('service:-firebase').firestore();

    await resetFixtureData(db);
  });

  hooks.afterEach(async function () {
    await resetFixtureData(db);
  });

  module('trackFindRecordChanges()', function () {
    test('should not push record to store when called for the first time', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');

      const realtimeTracker = new RealtimeTracker(store);
      const docRef = db.doc('users/user_a');

      // Act
      realtimeTracker.trackFindRecordChanges('user', docRef);

      // Assert
      setTimeout(() => {
        assert.equal(store.peekRecord('user', 'user_a'), null);
        done();
      }, 500);
    });

    test('should push record to store when an update has been detected', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const realtimeTracker = new RealtimeTracker(store);
      const docRef = db.doc('users/user_a');
      const newName = Math.random();
      const storeFixture = {
        data: {
          id: 'user_a',
          type: 'user',
          attributes: {
            name: 'user_a',
          },
          relationships: {
            groups: {
              links: {
                related: 'users/user_a/groups',
              },
            },
            posts: {
              links: {
                related: 'posts',
              },
            },
            friends: {
              links: {
                related: 'users/user_a/friends',
              },
            },
          },
        },
      };

      store.push(storeFixture);

      // Act
      realtimeTracker.trackFindRecordChanges('user', docRef);

      setTimeout(async () => {
        await docRef.update({ name: newName });

        // Assert
        setTimeout(() => {
          assert.equal(store.peekRecord('user', 'user_a').name, newName);
          done();
        }, 500);
      }, 500);
    });

    test('should unload record from store when a delete has been detected', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const realtimeTracker = new RealtimeTracker(store);
      const docRef = db.doc('users/user_a');
      const storeFixture = {
        data: {
          id: 'user_a',
          type: 'user',
          attributes: {
            name: 'user_a',
          },
          relationships: {
            groups: {
              links: {
                related: 'users/user_a/groups',
              },
            },
            posts: {
              links: {
                related: 'posts',
              },
            },
            friends: {
              links: {
                related: 'users/user_a/friends',
              },
            },
          },
        },
      };

      store.push(storeFixture);

      // Act
      realtimeTracker.trackFindRecordChanges('user', docRef);

      setTimeout(async () => {
        await docRef.delete();

        // Assert
        setTimeout(() => {
          assert.equal(store.peekRecord('user', 'user_a'), null);
          done();
        }, 500);
      }, 500);
    });
  });

  module('trackFindAllChanges()', function () {
    test('should not find individual records via store when called for the first time', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const findRecordStub = sinon.stub(store, 'findRecord');
      const realtimeTracker = new RealtimeTracker(store);
      const collectionRef = db.collection('users');

      // Act
      realtimeTracker.trackFindAllChanges('user', collectionRef);

      // Assert
      setTimeout(() => {
        assert.ok(findRecordStub.notCalled);
        done();
      }, 500);
    });

    test('should find individual records via store when an update has been detected', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const findRecordStub = sinon.stub(store, 'findRecord');
      const realtimeTracker = new RealtimeTracker(store);
      const collectionRef = db.collection('users');

      // Act
      realtimeTracker.trackFindAllChanges('user', collectionRef);

      setTimeout(async () => {
        await db.doc('users/new_user').set({ name: 'new_user' });

        // Assert
        setTimeout(() => {
          assert.ok(findRecordStub.called);
          done();
        }, 500);
      }, 500);
    });
  });

  module('trackFindHasManyChanges()', function () {
    test('should not reload has many reference when called for the first time', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const reloadStub = sinon.stub().returns(Promise.resolve());

      sinon.stub(store, 'peekRecord').withArgs('user', 'user_a').returns({
        hasMany: sinon.stub().withArgs('groups').returns({ reload: reloadStub }),
      });

      const realtimeTracker = new RealtimeTracker(store);
      const collectionRef = db.collection('groups');

      // Act
      realtimeTracker.trackFindHasManyChanges('user', 'user_a', 'groups', collectionRef);

      // Assert
      setTimeout(() => {
        assert.ok(reloadStub.notCalled);
        done();
      }, 500);
    });

    test('should reload has many reference when an update was detected', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const reloadStub = sinon.stub().returns(Promise.resolve());

      sinon.stub(store, 'peekRecord').withArgs('user', 'user_a').returns({
        hasMany: sinon.stub().withArgs('groups').returns({ reload: reloadStub }),
      });

      const realtimeTracker = new RealtimeTracker(store);
      const collectionRef = db.collection('groups');

      // Act
      realtimeTracker.trackFindHasManyChanges('user', 'user_a', 'groups', collectionRef);

      setTimeout(async () => {
        await db.doc('groups/new_group').set({ name: 'new_group' });

        // Assert
        setTimeout(() => {
          assert.ok(reloadStub.called);
          done();
        }, 500);
      }, 500);
    });
  });

  module('trackQueryChanges()', function () {
    test('should not update record array when called for the first time', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const recordArray = {} as DS.AdapterPopulatedRecordArray<unknown>;
      const promiseArray = ArrayProxy.extend(PromiseProxyMixin);
      const updateStub = sinon.stub().returns(
        promiseArray.create({ promise: RSVP.Promise.resolve() }),
      );

      recordArray.update = updateStub;

      const realtimeTracker = new RealtimeTracker(store);
      const query = db.collection('groups').where('name', '==', 'new_group');

      // Act
      realtimeTracker.trackQueryChanges(query, recordArray);

      // Assert
      setTimeout(() => {
        assert.ok(updateStub.notCalled);
        done();
      }, 500);
    });

    test('should update record array when an update was detected', async function (assert) {
      // Arrange
      assert.expect(1);

      const done = assert.async();
      const store = this.owner.lookup('service:store');
      const recordArray = {} as DS.AdapterPopulatedRecordArray<unknown>;
      const promiseArray = ArrayProxy.extend(PromiseProxyMixin);
      const updateStub = sinon.stub().returns(
        promiseArray.create({ promise: RSVP.Promise.resolve() }),
      );

      recordArray.update = updateStub;

      const realtimeTracker = new RealtimeTracker(store);
      const query = db.collection('groups').where('name', '==', 'new_group');

      // Act
      realtimeTracker.trackQueryChanges(query, recordArray);

      setTimeout(async () => {
        await db.doc('groups/new_group').set({ name: 'new_group' });

        // Assert
        setTimeout(() => {
          assert.ok(updateStub.called);
          done();
        }, 500);
      }, 500);
    });
  });
});
