# Testing

We use [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite) for testing Cloud Firestore while [ember-simple-auth](https://github.com/simplabs/ember-simple-auth#testing) provides a set of test helpers for authentication.

## Setup Addon to Use Emulator

Add an `ember-cloud-firestore-adapter.firestore.emulator` property in your `config/environment.js` and **make sure to disable it in production environment**.

```javascript
let ENV = {
  ...

  'ember-cloud-firestore-adapter': {
    ...

    firestore: {
      emulator: {
        hostname: 'localhost',
        port: 8080
      }
    }
  },

  ...
}

if (environment === 'production') {
  ENV['ember-cloud-firestore-adapter'].firestore.emulator = null;
}
```
