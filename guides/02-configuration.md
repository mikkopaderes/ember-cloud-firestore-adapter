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

export default CloudFirestoreAdapter.extend({
  host: 'https://your-website.com',
  api: 'api'
});
```

### Host and API

The Adapter provides a seamless way to use your server's API instead of Cloud Firestore to create, update, and delete records. More of it will be explained [here](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/04-creating-updating-deleting-records.md).

Using the setup above, a `store.createRecord('city', { ... })` with the intention of using your server API will fire a `POST` request to `https://your-website.com/api/cities`.

---

[Next: Finding Records »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/03-finding-records.md)
