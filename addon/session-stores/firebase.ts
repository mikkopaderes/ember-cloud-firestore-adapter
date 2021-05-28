import { getOwner } from '@ember/application';
import classic from 'ember-classic-decorator';

import FastBootService from 'ember-cli-fastboot/services/fastboot';
import LocalStorageStore from 'ember-simple-auth/session-stores/local-storage';

@classic
export default class FirebaseStore extends LocalStorageStore {
  private get fastboot(): FastBootService | null {
    return getOwner(this).lookup('service:fastboot');
  }

  public restore(): Promise<unknown> {
    if (this.fastboot?.isFastBoot) {
      if (this.fastboot.request.headers.get('Authorization')?.startsWith('Bearer ')) {
        return Promise.resolve({
          authenticated: { authenticator: 'authenticator:firebase' },
        });
      }

      return Promise.resolve({});
    }

    return super.restore();
  }
}
