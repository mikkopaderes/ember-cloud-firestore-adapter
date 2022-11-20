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

### `buildReference`

Hook for providing a custom collection reference.

**Type:** `function`

**Params:**

| Name   | Type                                                                                                         | Description       |
| -------| ------------------------------------------------------------------------------------------------------------ | ----------------- |
| db     | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |                   |
| record | Object | The record itself |

## `hasMany`

The optional configs are available by passing it as a param.

```javascript
import Model, { attr, hasMany } from '@ember-data/model';

import { query, where } from 'ember-cloud-firestore-adapter/firebase/firestore';

export default class GroupModel extends Model {
  @attr name;

  @hasMany('post', {
    isRealtime: true,

    filter(reference) {
      return query(reference, where('status', '==', 'approved'));
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

**Type:** `function`

**Params:**

| Name   | Type                                                                                                         | Description       |
| -------| ------------------------------------------------------------------------------------------------------------ | ----------------- |
| db     | [`Firestore`](https://firebase.google.com/docs/reference/js/firestore_.firestore) |                   |
| record | Object | The record itself |

### `filter`

Hook for providing the query for the collection reference

**Type:** `function`

**Params:**

| Name      | Type                                                                                                                             | Description                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| reference | [`CollectionReference`](https://firebase.google.com/docs/reference/js/firestore_.collectionreference) | Will contain the return of `buildReference` when overriden. Otherwise, it will be provided by the adapter itself. |
| record    | Object                                                                                                                           | The record itself                                                                                               |

---

[Next: Transforms »](transforms.md)
