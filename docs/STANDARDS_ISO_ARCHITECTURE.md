# Standards ISO & Architecture - Pendu Multijoueur

> **Version**: 1.1 | **Date**: 2026-01-07
> **Standards**: ISO/IEC 25010, 25065, 29119, 5055, 12207, 42010

---

## 1. CONCEPTION (ISO/IEC 42010 - Architecture Description)

### 1.1 Vues Architecturales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VUE CONTEXTE (C4 Level 0)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────┐         ┌─────────────────┐         ┌─────────┐             │
│    │ Joueur  │◄───────►│  Pendu PWA      │◄───────►│ Joueur  │             │
│    │ Mobile  │  HTTP/  │  (Next.js +     │  WS     │ Mobile  │             │
│    └─────────┘  WS     │   Socket.io)    │         └─────────┘             │
│                        └─────────────────┘                                  │
│                               ▲                                             │
│                               │ Local/Cloud                                 │
│                        ┌──────┴──────┐                                      │
│                        │   Serveur   │                                      │
│                        │  (Node.js)  │                                      │
│                        └─────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Vue Composants (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (PWA)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Pages    │  │ Components  │  │    Hooks    │  │   Stores    │        │
│  │  (Routes)   │  │    (UI)     │  │  (Logic)    │  │  (State)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                   │                                         │
│                          ┌────────▼────────┐                               │
│                          │   Socket.io     │                               │
│                          │    Client       │                               │
│                          └────────┬────────┘                               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ WebSocket
┌──────────────────────────────────┼──────────────────────────────────────────┐
│                              BACKEND                                        │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                          ┌───────▼───────┐                                  │
│                          │  Socket.io    │                                  │
│                          │   Server      │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│         ┌────────────────────────┼────────────────────────┐                │
│         │                        │                        │                │
│  ┌──────▼──────┐         ┌───────▼───────┐        ┌──────▼──────┐         │
│  │   Room      │         │    Game       │        │   Event     │         │
│  │  Manager    │         │   Engine      │        │  Handlers   │         │
│  └─────────────┘         └───────────────┘        └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ARCHITECTURE DDD & SRP (ISO/IEC 25010 - Maintainability)

### 2.1 Domain-Driven Design Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  Responsabilité: UI, interactions utilisateur                   │
│  Fichiers: src/app/**, src/components/**                        │
│  SRP: Chaque composant = 1 responsabilité visuelle              │
├─────────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                           │
│  Responsabilité: Orchestration, cas d'utilisation               │
│  Fichiers: src/hooks/**, src/stores/**                          │
│  SRP: Chaque hook = 1 cas d'utilisation                         │
├─────────────────────────────────────────────────────────────────┤
│                       DOMAIN LAYER                              │
│  Responsabilité: Logique métier pure, règles du jeu             │
│  Fichiers: src/lib/game-engine.ts, src/types/**                 │
│  SRP: Fonctions pures, ZERO effet de bord                       │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                          │
│  Responsabilité: Communication externe (Socket, Storage)        │
│  Fichiers: src/lib/socket.ts, server/**                         │
│  SRP: Chaque module = 1 protocole/service externe               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Bounded Contexts

```typescript
// CONTEXT: Game (Logique du pendu)
// ════════════════════════════════
namespace GameContext {
  // Entities
  interface GameState { /* ... */ }

  // Value Objects
  type Letter = Uppercase<string>;
  type Word = string;

  // Domain Services
  function checkLetter(state: GameState, letter: Letter): GameState;
  function isVictory(state: GameState): boolean;
  function isDefeat(state: GameState): boolean;
}

// CONTEXT: Room (Gestion multijoueur)
// ════════════════════════════════════
namespace RoomContext {
  // Entities
  interface Room { /* ... */ }
  interface Player { /* ... */ }

  // Domain Services
  function createRoom(host: Player, mode: GameMode): Room;
  function joinRoom(room: Room, player: Player): Room;
  function nextTurn(room: Room): Room;
}

