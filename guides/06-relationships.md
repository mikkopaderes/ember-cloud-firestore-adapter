# Relationships

The adapter supports `hasMany` and `belongsTo`. However, there are some **optional** configs that you can make use of to support your needs for `hasMany`.

## `hasMany`

The optional configs are available by passing it as a param.

```javascript
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  approvedPosts: hasMany('post', {
    filter(reference) {
      return reference.where('status', '==', 'approved');
    }
  })
});
```

If the document contains a field that matches your [`referenceKeyName`](02-configuration.md#settings), it'll fetch that one instead.

### `buildReference`

Hook for providing a custom collection reference.

This is ignored when the relationship is a many-to-one type.

**Type:** `function`

**Params:**

| Name   | Type               | Description       |
| -------| ------------------ | ----------------- |
| db     | firebase.firestore |                   |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`

**Params:**

| Name      | Type                                   | Description                                                                                                     |
| --------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | firebase.firestore.CollectionReference | Will contain the return of `buildReference` when overriden. Otherwise, it'll be provided by the adapter itself. |
| record    | Object                                 | The record itself                                                                                               |

---

[Next: Testing »](07-testing.md)
