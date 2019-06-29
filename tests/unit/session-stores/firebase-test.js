import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Session Store | firebase', function (hooks) {
  setupTest(hooks);

  module('function: restore', function () {
    test('should return a fake authenticated state when in fastboot and header has a bearer authorization', async function (assert) {
      assert.expect(1);

      // Arrange
      const sessionStore = this.owner.lookup('session-store:firebase');
      const fastboot = this.owner.lookup('service:fastboot');

      fastboot.set('isFastBoot', true);
      fastboot.set('request', {
        headers: new Headers({
          Authorization: 'Bearer 123',
        }),
      });

      // Act
      const result = await sessionStore.restore();

      // Assert
      assert.deepEqual(result, {
        authenticated: { authenticator: 'authenticator:firebase' },
      });
    });
  });
});
