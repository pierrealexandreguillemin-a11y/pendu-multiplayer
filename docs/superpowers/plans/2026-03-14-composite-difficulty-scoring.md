# Composite Difficulty Scoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace length-only word difficulty classification with a 6-criteria composite scoring system (letter rarity, unique letters, word frequency, vowel ratio, length, bigram patterns).

**Architecture:** Static data tables (letter frequencies, bigram frequencies) + generation script that pre-computes composite scores for all words → generated `word-classifications.ts` consumed at runtime with zero computation. Pre-commit hook validates freshness.

**Tech Stack:** TypeScript, Vitest, tsx (script runner, devDependency), Husky (pre-commit hooks)

**Prerequisites:** Node.js >= 24.0.0, tsx >= 4.7 (for `import.meta.dirname` support and tsconfig paths resolution)

**Spec:** `docs/superpowers/specs/2026-03-14-composite-difficulty-scoring-design.md`

---

## Chunk 1: Foundation — Types, Static Data Tables, and Score Algorithm

### Task 0: Install tsx as devDependency

- [ ] **Step 1: Install tsx**

Run: `npm install -D tsx`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tsx as devDependency for script execution"
```

---

### Task 1: Update DifficultyConfig type — replace wordLengthRange with scoreThresholds

**Important:** This task updates types, config, words-difficulty.ts (to remove `wordLengthRange` usage), AND all related tests in a single commit to keep the test suite green throughout. The pre-commit hook runs `npm run test:run`, so tests must pass at every commit.

**Files:**
- Modify: `src/types/difficulty.ts:17-38`
- Modify: `src/lib/difficulty-config.ts:14-60`
- Modify: `src/lib/words-difficulty.ts:40-54` (remove `wordLengthRange` usage in `classifyWord`)
- Modify: `__tests__/lib/difficulty-config.test.ts:42-51, 79`
- Modify: `__tests__/lib/words-difficulty.test.ts:18-45` (update `classifyWord` tests)

- [ ] **Step 1: Update all source files simultaneously**

Update `src/types/difficulty.ts` — replace `wordLengthRange` with `scoreThresholds`, add `DifficultyScoreBreakdown` type.

Update `src/lib/difficulty-config.ts` — replace `wordLengthRange` values with `scoreThresholds` values, update descriptions.

Update `src/lib/words-difficulty.ts` — change `classifyWord()` to use `scoreThresholds` instead of `wordLengthRange` (temporary — will be replaced in Task 8, but must compile now):

```typescript
// Temporary classifyWord using length-based thresholds mapped to scoreThresholds
// This will be replaced in Task 8 with generated classifications
export function classifyWord(word: string): DifficultyLevel {
  const length = countLetters(word);
  // Temporary mapping: use length as a proxy score (will be replaced)
  if (length <= 6) return 'easy';
  if (length <= 8) return 'normal';
  return 'hard';
}
```

- [ ] **Step 2: Update all test files simultaneously**

In `__tests__/lib/difficulty-config.test.ts`, replace the `wordLengthRange` test (lines 42-51) with:

```typescript
it('should have valid scoreThresholds for each level', () => {
  const levels: DifficultyLevel[] = ['easy', 'normal', 'hard'];

  for (const level of levels) {
    const config = DIFFICULTY_CONFIGS[level];
    expect(config.scoreThresholds).toBeDefined();
    expect(typeof config.scoreThresholds).toBe('number');
    expect(config.scoreThresholds).toBeGreaterThan(0);
    expect(config.scoreThresholds).toBeLessThanOrEqual(100);
  }
});

it('should have increasing scoreThresholds as difficulty increases', () => {
  expect(DIFFICULTY_CONFIGS.easy.scoreThresholds).toBeLessThan(
    DIFFICULTY_CONFIGS.normal.scoreThresholds
  );
  expect(DIFFICULTY_CONFIGS.normal.scoreThresholds).toBeLessThan(
    DIFFICULTY_CONFIGS.hard.scoreThresholds
  );
});
```

Also update line 79 — replace `wordLengthRange` with `scoreThresholds`:

```typescript
expect(config).toHaveProperty('scoreThresholds');
```

- [ ] **Step 3: Update the type definition**

In `src/types/difficulty.ts`, replace lines 27-28:

```typescript
// OLD:
/** Word length range [min, max] */
wordLengthRange: readonly [min: number, max: number];

// NEW:
/** Score threshold — words with score ≤ this value belong to this level */
scoreThresholds: number;
```

Add new type after `DifficultySelection` (after line 49):

```typescript
/**
 * Breakdown of difficulty score by criterion
 */
export interface DifficultyScoreBreakdown {
  /** Letter rarity score (0-1) */
  letterRarity: number;
  /** Unique letter ratio (0-1) */
  uniqueLetters: number;
  /** Word frequency score (0-1) */
  wordFrequency: number;
  /** Consonant ratio (0-1) */
  consonantRatio: number;
  /** Length score (0-1) */
  length: number;
  /** Bigram rarity score (0-1) */
  bigramRarity: number;
  /** Total composite score (0-100) */
  total: number;
  /** Classified difficulty level */
  level: DifficultyLevel;
}
```

In `src/lib/difficulty-config.ts`, replace lines 14-60:

```typescript
/**
 * Difficulty configurations
 *
 * Easy: For beginners and casual players
 * - More attempts (10 errors)
 * - Category hint visible
 * - Words with low difficulty score (0-38)
 *
 * Normal: Standard gameplay
 * - Standard attempts (7 errors)
 * - Category hint visible
 * - Words with medium difficulty score (39-64)
 *
 * Hard: For experienced players
 * - Fewer attempts (5 errors)
 * - No category hint
 * - Words with high difficulty score (65-100)
 */
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    maxErrors: 10,
    showCategory: true,
    scoreThresholds: 38,
    scoreMultiplier: 1,
    label: 'Facile',
    description: '10 essais, mots faciles, catégorie visible',
  },
  normal: {
    level: 'normal',
    maxErrors: 7,
    showCategory: true,
    scoreThresholds: 64,
    scoreMultiplier: 1.5,
    label: 'Normal',
    description: '7 essais, mots intermédiaires, catégorie visible',
  },
  hard: {
    level: 'hard',
    maxErrors: 5,
    showCategory: false,
    scoreThresholds: 100,
    scoreMultiplier: 2,
    label: 'Difficile',
    description: '5 essais, mots difficiles, catégorie cachée',
  },
} as const;
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — both `difficulty-config.test.ts` and `words-difficulty.test.ts` pass because all files were updated together.

