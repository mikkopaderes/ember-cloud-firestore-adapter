import { computed } from '@ember/object';
import { getOwner } from '@ember/application';

import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage';

/**
 * @extends LocalStorageStore
 */
export default LocalStorageStore.extend({
  /**
   * @type {Ember.Service}
   */
  fastboot: computed({
    get() {
      return getOwner(this).lookup('service:fastboot');
    },
  }),

  /**
   * @override
   */
  restore(...args) {
    if (this.fastboot && this.fastboot.isFastBoot) {
      if (
        this.fastboot.request.headers.get('Authorization')
        && this.fastboot.request.headers.get('Authorization').startsWith('Bearer ')
      ) {
        return Promise.resolve({
          authenticated: { authenticator: 'authenticator:firebase' },
        });
      }

      return Promise.resolve({});
    }

    return this._super(...args);
  },
});
