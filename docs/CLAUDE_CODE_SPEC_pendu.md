# Pendu Multijoueur PWA - Specification Claude Code

> **Version**: 1.1 | **Date**: 2026-02-21 (mise a jour post-implementation)
> **Contexte**: Jeu P2P WebRTC - PWA sur Vercel + PeerJS Cloud signaling
> **Developpeur**: Debutant-friendly, vibe coding
> **Inspire de**: Standards ISO/IEC 25010, 29119, 5055 (version allegee)
>
> **Note**: Ce document etait la spec initiale. L'architecture a evolue:
> Socket.io → WebRTC P2P (PeerJS), serveur custom → PeerJS Cloud,
> local-only → Vercel production (https://pendu-nu.vercel.app).

---

## 🎯 Vision Projet

**Objectif**: Jeu du pendu multijoueur PWA pour jouer en famille (voiture, maison).

**Contraintes techniques initiales** (evoluees depuis):
- ~~Reseau local uniquement~~ → Deploye sur Vercel + P2P WebRTC
- Auth simple sans persistence (pseudo memorise localStorage)
- ~~Pas de leaderboard~~ → Leaderboard local + cloud (Upstash Redis)
- PWA installable sur mobiles ✅

---

## 🎮 Modes de Jeu

| Mode | Qui choisit le mot ? | Qui devine ? | Joueurs |
|------|---------------------|--------------|---------|
| **PvE Solo** | App (aléatoire) | 1 joueur seul | 1 |
| **PvE Coop** | App (aléatoire) | Équipe ensemble | 2-6 |
| **PvP** | 1 joueur (maître) | Les autres | 2-6 |

### Règles Communes

```
- Alphabet: A-Z (26 lettres, pas d'accents dans les propositions)
- Mots: Français avec accents possibles (café → C A F E)
- Erreurs max: 6 (tête, corps, 2 bras, 2 jambes)
- Victoire: Mot complet découvert
- Défaite: 6 erreurs atteintes
```

### Mode PvE Solo

```
1. Joueur entre son pseudo
2. App sélectionne mot aléatoire + catégorie (optionnel)
3. Joueur propose lettres une par une
4. Fin: victoire/défaite → rejouer ou menu
```

### Mode PvE Coop

```
1. Hôte crée une partie (pseudo + code room)
2. Autres joueurs rejoignent avec le code
3. App sélectionne mot aléatoire
4. Joueurs proposent lettres à tour de rôle (ou libre)
5. Erreurs PARTAGÉES (équipe perd ensemble)
6. Fin: victoire/défaite collective → rejouer
```

### Mode PvP

```
1. Hôte crée partie (devient "maître du mot")
2. Autres joueurs rejoignent
3. Maître saisit un mot secret (validé: longueur, caractères)
4. Maître voit les propositions mais ne joue pas
5. Devineurs proposent lettres à tour de rôle
6. Fin: victoire devineurs / victoire maître
```

---

## 🏗️ Architecture Technique

### Stack

| Couche | Techno | Raison |
|--------|--------|--------|
| Frontend | Next.js 16.1.6 + React 19.2.3 | Confort dev, PWA native |
| Styling | Tailwind CSS 4.x | Rapid prototyping |
| Real-time | PeerJS (WebRTC P2P) | Multijoueur sans serveur |
| Animations | Framer Motion 12.x | Ballons, transitions |
| State | Zustand 5.x | Leger, simple |
| Validation | Zod 4.x | Type-safe, runtime checks |
| Tests | Vitest 4.x + Playwright 1.57 | Unitaires + E2E |

### Structure Projet

```
pendu/
├── .github/
│   ├── workflows/ci.yml            # CI/CD 6 quality gates
│   └── dependabot.yml              # Auto-update dependencies
│
├── docs/                            # Documentation ISO
│   ├── STANDARDS_ISO_ARCHITECTURE.md
│   ├── ARCHITECTURE_FINALE_REALISABLE.md
│   ├── INFRASTRUCTURE_DECISIONS.md
│   └── CLAUDE_CODE_SPEC_pendu.md   # CE FICHIER
│
├── src/
│   ├── app/                         # PRESENTATION - Next.js App Router
│   │   ├── layout.tsx               # Layout global + PWA metadata
│   │   ├── page.tsx                 # Menu principal
│   │   ├── solo/page.tsx            # Mode solo
│   │   ├── coop/page.tsx            # Mode cooperatif
│   │   └── pvp/page.tsx             # Mode PvP
│   │
│   ├── components/                   # PRESENTATION - Composants UI
│   │   ├── game/                    # BalloonDisplay, Keyboard, Leaderboard
│   │   ├── ui/                      # shadcn/ui (Button, Dialog, Input)
│   │   └── effects/                 # Glassmorphism, animations, console banner
│   │
│   ├── features/                     # APPLICATION - Feature modules
│   │   ├── solo/                    # hooks + components solo
│   │   ├── coop/                    # hooks (useCoopSession) + components
│   │   └── pvp/                     # hooks (usePvPSession) + components
│   │
│   ├── hooks/                        # APPLICATION - Hooks partages
│   │   ├── useGameLogic.ts          # Bridge React <-> Game Engine
│   │   ├── usePeerConnection.ts     # WebRTC P2P via PeerJS
│   │   ├── usePlayerName.ts         # Memorisation pseudo
│   │   └── useSound.ts             # Audio feedback
│   │
│   ├── lib/                          # DOMAIN + INFRASTRUCTURE
│   │   ├── game-engine.ts           # Logique metier pure (0 dependance)
│   │   ├── words.ts                 # 200+ mots francais
│   │   ├── words-difficulty.ts      # Calcul difficulte mots
│   │   ├── difficulty-config.ts     # Configuration niveaux
│   │   ├── message-validation.ts    # Validation Zod P2P
│   │   ├── upstash-client.ts        # Cloud leaderboard
│   │   └── session-memory.ts        # Persistence locale
│   │
│   ├── stores/                       # APPLICATION - State Zustand
│   │   ├── leaderboard.ts           # Leaderboard + localStorage
│   │   └── difficulty.ts            # Preferences difficulte
│   │
│   └── types/                        # DOMAIN - Types TypeScript
│       ├── game.ts                  # GameState, GameMessage, Letter
│       ├── room.ts                  # Room, Player, MAX_PLAYERS
│       └── difficulty.ts            # DifficultyLevel, config
│
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── icons/                       # PWA icons (192, 512, apple-touch)
│   └── sounds/                      # Audio feedback (.ogg)
│
├── __tests__/                        # Tests unitaires Vitest
│   ├── lib/                         # game-engine, difficulty, words
│   └── stores/                      # leaderboard, difficulty stores
│
├── e2e/                              # Tests E2E Playwright
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs                # ESLint 9 flat config
└── package.json
```

---

## 📐 Standards Code (Adaptés ISO 5055)

### ZERO TOLERANCE (Bloquant)

```
[x] 0 ERREUR TypeScript        - tsc --noEmit
[x] 0 WARNING ESLint           - eslint --max-warnings 0  
[x] 0 ANY TypeScript           - Types explicites partout
[x] 0 CATCH VIDE               - Toujours logger/gérer erreurs
[x] 0 CONSOLE.LOG oublié       - Nettoyer avant commit
```

### Seuils Maintenabilité

| Métrique | Seuil | Pourquoi |
|----------|-------|----------|
| Lignes/fichier | ≤ 200 | Lisibilité |
| Lignes/fonction | ≤ 50 | Testabilité |
| Complexité cyclomatique | ≤ 8 | Compréhension |
| Profondeur nesting | ≤ 3 | Clarté |

### TypeScript Config Stricte

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

## 🧪 Stratégie Tests (Adaptée ISO 29119)

### Pyramide Simplifiée

```
┌─────────────────────────────────────────────────────────┐
│  E2E (5%)           Playwright (navigation, solo)       │
│                     npm run test:e2e                     │
├─────────────────────────────────────────────────────────┤
│  INTEGRATION (30%)  Hooks + stores                      │
│                     Vitest + Testing Library             │
├─────────────────────────────────────────────────────────┤
│  UNIT (65%)         game-engine ~91%, difficulty 100%   │
│                     106 tests, pure functions            │
└─────────────────────────────────────────────────────────┘
```

### TDD Obligatoire sur game-engine.ts

```typescript
// __tests__/lib/game-engine.test.ts

describe('GameEngine', () => {
  describe('checkLetter', () => {
    it('should_reveal_letter_when_present_in_word', () => {
      const state = createGame('PENDU');
      const result = checkLetter(state, 'E');
      
      expect(result.revealed).toEqual(['_', 'E', '_', '_', '_']);
      expect(result.errors).toBe(0);
    });

    it('should_increment_errors_when_letter_not_in_word', () => {
      const state = createGame('PENDU');
      const result = checkLetter(state, 'Z');
      
      expect(result.errors).toBe(1);
      expect(result.wrongLetters).toContain('Z');
    });

    it('should_detect_victory_when_word_complete', () => {
      // ...
    });

    it('should_detect_defeat_when_max_errors_reached', () => {
      // ...
    });
  });
});
```

### Nommage Tests

```
should_[action]_when_[condition]

Exemples:
- should_reveal_letter_when_present_in_word
- should_create_room_when_valid_code_provided
- should_reject_letter_when_already_guessed
```

### Coverage Actuelle

| Module | Coverage |
|--------|----------|
| `lib/game-engine.ts` | ~91% |
| `lib/difficulty-config.ts` | 100% |
| `lib/words-difficulty.ts` | 100% |
| `stores/*` | ~80% |
| Global | > 80% |

---

## 🔌 Messages P2P (WebRTC via PeerJS)

### Types (source unique de verite)

```typescript
// src/types/game.ts - GameMessage union type
// Valides par Zod dans src/lib/message-validation.ts

type GameMessage =
  | { type: 'start'; payload: { word: string; category: string } }
  | { type: 'guess'; payload: { letter: Letter } }
  | { type: 'restart'; payload: Record<string, never> }
  | { type: 'state'; payload: Record<string, never> }
  | { type: 'player_join'; payload: { playerId: string; playerName: string } }
  | { type: 'players_update'; payload: { players: PlayerInfo[]; currentTurnIndex: number } }
  | { type: 'turn_change'; payload: { currentTurnIndex: number; currentPlayerId: string } };

// Topologie: etoile (host relaye aux guests)
// Host recoit de tous les guests via DataConnection
// Host broadcast a tous les guests
```

---

## 📱 PWA Configuration

### manifest.json (deploye)

```json
{
  "id": "/",
  "name": "Pendu - Jeu du Pendu Multijoueur",
  "short_name": "Pendu",
  "description": "Jeu du pendu en ligne multijoueur. Jouez seul, en coop ou en PvP avec vos amis !",
  "lang": "fr",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#111827",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ],
  "categories": ["games", "entertainment"]
}
```

### Service Worker

Pas de service worker custom. Next.js + Vercel gerent le caching CDN.
Le manifest seul suffit pour rendre l'app installable.

---

## 🚀 Deploiement

### Architecture Production

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (CDN Paris cdg1)                                │
│  https://pendu-nu.vercel.app                            │
│  Next.js 16.1.6 PWA                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│Phone A│   │Phone B│   │Phone C│
│ (PWA) │   │ (PWA) │   │ (PWA) │
└───┬───┘   └───┬───┘   └───┬───┘
    │           │           │
    └───── WebRTC P2P ─────┘
         (via PeerJS Cloud)
```

### Commandes

```bash
# Developpement
npm run dev              # Next.js + Turbopack

# Validation complete
npm run validate         # typecheck + lint + tests

# Build production
npm run build
```

---

## 📋 Checklist Développement

### Phases d'Implementation (toutes completees)

```
[x] Phase 1: Game Engine (TDD) - game-engine.ts, 106 tests
[x] Phase 2: UI Composants - BalloonDisplay, Keyboard AZERTY, Glassmorphism
[x] Phase 3: Mode Solo - /solo, difficulte, leaderboard
[x] Phase 4: WebRTC P2P - PeerJS, usePeerConnection.ts
[x] Phase 5: Mode Coop - /coop, 2-6 joueurs, tours
[x] Phase 6: Mode PvP - /pvp, host choisit mot, guests devinent
[x] Phase 7: PWA + Deploy - manifest.json, icons, Vercel production
```

---

## 🎨 Style Guide (Miami Vibes - Optionnel)

```css
/* Palette suggérée */
--bg-dark: #0a0a0a;
--primary: #3b82f6;      /* Bleu électrique */
--accent: #f472b6;       /* Rose néon */
--success: #22c55e;      /* Vert victoire */
--error: #ef4444;        /* Rouge erreur */

/* Glassmorphism (optionnel) */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

## ⚠️ Règles Claude Code

### DO ✅

```
- Écrire tests AVANT code (TDD sur game-engine)
- Types explicites partout
- Fonctions pures quand possible
- Commits atomiques (1 feature = 1 commit)
- Nommer clairement (pas de x, temp, data)
```

### DON'T ❌

```
- Pas de `any` TypeScript
- Pas de `// @ts-ignore`
- Pas de console.log en production
- Pas de logique métier dans les composants
- Pas de mutations d'état direct
```

### Conventional Commits

```bash
feat(game): add letter checking logic
fix(multiplayer): handle disconnection gracefully
test(engine): add victory detection tests
refactor(hooks): extract game logic to useGameLogic
style(ui): improve keyboard layout mobile
docs(readme): add deployment instructions
```

---

## 📚 Ressources

- [Next.js App Router](https://nextjs.org/docs/app)
- [PeerJS Docs](https://peerjs.com/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Derniere maj**: 2026-02-21
**Developpe avec Claude Code (Opus 4.6)**
