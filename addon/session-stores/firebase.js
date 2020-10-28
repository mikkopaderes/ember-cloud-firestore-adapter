import { getOwner } from '@ember/application';

import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage';

export default class FirebaseStore extends LocalStorageStore {
  get fastboot() {
    return getOwner(this).lookup('service:fastboot');
  }

  restore(...args) {
    if (this.fastboot?.isFastBoot) {
      if (this.fastboot.request.headers.get('Authorization')?.startsWith('Bearer ')) {
        return Promise.resolve({
          authenticated: { authenticator: 'authenticator:firebase' },
        });
      }

      return Promise.resolve({});
    }

    return super.restore(...args);
  }
}
