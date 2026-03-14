---
title: Score composite de difficulté — Standards de l'industrie
version: 2.1
date: 2026-03-14
status: approved
llm-context: >
  Ce document décrit le système de scoring multi-critères pour la classification
  de difficulté des mots dans un jeu de pendu francophone (Next.js/TypeScript).
  Il sert de référence pour l'implémentation et de contenu source pour une future
  page pédagogique in-app ("comment ça marche"). Les poids sont calibrés selon
  la recherche en résolution optimale de pendu (théorie de l'information, analyse
  fréquentielle). Les seuils sont adaptés aux mécaniques de l'app (maxErrors par
  niveau : easy=10, normal=7, hard=5). Les scores sont pré-calculés au build time
  par un script de génération, pas au runtime. Architecture validée contre les
  standards industrie (pattern Buf/protobuf, conventions Next.js, SRP).
---

# Score composite de difficulté

## Principe

Chaque mot reçoit un **score de difficulté de 0 à 100** calculé à partir de 6 critères pondérés. Ce score remplace la classification par longueur seule, pour une difficulté fidèle à l'expérience réelle du joueur.

## Pourquoi la longueur seule ne suffit pas

Le facteur #1 de difficulté au pendu n'est **pas** la longueur — c'est la **rareté des lettres**. Un mot long avec des lettres communes (E, A, S) se devine plus facilement qu'un mot court avec des lettres rares. La longueur donne même plus d'indices au joueur (plus de cases révélées par bonne réponse).

Exemple : "kiwi" (4 lettres) est plus dur que "éléphant" (8 lettres) car le K et le W sont rarement devinés en début de partie.

## Les 6 critères et leur poids

