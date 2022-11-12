# Creating, Updating, and Deleting Records

The adapter supports `store.createRecord`, `store.deleteRecord`, and, `store.destroyRecord`. However, there are some **optional** configs that you can make use of to support your needs.

## `createRecord`

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
import { doc } from 'ember-cloud-firestore-adapter/firebase/firestore';

const newPost = this.store.createRecord('post', { title: 'Post A' });

newPost.save({
  adapterOptions: {
    isRealtime: true,

    include(batch, db) {
      batch.set(doc(db, 'users/user_b/feeds/feed_a'), { title: 'Post A' });
    }
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime after creating it

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference on where you want to save the document to

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`WriteBatch`](https://firebase.google.com/docs/reference/js/firestore_.writebatch) |             |
| db    | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore)   |             |

## `deleteRecord`

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
import { doc } from 'ember-cloud-firestore-adapter/firebase/firestore';

user.deleteRecord();
user.save({
  adapterOptions: {
    include(batch, db) {
      batch.delete(doc(db, `usernames/${newUser.id}`));
    }
  }
});
```

### `buildReference`

Hook for providing a custom collection reference on where the document to be deleted is located

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`WriteBatch`](https://firebase.google.com/docs/reference/js/firestore_.writebatch) |             |
| db    | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore)   |             |

## `destroyRecord`

The optional configs are available through the `adapterOptions` property.

e.g.

```javascript
import { doc } from 'ember-cloud-firestore-adapter/firebase/firestore';

user.destroyRecord({
  adapterOptions: {
    include(batch, db) {
      batch.delete(doc(db, `usernames/${newUser.id}`));
    }
  }
});
```

### `buildReference`

Hook for providing a custom collection reference on where the document to be deleted is located

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`WriteBatch`](https://firebase.google.com/docs/reference/js/firestore_.writebatch) |             |
| db    | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore)   |             |

## Updating a record

The optional configs are available through the `adapterOptions` property in the `save` function.

e.g.

```javascript
import { doc } from 'ember-cloud-firestore-adapter/firebase/firestore';

post.set('title', 'New Title');
post.save({
  adapterOptions: {
    isRealtime: true,

    include(batch, db) {
      batch.update(doc(db, 'users/user_b/feeds/feed_a'), { title: 'New Title' });
    }
  }
});
```

### `isRealtime`

Indicates if the record will update in realtime after updating it

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference on where the document to be updated is located

**Type:** `function`

**Params:**

| Name | Type                                                                                                         | Description |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| db   | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |             |

### `include`

Hook for providing additional documents to batch write

**Type:** `function`

**Params:**

| Name  | Type                                                                                                           | Description |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| batch | [`WriteBatch`](https://firebase.google.com/docs/reference/js/firestore_.writebatch) |             |
| db    | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore)   |             |

## Saving relationships

There are 3 types of relationships to take note of: one-to-many, many-to-many, and many-to-none.

When saving a one-to-many relationship, the reference will be persisted on the belongs-to side automatically. For many-to-many and many-to-none however, you will need to manually save them through the `include` hook on the `adapterOptions`. This is because:

  - Ember Data currently doesn't provide a way to track relationship changes. This means that for the has-many side:
    - If a related record exists, we wouldn't know if it was just added or if it was already existing in the first place.
    - And, if we remove a related record, we wouldn't be able to know it.
  - We want the flexibility of specifying which collection we want the documents to be saved to.

### Saving many-to-many

In this scenario, `User` model has a many-to-many relationship with `Group` model through the `groups` and `members` field name respectively.

```javascript
import { doc } from 'ember-cloud-firestore-adapter/firebase/firestore';

// Assume that a group1 variable already exists

...

const newUser = this.store.createRecord('user', {
  name: 'Foo',
  groups: [group1]
});

newUser.save({
  adapterOptions: {
    include(batch, db) {
      // Batch write to the users/<user_id>/groups sub-collection
      batch.set(
        doc(db, `users/${newUser.get('id')}/groups/${group1.get('id')}`),
        { referenceTo: doc(db, `groups/${group1.get('id')}`) }
      );

      // Batch write to the groups/<group_id>/members sub-collection
      batch.set(
        doc(db, `groups/${group1.get('id')}/members/${newUser.get('id')}`),
        { referenceTo: db.collection('users').doc(newUser.get('id')) }
      );
    }
  }
});
```

### Saving many-to-none

Saving many-to-none is similar with many-to-many except that you will only batch write to one side of the relationship only.

Another case for many-to-none relationship is to save the record itself in the sub-collection rather than using a reference field. To do so, just simply save the record to the appropriate sub-collection and then push it to the has-many array.

e.g.

In this scenario, the `User` model has a many-to-none relationship with `Reminder` model.

```javascript
import { collection } from 'ember-cloud-firestore-adapter/firebase/firestore';

// Assume that a user1 variable already exists

...

const reminder = this.store.createRecord('reminder', {
  title: 'Foo'
});

reminder.save({
  adapterOptions: {
    buildReference(db) {
      return collection(db, `users/${user1.get('id')}/reminders`);
    }
  }
}).then(() => {
  // Update reminders hasMany without flagging user1 as "dirty" or unsaved
  user1.hasMany('reminders').push({
    type: 'reminder',
    id: reminder.get('id')
  });
});
```

---

[Next: Relationships »](relationships.md)
