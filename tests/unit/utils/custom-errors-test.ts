import { module, test } from 'qunit';

import AdapterRecordNotFoundError from 'ember-cloud-firestore-adapter/utils/custom-errors';

module('Unit | Utility | custom-errors', function () {
  module('class: AdapterRecordNotFoundError', function () {
    test('should have characteristics of Error class', function (assert) {
      assert.expect(3);

      try {
        throw new AdapterRecordNotFoundError('Test Error', {
          cause: 'Test Cause',
        });
      } catch (error) {
        assert.ok(error instanceof AdapterRecordNotFoundError);
        assert.strictEqual(error.message, 'Test Error');
        assert.strictEqual(error.cause, 'Test Cause');
      }
    });
  });
});
