# Creating, Updating, and Deleting Records

The adapter supports `store.createRecord`, `store.deleteRecord`, and, `store.destroyRecord`. However, there are some **optional** configs that you can make use of to support your needs.

## `createRecord`

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
const newPost = this.store.createRecord('post', { title: 'Post A' });

newPost.save({
  adapterOptions: {
    isRealtime: true,

    include(batch, db) {
      batch.set(db.collection('users').doc('user_b').collection('feeds'), { title: 'Post A' });
    }
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime after creating it

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`firebase.firestore.WriteBatch`](https://firebase.google.com/docs/reference/js/firebase.firestore.WriteBatch) |             |
| db    | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore)   |             |

## `deleteRecord`

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
user.deleteRecord();
user.save({
  adapterOptions: {
    include(batch, db) {
      batch.delete(db.collection('usernames').doc(newUser.id));
    }
  }
});
```

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`firebase.firestore.WriteBatch`](https://firebase.google.com/docs/reference/js/firebase.firestore.WriteBatch) |             |
| db    | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore)   |             |

## `destroyRecord`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
user.destroyRecord({
  adapterOptions: {
    include(batch, db) {
      batch.delete(db.collection('usernames').doc(newUser.id));
    }
  }
});
```

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`firebase.firestore.WriteBatch`](https://firebase.google.com/docs/reference/js/firebase.firestore.WriteBatch) |             |
| db    | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore)   |             |

## Updating a record

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
post.set('title', 'New Title');
post.save({
  adapterOptions: {
    isRealtime: true,

    include(batch, db) {
      batch.update(db.collection('users').doc('user_b').collection('feeds'), { title: 'New Title' });
    }
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime after updating it

### `buildReference`

Hook for providing a custom collection reference

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`firebase.firestore.WriteBatch`](https://firebase.google.com/docs/reference/js/firebase.firestore.WriteBatch) |             |
| db    | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore)   |             |

---

[Next: Transforms »](05-transforms.md)