- [ ] **Step 5: Commit**

```bash
git add src/types/difficulty.ts src/lib/difficulty-config.ts src/lib/words-difficulty.ts __tests__/lib/difficulty-config.test.ts __tests__/lib/words-difficulty.test.ts
git commit -m "refactor(difficulty): replace wordLengthRange with scoreThresholds"
```

---

### Task 2: Create letter frequency table

**Files:**
- Create: `src/lib/letter-frequencies.ts`
- Create: `__tests__/lib/letter-frequencies.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/letter-frequencies.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  LETTER_RARITY_SCORES,
  getLetterRarityScore,
} from '@/lib/letter-frequencies';

describe('letter-frequencies', () => {
  describe('LETTER_RARITY_SCORES', () => {
    it('should have scores for all 26 letters', () => {
      expect(Object.keys(LETTER_RARITY_SCORES)).toHaveLength(26);
    });

    it('should have all scores between 0 and 1', () => {
      for (const [, score] of Object.entries(LETTER_RARITY_SCORES)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    it('should have E as most common (lowest rarity)', () => {
      expect(LETTER_RARITY_SCORES.E).toBeLessThan(0.1);
    });

    it('should have rare letters with high scores', () => {
      expect(LETTER_RARITY_SCORES.W).toBeGreaterThan(0.9);
      expect(LETTER_RARITY_SCORES.K).toBeGreaterThan(0.9);
      expect(LETTER_RARITY_SCORES.X).toBeGreaterThan(0.8);
      expect(LETTER_RARITY_SCORES.Z).toBeGreaterThan(0.8);
    });
  });

  describe('getLetterRarityScore', () => {
    it('should return rarity for valid letters', () => {
      expect(getLetterRarityScore('E')).toBeLessThan(0.1);
      expect(getLetterRarityScore('e')).toBeLessThan(0.1);
    });

    it('should return 1 for unknown characters', () => {
      expect(getLetterRarityScore('-')).toBe(1);
      expect(getLetterRarityScore(' ')).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/letter-frequencies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create letter frequency table**

Create `src/lib/letter-frequencies.ts`:

```typescript
/**
 * French Letter Rarity Scores
 *
 * Rarity score from 0 (very common) to 1 (very rare).
 * Based on letter frequency analysis of French text corpora.
 *
 * Source: French language letter frequency data
 * (E ~17.4%, A ~8.2%, S ~8.1%, ... W ~0.04%, K ~0.05%)
 */

/** Rarity scores per letter (0 = very common, 1 = very rare) */
export const LETTER_RARITY_SCORES: Record<string, number> = {
  E: 0.00, // 17.4% — most common
  A: 0.04, // 8.2%
  S: 0.05, // 8.1%
  I: 0.08, // 7.3%
  N: 0.08, // 7.1%
  T: 0.08, // 7.0%
  R: 0.10, // 6.6%
  L: 0.25, // 5.5%
  O: 0.30, // 5.4%
  U: 0.30, // 5.2%
  D: 0.32, // 3.7%
  C: 0.33, // 3.3%
  P: 0.35, // 3.0%
  M: 0.55, // 2.6%
  V: 0.60, // 1.6%
  G: 0.62, // 1.3%
  F: 0.65, // 1.1%
  B: 0.67, // 0.9%
  H: 0.70, // 0.7%
  Q: 0.85, // 0.5%
  J: 0.88, // 0.3%
  X: 0.90, // 0.3%
  Y: 0.92, // 0.2%
  Z: 0.93, // 0.1%
  K: 0.96, // 0.05%
  W: 0.98, // 0.04%
};

/**
 * Get rarity score for a letter (case-insensitive).
 * Returns 1 (max rarity) for unknown characters.
 */
export function getLetterRarityScore(letter: string): number {
  return LETTER_RARITY_SCORES[letter.toUpperCase()] ?? 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/letter-frequencies.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/letter-frequencies.ts __tests__/lib/letter-frequencies.test.ts
git commit -m "feat(difficulty): add French letter rarity score table"
```

---

### Task 3: Create bigram frequency table

**Files:**
- Create: `src/lib/bigram-frequencies.ts`
- Create: `__tests__/lib/bigram-frequencies.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/bigram-frequencies.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  COMMON_BIGRAMS_FR,
  isBigramCommon,
} from '@/lib/bigram-frequencies';

