# Architecture Finale Pendu Multijoueur - 100% Gratuit sans CB

> **Date**: 2026-01-05
> **Recherche**: Documentation officielle PeerJS, Render, Deno Deploy, Cloudflare
> **Comptes existants**: Render (chess-app), Vercel (teamsync), MongoDB Atlas

---

## 1. SYNTHESE RECHERCHE - OPTIONS GRATUITES SANS CB

### Comparatif Final

| Plateforme | WebSocket | CB Requise | Free Forever | Spin-down | Verdict |
|------------|-----------|------------|--------------|-----------|---------|
| **Deno Deploy** | ✅ Oui | ❌ Non | ✅ Oui | ❌ Non | **IDEAL** |
| **Cloudflare Workers** | ✅ Oui | ❌ Non | ✅ Oui | ❌ Non | **IDEAL** |
| **PeerJS Cloud** | ✅ Oui | ❌ Non | ✅ Oui | ❌ Non | **IDEAL** |
| **Render** | ✅ Oui | ❌ Non | ✅ 750h/mois | ⚠️ 15min | BON |
| **Vercel** | ❌ Non | ❌ Non | ✅ Oui | ❌ Non | Frontend only |
| Fly.io | ✅ Oui | ✅ Oui | ⚠️ $5 credit | ❌ Non | EXCLU |
| Railway | ✅ Oui | ✅ Oui | ❌ Trial 30j | ❌ Non | EXCLU |

### Sources Officielles

