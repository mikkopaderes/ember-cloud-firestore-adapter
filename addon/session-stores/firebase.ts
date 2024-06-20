import { getOwner } from '@ember/application';

import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage';

export default class FirebaseStore extends LocalStorageStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get fastboot(): any {
    return getOwner(this)?.lookup('service:fastboot');
  }

  public restore(): Promise<unknown> {
    if (this.fastboot?.isFastBoot) {
      if (
        this.fastboot.request.headers
          .get('Authorization')
          ?.startsWith('Bearer ')
      ) {
        return Promise.resolve({
          authenticated: { authenticator: 'authenticator:firebase' },
        });
      }

      return Promise.resolve({});
    }

    return super.restore();
  }
}
