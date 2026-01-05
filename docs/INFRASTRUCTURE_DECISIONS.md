# Décisions Infrastructure - Pendu Multijoueur

> **Version**: 1.0 | **Date**: 2026-01-05
> **Standard**: ISO/IEC 42010:2022 (Architecture Decision Records)

---

## 1. CONTEXTE

**Besoin**: Communication temps réel entre 2-6 téléphones pour jeu du pendu multijoueur.

**Contraintes**:
- Budget: 0€
- Pas de carte bancaire
- Jeu à distance (réseaux différents possibles)
- PWA installable

---

## 2. OPTIONS ÉVALUÉES

### Option A: Socket.io sur Render (Free Tier)

| Critère | Évaluation |
|---------|------------|
| Coût | 0€ |
| CB requise | Non |
| WebSocket | ✅ Supporté |
| Spin-down | ⚠️ 15min inactivité, wake-up 30-60s |
| Complexité | Moyenne |

**Verdict**: ABANDONNÉ - Spin-down problématique pour UX

### Option B: Serveur custom sur Deno Deploy

| Critère | Évaluation |
|---------|------------|
| Coût | 0€ |
| CB requise | Non |
| WebSocket | ✅ Supporté |
| Always-on | ✅ Pas de spin-down |
| Complexité | Moyenne-Haute |

**Verdict**: ABANDONNÉ - Problèmes déploiement CLI, over-engineering

### Option C: PeerJS Cloud (0.peerjs.com)

| Critère | Évaluation |
|---------|------------|
| Coût | 0€ |
| CB requise | Non |
| WebSocket | ✅ Via WebRTC |
| Déploiement | ✅ Aucun (service hébergé) |
| TURN server | ✅ Inclus gratuit |
| Complexité | Basse |

**Verdict**: ✅ RETENU - Solution optimale pour le cas d'usage

---

## 3. DÉCISION FINALE

```
┌─────────────────────────────────────────────────────────────────┐
│  ARCHITECTURE RETENUE: PeerJS Cloud + Vercel                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (PWA)          Signaling            Communication    │
│  ─────────────────       ─────────            ─────────────    │
│  Vercel (gratuit)        PeerJS Cloud         WebRTC P2P       │
│  Next.js 15              0.peerjs.com         Direct tel↔tel   │
│                          (gratuit)                              │
│                                                                 │
│  TOTAL: 0€ | CB: Non | Déploiement serveur: Aucun             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. FLUX TECHNIQUE

```
Phase 1: Signaling (via PeerJS Cloud)
──────────────────────────────────────
Phone A → PeerJS Cloud → Obtient ID "abc123"
Phone B → PeerJS Cloud → Demande connexion à "abc123"
PeerJS Cloud → Échange SDP/ICE entre A et B

Phase 2: Jeu (P2P direct)
─────────────────────────
Phone A ←──── WebRTC DataChannel ────→ Phone B
         Messages jeu directs, latence ~10-30ms
         PeerJS Cloud n'est plus utilisé
```

---

## 5. JUSTIFICATION ISO

### ISO/IEC 25010 - Qualité Logiciel

| Caractéristique | Comment adressée |
|-----------------|------------------|
| **Fiabilité** | PeerJS Cloud géré, SLA implicite |
| **Performance** | P2P direct = latence minimale |
| **Maintenabilité** | Zero infra à maintenir |
| **Portabilité** | WebRTC standard navigateur |

### ISO/IEC 42010 - Architecture

| Principe | Application |
|----------|-------------|
| **Séparation des préoccupations** | Signaling ≠ Communication |
| **Simplicité** | Solution la moins complexe viable |
| **Évolutivité** | Migration vers custom possible si besoin |

---

## 6. RISQUES ET MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| PeerJS Cloud indisponible | Faible | Haut | Fallback: mode solo offline |
| ID trop long à partager | - | UX | Affichage clair, copier/coller |
| WebRTC bloqué (NAT) | Faible | Moyen | TURN server inclus |

---

## 7. HISTORIQUE DÉCISIONS

| Date | Décision | Raison |
|------|----------|--------|
| 2026-01-05 | Render évalué | WebSocket supporté mais spin-down |
| 2026-01-05 | Deno Deploy tenté | Échec déploiement CLI |
| 2026-01-05 | **PeerJS Cloud retenu** | Simplicité, 0 déploiement, gratuit |

---

**Document approuvé pour implémentation**
