import { module } from 'qunit';
import { resolve } from 'rsvp';

import { mockFirebase } from 'ember-cloud-firestore-adapter/test-support';
import destroyApp from '../helpers/destroy-app';
import getFixtureData from '../helpers/fixture-data';
import startApp from '../helpers/start-app';

export default function(name, options = {}) {
  module(name, {
    beforeEach() {
      this.application = startApp();

      const owner = this.application.__container__.owner;

      mockFirebase(owner, getFixtureData());

      if (options.beforeEach) {
        return options.beforeEach.apply(this, arguments);
      }
    },

    afterEach() {
      let afterEach = options.afterEach && options.afterEach.apply(this, arguments);
      return resolve(afterEach).then(() => destroyApp(this.application));
    }
  });
}
