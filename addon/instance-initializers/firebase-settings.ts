import ApplicationInstance from '@ember/application/instance';

export function initialize(appInstance: ApplicationInstance): void {
  const config = appInstance.resolveRegistration('config:environment');
  const firebase = appInstance.lookup('service:firebase');
  const db = firebase.firestore();

  if (config['ember-cloud-firestore-adapter']?.firestoreSettings) {
    db.settings(config['ember-cloud-firestore-adapter']?.firestoreSettings);
  }

  if (config['ember-cloud-firestore-adapter']?.emulator) {
    const { hostname, port } = config['ember-cloud-firestore-adapter'].emulator;

    db.useEmulator(hostname, port);
  }
}

export default {
  initialize,
};
