import { Promise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';

import sinon from 'sinon';

import { mockFirebase } from 'ember-cloud-firestore-adapter/test-support';
import getFixtureData from '../../helpers/fixture-data';

let db;

module('Unit | Adapter | cloud firestore', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    db = mockFirebase(this, getFixtureData()).firestore();
  });

  module('generateIdForRecord', function(hooks) {
    test('should generate ID for record', function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = adapter.generateIdForRecord({}, 'foo');

      // Assert
      assert.ok(result);
    });
  });

  module('createRecord', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForDocChanges: sinon.stub(),
      };
    });

    test('should create record and resolve with the created resource', async function(assert) {
      assert.expect(2);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_100', age: 30, username: 'user_100' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns([{
        id: 'user_100',
        path: 'users',
        data: {
          age: 30,
          username: 'user_100',
        },
      }]);

      // Act
      const result = await adapter.createRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_100',
        age: 30,
        username: 'user_100',
      });

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 30, username: 'user_100' });
    });

    test('should reject when unable to create record', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const updateRecordStub = sinon.stub().returns(Promise.reject('error'));
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.updateRecord = updateRecordStub;

      try {
        // Act
        await adapter.createRecord(this.store, modelClass, snapshot);
      } catch (error) {
        // Assert
        assert.ok('error');
      }
    });
  });

  module('updateRecord', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForDocChanges() {},
      };
    });

    test('should update record and resolve with the updated resource', async function(assert) {
      assert.expect(2);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a', age: 50 };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns([{
        id: 'user_a',
        path: 'users',
        data: {
          age: 50,
          username: 'user_a',
        },
      }]);

      // Act
      const result = await adapter.updateRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_a',
        age: 50,
        username: 'user_a',
      });

      const userA = await db.collection('users').doc('user_a').get();

      assert.deepEqual(userA.data(), { age: 50, username: 'user_a' });
    });

    test('should update record and process additional batched writes', async function(assert) {
      assert.expect(5);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a', age: 50 };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.generateIdForRecord = sinon.stub().returns('12345');
      adapter.serialize = sinon.stub().returns([{
        id: 'user_a',
        path: 'users',
        data: { age: 50 },
      }, {
        id: 'user_100',
        path: 'users',
        data: { age: 60 },
      }, {
        path: 'users',
        data: { age: 70 },
      }, {
        id: 'user_b',
        path: 'users',
        data: null,
      }]);

      // Act
      const result = await adapter.updateRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_a',
        age: 50,
        username: 'user_a',
      });

      const userA = await db.collection('users').doc('user_a').get();

      assert.deepEqual(userA.data(), { age: 50, username: 'user_a' });

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 60 });

      const noIdProvidedUser = await db.collection('users').doc('12345').get();

      assert.deepEqual(noIdProvidedUser.data(), { age: 70 });

      const userB = await db.collection('users').doc('user_b').get();

      assert.notOk(userB.exists);
    });

    test('should reject when failing to update record with ID', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            batch() {
              return {
                set() {},

                commit() {
                  return Promise.reject('error');
                },
              };
            },

            collection() {
              return {
                doc() {
                  return {};
                },
              };
            },
          };
        },
      });
      adapter.set('serialize', () => {
        return [{
          path: 'users',
          data: { id: 'ID', name: 'Name' },
        }];
      });

      try {
        // Act
        await adapter.updateRecord(this.store, modelClass, snapshot);
      } catch (error) {
        // Assert
        assert.equal(error, 'error');
      }
    });
  });

  module('deleteRecord', function(hooks) {
    test('should delete record', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('serialize', () => {
        return [{
          id: 'user_a',
          path: 'users',
          data: { age: 15, username: 'user_a' },
        }];
      });

      // Act
      await adapter.deleteRecord({}, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);
    });

    test('should delete record and process additional batched writes', async function(assert) {
      assert.expect(4);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.generateIdForRecord = sinon.stub().returns('12345');
      adapter.set('serialize', () => {
        return [{
          id: 'user_a',
          path: 'users',
          data: { age: 15, username: 'user_a' },
        }, {
          id: 'user_100',
          path: 'users',
          data: { age: 60 },
        }, {
          path: 'users',
          data: { age: 70 },
        }, {
          id: 'user_b',
          path: 'users',
          data: null,
        }];
      });

      // Act
      await adapter.deleteRecord({}, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 60 });

      const noIdProvidedUser = await db.collection('users').doc('12345').get();

      assert.deepEqual(noIdProvidedUser.data(), { age: 70 });

      const userB = await db.collection('users').doc('user_b').get();

      assert.notOk(userB.exists);
    });

    test('should reject when failing to delete record', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            batch() {
              return {
                commit() {
                  return Promise.reject('error');
                },

                delete() {},
              };
            },

            collection() {
              return {
                doc() {},
              };
            },
          };
        },
      });
      adapter.set('serialize', () => {
        return [{
          id: 'ID',
          path: 'users',
          data: { name: 'Name' },
        }];
      });

      try {
        // Act
        await adapter.deleteRecord({}, modelClass, snapshot);
      } catch (error) {
        // Assert
        assert.equal(error, 'error');
      }
    });
  });

  module('findAll', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForCollectionChanges() {},
        listenForDocChanges() {},
        normalize() {},
        push() {},
      };
    });

    test('should fetch all records for a model', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findAll(this.store, modelClass);

      // Assert
      delete result[0].cloudFirestoreReference;
      delete result[1].cloudFirestoreReference;
      delete result[2].cloudFirestoreReference;

      assert.deepEqual(result, [{
        id: 'user_a',
        age: 15,
        username: 'user_a',
      }, {
        id: 'user_b',
        age: 10,
        username: 'user_b',
      }, {
        id: 'user_c',
        age: 20,
        username: 'user_c',
      }]);
    });

    test('should reject when unable to fetch all records for a model', async function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                onSnapshot(onSuccess, onError) {
                  onError();
                },
              };
            },
          };
        },
      });

      try {
        // Act
        await adapter.findAll(this.store, { modelName: 'post' });
      } catch (error) {
        // Assert
        assert.ok(true);
      }
    });
  });

  module('findRecord', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForDocChanges() {},
        normalize() {},
        push() {},
      };
    });

    test('should fetch a record without a path', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findRecord(
        this.store,
        modelClass,
        modelId,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_a',
        age: 15,
        username: 'user_a',
      });
    });

    test('should fetch a record with a path', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const snapshot = {
        adapterOptions: { path: 'admins' },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findRecord(
        this.store,
        modelClass,
        modelId,
        snapshot,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_a',
        since: 2010,
      });
    });

    test('should reject when unable to fetch a record', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                doc() {
                  return {
                    onSnapshot(onSuccess, onError) {
                      onError();
                    },
                  };
                },
              };
            },
          };
        },
      });

      try {
        // Act
        await adapter.findRecord(this.store, modelClass, modelId);
      } catch (error) {
        // Assert
        assert.ok(true);
      }
    });
  });

  module('findBelongsTo', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForDocChanges() {},
        normalize() {},
        push() {},
      };
    });

    test('should fetch a belongs to record', async function(assert) {
      assert.expect(1);

      // Arrange
      const snapshot = {};
      const url = 'admins/user_a';
      const relationship = { type: 'user' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findBelongsTo(
        this.store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      delete result.cloudFirestoreReference;

      assert.deepEqual(result, {
        id: 'user_a',
        since: 2010,
      });
    });
  });

  module('findHasMany', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForHasManyChanges() {},
      };
    });

    test('should fetch manyToOne cardinality', async function(assert) {
      assert.expect(7);

      // Arrange
      const listenForHasManyChangesStub = sinon.stub();
      const store = { listenForHasManyChanges: listenForHasManyChangesStub };
      const determineRelationshipTypeStub = sinon.stub().returns('manyToOne');
      const inverseForStub = sinon.stub().returns({ name: 'group' });
      const snapshot = {
        modelName: 'group',
        id: 'group_a',
        type: {
          determineRelationshipType: determineRelationshipTypeStub,
          inverseFor: inverseForStub,
        },
        record: EmberObject.create({ cloudFirestoreReference: 'groups/group_a' }),
      };
      const url = 'url';
      const relationship = { type: 'post' };
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'post_a' }]);
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const firebaseStub = {
        firestore: sinon.stub().returns({ collection: collectionStub }),
      };
      const findRecordStub = sinon.stub().returns(
        Promise.resolve('record'),
      );
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', firebaseStub);
      adapter.set('findRecord', findRecordStub);

      // Act
      const result = await adapter.findHasMany(
        store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      assert.ok(determineRelationshipTypeStub.calledWithExactly(
        relationship,
        store,
      ));
      assert.ok(inverseForStub.calledWithExactly(relationship.key, store));
      assert.ok(collectionStub.calledWithExactly(url));
      assert.ok(whereStub.calledWithExactly('group', '==', 'groups/group_a'));
      assert.ok(findRecordStub.calledWithExactly(
        store,
        { modelName: 'post' },
        'post_a',
      ));
      assert.ok(listenForHasManyChangesStub.calledWith(
        snapshot.modelName,
        snapshot.id,
        relationship.key,
      ));
      assert.deepEqual(result, ['record']);
    });

    test('should fetch non-manyToOne cardinality', async function(assert) {
      assert.expect(7);

      // Arrange
      const listenForHasManyChangesStub = sinon.stub();
      const store = { listenForHasManyChanges: listenForHasManyChangesStub };
      const determineRelationshipTypeStub = sinon.stub().returns('manyToMany');
      const snapshot = {
        modelName: 'group',
        id: 'group_a',
        type: { determineRelationshipType: determineRelationshipTypeStub },
      };
      const url = 'groups/group_a/posts';
      const relationship = { type: 'post' };
      const subCollectionStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{
            id: 'post_a',

            get() {
              return {
                id: 'post_a',
                parent: { id: 'posts' },
                firestore: {},
              };
            },
          }]);
        },
      });
      const rootDocStub = sinon.stub().returns({
        collection: subCollectionStub,
      });
      const rootCollectionStub = sinon.stub().returns({ doc: rootDocStub });
      const firebaseStub = {
        firestore: sinon.stub().returns({ collection: rootCollectionStub }),
      };
      const findRecordStub = sinon.stub().returns(
        Promise.resolve('record'),
      );
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', firebaseStub);
      adapter.set('findRecord', findRecordStub);

      // Act
      const result = await adapter.findHasMany(
        store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      assert.ok(determineRelationshipTypeStub.calledWithExactly(
        relationship,
        store,
      ));
      assert.ok(rootCollectionStub.calledWithExactly('groups'));
      assert.ok(rootDocStub.calledWithExactly('group_a'));
      assert.ok(subCollectionStub.calledWithExactly('posts'));
      assert.ok(findRecordStub.calledWithExactly(
        store,
        { modelName: 'post' },
        'post_a',
        { adapterOptions: { path: 'posts' } },
      ));
      assert.ok(listenForHasManyChangesStub.calledWith(
        snapshot.modelName,
        snapshot.id,
        relationship.key,
      ));
      assert.deepEqual(result, ['record']);
    });

    test('should reject when unable to fetch from url', async function(assert) {
      assert.expect(1);

      // Arrange
      const store = {};
      const snapshot = {
        type: { determineRelationshipType: sinon.stub().returns('manyToMany') },
      };
      const url = 'groups/group_a/posts';
      const relationship = {};
      const firebaseStub = {
        firestore: sinon.stub().returns({
          collection: sinon.stub().returns({
            doc: sinon.stub().returns({
              collection: sinon.stub().returns({
                onSnapshot(onSuccess, onError) {
                  onError();
                },
              }),
            }),
          }),
        }),
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', firebaseStub);

      try {
        await adapter.findHasMany(
          store,
          snapshot,
          url,
          relationship,
        );
      } catch (error) {
        assert.ok(true);
      }
    });

    test('should reject when unable to fetch referenced record', async function(assert) {
      assert.expect(1);

      // Arrange
      const store = {};
      const snapshot = {
        type: { determineRelationshipType: sinon.stub().returns('manyToMany') },
      };
      const url = 'groups/group_a/posts';
      const relationship = {
        parentType: { typeForRelationship: sinon.stub() },
      };
      const firebaseStub = {
        firestore: sinon.stub().returns({
          collection: sinon.stub().returns({
            doc: sinon.stub().returns({
              collection: sinon.stub().returns({
                onSnapshot(onSuccess) {
                  onSuccess([{
                    id: 'post_a',

                    get() {
                      return {
                        id: 'post_a',
                        parent: { id: 'posts' },
                        firestore: {},
                      };
                    },
                  }]);
                },
              }),
            }),
          }),
        }),
      };
      const findRecordStub = sinon.stub().returns(Promise.reject('error'));
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', firebaseStub);
      adapter.set('findRecord', findRecordStub);

      try {
        await adapter.findHasMany(
          store,
          snapshot,
          url,
          relationship,
        );
      } catch (error) {
        assert.equal(error, 'error');
      }
    });
  });

  module('query', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForQueryChanges() {},
      };
    });

    test('should query with lt filter', async function(assert) {
      assert.expect(3);

      // Arrange
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        filter: {
          name: { lt: 'Name' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(whereStub.calledWithExactly('name', '<', 'Name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with lte filter', async function(assert) {
      assert.expect(3);

      // Arrange
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        filter: {
          name: { lte: 'Name' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(whereStub.calledWithExactly('name', '<=', 'Name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with eq filter', async function(assert) {
      assert.expect(3);

      // Arrange
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        filter: {
          name: { eq: 'Name' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(whereStub.calledWithExactly('name', '==', 'Name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with gte filter', async function(assert) {
      assert.expect(3);

      // Arrange
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        filter: {
          name: { gte: 'Name' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(whereStub.calledWithExactly('name', '>=', 'Name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with gt filter', async function(assert) {
      assert.expect(3);

      // Arrange
      const whereStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ where: whereStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        filter: {
          name: { gt: 'Name' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(whereStub.calledWithExactly('name', '>', 'Name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with ascending field sort', async function(assert) {
      assert.expect(3);

      // Arrange
      const orderByStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ orderBy: orderByStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        sort: 'name',
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(orderByStub.calledWithExactly('name'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with descending field sort', async function(assert) {
      assert.expect(3);

      // Arrange
      const orderByStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ orderBy: orderByStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        sort: '-name',
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(orderByStub.calledWithExactly('name', 'desc'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with startAt cursor pagination', async function(assert) {
      assert.expect(3);

      // Arrange
      const startAtStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ startAt: startAtStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: {
          cursor: { startAt: 'name,age' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(startAtStub.calledWithExactly('name', 'age'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with startAfter cursor pagination', async function(assert) {
      assert.expect(3);

      // Arrange
      const startAfterStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({
        startAfter: startAfterStub,
      });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: {
          cursor: { startAfter: 'name,age' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(startAfterStub.calledWithExactly('name', 'age'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with endAt cursor pagination', async function(assert) {
      assert.expect(3);

      // Arrange
      const endAtStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ endAt: endAtStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: {
          cursor: { endAt: 'name,age' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(endAtStub.calledWithExactly('name', 'age'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with endBefore cursor pagination', async function(assert) {
      assert.expect(3);

      // Arrange
      const endBeforeStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ endBefore: endBeforeStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: {
          queryId: 'foobar',
          cursor: { endBefore: 'name,age' },
        },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(endBeforeStub.calledWithExactly('name', 'age'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with limit pagination', async function(assert) {
      assert.expect(3);

      // Arrange
      const limitStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'ID', get() {} }]);

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ limit: limitStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: { limit: 5 },
        queryId: 'foobar',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(limitStub.calledWithExactly(5));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should query with a path that\'s a reference', async function(assert) {
      assert.expect(5);

      // Arrange
      const subCollectionStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{
            id: 'user_b',

            get() {
              return {
                id: 'user_b',
                parent: { id: 'users' },
                firestore: {},
              };
            },
          }]);

          return () => {};
        },
      });
      const docStub = sinon.stub().returns({ collection: subCollectionStub });
      const rootCollectionStub = sinon.stub().returns({ doc: docStub });
      const findRecordStub = sinon.stub().returns(
        Promise.resolve({ id: 'user_b', name: 'Name' }),
      );
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: rootCollectionStub };
        },
      });
      adapter.set('findRecord', findRecordStub);

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        path: 'users/user_a/friends',
        queryId: 'foobar',
      });

      // Assert
      assert.ok(rootCollectionStub.calledWithExactly('users'));
      assert.ok(subCollectionStub.calledWithExactly('friends'));
      assert.ok(docStub.calledWithExactly('user_a'));
      assert.ok(
        findRecordStub.calledWithExactly(this.store, {
          modelName: 'user',
        }, 'user_b', {
          adapterOptions: { path: 'users' },
        }),
      );
      assert.deepEqual(result, [{ id: 'user_b', name: 'Name' }]);
    });

    test('should query with a path that\'s not a reference', async function(assert) {
      assert.expect(5);

      // Arrange
      const subCollectionStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{ id: 'user_b', get() {} }]);

          return () => {};
        },
      });
      const docStub = sinon.stub().returns({ collection: subCollectionStub });
      const rootCollectionStub = sinon.stub().returns({ doc: docStub });
      const findRecordStub = sinon.stub().returns(
        Promise.resolve({ id: 'user_b', name: 'Name' }),
      );
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: rootCollectionStub };
        },
      });
      adapter.set('findRecord', findRecordStub);

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        path: 'users/user_a/friends',
        queryId: 'foobar',
      });

      // Assert
      assert.ok(rootCollectionStub.calledWithExactly('users'));
      assert.ok(subCollectionStub.calledWithExactly('friends'));
      assert.ok(docStub.calledWithExactly('user_a'));
      assert.ok(
        findRecordStub.calledWithExactly(this.store, {
          modelName: 'user',
        }, 'user_b', {
          adapterOptions: { path: 'users/user_a/friends' },
        }),
      );
      assert.deepEqual(result, [{ id: 'user_b', name: 'Name' }]);
    });

    test('should query without a queryId', async function(assert) {
      assert.expect(2);

      // Arrange
      const collectionStub = sinon.stub().returns({
        limit() {
          return {
            get() {
              return Promise.resolve([{ id: 'ID', get() {} }]);
            },
          };
        },
      });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', () => {
        return Promise.resolve({ id: 'ID', name: 'Name' });
      });

      // Act
      const result = await adapter.query(this.store, { modelName: 'user' }, {
        page: { limit: 5 },
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.deepEqual(result, [{ id: 'ID', name: 'Name' }]);
    });

    test('should reject when unable to query with queryId', async function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                limit() {
                  return {
                    onSnapshot(onSuccess, onError) {
                      onError();
                    },
                  };
                },
              };
            },
          };
        },
      });

      try {
        // Act
        await adapter.query(this.store, { modelName: 'user' }, {
          page: { limit: 5 },
          queryId: 'foobar',
        });
      } catch (error) {
        // Assert
        assert.ok(true);
      }
    });

    test('should reject when unable to query without queryId', async function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                limit() {
                  return {
                    get() {
                      return Promise.reject('error');
                    },
                  };
                },
              };
            },
          };
        },
      });

      try {
        // Act
        await adapter.query(this.store, { modelName: 'user' }, {
          page: { limit: 5 },
        });
      } catch (error) {
        // Assert
        assert.equal(error, 'error');
      }
    });

    test('should reject when unable to query with a path', async function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                limit() {
                  return {
                    onSnapshot(onSuccess, onError) {
                      onSuccess([{ id: 'ID' }]);

                      return () => {};
                    },
                  };
                },
              };
            },
          };
        },
      });

      adapter.set('findRecord', () => {
        return Promise.reject();
      });

      try {
        // Act
        await adapter.query(this.store, { modelName: 'user' }, {
          page: { limit: 5 },
          queryId: 'foobar',
        });
      } catch (error) {
        // Assert
        assert.ok(true);
      }
    });
  });

  module('methodForRequest', function() {
    test('should use PATCH when request type is updateRecord', function(assert) {
      assert.expect(1);

      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = adapter.methodForRequest({ requestType: 'updateRecord' });

      // Assert
      assert.equal(result, 'PATCH');
    });
  });
});
