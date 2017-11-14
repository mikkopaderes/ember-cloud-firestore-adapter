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
    path: 'users/user_a/feeds'
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

APIs for querying tries to adhere to [JSON API](http://jsonapi.org/) convention as much as possible.

All queries that'll be explained below can be combined in a single request.

### Filter

This will retrieve all `post` documents under the `posts` collection that has an `author` with a `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) to `users/user_a` and a `createdOn` date greater than 2016-12-31.

```javascript
this.get('store').findRecord('user', 'user_a').then((user) => {
  // Assume that the `user` is stored under `users` collection
  this.get('store').query('post', {
    filter: {
      author: { eq: user.get('cloudFirestoreReference') },
      createdOn: { gt: new Date('2016-12-31') }
    }
  });
});
```

> Notes:
>
> - Filters support the following comparisons, `lt`, `lte`, `eq`, `gte`, and `gt`.

### Sort

This will retrieve all `post` documents under the `posts` collection sorted by `createdOn` in **ascending** order.

```javascript
this.get('store').query('post', {
  sort: 'createdOn'
});
```

This will retrieve all `post` documents under the `posts` collection sorted by `createdOn` in **descending** order.

```javascript
this.get('store').query('post', {
  sort: '-createdOn'
});
```

This will retrieve all `post` documents under the `posts` collection sorted by `createdOn` and `title` both in **ascending** order.

```javascript
this.get('store').query('post', {
  sort: 'createdOn,title'
});
```

### Page

#### Cursor

This will retrieve all `post` documents under the `posts` collection using [multiple cursor](https://firebase.google.com/docs/firestore/query-data/query-cursors#set_multiple_cursor_conditions) conditions.

```javascript
this.get('store').query('post', {
  sort: 'body,title',
  page: {
    cursor: {
      startAt: 'Post A Body,Post A Title'
    }
  }
});
```

> Notes:
>
> - As of the moment, only string cursors are supported.
> - Using cursors requires to have a `sort` parameter passed-in as well.
> - You can use `startAt`, `endAt`, `startAfter`, and `endAfter`.

#### Limit

This will retrieve the **first** 3 `post` documents under the `posts` subcollection.

```javascript
this.get('store').query('post', {
  sort: 'createdOn',
  page: {
    limit: 3
  }
});
```

> Notes:
>
> - You can also sort in descending order to get the **last** 3 `post`

### Under a Subcollection

This will retrieve the first 3 `post` documents under the `users/user_a/feeds` subcollection.

```javascript
this.get('store').query('post', {
  sort: 'createdOn',
  page: {
    limit: 3
  },
  path: 'users/user_a/feeds'
});
```

### Under a Subcollection with a Document Reference (e.g. `hasMany` relationship)

If the document that your query hits is simply a reference to another document in a different collection, it will return that document instead.

This will retrieve the first 3 `group` documents under the `users/user_a/groups` subcollection, each of which is a reference to the `group` documents under the `groups` collection.

```javascript
this.get('store').query('group', {
  page: {
    limit: 3
  },
  path: 'users/user_a/groups'
});
```

> Notes:
>
> - Documents are assumed to be a reference to another document if it contains a `cloudFirestoreReference` attribute of type `Reference`

### Get Realtime Updates for a Query List

By default, documents returned by a query will listen for changes **individually**. Changes to the query list however, will not. In order to listen for changes in the query list, you'll need to provide a `queryId` parameter.

```javascript
this.get('store').query('post', {
  sort: '-createdOn',
  page: {
    limit: 3
  },
  queryId: 'last_3_posts'
});
```

> Notes:
>
> - `queryId` are something that you provide yourself. Make sure it's unique.
> - If you make another query request while using an existing `queryId`, the listener for the old query will be turned off.

---

[Next: Creating, Updating, and Deleting Records »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/03-creating-updating-deleting-records.md)
