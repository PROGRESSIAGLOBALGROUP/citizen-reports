module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: false
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended']
    },
    {
      files: ['tests/**/*.js', 'tests/**/*.jsx', 'tests/**/*.ts', 'tests/**/*.tsx'],
      env: {
        jest: true
      }
    },
    {
      files: ['server/**/*.js'],
      env: {
        node: true
      }
    }
  ],
  ignorePatterns: ['client/dist', 'server/data.db']
};
