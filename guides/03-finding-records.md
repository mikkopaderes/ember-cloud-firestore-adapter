# Finding Records

The adapter supports `store.findRecord`, `store.findAll`, and, `store.query`. However, there are some **optional** configs that you can make use of to support your needs.

## `findRecord`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
this.store.findRecord('post', 'post_a', {
  adapterOptions: {
    isRealTime: true,

    buildReference(db) {
      return db.collection('users').doc('user_a').collection('feeds');
    }
  }
});
```

### `isRealTime`

Indicates if the record will update in realtime

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`
**Params:**

| Name   | Type               | Description       |
| -------| ------------------ | ----------------- |
| db     | firebase.firestore |                   |

## `findAll`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
this.store.findAll('post', {
  adapterOptions: {
    isRealTime: true
  }
});
```

### `isRealTime`

Indicates if the record will update in realtime

**Type:** `boolean`

## `query`

The optional configs are available through the query param.

e.g.

```javascript
this.store.query('post', {
  isRealTime: true,

  buildReference(db) {
    return db.collection('users').doc('user_a').collection('feeds');
  },

  filter(reference) {
    return reference.where('likes', '>=', 100).limit(5);
  }
});
```

### `isRealTime`

Indicates if the record will update in realtime

**Type:** `boolean`

### `queryId`

A unique ID that you'll provide yourself. When there's an already existing `queryId`, `store.query` won't create another realtime listener to avoid duplication.

**Type:** `string`

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`
**Params:**

| Name   | Type               | Description       |
| ------ | ------------------ | ----------------- |
| db     | firebase.firestore |                   |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`
**Params:**

| Name      | Type                                   | Description                                                                                                     |
| --------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | firebase.firestore.CollectionReference | Will contain the return of `buildReference` when overriden. Otherwise, it'll be provided by the adapter itself. |

---

[Next: Creating, Updating, and Deleting Records »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/04-creating-updating-deleting-records.md)
