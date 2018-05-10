# Relationships

## `hasMany`

### Using Filters

Using `filter()` is a great way to control your `hasMany` relationships.

```javascript
// Group model
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  posts: hasMany('post', {
    // Use the record variable to access model props (e.g. record.get('name'))
    filter(reference, record) {
      return reference.limit(5);
    }
  })
});
```

### Under a specified collection

When a relationship is a many-to-many or many-to-none, you'll have an option to specify in which collection you'd like to fetch the data from.

```javascript
// Group model
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  posts: hasMany('post', {
    // This makes the relationship as many-to-none
    inverse: null,

    // Use the record variable to access model props (e.g. record.get('name'))
    buildReference(db, record) {
      return db.collection('posts');
    }
  })
});
```

> Notes:
>
> - In the example above, if we don't override `buildReference()`, it'll look for the records under the `/groups/<group_id>/posts` sub-collection.

#### Change Filters During Runtime

This is how you can change the `filter()` and reload the relationship once it's been set

```javascript
this.get('store').findRecord('group', 'group_a').then((group) => {
  group.get('posts').then((posts) => {
    posts.relationship.relationshipMeta.options.filter = (reference, record) => {
      return reference.limit(10);
    };
    posts.reload();
  });
});
```

> Notes:
>
> - This is useful for cases such as infinite scrolling.
> - I'm not sure if my example above is a public API in Ember Data. There may be a chance that this example won't work in the future.

---

[Next: Testing »](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/07-testing.md)
