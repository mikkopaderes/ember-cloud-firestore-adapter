# Getting Started

## 1. Setup Firebase and Addon Configuration

Configurations can be set under the `ember-cloud-firestore-adapter` like this:

```javascript
const ENV = {
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
};
```

### Available Configurations

#### `firebaseConfig`

The config object of your Firebase web app project. You can get this in the Project Settings of your Firebase Console.

#### `firestore`

This contains the settings related to Firestore. The available properties are:

- `isCustomSetup` (optional) - A boolean to indicate whether you want to setup your Firestore instance on your own.
- `settings` (optional) - An object representing [`FirestoreSettings`](https://firebase.google.com/docs/reference/js/firestore_.firestoresettings.md#firestoresettings_interface). Any settings available there, you can set it here.
- `emulator` (optional) - Use this object property if you want to use [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) for your local development. The available properties are `hostname`, `port`, and `options`.

#### `auth`

This contains the settings related to Auth. The available properties are:

- `isCustomSetup` (optional) - A boolean to indicate whether you want to setup your Auth instance on your own.
- `emulator` (optional) - Use this object property if you want to use [Firebase Emulator](https://firebase.google.com/docs/emulator-suite) for your local development. The available properties are `hostname`, `port`, and `options`.

## 2. Create Your Application Adapter

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

### Adapter Settings

These are the settings currently available:

  - `referenceKeyName` - Name of the field that will indicate whether a document is a reference to another one. (Defaults to `'referenceTo'`)

## 3. Create Your Application Serializer

Create an application serializer by running:

```bash
ember generate serializer application
```

Change it to look something like this:

```javascript
import CloudFirestoreSerializer from 'ember-cloud-firestore-adapter/serializers/cloud-firestore-modular';

export default class ApplicationSerializer extends CloudFirestoreSerializer { }
```

## 4. Firebase and Auth Modular API Imports

In order to support FastBoot, we've created wrapper imports for the Modular API functions which you can source out from `ember-cloud-firestore-adapter/firebase/<app/auth/firestore>` respectively.

e.g

```javascript
import { signInWithEmailAndPassword } from 'ember-cloud-firestore-adapter/firebase/auth';
import { doc, getDoc } from 'ember-cloud-firestore-adapter/firebase/firestore';
```

Note that only function types are wrapped. Variables, class, interface, etc. must still be imported from Firebase paths.

e.g.

```javascript
import { CollectionReference } from 'firebase/firestore';
```

---

[Next: Data Structure »](data-structure.md)
