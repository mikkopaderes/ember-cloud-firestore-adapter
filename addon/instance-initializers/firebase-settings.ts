import { warn } from '@ember/debug';
import ApplicationInstance from '@ember/application/instance';

export function initialize(appInstance: ApplicationInstance): void {
  const config = appInstance.resolveRegistration('config:environment');
  const firebase = appInstance.lookup('service:firebase');
  const db = firebase.firestore();

  try {
    if (config['ember-cloud-firestore-adapter']?.firestoreSettings) {
      db.settings(config['ember-cloud-firestore-adapter']?.firestoreSettings);
    }

    if (config['ember-cloud-firestore-adapter']?.emulator) {
      const {
        hostname, port, firestorePort, authPort,
      } = config['ember-cloud-firestore-adapter'].emulator;

      // retain "port" as fallback for backwards compat
      db.useEmulator(hostname, firestorePort || port);
      if (authPort) {
        // for some reason the auth().useEmulator requires a string url, rather
        // than (hostname, port), even though it seems only localhost-over-HTTP is
        // supported: https://github.com/firebase/firebase-js-sdk/issues/4124
        //
        // https://firebase.google.com/docs/emulator-suite/connect_auth#android_ios_and_web_sdks
        // https://firebase.google.com/docs/reference/js/firebase.auth.Auth#useemulator
        firebase.auth().useEmulator(`http://${hostname}:${authPort}`);
      }
    }
  } catch (e) {
    if (e.name === 'FirebaseError' && e.code === 'failed-precondition') {
      warn(e.message, { id: 'ember-debug.firebase-error.failed-precondition' });
    } else {
      throw e;
    }
  }
}

export default {
  initialize,
};
