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
    'object-curly-newline': ['error', {'consistent': true}],   // one-line {} or newlines, just be consistent
    'arrow-parens': 0,   // allow a => a+b. Alternatively could use ['error','as-needed']
    'quote-props': ['error', 'consistent'],  // enforce quotes on all properties, or none
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
  },
};