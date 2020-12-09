# Transforms

## Timestamp

Timestamp transform is provided as a convenience to [`firebase.firestore.FieldValue.serverTimestamp()`](https://firebase.google.com/docs/reference/js/firebase.firestore.FieldValue#servertimestamp).

```javascript
import Model, { attr } from '@ember-data/model';

export default class PostModel extends Model {
  @attr title;
  @attr('timestamp') createdOn;
  @attr('timestamp', { defaultValue: null }) modifiedOn;
  @attr('timestamp', { defaultValue: null }) publishOn;
}
```

In the example above, whenever you save a record who's `createdOn` is not either a `Date` instance or `null` it will use the server timestamp. Otherwise, it will use `null` or that same `Date` instead.

```javascript
let post = this.store.createRecord('post', {
  title: 'My Post',
  publishOn: new Date(2020, 11, 25, 12)
});
post.save();
```

produces the following in Firestore:

```javascript
{
  "posts": {
    "post_a": {
      "createdOn": "November 10, 2020 at 12:00:00 AM UTC-8",
      "modifiedOn": null,
      "publishOn": "December 25, 2020 at 12:00:00 AM UTC-8",
      "title": "My Post"
    }
  }
}
```

You could then set the timestamp-attributed property to `undefined` to update it with the `serverTimestamp` value:

```javascript
post.title = 'My Post (Edited)';
post.modifiedOn = undefined;
post.save();
```

```javascript
{
  "posts": {
    "post_a": {
      "createdOn": "November 10, 2020 at 12:00:00 AM UTC-8",
      "modifiedOn": "November 10, 2020 at 12:00:05 AM UTC-8",
      "publishOn": "December 25, 2020 at 12:00:00 AM UTC-8",
      "title": "My Post (Edited)"
    }
  }
}
```
---

[Next: Authentication »](authentication.md)
