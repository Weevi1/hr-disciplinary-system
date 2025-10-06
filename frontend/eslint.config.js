import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'build', 'coverage', '**/*.cjs'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,

      // React rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Console rules - PRODUCTION SECURITY
      'no-console': ['error', {
        allow: [] // No console.* allowed in production code
      }],
    },
  },
  {
    // Allow console in test files and scripts
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx', 'scripts/**/*', 'e2e/**/*', 'tests/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
];
