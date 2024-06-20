'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'dummy',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    fastboot: {
      hostWhitelist: [/^localhost:\d+$/],
    },

    'ember-cloud-firestore-adapter': {
      firebaseConfig: {
        apiKey: '123qweasd',
        authDomain:
          'ember-cloud-firestore-adapter-test-project.firebaseapp.com',
        databaseURL:
          'https://ember-cloud-firestore-adapter-test-project.firebaseio.com',
        projectId: 'ember-cloud-firestore-adapter-test-project',
        storageBucket: 'ember-cloud-firestore-adapter-test-project.appspot.com',
        messagingSenderId: '123qweasd',
      },
      firestore: {
        emulator: {
          hostname: 'localhost',
          port: 8080,
        },
      },
      auth: {
        emulator: {
          hostname: 'localhost',
          port: 9099,
        },
      },
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
