# Finding Records

The adapter supports `store.findRecord`, `store.findAll`, and, `store.query`. However, there are some **optional** configs that you can make use of to support your needs.

## `findRecord`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
import { collection } from 'ember-cloud-firestore-adapter/firebase/firestore';

this.store.findRecord('post', 'post_a', {
  adapterOptions: {
    isRealtime: true,

    buildReference(db) {
      return collection(db, 'users/user_a/feeds');
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
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### Error Handling

When finding a single record, you can catch for `AdapterRecordNotFoundError` error when the record doesn't exist.

```javascript
import { AdapterRecordNotFoundError } from 'ember-cloud-firestore-adapter/utils/custom-errors';

this.store.findRecord('user', 'user_1').then((record) => {
  // Do something
}).catch((error) => {
  if (error instanceof AdapterRecordNotFoundError) {
    // Do something
  }
});
```

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
import {
  collection,
  limit,
  query,
  where
} from 'ember-cloud-firestore-adapter/firebase/firestore';

this.store.query('post', {
  isRealtime: true,
  queryId: 'foobar',

  buildReference(db) {
    return collection(db, 'users/user_a/feeds');
  },

  filter(reference) {
    return query(reference, where('likes' '>=' 100), limit(5));
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
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`

**Params:**

| Name      | Type                                                                                                                             | Description                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | [`CollectionReference`](https://firebase.google.com/docs/reference/js/firestore_.collectionreference) | Will contain the return of `buildReference` when overriden. Otherwise, it'll be provided by the adapter itself. |

---

[Next: Creating, Updating, and Deleting Records »](create-update-delete-records.md)
