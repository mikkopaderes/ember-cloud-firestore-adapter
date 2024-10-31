/*
  eslint
  max-classes-per-file: off,
  @typescript-eslint/no-explicit-any: off
*/

import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';

import Store from '@ember-data/store';
import type { ModelSchema } from '@ember-data/store/types';
import { CollectionReference, Firestore, WriteBatch } from 'firebase/firestore';
import sinon from 'sinon';

import {
  collection,
  doc,
  getDoc,
  getFirestore,
  limit,
  query,
  where,
} from 'ember-cloud-firestore-adapter/firebase/firestore';
import type CloudFirestoreModularAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore-modular';
import AdapterRecordNotFoundError from 'ember-cloud-firestore-adapter/utils/custom-errors';
import resetFixtureData from '../../helpers/reset-fixture-data';

module('Unit | Adapter | cloud firestore modular', function (hooks) {
  let db: Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    db = getFirestore();

    await resetFixtureData(db);
  });

  module('function: generateIdForRecord', function () {
    test('should generate ID for record', function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = adapter.generateIdForRecord(store, 'foo');

      // Assert
      assert.strictEqual(typeof result, 'string');
    });
  });

  module('function: createRecord', function () {
    test('should proxy a call to updateRecord and return with the created doc', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = { id: 'user_100', age: 30, username: 'user_100' };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      const updateRecordStub = sinon
        .stub(adapter, 'updateRecord')
        .returns('foo' as any);

      // Act
      const result = await adapter.createRecord(
        store,
        modelClass,
        snapshot as any,
      );

      // Assert
      assert.strictEqual(result, 'foo');
      assert.ok(
        updateRecordStub.calledWithExactly(store, modelClass, snapshot as any),
      );
    });
  });

  module('function: updateRecord', function () {
    test('should update record and resolve with the updated doc', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = {
        id: 'user_a',
        age: 50,
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      adapter.serialize = sinon.stub().returns({
        age: 50,
        username: 'user_a',
      });

      // Act
      const result = await adapter.updateRecord(
        store,
        modelClass,
        snapshot as any,
      );

      // Assert
      assert.deepEqual(result, { age: 50, username: 'user_a' });

      const userA = await getDoc(doc(db, 'users/user_a'));

      assert.strictEqual(userA.get('age'), 50);
      assert.strictEqual(userA.get('username'), 'user_a');
    });

    test('should update record in a custom collection and resolve with the updated resource', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          buildReference(firestore: Firestore) {
            return collection(firestore, 'foobar');
          },
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      adapter.serialize = sinon.stub().returns({ age: 50 });

      // Act
      const result = await adapter.createRecord(
        store,
        modelClass,
        snapshot as any,
      );

      // Assert
      assert.deepEqual(result, { age: 50 });

      const user100 = await getDoc(doc(db, 'foobar/user_a'));

      assert.deepEqual(user100.data(), { age: 50 });
    });

    test('should update record and process additional batched writes', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = {
        id: 'user_a',
        age: 50,
        adapterOptions: {
          include(batch: WriteBatch, firestore: Firestore) {
            batch.set(doc(firestore, 'users/user_100'), { age: 60 });
          },
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      adapter.generateIdForRecord = sinon.stub().returns('12345');
      adapter.serialize = sinon.stub().returns({ age: 50, username: 'user_a' });

      // Act
      const result = await adapter.updateRecord(
        store,
        modelClass,
        snapshot as any,
      );

      // Assert
      assert.deepEqual(result, { age: 50, username: 'user_a' });

      const userA = await getDoc(doc(db, 'users/user_a'));

      assert.deepEqual(userA.data(), {
        age: 50,
        name: 'user_a',
        username: 'user_a',
      });

      const user100 = await getDoc(doc(db, 'users/user_100'));

      assert.deepEqual(user100.data(), { age: 60 });
    });
  });

  module('function: deleteRecord', function () {
    test('should delete record', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = { id: 'user_a' };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot as any);

      // Assert
      const userA = await getDoc(doc(db, 'users/user_a'));

      assert.notOk(userA.exists());
    });

    test('should delete record in a custom collection', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'post' } as ModelSchema;
      const snapshot = {
        id: 'post_b',

        adapterOptions: {
          buildReference(firestore: Firestore) {
            return collection(firestore, 'users/user_a/feeds');
          },
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot as any);

      // Assert
      const postB = await getDoc(doc(db, 'users/user_a/feeds/post_b'));

      assert.notOk(postB.exists());
    });

    test('should delete record and process additional batched writes', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const snapshot = {
        id: 'user_a',
        adapterOptions: {
          include(batch: WriteBatch, firestore: Firestore) {
            batch.delete(doc(firestore, 'users/user_b'));
          },
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      adapter.serialize = sinon.stub().returns({ age: 50, username: 'user_a' });

      // Act
      await adapter.deleteRecord(store, modelClass, snapshot as any);

      // Assert
      const userA = await getDoc(doc(db, 'users/user_a'));

      assert.notOk(userA.exists());

      const userB = await getDoc(doc(db, 'users/user_b'));

      assert.notOk(userB.exists());
    });
  });

  module('function: findAll', function () {
    test('should fetch all records for a model', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const modelClass = { modelName: 'user' } as ModelSchema;
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.findAll(store, modelClass, null, {});

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
      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const modelClass = { modelName: 'user' } as ModelSchema;
      const modelId = 'user_a';
      const snapshot = {};
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.findRecord(
        store,
        modelClass,
        modelId,
        snapshot as any,
      );

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
      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const modelClass = { modelName: 'user' } as ModelSchema;
      const modelId = 'user_a';
      const snapshot = {
        adapterOptions: {
          buildReference(firestore: Firestore) {
            return collection(firestore, 'admins');
          },
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.findRecord(
        store,
        modelClass,
        modelId,
        snapshot as any,
      );

      // Assert
      assert.deepEqual(result, { id: 'user_a', since: 2010 });
    });

    test('should throw an error when record does not exists', async function (assert) {
      // Arrange
      assert.expect(2);

      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const modelClass = { modelName: 'user' } as ModelSchema;
      const modelId = 'user_100';
      const snapshot = {};
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      try {
        // Act
        await adapter.findRecord(store, modelClass, modelId, snapshot as any);
      } catch (error) {
        // Assert
        assert.ok(error instanceof AdapterRecordNotFoundError);
        assert.strictEqual(
          (error as AdapterRecordNotFoundError).message,
          "Record user_100 for model type user doesn't exist",
        );
      }
    });
  });

  module('function: findBelongsTo', function () {
    test('should fetch a belongs to record', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const snapshot = {};
      const url = 'users/user_a';
      const relationship = { type: 'user', options: {} };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.findBelongsTo(
        store,
        snapshot as any,
        url,
        relationship,
      );

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
      const determineRelationshipTypeStub = sinon.stub().returns('manyToOne');
      const inverseForStub = sinon.stub().returns({ name: 'author' });
      this.owner.register(
        'service:store',
        class extends Store {
          modelFor() {
            return {
              determineRelationshipType: determineRelationshipTypeStub,
              inverseFor: inverseForStub,
            };
          }
        },
      );

      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const snapshot = {
        id: 'user_a',
        modelName: 'user',
        record: EmberObject.create(),
      };
      const url = 'posts';
      const relationship = {
        key: 'posts',
        options: {
          filter(reference: CollectionReference) {
            return query(reference, limit(1));
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = (await adapter.findHasMany(
        store,
        snapshot as any,
        url,
        relationship,
      )) as any;

      // Assert
      assert.strictEqual(result[0].id, 'post_a');
      assert.strictEqual(result[0].title, 'post_a');
      assert.ok(
        determineRelationshipTypeStub.calledWithExactly(relationship, store),
      );
      assert.ok(inverseForStub.calledWithExactly(relationship.key, store));
    });

    test('should fetch many-to-whatever cardinality', async function (assert) {
      // Arrange
      const determineRelationshipTypeStub = sinon.stub().returns('manyToNone');
      this.owner.register(
        'service:store',
        class extends Store {
          modelFor() {
            return {
              determineRelationshipType: determineRelationshipTypeStub,
            };
          }
        },
      );

      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const snapshot = {
        modelName: 'user',
        record: EmberObject.create({
          referenceTo: doc(db, 'users/user_a'),
        }),
      };
      const url = 'users/user_a/friends';
      const relationship = {
        options: {
          filter(reference: CollectionReference) {
            return query(reference, limit(1));
          },
        },
        type: 'user',
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.findHasMany(
        store,
        snapshot as any,
        url,
        relationship as any,
      );

      // Assert
      assert.deepEqual(result, [
        {
          id: 'user_b',
          age: 10,
          name: 'user_b',
          username: 'user_b',
        },
      ]);
      assert.ok(
        determineRelationshipTypeStub.calledWithExactly(relationship, store),
      );
    });

    test('should be able to fetch with filter using a record property', async function (assert) {
      // Arrange
      const determineRelationshipTypeStub = sinon.stub().returns('manyToOne');
      const inverseForStub = sinon.stub().returns({ name: 'author' });
      this.owner.register(
        'service:store',
        class extends Store {
          modelFor() {
            return {
              determineRelationshipType: determineRelationshipTypeStub,
              inverseFor: inverseForStub,
            };
          }
        },
      );

      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const snapshot = {
        id: 'user_a',
        modelName: 'user',
        record: EmberObject.create({
          id: 'user_a',
        }),
      };
      const url = 'posts';
      const relationship = {
        key: 'posts',
        options: {
          filter(reference: CollectionReference, record: { id: string }) {
            return query(reference, where('approvedBy', '==', record.id));
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = (await adapter.findHasMany(
        store,
        snapshot as any,
        url,
        relationship,
      )) as any;

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'post_a');
      assert.ok(
        determineRelationshipTypeStub.calledWithExactly(relationship, store),
      );
      assert.ok(inverseForStub.calledWithExactly(relationship.key, store));
    });

    test('should be able to fetch with a custom reference', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      store.normalize = sinon.stub();
      store.push = sinon.stub();
      const snapshot = {
        record: EmberObject.create({ id: 'user_a' }),
      };
      const url = null;
      const relationship = {
        key: 'userBFeeds',
        options: {
          buildReference(firestore: Firestore, record: { id: string }) {
            return collection(firestore, `users/${record.id}/feeds`);
          },

          filter(reference: CollectionReference) {
            return query(reference, limit(1));
          },
        },
        type: 'post',
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = (await adapter.findHasMany(
        store,
        snapshot as any,
        url as any,
        relationship,
      )) as any;

      // Assert
      assert.strictEqual(result[0].id, 'post_b');
      assert.strictEqual(result[0].title, 'post_b');
    });
  });

  module('function: query', function () {
    test('should query for records', async function (assert) {
      // Arrange
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const queryRef = {
        filter(reference: CollectionReference) {
          return query(reference, where('age', '>=', 15), limit(1));
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.query(
        store,
        modelClass,
        queryRef,
        undefined as any,
      );

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
      const store = this.owner.lookup('service:store');
      const modelClass = { modelName: 'user' } as ModelSchema;
      const queryRef = {
        buildReference(firestore: Firestore) {
          return collection(firestore, 'admins');
        },

        filter(reference: CollectionReference) {
          return query(reference, where('since', '==', 2015));
        },
      };
      const adapter = this.owner.lookup(
        'adapter:cloud-firestore-modular',
      ) as CloudFirestoreModularAdapter;

      // Act
      const result = await adapter.query(
        store,
        modelClass,
        queryRef,
        undefined as any,
      );

      // Assert
      assert.deepEqual(result, [{ id: 'user_b', since: 2015 }]);
    });
  });
});
