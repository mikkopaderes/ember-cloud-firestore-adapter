'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['ember', '@typescript-eslint'],
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
        extensions: ['.mjs', '.js', '.json', '.ts'],
      },
    },
    'import/extensions': ['.js', '.mjs', '.jsx', '.ts'],
  },
  rules: {
    semi: 'off', // enforced by @typescript-eslint/semi
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        jsx: 'never',
        ts: 'never',
      },
    ],
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    'ember/use-ember-data-rfc-395-imports': 'off',
    'no-restricted-exports': 'off',
    'lines-between-class-members': 'off',
    'array-callback-return': 'off',
    'func-names': 'off',
  },
  overrides: [
    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.template-lintrc.js',
        './ember-cli-build.js',
        './index.js',
        './testem.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'global-require': 'off',
        'prefer-object-spread': 'off',
        'prefer-rest-params': 'off',
        strict: 'off',
        'node/no-extraneous-require': 'off',
      },
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
      rules: {
        'prefer-arrow-callback': 'off',
        'func-names': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
};
