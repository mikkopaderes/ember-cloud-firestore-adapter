import { Promise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';

import sinon from 'sinon';

module('Unit | Adapter | cloud firestore', function(hooks) {
  setupTest(hooks);

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
      this.store = {};
    });

    test('should create record and resolve with the created resource', async function(assert) {
      assert.expect(2);

      // Arrange
      const updateRecordStub = sinon.stub().returns(Promise.resolve('foo'));
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('updateRecord', updateRecordStub);

      // Act
      const result = await adapter.createRecord(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      });

      // Assert
      assert.ok(updateRecordStub.calledWithExactly(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      }));
      assert.equal(result, 'foo');
    });

    test('should reject when unable to create record', async function(assert) {
      assert.expect(1);

      // Arrange
      const updateRecordStub = sinon.stub().returns(Promise.reject('error'));
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('updateRecord', updateRecordStub);

      try {
        // Act
        await adapter.createRecord(this.store, {
          modelName: 'user',
        }, {
          id: 'ID',
        });
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
      assert.expect(4);

      // Arrange
      const setStub = sinon.stub().returns(Promise.resolve());
      const docStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            id: 'ID',
            ref: 'ref',

            data() {
              return { name: 'Name' };
            },
          });

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,

                commit() {
                  return Promise.resolve();
                },
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

      // Act
      const result = await adapter.updateRecord(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Name',
      }, {
        merge: true,
      }));
      assert.deepEqual(result, {
        id: 'ID',
        name: 'Name',
        cloudFirestoreReference: 'ref',
      });
    });

    test('should update record with batched writes that has ID and data and resolve with the updated resource', async function(assert) {
      assert.expect(6);

      // Arrange
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            id: 'ID',
            ref: 'ref',

            data() {
              return { name: 'Name' };
            },
          });

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,

                commit() {
                  return Promise.resolve();
                },
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
        }, {
          id: 'batch_id',
          path: 'users',
          data: { name: 'Batch Name' },
        }];
      });

      // Act
      const result = await adapter.updateRecord(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('batch_id'));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Name',
      }, {
        merge: true,
      }));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Batch Name',
      }, {
        merge: true,
      }));
      assert.deepEqual(result, {
        id: 'ID',
        name: 'Name',
        cloudFirestoreReference: 'ref',
      });
    });

    test('should update record with batched writes that has no ID but with data and resolve with the updated resource', async function(assert) {
      assert.expect(6);

      // Arrange
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            id: 'ID',
            ref: 'ref',

            data() {
              return { name: 'Name' };
            },
          });

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,

                commit() {
                  return Promise.resolve();
                },
              };
            },
          };
        },
      });
      adapter.set('generateIdForRecord', () => {
        return 'new_id';
      });
      adapter.set('serialize', () => {
        return [{
          id: 'ID',
          path: 'users',
          data: { name: 'Name' },
        }, {
          path: 'users',
          data: { name: 'Batch Name' },
        }];
      });

      // Act
      const result = await adapter.updateRecord(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('new_id'));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Name',
      }, {
        merge: true,
      }));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Batch Name',
      }, {
        merge: true,
      }));
      assert.deepEqual(result, {
        id: 'ID',
        name: 'Name',
        cloudFirestoreReference: 'ref',
      });
    });

    test('should update record with batched writes that has ID and null data and resolve with the updated resource', async function(assert) {
      assert.expect(6);

      // Arrange
      const deleteStub = sinon.stub();
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            id: 'ID',
            ref: 'ref',

            data() {
              return { name: 'Name' };
            },
          });

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,
                delete: deleteStub,

                commit() {
                  return Promise.resolve();
                },
              };
            },
          };
        },
      });
      adapter.set('generateIdForRecord', () => {
        return 'new_id';
      });
      adapter.set('serialize', () => {
        return [{
          id: 'ID',
          path: 'users',
          data: { name: 'Name' },
        }, {
          id: 'batch_id',
          path: 'users',
          data: null,
        }];
      });

      // Act
      const result = await adapter.updateRecord(this.store, {
        modelName: 'user',
      }, {
        id: 'ID',
      });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('batch_id'));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Name',
      }, {
        merge: true,
      }));
      assert.ok(deleteStub.calledWithExactly(docStub()));
      assert.deepEqual(result, {
        id: 'ID',
        name: 'Name',
        cloudFirestoreReference: 'ref',
      });
    });

    test('should reject when failing to update record with ID', async function(assert) {
      assert.expect(1);

      // Arrange
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
        await adapter.updateRecord(this.store, {
          modelName: 'user',
        }, {
          id: 'ID',
        });
      } catch (error) {
        // Assert
        assert.equal(error, 'error');
      }
    });
  });

  module('deleteRecord', function(hooks) {
    test('should delete record with batched writes that has ID and data', async function(assert) {
      assert.expect(5);

      // Arrange
      const deleteStub = sinon.stub();
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns();
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,
                delete: deleteStub,

                commit() {
                  return Promise.resolve();
                },
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
        }, {
          id: 'batch_id',
          path: 'users',
          data: { name: 'Batch Name' },
        }];
      });

      // Act
      await adapter.deleteRecord({}, { modelName: 'user' }, { id: 'ID' });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('batch_id'));
      assert.ok(deleteStub.calledWithExactly(docStub()));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Batch Name',
      }, {
        merge: true,
      }));
    });

    test('should delete record with batched writes that has ID and null data', async function(assert) {
      assert.expect(4);

      // Arrange
      const deleteStub = sinon.stub();
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns();
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,
                delete: deleteStub,

                commit() {
                  return Promise.resolve();
                },
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
        }, {
          id: 'batch_id',
          path: 'users',
          data: null,
        }];
      });

      // Act
      await adapter.deleteRecord({}, { modelName: 'user' }, { id: 'ID' });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('batch_id'));
      assert.ok(deleteStub.alwaysCalledWithExactly(docStub()));
    });

    test('should delete record with batched writes that has not ID but with data', async function(assert) {
      assert.expect(5);

      // Arrange
      const deleteStub = sinon.stub();
      const setStub = sinon.stub();
      const docStub = sinon.stub().returns();
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return {
            collection: collectionStub,

            batch() {
              return {
                set: setStub,
                delete: deleteStub,

                commit() {
                  return Promise.resolve();
                },
              };
            },
          };
        },
      });
      adapter.set('generateIdForRecord', () => {
        return 'new_id';
      });
      adapter.set('serialize', () => {
        return [{
          id: 'ID',
          path: 'users',
          data: { name: 'Name' },
        }, {
          path: 'users',
          data: { name: 'Batch Name' },
        }];
      });

      // Act
      await adapter.deleteRecord({}, { modelName: 'user' }, { id: 'ID' });

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('ID'));
      assert.ok(docStub.calledWithExactly('new_id'));
      assert.ok(deleteStub.calledWithExactly(docStub()));
      assert.ok(setStub.calledWithExactly(docStub(), {
        name: 'Batch Name',
      }, {
        merge: true,
      }));
    });

    test('should reject when failing to delete record', async function(assert) {
      assert.expect(1);

      // Arrange
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
        await adapter.deleteRecord({}, { modelName: 'user' }, { id: 'ID' });
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
        normalize() {},
        push() {},
      };
    });

    test('should fetch all records for a model', async function(assert) {
      assert.expect(3);

      // Arrange
      const findRecordStub = sinon.stub().returns(Promise.resolve({
        id: 'post_a',
        title: 'Title',
        body: 'Body',
        author: {
          id: 'user_a',
          parent: { id: 'users' },
          firestore: {},
        },
        cloudFirestoreReference: 'ref',
      }));
      const collectionStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess([{
            id: 'post_a',
            ref: 'ref',

            data() {
              return {
                title: 'Title',
                body: 'Body',

                author: {
                  id: 'user_a',
                  parent: { id: 'users' },
                  firestore: {},
                },
              };
            },
          }]);

          return () => {};
        },
      });
      const modelClass = {
        modelName: 'post',

        eachRelationship(callback) {
          callback('author', { kind: 'belongsTo', type: 'user' });
        },
      };
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });
      adapter.set('findRecord', findRecordStub);

      // Act
      const result = await adapter.findAll(this.store, modelClass);

      // Assert
      assert.ok(
        findRecordStub.calledWithExactly(this.store, modelClass, 'post_a'),
      );
      assert.ok(collectionStub.calledWithExactly('posts'));
      assert.deepEqual(result, [{
        id: 'post_a',
        title: 'Title',
        body: 'Body',
        author: {
          id: 'user_a',
          parent: { id: 'users' },
          firestore: {},
        },
        cloudFirestoreReference: 'ref',
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
      assert.expect(3);

      // Arrange
      const docStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            exists: true,
            id: 'post_a',
            ref: 'ref',

            data() {
              return {
                title: 'Title',
                body: 'Body',

                author: {
                  id: 'user_a',
                  parent: { id: 'users' },
                  firestore: {},
                },
              };
            },
          });

          return () => {};
        },
      });
      const collectionStub = sinon.stub().returns({ doc: docStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: collectionStub };
        },
      });

      // Act
      const result = await adapter.findRecord(this.store, {
        modelName: 'post',

        eachRelationship(callback) {
          callback('author', { kind: 'belongsTo', type: 'user' });
        },
      }, 'post_a', { adapterOptions: null });

      // Assert
      assert.ok(collectionStub.calledWithExactly('posts'));
      assert.ok(docStub.calledWithExactly('post_a'));
      assert.deepEqual(result, {
        id: 'post_a',
        title: 'Title',
        body: 'Body',
        author: {
          id: 'user_a',
          parent: { id: 'users' },
          firestore: {},
        },
        cloudFirestoreReference: 'ref',
      });
    });

    test('should fetch a record with a path', async function(assert) {
      assert.expect(5);

      // Arrange
      const nestedDocStub = sinon.stub().returns({
        onSnapshot(onSuccess) {
          onSuccess({
            exists: true,
            id: 'post_a',
            ref: 'ref',

            data() {
              return {
                title: 'Title',
                body: 'Body',

                author: {
                  id: 'user_a',
                  parent: { id: 'users' },
                  firestore: {},
                },
              };
            },
          });

          return () => {};
        },
      });
      const nestedCollectionStub = sinon.stub().returns({ doc: nestedDocStub });
      const rootDocStub = sinon.stub().returns({
        collection: nestedCollectionStub,
      });
      const rootCollectionStub = sinon.stub().returns({ doc: rootDocStub });
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('firebase', {
        firestore() {
          return { collection: rootCollectionStub };
        },
      });

      // Act
      const result = await adapter.findRecord(this.store, {
        modelName: 'post',

        eachRelationship(callback) {
          callback('author', { kind: 'belongsTo', type: 'user' });
        },
      }, 'post_a', {
        adapterOptions: { path: 'sites/site_a/posts' },
      });

      // Assert
      assert.ok(rootCollectionStub.calledWithExactly('sites'));
      assert.ok(rootDocStub.calledWithExactly('site_a'));
      assert.ok(nestedCollectionStub.calledWithExactly('posts'));
      assert.ok(nestedDocStub.calledWithExactly('post_a'));
      assert.deepEqual(result, {
        id: 'post_a',
        title: 'Title',
        body: 'Body',
        author: {
          id: 'user_a',
          parent: { id: 'users' },
          firestore: {},
        },
        cloudFirestoreReference: 'ref',
      });
    });

    test('should reject when unable to fetch a record', async function(assert) {
      assert.expect(1);

      // Arrange
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
        await adapter.findRecord(this.store, { modelName: 'post' }, 'post_a');
      } catch (error) {
        // Assert
        assert.ok(true);
      }
    });
  });

  module('findBelongsTo', function(hooks) {
    test('should fetch a belongs to record', async function(assert) {
      assert.expect(1);

      // Arrange
      const findRecordStub = sinon.stub().returns(Promise.resolve());
      const adapter = this.owner.lookup('adapter:cloud-firestore');

      adapter.set('findRecord', findRecordStub);

      // Act
      await adapter.findBelongsTo({}, {}, 'users/user_b', {
        parentType: {
          typeForRelationship() {
            return { modelName: 'user' };
          },
        },
      });

      // Assert
      assert.ok(
        findRecordStub.calledWithExactly({}, { modelName: 'user' }, 'user_b', {
          adapterOptions: { path: 'users' },
        }),
      );
    });
  });

  module('findHasMany', function(hooks) {
    hooks.beforeEach(function() {
      this.store = {
        listenForHasManyChanges() {},
      };
    });

    test('should fetch manyToOne cardinality', async function(assert) {
      assert.expect(8);

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
      const typeForRelationshipStub = sinon.stub().returns('post');
      const relationship = {
        key: 'posts',
        parentType: { typeForRelationship: typeForRelationshipStub },
      };
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
      assert.ok(typeForRelationshipStub.calledWithExactly(
        relationship.key,
        store,
      ));
      assert.ok(findRecordStub.calledWithExactly(
        store,
        'post',
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
      assert.expect(8);

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
      const typeForRelationshipStub = sinon.stub().returns('post');
      const relationship = {
        key: 'posts',
        parentType: { typeForRelationship: typeForRelationshipStub },
      };
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
      assert.ok(typeForRelationshipStub.calledWithExactly(
        relationship.key,
        store,
      ));
      assert.ok(findRecordStub.calledWithExactly(
        store,
        'post',
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
