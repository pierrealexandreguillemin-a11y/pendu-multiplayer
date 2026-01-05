# Pendu Multijoueur PWA - Spécification Claude Code

> **Version**: 1.0 | **Date**: 2026-01-05
> **Contexte**: Jeu local (LAN/Hotspot) - Laptop serveur + Mobiles clients
> **Développeur**: Débutant-friendly, vibe coding
> **Inspiré de**: Standards ISO/IEC 25010, 29119, 5055 (version allégée)

---

## 🎯 Vision Projet

**Objectif**: Jeu du pendu multijoueur PWA pour jouer en famille (voiture, maison).

**Contraintes techniques**:
- Réseau local uniquement (pas de déploiement cloud)
- Auth simple sans persistence (pseudo temporaire)
- Pas de leaderboard ni historique
- PWA installable sur mobiles

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
| Frontend | Next.js 15 + React 19 | Confort dev, PWA native |
| Styling | Tailwind CSS | Rapid prototyping |
| Real-time | Socket.io | Multijoueur synchronisé |
| Backend | Node.js (intégré Next.js API routes + serveur custom) | Simplicité |
| State | Zustand | Léger, simple |
| Validation | Zod | Type-safe, runtime checks |
| Tests | Vitest + Testing Library | Rapide, moderne |

### Structure Projet

