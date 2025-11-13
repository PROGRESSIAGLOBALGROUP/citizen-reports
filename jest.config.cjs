module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/backend/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '.backup_'],
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage/backend',
  coverageReporters: ['text', 'lcov'],
  transform: {},
  verbose: true
};
