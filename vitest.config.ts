import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**', 'src/hooks/**', 'src/stores/**'],
      exclude: ['node_modules', '__tests__', 'e2e'],
      thresholds: {
        // ISO/IEC 29119 - Progressive coverage targets
        // Current baseline - increase as tests are added
        statements: 25,
        branches: 25,
        functions: 25,
        lines: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
