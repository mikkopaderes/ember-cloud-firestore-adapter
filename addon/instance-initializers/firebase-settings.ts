import ApplicationInstance from '@ember/application/instance';

import { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { Firestore, EmulatorMockTokenOptions } from 'firebase/firestore';

import { initializeApp } from 'ember-cloud-firestore-adapter/firebase/app';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'ember-cloud-firestore-adapter/firebase/firestore';
import { connectAuthEmulator, getAuth } from 'ember-cloud-firestore-adapter/firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'ember-cloud-firestore-adapter/firebase/functions';
import { connectStorageEmulator, getStorage } from 'ember-cloud-firestore-adapter/firebase/storage';

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

interface FunctionsAddonConfig {
  isCustomSetup?: boolean;
  emulator?: {
    hostname: string,
    port: number,
  };
}

interface StorageAddonConfig {
  isCustomSetup?: boolean;
  emulator?: {
    hostname: string,
    port: number,
    options?: { mockUserToken?: EmulatorMockTokenOptions | string }
  };
}

interface AddonConfig {
  firebaseConfig: FirebaseOptions,
  firestore?: FirestoreAddonConfig;
  auth?: AuthAddonConfig;
  functions?: FunctionsAddonConfig;
  storage?: StorageAddonConfig;
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
    const { hostname, port, options } = config.emulator;

    connectAuthEmulator(getAuth(app), `http://${hostname}:${port}`, options);
  }
}

function setupFunctions(app: FirebaseApp, config: FunctionsAddonConfig) {
  if (config.emulator) {
    const { hostname, port } = config.emulator;

    connectFunctionsEmulator(getFunctions(app), hostname, port);
  }
}

function setupStorage(app: FirebaseApp, config: StorageAddonConfig) {
  if (config.emulator) {
    const { hostname, port, options } = config.emulator;

    connectStorageEmulator(getStorage(app), hostname, port, options);
  }
}

function setupModularInstance(config: AddonConfig) {
  const app = initializeApp(config.firebaseConfig);

  if (config.firestore && !config.firestore.isCustomSetup) {
    setupFirestore(app, config.firestore);
  }

  if (config.auth && !config.auth?.isCustomSetup) {
    setupAuth(app, config.auth);
  }

  if (config.functions && !config.functions?.isCustomSetup) {
    setupFunctions(app, config.functions);
  }

  if (config.storage && !config.storage?.isCustomSetup) {
    setupStorage(app, config.storage);
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
