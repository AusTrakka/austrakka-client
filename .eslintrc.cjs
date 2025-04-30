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
  },
  rules: {
    'operator-linebreak': 0,  // allow linebreak near = (and near logical operators)
    'implicit-arrow-linebreak': 0,  // allows linebreak after =>
    'object-curly-newline': ['error', { 'consistent': true }],   // one-line {} or newlines, just be consistent
    'arrow-parens': 0,   // allow a => a+b. Alternatively could use ['error','as-needed']
    'quote-props': ['error', 'consistent'],  // enforce quotes on all properties, or none
    'import/prefer-default-export': 0, // allow single exports
    'no-param-reassign': 0,  // allow modifying function parameters in-place
    'no-trailing-spaces': ['error', { 'ignoreComments': true, 'skipBlankLines': true }],
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
    }],  // allow vars starting with _
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
        },
        {
            selector: 'typeLike',
            format: ['PascalCase'],
        },
    ],
    'no-restricted-syntax': [  // dropping ForOfStatement; reiterating the other rules
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    "react/jsx-no-useless-fragment": 0,
  },
};
