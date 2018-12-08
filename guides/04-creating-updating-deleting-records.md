# Creating, Updating, and Deleting Records

The adapter supports `store.createRecord`, `store.deleteRecord`, and, `store.destroyRecord`. However, there are some **optional** configs that you can make use of to support your needs.

## `createRecord`

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
const newPost = this.store.createRecord('post', { title: 'Post A' });

newPost.save({
  adapterOptions: {
    isRealTime: true,

    include(batch, db) {
      batch.set(db.collection('users').doc('user_b').collection('feeds'), { title: 'Post A' });
    }
  }
});
```

### `isRealTime`

Indicates if the record will update in realtime after creating it

**Type:** `boolean`

### `include`

Hook for providing additional documents to batch write

**Type:** `function`
**Params:**

| Name   | Type                          | Description |
| -------| ----------------------------- | ------------|
| batch  | firebase.firestore.WriteBatch |             |
| db     | firebase.firestore            |             |

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

### `include`

Hook for providing additional documents to batch write

**Type:** `function`
**Params:**

| Name   | Type                          | Description |
| -------| ----------------------------- | ------------|
| batch  | firebase.firestore.WriteBatch |             |
| db     | firebase.firestore            |             |

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

### `include`

Hook for providing additional documents to batch write

**Type:** `function`
**Params:**

| Name   | Type                          | Description |
| -------| ----------------------------- | ------------|
| batch  | firebase.firestore.WriteBatch |             |
| db     | firebase.firestore            |             |

## Updating a record

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
post.set('title', 'New Title');
post.save({
  adapterOptions: {
    include(batch, db) {
      batch.update(db.collection('users').doc('user_b').collection('feeds'), { title: 'New Title' });
    }
  }
});
```

### `include`

Hook for providing additional documents to batch write

**Type:** `function`
**Params:**

| Name   | Type                          | Description |
| -------| ----------------------------- | ------------|
| batch  | firebase.firestore.WriteBatch |             |
| db     | firebase.firestore            |             |

---

[Next: Transforms »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/05-transforms.md)
