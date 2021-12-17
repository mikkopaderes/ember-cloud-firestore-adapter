import ApplicationInstance from '@ember/application/instance';

import firebase from 'firebase/compat/app';

interface FirestoreAddonConfig {
  settings?: { [key: string]: string };
  emulator?: {
    hostname: string;
    port: number;
    options?: { [key: string]: unknown };
  };
}

interface AuthAddonConfig {
  emulator?: {
    hostname: string;
    port: number;
  };
}

function setupFirestore(app: firebase.app.App, config: FirestoreAddonConfig) {
  const db = app.firestore();

  if (config.settings) {
    db.settings(config.settings);
  }

  if (config.emulator) {
    const { hostname, port, options } = config.emulator;

    db.useEmulator(hostname, port, options);
  }
}

function setupAuth(app: firebase.app.App, config: AuthAddonConfig) {
  const auth = app.auth();

  if (config.emulator) {
    const { hostname, port } = config.emulator;

    auth.useEmulator(`http://${hostname}:${port}`);
  }
}

export function initialize(appInstance: ApplicationInstance): void {
  const config = appInstance.resolveRegistration('config:environment');
  const addonConfig = config['ember-cloud-firestore-adapter'];

  try {
    const app: firebase.app.App = appInstance.lookup('service:-firebase');

    if (addonConfig.firestore) {
      setupFirestore(app, addonConfig.firestore);
    }

    if (addonConfig.auth) {
      setupAuth(app, addonConfig.auth);
    }
  } catch (e) {
    if (e.code !== 'failed-precondition') {
      throw new Error(
        `There was a problem with initializing Firebase. Check if you've configured the addon properly. | Error: ${e}`
      );
    }
  }
}

export default {
  initialize,
};