Les poids reflètent l'impact de chaque critère sur le nombre d'erreurs attendu dans une partie de pendu, selon la recherche en résolution optimale (théorie de l'information, analyse fréquentielle du français).

| # | Critère | Poids | Justification |
|---|---------|-------|---------------|
| 1 | Fréquence des lettres FR | **30%** | Prédicteur #1 : les lettres rares (K, W, X, Z, Q) forcent plus d'erreurs car les joueurs ne les testent pas en priorité |
| 2 | Lettres uniques | **20%** | Impact direct sur le nombre de bonnes réponses nécessaires pour compléter le mot |
| 3 | Fréquence d'usage du mot | **15%** | L'intuition du joueur aide à deviner les mots familiers — un mot rare ne bénéficie pas de ce raccourci cognitif |
| 4 | Ratio voyelles/consonnes | **15%** | Les joueurs testent les voyelles en premier (A, E, I, O, U) — peu de voyelles = erreurs précoces qui consomment les essais |
| 5 | Longueur du mot | **10%** | Prédicteur plus faible qu'on ne pense — rétrogradé par rapport aux implémentations naïves |
| 6 | Bigrammes courants | **10%** | Les patterns reconnaissables (CH, OU, AN, EN, RE) aident les joueurs expérimentés à deviner la lettre suivante |

### Détail de calcul par critère

**1. Fréquence des lettres FR (30%)**
Chaque lettre de l'alphabet reçoit un score de rareté de 0 (très courante) à 1 (très rare), basé sur la fréquence d'apparition en français. Le score du mot est la moyenne des scores de rareté de ses lettres uniques.

- Lettres très courantes (score ~0) : E, A, S, I, N, T, R
- Lettres courantes (score ~0.3) : L, O, U, D, C, P
- Lettres peu courantes (score ~0.6) : M, G, B, F, H, V
- Lettres rares (score ~0.9-1.0) : K, W, X, Z, Q, J, Y

**2. Lettres uniques (20%)**
Ratio `nombre de lettres uniques / longueur du mot`. Un ratio élevé signifie que le joueur doit deviner plus de lettres différentes.

- "banane" → 4 uniques / 6 lettres = 0.67 (plus facile)
- "klaxon" → 6 uniques / 6 lettres = 1.0 (plus dur)

> Note : ce critère capture l'effet dominant (moins de lettres distinctes = moins de devinettes nécessaires). L'effet secondaire des révélations partielles sur les lettres répétées est mineur et omis pour simplifier.

**3. Fréquence d'usage du mot (15%)**
Rang du mot dans un corpus de fréquence français (Lexique 3), normalisé de 0 (très courant) à 1 (rare). Pré-calculé par le script de génération à partir du fichier de référence.

**4. Ratio voyelles/consonnes (15%)**
`1 - (nombre de voyelles / longueur)`. Inversé car moins de voyelles = plus dur.

- "eau" → 1 - 3/3 = 0.00 (très facile, que des voyelles)
- "rythme" → 1 - 1/6 = 0.83 (très dur, presque que des consonnes)

**5. Longueur du mot (10%)**
Normalisé sur l'intervalle [3, 15]. `(longueur - 3) / (15 - 3)`, borné entre 0 et 1.

**6. Bigrammes courants (10%)**
Ratio de bigrammes du mot **absents** du top 30 des bigrammes français. Plus le mot contient de bigrammes inhabituels, plus il est dur.

- Top bigrammes FR : ES, EN, OU, DE, AN, RE, ER, LE, ON, NT, AI, TE, etc.

### Formule finale

```
score = (
    letterRarityScore   × 0.30
  + uniqueLetterRatio   × 0.20
  + wordFrequencyScore  × 0.15
  + consonantRatio      × 0.15
  + lengthScore         × 0.10
  + bigramRarityScore   × 0.10
) × 100
```

Chaque sous-score est normalisé entre 0 et 1 avant pondération.

## Seuils de classification

L'app utilise des `maxErrors` différents par niveau (easy=10, normal=7, hard=5). Les seuils produisent une **courbe de difficulté asymétrique** standard des jeux casual : le joueur doit réussir plus souvent qu'il échoue pour rester engagé.

| Niveau | Score | Distribution cible | Distribution réelle (120 mots) |
|--------|-------|-------------------|-------------------------------|
| easy (10 essais) | 0–47 | ~40% des mots | 43% (51 mots) |
| normal (7 essais) | 48–54 | ~35% des mots | 34% (41 mots) |
| hard (5 essais) | 55–100 | ~25% des mots | 23% (28 mots) |

Les seuils sont configurables dans `difficulty-config.ts` via `scoreThreshold` (un seuil par niveau : easy=47, normal=54, hard=100). Un mot avec un score ≤ au seuil `easy` est classé easy, ≤ `normal` est classé normal, sinon hard. Les seuils ont été calibrés empiriquement à partir de la distribution réelle des scores (range 35-65 sur les 120 mots) et pourront être réajustés après observation des taux de victoire.

> Note d'implémentation : `scoreThreshold` est un `number` scalaire par entrée de config (pas un objet), ce qui simplifie le code de classification. Chaque `DifficultyConfig` porte son propre seuil.

## Exemples concrets avec sous-scores

Chaque sous-score est entre 0 et 1. Le score final = `Math.round(somme pondérée × 100)`. L'arithmétique de chaque exemple est vérifiable : sous-score × poids = contribution, `Math.round(somme des contributions × 100)` = score final.

### pomme — Score: **39** → normal

Lettres uniques : P, O, M, E (4 sur 5). Voyelles : O, E (2 sur 5). Bigrammes : PO, OM, MM, ME (4 total).

| Critère | Sous-score | Calcul | Poids | Contribution |
|---------|-----------|--------|-------|-------------|
| Lettres rares | 0.29 | moy(P=0.30, O=0.30, M=0.55, E=0.00) = 1.15/4 | ×0.30 | 0.087 |
| Lettres uniques | 0.80 | 4/5 | ×0.20 | 0.160 |
| Fréquence mot | 0.05 | très courant | ×0.15 | 0.008 |
| Ratio consonnes | 0.60 | 1 - 2/5 | ×0.15 | 0.090 |
| Longueur | 0.17 | (5-3)/12 | ×0.10 | 0.017 |
| Bigrammes rares | 0.25 | 1/4 absents du top 30 | ×0.10 | 0.025 |
| **Total** | | | | **0.387 → round → 39** |

### kiwi — Score: **64** → normal

Lettres uniques : K, I, W (3 sur 4). Voyelles : I, I (2 sur 4). Bigrammes : KI, IW, WI (3 total).

| Critère | Sous-score | Calcul | Poids | Contribution |
|---------|-----------|--------|-------|-------------|
| Lettres rares | 0.67 | moy(K=0.96, I=0.10, W=0.96) = 2.02/3 | ×0.30 | 0.201 |
| Lettres uniques | 0.75 | 3/4 | ×0.20 | 0.150 |
| Fréquence mot | 0.70 | peu courant | ×0.15 | 0.105 |
| Ratio consonnes | 0.50 | 1 - 2/4 | ×0.15 | 0.075 |
| Longueur | 0.08 | (4-3)/12 | ×0.10 | 0.008 |
| Bigrammes rares | 1.00 | 3/3 absents du top 30 | ×0.10 | 0.100 |
| **Total** | | | | **0.639 → round → 64** |

### hippopotame — Score: **48** → normal

Lettres uniques : H, I, P, O, T, A, M, E (8 sur 11). Voyelles : I, O, O, A, E (5 sur 11). Bigrammes : HI, IP, PP, PO, OT, TA, AM, ME (8 total, hors doublon PO×2).

| Critère | Sous-score | Calcul | Poids | Contribution |
|---------|-----------|--------|-------|-------------|
| Lettres rares | 0.25 | moy(H=0.60, I=0.10, P=0.30, O=0.30, T=0.08, A=0.04, M=0.55, E=0.00) = 1.97/8 | ×0.30 | 0.075 |
| Lettres uniques | 0.73 | 8/11 | ×0.20 | 0.146 |
| Fréquence mot | 0.45 | moyennement courant | ×0.15 | 0.068 |
| Ratio consonnes | 0.55 | 1 - 5/11 | ×0.15 | 0.083 |
| Longueur | 0.67 | (11-3)/12 | ×0.10 | 0.067 |
| Bigrammes rares | 0.38 | 3/8 absents du top 30 | ×0.10 | 0.038 |
| **Total** | | | | **0.477 → round → 48** |

### vétérinaire — Score: **37** → easy

Lettres uniques : V, E, T, R, I, N, A (7 sur 11). Voyelles : E, E, I, A, I, E (6 sur 11). Bigrammes : VE, ET, TE, ER, RI, IN, NA, AI, IR, RE (10 total).

| Critère | Sous-score | Calcul | Poids | Contribution |
|---------|-----------|--------|-------|-------------|
| Lettres rares | 0.14 | moy(V=0.60, E=0.00, T=0.08, R=0.08, I=0.10, N=0.08, A=0.04) = 0.98/7 | ×0.30 | 0.042 |
| Lettres uniques | 0.64 | 7/11 | ×0.20 | 0.128 |
| Fréquence mot | 0.30 | courant | ×0.15 | 0.045 |
| Ratio consonnes | 0.45 | 1 - 6/11 | ×0.15 | 0.068 |
| Longueur | 0.67 | (11-3)/12 | ×0.10 | 0.067 |
| Bigrammes rares | 0.20 | 2/10 absents du top 30 | ×0.10 | 0.020 |
| **Total** | | | | **0.370 → round → 37** |

> Note : les valeurs de rareté des lettres et de fréquence des mots ci-dessus sont des estimations illustratives. Les valeurs définitives seront calculées par le script de génération à partir des données Lexique 3 et de la table de fréquence des lettres. L'arithmétique interne de chaque exemple est vérifiable et cohérente.

---

## Architecture des fichiers

### Nouveaux fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/normalize.ts` | Normalisation partagée : `stripAccents()`, `normalizeWord()`, `normalizeForLookup()` — source unique (DRY) |
| `src/lib/letter-frequencies.ts` | Table statique des scores de rareté par lettre (A-Z) |
| `src/lib/bigram-frequencies.ts` | Table statique des ~35 bigrammes FR les plus courants |
| `src/lib/difficulty-scorer.ts` | Calcul du score composite 6 critères (`computeDifficultyScore()`) |
| `src/lib/word-frequencies.ts` | **Généré** — scores de fréquence Lexique 3 pour chaque mot |
| `src/lib/word-classifications.ts` | **Généré** — mot, catégorie, difficulté, letterCount pré-calculés |
| `data/lexique3-top10k.csv` | Fichier de référence Lexique 3 (~350 mots FR avec fréquences réelles) |
| `scripts/source-hash.ts` | Module partagé : `SOURCE_FILES`, `computeSourceHash()`, `getStoredHash()` |
| `scripts/generate-word-frequencies.ts` | Lit CSV → génère `word-frequencies.ts` |
| `scripts/generate-word-classifications.ts` | Lit words + scorer → génère `word-classifications.ts` |
| `scripts/check-word-classifications.ts` | Vérifie la fraîcheur des fichiers générés |
| `scripts/should-check-classifications.ts` | Vérifie si les fichiers staged nécessitent un check (DRY avec `SOURCE_FILES`) |
| `.jscpd.json` | Config jscpd (seuil 3%, exclusions) |

### Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/lib/words-difficulty.ts` | Consomme `word-classifications.ts`. `classifyWord()` supprimée. `computeDifficultyScore()` dans `difficulty-scorer.ts` |
| `src/lib/difficulty-config.ts` | `wordLengthRange` → `scoreThreshold` (easy=47, normal=54, hard=100) |
| `src/types/difficulty.ts` | `scoreThreshold: number` + `DifficultyScoreBreakdown` |
| `eslint.config.mjs` | Règles complexity/max-lines/max-depth/max-params (error, zéro tolérance) |
| `.husky/pre-commit` | 6 checks : fraîcheur, lint-staged, typecheck, tests, duplication |
| `package.json` | Scripts generate/check + jscpd + tsx |

### Arbre de dépendances

```
data/lexique3-top10k.csv ─────────┐
                                  ↓
        scripts/generate-word-frequencies.ts
                                  ↓ (génère)
        src/lib/word-frequencies.ts ──────┐
src/lib/words.ts ─────────────────────────┤
src/lib/letter-frequencies.ts ────────────┤
src/lib/bigram-frequencies.ts ────────────┤
src/lib/normalize.ts ─────────────────────┤
src/lib/difficulty-config.ts ─────────────┤
                                          ↓
        src/lib/difficulty-scorer.ts (computeDifficultyScore)
                                          ↓
        scripts/generate-word-classifications.ts
                                          ↓ (génère)
        src/lib/word-classifications.ts
                                          ↓ (consommé par)
        src/lib/words-difficulty.ts
                                          ↓
        getWordsByDifficulty() / getRandomWordByDifficulty()
                                          ↓
        useSoloSession / useCoopSession / usePvPSession
```

### Hook pre-commit (6 checks)

```bash
# 0. Fraîcheur des fichiers générés (via scripts/should-check-classifications.ts)
# 1. lint-staged (ESLint strict + Prettier)
# 2. TypeScript typecheck
# 3. Tests Vitest
# 4. Détection de duplication jscpd (seuil 3%)
```

Le check de fraîcheur utilise `scripts/source-hash.ts` — source unique pour la liste des fichiers surveillés (`SOURCE_FILES`). Le hash couvre : `words.ts`, `letter-frequencies.ts`, `bigram-frequencies.ts`, `word-frequencies.ts`, `difficulty-config.ts`, `lexique3-top10k.csv`.

---

## Données de référence

### Lexique 383

- **Source** : http://www.lexique.org/databases/Lexique383/Lexique383.tsv (142 695 entrées)
- **Licence** : CC BY-SA 4.0
- **Citation** : New, Pallier, Brysbaert, Ferrand (2004) Lexique 2
- **Colonnes utilisées** : `ortho` (col 1) = mot, `freqlivres` (col 10) = fréquence par million dans les livres
- **Fichier local** : `data/lexique3-top10k.csv` — top 10 000 mots par freqlivres + 65 mots de jeu sous le seuil top 10k (10 066 entrées total)
- **Mots absents de Lexique** : 12 noms propres/anglicismes (basketball, volleyball, France, Australie, Égypte, Islande, Mexique, Norvège, Portugal, Tokyo, Marseille, Berlin) → freq=0, scorés comme rares

### Vérification des catégories

Les 120 mots ont été vérifiés contre l'API Wiktionnaire FR (`/w/api.php?action=query&titles={word}&prop=categories`). Mots ambigus identifiés et correctement désambiguïsés par le hint de catégorie :

| Mot | Catégorie app | Sens alternatifs | Désambiguïsation |
|-----|--------------|-----------------|------------------|
| avocat | Métier | Fruit (Wiktionary: "Fruits en français") | Hint "Métier" en mode easy/normal |
| orange | Fruit | Couleur (Wiktionary: "Adjectifs en français") | Hint "Fruit" |
| glacier | Nature | Vendeur de glaces | Hint "Nature" |
| aurore | Nature | Prénom, couleur | Hint "Nature" |
| pilote | Métier | Automobile, forme verbale | Hint "Métier" |
| cascade | Nature | Cinéma, jonglerie | Hint "Nature" |

---

## Usage futur : page pédagogique in-app

Ce document sert de source pour une future page "Comment ça marche" accessible aux utilisateurs curieux. Le contenu des sections "Les 6 critères", "Seuils de classification" et "Exemples concrets" peut être adapté en composant React avec visualisations interactives. La fonction `computeDifficultyScore(word)` de `src/lib/difficulty-scorer.ts` fournit les données nécessaires.
