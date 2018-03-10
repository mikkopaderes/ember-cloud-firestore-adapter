'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary'),
  ]).then((urls) => {
    return {
      scenarios: [
        {
          name: 'ember-lts-2.12',
          npm: {
            devDependencies: {
              'ember-source': '~2.12.0'
            }
          }
        },
        {
          name: 'ember-lts-2.16',
          npm: {
            devDependencies: {
              'ember-source': '~2.16.0'
            }
          }
        },
        {
          name: 'ember-lts-2.18',
          npm: {
            devDependencies: {
              'ember-source': '~2.18.0'
            }
          }
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-source': urls[0]
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-source': urls[1]
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-source': urls[2]
            }
          }
        },
        {
          name: 'ember-default',
          npm: {
            devDependencies: {}
          }
        },
        {
          name: 'ember-data-release',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#release'
            },
            resolutions: {
              'ember-data': 'release'
            }
          }
        },
        {
          name: 'ember-data-beta',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#beta'
            },
            resolutions: {
              'ember-data': 'beta'
            }
          }
        },
        {
          name: 'ember-data-canary',
          npm: {
            devDependencies: {
              'ember-data': 'emberjs/data#master'
            },
            resolutions: {
              'ember-data': 'canary'
            }
          }
        }
      ]
    };
  });
};
