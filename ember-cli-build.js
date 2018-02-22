'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  const app = new EmberAddon(defaults, {
    'ember-cli-babel': { includePolyfill: true },
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

 app.import('node_modules/mock-cloud-firestore/dist/mock-cloud-firestore.js');
 app.import('vendor/shims/mock-cloud-firestore.js');

  return app.toTree();
};
