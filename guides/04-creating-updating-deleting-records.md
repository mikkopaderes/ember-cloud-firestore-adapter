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

## Saving relationships

There are 3 types of relationships to take note of: one-to-many, many-to-many, and many-to-none.

When saving a one-to-many relationship, the reference will be persisted on the belongs-to side automatically. For many-to-many and many-to-none however, you'll need to manually save them through the `include` hook on the `adapterOptions`. This is because Ember Data currently doesn't provide a way to track relationship changes. This means that we can never be sure if the has-many being saved contains all the related data. So if we remove a related record, we wouldn't know if it was removed or just not yet downloaded because we used a `limit` query.

### Saving many-to-many

In this scenario, `User` model has a many-to-many relationship with `Group` model through the `groups` and `members` field name respectively.

```javascript
// Assume that a someGroup variable already exists

...

const newUser = this.store.createRecord('user', {
  name: 'Foo',
  groups: [someGroup]
});

newUser.save({
  adapterOptions: {
    include(batch, db) {
      // Batch write to the users/<user_id>/groups sub-collection
      batch.set(db.collection('users').doc(newUser.get('id')).collection('groups'), {
        referenceTo: db.collection('groups').doc(someGroup.get('id'))
      });

      // Batch write to the groups/<group_id>/members sub-collection
      batch.set(db.collection('groups').doc(someGroup.get('id')).collection('members'), {
        referenceTo: db.collection('users').doc(newUser.get('id'))
      });
    }
  }
});
```

### Saving many-to-none

Saving many-to-none is similar with many-to-many except that you'll only batch write to one side of the relationship only.

Another case for many-to-none relationship is to save the record itself in the sub-collection rather than using a reference field. To do so, just simply save the record to the appropriate sub-collection and then push it to the has-many array.

e.g.

In this scenario, the `User` model has a many-to-none relationship with `Reminder` model.

```javascript
// Assume that a someUser variable already exists

...

const reminder = this.store.createRecord('reminder', {
  title: 'Foo'
});

reminder.save({
  adapterOptions: {
    buildReference(db) {
      return db.collection('users').doc(someUser.get('id')).collection('reminders');
    }
  }
}).then(() => {
  // Update hasMany without flagging someUser as "dirty" or unsaved
  someUser.hasMany('reminders').push({
    type: 'reminder',
    id: reminder.get('id')
  });
});
```

---

[Next: Transforms »](05-transforms.md)
