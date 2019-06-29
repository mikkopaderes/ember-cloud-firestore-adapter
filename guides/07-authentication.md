# Authentication

The adapter supports Firebase authentication through the [ember-simple-auth](https://github.com/simplabs/ember-simple-auth) addon.

## Signing in

Using the `session` service provided by ember-simple-auth, a callback must be passed-in which will be responsible for authenticating the user.

The callback will have the [`firebase.auth.Auth`](https://firebase.google.com/docs/reference/js/firebase.auth.Auth) as a param. Use this to authenticate the user using any of the providers available. It **must** also return a promise that'll resolve to an instance of [`firebase.auth.UserCredential`](https://firebase.google.com/docs/reference/js/firebase.auth#.UserCredential).

```javascript
this.session.authenticate('authenticator:firebase', (auth) => {
  return auth.signInWithEmailAndPassword('my_email@gmail.com', 'my_password');
});
```

## Signing out

Also using the `session` service provided by ember-simple-auth, we just call `invalidate()`.

```javascript
this.session.invalidate();
```

## FastBoot

Authentication in FastBoot is possible through service worker and a [custom authentication system](https://firebase.google.com/docs/auth/web/custom-auth). You'll have to do some setup on both your Ember app and server.

### Setup your Ember app

1. Install the `ember-service-worker` addon
2. Create `app/session-stores/application.js` file

The contents of the file should be something like this:

```javascript
import Firebase from 'ember-cloud-firestore-adapter/session-stores/firebase';

export default Firebase.extend();
```

The built-in service worker of this addon (powered by `ember-service-worker`) will intercept all `fetch` requests in order to add the result of [`getIdToken()`](https://firebase.google.com/docs/reference/js/firebase.User#get-idtoken) in the request `Header`. This means that when a user visits your app, their ID token would be part of the request in which your server would process this for authentication.

### Setup your server

To continue with the server authentication process, you'll need to:

1. Verify the ID token via [`verifyIdToken()`](https://firebase.google.com/docs/reference/admin/node/admin.auth.Auth.html#verify-idtoken)
2. Create the custom token when the verification succeeds via [`createCustomToken()`](https://firebase.google.com/docs/reference/admin/node/admin.auth.Auth.html#create-custom-token).
3. Set the request's `Authorization` header to `Bearer: <created_custom_token>`.

That new header should now be picked up by your FastBoot app and `ember-cloud-firestore-adapter` would handle the rest through [`signInWithCustomToken()`](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#sign-inwith-custom-token).

Here's an example Express server that does the above in Cloud Functions for Firebase:

```javascript
const express = require('express');

const admin = require('firebase-admin');
const fastbootMiddleware = require('fastboot-express-middleware');
const functions = require('firebase-functions');

const app = express();

const distPath = 'app';

admin.initializeApp();

app.get('/*', async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const idToken = req.headers.authorization.split('Bearer ')[1];
      const auth = admin.auth();
      const decodedIdToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedIdToken;
      const customToken = await auth.createCustomToken(uid);

      req.headers.authorization = `Bearer ${customToken}`;
    } catch (error) {}
  }

  next();
}, fastbootMiddleware(distPath));

app.use(express.static(distPath));

exports.app = functions.https.onRequest(app);
```

---

[Next: Testing »](08-testing.md)
