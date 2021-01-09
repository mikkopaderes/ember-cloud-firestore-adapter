import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';

import firebase from 'firebase/app';
import sinon from 'sinon';

import resetFixtureData from '../../helpers/reset-fixture-data';

module('Unit | Adapter | cloud firestore', function (hooks) {
  let db: firebase.firestore.Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    db = this.owner.lookup('service:firebase').firestore();

    await resetFixtureData(db);
  });

  hooks.afterEach(async function () {
    await resetFixtureData(db);
  });

  module('function: generateIdForRecord', function () {
    test('should generate ID for record', function (assert) {
      // Arrange
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = adapter.generateIdForRecord({}, 'foo');

      // Assert
      assert.ok(typeof result === 'string');
    });
  });

  module('function: createRecord', function () {
    test('should proxy a call to updateRecord and return with the created doc', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_100', age: 30, username: 'user_100' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      const updateRecordStub = sinon.stub(adapter, 'updateRecord').returns('foo');

      // Act
      const result = await adapter.createRecord(store, modelClass, snapshot);

      // Assert
      assert.equal(result, 'foo');
      assert.ok(updateRecordStub.calledWithExactly(store, modelClass, snapshot));
    });
  });

  module('function: updateRecord', function () {
    test('should update record and resolve with the updated doc', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        age: 50,
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      const result = await adapter.updateRecord(store, modelClass, snapshot);

      // Assert
      assert.deepEqual(result, { age: 50, username: 'user_a' });

      const userA = await db.collection('users').doc('user_a').get();

      assert.equal(userA.get('age'), 50);
      assert.equal(userA.get('username'), 'user_a');
    });

    test('should update record in a custom collection and resolve with the updated resource', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          buildReference(firestore: firebase.firestore.Firestore) {
            return firestore.collection('foobar');
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({ age: 50 });

      // Act
      const result = await adapter.createRecord(store, modelClass, snapshot);

      // Assert
      assert.deepEqual(result, { age: 50 });

      const user100 = await db.collection('foobar').doc('user_a').get();

      assert.deepEqual(user100.data(), { age: 50 });
    });

    test('should update record and process additional batched writes', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          include(batch: firebase.firestore.WriteBatch, firestore: firebase.firestore.Firestore) {
            batch.set(firestore.collection('users').doc('user_100'), { age: 60 });
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.generateIdForRecord = sinon.stub().returns('12345');
      adapter.serialize = sinon.stub().returns({ age: 50, username: 'user_a' });

      // Act
      const result = await adapter.updateRecord(store, modelClass, snapshot);

      // Assert
      assert.deepEqual(result, { age: 50, username: 'user_a' });

      const userA = await db.collection('users').doc('user_a').get();

      assert.deepEqual(userA.data(), { age: 50, name: 'user_a', username: 'user_a' });

      const user100 = await db.collection('users').doc('user_100').get();

      assert.deepEqual(user100.data(), { age: 60 });
    });
  });

  module('function: deleteRecord', function () {
    test('should delete record', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);
    });

    test('should delete record in a custom collection', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'post' };
      const snapshot = {
        id: 'post_b',

        adapterOptions: {
          buildReference(firestore: firebase.firestore.Firestore) {
            return firestore.collection('users').doc('user_a').collection('feeds');
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot);

      // Assert
      const postB = await db.doc('users/user_a/feeds/post_b').get();

      assert.notOk(postB.exists);
    });

    test('should delete record and process additional batched writes', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const snapshot = {
        id: 'user_a',
        adapterOptions: {
          include(batch: firebase.firestore.WriteBatch, firestore: firebase.firestore.Firestore) {
            batch.delete(firestore.collection('users').doc('user_b'));
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.serialize = sinon.stub().returns({ age: 50, username: 'user_a' });

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot);

      // Assert
      const userA = await db.collection('users').doc('user_a').get();

      assert.notOk(userA.exists);

      const userB = await db.collection('users').doc('user_b').get();

      assert.notOk(userB.exists);
    });
  });

  module('function: findAll', function () {
    test('should fetch all records for a model', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const modelClass = { modelName: 'user' };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findAll(store, modelClass);

      // Assert
      assert.deepEqual(result, [
        {
          id: 'user_a',
          age: 15,
          name: 'user_a',
          username: 'user_a',
        },
        {
          id: 'user_b',
          age: 10,
          name: 'user_b',
          username: 'user_b',
        },
        {
          id: 'user_c',
          age: 20,
          name: 'user_c',
          username: 'user_c',
        },
      ]);
    });
  });

  module('function: findRecord', function () {
    test('should fetch a record', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const snapshot = {};
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findRecord(store, modelClass, modelId, snapshot);

      // Assert
      assert.deepEqual(result, {
        id: 'user_a',
        age: 15,
        name: 'user_a',
        username: 'user_a',
      });
    });

    test('should fetch a record in a custom collection', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const modelClass = { modelName: 'user' };
      const modelId = 'user_a';
      const snapshot = {
        adapterOptions: {
          buildReference(firestore: firebase.firestore.Firestore) {
            return firestore.collection('admins');
          },
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findRecord(store, modelClass, modelId, snapshot);

      // Assert
      assert.deepEqual(result, { id: 'user_a', since: 2010 });
    });

    test('should throw an error when record does not exists', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const modelClass = { modelName: 'user' };
      const modelId = 'user_100';
      const snapshot = {};
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      try {
        // Act
        await adapter.findRecord(store, modelClass, modelId, snapshot);
      } catch (error) {
        // Assert
        assert.equal(error.message, 'Record user_100 for model type user doesn\'t exist');
      }
    });
  });

  module('function: findBelongsTo', function () {
    test('should fetch a belongs to record', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const snapshot = {};
      const url = 'users/user_a';
      const relationship = { type: 'user', options: {} };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findBelongsTo(store, snapshot, url, relationship);

      // Assert
      assert.deepEqual(result, {
        id: 'user_a',
        age: 15,
        name: 'user_a',
        username: 'user_a',
      });
    });
  });

  module('function: findHasMany', function () {
    test('should fetch many-to-one cardinality', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
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
          filter(reference: firebase.firestore.CollectionReference) {
            return reference.limit(1);
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(store, snapshot, url, relationship);

      // Assert
      assert.equal(result[0].id, 'post_a');
      assert.equal(result[0].title, 'post_a');
      assert.ok(determineRelationshipTypeStub.calledWithExactly(relationship, store));
      assert.ok(inverseForStub.calledWithExactly(relationship.key, store));
    });

    test('should fetch many-to-whatever cardinality', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const determineRelationshipTypeStub = sinon.stub().returns('manyToNone');
      const snapshot = {
        record: EmberObject.create({
          referenceTo: db.collection('users').doc('user_a'),
        }),
        type: {
          determineRelationshipType: determineRelationshipTypeStub,
        },
      };
      const url = 'users/user_a/friends';
      const relationship = {
        options: {
          filter(reference: firebase.firestore.CollectionReference) {
            return reference.limit(1);
          },
        },
        type: 'user',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(store, snapshot, url, relationship);

      // Assert
      assert.deepEqual(result, [
        {
          id: 'user_b',
          age: 10,
          name: 'user_b',
          username: 'user_b',
        },
      ]);
      assert.ok(determineRelationshipTypeStub.calledWithExactly(relationship, store));
    });

    test('should be able to fetch with filter using a record property', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
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
          filter(reference: firebase.firestore.CollectionReference, record: { id: string }) {
            return reference.where('approvedBy', '==', record.id);
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(store, snapshot, url, relationship);

      // Assert
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'post_a');
      assert.ok(determineRelationshipTypeStub.calledWithExactly(relationship, store));
      assert.ok(inverseForStub.calledWithExactly(relationship.key, store));
    });

    test('should be able to fetch with a custom reference when not a many-to-one cardinality', async function (assert) {
      // Arrange
      const store = { normalize: sinon.stub(), push: sinon.stub() };
      const determineRelationshipTypeStub = sinon.stub().returns('manyToNone');
      const snapshot = {
        record: EmberObject.create({ id: 'user_a' }),
        type: { determineRelationshipType: determineRelationshipTypeStub },
      };
      const url = null;
      const relationship = {
        key: 'userBFeeds',
        options: {
          buildReference(firestore: firebase.firestore.Firestore, record: { id: string }) {
            return firestore.collection(`users/${record.id}/feeds`);
          },

          filter(reference: firebase.firestore.CollectionReference) {
            return reference.limit(1);
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.findHasMany(store, snapshot, url, relationship);

      // Assert
      assert.equal(result[0].id, 'post_b');
      assert.equal(result[0].title, 'post_b');
      assert.ok(determineRelationshipTypeStub.calledWithExactly(relationship, store));
    });
  });

  module('function: query', function () {
    test('should query for records', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const query = {
        filter(reference: firebase.firestore.CollectionReference) {
          return reference.where('age', '>=', 15).limit(1);
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.query(store, modelClass, query);

      // Assert
      assert.deepEqual(result, [
        {
          id: 'user_a',
          age: 15,
          name: 'user_a',
          username: 'user_a',
        },
      ]);
    });

    test('should query for records in a custom collection', async function (assert) {
      // Arrange
      const store = {};
      const modelClass = { modelName: 'user' };
      const query = {
        buildReference(firestore: firebase.firestore.Firestore) {
          return firestore.collection('admins');
        },

        filter(reference: firebase.firestore.CollectionReference) {
          return reference.where('since', '==', 2015);
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      // Act
      const result = await adapter.query(store, modelClass, query);

      // Assert
      assert.deepEqual(result, [{ id: 'user_b', since: 2015 }]);
    });
  });
});
