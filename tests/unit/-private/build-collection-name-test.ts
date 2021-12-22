import { module, test } from 'qunit';

import buildCollectionName from 'ember-cloud-firestore-adapter/-private/build-collection-name';

module('Unit | -Private | build-collection-name', function () {
  test('should return the camelize and pluralize name of the string', function (assert) {
    const result = buildCollectionName('blog-post');

    assert.strictEqual(result, 'blogPosts');
  });
});
