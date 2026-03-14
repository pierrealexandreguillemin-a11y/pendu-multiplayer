/**
 * Check Word Classifications Freshness
 *
 * Verifies that src/lib/word-classifications.ts is up-to-date.
 * Exits with code 1 if stale.
 *
 * Usage: npx tsx scripts/check-word-classifications.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const PROJECT_ROOT = path.resolve(__dirname, '..');

function computeSourceHash(): string {
  const files = [
    'src/lib/words.ts',
    'src/lib/letter-frequencies.ts',
    'src/lib/bigram-frequencies.ts',
    'src/lib/word-frequencies.ts',
  ];
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Source file not found: ${file}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    hash.update(content);
  }
  return hash.digest('hex').slice(0, 16);
}

function getStoredHash(): string | null {
  const classificationsPath = path.join(PROJECT_ROOT, 'src/lib/word-classifications.ts');
  if (!fs.existsSync(classificationsPath)) return null;
  const content = fs.readFileSync(classificationsPath, 'utf-8');
  const match = content.match(/SOURCE_HASH = '([a-f0-9]+)'/);
  return match?.[1] ?? null;
}

const currentHash = computeSourceHash();
const storedHash = getStoredHash();

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
