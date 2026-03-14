/**
 * Shared source hash computation for word classification freshness checks.
 *
 * Single source of truth for which files affect the generated classifications.
 * Used by both generate-word-classifications.ts and check-word-classifications.ts.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/** Files that affect the generated word-classifications.ts */
const SOURCE_FILES = [
  'src/lib/words.ts',
  'src/lib/letter-frequencies.ts',
  'src/lib/bigram-frequencies.ts',
  'src/lib/word-frequencies.ts',
  'src/lib/difficulty-config.ts',
] as const;

/**
 * Compute SHA-256 hash (first 16 hex chars) of all source files.
 * Exits with code 1 if any source file is missing.
 */
export function computeSourceHash(projectRoot: string): string {
  const hash = crypto.createHash('sha256');
  for (const file of SOURCE_FILES) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Source file not found: ${file}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    hash.update(content);
  }
  return hash.digest('hex').slice(0, 16);
}

/**
 * Extract the stored SOURCE_HASH from word-classifications.ts.
 * Returns null if the file doesn't exist or the hash can't be found.
 */
export function getStoredHash(projectRoot: string): string | null {
  const classificationsPath = path.join(projectRoot, 'src/lib/word-classifications.ts');
  if (!fs.existsSync(classificationsPath)) return null;
  const content = fs.readFileSync(classificationsPath, 'utf-8');
  const match = content.match(/SOURCE_HASH = '([a-f0-9]+)'/);
  return match?.[1] ?? null;
}
