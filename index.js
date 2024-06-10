'use strict';

const MergeTrees = require('broccoli-merge-trees');
const Config = require('./lib/config');

module.exports = {
  name: 'ember-cloud-firestore-adapter',

  included(app) {
    this._super.included.apply(this, arguments);

    if (Object.prototype.hasOwnProperty.call(app.options, 'esw-ember-cloud-firestore-adapter')) {
      this.serviceWorkerOption = app.options['esw-ember-cloud-firestore-adapter'];
    } else {
      this.serviceWorkerOption = {};
    }

    const {
      firebaseConfig,
      firebaseVersion,
    } = this.project.config(app.env)['ember-cloud-firestore-adapter'];

    this.serviceWorkerOption = Object.assign({}, this.serviceWorkerOption, {
      firebaseConfig,
      firebaseVersion,
    });
  },

  treeForServiceWorker(swTree, appTree) {
    const configFile = new Config([appTree], this.serviceWorkerOption);

    return new MergeTrees([swTree, configFile]);
  },
};
