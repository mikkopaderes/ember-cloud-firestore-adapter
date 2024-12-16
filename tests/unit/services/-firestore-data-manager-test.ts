import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { waitUntil } from '@ember/test-helpers';
import DS from 'ember-data';
import RSVP from 'rsvp';

import type { Firestore } from 'firebase/firestore';
import sinon from 'sinon';
import type { Collection } from '@ember-data/store/-private/record-arrays/identifier-array';

import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  query,
  updateDoc,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import resetFixtureData from '../../helpers/reset-fixture-data';

module('Unit | Service | -firestore-data-manager', function (hooks) {
  let db: Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    db = getFirestore();

    await resetFixtureData(db);
  });

  module('findRecordRealtime()', function () {
    test('should return fetched record', async function (assert) {
      // Arrange
      const modelName = 'user';
      const docRef = doc(db, 'users', 'user_a');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.findRecordRealtime(
        modelName,
        docRef,
      );

      // Assert
      assert.strictEqual(result.id, 'user_a');
      assert.deepEqual(result.data(), {
        name: 'user_a',
        age: 15,
        username: 'user_a',
      });
    });

    test('should push record to store when doc gets updated', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const pushSpy = sinon.spy(store, 'push');
      const modelName = 'user';
      const docRef = doc(db, 'users', 'user_a');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.findRecordRealtime(modelName, docRef);
      await updateDoc(docRef, { name: 'new_user_a' });

      // Assert
      await waitUntil(() => pushSpy.calledOnce);
      assert.ok(true);
    });

    test('should unload record from store when doc gets deleted', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const unloadRecordSpy = sinon.spy(store, 'unloadRecord');
      const modelName = 'user';
      const docRef = doc(db, 'users', 'user_a');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.findRecordRealtime(modelName, docRef);
      await updateDoc(docRef, { name: 'new_user_a' });
      await deleteDoc(docRef);

      // Assert
      await waitUntil(() => unloadRecordSpy.called);
      assert.ok(true);
    });
  });

  module('findAllRealtime()', function () {
    test('should return fetched records', async function (assert) {
      // Arrange
      const modelName = 'user';
      const colRef = collection(db, 'users');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.findAllRealtime(
        modelName,
        colRef,
      );

      // Assert
      assert.strictEqual(result.size, 3);
      assert.strictEqual(result.docs[0]?.id, 'user_a');
      assert.deepEqual(result.docs[0]?.data(), {
        name: 'user_a',
        age: 15,
        username: 'user_a',
      });
    });

    test('should push every record to store when collection gets updated', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const pushSpy = sinon.spy(store, 'push');
      const modelName = 'user';
      const docRef = doc(db, 'users', 'user_a');
      const colRef = collection(db, 'users');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.findAllRealtime(modelName, colRef);
      await updateDoc(docRef, { name: 'new_user_a' });

      // Assert
      await waitUntil(() => pushSpy.calledThrice);
      assert.ok(true);
    });

    test('should unload every record from store when doc gets deleted', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const unloadRecordSpy = sinon.spy(store, 'unloadRecord');
      const modelName = 'user';
      const docRef = doc(db, 'users', 'user_a');
      const colRef = collection(db, 'users');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.findAllRealtime(modelName, colRef);
      await updateDoc(docRef, { name: 'new_user_a' });
      await deleteDoc(docRef);

      // Assert
      await waitUntil(() => unloadRecordSpy.calledOnce);
      assert.ok(true);
    });
  });

  module('queryRealtime()', function () {
    test('should return fetched records', async function (assert) {
      // Arrange
      const colRef = collection(db, 'users');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        referenceKeyName: 'referenceTo',
        recordArray: {
          update: () =>
            DS.PromiseArray.create({ promise: RSVP.Promise.resolve([]) }),
        } as Collection,
      };
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.queryRealtime(config);

      // Assert
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0]?.id, 'user_a');
      assert.deepEqual(result[0]?.data(), {
        name: 'user_a',
        age: 15,
        username: 'user_a',
      });
    });

    test('should return fetched records with referenceTo indicators', async function (assert) {
      // Arrange
      const colRef = collection(db, 'users/user_a/groups');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        referenceKeyName: 'referenceTo',
        recordArray: {
          update: () =>
            DS.PromiseArray.create({ promise: RSVP.Promise.resolve([]) }),
        } as Collection,
      };
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.queryRealtime(config);

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'group_a');
      assert.deepEqual(result[0]?.data(), { name: 'group_a' });
    });

    test('should update record array when query gets updated', async function (assert) {
      // Arrange
      const docRef = doc(db, 'users', 'user_a');
      const colRef = collection(db, 'users');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        referenceKeyName: 'referenceTo',
        queryId: 'test',
        recordArray: {
          update: () =>
            DS.PromiseArray.create({ promise: RSVP.Promise.resolve([]) }),
        } as Collection,
      };
      const updateSpy = sinon.spy(config.recordArray, 'update');
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.queryRealtime(config);
      await updateDoc(docRef, { name: 'new_user_a' });

      // Assert
      await waitUntil(() => updateSpy.calledOnce);
      assert.ok(true);
    });
  });

  module('findHasManyRealtime()', function () {
    test('should return fetched records', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');

      // Pre-fetch so that peekRecord works
      await store.findRecord('user', 'user_a');

      const colRef = collection(db, 'users/user_a/feeds');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        id: 'user_a',
        field: 'posts',
        referenceKeyName: 'referenceTo',
      };
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.findHasManyRealtime(config);

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'post_b');
      assert.deepEqual(result[0]?.get('title'), 'post_b');
    });

    test('should return fetched records with referenceTo indicators', async function (assert) {
      // Arrange
      const colRef = collection(db, 'users/user_a/groups');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        id: 'user_a',
        field: 'groups',
        referenceKeyName: 'referenceTo',
      };
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.findHasManyRealtime(config);

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'group_a');
      assert.deepEqual(result[0]?.data(), { name: 'group_a' });
    });

    test('should reload has-many reference when query gets updated', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const reloadStub = sinon.stub().returns(Promise.resolve());

      sinon
        .stub(store, 'peekRecord')
        // @ts-expect-error method overloads
        .withArgs('user', 'user_a')
        .returns({
          hasMany: sinon
            .stub()
            .withArgs('groups')
            .returns({ reload: reloadStub }),
        });

      const docRef = doc(db, 'users/user_a/groups', 'group_a');
      const colRef = collection(db, 'users/user_a/groups');
      const queryRef = query(colRef);
      const config = {
        queryRef,
        modelName: 'user',
        id: 'user_a',
        field: 'groups',
        referenceKeyName: 'referenceTo',
      };
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      await firestoreDataManager.findHasManyRealtime(config);
      await updateDoc(docRef, { name: 'new_group_a' });

      // Assert
      await waitUntil(() => reloadStub.calledOnce);
      assert.ok(true);
    });
  });

  module('queryWithReferenceTo()', function () {
    test('should return fetched records', async function (assert) {
      // Arrange
      const colRef = collection(db, 'users');
      const queryRef = query(colRef);
      const referenceKeyName = 'referenceTo';
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.queryWithReferenceTo(
        queryRef,
        referenceKeyName,
      );

      // Assert
      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0]?.id, 'user_a');
      assert.deepEqual(result[0]?.data(), {
        name: 'user_a',
        age: 15,
        username: 'user_a',
      });
    });

    test('should return fetched records with referenceTo indicators', async function (assert) {
      // Arrange
      const colRef = collection(db, 'users/user_a/groups');
      const queryRef = query(colRef);
      const referenceKeyName = 'referenceTo';
      const firestoreDataManager = this.owner.lookup(
        'service:-firestore-data-manager',
      );

      // Act
      const result = await firestoreDataManager.queryWithReferenceTo(
        queryRef,
        referenceKeyName,
      );

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'group_a');
      assert.deepEqual(result[0]?.data(), { name: 'group_a' });
    });
  });
});
