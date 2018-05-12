import Service, { inject as service } from '@ember/service';

/**
 * @class Firestore
 * @namespace Service
 * @extends Ember.Service
 */
export default Service.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: service(),

  /**
   * @type {Object}
   */
  settings: { timestampsInSnapshots: true },

  /**
   * @override
   */
  init(...args) {
    this._super(...args);

    const firestore = this.get('firebase').firestore();

    if (firestore.settings) {
      firestore.settings(this.get('settings'));
    }

    this.set('instance', firestore);
  },
});
