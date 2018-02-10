'use strict';

const Funnel = require('broccoli-funnel');

module.exports = {
  name: 'ember-cloud-firestore-adapter',

  included(app) {
    this._super.included.apply(this, arguments);

    app.import('node_modules/firebase/firebase.js');
    app.import('node_modules/firebase/firebase-firestore.js');
  },

  treeForApp() {
    const tree = this._super.treeForApp.apply(this, arguments);
    const assetsToExclude = [];

    if (process.env.EMBER_ENV === 'production') {
      assetsToExclude.push('**/mirage-helpers.js');
    }

    return new Funnel(tree, { exclude: assetsToExclude });
  },

  treeForAddon() {
    const tree = this._super.treeForAddon.apply(this, arguments);
    const assetsToExclude = [];

    if (process.env.EMBER_ENV === 'production') {
      assetsToExclude.push('**/mirage-helpers.js');
    }

    return new Funnel(tree, { exclude: assetsToExclude });
  },
};