// CONTEXT: Session (Authentification légère)
// ═══════════════════════════════════════════
namespace SessionContext {
  // Value Objects
  type PlayerName = string;
  type SessionId = string;

  // Domain Services
  function createSession(name: PlayerName): Session;
}
```

### 2.3 Single Responsibility Principle (SRP) - Mapping

| Fichier | Responsabilité UNIQUE | Violations à éviter |
|---------|----------------------|---------------------|
| `game-engine.ts` | Calculs état jeu | PAS de Socket, PAS de React |
| `useGameLogic.ts` | Bridge React ↔ Engine | PAS de fetch, PAS de UI |
| `useSocket.ts` | Connexion Socket.io | PAS de logique jeu |
| `useRoom.ts` | Gestion room multi | PAS de rendu |
| `Keyboard.tsx` | Affichage clavier | PAS de logique métier |
| `room-manager.ts` | CRUD rooms mémoire | PAS de validation jeu |

### 2.4 Dependency Rule (Clean Architecture)

```
RÈGLE: Les dépendances pointent VERS le centre (Domain)

  ┌─────────────────────────────────────────────────┐
  │              PRESENTATION                        │
  │   (Dépend de Application + Domain)              │
  │  ┌─────────────────────────────────────────┐   │
  │  │           APPLICATION                    │   │
  │  │   (Dépend de Domain uniquement)         │   │
  │  │  ┌─────────────────────────────────┐   │   │
  │  │  │          DOMAIN                  │   │   │
  │  │  │   (ZERO dépendance externe)     │   │   │
  │  │  │   Pure TypeScript only          │   │   │
  │  │  └─────────────────────────────────┘   │   │
  │  └─────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────┘