describe('bigram-frequencies', () => {
  describe('COMMON_BIGRAMS_FR', () => {
    it('should contain at least 30 bigrams', () => {
      expect(COMMON_BIGRAMS_FR.size).toBeGreaterThanOrEqual(30);
    });

    it('should contain well-known French bigrams', () => {
      expect(COMMON_BIGRAMS_FR.has('ES')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('EN')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('OU')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('AN')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('RE')).toBe(true);
      expect(COMMON_BIGRAMS_FR.has('AI')).toBe(true);
    });

    it('should not contain rare bigrams', () => {
      expect(COMMON_BIGRAMS_FR.has('KW')).toBe(false);
      expect(COMMON_BIGRAMS_FR.has('ZX')).toBe(false);
    });
  });

  describe('isBigramCommon', () => {
    it('should be case-insensitive', () => {
      expect(isBigramCommon('es')).toBe(true);
      expect(isBigramCommon('ES')).toBe(true);
      expect(isBigramCommon('Es')).toBe(true);
    });

    it('should return false for rare bigrams', () => {
      expect(isBigramCommon('kw')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/bigram-frequencies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create bigram frequency table**

Create `src/lib/bigram-frequencies.ts`:

```typescript
/**
 * Common French Bigrams
 *
 * Top ~35 most frequent letter pairs in French text.
 * Used to evaluate how "guessable" a word is — words with
 * many common bigrams are easier because players recognize patterns.
 *
 * Source: French text corpus bigram frequency analysis
 */

/** Set of common French bigrams (uppercase) */
export const COMMON_BIGRAMS_FR: ReadonlySet<string> = new Set([
  'ES', 'EN', 'OU', 'DE', 'AN',
  'RE', 'ER', 'LE', 'ON', 'NT',
  'AI', 'TE', 'ET', 'EL', 'SE',
  'IT', 'LA', 'IS', 'AL', 'ME',
  'IN', 'NE', 'OR', 'UR', 'RA',
  'AR', 'CO', 'RI', 'IO', 'AT',
  'IE', 'IR', 'CE', 'IL', 'CH',
]);

/**
 * Check if a bigram is among the most common in French (case-insensitive).
 */
export function isBigramCommon(bigram: string): boolean {
  return COMMON_BIGRAMS_FR.has(bigram.toUpperCase());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/bigram-frequencies.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/bigram-frequencies.ts __tests__/lib/bigram-frequencies.test.ts
git commit -m "feat(difficulty): add French common bigram table"
```

---

### Task 4: Create word frequency lookup

**Files:**
- Create: `src/lib/word-frequencies.ts`
- Create: `__tests__/lib/word-frequencies.test.ts`

> Note: For the current 120 words, frequency scores are hardcoded. When scaling to 1500+ words, a `data/lexique3-top10k.csv` file and a generation step will replace this lookup. See spec for details.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/word-frequencies.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getWordFrequencyScore,
  WORD_FREQUENCY_SCORES,
} from '@/lib/word-frequencies';

describe('word-frequencies', () => {
  describe('WORD_FREQUENCY_SCORES', () => {
    it('should be a non-empty map', () => {
      expect(WORD_FREQUENCY_SCORES.size).toBeGreaterThan(0);
    });

    it('should have scores between 0 and 1', () => {
      for (const [, score] of WORD_FREQUENCY_SCORES) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getWordFrequencyScore', () => {
    it('should return low score for very common words', () => {
      // "chat" is a very common French word
      const score = getWordFrequencyScore('chat');
      expect(score).toBeLessThan(0.3);
    });

    it('should return high score for unknown words', () => {
      const score = getWordFrequencyScore('xyznotaword');
      expect(score).toBe(0.8);
    });

    it('should be case-insensitive', () => {
      const lower = getWordFrequencyScore('chat');
      const upper = getWordFrequencyScore('CHAT');
      expect(lower).toBe(upper);
    });

    it('should handle accented words', () => {
      // "éléphant" should be found (normalized)
      const score = getWordFrequencyScore('éléphant');
      expect(score).toBeLessThan(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/word-frequencies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create word frequency module**

Create `src/lib/word-frequencies.ts`:

```typescript
/**
 * Word Frequency Scores
 *
 * Maps French words to a frequency score (0 = very common, 1 = very rare).
 * Scores are derived from Lexique 3 French word frequency corpus.
 *
 * This module provides a static lookup table. For generated data,
 * see scripts/generate-word-classifications.ts.
 */

/** Maximum rank in the reference data — words beyond this are "rare" */
const MAX_RANK = 10000;

/** Default score for words not found in the frequency data */
const DEFAULT_UNKNOWN_SCORE = 0.8;

/** Word frequency scores: word (lowercase) → score (0-1) */
export const WORD_FREQUENCY_SCORES: ReadonlyMap<string, number> = new Map([
  // This will be populated by generate-word-classifications.ts
  // For now, include manual scores for current word list
  // Score = rank / MAX_RANK, clamped to [0, 1]
  ['chat', 0.03], ['chien', 0.04], ['elephant', 0.15],
  ['girafe', 0.45], ['hippopotame', 0.55], ['kangourou', 0.60],
  ['papillon', 0.20], ['crocodile', 0.35], ['dauphin', 0.30],
  ['pingouin', 0.50], ['grenouille', 0.25], ['ecureuil', 0.40],
  ['herisson', 0.45], ['tortue', 0.20], ['lapin', 0.10],
  ['pomme', 0.05], ['banane', 0.15], ['fraise', 0.20],
  ['orange', 0.08], ['cerise', 0.25], ['ananas', 0.35],
  ['pasteque', 0.45], ['mangue', 0.35], ['peche', 0.12],
  ['raisin', 0.20], ['citron', 0.18], ['poire', 0.22],
  ['abricot', 0.30], ['framboise', 0.35], ['kiwi', 0.55],
  ['medecin', 0.08], ['boulanger', 0.25], ['pompier', 0.20],
  ['professeur', 0.06], ['astronaute', 0.40], ['cuisinier', 0.25],
  ['musicien', 0.20], ['architecte', 0.22], ['photographe', 0.25],
  ['veterinaire', 0.30], ['dentiste', 0.25], ['journaliste', 0.18],
  ['avocat', 0.15], ['pilote', 0.18], ['jardinier', 0.30],
  ['ordinateur', 0.08], ['television', 0.06], ['telephone', 0.05],
  ['parapluie', 0.25], ['bicyclette', 0.30], ['trampoline', 0.50],
  ['microscope', 0.35], ['dictionnaire', 0.20], ['reveil', 0.25],
  ['lunettes', 0.18], ['ciseaux', 0.25], ['clavier', 0.22],
  ['casserole', 0.25], ['valise', 0.18], ['bouteille', 0.12],
  ['montagne', 0.10], ['cascade', 0.30], ['volcan', 0.25],
  ['arc-en-ciel', 0.30], ['tournesol', 0.40], ['foret', 0.10],
  ['riviere', 0.12], ['etoile', 0.10], ['nuage', 0.15],
  ['tonnerre', 0.25], ['glacier', 0.28], ['desert', 0.12],
  ['prairie', 0.20], ['aurore', 0.30], ['ocean', 0.12],
  ['football', 0.08], ['basketball', 0.20], ['natation', 0.25],
  ['gymnastique', 0.25], ['escalade', 0.28], ['equitation', 0.30],
  ['badminton', 0.45], ['volleyball', 0.30], ['cyclisme', 0.30],
  ['athletisme', 0.25], ['escrime', 0.40], ['aviron', 0.40],
  ['plongee', 0.25], ['patinage', 0.30], ['boxe', 0.20],
  ['croissant', 0.18], ['baguette', 0.12], ['chocolat', 0.08],
  ['spaghetti', 0.30], ['hamburger', 0.25], ['omelette', 0.22],
  ['sandwich', 0.20], ['quiche', 0.35], ['raclette', 0.35],
  ['brioche', 0.28], ['crepe', 0.20], ['gaufre', 0.35],
  ['soupe', 0.12], ['salade', 0.12], ['fromage', 0.10],
  ['france', 0.02], ['japon', 0.10], ['australie', 0.12],
  ['bresil', 0.15], ['canada', 0.10], ['egypte', 0.15],
  ['islande', 0.30], ['mexique', 0.15], ['norvege', 0.25],
  ['portugal', 0.15], ['paris', 0.02], ['londres', 0.10],
  ['tokyo', 0.15], ['marseille', 0.10], ['berlin', 0.12],
]);

/**
 * Get frequency score for a word (0 = very common, 1 = very rare).
 * Case-insensitive, accent-insensitive lookup.
 */
export function getWordFrequencyScore(word: string): number {
  const normalized = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return WORD_FREQUENCY_SCORES.get(normalized) ?? DEFAULT_UNKNOWN_SCORE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/word-frequencies.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/word-frequencies.ts __tests__/lib/word-frequencies.test.ts
git commit -m "feat(difficulty): add word frequency lookup"
```

---

## Chunk 2: Score Computation and Generation Script

### Task 5: Create the composite score computation module

**Files:**
- Create: `src/lib/difficulty-scorer.ts`
- Create: `__tests__/lib/difficulty-scorer.test.ts`

This module contains the pure scoring functions used both by the generation script and (optionally) at runtime for `getScoreBreakdown()`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/difficulty-scorer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  computeDifficultyScore,
  normalizeWord,
} from '@/lib/difficulty-scorer';

describe('difficulty-scorer', () => {
  describe('normalizeWord', () => {
    it('should remove accents', () => {
      expect(normalizeWord('éléphant')).toBe('ELEPHANT');
    });

    it('should remove hyphens and spaces', () => {
      expect(normalizeWord('arc-en-ciel')).toBe('ARCENCIEL');
    });

    it('should uppercase', () => {
      expect(normalizeWord('pomme')).toBe('POMME');
    });
  });

  describe('computeDifficultyScore', () => {
    it('should return a breakdown with all 6 criteria', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.letterRarity).toBeGreaterThanOrEqual(0);
      expect(result.letterRarity).toBeLessThanOrEqual(1);
      expect(result.uniqueLetters).toBeGreaterThanOrEqual(0);
      expect(result.uniqueLetters).toBeLessThanOrEqual(1);
      expect(result.wordFrequency).toBeGreaterThanOrEqual(0);
      expect(result.wordFrequency).toBeLessThanOrEqual(1);
      expect(result.consonantRatio).toBeGreaterThanOrEqual(0);
      expect(result.consonantRatio).toBeLessThanOrEqual(1);
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.length).toBeLessThanOrEqual(1);
      expect(result.bigramRarity).toBeGreaterThanOrEqual(0);
      expect(result.bigramRarity).toBeLessThanOrEqual(1);
    });

    it('should return total between 0 and 100', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('should assign a difficulty level', () => {
      const result = computeDifficultyScore('pomme');
      expect(['easy', 'normal', 'hard']).toContain(result.level);
    });

    it('should score words with rare letters higher', () => {
      const common = computeDifficultyScore('pomme');
      const rare = computeDifficultyScore('kiwi');
      expect(rare.letterRarity).toBeGreaterThan(common.letterRarity);
      expect(rare.total).toBeGreaterThan(common.total);
    });

    it('should handle accented words', () => {
      const result = computeDifficultyScore('éléphant');
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('should handle hyphenated words', () => {
      const result = computeDifficultyScore('arc-en-ciel');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should use Math.round for total', () => {
      const result = computeDifficultyScore('pomme');
      expect(result.total).toBe(Math.round(result.total));
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/difficulty-scorer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the scorer**

Create `src/lib/difficulty-scorer.ts`:

```typescript
/**
 * Difficulty Score Computation
 *
 * Pure functions for computing composite difficulty scores.
 * Used by the generation script and for runtime score breakdown queries.
 *
 * 6 weighted criteria (see spec for details):
 * 1. Letter rarity (30%) — rare letters in French
 * 2. Unique letters (20%) — ratio of unique letters
 * 3. Word frequency (15%) — corpus frequency
 * 4. Consonant ratio (15%) — vowel/consonant balance
 * 5. Length (10%) — word length
 * 6. Bigram rarity (10%) — uncommon letter pairs
 */

import type { DifficultyLevel, DifficultyScoreBreakdown } from '@/types/difficulty';
import { getLetterRarityScore } from './letter-frequencies';
import { isBigramCommon } from './bigram-frequencies';
import { getWordFrequencyScore } from './word-frequencies';
import { DIFFICULTY_CONFIGS } from './difficulty-config';

/** Weights for each criterion */
const WEIGHTS = {
  letterRarity: 0.30,
  uniqueLetters: 0.20,
  wordFrequency: 0.15,
  consonantRatio: 0.15,
  length: 0.10,
  bigramRarity: 0.10,
} as const;

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const MIN_LENGTH = 3;
const MAX_LENGTH = 15;

/**
 * Normalize a word: remove accents, hyphens, spaces; uppercase.
 */
export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

/**
 * Compute the composite difficulty score for a word.
 */
export function computeDifficultyScore(word: string): DifficultyScoreBreakdown {
  const normalized = normalizeWord(word);
  const letters = [...normalized];
  const wordLength = letters.length;
  const uniqueLettersSet = new Set(letters);

  // 1. Letter rarity (30%) — mean rarity of unique letters
  const raritySum = [...uniqueLettersSet].reduce(
    (sum, l) => sum + getLetterRarityScore(l),
    0
  );
  const letterRarity = uniqueLettersSet.size > 0 ? raritySum / uniqueLettersSet.size : 0;

  // 2. Unique letters ratio (20%)
  const uniqueLetters = wordLength > 0 ? uniqueLettersSet.size / wordLength : 0;

  // 3. Word frequency (15%)
  const wordFrequency = getWordFrequencyScore(word);

  // 4. Consonant ratio (15%) — 1 - vowelRatio
  const vowelCount = letters.filter((l) => VOWELS.has(l)).length;
  const consonantRatio = wordLength > 0 ? 1 - vowelCount / wordLength : 0;

  // 5. Length (10%) — normalized [MIN_LENGTH, MAX_LENGTH]
  const lengthScore = Math.min(
    1,
    Math.max(0, (wordLength - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH))
  );

  // 6. Bigram rarity (10%) — ratio of uncommon bigrams
  const bigrams: string[] = [];
  for (let i = 0; i < letters.length - 1; i++) {
    bigrams.push(letters[i]! + letters[i + 1]!);
  }
  const uncommonCount = bigrams.filter((b) => !isBigramCommon(b)).length;
  const bigramRarity = bigrams.length > 0 ? uncommonCount / bigrams.length : 0;

  // Weighted sum
  const rawScore =
    letterRarity * WEIGHTS.letterRarity +
    uniqueLetters * WEIGHTS.uniqueLetters +
    wordFrequency * WEIGHTS.wordFrequency +
    consonantRatio * WEIGHTS.consonantRatio +
    lengthScore * WEIGHTS.length +
    bigramRarity * WEIGHTS.bigramRarity;

  const total = Math.round(rawScore * 100);

  // Classify based on thresholds
  let level: DifficultyLevel = 'hard';
  if (total <= DIFFICULTY_CONFIGS.easy.scoreThresholds) {
    level = 'easy';
  } else if (total <= DIFFICULTY_CONFIGS.normal.scoreThresholds) {
    level = 'normal';
  }

  return {
    letterRarity,
    uniqueLetters,
    wordFrequency,
    consonantRatio,
    length: lengthScore,
    bigramRarity,
    total,
    level,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/difficulty-scorer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/difficulty-scorer.ts __tests__/lib/difficulty-scorer.test.ts
git commit -m "feat(difficulty): add composite difficulty score computation"
```

---

### Task 6: Create the generation script

**Files:**
- Create: `scripts/generate-word-classifications.ts`

This script reads the word list, computes scores, and generates `src/lib/word-classifications.ts`.

- [ ] **Step 1: Create the scripts directory and generation script**

Run: `mkdir -p scripts`

Create `scripts/generate-word-classifications.ts`:

```typescript
/**
 * Generate Word Classifications
 *
 * Reads words from src/lib/words.ts, computes composite difficulty
 * scores, and generates src/lib/word-classifications.ts with
 * pre-computed data for zero-cost runtime consumption.
 *
 * Usage: npx tsx scripts/generate-word-classifications.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// We need to resolve paths relative to project root
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

// Dynamic imports to use the @ alias resolution via tsx
const { WORDS } = await import('../src/lib/words');
const { computeDifficultyScore, normalizeWord } = await import(
  '../src/lib/difficulty-scorer'
);
const { LETTER_RARITY_SCORES } = await import('../src/lib/letter-frequencies');
const { COMMON_BIGRAMS_FR } = await import('../src/lib/bigram-frequencies');

// Compute hash of source files for freshness check
function computeSourceHash(): string {
  const files = [
    'src/lib/words.ts',
    'src/lib/letter-frequencies.ts',
    'src/lib/bigram-frequencies.ts',
    'src/lib/word-frequencies.ts',
  ];

  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf-8');
    hash.update(content);
  }
  return hash.digest('hex').slice(0, 16);
}

// Generate classifications
interface WordClassification {
  word: string;
  category: string;
  difficulty: string;
  letterCount: number;
  difficultyScore: number;
  breakdown: {
    letterRarity: number;
    uniqueLetters: number;
    wordFrequency: number;
    consonantRatio: number;
    length: number;
    bigramRarity: number;
  };
}

const classifications: WordClassification[] = WORDS.map(
  (entry: { word: string; category: string }) => {
    const score = computeDifficultyScore(entry.word);
    const normalized = normalizeWord(entry.word);
    return {
      word: entry.word,
      category: entry.category,
      difficulty: score.level,
      letterCount: normalized.length,
      difficultyScore: score.total,
      breakdown: {
        letterRarity: Math.round(score.letterRarity * 1000) / 1000,
        uniqueLetters: Math.round(score.uniqueLetters * 1000) / 1000,
        wordFrequency: Math.round(score.wordFrequency * 1000) / 1000,
        consonantRatio: Math.round(score.consonantRatio * 1000) / 1000,
        length: Math.round(score.length * 1000) / 1000,
        bigramRarity: Math.round(score.bigramRarity * 1000) / 1000,
      },
    };
  }
);

// Stats
const stats = { easy: 0, normal: 0, hard: 0 };
for (const c of classifications) {
  stats[c.difficulty as keyof typeof stats]++;
}

const sourceHash = computeSourceHash();
const total = classifications.length;

// Generate output
const output = `/**
 * Word Classifications — GENERATED FILE
 *
 * DO NOT EDIT MANUALLY.
 * Generated by: npx tsx scripts/generate-word-classifications.ts
 * Source hash: ${sourceHash}
 *
 * Distribution: easy=${stats.easy} (${Math.round((stats.easy / total) * 100)}%), normal=${stats.normal} (${Math.round((stats.normal / total) * 100)}%), hard=${stats.hard} (${Math.round((stats.hard / total) * 100)}%)
 * Total words: ${total}
 */

import type { DifficultyLevel, DifficultyScoreBreakdown } from '@/types/difficulty';

/** Source hash for freshness validation */
export const SOURCE_HASH = '${sourceHash}';

/** Pre-classified word entry */
export interface ClassifiedWordEntry {
  word: string;
  category: string;
  difficulty: DifficultyLevel;
  letterCount: number;
  difficultyScore: number;
  breakdown: Omit<DifficultyScoreBreakdown, 'total' | 'level'>;
}

/** Pre-computed word classifications */
export const WORD_CLASSIFICATIONS: readonly ClassifiedWordEntry[] = ${JSON.stringify(classifications, null, 2)};
`;

const outputPath = path.join(PROJECT_ROOT, 'src/lib/word-classifications.ts');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Generated ${outputPath}`);
console.log(`  Total words: ${total}`);
console.log(`  Easy: ${stats.easy} (${Math.round((stats.easy / total) * 100)}%)`);
console.log(`  Normal: ${stats.normal} (${Math.round((stats.normal / total) * 100)}%)`);
console.log(`  Hard: ${stats.hard} (${Math.round((stats.hard / total) * 100)}%)`);
console.log(`  Source hash: ${sourceHash}`);
```

- [ ] **Step 2: Add npm scripts to package.json**

Add to `"scripts"` in `package.json`:

```json
"generate:classifications": "tsx scripts/generate-word-classifications.ts",
"check:classifications": "tsx scripts/check-word-classifications.ts"
```

- [ ] **Step 3: Run the generation script**

Run: `npm run generate:classifications`
Expected: Output showing word distribution and generated file path. Verify `src/lib/word-classifications.ts` was created.

- [ ] **Step 4: Verify the generated file compiles**

Run: `npm run typecheck`
Expected: PASS — no type errors

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-word-classifications.ts src/lib/word-classifications.ts package.json
git commit -m "feat(difficulty): add word classification generation script"
```

---

### Task 7: Create the freshness check script

**Files:**
- Create: `scripts/check-word-classifications.ts`

- [ ] **Step 1: Create the check script**

Create `scripts/check-word-classifications.ts`:

```typescript
/**
 * Check Word Classifications Freshness
 *
 * Verifies that src/lib/word-classifications.ts is up-to-date
 * with the source data files. Exits with code 1 if stale.
 *
 * Usage: npx tsx scripts/check-word-classifications.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

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
  const classificationsPath = path.join(
    PROJECT_ROOT,
    'src/lib/word-classifications.ts'
  );

  if (!fs.existsSync(classificationsPath)) {
    return null;
  }

  const content = fs.readFileSync(classificationsPath, 'utf-8');
  const match = content.match(/SOURCE_HASH = '([a-f0-9]+)'/);
  return match?.[1] ?? null;
}

const currentHash = computeSourceHash();
const storedHash = getStoredHash();

if (!storedHash) {
  console.error(
    'word-classifications.ts not found. Run: npm run generate:classifications'
  );
  process.exit(1);
}

if (currentHash !== storedHash) {
  console.error('Source data changed. Run: npm run generate:classifications');
  console.error(`  Current hash: ${currentHash}`);
  console.error(`  Stored hash:  ${storedHash}`);
  process.exit(1);
}

console.log('Word classifications are up-to-date.');
```

- [ ] **Step 2: Test the check script**

Run: `npm run check:classifications`
Expected: "Word classifications are up-to-date."

- [ ] **Step 3: Commit**

```bash
git add scripts/check-word-classifications.ts
git commit -m "feat(difficulty): add classification freshness check script"
```

---

## Chunk 3: Integration — Rewire words-difficulty.ts and Update Tests

### Task 8: Rewrite words-difficulty.ts and update tests (single commit)

**Important:** Source file and tests MUST be committed together — the pre-commit hook runs all tests, so both must be updated simultaneously.

**Files:**
- Modify: `src/lib/words-difficulty.ts`
- Modify: `__tests__/lib/words-difficulty.test.ts`

- [ ] **Step 1: Rewrite words-difficulty.ts**

Replace the entire content of `src/lib/words-difficulty.ts`:

```typescript
/**
 * Word Difficulty Classification - Domain Layer
 *
 * Consumes pre-computed word classifications from the generation script.
 * Zero computation at runtime — all scoring is done at build time.
 *
 * Public API (signatures preserved for backward compatibility):
 * - CLASSIFIED_WORDS
 * - getWordsByDifficulty(difficulty)
 * - getRandomWordByDifficulty(difficulty, usedWords?)
 * - getDifficultyStats()
 * - hasWordsForDifficulty(difficulty, usedWords?)
 * - getScoreBreakdown(word) [NEW]
 */

import type { DifficultyLevel, DifficultyScoreBreakdown } from '@/types/difficulty';
import type { WordEntry } from './words';
import {
  WORD_CLASSIFICATIONS,
  type ClassifiedWordEntry,
} from './word-classifications';
import { computeDifficultyScore } from './difficulty-scorer';

/**
 * Extended word entry with difficulty classification
 */
export interface ClassifiedWord extends WordEntry {
  difficulty: DifficultyLevel;
  letterCount: number;
}

/**
 * Pre-classified word list (from generated data)
 */
export const CLASSIFIED_WORDS: ClassifiedWord[] = WORD_CLASSIFICATIONS.map(
  (entry: ClassifiedWordEntry) => ({
    word: entry.word,
    category: entry.category,
    difficulty: entry.difficulty,
    letterCount: entry.letterCount,
  })
);

/**
 * Get words filtered by difficulty
 */
export function getWordsByDifficulty(
  difficulty: DifficultyLevel
): ClassifiedWord[] {
  return CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty);
}

/**
 * Get random word for a specific difficulty level
 */
export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): WordEntry | null {
  let candidates = getWordsByDifficulty(difficulty);

  if (usedWords && usedWords.size > 0) {
    candidates = candidates.filter(
      (w) => !usedWords.has(w.word.toUpperCase())
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  const selected = candidates[index];
  return selected ? { word: selected.word, category: selected.category } : null;
}

/**
 * Get statistics about word distribution by difficulty
 */
export function getDifficultyStats(): Record<
  DifficultyLevel,
  { count: number; avgLength: number; examples: string[] }
> {
  const stats: Record<
    DifficultyLevel,
    { count: number; totalLength: number; words: string[] }
  > = {
    easy: { count: 0, totalLength: 0, words: [] },
    normal: { count: 0, totalLength: 0, words: [] },
    hard: { count: 0, totalLength: 0, words: [] },
  };

  for (const word of CLASSIFIED_WORDS) {
    const stat = stats[word.difficulty];
    stat.count++;
    stat.totalLength += word.letterCount;
    if (stat.words.length < 3) {
      stat.words.push(word.word);
    }
  }

  return {
    easy: {
      count: stats.easy.count,
      avgLength:
        stats.easy.count > 0
          ? Math.round(stats.easy.totalLength / stats.easy.count)
          : 0,
      examples: stats.easy.words,
    },
    normal: {
      count: stats.normal.count,
      avgLength:
        stats.normal.count > 0
          ? Math.round(stats.normal.totalLength / stats.normal.count)
          : 0,
      examples: stats.normal.words,
    },
    hard: {
      count: stats.hard.count,
      avgLength:
        stats.hard.count > 0
          ? Math.round(stats.hard.totalLength / stats.hard.count)
          : 0,
      examples: stats.hard.words,
    },
  };
}

/**
 * Check if words are available for a difficulty level
 */
export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>
): boolean {
  const candidates = getWordsByDifficulty(difficulty);

  if (!usedWords || usedWords.size === 0) {
    return candidates.length > 0;
  }

  return candidates.some((w) => !usedWords.has(w.word.toUpperCase()));
}

/**
 * Get detailed score breakdown for a word (for pedagogical page).
 */
export function getScoreBreakdown(word: string): DifficultyScoreBreakdown {
  return computeDifficultyScore(word);
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Rewrite the test file**

Replace the entire content of `__tests__/lib/words-difficulty.test.ts`:

```typescript
/**
 * Words Difficulty Classification Tests
 * Tests for composite difficulty scoring system
 */

import { describe, it, expect } from 'vitest';
import {
  CLASSIFIED_WORDS,
  getWordsByDifficulty,
  getRandomWordByDifficulty,
  getDifficultyStats,
  hasWordsForDifficulty,
  getScoreBreakdown,
} from '@/lib/words-difficulty';
import type { DifficultyLevel } from '@/types/difficulty';

describe('words-difficulty', () => {
  describe('CLASSIFIED_WORDS', () => {
    it('should have all words classified', () => {
      expect(CLASSIFIED_WORDS.length).toBeGreaterThan(0);

      for (const word of CLASSIFIED_WORDS) {
        expect(word.word).toBeDefined();
        expect(word.category).toBeDefined();
        expect(word.difficulty).toBeDefined();
        expect(word.letterCount).toBeGreaterThan(0);
        expect(['easy', 'normal', 'hard']).toContain(word.difficulty);
      }
    });

    it('should have consistent letterCount', () => {
      for (const word of CLASSIFIED_WORDS.slice(0, 20)) {
        const expectedCount = word.word
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Za-z]/g, '').length;

        expect(word.letterCount).toBe(expectedCount);
      }
    });
  });

  describe('getWordsByDifficulty', () => {
    it('should return only words of specified difficulty', () => {
      const easyWords = getWordsByDifficulty('easy');
      const normalWords = getWordsByDifficulty('normal');
      const hardWords = getWordsByDifficulty('hard');

      expect(easyWords.every((w) => w.difficulty === 'easy')).toBe(true);
      expect(normalWords.every((w) => w.difficulty === 'normal')).toBe(true);
      expect(hardWords.every((w) => w.difficulty === 'hard')).toBe(true);
    });

    it('should return non-empty arrays for each difficulty', () => {
      expect(getWordsByDifficulty('easy').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('normal').length).toBeGreaterThan(0);
      expect(getWordsByDifficulty('hard').length).toBeGreaterThan(0);
    });

    it('should sum to total word count', () => {
      const easyCount = getWordsByDifficulty('easy').length;
      const normalCount = getWordsByDifficulty('normal').length;
      const hardCount = getWordsByDifficulty('hard').length;

      expect(easyCount + normalCount + hardCount).toBe(CLASSIFIED_WORDS.length);
    });
  });

  describe('getRandomWordByDifficulty', () => {
    it('should return word of correct difficulty', () => {
      const levels: DifficultyLevel[] = ['easy', 'normal', 'hard'];

      for (const level of levels) {
        const word = getRandomWordByDifficulty(level);
        expect(word).not.toBeNull();
        expect(word?.word).toBeDefined();
        expect(word?.category).toBeDefined();
      }
    });

    it('should exclude used words', () => {
      const usedWords = new Set<string>();

      const firstWord = getRandomWordByDifficulty('easy');
      expect(firstWord).not.toBeNull();

      usedWords.add(firstWord!.word.toUpperCase());

      for (let i = 0; i < 50; i++) {
        const word = getRandomWordByDifficulty('easy', usedWords);
        if (word) {
          expect(word.word.toUpperCase()).not.toBe(firstWord!.word.toUpperCase());
        }
      }
    });

    it('should return null when all words are used', () => {
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set<string>(
        easyWords.map((w) => w.word.toUpperCase())
      );

      const result = getRandomWordByDifficulty('easy', usedWords);
      expect(result).toBeNull();
    });

    it('should handle empty usedWords set', () => {
      const result = getRandomWordByDifficulty('normal', new Set());
      expect(result).not.toBeNull();
    });

    it('should return different words (randomness)', () => {
      const words = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const word = getRandomWordByDifficulty('easy');
        if (word) {
          words.add(word.word);
        }
      }

      expect(words.size).toBeGreaterThan(1);
    });
  });

  describe('getDifficultyStats', () => {
    it('should return stats for all difficulties', () => {
      const stats = getDifficultyStats();

      expect(stats.easy).toBeDefined();
      expect(stats.normal).toBeDefined();
      expect(stats.hard).toBeDefined();
    });

    it('should have valid counts', () => {
      const stats = getDifficultyStats();

      expect(stats.easy.count).toBeGreaterThan(0);
      expect(stats.normal.count).toBeGreaterThan(0);
      expect(stats.hard.count).toBeGreaterThan(0);

      const totalCount =
        stats.easy.count + stats.normal.count + stats.hard.count;
      expect(totalCount).toBe(CLASSIFIED_WORDS.length);
    });

    it('should have up to 3 examples per difficulty', () => {
      const stats = getDifficultyStats();

      expect(stats.easy.examples.length).toBeLessThanOrEqual(3);
      expect(stats.normal.examples.length).toBeLessThanOrEqual(3);
      expect(stats.hard.examples.length).toBeLessThanOrEqual(3);
    });
  });

  describe('hasWordsForDifficulty', () => {
    it('should return true when words are available', () => {
      expect(hasWordsForDifficulty('easy')).toBe(true);
      expect(hasWordsForDifficulty('normal')).toBe(true);
      expect(hasWordsForDifficulty('hard')).toBe(true);
    });

    it('should return true with empty usedWords', () => {
      expect(hasWordsForDifficulty('easy', new Set())).toBe(true);
    });

    it('should return false when all words of difficulty are used', () => {
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set(easyWords.map((w) => w.word.toUpperCase()));

      expect(hasWordsForDifficulty('easy', usedWords)).toBe(false);
    });

    it('should return true when some words remain', () => {
      const easyWords = getWordsByDifficulty('easy');
      const usedWords = new Set(
        easyWords.slice(0, -1).map((w) => w.word.toUpperCase())
      );

      expect(hasWordsForDifficulty('easy', usedWords)).toBe(true);
    });
  });

  describe('getScoreBreakdown', () => {
    it('should return breakdown with all criteria', () => {
      const breakdown = getScoreBreakdown('pomme');

      expect(breakdown.letterRarity).toBeGreaterThanOrEqual(0);
      expect(breakdown.letterRarity).toBeLessThanOrEqual(1);
      expect(breakdown.uniqueLetters).toBeGreaterThanOrEqual(0);
      expect(breakdown.uniqueLetters).toBeLessThanOrEqual(1);
      expect(breakdown.wordFrequency).toBeGreaterThanOrEqual(0);
      expect(breakdown.wordFrequency).toBeLessThanOrEqual(1);
      expect(breakdown.consonantRatio).toBeGreaterThanOrEqual(0);
      expect(breakdown.consonantRatio).toBeLessThanOrEqual(1);
      expect(breakdown.length).toBeGreaterThanOrEqual(0);
      expect(breakdown.length).toBeLessThanOrEqual(1);
      expect(breakdown.bigramRarity).toBeGreaterThanOrEqual(0);
      expect(breakdown.bigramRarity).toBeLessThanOrEqual(1);
      expect(breakdown.total).toBeGreaterThanOrEqual(0);
      expect(breakdown.total).toBeLessThanOrEqual(100);
      expect(['easy', 'normal', 'hard']).toContain(breakdown.level);
    });

    it('should score kiwi harder than pomme', () => {
      const pomme = getScoreBreakdown('pomme');
      const kiwi = getScoreBreakdown('kiwi');

      expect(kiwi.total).toBeGreaterThan(pomme.total);
    });
  });
});
```

- [ ] **Step 4: Run all tests and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/words-difficulty.ts __tests__/lib/words-difficulty.test.ts
git commit -m "refactor(difficulty): rewire words-difficulty to composite scoring"
```

---

## Chunk 4: Pre-commit Hook and Final Validation

### Task 9: Update pre-commit hook

**Files:**
- Modify: `.husky/pre-commit`

- [ ] **Step 1: Add freshness check to pre-commit hook**

Add the classifications check before the existing lint-staged step in `.husky/pre-commit`. Insert after line 3 (`echo "Running pre-commit checks..."`):

```bash
# 0. Check word classifications freshness (if source files changed)
if git diff --cached --name-only | grep -qE "src/lib/(words|letter-frequencies|bigram-frequencies|word-frequencies)\.ts"; then
  echo "Checking word classifications freshness..."
  npm run check:classifications
fi
```

- [ ] **Step 2: Test the hook manually**

Run: `npm run check:classifications`
Expected: "Word classifications are up-to-date."

- [ ] **Step 3: Commit**

```bash
git add .husky/pre-commit
git commit -m "ci(hooks): add word classification freshness check to pre-commit"
```

---

### Task 10: Full validation

- [ ] **Step 1: Run full test suite**

Run: `npm run validate`
Expected: typecheck PASS, lint PASS, all tests PASS

- [ ] **Step 2: Run the generation script to verify idempotency**

Run: `npm run generate:classifications && npm run check:classifications`
Expected: Regeneration succeeds, freshness check passes

- [ ] **Step 3: Verify word distribution**

Run: `npm run generate:classifications`
Expected output shows distribution close to targets:
- Easy: ~40% of words
- Normal: ~35% of words
- Hard: ~25% of words

If distribution is off, adjust `scoreThresholds` in `difficulty-config.ts` and regenerate.

- [ ] **Step 4: Final commit if any adjustments were made**

```bash
git add -A
git commit -m "feat(difficulty): composite difficulty scoring system complete"
```
