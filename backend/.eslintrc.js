module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // CUSTOM RULE: No hardcoded time defaults
    'no-restricted-syntax': [
      'error',
      {
        selector: 'NewExpression[callee.name="Date"][arguments.length=0]',
        message: '🚨 BANNED: new Date() without arguments. Use parseZonedDateTime() or extractDate() instead.'
      },
      {
        selector: 'BinaryExpression[left.value=2][right.left.value=60][right.right.value=60]',
        message: '🚨 BANNED: Hardcoded 2-hour duration. Use estimateArrivalTime() instead.'
      }
    ],
    
    // Force explicit error handling
    '@typescript-eslint/no-non-null-assertion': 'error',
    
    // Prevent any type
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Require return types
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }]
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};