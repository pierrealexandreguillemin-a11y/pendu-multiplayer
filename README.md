# Pendu Multijoueur

> Jeu du pendu en famille avec modes Solo, Coop et PvP

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/Tests-27%20passing-green)]()
[![ISO](https://img.shields.io/badge/ISO-25010%20%7C%2029119%20%7C%205055-purple)]()

## Fonctionnalites

- **Mode Solo**: Joue seul contre l'ordinateur
- **Mode Coop**: Jouez ensemble contre l'ordinateur (WebRTC P2P)
- **Mode PvP**: Un joueur choisit le mot, les autres devinent

## Architecture

Architecture DDD (Domain-Driven Design) avec separation stricte des responsabilites:

```
src/
├── app/                  # PRESENTATION - Routes Next.js
│   ├── page.tsx         # Menu principal
│   ├── solo/page.tsx    # Mode solo
│   ├── coop/page.tsx    # Mode cooperatif
│   └── pvp/page.tsx     # Mode joueur vs joueur
├── components/           # PRESENTATION - Composants UI
│   ├── game/            # Composants du jeu (HangmanDrawing, Keyboard, etc.)
│   ├── ui/              # Composants shadcn/ui
│   └── effects/         # Effets visuels (glassmorphism, animations)
├── hooks/                # APPLICATION - Logique React
│   ├── useGameLogic.ts  # Bridge React <-> Game Engine
│   └── usePeerConnection.ts # Gestion WebRTC P2P
├── lib/                  # DOMAIN + INFRASTRUCTURE
│   ├── game-engine.ts   # Logique metier pure (0 dependance)
│   ├── words.ts         # Liste de mots francais
│   ├── message-validation.ts # Validation Zod (frontiere)
│   └── utils.ts         # Utilitaires
└── types/                # DOMAIN - Types TypeScript
    └── game.ts          # Types du jeu + messages multiplayer
```

## Stack Technique

| Categorie | Technologie |
|-----------|-------------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Multiplayer | PeerJS (WebRTC P2P) |
| Tests | Vitest |
| Linting | ESLint + Prettier |

## Standards ISO

Ce projet suit les standards:

- **ISO/IEC 25010**: Qualite logicielle (maintenabilite, fiabilite)
- **ISO/IEC 29119**: Tests logiciels (couverture 100% domain layer)
- **ISO/IEC 5055**: Qualite code (0 any, 0 warnings, validation Zod)
- **ISO/IEC 12207**: Cycle de vie (conventional commits, hooks pre-push)
- **ISO/IEC 42010**: Architecture (DDD, Clean Architecture)

## Installation

```bash
# Cloner le repo
git clone https://github.com/pierrealexandreguillemin-a11y/pendu-multiplayer.git
cd pendu-multiplayer

# Installer les dependances
npm install

# Lancer en developpement
npm run dev
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint (0 warnings) |
| `npm run typecheck` | Verification TypeScript |
| `npm run test` | Tests Vitest (watch) |
| `npm run test:run` | Tests Vitest (CI) |
| `npm run test:coverage` | Couverture de tests |

## Tests

```bash
# Lancer les tests
npm run test

# Couverture
npm run test:coverage
```

**Couverture actuelle**: 27 tests, 100% sur domain layer (`game-engine.ts`)

## Deploiement

Le projet est deploye sur Vercel:

1. Push sur `master` declenche le deploiement
2. Hooks pre-push verifient: TypeScript, ESLint, Tests, Build
3. Deploiement automatique si tous les checks passent

## Contribution

1. Fork le projet
2. Cree une branche (`git checkout -b feat/ma-feature`)
3. Commit avec conventional commits (`feat:`, `fix:`, `docs:`, etc.)
4. Push et cree une Pull Request

## Licence

MIT
