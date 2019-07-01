'use strict';

const Config = require('./lib/config');
const Funnel = require('broccoli-funnel');
const MergeTrees = require('broccoli-merge-trees');
const fastbootTransform = require('fastboot-transform');

module.exports = {
  name: 'ember-cloud-firestore-adapter',

  included(app) {
    this._super.included.apply(this, arguments);

    if (Object.prototype.hasOwnProperty.call(app.options, 'esw-ember-cloud-firestore-adapter')) {
      this.serviceWorkerOption = app.options['esw-ember-cloud-firestore-adapter'];
    } else {
      this.serviceWorkerOption = {};
    }

    const { firebase: firebaseConfig } = this.project.config(app.env);

    this.serviceWorkerOption = Object.assign({}, this.serviceWorkerOption, { firebaseConfig });

    app.import('vendor/fastboot-shims/firebase/firebase-auth.js');
    app.import('vendor/fastboot-shims/firebase/firebase-firestore.js');

    if (app.env !== 'production') {
      app.import('node_modules/mock-cloud-firestore/dist/mock-cloud-firestore.js');
      app.import('vendor/shims/mock-cloud-firestore.js');
    }
  },

  treeForServiceWorker(swTree, appTree) {
    const configFile = new Config([appTree], this.serviceWorkerOption);

    return new MergeTrees([swTree, configFile]);
  },

  treeForVendor(defaultTree) {
    const browserVendorLib = new Funnel('node_modules', {
      destDir: 'fastboot-shims',
      files: ['firebase/firebase-auth.js', 'firebase/firebase-firestore.js'],
    });

    return new MergeTrees([defaultTree, fastbootTransform(browserVendorLib)]);
  },
};
