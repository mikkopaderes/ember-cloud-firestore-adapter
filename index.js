'use strict';

module.exports = {
  name: 'ember-cloud-firestore-adapter',

  included(app) {
    this._super.included.apply(this, arguments);

    app.import('node_modules/firebase/firebase.js');
    app.import('node_modules/firebase/firebase-firestore.js');
  },
};
