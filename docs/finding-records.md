# Finding Records

The adapter supports `store.findRecord`, `store.findAll`, and, `store.query`. However, there are some **optional** configs that you can make use of to support your needs.

## `findRecord`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
this.store.findRecord('post', 'post_a', {
  adapterOptions: {
    isRealtime: true,

    buildReference(db) {
      return db.collection('users').doc('user_a').collection('feeds');
    }
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference on where you want to fetch the document from

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

## `findAll`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
this.store.findAll('post', {
  adapterOptions: {
    isRealtime: true
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime

**Type:** `boolean`

## `query`

The optional configs are available through the query param.

e.g.

```javascript
this.store.query('post', {
  isRealtime: true,
  queryId: 'foobar',

  buildReference(db) {
    return db.collection('users').doc('user_a').collection('feeds');
  },

  filter(reference) {
    return reference.where('likes', '>=', 100).limit(5);
  }
});
```

If the document contains a field that matches your [`referenceKeyName`](getting-started#adapter-settings), it'll fetch that one instead.

### `isRealtime`

Indicates if the record will update in realtime

**Type:** `boolean`

### `queryId`

A unique ID that you will provide yourself. When there's an already existing `queryId`, `store.query` won't create another realtime listener to avoid duplication.

This does nothing when `isRealtime` is false.

**Type:** `string`

### `buildReference`

Hook for providing a custom collection reference on where you want to fetch the documents from

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`

**Params:**

| Name      | Type                                                                                                                             | Description                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | [`firebase.firestore.CollectionReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference) | Will contain the return of `buildReference` when overriden. Otherwise, it'll be provided by the adapter itself. |

---

[Next: Creating, Updating, and Deleting Records »](create-update-delete-records)
