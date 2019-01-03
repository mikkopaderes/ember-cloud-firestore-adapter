import { inject as service } from '@ember/service';

import Base from 'ember-simple-auth/authenticators/base';

/**
 * @class Firebase
 * @namespace Authenticators
 * @extends Base
 */
export default Base.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: service('firebase'),

  /**
   * @callback authenticateCallback
   * @param {firebase.auth.Auth} auth
   * @return {Promise} Resolves with the result of the callback
   */

  /**
   * @param {authenticateCallback} callback
   * @return {Promise} Resolves with the result of the callback
   * @function
   */
  authenticate(callback) {
    const auth = this.firebase.auth();

    return callback(auth).then(result => ({ user: result.user }));
  },

  /**
   * @return {Promise} Resolves once the current user is signed out
   * @function
   */
  invalidate() {
    return this.firebase.auth().signOut();
  },

  /**
   * @return {Promise} Resolves once the current user is signed out
   * @function
   */
  restore() {
    return new Promise((resolve, reject) => {
      const auth = this.firebase.auth();
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          resolve({ user });
        } else {
          auth.getRedirectResult().then((result) => {
            if (result.user) {
              resolve({ user: result.user });
            } else {
              reject();
            }
          }).catch(() => reject());
        }

        unsubscribe();
      }, () => {
        reject();
        unsubscribe();
      });
    });
  },
});
