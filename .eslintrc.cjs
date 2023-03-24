module.exports = {
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  root: true,
  settings: {
    "import/resolver": {
      typescript: true,
      node: true
    }
  }
};