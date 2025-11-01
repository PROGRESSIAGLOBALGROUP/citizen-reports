module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/backend/**/*.test.js'],
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage/backend',
  coverageReporters: ['text', 'lcov'],
  transform: {}
};
