# Testing

We use [mock-cloud-firestore](https://github.com/mikkopaderes/mock-cloud-firestore) for testing Cloud Firestore while [`ember-simple-auth`](https://github.com/simplabs/ember-simple-auth#testing) provides a set of test helpers for authentication.

## Setup Cloud Firestore testing

### `mockFirebase()`

`mockFirebase()` test helper is provided for mocking Firebase. You'll need to feed it with your [fixture data](https://github.com/mikkopaderes/mock-cloud-firestore#fixture-data).

```javascript
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { mockFirebase } from 'ember-cloud-firestore-adapter/test-support';
import getFixtureData from '../../helpers/fixture-data';

module('Unit | Route | application', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    mockFirebase(this.owner, getFixtureData());
  });
});
```
