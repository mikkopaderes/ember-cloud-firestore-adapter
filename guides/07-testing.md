# Testing

At the moment, Cloud Firestore doesn't provide any solution to mock data for testing. For now, we use [Mirage](https://github.com/samselikoff/ember-cli-mirage) for our automated tests and a [`mirage-helper.js`](https://github.com/rmmmp/ember-cloud-firestore-adapter/blob/master/guides/addon/utils/mirage-helpers.js) utility is available that should emulate Cloud Firestore's unique querying in some ways.

> Notes:
>
> - Use `mirage-helper.js` with caution. This is basically trying to emulate what Cloud Firestore does behind the scenes in terms of querying and may not accurately capture what its doing. At any case, report bugs if you find any.
> - `mirage-helper.js` will not be included in your production builds
> - It's recommended that you read about Mirage first to get a feel of how it works before diving into the setup below

## Setting up [Mirage](https://github.com/samselikoff/ember-cli-mirage)

### Adapter

Setup your Adapter like this

```javascript
import RESTAdapter from 'ember-data/adapters/rest';

import CloudFirestoreAdapter from 'ember-cloud-firestore-adapter/adapters/cloud-firestore';

import config from '../config/environment';

let adapter;

if (config.environment === 'test') {
  adapter = RESTAdapter.extend({
    namespace: 'api',
  });
} else {
  adapter = CloudFirestoreAdapter.extend({
    host: 'https://your-website.com',
    namespace: 'api',
  });
}

export default adapter;
```

Then in your `config/environment.js`

```javascript
...

if (environment === 'development') {
  ...

  ENV['ember-cli-mirage'] = { enabled: false };
}

...
```

With the setup above, your `ember test` and `http://localhost:4200/tests` will now run in Mirage while your development and production environment will run in Cloud Firestore.

### Route Handlers

Setup your `mirage/config.js` similar to this

```javascript
import { handleRouteResource } from 'ember-cloud-firestore-adapter/utils/mirage-helpers';

export default function() {
  this.namespace = '/api';

  handleRouteResource(this, 'blogPosts');
  handleRouteResource(this, 'cities');
  handleRouteResource(this, 'users');
}
```

> Notes:
>
> - The 2nd parameter to `handleRouteResource` is the camelized and pluralized name of your model
> - `handleRouteResource` is a wrapper that adds a `GET`, `POST`, `PUT`, `PATCH`, `DELETE` route handlers for a model. The `GET` handler is also modified to support the special queries of Cloud Firestore.

### Fixture Data

Your fixture data should not directly represent what your Cloud Firestore structure will look like. It should instead, represent how your data will look like in Ember Data. Doesn't make sense? Here's a more detailed example.

Let's say we have the following models

*Group model*

```javascript
import { hasMany } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  name: attr('string'),
  posts: hasMany('post')
});
```

*Post model*

```javascript
import { belongsTo } from 'ember-data/relationships';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  title: attr('string'),
  group: belongsTo('group')
});
```

And the `post` documents are in a subcollection under the `groups` collection instead of it being in a root-level collection like this

```json
{
  "groups": {  // Root-level collection
    "group_a": {
      "name": "Group A",
      "posts": { // Subcollection
        "post_a": {
          "title": "Post A Title",
          "group": "<reference to groups/group_a>"
        }
      }
    },

    "group_b": {
      "name": "Group B",
      "posts": { // Subcollection
        "post_b": {
          "title": "Post B Title",
          "group": "<reference to groups/group_b>"
        }
      }
    }
  }
}
```

In your fixture data, the `post` records should be setup just like how Ember Data would. So you should have a `mirage/fixtures/posts.js` that looks like this

```javascript
export default [{
  id: 'post_a',
  title: 'Post A Title',
  group: 'group_a',
  cloudFirestoreReference: 'post_a'
}, {
  id: 'post_b',
  title: 'Post B Title',
  group: 'group_b',
  cloudFirestoreReference: 'post_b'
}];
```

Notice that the fixture data contains a `cloudFirestoreReference` attribute. This should be the same with the record ID. Leaving this out will make filter queries that uses `post.get('cloudFirestoreReference')` not work.
