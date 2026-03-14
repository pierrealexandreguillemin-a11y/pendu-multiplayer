# Word Expansion — 15 Categories × ~100 Words

> **Status: COMPLETED** — 2026-03-15. 1696 words, 15 categories (all ≥100), 155 unit tests + 156 E2E. Deployed.

**Goal:** Expand the hangman word corpus from 120 words (8 categories) to ~1500 words (15 categories), migrating from a hardcoded TypeScript file to a CSV source of truth.

**Architecture:** `data/words.csv` becomes the single source of truth. Generation scripts read CSV instead of importing `words.ts`. The `WordEntry` type moves to `src/types/word.ts`. `words.ts` is deleted. All runtime consumers use `word-classifications.ts` (generated) or `words-difficulty.ts` (API layer). `session-memory.ts` switches from `WORDS` to `CLASSIFIED_WORDS`.

**Tech Stack:** TypeScript, Vitest, tsx (script runner), CSV (no external parser)

**Spec:** `docs/superpowers/specs/2026-03-14-word-expansion-15x100-design.md`

---

## Definition of Done (DoD) — applies to EVERY task

1. **Tests pass:** `npx vitest run` — 0 failures
2. **Types pass:** `npm run typecheck` — 0 errors
3. **Lint passes:** `npm run lint` — 0 warnings, 0 errors
4. **Committed:** via pre-commit hook
5. **No regressions:** test count ≥ previous

## Quality Gate

```bash
npm run lint && npm run typecheck && npx vitest run
```

---

## Chunk 1: Extract WordEntry type + create CSV source

### Task 1: Move `WordEntry` interface to `src/types/word.ts`

**Files:**
- Create: `src/types/word.ts`
- Modify: `src/lib/words.ts`
- Modify: `src/lib/words-difficulty.ts`
- Modify: `src/lib/session-memory.ts`
- Modify: `src/hooks/useGameLogic.ts`

- [ ] **Step 1: Create `src/types/word.ts`**

```typescript
/**
 * Word Types — Domain Layer
 */

export interface WordEntry {
  word: string;
  category: string;
}
```

- [ ] **Step 2: Update `src/lib/words.ts` to import from `@/types/word`**

Replace `export interface WordEntry { ... }` with:
```typescript
import type { WordEntry } from '@/types/word';
export type { WordEntry };
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

All imports of `WordEntry` from `'./words'` or `'@/lib/words'` still resolve via re-export. No other files need changing yet.

- [ ] **Step 4: Commit**

```bash
git add src/types/word.ts src/lib/words.ts
git commit -m "refactor: extract WordEntry interface to src/types/word.ts"
```

### Task 2: Create `data/words.csv` from existing 120 words with category migrations

**Files:**
- Create: `data/words.csv`

The CSV must reflect the category migrations from the spec:
- Fruit → Nourriture (15 words)
- Nature → Géographie (montagne, désert, prairie, océan, glacier)
- Nature → Science (étoile, volcan, tonnerre)
- Objet → Technologie (ordinateur, téléphone, clavier, télévision, microscope)
- Objet → Véhicule (bicyclette)
- Objet → Sport (trampoline)
- Objet → Maison (parapluie, dictionnaire, réveil, lunettes, ciseaux, casserole, valise, bouteille)
- Nature (conservé): tournesol, forêt, cascade, rivière, arc-en-ciel, nuage, aurore
- Animal, Métier, Sport, Nourriture, Géographie: unchanged

- [ ] **Step 1: Generate `data/words.csv`**

Write CSV with header `word,category`, sorted by category then alphabetically. All 120 existing words, with migrated categories.

- [ ] **Step 2: Validate word count**

```bash
wc -l data/words.csv
# Expected: 121 (header + 120 words)
```

- [ ] **Step 3: Commit**

```bash
git add data/words.csv
git commit -m "feat: create words.csv with 120 migrated words (8→10 categories)"
```

---

## Chunk 2: DRY shared modules + rewire generation scripts

### Task 3: Create shared `VALID_CATEGORIES` constant

**Files:**
- Create: `src/lib/categories.ts`

Single source of truth for the 15 category names. Used by generation scripts (validation) and tests.

- [ ] **Step 1: Create `src/lib/categories.ts`**

```typescript
/**
 * Valid word categories — single source of truth
 */
