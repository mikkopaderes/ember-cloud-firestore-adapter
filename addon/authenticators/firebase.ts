import { getOwner } from '@ember/application';

import { Auth, User, UserCredential } from 'firebase/auth';
import BaseAuthenticator from 'ember-simple-auth/authenticators/base';

import {
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'ember-cloud-firestore-adapter/firebase/auth';

interface AuthenticateCallback {
  (auth: Auth): Promise<UserCredential>;
}

export default class FirebaseAuthenticator extends BaseAuthenticator {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private get fastboot(): any {
    return getOwner(this).lookup('service:fastboot');
  }

  public async authenticate(callback: AuthenticateCallback): Promise<{ user: User | null }> {
    const auth = getAuth();
    const credential = await callback(auth);

    return { user: credential.user };
  }

  public invalidate(): Promise<void> {
    const auth = getAuth();

    return signOut(auth);
  }

  public restore(): Promise<{ user: User | null }> {
    return new Promise((resolve, reject) => {
      const auth = getAuth();

      if (
        this.fastboot?.isFastBoot
        && this.fastboot.request.headers.get('Authorization')?.startsWith('Bearer ')
      ) {
        const token = this.fastboot.request.headers.get('Authorization')?.split('Bearer ')[1];

        if (token) {
          signInWithCustomToken(auth, token).then((credential) => {
            resolve({ user: credential.user });
          }).catch(() => {
            reject();
          });
        } else {
          reject();
        }
      } else {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();

          if (user) {
            resolve({ user });
          } else {
            getRedirectResult(auth).then((credential) => {
              if (credential) {
                resolve({ user: credential.user });
              } else {
                reject();
              }
            }).catch(() => {
              reject();
            });
          }
        }, () => {
          reject();
          unsubscribe();
        });
      }
    });
  }
}
