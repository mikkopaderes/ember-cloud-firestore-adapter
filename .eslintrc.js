/* eslint-disable */

'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: [
    'ember',
  ],
  extends: [
    'airbnb-base',
    'plugin:ember/recommended',
  ],
  env: {
    browser: true,
  },
  globals: {
    FastBoot: 'readonly',
  },
  rules: {
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
    }],
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'ember/avoid-leaking-state-in-ember-objects': 'off',
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js',
      ],
      excludedFiles: [
        'addon/**',
        'addon-test-support/**',
        'app/**',
        'tests/dummy/app/**',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended']
    },
    // test files
    {
      files: ['**/*-test.js'],
      rules: {
        'prefer-arrow-callback': 'off',
        'func-names': 'off'
      }
    }
  ]
};
