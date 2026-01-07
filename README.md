# Pendu Multijoueur

> Jeu du pendu en famille avec modes Solo, Coop et PvP - Architecture ISO-compliant

[![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-106%20passing-brightgreen)]()
[![ISO](https://img.shields.io/badge/ISO-25010%20%7C%2025065%20%7C%2042010-purple)]()

**Production:** https://pendu-nu.vercel.app

## Fonctionnalites

| Mode | Description | Joueurs |
|------|-------------|---------|
| **Solo** | Joue seul contre l'ordinateur | 1 |
| **Coop** | Jouez ensemble contre l'ordinateur | 2-6 |
| **PvP** | Un joueur choisit le mot, les autres devinent | 2-6 |

### Caracteristiques

- Clavier AZERTY francais natif
- Ballons animes (Framer Motion)
- Support clavier physique (A-Z)
- Multijoueur P2P (WebRTC via PeerJS)
- QR Code pour rejoindre facilement
- Leaderboard local + cloud (Upstash Redis)
- PWA installable
- Memorisation du pseudo

## Architecture

Architecture **Feature-Based** avec **DDD** (Domain-Driven Design):

```
pendu/
├── .github/                 # CI/CD GitHub Actions
│   ├── workflows/ci.yml     # Pipeline 6 quality gates
│   └── dependabot.yml       # Auto-update dependencies
├── docs/                    # Documentation ISO
│   ├── STANDARDS_ISO_ARCHITECTURE.md
│   ├── ARCHITECTURE_FINALE_REALISABLE.md
│   └── INFRASTRUCTURE_DECISIONS.md
├── e2e/                     # Tests E2E Playwright
├── __tests__/               # Tests unitaires Vitest
│   ├── lib/                 # Tests domain layer
│   └── stores/              # Tests state management
├── src/
│   ├── app/                 # PRESENTATION - Routes Next.js App Router
│   │   ├── page.tsx         # Menu principal
│   │   ├── solo/            # Mode solo
│   │   ├── coop/            # Mode cooperatif
│   │   └── pvp/             # Mode joueur vs joueur
│   ├── components/          # PRESENTATION - Composants UI
│   │   ├── game/            # BalloonDisplay, Keyboard, Leaderboard...
│   │   ├── ui/              # Composants shadcn/ui
│   │   └── effects/         # Glassmorphism, animations
│   ├── features/            # APPLICATION - Feature modules
│   │   ├── solo/            # hooks + components solo
│   │   ├── coop/            # hooks + components coop
│   │   └── pvp/             # hooks + components pvp
│   ├── hooks/               # APPLICATION - Hooks partages
│   │   ├── useGameLogic.ts  # Bridge React <-> Game Engine
│   │   ├── usePeerConnection.ts  # WebRTC P2P
│   │   ├── usePlayerName.ts # Memorisation pseudo
│   │   └── useSound.ts      # Audio feedback
│   ├── lib/                 # DOMAIN + INFRASTRUCTURE
│   │   ├── game-engine.ts   # Logique metier pure (0 dependance)
│   │   ├── words.ts         # 200+ mots francais
│   │   ├── words-difficulty.ts  # Calcul difficulte mots
│   │   ├── difficulty-config.ts # Configuration niveaux
│   │   ├── message-validation.ts # Validation Zod P2P
│   │   ├── upstash-client.ts    # Cloud leaderboard
│   │   └── session-memory.ts    # Persistence locale
│   ├── stores/              # APPLICATION - State management
│   │   ├── leaderboard.ts   # Zustand + localStorage
│   │   └── difficulty.ts    # Preferences difficulte
│   └── types/               # DOMAIN - Types TypeScript
│       ├── game.ts          # GameState, GameMessage
│       ├── room.ts          # Room, Player, MAX_PLAYERS
│       └── difficulty.ts    # DifficultyLevel, config
├── vercel.json              # Config deploiement
├── vitest.config.ts         # Config tests
└── playwright.config.ts     # Config E2E
```

### Layers DDD

| Layer | Responsabilite | Fichiers |
|-------|----------------|----------|
| **Presentation** | UI, interactions | `app/`, `components/` |
| **Application** | Orchestration, use cases | `features/`, `hooks/`, `stores/` |
| **Domain** | Logique metier pure | `lib/game-engine.ts`, `types/` |
| **Infrastructure** | Services externes | `lib/upstash-client.ts`, `lib/message-validation.ts` |

## Stack Technique

| Categorie | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js LTS | 24 (Krypton) |
| Framework | Next.js + Turbopack | 16.1.1 |
| UI Library | React | 19.2.3 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.24.10 |
| Multiplayer | PeerJS (WebRTC P2P) | 1.5.5 |
| State | Zustand | 5.0.9 |
| Validation | Zod | 4.3.5 |
| Tests | Vitest + Playwright | 4.x + 1.57 |
| CI/CD | GitHub Actions | - |
| Deploy | Vercel | - |
| Database | Upstash Redis (optional) | - |

## Standards ISO

Ce projet respecte les standards internationaux:

| Standard | Domaine | Implementation |
|----------|---------|----------------|
| **ISO/IEC 25010** | Qualite logicielle | TypeScript strict, 0 any, 0 warnings |
| **ISO/IEC 25065** | UX/Utilisabilite | AZERTY, responsive, feedback audio |
| **ISO/IEC 29119** | Tests | 106 tests, coverage domain 100% |
| **ISO/IEC 5055** | Qualite code | ESLint strict, Prettier |
| **ISO/IEC 12207** | Cycle de vie | Conventional commits, hooks |
| **ISO/IEC 42010** | Architecture | DDD, Clean Architecture |

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

### Variables d'environnement (optionnel)

Pour activer le leaderboard cloud, creer `.env.local`:

```env
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=xxx
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur developpement (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint (0 warnings requis) |
| `npm run typecheck` | Verification TypeScript |
| `npm run test` | Tests Vitest (watch mode) |
| `npm run test:run` | Tests Vitest (CI) |
| `npm run test:coverage` | Rapport couverture |
| `npm run validate` | typecheck + lint + tests |
| `npm run format` | Prettier format all |
| `npm run format:check` | Prettier check (CI) |
| `npm run e2e` | Tests Playwright |

## Tests

```bash
# Tests unitaires (watch)
npm run test

# Tests avec couverture
npm run test:coverage

# Tests E2E
npm run e2e
```

**Couverture actuelle:**
- 106 tests unitaires
- 100% sur domain layer (`game-engine.ts`, `difficulty-config.ts`)
- E2E: navigation, mode solo

## CI/CD Pipeline

Le pipeline GitHub Actions comprend **6 quality gates**:

```
┌─────────────────────────────────────────────────────────────┐
│  1. LINT & FORMAT     │ ESLint + Prettier                   │
│  2. TYPECHECK         │ TypeScript strict                   │
│  3. UNIT TESTS        │ Vitest + coverage                   │
│  4. SECURITY AUDIT    │ npm audit                           │
│  5. BUILD             │ Next.js production                  │
│  6. E2E TESTS         │ Playwright (PR only)                │
└─────────────────────────────────────────────────────────────┘
```

### Hooks Git

- **pre-commit**: lint-staged (ESLint, Prettier)
- **pre-push**: typecheck, tests, build

## Deploiement

Le projet est deploye automatiquement sur **Vercel**:

1. Push sur `master` declenche le deploiement
2. Hooks pre-push verifient qualite
3. CI GitHub Actions valide
4. Vercel build et deploy

**URL Production:** https://pendu-nu.vercel.app

### Configuration Vercel

- Framework: Next.js 16
- Node.js: 24.x
- Region: cdg1 (Paris)
- Security headers actives

## Securite

- Protection mot de passe pour effacer le leaderboard
- Validation Zod sur tous les messages P2P
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- npm audit: 0 vulnerabilities
- Dependabot: mises a jour auto

## Contribution

1. Fork le projet
2. Cree une branche (`git checkout -b feat/ma-feature`)
3. Commit avec conventional commits:
   - `feat:` nouvelle fonctionnalite
   - `fix:` correction bug
   - `perf:` amelioration performance
   - `docs:` documentation
   - `refactor:` refactoring
   - `test:` ajout tests
4. Push et cree une Pull Request

### Checklist PR

- [ ] `npm run validate` passe
- [ ] Coverage maintenue (>= 80%)
- [ ] Types explicites (pas de `any`)
- [ ] Documentation mise a jour si necessaire

## Documentation

Voir le dossier `docs/` pour la documentation detaillee:

- [Standards ISO & Architecture](docs/STANDARDS_ISO_ARCHITECTURE.md)
- [Architecture Finale](docs/ARCHITECTURE_FINALE_REALISABLE.md)
- [Decisions Infrastructure](docs/INFRASTRUCTURE_DECISIONS.md)

## Licence

MIT

---

**Developpe avec Claude Code (Opus 4.5)**
