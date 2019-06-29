import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

import Base from 'ember-simple-auth/authenticators/base';

/**
 * @class Firebase
 * @namespace Authenticator
 * @extends Base
 */
export default Base.extend({
  /**
   * @type {Ember.Service}
   */
  firebase: service('firebase'),

  /**
   * @type {Ember.Service}
   */
  fastboot: computed({
    get() {
      return getOwner(this).lookup('service:fastboot');
    },
  }),

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
   * @return {Promise} Resolves once the current user is signed in
   * @function
   */
  restore() {
    return new Promise((resolve, reject) => {
      const auth = this.firebase.auth();

      if (
        this.fastboot
        && this.fastboot.isFastBoot
        && this.fastboot.request.headers.get('Authorization')
        && this.fastboot.request.headers.get('Authorization').startsWith('Bearer ')
      ) {
        const token = this.fastboot.request.headers.get('Authorization').split('Bearer ')[1];

        auth.signInWithCustomToken(token)
          .then(result => resolve({ user: result.user }))
          .catch(() => reject());
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();

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
        }, () => {
          reject();
          unsubscribe();
        });
      }
    });
  },
});
