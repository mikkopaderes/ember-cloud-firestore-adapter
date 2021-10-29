# Getting Started

## 1. Setup Firebase and Addon Configuration

Configurations can be set under the `ember-cloud-firestore-adapter` like this:

```javascript
let ENV = {
  ...

  'ember-cloud-firestore-adapter': {
    firebaseConfig: {
      apiKey: '<api_key>',
      authDomain: '<auth_domain>',
      databaseURL: '<database_url>',
      projectId: '<project_id>',
      storageBucket: '<storage_bucket>',
      messagingSenderId: '<messaging_sender_id>',
    },

    firestore: {
      emulator: {
        hostname: 'localhost',
        port: 8080,
      },
    },

    auth: {
      emulator: {
        hostname: 'localhost',
        port: 9099,
      },
    },
  },

  ...
}
```

### Available Configurations

#### `firebaseConfig`

The config object of your Firebase web app project. You can get this in the Project Settings of your Firebase Console.

#### `firestore`

This contains the settings related to Firestore. The available properties are:

- `settings` (optional) - An object representing [`firebase.firestore.Settings`](https://firebase.google.com/docs/reference/js/v8/firebase.firestore.Settings). Any settings available there, you can set it here.
- `emulator` (optional) - Use this object property if you want to use [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) for your local development. The available properties are `hostname` and `port`.

#### `auth`

This contains the settings related to Auth. The available properties are:

- `emulator` (optional) - Use this object property if you want to use [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) for your local development. The available properties are `hostname` and `port`.

### 2. Create Your Application Adapter

Create an application adapter by running:

```bash
ember generate adapter application
```

Change it to look something like this:

```javascript
import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore-modular';

export default class ApplicationAdapter extends CloudFirestoreAdapter {
  referenceKeyName = 'foobar';
}
```

> **NOTE:** This addon is in a transition phase towards Firebase Modular SDK. In order to support it alongside the Compat SDK, we've created a new `cloud-firestore-modular` adapter. Compat SDK adapter is now in maintenance mode until Firebase v10 so we recommend everyone to use the Modular SDK adapter instead moving forward.
>
> To view the Compat SDK docs, click [here](https://github.com/mikkopaderes/ember-cloud-firestore-adapter/blob/v2.0.2/docs/getting-started.md).

#### Adapter Settings

These are the settings currently available:

  - `referenceKeyName` - Name of the field that will indicate whether a document is a reference to another one. (Defaults to `'referenceTo'`)

### 3. Create Your Application Serializer

Create an application serializer by running:

```bash
ember generate serializer application
```

Change it to look something like this:

```javascript
import CloudFirestoreSerializer from 'ember-cloud-firestore-adapter/serializers/cloud-firestore-modular';

export default class ApplicationSerializer extends CloudFirestoreSerializer { }
```

> **NOTE:** This addon is in a transition phase towards Firebase Modular SDK. In order to support it alongside the Compat SDK, we've created a new `cloud-firestore-modular` serializer. Compat SDK serializer is now in maintenance mode until Firebase v10 so we recommend everyone to use the Modular SDK serializer instead moving forward.
>
> To view the Compat SDK docs, click [here](https://github.com/mikkopaderes/ember-cloud-firestore-adapter/blob/v2.0.2/docs/getting-started.md).

---

[Next: Data Structure »](data-structure.md)
