import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

import BaseAuthenticator from 'ember-simple-auth/authenticators/base';
import FastBootService from 'ember-cli-fastboot/services/fastboot';
import FirebaseService from 'ember-cloud-firestore-adapter/services/-firebase';
import firebase from 'firebase/compat/app';

interface AuthenticateCallback {
  (auth: firebase.auth.Auth): Promise<firebase.auth.UserCredential>;
}

export default class FirebaseAuthenticator extends BaseAuthenticator {
  @service('-firebase')
  private firebase!: FirebaseService;

  private get fastboot(): FastBootService | null {
    return getOwner(this).lookup('service:fastboot');
  }

  public async authenticate(
    callback: AuthenticateCallback,
  ): Promise<{ user: firebase.User | null }> {
    const auth = this.firebase.auth();
    const credential = await callback(auth);

    return { user: credential.user };
  }

  public invalidate(): Promise<void> {
    return this.firebase.auth().signOut();
  }

  public restore(): Promise<{ user: firebase.User | null }> {
    return new Promise((resolve, reject) => {
      const auth = this.firebase.auth();

      if (
        this.fastboot?.isFastBoot
        && this.fastboot.request.headers.get('Authorization')?.startsWith('Bearer ')
      ) {
        const token = this.fastboot.request.headers.get('Authorization')?.split('Bearer ')[1];

        if (token) {
          auth.signInWithCustomToken(token).then((credential) => {
            resolve({ user: credential.user });
          }).catch(() => {
            reject();
          });
        } else {
          reject();
        }
      } else {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          unsubscribe();

          if (user) {
            resolve({ user });
          } else {
            auth.getRedirectResult().then((credential) => {
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
