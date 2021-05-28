/* eslint-disable */

'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'ember',
  ],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:ember/recommended',
  ],
  env: {
    browser: true,
  },
  globals: {
    FastBoot: 'readonly',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts']
      }
    },
    'import/extensions': [
      '.js',
      '.mjs',
      '.jsx',
      '.ts',
    ],
  },
  rules: {
    'semi': 'off', // enforced by @typescript-eslint/semi
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
    }],
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
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
      files: ['**/*-test.ts'],
      rules: {
        'prefer-arrow-callback': 'off',
        'func-names': 'off',
        '@typescript-eslint/no-empty-function': 'off'
      }
    }
  ]
};
