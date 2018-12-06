import { module, test } from 'qunit';

import sinon from 'sinon';

import {
  buildCollectionName,
  buildPathFromRef,
  buildRefFromPath,
  flattenDocSnapshotData,
} from 'ember-cloud-firestore-adapter/utils/parser';

module('Unit | Utility | parser', function () {
  module('function: buildCollectionName', function () {
    test('should return a camelize and pluralize name', function (assert) {
      assert.expect(1);

      // Act
      const result = buildCollectionName('blog-post');

      // Assert
      assert.equal(result, 'blogPosts');
    });
  });

  module('function: buildPathFromRef', function () {
    test('should build a path from a cloud firestore reference', function (assert) {
      assert.expect(1);

      // Act
      const result = buildPathFromRef({
        id: 'user_a',
        parent: { id: 'users' },
      });

      // Assert
      assert.equal(result, 'users/user_a');
    });
  });

  module('function: buildRefFromPath', function () {
    test('should build a cloud firestore reference from a path', function (assert) {
      assert.expect(3);

      // Arrange
      const docStub = sinon.stub().returns('foo');
      const collectionStub = sinon.stub().returns({ doc: docStub });

      // Act
      const result = buildRefFromPath({ collection: collectionStub }, 'users/user');

      // Assert
      assert.ok(collectionStub.calledWithExactly('users'));
      assert.ok(docStub.calledWithExactly('user'));
      assert.equal(result, 'foo');
    });
  });

  module('function: flattenDocSnapshotData', function () {
    test('should flatten a document snapshot fit to be normalized by the serializer', function (assert) {
      assert.expect(1);

      // Act
      const result = flattenDocSnapshotData({
        id: 'post_a',

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

      // Assert
      assert.deepEqual(result, {
        id: 'post_a',
        title: 'Title',
        body: 'Body',
        author: {
          id: 'user_a',
          parent: { id: 'users' },
          firestore: {},
        },
      });
    });
  });
});
