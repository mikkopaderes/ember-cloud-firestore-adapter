import {
  firebaseVersion,
  firebaseConfig,
} from 'ember-cloud-firestore-adapter/service-worker/config';

importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`);
importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`);

firebase.initializeApp(firebaseConfig);

function getIdToken() {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();

      if (user) {
        user.getIdToken().then(idToken => resolve(idToken)).catch(() => resolve(null));
      } else {
        resolve(null);
      }
    });
  });
};

function cloneHeaderWithIdToken(headersToClone, idToken) {
  const newHeaders = new Headers();

  for (let entry of headersToClone.entries()) {
    newHeaders.append(entry[0], entry[1]);
  }

  newHeaders.append('Authorization', `Bearer ${idToken}`);

  return newHeaders;
}

self.addEventListener('fetch', (event) => {
  const requestProcessor = (idToken) => {
    let req = event.request;
    const { origin: eventRequestUrlOrigin } = new URL(event.request.url);

    if (
      self.location.origin == eventRequestUrlOrigin
      && (self.location.protocol == 'https:' || self.location.hostname == 'localhost')
      && idToken
    ) {
      const headers = cloneHeaderWithIdToken(req.headers, idToken);

      try {
        req = new Request(req.url, {
          method: req.method,
          headers: headers,
          mode: 'same-origin',
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          referrer: req.referrer,
          body: req.body,
          bodyUsed: req.bodyUsed,
          context: req.context
        });
      } catch (e) {
        // This will fail for CORS requests. We just continue with the
        // fetch caching logic below and do not pass the ID token.
      }
    }

    return fetch(req);
  };

  event.respondWith(getIdToken().then(requestProcessor).catch(requestProcessor));
});
