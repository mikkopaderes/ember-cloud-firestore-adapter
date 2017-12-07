# Data Structure

## TL;DR

- Documents are stored under a collection derived from their camelized and pluralized model name (e.g. `user` = `users`, `city` = `cities`, and `blog-post` = `blogPosts`)
- Attributes are camelized
- Relationships are stored as `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) instead of their IDs
- One-to-many relationships are only persisted in the `belongsTo` side.

## Example Data

For the following models

*Group model*

```javascript
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  posts: hasMany('post'),
  members: hasMany('user')
});
```

*Post model*

```javascript
import { belongsTo } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  body: attr('string'),
  createdOn: attr('timestamp'),
  title: attr('string'),
  author: belongsTo('user'),
  group: belongsTo('group')
});
```

*User model*

```javascript
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  groups: hasMany('group'),
  posts: hasMany('post')
});
```

It'll be stored in Cloud Firestore like this

```json
{
  "groups": {  // Root-level collection
    "group_a": {
      "name": "Group A",
      "members": {  // Subcollection
        "user_a": {
          "cloudFirestoreReference": "<reference to users/user_a>"
        }
      }
    }
  },

  "posts": { // Root-level collection
    "post_a": {
      "body": "Post A Body",
      "createdOn": "January 1, 2017 at 12:00:00 AM UTC+8",
      "title": "Post A Title",
      "author": "<reference to users/user_a>",
      "group": "<reference to groups/group_a>"
    }
  },

  "users": {  // Root-level collection
    "user_a": {
      "name": "User A",
      "groups": {  // Subcollection
        "group_a": "<reference to groups/group_a>"
      }
    }
  }
}
```

> Notes:
>
> - Notice that we don't have a `posts` subcollection in `groups/group_a` and `users/user_a`. This is because in one-to-many relationships, only the `belongsTo` side gets persisted. *Due to this, loading `hasMany` when it's a **one-to-many** relationship won't work as the Adapter isn't intelligent enough to query from the `belongsTo` side on its own. Support for this will come soon. Consider using [synchronous `hasMany`](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/06-patterns.md) instead.*
> - Relationships are saved as `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) instead of its ID of type string.
> - `cloudFirestoreReference` is a **reserved** attribute to indicate that a document is a reference to another document.

## Model Extensions

Models are extended to include a `cloudFirestoreReference` attribute. It'll contain the [`DocumentReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference) for that record. Later on, you'll see how we'll make use of this in queries.

> Notes:
>
> - `cloudFirestoreReference` is a **client-side** only property
> - Changing `cloudFirestoreReference` to a different name of your preference is currently unsupported

---

[Next: Configuration »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/02-configuration.md)
