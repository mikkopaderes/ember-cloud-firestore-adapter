# Transforms

## Timestamp

Timestamp transform is provided as a convenience to [`firebase.firestore.FieldValue.serverTimestamp()`](https://firebase.google.com/docs/reference/js/firebase.firestore.FieldValue#.serverTimestamp).

```javascript
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  title: attr('string'),
  createdOn: attr('timestamp'),
});
```

In the example above, whenever you save a record who's `createdOn` is not a `Date` instance it'll use the server timestamp. Otherwise, it'll use that same `Date` instead.

---

[Next: Patterns »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/06-patterns.md)
