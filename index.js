'use strict';

const Config = require('./lib/config');
const MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: require('./package').name,

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
