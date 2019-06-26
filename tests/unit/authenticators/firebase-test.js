import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import sinon from 'sinon';

module('Unit | Authenticator | firebase', function (hooks) {
  setupTest(hooks);

  module('function: authenticate', function () {
    test('should use the callback', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');

      // Act
      const result = await authenticator.authenticate(() => Promise.resolve({ user: 'foo' }));

      // Assert
      assert.deepEqual(result, { user: 'foo' });
    });
  });

  module('function: invalidate', function () {
    test('should sign out firebase user', function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');
      const signOutStub = sinon.stub();
      const firebase = {
        auth: sinon.stub().returns({ signOut: signOutStub }),
      };

      authenticator.set('firebase', firebase);

      // Act
      authenticator.invalidate();

      // Assert
      assert.ok(signOutStub.calledOnce);
    });
  });

  module('function: restore', function () {
    test('should sign in using custom token when fastboot header contains authorization token', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');
      const fastboot = this.owner.lookup('service:fastboot');

      fastboot.set('isFastBoot', true);
      fastboot.set('request', {
        headers: new Headers({
          Authorization: 'Bearer 123',
        }),
      });

      const userCredential = {
        user: { id: 'foo' },
      };
      const firebase = {
        auth: sinon.stub().returns({
          signInWithCustomToken: sinon
            .stub()
            .withArgs('123')
            .returns(Promise.resolve(userCredential)),
        }),
      };

      authenticator.set('firebase', firebase);

      // Act
      const result = await authenticator.restore();

      // Assert
      assert.deepEqual(result, {
        user: { id: 'foo' },
      });
    });

    test('should return the authenticated user from auth state changed', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');
      const user = { id: 'foo' };
      const firebase = {
        auth: sinon.stub().returns({
          onAuthStateChanged(callback) {
            setTimeout(() => callback(user));

            return () => {};
          },
        }),
      };

      authenticator.set('firebase', firebase);

      // Act
      const result = await authenticator.restore();

      // Assert
      assert.deepEqual(result, {
        user: { id: 'foo' },
      });
    });

    test('should return the authenticated user from a redirect result', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');
      const user = { id: 'foo' };
      const firebase = {
        auth: sinon.stub().returns({
          getRedirectResult: sinon.stub().returns(Promise.resolve({ user })),

          onAuthStateChanged(callback) {
            setTimeout(() => callback());

            return () => {};
          },
        }),
      };

      authenticator.set('firebase', firebase);

      // Act
      const result = await authenticator.restore();

      // Assert
      assert.deepEqual(result, {
        user: { id: 'foo' },
      });
    });
  });
});
