module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  rules: {
    // 🚨 STRESS TEST MODE: ULTRA-STRICT RULES 🚨
    
    // Prevent console.log in production
    'no-console': ['error', { 
      allow: ['warn', 'error', 'info'] 
    }],
    
    // Prevent debugger statements
    'no-debugger': 'error',
    
    // Prevent TODO/FIXME in critical files
    'no-warning-comments': ['warn', {
      terms: ['todo', 'fixme', 'hack', 'bug'],
      location: 'start'
    }],
    
    // Prevent unused variables (critical for memory leaks)
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Prevent any types (type safety)
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Require explicit return types for functions
    '@typescript-eslint/explicit-function-return-type': 'warn',
    
    // Prevent implicit returns
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    
    // Prevent non-null assertions (safety)
    '@typescript-eslint/no-non-null-assertion': 'error',
    
    // Require proper error handling
    '@typescript-eslint/no-floating-promises': 'error',
    
    // Prevent unsafe member access
    '@typescript-eslint/no-unsafe-member-access': 'error',
    
    // Prevent unsafe calls
    '@typescript-eslint/no-unsafe-call': 'error',
    
    // Prevent unsafe assignments
    '@typescript-eslint/no-unsafe-assignment': 'error',
    
    // Prevent unsafe returns
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Require proper async/await usage
    '@typescript-eslint/await-thenable': 'error',
    
    // Prevent memory leaks with proper cleanup
    '@typescript-eslint/no-misused-promises': 'error',
    
    // Security: Prevent eval-like constructs
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Security: Prevent XSS vulnerabilities
    'no-script-url': 'error',
    
    // Performance: Prevent inefficient patterns
    'no-loop-func': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    
    // Prevent common mistakes
    'no-duplicate-case': 'error',
    'no-duplicate-imports': 'error',
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',
    
    // Enforce consistent code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-trailing': ['error', 'never'],
    
    // Prevent complexity issues
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', 500],
    'max-lines-per-function': ['warn', 100],
    'max-params': ['warn', 5],
    
    // Standard ESLint rules only for compatibility
  },
  
  
  overrides: [
    {
      // Relaxed rules for test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off'
      }
    },
    {
      // Ultra-strict rules for production code
      files: [
        '**/controllers/**/*.ts',
        '**/models/**/*.ts',
        '**/services/**/*.ts',
        '**/middleware/**/*.ts'
      ],
      rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        'complexity': ['error', 8],
        'max-lines-per-function': ['error', 50]
      }
    }
  ]
};

// Custom ESLint rules for our specific requirements
const customRules = {
  'no-hardcoded-dates': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent hardcoded new Date() fallbacks',
        category: 'Possible Errors'
      }
    },
    create: function(context) {
      return {
        NewExpression: function(node) {
          if (node.callee.name === 'Date' && node.arguments.length === 0) {
            const sourceCode = context.getSourceCode();
            const comments = sourceCode.getCommentsBefore(node);
            const hasAllowedComment = comments.some(comment => 
              comment.value.includes('ALLOWED') || 
              comment.value.includes('INTENTIONAL')
            );
            
            if (!hasAllowedComment) {
              context.report({
                node,
                message: 'Hardcoded new Date() detected. Use proper date extraction or add // ALLOWED comment.'
              });
            }
          }
        }
      };
    }
  },
  
  'require-error-handling': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Require proper error handling in async functions',
        category: 'Best Practices'
      }
    },
    create: function(context) {
      return {
        FunctionDeclaration: function(node) {
          if (node.async) {
            // Check if function has try-catch or returns rejected promise
            const hasErrorHandling = context.getSourceCode()
              .getText(node)
              .includes('try') || 
              context.getSourceCode()
              .getText(node)
              .includes('catch');
              
            if (!hasErrorHandling) {
              context.report({
                node,
                message: 'Async function should include error handling (try-catch or .catch())'
              });
            }
          }
        }
      };
    }
  }
};