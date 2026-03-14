---
title: Expansion mots — 15 catégories × ~100 mots (1500 total)
version: 1.1
date: 2026-03-14
status: approved
llm-context: >
  Ce document spécifie l'expansion du corpus de mots du jeu de pendu de 120 mots
  (8 catégories) à ~1500 mots (15 catégories). Il décrit les catégories retenues,
  les contraintes de sélection des mots, la migration des catégories existantes,
  et les impacts sur l'architecture (scoring, seuils, génération, tests).
  ADR pour la restructuration des catégories inclus.
---

# Expansion du corpus — 15 catégories × ~100 mots

## Contexte

Le jeu dispose actuellement de 120 mots répartis dans 8 catégories (15 mots chacune). Cette taille limite la rejouabilité et la variété des parties. L'objectif est de passer à ~1500 mots dans 15 catégories (~100 mots par catégorie).

## ADR — Restructuration des catégories

### Problème

3 catégories existantes posent problème pour le passage à l'échelle :

| Catégorie | Problème |
|-----------|----------|
| **Fruit** | Sous-ensemble de Nourriture. Impossible de trouver 100 fruits jouables. |
| **Nature** | Périmètre flou — recoupe Géographie (montagne, océan) et Science (étoile, volcan). |
| **Objet** | Trop vague — tout est un objet. Les jeux de l'industrie utilisent des catégories concrètes. |

### Décision

- **Fruit** → fusionné dans **Nourriture** (fruits, légumes, plats, pâtisseries, boissons)
- **Nature** → recentré sur **plantes, arbres, fleurs, phénomènes météo, paysages, minéraux**
- **Objet** → éclaté en **Maison** (meubles, ustensiles, électroménager) + **Technologie** (informatique, électronique)

### Migration des 120 mots existants

| Mot actuel | Catégorie avant | Catégorie après |
|-----------|----------------|-----------------|
| pomme, banane, fraise, orange, cerise, ananas, pastèque, mangue, pêche, raisin, citron, poire, abricot, framboise, kiwi | Fruit | Nourriture |
| montagne, désert, prairie, océan, glacier | Nature | Géographie |
| étoile, volcan, tonnerre | Nature | Science |
| tournesol, forêt | Nature | Nature (conservé) |
| cascade, rivière, arc-en-ciel, nuage, aurore | Nature | Nature (conservé) |
| ordinateur, téléphone, clavier, télévision, microscope | Objet | Technologie |
| bicyclette | Objet | Véhicule |
| trampoline | Objet | Sport |
| parapluie, dictionnaire, réveil, lunettes, ciseaux, casserole, valise, bouteille | Objet | Maison |

Aucun mot n'est supprimé.

## Les 15 catégories

| # | Catégorie | Périmètre | ~Mots cible |
|---|-----------|-----------|-------------|
| 1 | Animal | mammifères, oiseaux, poissons, insectes, reptiles | 100 |
| 2 | Nourriture | fruits, légumes, plats, pâtisseries, boissons | 100 |
| 3 | Métier | tous domaines professionnels | 100 |
| 4 | Sport | sports, disciplines, activités physiques | 100 |
| 5 | Géographie | pays, villes, reliefs, cours d'eau, océans | 100 |
| 6 | Nature | plantes, arbres, fleurs, météo, paysages, minéraux | 100 |
| 7 | Science | physique, chimie, biologie, astronomie, géologie | 100 |
| 8 | Musique | instruments, genres, termes musicaux | 100 |
| 9 | Véhicule | terre, mer, air, ferroviaire | 100 |
| 10 | Vêtement | habits, accessoires, chaussures, tissus | 100 |
| 11 | Corps humain | organes, os, muscles, sens | 100 |
| 12 | Art | techniques, mouvements, outils, formes | 100 |
| 13 | Histoire | époques, personnages-types, objets historiques | 100 |
| 14 | Maison | meubles, ustensiles, pièces, électroménager | 100 |
| 15 | Technologie | informatique, électronique, communication, inventions | 100 |

## Contraintes de sélection des mots

### Obligatoires

1. **Lexique 383** — chaque mot doit être un nom commun présent dans Lexique 383 (sauf noms propres de Géographie, déjà gérés avec freq=0)
2. **Longueur** — entre 3 et 15 lettres (bornes du scoring actuel)
3. **Jouabilité** — pas de mots offensants, pas de termes trop techniques/obscurs
4. **Accents** — les accents sont autorisés (normalisés par `stripAccents()` au runtime)
5. **Tirets** — les mots composés avec tiret sont autorisés (ex: arc-en-ciel), gérés par `normalizeWord()`
6. **Unicité** — aucun doublon inter-catégories (un mot n'appartient qu'à une catégorie)

### Qualité

