// @ts-check

import globals from "globals";
import tseslint from "typescript-eslint"; // Main typescript-eslint object
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
// import pluginJsxA11y from "eslint-plugin-jsx-a11y"; // jsx-a11y might need specific flat config setup
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    // Global ignores
    ignores: ["node_modules/", "dist/", "build/", "*.config.js", "*.config.ts", "frontend/v2/.eslintrc.cjs"],
  },
  {
    // Configurations for JS, JSX, TS, TSX files
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser, 
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.app.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021, // Using a slightly more modern ES version
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react": pluginReact,
      "react-hooks": pluginReactHooks,
      // "jsx-a11y": pluginJsxA11y, // Add later if needed and flat config compatible
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      // Turn off base and typescript-eslint unused vars rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Configure unused-imports plugin rules
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // Other rules we had
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off', 
      '@typescript-eslint/no-non-null-assertion': 'warn', 

      // React specific rules
      'react/prop-types': 'off', 
      'react/react-in-jsx-scope': 'off', 

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Consider adding recommended rule sets later, e.g.:
      // ...tseslint.configs.recommended.rules, 
      // ...pluginReact.configs.recommended.rules, 
    },
    settings: { 
      react: {
        version: "detect",
      },
    },
  }
  // You might need to spread recommended configs if using them, e.g.:
  // ...tseslint.configs.recommended,
  // {
  //   // Overrides for recommended configs if necessary
  // }
);