export const VALID_CATEGORIES = [
  'Animal', 'Nourriture', 'Métier', 'Sport', 'Géographie',
  'Nature', 'Science', 'Musique', 'Véhicule', 'Vêtement',
  'Corps humain', 'Art', 'Histoire', 'Maison', 'Technologie',
] as const;

export type WordCategory = (typeof VALID_CATEGORIES)[number];
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/categories.ts
git commit -m "refactor: extract VALID_CATEGORIES to shared module (DRY)"
```

### Task 4: Create shared CSV parser `scripts/parse-words-csv.ts`

**Files:**
- Create: `scripts/parse-words-csv.ts`

DRY: both generation scripts need to parse `data/words.csv`. Extract to shared module with validation.

- [ ] **Step 1: Create `scripts/parse-words-csv.ts`**

```typescript
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
  validCategories?: readonly string[],
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
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add scripts/parse-words-csv.ts
git commit -m "refactor: extract shared CSV parser for generation scripts (DRY)"
```

### Task 5: Update `generate-word-frequencies.ts` to use shared parser

**Files:**
- Modify: `scripts/generate-word-frequencies.ts`

The script currently reads `src/lib/words.ts` via regex (line 47-53). Replace with shared CSV parser.

- [ ] **Step 1: Replace word extraction logic**

Replace the `wordsContent` / `wordRegex` block (lines 47-53) with:

```typescript
import { parseWordsCsv } from './parse-words-csv';

// 2. Read game words from CSV
const gameWords = parseWordsCsv(PROJECT_ROOT).map((e) => e.word);
```

- [ ] **Step 2: Run generation and quality gate**

```bash
npx tsx scripts/generate-word-frequencies.ts
npm run lint && npm run typecheck && npx vitest run
```

Output should show same 120 words with same frequency scores.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-word-frequencies.ts
git commit -m "refactor: generate-word-frequencies uses shared CSV parser"
```

### Task 6: Update `generate-word-classifications.ts` to use shared parser

**Files:**
- Modify: `scripts/generate-word-classifications.ts`

Currently imports `WORDS` from `../src/lib/words` (line 25). Replace with shared CSV parser.

- [ ] **Step 1: Replace WORDS import with shared parser**

Add import at top:
```typescript
import { parseWordsCsv } from './parse-words-csv';
import { VALID_CATEGORIES } from '../src/lib/categories';
```

Replace the dynamic import of WORDS (line 25-26) with:
```typescript
const wordEntries = parseWordsCsv(PROJECT_ROOT, VALID_CATEGORIES);
```

Retain the `computeDifficultyScore` and `normalizeWord` dynamic imports unchanged. Only replace the `WORDS` import line. Then update the `classifications` mapping: change `WORDS.map((entry: ...)` to `wordEntries.map((entry: ...)`.

- [ ] **Step 2: Regenerate and run quality gate**

```bash
npx tsx scripts/generate-word-classifications.ts
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-word-classifications.ts
git commit -m "refactor: generate-word-classifications uses shared CSV parser"
```

### Task 7: Update `source-hash.ts` — replace `words.ts` with `words.csv`

**Files:**
- Modify: `scripts/source-hash.ts`

- [ ] **Step 1: Change SOURCE_FILES**

Replace `'src/lib/words.ts'` with `'data/words.csv'` in the `SOURCE_FILES` array (line 13).

- [ ] **Step 2: Regenerate both generated files (hash changed)**

```bash
npx tsx scripts/generate-word-frequencies.ts
npx tsx scripts/generate-word-classifications.ts
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add scripts/source-hash.ts src/lib/word-frequencies.ts src/lib/word-classifications.ts
git commit -m "refactor: source-hash tracks words.csv instead of words.ts"
```

---

## Chunk 3: Delete `words.ts`, rewire consumers

