import {
  firebaseVersion,
  firebaseConfig,
} from 'ember-cloud-firestore-adapter/service-worker/config';

importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`);
importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`);

firebase.initializeApp(firebaseConfig);
