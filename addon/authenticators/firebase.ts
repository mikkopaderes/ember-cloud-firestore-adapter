import { getOwner } from '@ember/application';

import {
  Auth,
  User,
  UserCredential,
  UserInfo,
} from 'firebase/auth';
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

interface CherryPickedUser {
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string;
  uid: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerData: UserInfo[];
  refreshToken: string;
  tenantId: string | null;
}

function parseCherryPickedUser(user: User): CherryPickedUser {
  return {
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    providerId: user.providerId,
    uid: user.uid,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    providerData: user.providerData,
    refreshToken: user.refreshToken,
    tenantId: user.tenantId,
  };
}

export default class FirebaseAuthenticator extends BaseAuthenticator {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private get fastboot(): any {
    return getOwner(this).lookup('service:fastboot');
  }

  public async authenticate(
    callback: AuthenticateCallback,
  ): Promise<{ user: CherryPickedUser | null }> {
    const auth = getAuth();
    const credential = await callback(auth);

    return { user: parseCherryPickedUser(credential.user) };
  }

  public invalidate(): Promise<void> {
    const auth = getAuth();

    return signOut(auth);
  }

  public restore(): Promise<{ user: CherryPickedUser | null }> {
    return new Promise((resolve, reject) => {
      const auth = getAuth();

      if (auth.currentUser) {
        resolve({ user: parseCherryPickedUser(auth.currentUser) });
        return;
      }

      if (
        this.fastboot?.isFastBoot
        && this.fastboot.request.headers.get('Authorization')?.startsWith('Bearer ')
      ) {
        const token = this.fastboot.request.headers.get('Authorization')?.split('Bearer ')[1];

        if (token) {
          signInWithCustomToken(auth, token).then((credential) => {
            resolve({ user: parseCherryPickedUser(credential.user) });
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
            resolve({ user: parseCherryPickedUser(user) });
          } else {
            getRedirectResult(auth).then((credential) => {
              if (credential) {
                resolve({ user: parseCherryPickedUser(credential.user) });
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
