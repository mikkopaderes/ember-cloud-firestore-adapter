import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

import type FirebaseStore from 'ember-cloud-firestore-adapter/session-stores/firebase';

class FastBootStub extends Service {
  isFastBoot = true;

  request = null;
}

module('Unit | Session Store | firebase', function (hooks) {
  setupTest(hooks);

  module('restore()', function () {
    test('should return a fake authenticated state when in fastboot and header has a bearer authorization', async function (assert) {
      assert.expect(1);

      // Arrange
      this.owner.register('service:fastboot', FastBootStub);

      const sessionStore = this.owner.lookup(
        'session-store:firebase',
      ) as FirebaseStore;
      const fastboot = this.owner.lookup('service:fastboot') as any; // eslint-disable-line @typescript-eslint/no-explicit-any

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
