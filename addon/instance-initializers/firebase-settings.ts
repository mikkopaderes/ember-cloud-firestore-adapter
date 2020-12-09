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
      const { hostname, port } = config['ember-cloud-firestore-adapter'].emulator;

      db.useEmulator(hostname, port);
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