```
pendu-multiplayer/
├── .github/
│   └── copilot-instructions.md    # CE FICHIER (instructions IA)
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Layout global + providers
│   │   ├── page.tsx                # Accueil (choix mode + pseudo)
│   │   ├── solo/
│   │   │   └── page.tsx            # Mode PvE Solo
│   │   ├── coop/
│   │   │   ├── page.tsx            # Lobby création/join
│   │   │   └── [roomId]/
│   │   │       └── page.tsx        # Partie coop en cours
│   │   └── pvp/
│   │       ├── page.tsx            # Lobby création/join
│   │       └── [roomId]/
│   │           └── page.tsx        # Partie PvP en cours
│   │
│   ├── components/                  # UI réutilisables
│   │   ├── game/
│   │   │   ├── HangmanDrawing.tsx  # SVG du pendu (6 états)
│   │   │   ├── WordDisplay.tsx     # Affichage "_ A _ _ E"
│   │   │   ├── Keyboard.tsx        # Clavier virtuel A-Z
│   │   │   ├── GameStatus.tsx      # Victoire/Défaite/En cours
│   │   │   └── PlayerList.tsx      # Liste joueurs (multi)
│   │   ├── lobby/
│   │   │   ├── CreateRoom.tsx      # Formulaire création
│   │   │   ├── JoinRoom.tsx        # Formulaire rejoindre
│   │   │   └── WaitingRoom.tsx     # Attente joueurs
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   │
│   ├── hooks/                       # Logique métier (TESTABLE)
│   │   ├── useGameLogic.ts         # Logique pendu pure
│   │   ├── useSocket.ts            # Connexion Socket.io
│   │   ├── useRoom.ts              # Gestion room multi
│   │   └── usePlayer.ts            # État joueur local
│   │
│   ├── lib/                         # Utilitaires
│   │   ├── words.ts                # Liste mots français
│   │   ├── socket.ts               # Config client Socket.io
│   │   ├── game-engine.ts          # Logique pure (testable)
│   │   └── validators.ts           # Schemas Zod
│   │
│   ├── stores/                      # État global Zustand
│   │   ├── gameStore.ts            # État partie en cours
│   │   └── playerStore.ts          # Pseudo, préférences
│   │
│   └── types/                       # Types TypeScript
│       ├── game.ts                 # GameState, Letter, etc.
│       ├── player.ts               # Player, Room
│       └── socket-events.ts        # Events Socket.io typés
│
├── server/                          # Serveur Socket.io custom
│   ├── index.ts                    # Entry point serveur
│   ├── socket-handlers.ts          # Handlers événements
│   └── room-manager.ts             # Gestion rooms en mémoire
│
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service Worker
│   └── icons/                      # Icônes PWA
│
├── __tests__/                       # Tests (miroir src/)
│   ├── lib/
│   │   └── game-engine.test.ts
│   ├── hooks/
│   │   └── useGameLogic.test.ts
│   └── components/
│       └── Keyboard.test.tsx
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── next.config.js
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
│  MANUEL (5%)        Test sur vrais devices              │
│                     Laptop + Mobile en WiFi             │
├─────────────────────────────────────────────────────────┤
│  INTEGRATION (30%)  Hooks + Socket mocks                │
│                     Vitest + MSW                        │
├─────────────────────────────────────────────────────────┤
│  UNIT (65%)         game-engine.ts 100% couvert         │
│                     Pure functions, pas d'effets        │
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

### Coverage Cible

| Module | Coverage Min |
|--------|--------------|
| `lib/game-engine.ts` | 100% |
| `hooks/*` | 80% |
| `components/*` | 60% |
| `server/*` | 70% |

---

## 🔌 Socket.io Events

### Types (source unique de vérité)

```typescript
// src/types/socket-events.ts

// Client → Server
interface ClientToServerEvents {
  'room:create': (data: { playerName: string; mode: GameMode }) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'room:leave': () => void;
  'game:start': (data: { word?: string }) => void;  // word pour PvP
  'game:guess': (data: { letter: string }) => void;
  'game:restart': () => void;
}

// Server → Client
interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; roomId: string }) => void;
  'room:joined': (data: { room: RoomState }) => void;
  'room:player-joined': (data: { player: Player }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'game:started': (data: { gameState: GameState }) => void;
  'game:letter-result': (data: { letter: string; correct: boolean; gameState: GameState }) => void;
  'game:ended': (data: { victory: boolean; word: string }) => void;
}
```

---

## 📱 PWA Configuration

### manifest.json

```json
{
  "name": "Pendu Multijoueur",
  "short_name": "Pendu",
  "description": "Jeu du pendu en famille",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (basique)

```javascript
// public/sw.js
const CACHE_NAME = 'pendu-v1';
const STATIC_ASSETS = ['/', '/solo', '/coop', '/pvp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first pour les pages, cache-first pour les assets
});
```

---

## 🚀 Déploiement Local

### Setup Réseau

```
┌─────────────────────────────────────────────────────────┐
│                    LAPTOP (Serveur)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  npm run dev                                     │    │
│  │  → Next.js: http://localhost:3000               │    │
│  │  → Socket.io: ws://localhost:3001               │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│              WiFi / Hotspot Mobile                       │
│                         │                                │
└─────────────────────────┼───────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ Mobile 1│      │ Mobile 2│      │ Mobile 3│
   │  (PWA)  │      │  (PWA)  │      │  (PWA)  │
   └─────────┘      └─────────┘      └─────────┘
   
   URL: http://192.168.1.XX:3000 (IP locale laptop)
```

### Commandes

```bash
# Développement
npm run dev              # Next.js + Socket.io

# Trouver IP locale (pour mobiles)
# Windows: ipconfig | findstr IPv4
# Mac/Linux: ifconfig | grep inet

# Production locale
npm run build
npm run start
```

---

## 📋 Checklist Développement

### Avant Coder (Setup)

```
[ ] npm create next-app@latest pendu-multiplayer
[ ] Configurer TypeScript strict
[ ] Installer dépendances (socket.io, zustand, zod, tailwind)
[ ] Configurer ESLint + Prettier
[ ] Créer structure dossiers
[ ] Écrire types de base (game.ts, player.ts, socket-events.ts)
```

### Phase 1: Game Engine (TDD)

```
[ ] Écrire tests game-engine.test.ts
[ ] Implémenter game-engine.ts (faire passer tests)
[ ] 100% coverage sur game-engine.ts
```

### Phase 2: Mode Solo (sans Socket)

```
[ ] Composant HangmanDrawing (SVG)
[ ] Composant WordDisplay
[ ] Composant Keyboard
[ ] Hook useGameLogic
[ ] Page /solo fonctionnelle
[ ] Liste mots français (words.ts)
```

### Phase 3: Infrastructure Multi

```
[ ] Serveur Socket.io (server/index.ts)
[ ] Room manager (server/room-manager.ts)
[ ] Hook useSocket
[ ] Hook useRoom
[ ] Types events Socket.io
```

### Phase 4: Mode Coop

```
[ ] Lobby création/join room
[ ] Page /coop/[roomId]
[ ] Synchronisation état jeu
[ ] Gestion déconnexions
```

### Phase 5: Mode PvP

```
[ ] Interface maître du mot
[ ] Validation mot secret
[ ] Tour par tour devineurs
[ ] Page /pvp/[roomId]
```

### Phase 6: PWA + Polish

```
[ ] manifest.json
[ ] Service Worker
[ ] Test installation mobile
[ ] Responsive design
[ ] Animations (victoire/défaite)
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
fix(socket): handle disconnection gracefully
test(engine): add victory detection tests
refactor(hooks): extract game logic to useGameLogic
style(ui): improve keyboard layout mobile
docs(readme): add deployment instructions
```

---

## 📚 Ressources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev/)
- [PWA avec Next.js](https://github.com/vercel/next.js/tree/canary/examples/with-pwa)

---

**Dernière màj**: 2026-01-05
