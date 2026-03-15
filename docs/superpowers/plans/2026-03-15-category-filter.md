# Category Filter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a category selector (chip grid UI) to solo and coop start screens, filtering word selection by category.

**Architecture:** Shared `CategorySelector` component (same pattern as `DifficultySelector`). API layer (`words-difficulty.ts`) extended with optional `category` parameter. Solo integrates via `useSoloSession`, coop via `useCoopCallbacks` with pre-selected word. TDD throughout.

**Tech Stack:** TypeScript, React 19, Tailwind 4, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-15-category-filter-design.md`

---

## Definition of Done (DoD) — applies to EVERY task

1. **Tests pass:** `npx vitest run` — 0 failures
2. **Types pass:** `npm run typecheck` — 0 errors
3. **Lint passes:** `npm run lint` — 0 warnings, 0 errors
4. **Committed:** via pre-commit hook (freshness, lint-staged, typecheck, tests, duplication)
5. **No regressions:** test count ≥ previous
6. **SRP preserved:** each file has one clear responsibility, no file exceeds 200 lines
7. **DRY:** no duplicated logic between solo and coop integration

## Quality Gate

```bash
npm run lint && npm run typecheck && npx vitest run
```

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/lib/words-difficulty.ts` | Word selection API | Modify — add `category` param to 3 functions + `getWordCountByCategory()` |
| `src/components/game/CategorySelector.tsx` | Category chip grid UI | Create — shared component, same pattern as `DifficultySelector.tsx` |
| `src/features/solo/components/SoloStartScreen.tsx` | Solo start UI | Modify — add `CategorySelector`, pass category to parent |
| `src/features/solo/hooks/useSoloSession.ts` | Solo session logic | Modify — accept and use category in word selection |
| `src/features/coop/components/CoopLobby.tsx` | Coop lobby UI | Modify — add `CategorySelector` for host |
| `src/features/coop/hooks/useCoopCallbacks.ts` | Coop game actions | Modify — pre-select word with category filter |
| `src/features/coop/hooks/useCoopSession.ts` | Coop session state | Modify — hold category state, pass to callbacks |
| `__tests__/lib/words-difficulty.test.ts` | API tests | Modify — add category filter tests |
| `__tests__/components/CategorySelector.test.tsx` | Component tests | Create |

---

## Chunk 1: API layer — words-difficulty.ts

### Task 1: Add `category` parameter to `getWordsByDifficulty`

**Files:**
- Modify: `src/lib/words-difficulty.ts`
- Modify: `__tests__/lib/words-difficulty.test.ts`

- [ ] **Step 1: Write failing tests**

In `__tests__/lib/words-difficulty.test.ts`, add to the existing `getWordsByDifficulty` describe block:

```typescript
it('should filter by category when provided', () => {
  const animals = getWordsByDifficulty('easy', 'Animal');
  expect(animals.length).toBeGreaterThan(0);
  expect(animals.every((w) => w.category === 'Animal')).toBe(true);
});

it('should return all categories when category is null', () => {
  const all = getWordsByDifficulty('easy', null);
  const categories = new Set(all.map((w) => w.category));
  expect(categories.size).toBeGreaterThan(1);
});

it('should return all categories when category is undefined', () => {
  const all = getWordsByDifficulty('easy');
  const withNull = getWordsByDifficulty('easy', null);
  expect(all.length).toBe(withNull.length);
});
```

- [ ] **Step 2: Run tests — expect FAIL** (wrong arity)

```bash
npx vitest run __tests__/lib/words-difficulty.test.ts
```

- [ ] **Step 3: Implement**

In `src/lib/words-difficulty.ts`, update `getWordsByDifficulty`:

```typescript
export function getWordsByDifficulty(
  difficulty: DifficultyLevel,
  category?: WordCategory | null,
): ClassifiedWord[] {
  let words = CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty);
  if (category) {
    words = words.filter((w) => w.category === category);
  }
  return words;
}
```

Add import at top:
```typescript
import type { WordCategory } from './categories';
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run __tests__/lib/words-difficulty.test.ts
```

