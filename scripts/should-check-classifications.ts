/**
 * Check if staged files include any classification source file.
 *
 * Used by pre-commit hook to avoid duplicating the SOURCE_FILES list.
 * Exit 0 = yes, check needed. Exit 1 = no, skip check.
 *
 * Usage: npx tsx scripts/should-check-classifications.ts
 */

import { execSync } from 'node:child_process';
import { SOURCE_FILES } from './source-hash';

const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
const stagedFiles = staged.split('\n').map((f) => f.trim());
const needsCheck = SOURCE_FILES.some((src) => stagedFiles.includes(src));

process.exit(needsCheck ? 0 : 1);
