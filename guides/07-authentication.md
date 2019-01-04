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

---

[Next: Testing »](08-testing.md)
