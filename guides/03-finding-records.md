# Finding Records

The adapter supports `store.findRecord()`, `store.findAll()`, `store.query()` and all fetched records are setup to listen for document changes.

## Retrieving a Single Record

### Under a Root-level Collection

This will retrieve the `post_a` document under the `posts` collection.

```javascript
this.get('store').findRecord('post', 'post_a');
```

### Under a Subcollection

This will retrieve the `post_a` document under the `users/user_a/feeds` subcollection.

```javascript
this.get('store').findRecord('user', 'post_a', {
  adapterOptions: {
    buildReference(db) {
      return db.collection('users').doc('user_a').collection('feeds');
    }
  }
});
```

## Retrieving Multiple Records

This will retrieve all `post` documents under the `posts` collection.

```javascript
this.get('store').findAll('post');
```

> Notes:
>
> - You can't use `findAll()` to retrieve all documents under a subcollection

## Querying for Multiple Records

Queries use `buildReference()` and `filter()` options.

### Using Filters & Limit

This will retrieve 4 `post` documents under the `posts` collection that has an `author` with a `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) to `users/user_a` and a `createdOn` date greater than 2016-12-31.

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  // Assume that the `user` is stored under `users` collection
  this.get('store').query('post', {
    limit: 4,

    filter(reference) {
      const db = reference.firestore;
      const userRef = db.collection('users').doc(user.get('id'));

      return reference
        .where('author', '==', userRef)
        .where('createdOn', '>=', new Date('2016-12-31'));
    }
  });
});
```

#### Updating Query

This will update the original query that retrieves 4 `post` documents under the `posts` collection into retrieving 8 `post` documents in the same collection. This is useful for things like pagination and infinite scroll.

```javascript
this.get('store').query('post', {
  limit: 4,
}).then((records) => {
  records.set('query.limit', 8);

  records.update();
});
```

### Under a Subcollection

This will retrieve the first 3 `post` documents under the `users/user_a/feeds` subcollection.

```javascript
this.get('store').query('post', {
  buildReference(db) {
    return db.collection('users').doc('user_a').collection('feeds');
  },

  filter(reference) {
    return reference.orderBy('createdOn').limit(3);
  }
});
```

### Under a Subcollection with a Document Reference

If the document that your query hits is simply a reference to another document in a different collection, it will return that document instead.

This will retrieve the first 3 `group` documents under the `users/user_a/groups` subcollection, each of which is a reference to the `group` documents under the `groups` collection.

```javascript
this.get('store').query('group', {
  buildReference(db) {
    return db.collection('users').doc('user_a').collection('groups');
  },

  filter(reference) {
    return reference.limit(3);
  }
});
```

> Notes:
>
> - Documents are assumed to be a reference to another document if it contains a `cloudFirestoreReference` attribute of type `Reference`

### Get Realtime Updates for a Query List

By default, documents returned by a query will listen for changes **individually**. Changes to the query list however, will not. In order to listen for changes in the query list, you'll need to provide a `queryId` parameter.

```javascript
this.get('store').query('post', {
  queryId: 'last_3_posts',

  filter(reference) {
    return reference.orderBy('createdOn', 'desc').limit(3);
  }
});
```

> Notes:
>
> - `queryId` are something that you provide yourself. Make sure it's unique.
> - If you make another query request while using an existing `queryId`, the listener for the old query will be turned off and be replaced with the new one.

---

[Next: Creating, Updating, and Deleting Records »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/04-creating-updating-deleting-records.md)
