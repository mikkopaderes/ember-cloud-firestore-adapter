import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

import { User, UserCredential } from 'firebase/auth';
import BaseAuthenticator from 'ember-simple-auth/authenticators/base';
import firebase from 'firebase/compat/app';

import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'ember-cloud-firestore-adapter/firebase/auth';
import FirebaseService from 'ember-cloud-firestore-adapter/services/-firebase';

interface AuthenticateCallback {
  (auth: firebase.auth.Auth): Promise<UserCredential>;
}

export default class FirebaseAuthenticator extends BaseAuthenticator {
  @service('-firebase')
  private firebase!: FirebaseService;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private get fastboot(): any {
    return getOwner(this).lookup('service:fastboot');
  }

  public async authenticate(
    callback: AuthenticateCallback
  ): Promise<{ user: User | null }> {
    const auth = this.firebase.auth();
    const credential = await callback(auth);

    return { user: credential.user };
  }

  public invalidate(): Promise<void> {
    const auth = this.firebase.auth();

    return signOut(auth);
  }

  public restore(): Promise<{ user: User | null }> {
    return new Promise((resolve, reject) => {
      const auth = this.firebase.auth();

      if (
        this.fastboot?.isFastBoot &&
        this.fastboot.request.headers
          .get('Authorization')
          ?.startsWith('Bearer ')
      ) {
        const token = this.fastboot.request.headers
          .get('Authorization')
          ?.split('Bearer ')[1];

        if (token) {
          signInWithCustomToken(auth, token)
            .then((credential) => {
              resolve({ user: credential.user });
            })
            .catch(() => {
              reject();
            });
        } else {
          reject();
        }
      } else {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            unsubscribe();

            if (user) {
              resolve({ user });
            } else {
              getRedirectResult(auth)
                .then((credential) => {
                  if (credential) {
                    resolve({ user: credential.user });
                  } else {
                    reject();
                  }
                })
                .catch(() => {
                  reject();
                });
            }
          },
          () => {
            reject();
            unsubscribe();
          }
        );
      }
    });
  }
}
