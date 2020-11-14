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

In the example above, whenever you save a record who's `createdOn` is not of `Date` instance it will use the server timestamp. Otherwise, it will use that same `Date` instead.

---

[Next: Authentication »](authentication.md)
