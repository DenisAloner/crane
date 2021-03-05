module.exports = {
  extends: [
    'standard',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: { 'prettier/prettier': 'error' },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        moduleDirectory: ['.'],
      },
    },
  },
}