INTERDIT:
  ❌ game-engine.ts importe React
  ❌ game-engine.ts importe Socket.io
  ❌ types/*.ts importe des libs externes
```

---

## 3. QUALITÉ CODE (ISO/IEC 5055 - CISQ)

### 3.1 Métriques Automatisées

| Catégorie | Métrique | Seuil | Outil |
|-----------|----------|-------|-------|
| **Fiabilité** | Bugs critiques | 0 | ESLint, TypeScript |
| **Sécurité** | Vulnérabilités | 0 | npm audit |
| **Maintenabilité** | Dette technique | < 30min | SonarQube (optionnel) |
| **Performance** | Taille bundle | < 200KB (gzip) | next build |
| **Couverture** | Lignes testées | > 80% global | Vitest |

### 3.2 Règles ESLint Critiques

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/strict-type-checked',
  ],
  rules: {
    // FIABILITÉ
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // SÉCURITÉ
    'no-eval': 'error',
    'no-implied-eval': 'error',

    // MAINTENABILITÉ
    'complexity': ['error', { max: 8 }],
    'max-depth': ['error', { max: 3 }],
    'max-lines-per-function': ['error', { max: 50 }],
    'max-lines': ['error', { max: 200 }],
  }
};
```

### 3.3 Checklist Revue Code (PR)

```markdown
## Checklist Qualité PR

### Obligatoire
- [ ] `npm run typecheck` passe (0 erreur)
- [ ] `npm run lint` passe (0 warning)
- [ ] `npm run test` passe (100% tests)
- [ ] Coverage >= 80% sur fichiers modifiés

### Architecture
- [ ] Pas de logique métier dans composants React
- [ ] Nouvelles fonctions dans le bon layer DDD
- [ ] Types explicites (pas de `any`, pas d'inférence ambiguë)

### Nommage
- [ ] Fonctions: verbe + complément (`checkLetter`, `createRoom`)
- [ ] Booléens: `is/has/can` prefix (`isVictory`, `hasWon`)
- [ ] Handlers: `handle` + event (`handleLetterClick`)
```

---

## 4. DOCUMENTATION QUALITÉ (ISO/IEC 29119)

### 4.1 Plan de Tests

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATÉGIE DE TESTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NIVEAU 1: Tests Unitaires (65%)                               │
│  ─────────────────────────────                                 │
│  Cible: game-engine.ts, validators.ts                          │
│  Outil: Vitest                                                  │
│  Couverture: 100% sur Domain Layer                             │
│                                                                 │
│  NIVEAU 2: Tests Intégration (30%)                             │
│  ────────────────────────────────                              │
│  Cible: Hooks + Socket mocks                                   │
│  Outil: Vitest + Testing Library                               │
│  Couverture: 80% sur Application Layer                         │
│                                                                 │
│  NIVEAU 3: Tests E2E Manuels (5%)                              │
│  ────────────────────────────────                              │
│  Cible: Parcours utilisateur complets                          │
│  Méthode: Laptop + 2 mobiles sur même réseau                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Cas de Tests Critiques

```typescript
// Tests game-engine.ts - OBLIGATOIRES
describe('GameEngine', () => {
  // Initialisation
  it('should_create_game_with_hidden_word');
  it('should_normalize_accents_in_word');

  // Logique lettre
  it('should_reveal_letter_when_present');
  it('should_increment_errors_when_absent');
  it('should_reject_already_guessed_letter');
  it('should_handle_case_insensitive_guess');

  // Fin de partie
  it('should_detect_victory_when_word_complete');
  it('should_detect_defeat_at_6_errors');

  // Edge cases
  it('should_handle_word_with_repeated_letters');
  it('should_handle_single_letter_word');
});

// Tests Socket - OBLIGATOIRES
describe('SocketHandlers', () => {
  it('should_create_room_with_unique_code');
  it('should_join_existing_room');
  it('should_broadcast_letter_to_all_players');
  it('should_handle_player_disconnect_gracefully');
});
```

### 4.3 Rapport de Tests (Template)

```markdown
# Rapport de Tests - Sprint X

## Résumé
- Tests exécutés: XX
- Réussis: XX (XX%)
- Échoués: XX
- Skipped: XX

## Couverture
| Module | Lignes | Branches | Fonctions |
|--------|--------|----------|-----------|
| game-engine.ts | 100% | 100% | 100% |
| hooks/* | 85% | 80% | 90% |
| server/* | 75% | 70% | 80% |

## Tests Échoués
(Liste détaillée si applicable)

## Risques Identifiés
(Zones non couvertes, cas limites)
```

---

## 5. CYCLE DE VIE (ISO/IEC 12207)

### 5.1 Workflow Git

```
main ─────────────────────────────────────────────────►
       │              │              │
       │ feat/solo    │ feat/coop    │ feat/pvp
       ├──────────────┤──────────────┤
       │              │              │
       └──► PR ──────►└──► PR ──────►└──► PR
            │              │              │
            ▼              ▼              ▼
         Review         Review         Review
            │              │              │
            ▼              ▼              ▼
          Merge          Merge          Merge
```

### 5.2 Definition of Done (DoD)

```markdown
## Une feature est DONE quand:

### Code
- [ ] Code compilé sans erreur (`npm run build`)
- [ ] Lint passé (`npm run lint`)
- [ ] Tests passés (`npm run test`)
- [ ] Coverage maintenue (>= 80%)

### Revue
- [ ] PR créée avec description claire
- [ ] Au moins 1 auto-review effectuée
- [ ] Checklist qualité validée

### Documentation
- [ ] Types TSDoc sur fonctions publiques
- [ ] README mis à jour si nouvelle feature majeure
```

---

## 6. ANALYSE DÉPLOIEMENT

### 6.1 Comparatif Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPTIONS DE DÉPLOIEMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OPTION A: LOCAL UNIQUEMENT (Spec originale)                               │
│  ───────────────────────────────────────────                               │
│  ✅ Gratuit (0€)                                                           │
│  ✅ Pas de dépendance externe                                              │
│  ✅ Latence minimale                                                        │
│  ❌ Laptop doit être allumé                                                │
│  ❌ Même réseau WiFi obligatoire                                           │
│  ❌ Pas de jeu à distance                                                  │
│                                                                             │
│  OPTION B: SERVERLESS (Vercel/Netlify)                                     │
│  ─────────────────────────────────────                                     │
│  ⚠️  WebSocket NON SUPPORTÉ en serverless pur                              │
│  ⚠️  Vercel Edge Functions: timeout 30s, pas de WS persistant              │
│  ❌ NE CONVIENT PAS pour Socket.io                                         │
│                                                                             │
│  OPTION C: PAAS AVEC WEBSOCKET (Render, Railway, Fly.io)                   │
│  ────────────────────────────────────────────────────────                  │
│  ✅ WebSocket supporté                                                      │
│  ✅ Free tier disponible                                                    │
│  ⚠️  Render free: spin-down après 15min inactivité (délai 30-60s)         │
│  ⚠️  Railway: 500h/mois gratuites puis payant                              │
│  ⚠️  Fly.io: 3 VMs gratuites, bon pour WS                                  │
│  ✅ Jeu à distance possible                                                 │
│                                                                             │
│  OPTION D: WEBRTC PEER-TO-PEER                                             │
│  ─────────────────────────────────                                         │
│  ✅ Pas de serveur permanent nécessaire                                    │
│  ✅ Connexion directe entre téléphones                                     │
│  ⚠️  Nécessite serveur STUN/TURN (gratuits existent)                       │
│  ⚠️  Plus complexe à implémenter                                           │
│  ✅ Fonctionne même si laptop éteint (après connexion initiale)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Recommandation Finale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🏆 RECOMMANDATION: HYBRIDE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ARCHITECTURE RECOMMANDÉE:                                                  │
│                                                                             │
│  1. SIGNALING SERVER (Gratuit sur Render/Fly.io)                           │
│     └─ Petit serveur Node.js pour:                                         │
│        • Création de rooms (génération codes)                              │
│        • Échange initial WebRTC (signaling)                                │
│        • Peut dormir entre les parties                                     │
│                                                                             │
│  2. WEBRTC DATA CHANNELS (P2P direct)                                      │
│     └─ Communication directe téléphone ↔ téléphone                         │
│        • Latence minimale                                                  │
│        • Pas de serveur pendant la partie                                  │
│        • Fonctionne sur réseaux différents (STUN/TURN)                     │
│                                                                             │
│  3. FALLBACK SOCKET.IO (si WebRTC échoue)                                  │
│     └─ Pour réseaux restrictifs (NAT symétrique)                           │
│                                                                             │
│  FLUX:                                                                      │
│  ┌──────────┐      ┌──────────────┐      ┌──────────┐                      │
│  │ Phone A  │─────►│   Signaling  │◄─────│ Phone B  │                      │
│  └────┬─────┘      │   (Render)   │      └────┬─────┘                      │
│       │            └──────────────┘           │                            │
│       │                                       │                            │
│       └───────────── WebRTC P2P ─────────────┘                             │
│                   (Direct, sans serveur)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Stack Technique Mise à Jour

```typescript
// AVANT (Socket.io only)
// ════════════════════════
// - Dépendance serveur permanente
// - Pas de jeu à distance sans cloud

// APRÈS (WebRTC + Signaling)
// ══════════════════════════
import { PeerJS } from 'peerjs';  // Simplifie WebRTC

// Signaling server (Render free tier)
// - Express minimal
// - PeerJS Server ou custom signaling
// - Peut dormir, wake-up en 30s

// Client PWA
// - PeerJS client
// - Fallback Socket.io si P2P échoue
```

### 6.4 Comparatif Coûts

| Solution | Coût Mensuel | Latence | Jeu à Distance | Complexité |
|----------|--------------|---------|----------------|------------|
| Local only | 0€ | ~1ms | ❌ Non | ⭐ Simple |
| Render (Socket.io) | 0€* | ~50-200ms | ✅ Oui | ⭐⭐ Moyen |
| Fly.io (Socket.io) | 0€* | ~30-100ms | ✅ Oui | ⭐⭐ Moyen |
| WebRTC + Signaling | 0€* | ~10-50ms | ✅ Oui | ⭐⭐⭐ Complexe |

*Free tier avec limitations (spin-down, quotas)

---

## 7. OPTION IDÉALE: WEBRTC P2P

### 7.1 Pourquoi WebRTC est Idéal

```
AVANTAGES POUR VOTRE CAS D'USAGE:
═════════════════════════════════

1. MOBILITÉ
   • Deux téléphones peuvent jouer depuis n'importe où
   • WiFi différents, 4G, peu importe
   • Laptop peut être éteint après connexion initiale

2. LATENCE MINIMALE
   • Connexion directe peer-to-peer
   • Pas de round-trip serveur
   • Idéal pour jeu temps réel

3. COÛT ZERO
   • STUN servers Google gratuits
   • Signaling server minimal (Render free)
   • Pas de bande passante serveur pendant jeu

4. OFFLINE-CAPABLE
   • Une fois connectés, les peers communiquent directement
   • Serveur signaling peut dormir/être indispo
```

### 7.2 Architecture WebRTC Simplifiée

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE WEBRTC P2P                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: SIGNALING (via serveur temporaire)                               │
│  ───────────────────────────────────────────                               │
│                                                                             │
│  ┌──────────┐         ┌──────────────┐         ┌──────────┐               │
│  │ Phone A  │──(1)───►│   Render     │◄──(2)───│ Phone B  │               │
│  │ (Hôte)   │         │  Signaling   │         │ (Guest)  │               │
│  └────┬─────┘         └──────────────┘         └────┬─────┘               │
│       │                                             │                      │
│       │ (1) Créer room, obtenir code "ABCD"        │                      │
│       │ (2) Rejoindre avec code "ABCD"             │                      │
│       │ (3) Échange SDP offers/answers             │                      │
│       │ (4) Échange ICE candidates                 │                      │
│       │                                             │                      │
│  PHASE 2: CONNEXION P2P (serveur plus nécessaire)                         │
│  ────────────────────────────────────────────────                         │
│       │                                             │                      │
│       └─────────────── WebRTC ─────────────────────┘                      │
│                    DataChannel                                             │
│              (Messages jeu directs)                                        │
│                                                                             │
│  PHASE 3: JEU EN COURS                                                     │
│  ─────────────────────                                                     │
│                                                                             │
│  ┌──────────┐                                   ┌──────────┐               │
│  │ Phone A  │◄══════════ P2P Direct ══════════►│ Phone B  │               │
│  │          │    { type: 'guess', letter: 'A' } │          │               │
│  │          │    { type: 'state', ... }         │          │               │
│  └──────────┘                                   └──────────┘               │
│                                                                             │
│  ✅ Serveur peut être éteint                                               │
│  ✅ Latence minimale (~10-30ms)                                            │
│  ✅ Fonctionne sur réseaux différents                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Implémentation Simplifiée avec PeerJS

```typescript
// lib/peer.ts - Abstraction WebRTC avec PeerJS
import Peer, { DataConnection } from 'peerjs';

// Configuration PeerJS (utilise serveur PeerJS gratuit par défaut)
const PEER_CONFIG = {
  // Option 1: Serveur PeerJS public (gratuit, mais pas garanti)
  // host: '0.peerjs.com', port: 443, secure: true

  // Option 2: Votre serveur sur Render (recommandé)
  host: 'votre-app.onrender.com',
  port: 443,
  secure: true,
  path: '/peerjs'
};

// Créer une room (hôte)
export function createRoom(): Promise<string> {
  return new Promise((resolve, reject) => {
    const roomCode = generateRoomCode(); // "ABCD"
    const peer = new Peer(roomCode, PEER_CONFIG);

    peer.on('open', (id) => {
      resolve(id); // Retourne le code room
    });

    peer.on('error', reject);
  });
}

// Rejoindre une room
export function joinRoom(roomCode: string): Promise<DataConnection> {
  return new Promise((resolve, reject) => {
    const peer = new Peer(PEER_CONFIG); // ID auto-généré

    peer.on('open', () => {
      const conn = peer.connect(roomCode, { reliable: true });
      conn.on('open', () => resolve(conn));
      conn.on('error', reject);
    });
  });
}

// Envoyer message de jeu
export function sendGameMessage(conn: DataConnection, message: GameMessage) {
  conn.send(JSON.stringify(message));
}
```

### 7.4 Serveur Signaling Minimal (Render)

```typescript
// server/signaling.ts - Déployé sur Render (free tier)
import express from 'express';
import { ExpressPeerServer } from 'peer';

const app = express();
const server = app.listen(process.env.PORT || 9000);

// PeerJS signaling server
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  allow_discovery: true
});

app.use('/', peerServer);

// Health check pour Render
app.get('/health', (req, res) => res.send('OK'));

// Le serveur peut dormir - PeerJS gère le wake-up
```

---

## 8. BLUETOOTH/WIFI DIRECT - LIMITATIONS

### 8.1 Pourquoi Pas Bluetooth/WiFi Direct en PWA

```
LIMITATIONS NAVIGATEUR:
═══════════════════════

❌ Web Bluetooth API
   • Conçu pour périphériques BLE (capteurs, montres)
   • PAS pour communication inter-téléphones
   • Nécessite pairing manuel
   • Non supporté sur iOS Safari

❌ WiFi Direct
   • AUCUNE API Web pour WiFi Direct
   • Nécessite app native (Android/iOS)
   • Pas accessible depuis PWA

❌ Nearby Connections (Google)
   • API native Android uniquement
   • Pas de support web

CONCLUSION: WebRTC est la SEULE solution web pour P2P
```

### 8.2 Si App Native Souhaitée (Future)

```
OPTION FUTURE: React Native + WiFi Direct
═════════════════════════════════════════

Si vous voulez un jour une vraie app native pour
connexion directe sans internet:

• React Native (réutilise compétences React)
• react-native-wifi-p2p (Android)
• MultipeerConnectivity (iOS)

Mais pour une PWA, WebRTC reste la meilleure solution.
```

---

## 9. DÉCISION ARCHITECTURE FINALE

### 9.1 Recommandation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     💡 DÉCISION RECOMMANDÉE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APPROCHE: WebRTC P2P avec PeerJS                                          │
│                                                                             │
│  COMPOSANTS:                                                                │
│  ├── Frontend: Next.js PWA (inchangé)                                      │
│  ├── Signaling: PeerJS Server sur Render (free)                            │
│  ├── P2P: WebRTC DataChannels via PeerJS                                   │
│  └── Fallback: Socket.io sur même serveur Render (si P2P échoue)          │
│                                                                             │
│  AVANTAGES:                                                                 │
│  ✅ Jeu à distance (téléphones sur réseaux différents)                     │
│  ✅ Laptop peut être éteint                                                │
│  ✅ Coût: 0€ (Render free tier)                                            │
│  ✅ Latence minimale en P2P                                                │
│  ✅ PWA installable sur mobiles                                            │
│                                                                             │
│  TRADE-OFFS:                                                                │
│  ⚠️ Complexité légèrement supérieure                                       │
│  ⚠️ Wake-up Render: 30-60s après inactivité                                │
│  ⚠️ WebRTC peut échouer sur certains réseaux (fallback prévu)             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Plan Implémentation Révisé

```
PHASE 1: Game Engine + Solo (inchangé)
PHASE 2: UI Composants (inchangé)
PHASE 3: WebRTC Infrastructure ← NOUVEAU
  └── PeerJS client setup
  └── Signaling server (Render)
  └── DataChannel protocol
PHASE 4: Mode Coop via P2P
PHASE 5: Mode PvP via P2P
PHASE 6: Fallback Socket.io
PHASE 7: PWA + Deploy
```

---

## 10. UTILISABILITÉ (ISO/IEC 25065 - User Experience)

### 10.1 Critères ISO/IEC 25065

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CRITÈRES UTILISABILITÉ ISO/IEC 25065                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EFFICACITÉ (Effectiveness)                                              │
│  ─────────────────────────────                                              │
│  • L'utilisateur accomplit ses tâches avec succès                          │
│  • Parcours utilisateur court (max 3 clics)                                │
│  • Feedback visuel immédiat sur chaque action                              │
│                                                                             │
│  2. EFFICIENCE (Efficiency)                                                 │
│  ──────────────────────────                                                 │
│  • Ressources minimisées (clics, temps, charge cognitive)                  │
│  • Support clavier physique (A-Z direct)                                   │
│  • Layout AZERTY français natif                                            │
│  • Pas de re-saisie inutile (pseudo mémorisé)                             │
│                                                                             │
│  3. SATISFACTION                                                            │
│  ───────────────                                                            │
│  • Design moderne (glassmorphism, animations)                              │
│  • Feedback audio optionnel                                                │
│  • Animations fluides (Framer Motion)                                      │
│  • Couleurs thématiques par mode (bleu/vert/rose)                         │
│                                                                             │
│  4. ABSENCE DE RISQUE (Freedom from Risk)                                   │
│  ─────────────────────────────────────────                                  │
│  • Confirmation avant actions destructives                                  │
│  • Validation formulaires en temps réel                                    │
│  • États disabled pour actions impossibles                                 │
│  • Messages d'erreur actionnables                                          │
│                                                                             │
│  5. COUVERTURE DU CONTEXTE (Context Coverage)                               │
│  ────────────────────────────────────────────                               │
│  • Responsive design (mobile-first)                                        │
│  • Touch targets minimum 44px (WCAG 2.1)                                   │
│  • PWA installable                                                         │
│  • Accessibilité WCAG 2.1 AA                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Checklist UX Composants

| Composant | Critères ISO/IEC 25065 | Implémentation |
|-----------|------------------------|----------------|
| **Keyboard.tsx** | Efficience, Couverture | AZERTY layout, responsive, clavier physique |
| **BalloonDisplay.tsx** | Satisfaction | Animations pop, couleurs vives |
| **GameStatus.tsx** | Efficacité | Feedback immédiat victoire/défaite |
| **Leaderboard.tsx** | Absence de risque | Confirmation effacer, modal React |
| **CoopWaiting.tsx** | Absence de risque | Dialog confirmation quitter |
| **PvPWaiting.tsx** | Absence de risque | Dialog confirmation quitter |
| **DifficultySelector.tsx** | Efficience | Sélection 1 clic, feedback erreurs |

### 10.3 Accessibilité WCAG 2.1 AA

```typescript
// Standards WCAG 2.1 AA implémentés
// ════════════════════════════════════

// 1. Contraste textes (1.4.3)
// Ratio minimum 4.5:1 pour texte normal
// ❌ text-gray-500 (2.8:1) → ✅ text-gray-400 (4.5:1+)

// 2. Touch targets (2.5.5)
// Minimum 44x44px pour éléments interactifs
// Keyboard: min-w-[30px] h-10 flex-1 (adaptatif)

// 3. Focus visible (2.4.7)
// focus:ring-2 focus:ring-offset-2 sur tous boutons

// 4. Labels (1.1.1)
// aria-label sur tous éléments interactifs
// aria-pressed pour états boutons

// 5. Langue (3.1.1)
// <html lang="fr"> dans layout.tsx
```

### 10.4 Responsive Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BREAKPOINTS RESPONSIVE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MOBILE (< 640px - default)                                                │
│  ─────────────────────────                                                  │
│  • Clavier: flex-1, min-w-[30px], gap-0.5                                  │
│  • Textes: text-xs, text-sm                                                │
│  • Cards: p-4, max-w-full                                                  │
│  • Layout: flex-col                                                        │
│                                                                             │
│  TABLET/DESKTOP (sm: >= 640px)                                             │
│  ─────────────────────────────                                             │
│  • Clavier: max-w-[48px], gap-1                                           │
│  • Textes: text-base, text-lg                                             │
│  • Cards: p-8, max-w-md                                                    │
│  • Layout: flex-row possible                                               │
│                                                                             │
│  Tailwind classes pattern:                                                  │
│  mobile-class sm:tablet-class                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Feedback Utilisateur

```typescript
// Types de feedback ISO/IEC 25065
// ════════════════════════════════

// 1. VISUEL (immédiat)
// ────────────────────
// • Lettre correcte: bg-green-500 + révélation mot
// • Lettre incorrecte: bg-red-500 + ballon pop
// • Loading: spinner animé
// • Hover: scale, couleur change

// 2. AUDIO (optionnel)
// ────────────────────
// • correct: magic-ding.ogg
// • incorrect: soft-oops.ogg
// • victory: level-up.ogg
// • defeat: soft-oops.ogg
// Respecte prefers-reduced-motion

// 3. ÉTATS SYSTÈME
// ────────────────
// • Connexion P2P: status indicator (vert/rouge)
// • Tour joueur: "C'est ton tour" highlight
// • Chargement: spinner + texte contextuel
```

### 10.6 Confirmations Actions Destructives

```typescript
// Pattern Dialog confirmation (ISO/IEC 25065 - Absence de risque)
// ════════════════════════════════════════════════════════════════

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Actions nécessitant confirmation:
// ─────────────────────────────────
// 1. Quitter partie multijoueur (déconnecte autres joueurs)
// 2. Effacer classement (perte données)
// 3. Abandonner partie en cours (perte score)

// Exemple implémentation:
<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Quitter la partie ?</DialogTitle>
      <DialogDescription>
        Les autres joueurs seront déconnectés.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={cancel}>Annuler</Button>
      <Button variant="destructive" onClick={confirm}>Quitter</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 10.7 Métriques UX (Lighthouse)

| Métrique | Seuil Acceptable | Seuil Excellent | Production |
|----------|------------------|-----------------|------------|
| **LCP** | < 2500ms | < 1200ms | 121ms ✅ |
| **CLS** | < 0.25 | < 0.1 | 0.00 ✅ |
| **INP** | < 500ms | < 200ms | ~46ms ✅ |
| **TTFB** | < 800ms | < 200ms | 15ms ✅ |

### 10.8 Layout Clavier AZERTY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLAVIER AZERTY FRANÇAIS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Rangée 1:  [ A ] [ Z ] [ E ] [ R ] [ T ] [ Y ] [ U ] [ I ] [ O ] [ P ]    │
│                                                                             │
│  Rangée 2:  [ Q ] [ S ] [ D ] [ F ] [ G ] [ H ] [ J ] [ K ] [ L ] [ M ]    │
│                                                                             │
│  Rangée 3:        [ W ] [ X ] [ C ] [ V ] [ B ] [ N ]                       │
│                                                                             │
│  Responsive:                                                                │
│  • Mobile: flex-1 min-w-[30px] (s'adapte à l'écran)                        │
│  • Desktop: max-w-[48px] (taille fixe confortable)                         │
│                                                                             │
│  Support clavier physique:                                                  │
│  • Touche A-Z → guess letter directement                                   │
│  • Lettres déjà jouées ignorées                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document généré selon**: ISO/IEC 42010:2022, ISO/IEC 25010:2023, ISO/IEC 25065:2023, ISO/IEC 5055:2021
