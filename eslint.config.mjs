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
  // All thresholds enforced as errors — zero tolerance
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/word-classifications.ts', 'src/lib/word-frequencies.ts'],
    rules: {
      complexity: ['error', { max: 15 }],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', { max: 4 }],
      'max-params': ['error', { max: 4 }],
    },
  },
  // Stricter rules for new code (lib layer — no legacy UI)
  {
    files: ['src/lib/**/*.ts'],
    ignores: ['src/lib/word-classifications.ts', 'src/lib/word-frequencies.ts'],
    rules: {
      complexity: ['error', { max: 10 }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 55, skipBlankLines: true, skipComments: true }],
    },
  },
]);

export default eslintConfig;
