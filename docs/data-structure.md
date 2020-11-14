# Data Structure

There's an opinionated default on how this addon will structure your Cloud Firestore data. More of it will be explained below but basically:

  - Documents are stored under a collection derived from their camelized and pluralized model name (e.g. `user` = `users`, `city` = `cities`, and `blog-post` = `blogPosts`)
  - Attributes are camelized
  - Relationships are stored as `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) instead of their IDs
  - One-to-many relationships are only persisted in the `belongsTo` side.

There are however, APIs that would allow the adapter to consume whatever data structure that you already have.

## Example Data

Below demonstrates some simple Ember Data models and how they'd look like when persisted in Cloud Firestore.


```javascript
import Model, { attr, hasMany } from '@ember-data/model';

export default class GroupModel extends Model {
  @attr title;
  @hasMany('post') posts;
  @hasMany('user') members;
}
```

```javascript
import Model, { attr, belongsTo } from '@ember-data/model';

export default class PostModel extends Model {
  @attr title;
  @attr body;
  @attr('timestamp') createdOn;
  @belongsTo('user') author;
  @belongsTo('group') group;
}
```

```javascript
import Model, { attr, hasMany } from '@ember-data/model';

export default class UserModel extends Model {
  @attr name;
  @hasMany('group') groups;
  @hasMany('post') posts;
}
```

### Persisted Structure

```json
{
  "groups": {  // Root-level collection
    "group_a": {
      "name": "Group A",

      "members": {  // Subcollection
        "user_a": {
          "referenceTo": "<reference to users/user_a>"
        }
      }
    }
  },

  "posts": { // Root-level collection
    "post_a": {
      "title": "Post A Title",
      "body": "Post A Body",
      "createdOn": "January 1, 2017 at 12:00:00 AM UTC+8",
      "author": "<reference to users/user_a>",
      "group": "<reference to groups/group_a>"
    }
  },

  "users": {  // Root-level collection
    "user_a": {
      "name": "User A",

      "groups": {  // Subcollection
        "group_a": {
          "referenceTo": "<reference to groups/group_a>"
        }
      }
    }
  }
}
```

Notes:
  - Notice that we don't have a `posts` subcollection in `groups/group_a` and `users/user_a`. This is because in one-to-many relationships, only the `belongsTo` side gets persisted.
  - Relationships are saved as `Reference` [data type](https://firebase.google.com/docs/firestore/manage-data/data-types#data_types) instead of its ID of type string.
  - `referenceTo` is a **reserved** attribute to indicate that a field is a reference to another document. You can configure this to be named as something else. This works as follows:
    - When you fetch a `Group` document under `users/user_a/groups/group_a` and it has a `referenceTo` field to `groups/group_a`, it will return the document under that instead.
    - If the `referenceTo` field doesn't exist, it would return the `users/user_a/groups/group_a` as the document for the `Group` model.

---

[Next: Finding Records »](finding-records)