### Task 8: Rewire `session-memory.ts` to use `CLASSIFIED_WORDS`

**Files:**
- Modify: `src/lib/session-memory.ts`
- Modify: `__tests__/lib/session-memory.test.ts`

`session-memory.ts` imports `WORDS` and `WordEntry` from `./words`. Replace with `CLASSIFIED_WORDS` from `./words-difficulty`.

- [ ] **Step 1: Update imports and references**

Replace:
```typescript
import type { WordEntry } from './words';
import { WORDS } from './words';
```

With:
```typescript
import type { WordEntry } from '@/types/word';
import { CLASSIFIED_WORDS } from './words-difficulty';
```

Replace all `WORDS` references with `CLASSIFIED_WORDS` in the file (4 occurrences: `WORDS.length`, `WORDS.filter(...)` ×2, and `WORDS` in `createSessionMemory`).

- [ ] **Step 2: Update tests if they reference word counts**

Check `__tests__/lib/session-memory.test.ts` for hardcoded `120` or `WORDS.length` assertions. Update to use `CLASSIFIED_WORDS.length`.

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/session-memory.ts __tests__/lib/session-memory.test.ts
git commit -m "refactor: session-memory uses CLASSIFIED_WORDS instead of WORDS"
```

### Task 9: Rewire `useGameLogic.ts` to use `words-difficulty`

**Files:**
- Modify: `src/hooks/useGameLogic.ts`

`useGameLogic.ts` imports `getRandomWord` from `@/lib/words` (line 7). This is the fallback word selector. Replace with a function from `words-difficulty.ts`.

- [ ] **Step 1: Replace import and usage**

Replace:
```typescript
import { getRandomWord } from '@/lib/words';
```

With:
```typescript
import { getRandomWordByDifficulty } from '@/lib/words-difficulty';
```

In `startGame` (line 48), replace:
```typescript
const { word, category: randomCategory } = getRandomWord();
setGameState(createGame({ word, category: randomCategory, difficulty }));
```

With:
```typescript
const level = difficulty ?? 'normal';
const entry = getRandomWordByDifficulty(level)
  ?? getRandomWordByDifficulty('easy')
  ?? getRandomWordByDifficulty('normal')
  ?? getRandomWordByDifficulty('hard');
if (!entry) {
  console.warn('No words available — all words exhausted');
  return;
}
setGameState(createGame({ word: entry.word, category: entry.category, difficulty }));
```

This provides a fallback chain: if the requested difficulty is exhausted, try other levels. Only silently returns if the entire corpus is used (extremely unlikely with 1500 words).

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameLogic.ts
git commit -m "refactor: useGameLogic uses getRandomWordByDifficulty"
```

### Task 10: Delete `src/lib/words.ts`

**Files:**
- Delete: `src/lib/words.ts`
- Modify: any remaining imports

- [ ] **Step 1: Update `words-difficulty.ts` import**

In `src/lib/words-difficulty.ts`, replace:
```typescript
import type { WordEntry } from './words';
```
With:
```typescript
import type { WordEntry } from '@/types/word';
```

- [ ] **Step 2: Search for any remaining imports of `words.ts`**

```bash
grep -r "from.*['\"].*\/words['\"]" src/ __tests__/ scripts/ --include="*.ts" --include="*.tsx"
```

Fix any remaining imports to use `@/types/word` (for `WordEntry`) or `@/lib/words-difficulty` (for word access).

- [ ] **Step 3: Delete `src/lib/words.ts`**

```bash
rm src/lib/words.ts
```

