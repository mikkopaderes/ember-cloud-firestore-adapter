# Configuration

## Firebase

Add a `firebase` property in your `config/environment.js`.

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

  ...
}
```

## Adapter

Create an `application` adapter by running

```bash
ember generate adapter application
```

Inside the generated Adapter, set it up like this

```javascript
import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore';

export default CloudFirestoreAdapter.extend();
```

### Settings

These are the settings currently available

- `firestoreSettings` - Specifies custom configurations for your Cloud Firestore instance. See [here](https://firebase.google.com/docs/reference/js/firebase.firestore.Settings).
- `willUnloadRecordOnListenError` - Unloads a record whenever a listener for a document fails (e.g. sudden permission denied). Defaults to `true`.

---

[Next: Finding Records »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/03-finding-records.md)
