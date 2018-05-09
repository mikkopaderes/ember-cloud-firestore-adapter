# Creating, Updating, and Deleting Records

## Creating Records

### Under a Root-level collection

This will create a new `post` document under the `posts` collection.

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  this.get('store').createRecord('post', {
    body: 'New Post Body',
    title: 'New Post Title',
    author: user
  }).save();
});
```

### Under a Subcollection

This will create a new `post` document under the `users/user_b/feeds` subcollection.

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  this.get('store').createRecord('post', {
    body: 'New Post Body',
    title: 'New Post Title',
    author: user
  }).save({
    adapterOptions: {
      buildReference(db) {
        return db.collection('users').doc('user_b').collection('feeds');
      }
    }
  });
});
```

### Batched Writes

This will create a new `post` document under the `posts` collection and duplicates of it under the `users/user_a/feeds` and `users/user_b/feeds` subcollections. This is done atomically using [batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes).

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  const post = this.get('store').createRecord('post', {
    body: 'New Post Body',
    title: 'New Post Title',
    author: user
  });

  post.save({
    adapterOptions: {
      include(batch, db) {
        batch.set(db.collection('users').doc('user_a').collection('feeds'), {
          body: 'New Post Body',
          title: 'New Post Title',
          author: user
        });
        batch.set(db.collection('users').doc('user_b').collection('feeds'), {
          body: 'New Post Body',
          title: 'New Post Title',
          author: user
        });
      }
    }
  });
});
```

> Notes:
>
> - The adapter doesn't handle saving many-to-many and many-to-none relationships. You'll have to manually persist them through batch writes. This is because unlike in other Ember Data Adapters, we allow loading only a subset of a `hasMany` relationship (see [here](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/06-relationships.md)). This prevents us from knowing whether a record in a `hasMany` has just been removed or just not yet loaded when we save it.

### Using your Server APIs

Batching writes can only get you so far. For intesive operations, you'll most likely want to offload it to your servers rather than in your user's device.

This will make a `POST` request to your server instead of in Cloud Firestore.

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  this.get('store').createRecord('post', {
    body: 'New Post Body',
    title: 'New Post Title',
    author: user
  }).save({
    adapterOptions: {
      onServer: true
    }
  });
});
```

The payload to your server will look like this.

```json
{
  "id": "<client side generated id>",
  "body": "New Post Body",
  "title": "New Post Title",
  "author": "users/user_a"
}
```

> Notes:
>
> - Under the hood, this will use the `DS.RESTAdapter`. This means that any configurations available to that class are also available in Cloud Firestore Adapter.
> - Once `adapterOptions.onServer` is set to true, all other `adapterOptions` settings will be ignored.

## Updating and Deleting Records

There's nothing special about updating and deleting records. They're similar with the conventional [Ember Data API](https://guides.emberjs.com/v2.17.0/models/creating-updating-and-deleting-records/) except that they also support batched writes and using your server's API as shown above.

---

[Next: Transforms »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/05-transforms.md)
