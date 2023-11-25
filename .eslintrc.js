module.exports = {
  env: {
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    quotes: ['error', 'single'],
    'no-trailing-spaces': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-unresolved': 'off',
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }]
  }
}
