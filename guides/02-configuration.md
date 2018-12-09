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

Inside the generated Adapter, set it up to look something like this

```javascript
import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore';

export default CloudFirestoreAdapter.extend({
  referenceKeyName: 'foobar',

  ...
  ...
});
```

### Settings

These are the settings currently available

- `firestoreSettings` - Specifies custom configurations for your Cloud Firestore instance. See [here](https://firebase.google.com/docs/reference/js/firebase.firestore.Settings). Defaults to `{ timestampsInSnapshots: true }`.
- `referenceKeyName` - Name of the field that will indicate whether a document is a reference to another one. Defaults to `referenceTo`.

---

[Next: Finding Records »](03-finding-records.md)