- [Deno Deploy Pricing](https://deno.com/deploy/pricing) - "No credit card required"
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/) - "Start building for free — no credit card required"
- [PeerJS Docs](https://peerjs.com/docs/) - Free cloud server at 0.peerjs.com
- [Render Free Tier](https://render.com/docs/free) - 750h/month, no CC

---

## 2. ARCHITECTURE RECOMMANDEE: WEBRTC + DENO DEPLOY

### Pourquoi Cette Architecture?

```
✅ 0€ total
✅ Aucune carte bancaire
✅ Jeu à distance (téléphones sur réseaux différents)
✅ Laptop peut être éteint pendant la partie
✅ Latence minimale (~10-30ms P2P direct)
✅ Pas de spin-down (Deno Deploy reste actif)
```

### Schéma Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE PRODUCTION (0€)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ÉTAPE 1: Connexion initiale (via serveur signaling)                       │
│  ═══════════════════════════════════════════════════                       │
│                                                                             │
│  ┌──────────┐                                      ┌──────────┐            │
│  │ Phone A  │         ┌──────────────────┐         │ Phone B  │            │
│  │  (PWA)   │────────►│   Deno Deploy    │◄────────│  (PWA)   │            │
│  │          │         │  (Signaling)     │         │          │            │
│  └────┬─────┘         │  FREE, NO CC     │         └────┬─────┘            │
│       │               │  ✅ WebSocket    │              │                  │
│       │               │  ✅ Always-on    │              │                  │
│       │               └──────────────────┘              │                  │
│       │                                                 │                  │
│       │ (1) Create room "ABCD"                         │                  │
│       │ (2) Join room "ABCD"                           │                  │
│       │ (3) Exchange WebRTC offers/answers             │                  │
│       │                                                 │                  │
│  ÉTAPE 2: Jeu en cours (P2P direct, serveur non utilisé)                   │
│  ═══════════════════════════════════════════════════════                   │
│       │                                                 │                  │
│       └────────────── WebRTC P2P ──────────────────────┘                  │
│                    DataChannel Direct                                       │
│              { type: 'guess', letter: 'A' }                                │
│                                                                             │
│  ✅ Serveur peut tomber → jeu continue                                     │
│  ✅ Latence ~10-30ms                                                       │
│  ✅ Aucun coût data serveur                                                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  FRONTEND (PWA)                                                             │
│  ───────────────                                                            │
│  Hébergement: Vercel (compte existant: teamsync-iota.vercel.app)           │
│  Framework: Next.js 15                                                      │
│  ✅ Gratuit, pas de CB                                                      │
│  ✅ Build automatique depuis GitHub                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. STACK TECHNIQUE FINALE

### Frontend (Vercel - Compte Existant)

```yaml
Plateforme: Vercel
Compte: teamsync-iota.vercel.app (existant)
Framework: Next.js 15 + React 19
Deploy: Auto depuis GitHub (repo public possible)
Coût: 0€
```

### Signaling Server (Deno Deploy - NOUVEAU)

```yaml
Plateforme: Deno Deploy
Coût: 0€ (free tier)
CB requise: Non
Limites free tier:
  - 1M requests/mois
  - 100GB bandwidth/mois
  - WebSocket: ✅ Supporté
  - Always-on: ✅ Pas de spin-down
```

### Communication P2P (WebRTC)

```yaml
Librairie: PeerJS (simplifie WebRTC)
STUN: Google (gratuit): stun:stun.l.google.com:19302
TURN: PeerJS Cloud (gratuit) ou Metered.ca (10GB free)
```

---

## 4. IMPLEMENTATION SIGNALING SERVER (DENO DEPLOY)

### Code Serveur Signaling

```typescript
// server/signaling.ts - À déployer sur Deno Deploy

interface Room {
  hostId: string;
  hostSocket: WebSocket;
  guests: Map<string, WebSocket>;
  gameMode: 'solo' | 'coop' | 'pvp';
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve((req) => {
  // Health check
  if (req.url.endsWith('/health')) {
    return new Response('OK', { status: 200 });
  }

  // WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log('Client connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'create-room': {
          const roomCode = generateRoomCode();
          rooms.set(roomCode, {
            hostId: data.playerId,
            hostSocket: socket,
            guests: new Map(),
            gameMode: data.mode,
          });
          socket.send(JSON.stringify({ type: 'room-created', roomCode }));
          break;
        }

        case 'join-room': {
          const room = rooms.get(data.roomCode);
          if (room) {
            room.guests.set(data.playerId, socket);
            // Notify host
            room.hostSocket.send(JSON.stringify({
              type: 'player-joined',
              playerId: data.playerId,
              playerName: data.playerName,
            }));
            // Send room info to joiner
            socket.send(JSON.stringify({
              type: 'room-joined',
              roomCode: data.roomCode,
              hostId: room.hostId,
            }));
          } else {
            socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          }
          break;
        }

        case 'signal': {
          // Forward WebRTC signaling data
          const room = rooms.get(data.roomCode);
          if (room) {
            const targetSocket = data.targetId === room.hostId
              ? room.hostSocket
              : room.guests.get(data.targetId);
            if (targetSocket) {
              targetSocket.send(JSON.stringify({
                type: 'signal',
                fromId: data.fromId,
                signal: data.signal,
              }));
            }
          }
          break;
        }
      }
    };

    socket.onclose = () => {
      // Cleanup rooms
      for (const [code, room] of rooms) {
        if (room.hostSocket === socket) {
          // Notify guests and close room
          for (const guest of room.guests.values()) {
            guest.send(JSON.stringify({ type: 'room-closed' }));
          }
          rooms.delete(code);
        } else {
          room.guests.forEach((guestSocket, guestId) => {
            if (guestSocket === socket) {
              room.guests.delete(guestId);
              room.hostSocket.send(JSON.stringify({
                type: 'player-left',
                playerId: guestId,
              }));
            }
          });
        }
      }
    };

    return response;
  }

  return new Response('Pendu Signaling Server', { status: 200 });
});
```

### Déploiement sur Deno Deploy

```bash
# 1. Installer Deno (si pas déjà fait)
# Windows: irm https://deno.land/install.ps1 | iex

# 2. Login Deno Deploy (crée compte gratuit automatiquement)
deno install -Arf jsr:@deno/deployctl
deployctl login

# 3. Déployer
deployctl deploy --project=pendu-signaling server/signaling.ts

# URL obtenue: https://pendu-signaling.deno.dev
```

---

## 5. CLIENT PEERJS (FRONTEND)

### Installation

```bash
npm install peerjs
```

### Hook useWebRTC

```typescript
// src/hooks/useWebRTC.ts
import Peer, { DataConnection } from 'peerjs';
import { useCallback, useRef, useState } from 'react';

const SIGNALING_URL = 'wss://pendu-signaling.deno.dev'; // Votre Deno Deploy

interface UseWebRTCOptions {
  onMessage: (message: GameMessage) => void;
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const signalingRef = useRef<WebSocket | null>(null);

  const createRoom = useCallback(async (playerName: string, mode: GameMode) => {
    return new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(SIGNALING_URL);
      signalingRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'create-room',
          playerId: crypto.randomUUID(),
          playerName,
          mode,
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room-created') {
          setRoomCode(data.roomCode);
          setIsHost(true);
          initializePeer(data.roomCode, true);
          resolve(data.roomCode);
        }
      };

      ws.onerror = reject;
    });
  }, []);

  const joinRoom = useCallback(async (code: string, playerName: string) => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(SIGNALING_URL);
      signalingRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'join-room',
          roomCode: code,
          playerId: crypto.randomUUID(),
          playerName,
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room-joined') {
          setRoomCode(code);
          setIsHost(false);
          initializePeer(code, false, data.hostId);
          resolve();
        } else if (data.type === 'error') {
          reject(new Error(data.message));
        }
      };

      ws.onerror = reject;
    });
  }, []);

  const initializePeer = (roomCode: string, isHost: boolean, hostId?: string) => {
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Peer ID:', id);
      if (!isHost && hostId) {
        // Guest connects to host
        const conn = peer.connect(hostId, { reliable: true });
        setupConnection(conn);
      }
    });

    peer.on('connection', (conn) => {
      // Host receives connection from guest
      setupConnection(conn);
    });
  };

  const setupConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      connectionsRef.current.set(conn.peer, conn);
      setIsConnected(true);
      options.onPeerConnected(conn.peer);
    });

    conn.on('data', (data) => {
      options.onMessage(data as GameMessage);
    });

    conn.on('close', () => {
      connectionsRef.current.delete(conn.peer);
      options.onPeerDisconnected(conn.peer);
      if (connectionsRef.current.size === 0) {
        setIsConnected(false);
      }
    });
  };

  const sendMessage = useCallback((message: GameMessage) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    peerRef.current?.destroy();
    signalingRef.current?.close();
    connectionsRef.current.clear();
    setRoomCode(null);
    setIsConnected(false);
  }, []);

  return {
    roomCode,
    isHost,
    isConnected,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
  };
}
```

---

## 6. ALTERNATIVE SIMPLIFIEE: PEERJS CLOUD (0 CONFIG)

### Si vous ne voulez pas déployer de signaling server

PeerJS fournit un serveur cloud gratuit à `0.peerjs.com`:

```typescript
// Utilisation directe sans serveur custom
import Peer from 'peerjs';

const peer = new Peer({
  // Utilise automatiquement 0.peerjs.com
  // Inclut TURN server gratuit
});

// L'hôte partage son peer.id (ex: "abc123xyz")
peer.on('open', (id) => {
  console.log('Share this ID:', id); // L'autre joueur entre ce code
});

// L'autre joueur se connecte avec l'ID
const conn = peer.connect('abc123xyz');
```

### Limitations PeerJS Cloud

```
⚠️ Pas de room codes personnalisés (IDs générés automatiquement)
⚠️ Pas garanti pour production (mais fonctionne bien pour hobby)
⚠️ Pas de contrôle sur la disponibilité

Pour projet famille/hobby: ✅ Acceptable
Pour production sérieuse: Utilisez Deno Deploy
```

---

## 7. DEPLOIEMENT COMPLET

### Structure Repos GitHub

```
pendu-multiplayer/          ← Repo principal (PUBLIC)
├── README.md
├── package.json
├── next.config.js
├── src/                    ← Frontend Next.js
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
└── server/                 ← Serveur signaling (Deno)
    └── signaling.ts
```

### Étapes Déploiement

```bash
# 1. Créer repo GitHub public
gh repo create pendu-multiplayer --public --clone
cd pendu-multiplayer

# 2. Initialiser Next.js
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# 3. Connecter Vercel (compte existant)
# Via https://vercel.com/import → GitHub → pendu-multiplayer
# OU
npm i -g vercel
vercel login
vercel --prod

# 4. Déployer signaling sur Deno Deploy
# Via https://dash.deno.com → New Project → GitHub → server/signaling.ts
# OU
deployctl deploy --project=pendu-signaling server/signaling.ts
```

### URLs Finales

```
Frontend PWA:    https://pendu-multiplayer.vercel.app
Signaling WS:    wss://pendu-signaling.deno.dev
```

---

## 8. COMPARATIF AVEC ALTERNATIVES

### Option A: Tout sur Render (votre config actuelle chess-app)

```yaml
Avantages:
  - Un seul service à gérer
  - Socket.io classique (plus simple)
  - Vous avez déjà l'expérience

Inconvénients:
  - Spin-down après 15min inactivité
  - Wake-up 30-60 secondes
  - Laptop doit rester allumé pour éviter spin-down constant
```

### Option B: WebRTC + Deno Deploy (RECOMMANDÉ)

```yaml
Avantages:
  - Pas de spin-down
  - P2P direct = latence minimale
  - Serveur signaling ultra léger
  - Fonctionne même si signaling tombe (en cours de partie)

Inconvénients:
  - Architecture légèrement plus complexe
  - WebRTC peut échouer sur certains réseaux (rare)
```

### Option C: PeerJS Cloud uniquement (PLUS SIMPLE)

```yaml
Avantages:
  - Zero infrastructure à gérer
  - Fonctionne immédiatement
  - TURN server inclus gratuit

Inconvénients:
  - Pas de room codes personnalisés
  - Dépendance service tiers
  - Pas de garantie SLA
```

---

## 9. DECISION FINALE

### Recommandation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    💡 ARCHITECTURE RECOMMANDÉE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OPTION RETENUE: WebRTC + Deno Deploy + Vercel                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  COMPOSANT          │  PLATEFORME      │  COÛT   │  CB REQUISE     │   │
│  ├─────────────────────┼──────────────────┼─────────┼─────────────────┤   │
│  │  Frontend (PWA)     │  Vercel          │  0€     │  Non            │   │
│  │  Signaling Server   │  Deno Deploy     │  0€     │  Non            │   │
│  │  P2P Communication  │  WebRTC/PeerJS   │  0€     │  N/A            │   │
│  │  STUN Server        │  Google (public) │  0€     │  N/A            │   │
│  │  TURN Server        │  PeerJS Cloud    │  0€     │  Non            │   │
│  ├─────────────────────┼──────────────────┼─────────┼─────────────────┤   │
│  │  TOTAL              │                  │  0€     │  AUCUNE         │   │
│  └─────────────────────┴──────────────────┴─────────┴─────────────────┘   │
│                                                                             │
│  AVANTAGES:                                                                │
│  ✅ Téléphones peuvent jouer à distance (réseaux différents)              │
│  ✅ Laptop peut être éteint pendant la partie                             │
│  ✅ Pas de spin-down (Deno Deploy always-on)                              │
│  ✅ Latence P2P minimale (~10-30ms)                                       │
│  ✅ 100% gratuit sans jamais entrer de CB                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Plan d'Implémentation

```
PHASE 1: Game Engine (TDD) ────────── src/lib/game-engine.ts
PHASE 2: UI Composants ────────────── src/components/**
PHASE 3: Mode Solo (local) ────────── src/app/solo/**
PHASE 4: Signaling Server ─────────── server/signaling.ts (Deno)
PHASE 5: Hook WebRTC ──────────────── src/hooks/useWebRTC.ts
PHASE 6: Modes Coop/PvP ───────────── src/app/coop/**, pvp/**
PHASE 7: PWA + Deploy ─────────────── Vercel + Deno Deploy
```

---

## 10. RESSOURCES OFFICIELLES

### Documentation

- [PeerJS Docs](https://peerjs.com/docs/) - API WebRTC simplifiée
- [Deno Deploy Docs](https://docs.deno.com/deploy/manual/) - Déploiement serverless
- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) - API native
- [Vercel Next.js](https://vercel.com/docs/frameworks/nextjs) - Déploiement frontend

### Repos de Référence

- [PeerJS GitHub](https://github.com/peers/peerjs) - Client WebRTC
- [PeerJS Server](https://github.com/peers/peerjs-server) - Serveur signaling
- [Deno WebRTC Signaling](https://github.com/weisrc/rooms) - Exemple Deno

---

**Document validé pour implémentation**
**Budget: 0€ | CB: Non requise | Téléphones à distance: ✅**
