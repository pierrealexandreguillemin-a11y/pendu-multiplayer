/**
 * Check Word Classifications Freshness
 *
 * Verifies that src/lib/word-classifications.ts is up-to-date.
 * Exits with code 1 if stale.
 *
 * Usage: npx tsx scripts/check-word-classifications.ts
 */

import * as path from 'node:path';
import { computeSourceHash, getStoredHash } from './source-hash';

const PROJECT_ROOT = path.resolve(__dirname, '..');

const currentHash = computeSourceHash(PROJECT_ROOT);
const storedHash = getStoredHash(PROJECT_ROOT);

if (!storedHash) {
  console.error('word-classifications.ts not found. Run: npm run generate:classifications');
  process.exit(1);
}

if (currentHash !== storedHash) {
  console.error('Source data changed. Run: npm run generate:classifications');
  console.error(`  Current hash: ${currentHash}`);
  console.error(`  Stored hash:  ${storedHash}`);
  process.exit(1);
}

console.log('Word classifications are up-to-date.');
