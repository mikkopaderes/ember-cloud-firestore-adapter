'use strict';

module.exports = {
  name: 'ember-cloud-firestore-adapter',

  included(app) {
    this._super.included.apply(this, arguments);

    app.import('node_modules/firebase/firebase-firestore.js');
    app.import('vendor/fastboot/firestore.js');

    if (app.env !== 'production') {
      app.import('node_modules/mock-cloud-firestore/dist/mock-cloud-firestore.js');
      app.import('vendor/shims/mock-cloud-firestore.js');
    }
  },
};
