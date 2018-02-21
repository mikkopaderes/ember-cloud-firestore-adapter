(function() {
  function vendorModule() {
    'use strict';

    return {
      'default': self['MockFirebase'],
      __esModule: true,
    };
  }

  define('mock-cloud-firestore', [], vendorModule);
})();
