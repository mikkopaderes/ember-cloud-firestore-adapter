import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import firebase from 'firebase/compat/app';

import { signInAnonymously, signOut } from 'ember-cloud-firestore-adapter/firebase/auth';
import resetFixtureData from '../../helpers/reset-fixture-data';

module('Unit | Authenticator | firebase', function (hooks) {
  let auth: firebase.auth.Auth;
  let db: firebase.firestore.Firestore;

  setupTest(hooks);

  hooks.beforeEach(async function () {
    const app = this.owner.lookup('service:-firebase');

    auth = app.auth();
    db = app.firestore();

    await signInAnonymously(auth);
    await resetFixtureData(db);
  });

  hooks.afterEach(async function () {
    await signOut(auth);
  });

  module('authenticate()', function () {
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

  module('invalidate()', function () {
    test('should sign out firebase user', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');

      // Act
      await authenticator.invalidate();

      // Assert
      assert.strictEqual(auth.currentUser, null);
    });
  });

  module('restore()', function () {
    test('should return the authenticated user', async function (assert) {
      assert.expect(1);

      // Arrange
      const authenticator = this.owner.lookup('authenticator:firebase');

      // Act
      const result = await authenticator.restore();

      // Assert
      assert.ok(result.user.isAnonymous);
    });
  });
});
