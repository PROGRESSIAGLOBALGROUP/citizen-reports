module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/backend/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/backups/', 
    'citizen-reports_08-DEC',
    '/tests/e2e/',
    '/tests/frontend/',
    '\\.spec\\.ts$'
  ],
  modulePathIgnorePatterns: ['<rootDir>/backups/', '<rootDir>/tests/e2e/', '<rootDir>/tests/frontend/'],
  collectCoverageFrom: ['server/**/*.js'],
  coverageDirectory: 'coverage/backend',
  coverageReporters: ['text', 'lcov'],
  transform: {},
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json']
};
