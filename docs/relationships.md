# Relationships

The adapter supports `hasMany` and `belongsTo`. However, there are some **optional** configs that you can make use of to support your needs.

## `belongsTo`

The optional configs are available by passing it as a param.

```javascript
import Model, { attr, belongsTo } from '@ember-data/model';

export default class UserModel extends Model {
  @attr name;
  @belongsTo('country', { isRealtime: true }) country;
}
```

### `isRealtime`

Indicates if the record will update in realtime

**Type:** `boolean`

## `hasMany`

The optional configs are available by passing it as a param.

```javascript
import Model, { attr, hasMany } from '@ember-data/model';

export default class GroupModel extends Model {
  @attr name;

  @hasMany('post', {
    isRealtime: true,

    filter(reference) {
      return reference.where('status', '==', 'approved');
    }
  })
  approvedPosts;
}
```

If the document contains a field that matches your [`referenceKeyName`](getting-started#adapter-settings), it'll fetch that one instead.

### `isRealtime`

Indicates if the record will update in realtime after creating it

**Type:** `boolean`

### `buildReference`

Hook for providing a custom collection reference.

This is ignored when the relationship is a many-to-one type.

**Type:** `function`

**Params:**

| Name   | Type                                                                                                         | Description       |
| -------| ------------------------------------------------------------------------------------------------------------ | ----------------- |
| db     | [`firebase.firestore.Firestore`](https://firebase.google.com/docs/reference/js/firebase.firestore.Firestore) |                   |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`

**Params:**

| Name      | Type                                                                                                                             | Description                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | [`firebase.firestore.CollectionReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference) | Will contain the return of `buildReference` when overriden. Otherwise, it will be provided by the adapter itself. |
| record    | Object                                                                                                                           | The record itself                                                                                               |

---

[Next: Transforms »](transforms)
