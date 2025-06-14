const typescriptParser = require('@typescript-eslint/parser');

module.exports = {
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
      project: './tsconfig.json',
    },
    globals: {
      // Add browser and node globals if needed, e.g. from eslint-plugin-env
      // browser: true, // Example
      // node: true,    // Example
    }
  },
  // env: { // env is often superseded by globals in languageOptions for flat config
  //   browser: true,
  //   node: true,
  //   es6: true,
  // },
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'), // For flat config, plugins are typically objects
    'unused-imports': require('eslint-plugin-unused-imports'),
    'react': require('eslint-plugin-react'),
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off', 
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/jsx-key': 'warn',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '*.config.js', '*.config.ts', '.eslintrc.js', '.eslintrc.cjs'], // Added .eslintrc.cjs to ignorePatterns
}; 