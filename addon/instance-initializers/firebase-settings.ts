import ApplicationInstance from '@ember/application/instance';

import { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { Firestore } from 'firebase/firestore';

import { initializeApp } from 'ember-cloud-firestore-adapter/firebase/app';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'ember-cloud-firestore-adapter/firebase/firestore';
import { connectAuthEmulator, getAuth } from 'ember-cloud-firestore-adapter/firebase/auth';

interface FirestoreAddonConfig {
  isCustomSetup?: boolean;
  settings?: { [key: string]: string };
  emulator?: {
    hostname: string,
    port: number,
    options?: { [key: string]: unknown }
  };
}

interface AuthAddonConfig {
  isCustomSetup?: boolean;
  emulator?: {
    hostname: string,
    port: number,
    options?: { disableWarnings: boolean }
  };
}

interface AddonConfig {
  firebaseConfig: FirebaseOptions,
  firestore: FirestoreAddonConfig;
  auth: AuthAddonConfig;
}

function getDb(app: FirebaseApp, config: FirestoreAddonConfig): Firestore {
  if (config.settings) {
    return initializeFirestore(app, config.settings);
  }

  return getFirestore(app);
}

function setupFirestore(app: FirebaseApp, config: FirestoreAddonConfig): void {
  const db = getDb(app, config);

  if (config.emulator) {
    const { hostname, port, options } = config.emulator;

    connectFirestoreEmulator(db, hostname, port, options);
  }
}

function setupAuth(app: FirebaseApp, config: AuthAddonConfig) {
  if (config.emulator) {
    const { hostname, port } = config.emulator;

    connectAuthEmulator(getAuth(app), `http://${hostname}:${port}`, config.emulator.options);
  }
}

function setupModularInstance(config: AddonConfig) {
  const app = initializeApp(config.firebaseConfig);

  if (!config.firestore.isCustomSetup) {
    setupFirestore(app, config.firestore);
  }

  if (!config.auth.isCustomSetup) {
    setupAuth(app, config.auth);
  }
}

export function initialize(appInstance: ApplicationInstance): void {
  const config = appInstance.resolveRegistration('config:environment');
  const addonConfig: AddonConfig = config['ember-cloud-firestore-adapter'];

  try {
    setupModularInstance(addonConfig);
  } catch (e) {
    if (e.code !== 'failed-precondition') {
      throw new Error(`There was a problem with initializing Firebase. Check if you've configured the addon properly. | Error: ${e}`);
    }
  }
}

export default {
  initialize,
};
