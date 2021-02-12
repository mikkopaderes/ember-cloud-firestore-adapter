# Testing

We use [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) for testing Cloud Firestore while [ember-simple-auth](https://github.com/simplabs/ember-simple-auth#testing) provides a set of test helpers for authentication.

## Setup Addon to Use Emulator

Add an `ember-cloud-firestore-adapter.emulator` property in your `config/environment.js` and make sure to disable it in production environment.

```javascript
let ENV = {
  ...

  'ember-cloud-firestore-adapter': {
    emulator: {
      hostname: 'localhost',
      firestorePort: 8080,
      authPort: 9099  // optional if not using auth
    },
  },

  ...
}

if (environment === 'production') {
  ENV['ember-cloud-firestore-adapter'] = null;
}
```
