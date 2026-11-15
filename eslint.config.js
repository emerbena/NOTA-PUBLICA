import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      '.artifacts/**',
      'test-results/**',
      'playwright-report/**',
      '.next/**',
      '.local-db/**',
      '.local-media/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['*.js', '*.mjs', 'api/**/*.js', 'lib/**/*.js', 'scripts/**/*.mjs', 'test/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  { files: ['dist/**/*.js', 'test/e2e/**/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['dist/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['node:*', '**/lib/**', '@neondatabase/serverless'] },
      ],
    },
  },
  { rules: { 'no-empty': ['error', { allowEmptyCatch: true }] } },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.ts', '**/*.tsx'] })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
    },
  },
];
