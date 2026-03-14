import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Test outputs
    'coverage/**',
    'playwright-report/**',
  ]),
  // Code quality: complexity, SRP, maintainability
  // Thresholds set to current baseline — tighten progressively
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/word-classifications.ts'],
    rules: {
      // Complexity — max cyclomatic complexity per function
      complexity: ['warn', { max: 15 }],
      // SRP proxy — max lines per file
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      // Readability — max lines per function
      'max-lines-per-function': [
        'warn',
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      // Nesting depth — prevents deeply nested logic
      'max-depth': ['error', { max: 4 }],
      // Max params — too many params = poor API design
      'max-params': ['error', { max: 4 }],
    },
  },
  // Stricter rules for new code (lib layer — no legacy UI)
  {
    files: ['src/lib/**/*.ts'],
    ignores: ['src/lib/word-classifications.ts'],
    rules: {
      complexity: ['error', { max: 10 }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 55, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]);

export default eslintConfig;
