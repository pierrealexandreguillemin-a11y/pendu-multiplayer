/**
 * Shared CSV parser for data/words.csv
 * Used by generate-word-frequencies.ts and generate-word-classifications.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CsvWordEntry {
  word: string;
  category: string;
}

/**
 * Parse data/words.csv with validation.
 * Exits process on malformed data, unknown categories, or duplicates.
 */
export function parseWordsCsv(
  projectRoot: string,
  validCategories?: readonly string[]
): CsvWordEntry[] {
  const csvPath = path.join(projectRoot, 'data/words.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n').slice(1); // skip header

  const entries: CsvWordEntry[] = [];
  const seenWords = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) {
      console.error(`Malformed line in words.csv: ${line}`);
      process.exit(1);
    }
    const word = line.slice(0, commaIdx).trim();
    const category = line.slice(commaIdx + 1).trim();

    if (validCategories && !validCategories.includes(category)) {
      console.error(`Unknown category "${category}" for word "${word}"`);
      process.exit(1);
    }

    const key = word.toUpperCase();
    if (seenWords.has(key)) {
      console.error(`Duplicate word: "${word}"`);
      process.exit(1);
    }
    seenWords.add(key);
    entries.push({ word, category });
  }

  return entries;
}
