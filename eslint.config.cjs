module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'icons/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    },

    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      semi: ['error', 'always']
    }
  }
];