7. **Désambiguïsation** — les mots polysémiques doivent être correctement assignés à la catégorie principale (ex: avocat → Métier, orange → Nourriture). Le hint de catégorie en mode easy/normal résout l'ambiguïté pour le joueur.
8. **Équilibre difficulté** — chaque catégorie doit contenir des mots easy, normal et hard (pas que des mots faciles ou que des mots durs)

## Format de données

### Approche : fichier CSV source → génération

Le fichier `words.ts` hardcodé à 120 entrées ne scale pas à 1500. Nouvelle approche :

- **Source** : `data/words.csv` — fichier CSV avec colonnes `word,category`
- **Génération** : le script `generate-word-classifications.ts` lit le CSV au lieu d'importer `words.ts`
- **Sortie** : `word-classifications.ts` inchangé (même format, plus d'entrées)
- **`words.ts`** : **supprimé**. L'interface `WordEntry` migre vers `src/types/word.ts`. Les consommateurs (`words-difficulty.ts`) importent depuis `word-classifications.ts` uniquement.

### Parsing CSV

Le script `generate-word-classifications.ts` lit `data/words.csv` avec `node:fs` (readFileSync UTF-8) et un split ligne par ligne (pas de dépendance externe). Validation à la lecture :
- Skip ligne vide ou header
- Vérifier format `word,category` (exactement une virgule par ligne)
- Erreur fatale (`process.exit(1)`) si ligne malformée, catégorie inconnue, ou doublon

### Structure CSV

```csv
word,category
chat,Animal
chien,Animal
...
guitare,Musique
piano,Musique
```

- Encodage UTF-8
- Pas de guillemets sauf si le mot contient une virgule (aucun cas prévu)
- Trié par catégorie puis alphabétiquement

## Impacts sur le scoring

### Seuils de difficulté

Les seuils actuels (easy ≤ 47, normal ≤ 54, hard ≤ 100) ont été calibrés sur 120 mots avec un range de scores 35-65. Avec 1500 mots, le range va s'élargir. Les seuils devront être **recalibrés** après génération en observant la distribution réelle.

Cible de distribution (standard casual gaming) :
- easy : ~40% des mots
- normal : ~35% des mots
- hard : ~25% des mots

### Fréquence Lexique 383

Le fichier `data/lexique3-top10k.csv` (10 066 entrées) couvre déjà largement 1500 mots. Les mots absents (noms propres Géographie) gardent freq=0.

## Impacts sur l'architecture

### Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `data/words.csv` | **Nouveau** — source de vérité des 1500 mots |
| `src/lib/words.ts` | **Supprimé** — remplacé par `data/words.csv` |
| `src/types/word.ts` | **Nouveau** — `WordEntry` interface (extraite de `words.ts`) |
| `src/lib/word-classifications.ts` | Régénéré (1500 entrées) |
| `src/lib/word-frequencies.ts` | Régénéré (peut nécessiter plus de lookups) |
| `scripts/generate-word-classifications.ts` | Lit CSV au lieu d'importer words.ts |
| `scripts/source-hash.ts` | `SOURCE_FILES` : remplacer `src/lib/words.ts` par `data/words.csv` |
| `src/lib/words-difficulty.ts` | Remplacer `import type { WordEntry } from './words'` par import depuis `@/types/word` |
| `src/lib/difficulty-config.ts` | Seuils recalibrés si nécessaire |
| Tests | Adapter les assertions sur les counts |

### Fichiers inchangés

- `src/lib/difficulty-scorer.ts` — la formule ne change pas
- `src/lib/letter-frequencies.ts` — données statiques FR
- `src/lib/bigram-frequencies.ts` — données statiques FR
- `src/lib/normalize.ts` — normalisation inchangée
- `src/lib/words-difficulty.ts` — API publique inchangée (import `WordEntry` mis à jour)

## Stratégie de population

Les 1500 mots seront sélectionnés par extraction depuis Lexique 383 :
1. Filtrer les noms communs de 3-15 lettres
2. Classer manuellement ou semi-automatiquement par catégorie
3. Vérifier la jouabilité (pas de termes obscurs)
4. Valider la couverture Lexique 383 pour le scoring
5. S'assurer de l'équilibre inter-catégories (~100 mots chacune)

## Tests

- Test unitaire : vérifier que chaque catégorie a ≥ 80 mots
- Test unitaire : vérifier l'unicité inter-catégories
- Test unitaire : vérifier que tous les mots font 3-15 lettres
- Test unitaire : vérifier la distribution easy/normal/hard (~40/35/25 ±5%) — **warning** dans la console du générateur, pas bloquant au build (les seuils seront ajustés itérativement)
- Tests existants : adapter les assertions de count (120 → ~1500)
- Les tests vivent dans `src/**/*.test.ts` (convention Vitest existante, ex: `src/lib/__tests__/`)
