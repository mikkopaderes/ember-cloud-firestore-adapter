# Transforms

## Timestamp

Timestamp transform is provided as a convenience to [`firebase.firestore.FieldValue.serverTimestamp()`](https://firebase.google.com/docs/reference/js/firebase.firestore.FieldValue#servertimestamp).

```javascript
import Model, { attr } from '@ember-data/model';

export default class PostModel extends Model {
  @attr title;
  @attr('timestamp') createdOn;
}
```

In the example above, whenever you save a record where the value of `createdOn` is of a `Date` or `null` instance, it will use that value as-is. Otherwise, it wll use `firebase.firestore.FieldValue.serverTimestamp()`.

---

[Next: Authentication »](authentication.md)
