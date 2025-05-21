// @ts-check

import globals from "globals";
import tseslint from 'typescript-eslint';
import eslintJs from '@eslint/js';
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  // Global ignores
  {
    ignores: ["node_modules/", "dist/", "build/", "*.config.js", "*.config.ts", "frontend/v2/.eslintrc.cjs"],
  },

  // Base ESLint recommended rules
  eslintJs.configs.recommended,

  // TypeScript-ESLint core configurations
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
                                        

  // Custom configuration for project files
  {
    files: ["frontend/v2/src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: [path.resolve(__dirname, "frontend/v2/tsconfig.app.json")],
        tsconfigRootDir: path.resolve(__dirname, "frontend/v2"), 
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "react": pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^(?!React$)(_.*|_)',
          args: 'after-used',
          argsIgnorePattern: '^(?!React$)(_.*|_)',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off', 
      '@typescript-eslint/no-non-null-assertion': 'warn', 
      
      'react/prop-types': 'off', 
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // '@unused-imports/no-unused-imports': 'error',
      // '@unused-imports/no-unused-vars': [
      //   'warn',
      //   { vars: 'all', varsIgnorePattern: '^_COPY_', args: 'after-used', argsIgnorePattern: '^_COPY_' },
      // ],
      "//unused-imports/no-unused-imports": "error",
      "//unused-imports/no-unused-vars": [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
    },
    settings: { 
      react: {
        version: "detect",
      },
    },
  }
);