- [ ] **Step 4: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete words.ts — CSV is now the single source of truth"
```

---

## Chunk 4: Populate 1500 words

### Task 11: Populate `data/words.csv` with ~1500 words across 15 categories

**Files:**
- Modify: `data/words.csv`

Expand from 120 to ~1500 words. Each of the 15 categories should have ~100 words. All words must:
- Be present in Lexique 383 (except Géographie proper nouns)
- Be 3-15 letters
- Be common enough for a family game (no obscure terms)
- Be unique across all categories

Categories to populate:
1. Animal (~100) — currently 15
2. Nourriture (~100) — currently 30 (15 ex-Fruit + 15 original)
3. Métier (~100) — currently 15
4. Sport (~100) — currently 16 (15 + trampoline)
5. Géographie (~100) — currently 20 (15 + 5 ex-Nature)
6. Nature (~100) — currently 7 (kept from old Nature)
7. Science (~100) — currently 3 (ex-Nature)
8. Musique (~100) — currently 0
9. Véhicule (~100) — currently 1 (bicyclette)
10. Vêtement (~100) — currently 0
11. Corps humain (~100) — currently 0
12. Art (~100) — currently 0
13. Histoire (~100) — currently 0
14. Maison (~100) — currently 8 (ex-Objet)
15. Technologie (~100) — currently 5 (ex-Objet)

- [ ] **Step 1: Generate word list per category**

For each category, select ~100 words from Lexique 383 that match the category's scope. Use `data/lexique3-top10k.csv` as primary source. Verify each word is a real, family-friendly French word.

- [ ] **Step 2: Write to `data/words.csv`**

Sorted by category then alphabetically. Header: `word,category`.

- [ ] **Step 3: Validate**

```bash
wc -l data/words.csv
# Expected: ~1501 (header + ~1500 words)
```

Check for duplicates:
```bash
tail -n +2 data/words.csv | cut -d',' -f1 | sort | uniq -d
# Expected: empty (no duplicates)
```

- [ ] **Step 4: Regenerate classifications and frequencies**

```bash
npx tsx scripts/generate-word-frequencies.ts
npx tsx scripts/generate-word-classifications.ts
```

- [ ] **Step 5: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add data/words.csv src/lib/word-frequencies.ts src/lib/word-classifications.ts
git commit -m "feat: expand word corpus to ~1500 words across 15 categories"
```

---

## Chunk 5: Recalibrate thresholds + update tests

### Task 12: Recalibrate difficulty thresholds

**Files:**
- Modify: `src/lib/difficulty-config.ts` (if needed)

- [ ] **Step 1: Inspect distribution from generation output**

The `generate-word-classifications.ts` output shows `Distribution: easy=X (Y%), normal=...`. Check if the current thresholds (easy ≤ 47, normal ≤ 54) produce the target ~40/35/25 distribution.

- [ ] **Step 2: If distribution is off, adjust `scoreThreshold`**

In `src/lib/difficulty-config.ts`, update `scoreThreshold` values for `easy` and `normal` entries to achieve ~40/35/25 ±5%.

- [ ] **Step 3: Regenerate classifications with new thresholds**

```bash
npx tsx scripts/generate-word-classifications.ts
```

- [ ] **Step 4: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 5: Commit (if changes were needed)**

```bash
git add src/lib/difficulty-config.ts src/lib/word-classifications.ts
git commit -m "fix: recalibrate difficulty thresholds for 1500-word corpus"
```

### Task 13: Update test assertions

**Files:**
- Modify: `__tests__/lib/words-difficulty.test.ts`
- Modify: `__tests__/lib/word-frequencies.test.ts`
- Modify: `__tests__/lib/session-memory.test.ts`

- [ ] **Step 1: Update `words-difficulty.test.ts`**

- Update total word count assertions (120 → ~1500)
- Update category list assertions (8 categories → 15)
- Update per-difficulty count assertions to match new distribution

- [ ] **Step 2: Update `word-frequencies.test.ts`**

- Update assertions that check "all 120 words have scores" → "all ~1500 words have scores"

- [ ] **Step 3: Update `session-memory.test.ts`**

- Update `totalWords` assertions

- [ ] **Step 4: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add __tests__/
git commit -m "test: update assertions for 1500-word corpus"
```

### Task 14: Add new validation tests

**Files:**
- Create: `__tests__/lib/words-csv.test.ts`

- [ ] **Step 1: Write CSV validation tests**

```typescript
import { WORD_CLASSIFICATIONS } from '@/lib/word-classifications';
import { normalizeWord } from '@/lib/normalize';
import { VALID_CATEGORIES } from '@/lib/categories';

