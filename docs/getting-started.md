# Getting Started

## Configuration

### 1. Setup Firebase and Addon Configuration

Add a `firebase` property in your `config/environment.js`. Environment specific configurations for this addon can also be set up under the `ember-cloud-firestore-adapter` property in the same file.

```javascript
let ENV = {
  ...

  firebase: {
    apiKey: '<api_key>',
    authDomain: '<auth_domain>',
    databaseURL: '<database_url>',
    projectId: '<project_id>',
    storageBucket: '<storage_bucket>',
    messagingSenderId: '<messaging_sender_id>'
  },

  'ember-cloud-firestore-adapter': {
    emulator: {
      hostname: 'localhost',
      port: 8080,
    },
  },

  ...
}
```

#### `ember-cloud-firestore-adapter` Configurations

These are the configurations currently available that you may set per environment:

  - `emulator` - An object specifying the `hostname` and `port` to use when connecting to a Firebase Emulator.
  - `firestoreSettings` - An object specifying the custom settings for your Cloud Firestore instance. See [here](https://firebase.google.com/docs/reference/js/firebase.firestore.Settings).

At the moment, there are no required configuration in this addon so you may opt to not add any `ember-cloud-firestore-adapter` property in the `config/environment.js` file.

### 2. Create Your Application Adapter

Create an application adapter by running:

```bash
ember generate adapter application
```

Change it to look something like this:

```javascript
import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore';

export default class ApplicationAdapter extends CloudFirestoreAdapter {
  referenceKeyName = 'foobar';
}
```

#### Adapter Settings

These are the settings currently available:

  - `referenceKeyName` - Name of the field that will indicate whether a document is a reference to another one. (Defaults to `'referenceTo'`)

Note that these settings will be the same regardless of the environment.

---

[Next: Data Structure »](data-structure.md)
