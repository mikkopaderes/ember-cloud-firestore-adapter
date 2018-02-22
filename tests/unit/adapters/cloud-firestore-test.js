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

    test('should fetch a record while not overriding buildReference hook', async function(assert) {
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

    test('should fetch a record while overriding buildReference hook', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const snapshot = {
        adapterOptions: {
          buildReference(db) {
            return db.collection('admins');
          },
        },
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
      assert.ok(findRecordStub.calledWith(store, {
        modelName: 'post',
      }, 'post_a'));
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
        listenForDocChanges() {},
        listenForQueryChanges() {},
      };
    });

    test('should query while not overriding buildReference', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const option = {
        filter(reference) {
          return reference.where('age', '==', 15);
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.query(this.store, modelClass, option);

      // Assert
      delete result[0].cloudFirestoreReference;

      assert.deepEqual(result, [{
        id: 'user_a',
        age: 15,
        username: 'user_a',
      }]);
    });

    test('should query while overriding buildReference', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const option = {
        buildReference(db) {
          return db.collection('admins');
        },

        filter(reference) {
          return reference.where('since', '==', 2015);
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.query(this.store, modelClass, option);

      // Assert
      delete result[0].cloudFirestoreReference;

      assert.deepEqual(result, [{
        id: 'user_b',
        since: 2015,
      }]);
    });

    test('should listen for query changes when queryId is passed in', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const option = {
        queryId: 'foobar',

        filter(reference) {
          return reference.where('since', '==', 2015);
        },
      };
      const spy = sinon.spy(this.store, 'listenForQueryChanges');
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      await adapter.query(this.store, modelClass, option);

      // Assert
      assert.ok(spy.calledOnce);
    });

    test('should not listen for query changes when queryId is not passed in', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const option = {
        queryId: 'foobar',

        filter(reference) {
          return reference.where('since', '==', 2015);
        },
      };
      const spy = sinon.spy(this.store, 'listenForQueryChanges');
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      adapter.query(this.store, modelClass, option);

      // Assert
      assert.ok(spy.notCalled);
    });

    test('should reject when unable to query', async function(assert) {
      assert.expect(1);

      // Arrange
      const modelClass = { modelName: 'user' };
      const option = {
        filter(reference) {
          return reference.where('since', '==', 2015);
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection() {
              return {
                where() {
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
        await adapter.query(this.store, modelClass, option);
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
