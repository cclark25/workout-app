/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  globals: {
    __DEV__: true,
  },
  verbose: false, // false since we want to see console.logs inside tests
  bail: false,
  testEnvironment: 'jsdom',
  testRegex: '__unit__/.*',
  rootDir: '.',
  moduleDirectories: ['node_modules', 'src/components/lib'],
  testPathIgnorePatterns: [
    '<rootDir>/components/coverage/',
    '<rootDir>/test/cypress/',
    '<rootDir>/test/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
  ],
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  moduleNameMapper: {
    '^vue$': 'vue/dist/vue.common.js',
    quasar: 'quasar-framework/dist/umd/quasar.mat.umd.js',
  },
  resolver: null,
  transformIgnorePatterns: [
    'node_modules/core-js',
    'node_modules/babel-runtime',
    'node_modules/vue',
  ],
  transform: {
    '^.+\\.ts$': '<rootDir>/node_modules/ts-jest',
    // '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest',
  },
};

export default config;