- [ ] **Step 5: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add src/lib/words-difficulty.ts __tests__/lib/words-difficulty.test.ts
git commit -m "feat: add category filter to getWordsByDifficulty"
```

### Task 2: Add `category` parameter to `getRandomWordByDifficulty` and `hasWordsForDifficulty`

**Files:**
- Modify: `src/lib/words-difficulty.ts`
- Modify: `__tests__/lib/words-difficulty.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
describe('getRandomWordByDifficulty with category', () => {
  it('should return word from specified category', () => {
    const word = getRandomWordByDifficulty('normal', new Set(), 'Sport');
    expect(word).not.toBeNull();
    expect(word!.category).toBe('Sport');
  });

  it('should return any word when category is null', () => {
    const word = getRandomWordByDifficulty('normal', new Set(), null);
    expect(word).not.toBeNull();
  });

  it('should be backward compatible without category', () => {
    const word = getRandomWordByDifficulty('easy');
    expect(word).not.toBeNull();
  });
});

describe('hasWordsForDifficulty with category', () => {
  it('should return true for populated category', () => {
    expect(hasWordsForDifficulty('easy', new Set(), 'Animal')).toBe(true);
  });

  it('should be backward compatible without category', () => {
    expect(hasWordsForDifficulty('easy')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement**

Update `getRandomWordByDifficulty`:
```typescript
export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null,
): WordEntry | null {
  let candidates = getWordsByDifficulty(difficulty, category);
  if (usedWords && usedWords.size > 0) {
    candidates = candidates.filter((w) => !usedWords.has(w.word.toUpperCase()));
  }
  if (candidates.length === 0) return null;
  const index = Math.floor(Math.random() * candidates.length);
  const selected = candidates[index];
  return selected ? { word: selected.word, category: selected.category } : null;
}
```

Update `hasWordsForDifficulty`:
```typescript
export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null,
): boolean {
  const candidates = getWordsByDifficulty(difficulty, category);
  if (!usedWords || usedWords.size === 0) return candidates.length > 0;
  return candidates.some((w) => !usedWords.has(w.word.toUpperCase()));
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add src/lib/words-difficulty.ts __tests__/lib/words-difficulty.test.ts
git commit -m "feat: add category filter to getRandomWordByDifficulty and hasWordsForDifficulty"
```

### Task 3: Add `getWordCountByCategory` utility

**Files:**
- Modify: `src/lib/words-difficulty.ts`
- Modify: `__tests__/lib/words-difficulty.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { VALID_CATEGORIES } from '@/lib/categories';

describe('getWordCountByCategory', () => {
  it('should return counts for all 15 categories', () => {
    const counts = getWordCountByCategory();
    expect(Object.keys(counts).length).toBe(15);
    for (const cat of VALID_CATEGORIES) {
      expect(counts[cat]).toBeGreaterThan(0);
    }
  });

  it('should return filtered counts when difficulty provided', () => {
    const allCounts = getWordCountByCategory();
    const easyCounts = getWordCountByCategory('easy');
    for (const cat of VALID_CATEGORIES) {
      expect(easyCounts[cat]).toBeLessThanOrEqual(allCounts[cat]);
    }
  });

  it('should have total matching CLASSIFIED_WORDS length', () => {
    const counts = getWordCountByCategory();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(CLASSIFIED_WORDS.length);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement**

```typescript
export function getWordCountByCategory(
  difficulty?: DifficultyLevel,
): Record<WordCategory, number> {
  const counts = Object.fromEntries(
    VALID_CATEGORIES.map((cat) => [cat, 0])
  ) as Record<WordCategory, number>;

  const words = difficulty
    ? CLASSIFIED_WORDS.filter((w) => w.difficulty === difficulty)
    : CLASSIFIED_WORDS;

  for (const w of words) {
    if (VALID_CATEGORIES.includes(w.category as WordCategory)) {
      counts[w.category as WordCategory]++;
    }
  }
  return counts;
}
```

Add import:
```typescript
import { VALID_CATEGORIES, type WordCategory } from './categories';
```

(Merge with existing `WordCategory` import from Task 1.)

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add src/lib/words-difficulty.ts __tests__/lib/words-difficulty.test.ts
git commit -m "feat: add getWordCountByCategory utility"
```

---

## Chunk 2: CategorySelector component

### Task 4: Create `CategorySelector` component

**Files:**
- Create: `src/components/game/CategorySelector.tsx`

Follow the exact pattern of `DifficultySelector.tsx` (glassmorphism, WCAG radiogroup, `cn()` utility). Reference file: `src/components/game/DifficultySelector.tsx`.

- [ ] **Step 1: Create component**

```typescript
/**
 * Category Selector - UI Component
 * Presentation Layer - Category selection chip grid
 *
 * ISO/IEC 25010 - Usability: Clear visual feedback for selection
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { VALID_CATEGORIES, type WordCategory } from '@/lib/categories';
import { getWordCountByCategory } from '@/lib/words-difficulty';
import type { DifficultyLevel } from '@/types/difficulty';

interface CategorySelectorProps {
  selected: WordCategory | null;
  onSelect: (category: WordCategory | null) => void;
  difficulty?: DifficultyLevel;
  className?: string;
}

export function CategorySelector({
  selected,
  onSelect,
  difficulty,
  className,
}: CategorySelectorProps) {
  const counts = useMemo(() => getWordCountByCategory(difficulty), [difficulty]);

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm text-gray-400 text-center">Catégorie</label>

      <div
        className="flex flex-wrap gap-2 justify-center"
        role="radiogroup"
        aria-label="Catégorie de mots"
      >
        {/* "Toutes" chip */}
        <button
          role="radio"
          aria-checked={selected === null}
          onClick={() => onSelect(null)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg border transition-all',
            selected === null
              ? 'bg-white/20 border-white/40 text-white font-medium'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          Toutes
        </button>

        {/* Category chips */}
        {VALID_CATEGORIES.map((cat) => {
          const count = counts[cat];
          const isSelected = selected === cat;
          const isDisabled = count === 0;

          return (
            <button
              key={cat}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => onSelect(cat)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-all',
                isDisabled && 'opacity-30 cursor-not-allowed',
                isSelected
                  ? 'bg-white/20 border-white/40 text-white font-medium'
                  : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Quality gate**

```bash
npm run lint && npm run typecheck && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/CategorySelector.tsx
git commit -m "feat: add CategorySelector component (chip grid)"
```

### Task 5: Add CategorySelector tests

**Files:**
- Create: `__tests__/components/CategorySelector.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySelector } from '@/components/game/CategorySelector';
import { VALID_CATEGORIES } from '@/lib/categories';

describe('CategorySelector', () => {
  it('should render 16 radio buttons (Toutes + 15 categories)', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(16);
  });

  it('should have "Toutes" checked by default when selected is null', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const toutes = screen.getByRole('radio', { name: /toutes/i });
    expect(toutes).toHaveAttribute('aria-checked', 'true');
  });

  it('should show category with count', () => {
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const animal = screen.getByRole('radio', { name: /animal/i });
    expect(animal.textContent).toMatch(/Animal \(\d+\)/);
  });

  it('should call onSelect with category when clicked', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector selected={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('radio', { name: /animal/i }));
    expect(onSelect).toHaveBeenCalledWith('Animal');
  });

  it('should call onSelect with null when Toutes clicked', async () => {
    const onSelect = vi.fn();
    render(<CategorySelector selected="Animal" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('radio', { name: /toutes/i }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('should highlight the selected category', () => {
    render(<CategorySelector selected="Sport" onSelect={() => {}} />);
    const sport = screen.getByRole('radio', { name: /sport/i });
    expect(sport).toHaveAttribute('aria-checked', 'true');
  });

  it('should disable chips with count 0', () => {
    // With a very restrictive difficulty, some categories may have 0
    // This test verifies the disabled attribute is set correctly
    render(<CategorySelector selected={null} onSelect={() => {}} />);
    const radios = screen.getAllByRole('radio');
    // All should be either enabled or disabled based on count
    radios.forEach((radio) => {
      const isDisabled = radio.getAttribute('aria-disabled') === 'true';
      if (isDisabled) {
        expect(radio).toBeDisabled();
      }
    });
  });
});
```

Note: This test requires `@testing-library/react` and `@testing-library/user-event`. Check `package.json` — if not installed, add as devDependencies. Also needs `jsdom` environment in vitest config for this test file.

- [ ] **Step 2: Ensure test dependencies exist**

```bash
npm ls @testing-library/react @testing-library/user-event
```

If missing, install:
```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run __tests__/components/CategorySelector.test.tsx
```

- [ ] **Step 4: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add __tests__/components/ package.json package-lock.json
git commit -m "test: add CategorySelector component tests"
```

---

## Chunk 3: Solo integration

### Task 6: Integrate CategorySelector in SoloStartScreen + useSoloSession

**Files:**
- Modify: `src/features/solo/components/SoloStartScreen.tsx`
- Modify: `src/features/solo/hooks/useSoloSession.ts`
- Verify: `src/app/solo/page.tsx` (no change expected)

- [ ] **Step 1: Update `useSoloSession` — add `selectedCategory` state and thread through**

In `src/features/solo/hooks/useSoloSession.ts`:

Add imports:
```typescript
import { useState } from 'react'; // already imported, just add useState
import type { WordCategory } from '@/lib/categories';
```

Add state:
```typescript
const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
```

Replace `startSession`:
```typescript
const startSession = useCallback((category?: WordCategory | null) => {
  const cat = category ?? null;
  setSelectedCategory(cat);
  setSessionScore(0);
  setWordsWon(0);
  hasRecordedRef.current = false;
  sessionMemory.reset();

  const wordEntry = getRandomWordByDifficulty(difficulty, sessionMemory.usedWords, cat);
  if (wordEntry) {
    startGame(wordEntry.word, wordEntry.category, difficulty);
  } else {
    startGame(undefined, undefined, difficulty);
  }
}, [startGame, sessionMemory, difficulty]);
```

Replace `continueSession`:
```typescript
const continueSession = useCallback(() => {
  if (gameState) {
    const baseScore = calculateScore(gameState.word);
    const finalScore = calculateDifficultyScore(baseScore, difficulty);
    setSessionScore((prev) => prev + finalScore);
    setWordsWon((prev) => prev + 1);
  }

  const wordEntry = getRandomWordByDifficulty(difficulty, sessionMemory.usedWords, selectedCategory);
  if (wordEntry) {
    startGame(wordEntry.word, wordEntry.category, difficulty);
  } else {
    sessionMemory.reset();
    const resetWord = getRandomWordByDifficulty(difficulty, undefined, selectedCategory);
    if (resetWord) {
      startGame(resetWord.word, resetWord.category, difficulty);
    }
  }
}, [gameState, startGame, sessionMemory, difficulty, selectedCategory]);
```

- [ ] **Step 2: Update `SoloStartScreen` — add CategorySelector and pass category**

Add imports:
```typescript
import { useState, useEffect } from 'react';
import { CategorySelector } from '@/components/game/CategorySelector';
import { getWordCountByCategory } from '@/lib/words-difficulty';
import { useDifficultyStore } from '@/stores/difficulty';
import type { WordCategory } from '@/lib/categories';
```

Update props interface — `onStart` now passes category:
```typescript
onStart: (category: WordCategory | null) => void;
```

Add state and auto-reset inside component:
```typescript
const [category, setCategory] = useState<WordCategory | null>(null);
const { level: difficulty } = useDifficultyStore();

// Auto-reset category when difficulty change makes it empty
useEffect(() => {
  if (category) {
    const counts = getWordCountByCategory(difficulty);
    if (counts[category] === 0) {
      setCategory(null);
    }
  }
}, [difficulty, category]);
```

Add `CategorySelector` after `DifficultySelector`:
```tsx
<CategorySelector
  selected={category}
  onSelect={setCategory}
  difficulty={difficulty}
  className="my-4"
/>
```

Update button onClick:
```tsx
onClick={() => onStart(category)}
```

- [ ] **Step 3: Verify `src/app/solo/page.tsx` still type-checks**

`onStart={session.startSession}` — `startSession` now accepts `(category?: WordCategory | null)` which satisfies `(category: WordCategory | null) => void`. No code change needed at the page level.

- [ ] **Step 4: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add src/features/solo/ src/app/solo/
git commit -m "feat: integrate CategorySelector in solo mode"
```

---

## Chunk 4: Coop integration

### Task 7: Integrate CategorySelector in CoopLobby

**Files:**
- Modify: `src/features/coop/components/CoopLobby.tsx`
- Modify: `src/features/coop/hooks/useCoopSession.ts`
- Modify: `src/features/coop/hooks/useCoopCallbacks.ts`

- [ ] **Step 1: Add category state to `useCoopSession`**

In `src/features/coop/hooks/useCoopSession.ts`, add:

```typescript
import type { WordCategory } from '@/lib/categories';

// Inside useCoopSession:
const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
```

Pass `selectedCategory` and `setSelectedCategory` to `useCoopCallbacks` via the options object.

Return `selectedCategory` and `setSelectedCategory` from the hook.

- [ ] **Step 2: Update `useCoopCallbacks` to use category**

In `src/features/coop/hooks/useCoopCallbacks.ts`:

Add imports:
```typescript
import { getRandomWordByDifficulty } from '@/lib/words-difficulty';
import type { WordCategory } from '@/lib/categories';
```

Add to `CoopCallbacksOptions`:
```typescript
selectedCategory: WordCategory | null;
difficulty: DifficultyLevel; // from useDifficultyStore, NOT from game.gameState
```

**IMPORTANT:** `difficulty` MUST come from `useDifficultyStore().level` (passed via options from `useCoopSession`), NOT from `game.gameState?.difficulty`. Before `startGame()` is called, `game.gameState` is `null`, so `game.gameState?.difficulty` would always be `undefined` → fallback `'normal'`.

Update `startGame`:
```typescript
const startGame = useCallback(() => {
  hasRecordedRef.current = false;
  startBroadcastSentRef.current = false;

  // Pre-select word with category filter (host only)
  const wordEntry = getRandomWordByDifficulty(
    opts.difficulty,
    undefined,
    opts.selectedCategory,
  );
  if (wordEntry) {
    game.startGame(wordEntry.word, wordEntry.category, opts.difficulty);
  } else {
    game.startGame();
  }
  setPhase('playing');
}, [game, hasRecordedRef, startBroadcastSentRef, setPhase, opts.difficulty, opts.selectedCategory]);
```

Update `continueSession`:
```typescript
const continueSession = useCallback(() => {
  const currentWord = game.gameState?.word;
  const currentDifficulty = game.gameState?.difficulty ?? 'normal';
  if (currentWord) {
    setSessionScore(
      (prev) => prev + calculateDifficultyScore(calculateScore(currentWord), currentDifficulty)
    );
    setWordsWon((prev) => prev + 1);
  }
  hasRecordedRef.current = false;
  startBroadcastSentRef.current = false;

  // Use opts.difficulty (from store) for next word selection, not game.gameState
  const wordEntry = getRandomWordByDifficulty(
    opts.difficulty,
    undefined,
    opts.selectedCategory,
  );
  if (wordEntry) {
    game.startGame(wordEntry.word, wordEntry.category, opts.difficulty);
  } else {
    game.startGame();
  }
}, [game, hasRecordedRef, startBroadcastSentRef, setSessionScore, setWordsWon, opts.difficulty, opts.selectedCategory]);
```

- [ ] **Step 3: Add CategorySelector to CoopLobby**

In `src/features/coop/components/CoopLobby.tsx`:

```typescript
import { CategorySelector } from '@/components/game/CategorySelector';
import type { WordCategory } from '@/lib/categories';

interface CoopLobbyProps {
  // ... existing props ...
  selectedCategory: WordCategory | null;
  onCategoryChange: (category: WordCategory | null) => void;
  isHost?: boolean;
}

export function CoopLobby(props: CoopLobbyProps) {
  const { selectedCategory, onCategoryChange, isHost, ...lobbyProps } = props;

  return (
    <>
      <MultiplayerLobby {...lobbyProps} /* existing props */ />
      {isHost && (
        <CategorySelector
          selected={selectedCategory}
          onSelect={onCategoryChange}
          className="mt-4"
        />
      )}
    </>
  );
}
```

Note: The exact integration depends on how `CoopLobby` renders `MultiplayerLobby`. The `CategorySelector` should appear only for the host, inside the lobby card. Inspect the actual rendering to place it correctly (may need to pass as children or add below the lobby).

- [ ] **Step 4: Wire props from coop page**

In `src/app/coop/page.tsx`, pass `selectedCategory` and `setSelectedCategory` from the session hook to `CoopLobby`.

- [ ] **Step 5: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add src/features/coop/ src/app/coop/
git commit -m "feat: integrate CategorySelector in coop mode (host only)"
```

---

## Chunk 5: E2E + final validation

### Task 8: Add E2E tests for category filter

**Files:**
- Modify: `e2e/solo.spec.ts`
- Modify: `e2e/difficulty.spec.ts`

- [ ] **Step 1: Add solo category E2E test**

In `e2e/solo.spec.ts`, add:

```typescript
test('should display category selector', async ({ page }) => {
  const categoryGroup = page.getByRole('radiogroup', { name: /catégorie/i });
  await expect(categoryGroup).toBeVisible();
  await expect(page.getByRole('radio', { name: /toutes/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /animal/i })).toBeVisible();
});

test('should allow selecting a category before starting', async ({ page }) => {
  await page.getByRole('radio', { name: /animal/i }).click();
  await page.getByPlaceholder(/ex.*marie/i).fill('CatTest');
  await page.getByRole('button', { name: /commencer/i }).click();
  await expect(page.getByRole('group', { name: /clavier/i })).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 2: Run E2E locally**

```bash
npx playwright test --project=chromium e2e/solo.spec.ts
```

- [ ] **Step 3: Quality gate + commit**

```bash
npm run lint && npm run typecheck && npx vitest run
git add e2e/
git commit -m "test(e2e): add category selector tests for solo mode"
```

*Task 9 (auto-reset) merged into Task 6 Step 2 — the `useEffect` for auto-reset is part of `SoloStartScreen` implementation.*

---

## Task Dependency Graph

```
Task 1 (getWordsByDifficulty + category) ──→ Task 2 (getRandom + has)
                                                    │
                                                    ↓
                                              Task 3 (getWordCountByCategory)
                                                    │
                                                    ↓
                                              Task 4 (CategorySelector component)
                                                    │
                                              Task 5 (component tests)
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ↓                               ↓
                              Task 6 (solo + auto-reset)      Task 7 (coop)
                                    │                               │
                                    └───────────────┬───────────────┘
                                                    ↓
                                              Task 8 (E2E)
```

### SRP / DRY Architecture Notes

- **`CategorySelector`** — single responsibility: render chips, call `onSelect`. No game logic. Same pattern as `DifficultySelector`.
- **`words-difficulty.ts`** — extended API, backward compatible. All category filtering in one place (not duplicated in solo/coop).
- **Solo vs Coop** — both call `getRandomWordByDifficulty(level, usedWords, category)`. No duplicated filtering logic.
- **`CoopLobby`** — thin wrapper around `MultiplayerLobby`, adds `CategorySelector` without modifying the shared component. PvP unaffected.

### UI Conformity

- `CategorySelector` follows `DifficultySelector` patterns: same `cn()` utility, same glassmorphism, same WCAG radiogroup role, same label style.
- **Known gap:** Neither `DifficultySelector` nor `CategorySelector` implement arrow-key navigation between radio options (WCAG radiogroup best practice). Deferred — both use click-only `<button role="radio">`. To be addressed in a separate accessibility pass.
- Chips use same `border-white/10`, `hover:bg-white/5`, `text-gray-400` palette.

### frontend-design validation

After Task 4, dispatch a `@superpowers:requesting-code-review` focused on UI conformity between `CategorySelector` and `DifficultySelector` to ensure visual consistency.
