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
    db = mockFirebase(this.owner, getFixtureData()).firestore();
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

      adapter.serialize = sinon.stub().returns({
        age: 30,
        username: 'user_100',
      });

      // Act
      const result = await adapter.createRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      assert.deepEqual(result, {
        id: 'user_100',
        age: 30,
        username: 'user_100',
      });

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 30, username: 'user_100' });
    });

    test('should create record while overriding buildReference hook and resolve with the created resource', async function(assert) {
      assert.expect(2);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_100',
        age: 30,
        username: 'user_100',
        adapterOptions: {
          buildReference(db) {
            return db.collection('foobar');
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({
        age: 30,
        username: 'user_100',
      });

      // Act
      const result = await adapter.createRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      assert.deepEqual(result, {
        id: 'user_100',
        age: 30,
        username: 'user_100',
      });

      const user100 = await db.collection('foobar').doc('user_100').get();

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
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          buildReference(db) {
            return db.collection('foobar');
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      const result = await adapter.updateRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      assert.deepEqual(result, {
        id: 'user_a',
        age: 50,
        username: 'user_a',
      });

      const userA = await db.collection('foobar').doc('user_a').get();

      assert.notOk(userA.exists);
    });

    test('should update record while ignoring buildReference hook when function is not called from createRecord()', async function(assert) {
      assert.expect(2);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a', age: 50 };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      const result = await adapter.updateRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      assert.deepEqual(result, {
        id: 'user_a',
        age: 50,
        username: 'user_a',
      });

      const userA = await db.collection('users').doc('user_a').get();

      assert.deepEqual(userA.data(), { age: 50, username: 'user_a' });
    });

    test('should update record and process additional batched writes', async function(assert) {
      assert.expect(3);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          include(batch, db) {
            batch.set(db.collection('users').doc('user_100'), { age: 60 });
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.generateIdForRecord = sinon.stub().returns('12345');
      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      const result = await adapter.updateRecord(
        this.store,
        modelClass,
        snapshot,
      );

      // Assert
      assert.deepEqual(result, {
        id: 'user_a',
        age: 50,
        username: 'user_a',
      });

      const userA = await db.collection('users').doc('user_a').get();

      assert.deepEqual(userA.data(), { age: 50, username: 'user_a' });

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 60 });
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

      adapter.serialize = sinon.stub().returns({
        age: 15,
        username: 'user_a',
      });

      // Act
      await adapter.deleteRecord({}, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);
    });

    test('should delete record and process additional batched writes', async function(assert) {
      assert.expect(2);

      // Arrange
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        adapterOptions: {
          include(batch, db) {
            batch.delete(db.collection('users').doc('user_b'));
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      await adapter.deleteRecord({}, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);

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
      assert.deepEqual(result, {
        id: 'user_a',
        since: 2010,
      });
    });
  });

  module('findHasMany', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForDocChanges() {},
        listenForHasManyChanges() {},
      };
    });

    test('should fetch many-to-one cardinality', async function(assert) {
      assert.expect(3);

      // Arrange
      const determineRelationshipTypeStub = sinon.stub().returns('manyToOne');
      const inverseForStub = sinon.stub().returns({ name: 'author' });
      const snapshot = {
        id: 'user_a',
        modelName: 'user',
        record: EmberObject.create(),
        type: {
          determineRelationshipType: determineRelationshipTypeStub,
          inverseFor: inverseForStub,
        },
      };
      const url = 'posts';
      const relationship = {
        key: 'posts',
        options: {
          filter(reference) {
            return reference.limit(1);
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(
        this.store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      delete result[0].author;

      assert.deepEqual(result, [{ id: 'post_a', title: 'user_a' }]);
      assert.ok(determineRelationshipTypeStub.calledWithExactly(
        relationship,
        this.store,
      ));
      assert.ok(inverseForStub.calledWithExactly(relationship.key, this.store));
    });

    test('should fetch many-to-whatever cardinality', async function(assert) {
      assert.expect(2);

      // Arrange
      const determineRelationshipTypeStub = sinon.stub().returns('manyToNone');
      const snapshot = {
        record: EmberObject.create({
          cloudFirestoreReference: db.collection('users').doc('user_a'),
        }),
        type: {
          determineRelationshipType: determineRelationshipTypeStub,
        },
      };
      const url = 'users/user_a/friends';
      const relationship = {
        options: {
          filter(reference) {
            return reference.limit(1);
          },
        },
        type: 'user',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(
        this.store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      assert.deepEqual(result, [{
        id: 'user_b',
        age: 10,
        username: 'user_b',
      }]);
      assert.ok(determineRelationshipTypeStub.calledWithExactly(
        relationship,
        this.store,
      ));
    });

    test('should fetch with filter using a record property', async function(assert) {
      assert.expect(3);

      // Arrange
      const determineRelationshipTypeStub = sinon.stub().returns('manyToOne');
      const inverseForStub = sinon.stub().returns({ name: 'author' });
      const snapshot = {
        id: 'user_a',
        modelName: 'user',
        record: EmberObject.create({
          id: 'user_a',
        }),
        type: {
          determineRelationshipType: determineRelationshipTypeStub,
          inverseFor: inverseForStub,
        },
      };
      const url = 'posts';
      const relationship = {
        key: 'posts',
        options: {
          filter(reference, record) {
            return reference.where('title', '==', record.get('id'));
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(
        this.store,
        snapshot,
        url,
        relationship,
      );

      // Assert
      delete result[0].author;
      delete result[1].author;

      assert.deepEqual(result, [{
        id: 'post_a',
        title: 'user_a',
      }, {
        id: 'post_c',
        title: 'user_a',
      }]);
      assert.ok(determineRelationshipTypeStub.calledWithExactly(
        relationship,
        this.store,
      ));
      assert.ok(inverseForStub.calledWithExactly(relationship.key, this.store));
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
