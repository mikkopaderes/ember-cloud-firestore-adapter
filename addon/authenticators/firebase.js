import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

import Base from 'ember-simple-auth/authenticators/base';

export default class FirebaseAuthenticator extends Base {
  @service firebase;

  get fastboot() {
    return getOwner(this).lookup('service:fastboot');
  }

  authenticate(callback) {
    const auth = this.firebase.auth();

    return callback(auth).then((result) => ({ user: result.user }));
  }

  invalidate() {
    return this.firebase.auth().signOut();
  }

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
          .then((result) => resolve({ user: result.user }))
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
  }
}
