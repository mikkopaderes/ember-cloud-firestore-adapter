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
    namespace: 'api',
  });
}

export default adapter;
