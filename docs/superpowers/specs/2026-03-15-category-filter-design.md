---
title: Filtre par catégorie — sélecteur UI solo + coop
version: 1.1
date: 2026-03-15
status: approved
llm-context: >
  Ajout d'un sélecteur de catégorie (grille de chips) sur les écrans de
  démarrage solo et coop. Sélection unique (une catégorie ou "Toutes").
  Composant partagé DRY. Filtre propagé aux fonctions de sélection de mots.
  Chips désactivées quand count=0 pour la difficulté active.
---

# Filtre par catégorie

## Objectif

Permettre au joueur de choisir une catégorie avant de lancer une partie (solo ou coop). Option "Toutes" par défaut (comportement actuel). Sélection unique.

## Composant `CategorySelector`

Grille de chips, même pattern visuel que `DifficultySelector` :
- Chip "Toutes" sélectionnée par défaut
- 15 chips pour les catégories, affichant le nom + nombre de mots disponibles (ex: "Animal (104)")
- Layout : 3-4 chips par ligne, responsive
- Sélection unique : cliquer une chip désélectionne la précédente
- **Chips avec count=0 désactivées** (grayed out, non-cliquable) — empêche le joueur de sélectionner une catégorie vide pour la difficulté active
- Si la catégorie sélectionnée devient 0 après changement de difficulté, reset automatique à "Toutes"
- Glassmorphism cohérent avec le design existant

### Props

```typescript
interface CategorySelectorProps {
  selected: WordCategory | null; // null = "Toutes"
  onSelect: (category: WordCategory | null) => void;
  difficulty?: DifficultyLevel; // pour filtrer le count par difficulté active
}
```

Le count affiché dans chaque chip est le nombre de mots disponibles pour cette catégorie ET la difficulté sélectionnée. Si `difficulty` n'est pas fourni, affiche le total.

### Emplacement

- `src/components/game/CategorySelector.tsx` — composant partagé
- Utilisé dans `SoloStartScreen.tsx` (solo) et `CoopLobby.tsx` (coop, hôte seulement)

> Note : `MultiplayerLobby.tsx` est un composant partagé coop/pvp. Le `CategorySelector` ne doit PAS y être ajouté directement (il apparaîtrait aussi en PvP où le maître choisit son propre mot). L'intégration se fait dans `CoopLobby.tsx` qui wrap `MultiplayerLobby`.

## Modifications API

### `words-difficulty.ts`

Ajouter un paramètre optionnel `category` aux fonctions existantes :

```typescript
export function getRandomWordByDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null,
): WordEntry | null;

export function hasWordsForDifficulty(
  difficulty: DifficultyLevel,
  usedWords?: ReadonlySet<string>,
  category?: WordCategory | null,
): boolean;

export function getWordsByDifficulty(
  difficulty: DifficultyLevel,
  category?: WordCategory | null,
): ClassifiedWord[];
```

Quand `category` est `null` ou `undefined`, comportement inchangé (toutes catégories).

### Fonction utilitaire pour les counts

```typescript
export function getWordCountByCategory(
  difficulty?: DifficultyLevel,
): Record<WordCategory, number>;
```

Retourne le nombre de mots par catégorie, optionnellement filtré par difficulté. Utilisé par `CategorySelector` pour afficher les counts.

## Intégration solo

### `SoloStartScreen.tsx`

Ajouter `CategorySelector` après le `DifficultySelector`. La catégorie sélectionnée est stockée en state local et passée à `useSoloSession`.

### `useSoloSession.ts`

Recevoir la catégorie sélectionnée et la passer à `getRandomWordByDifficulty(level, usedWords, category)`.

## Intégration coop

### `CoopLobby.tsx`

L'hôte voit le `CategorySelector` dans le lobby coop (pas dans `MultiplayerLobby.tsx` qui est partagé avec PvP). La catégorie choisie est stockée en state et passée au hook de session.

### `useCoopSession.ts` / `useCoopCallbacks.ts`

Le flow actuel de sélection de mot en coop :
1. Hôte clique "Commencer" → `useCoopCallbacks.startGame()` → `game.startGame()` → `useGameLogic.startGame()` → `getRandomWordByDifficulty(level)`
2. Le mot sélectionné est envoyé aux guests via message P2P `start`

Pour ajouter le filtre catégorie, il faut que la catégorie choisie par l'hôte arrive jusqu'à `getRandomWordByDifficulty`. Deux options :
- Passer la catégorie en paramètre de `startGame()` dans le callback chain
- Pré-sélectionner le mot dans `useCoopCallbacks` avec `getRandomWordByDifficulty(level, usedWords, category)` puis passer le mot directement à `game.startGame(word, category, difficulty)`

La seconde option est plus propre : le mot est sélectionné par le callback avec le filtre catégorie, puis passé explicitement. `useGameLogic.startGame(customWord, category, difficulty)` supporte déjà les mots custom.

### Message P2P `start`

Le `StartGameMessage.payload` dans `src/types/game.ts` contient déjà `word` et `category`. La catégorie du mot sélectionné est déjà transmise. Pas de changement de schéma P2P nécessaire — la catégorie fait déjà partie du payload.

> Note : le champ `difficulty` est absent du payload `start` (bug pré-existant — les guests ne connaissent pas la difficulté choisie par l'hôte). Ce bug est hors scope de cette feature mais devrait être traité séparément.

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/components/game/CategorySelector.tsx` | **Nouveau** — composant grille de chips |
| `src/lib/words-difficulty.ts` | Ajouter paramètre `category` + `getWordCountByCategory()` |
| `src/features/solo/components/SoloStartScreen.tsx` | Ajouter `CategorySelector` |
| `src/features/solo/hooks/useSoloSession.ts` | Passer catégorie à `getRandomWordByDifficulty` |
| `src/features/coop/components/CoopLobby.tsx` | Ajouter `CategorySelector` (hôte) |
| `src/features/coop/hooks/useCoopCallbacks.ts` | Pré-sélectionner mot avec filtre catégorie |

## Fichiers inchangés

- `game-engine.ts` — ne connaît pas les catégories, reçoit juste un mot
- `difficulty-scorer.ts` — scoring indépendant de la catégorie
- `session-memory.ts` — `getNextWord(state, category)` filtre déjà par catégorie (utilisé en solo via `useSessionMemory`)
- `MultiplayerLobby.tsx` — composant partagé coop/pvp, pas touché
- `types/game.ts` — le payload `start` contient déjà `category`

## Tests

- Test unitaire : `getWordsByDifficulty('easy', 'Animal')` retourne uniquement des animaux easy
- Test unitaire : `getRandomWordByDifficulty('normal', new Set(), 'Sport')` retourne un sport
- Test unitaire : `getRandomWordByDifficulty('hard', new Set(), null)` retourne n'importe quel mot hard (backward compat)
- Test unitaire : `getWordCountByCategory()` retourne 15 entrées avec counts > 0
- Test unitaire : `getWordCountByCategory('easy')` retourne des counts ≤ counts totaux
- Test composant : `CategorySelector` rend 16 chips (1 "Toutes" + 15 catégories)
- Test composant : chip avec count=0 est désactivée
- Test composant : sélection d'une chip appelle `onSelect` avec la bonne catégorie
