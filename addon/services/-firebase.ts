import { getOwner } from '@ember/application';
import ApplicationInstance from '@ember/application/instance';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

function setupEnvFirebase() {
  if (typeof FastBoot === 'undefined') {
    return firebase;
  }

  const envFirebase = FastBoot.require('firebase/compat/app');

  FastBoot.require('firebase/compat/auth');
  FastBoot.require('firebase/compat/firestore');

  return envFirebase;
}

export default {
  isServiceFactory: true,

  create(context: ApplicationInstance): firebase.app.App {
    const config = getOwner(context).resolveRegistration('config:environment');
    const envFirebase = setupEnvFirebase();
    let firebaseApp;

    try {
      firebaseApp = envFirebase.app();
    } catch (e) {
      firebaseApp = envFirebase.initializeApp(config['ember-cloud-firestore-adapter'].firebaseConfig);
    }

    return firebaseApp;
  },
};
