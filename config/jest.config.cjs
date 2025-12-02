const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: 'node',
  testMatch: ['**/tests/backend/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage/backend',
  coverageReporters: ['text', 'lcov'],
  // No transform - let Node.js handle ESM natively
  transform: {},
  moduleFileExtensions: ['js', 'json', 'node']
};