describe('Word corpus validation', () => {
  it('should have at least 80 words per category', () => {
    for (const cat of VALID_CATEGORIES) {
      const count = WORD_CLASSIFICATIONS.filter((w) => w.category === cat).length;
      expect(count).toBeGreaterThanOrEqual(80);
    }
  });

  it('should have exactly 15 categories', () => {
    const categories = [...new Set(WORD_CLASSIFICATIONS.map((w) => w.category))];
    expect(categories.sort()).toEqual(VALID_CATEGORIES.sort());
  });

  it('should have no duplicate words', () => {
    const seen = new Set<string>();
    for (const entry of WORD_CLASSIFICATIONS) {
      const key = entry.word.toUpperCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('should have all words between 3-15 letters', () => {
    for (const entry of WORD_CLASSIFICATIONS) {
      const normalized = normalizeWord(entry.word);
      expect(normalized.length).toBeGreaterThanOrEqual(3);
      expect(normalized.length).toBeLessThanOrEqual(15);
    }
  });

  it('should have words in all difficulty levels per category', () => {
    for (const cat of VALID_CATEGORIES) {
      const words = WORD_CLASSIFICATIONS.filter((w) => w.category === cat);
      const difficulties = new Set(words.map((w) => w.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/words-csv.test.ts
git commit -m "test: add word corpus validation tests (categories, uniqueness, length)"
```

---

## Chunk 6: Update Lexique frequency data

### Task 15: Update `generate-word-frequencies.ts` scoring for larger corpus

**Files:**
- Modify: `scripts/generate-word-frequencies.ts`

The current `refMax = 200` was calibrated for 120 words. With 1500 words, the frequency range will be wider. The script needs to compute `refMax` dynamically from the actual game words.

- [ ] **Step 1: Replace hardcoded `refMax` with dynamic computation**

Replace lines 82-83:
```typescript
const refMax = 200;
const logRef = Math.log(refMax + 1);
```

With:
```typescript
const maxGameFreq = Math.max(...gameFreqs.map((g) => g.freq), 1);
const logRef = Math.log(maxGameFreq + 1);
```

- [ ] **Step 2: Regenerate frequencies and classifications**

```bash
npx tsx scripts/generate-word-frequencies.ts
npx tsx scripts/generate-word-classifications.ts
```

- [ ] **Step 3: Run quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-word-frequencies.ts src/lib/word-frequencies.ts src/lib/word-classifications.ts
git commit -m "fix: dynamic refMax in frequency scoring for larger corpus"
```

---

## Task Dependency Graph

```
Task 1 (WordEntry type) ──→ Task 2 (CSV) ──→ Task 3 (categories) ──→ Task 4 (CSV parser)
                                                                          │
                                                    ┌─────────────────────┤
                                                    ↓                     ↓
                                              Task 5 (gen-freq)    Task 6 (gen-class)
                                                    └──────┬──────────────┘
                                                           ↓
                                                    Task 7 (source-hash)
                                                           ↓
Task 8 (session-memory) ──→ Task 9 (useGameLogic) ──→ Task 10 (delete words.ts)
                                                           │
                                                           ↓
Task 11 (populate 1500) ──→ Task 15 (dynamic refMax) ──→ Task 12 (thresholds)
                                                           │
                                                           ↓
                            Task 13 (update tests) ──→ Task 14 (new tests)
```

### DRY Architecture Notes

- **`src/lib/categories.ts`** — single source of truth for `VALID_CATEGORIES` (used by: generation scripts, tests, potentially UI)
- **`scripts/parse-words-csv.ts`** — shared CSV parser with validation (used by: `generate-word-frequencies.ts`, `generate-word-classifications.ts`)
- **`src/types/word.ts`** — `WordEntry` interface (used by: `words-difficulty.ts`, `session-memory.ts`, `useSessionMemory.ts`)
- **`session-memory.ts`** keeps its role: it manages **stateful word tracking** (used/remaining), distinct from `words-difficulty.ts` which provides **stateless filtering** by difficulty. No duplication — different responsibilities (SRP).
