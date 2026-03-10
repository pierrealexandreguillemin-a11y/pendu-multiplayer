# Audit de Production Readiness — Pendu

**Date** : 2026-03-10
**Contexte** : Jeu du pendu en famille, modes Solo/Coop/PvP, 2-6 joueurs, P2P WebRTC, deploye sur Vercel, Upstash optionnel
**URL prod** : https://pendu-nu.vercel.app
**Verdict** : Production-ready pour un jeu familial casual, avec des reserves sur la securite Redis et la resilience reseau

---

## Methodologie

Chaque point de l'audit initial a ete re-evalue contre le contexte reel de l'application tel que decrit dans le README :
- **Public cible** : famille, cercle proche — pas d'adversaires malveillants
- **Architecture** : P2P by design (WebRTC via PeerJS) — pas de serveur de jeu
- **Upstash** : optionnel, leaderboard cloud secondaire
- **Echelle** : 2-6 joueurs par session, trafic faible
- **Revendications ISO** : ISO 25010, 25065, 29119, 5055, 12207, 42010

---

## Table des matieres

- [Critique](#critique)
- [High](#high)
- [Medium](#medium)
- [Low](#low)
- [Declass (non pertinents en contexte)](#declasses)
- [Actions prioritaires](#actions-prioritaires)

---

## Critique

### 1. Token Redis expose cote client

| | |
|---|---|
| **Fichiers** | `src/lib/upstash-client.ts` (lignes 44-45) |
| **Severite initiale** | Critique |
| **Severite contextuelle** | **Critique** — maintenu |

`NEXT_PUBLIC_UPSTASH_REDIS_REST_URL` et `NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN` sont injectes dans le bundle JS client. N'importe quel visiteur peut lire/ecrire/supprimer les donnees Redis depuis DevTools.

**Analyse contextuelle** : Le README documente explicitement ces variables avec le prefixe `NEXT_PUBLIC_` (section "Variables d'environnement"). Meme pour un jeu familial, exposer un token de base de donnees est un risque reel : un utilisateur curieux ou un bot de scraping peut corrompre ou vider le leaderboard cloud. Puisque Upstash est optionnel, le blast radius est limite au leaderboard (pas de donnees sensibles), mais le probleme reste critique car il constitue une mauvaise pratique de securite fondamentale.

**Correction** : Deplacer vers une API Route Next.js. Le README devra aussi etre mis a jour pour retirer le prefixe `NEXT_PUBLIC_` des exemples.

---

### 2. Aucune Error Boundary

| | |
|---|---|
| **Fichiers** | `src/app/solo/`, `src/app/coop/`, `src/app/pvp/` |
| **Severite initiale** | Critique |
| **Severite contextuelle** | **High** — retrograde |

**Analyse contextuelle** : Le README revendique la conformite ISO 25010 (qualite logicielle) et ISO 25065 (UX/utilisabilite). Un ecran blanc irrecuperable contredit directement ces deux standards. Cependant, pour un jeu familial avec peu de code asynchrone risque (pas de fetching complexe, pas de SSR dynamique), la probabilite d'un crash runtime non gere est faible. Le risque principal vient des callbacks WebRTC et Framer Motion. Retrograde a High car l'impact UX est reel mais la frequence est basse.

**Correction** : Ajouter `error.tsx` dans chaque route + `global-error.tsx` a la racine.

---

## High

### 3. Mot secret envoye en clair via WebRTC

| | |
|---|---|
| **Fichiers** | `useCoopSession.ts` (lignes 94-98), `usePvPSession.ts` (lignes 99-103) |
| **Severite initiale** | Critique |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : C'est un jeu en famille. Les joueurs se connaissent et jouent ensemble volontairement. Ouvrir la console pour tricher dans un jeu de pendu familial n'est pas un scenario realiste. De plus, en mode Coop, tous les joueurs collaborent — le mot doit etre connu de tous pour synchroniser l'etat. En PvP, c'est plus problematique mais le public cible (enfants, famille) ne va pas inspecter les messages WebRTC. Retrograde a Medium.

**Correction** : Si l'app evolue vers un public plus large, hasher le mot et verifier les guesses cote host uniquement.

---

### 4. PeerJS utilise le broker public

| | |
|---|---|
| **Fichiers** | `src/hooks/usePeerConnection.ts` (lignes 103, 138) |
| **Severite initiale** | High |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : Le README presente le multijoueur P2P via PeerJS comme un choix d'architecture delibere (doc `INFRASTRUCTURE_DECISIONS.md`). Pour 2-6 joueurs en famille, le broker public peerjs.com est suffisant — le trafic est negligeable et les limites de debit ne seront jamais atteintes. Le risque reel est un downtime du broker (hors du controle du dev), mais c'est acceptable pour un projet personnel/familial.

**Correction** : Acceptable en l'etat. Si le trafic augmente, envisager un broker PeerJS self-hosted.

---

### 5. Pas de reconnexion P2P

| | |
|---|---|
| **Fichiers** | `src/hooks/usePeerConnection.ts` |
| **Severite initiale** | High |
| **Severite contextuelle** | **High** — maintenu |

**Analyse contextuelle** : C'est le probleme le plus impactant pour l'UX reelle. En contexte familial, les joueurs utilisent souvent du WiFi domestique instable, des telephones qui passent en veille, ou changent de reseau. Une deconnexion = partie perdue sans recours. Le README revendique ISO 25065 (UX/utilisabilite), ce qui rend ce manque d'autant plus flagrant. La cible familiale amplifie le probleme plutot que de l'attenuer.

**Correction** : Prioritaire. Ajouter reconnexion avec backoff + feedback "Reconnexion en cours...".

---

### 6. Race condition read-modify-write sur le leaderboard

| | |
|---|---|
| **Fichiers** | `src/lib/upstash-client.ts` (lignes 122-136) |
| **Severite initiale** | High |
| **Severite contextuelle** | **Low** — retrograde |

**Analyse contextuelle** : Avec 2-6 joueurs en famille et un trafic tres faible, la probabilite de deux soumissions de score dans la meme milliseconde est quasi nulle. Le leaderboard cloud est optionnel et non critique. La race condition est techniquement reelle mais ne se manifestera jamais en pratique.

**Correction** : Nice-to-have. Utiliser `ZADD` si un refactoring Upstash est fait (point 1).

---

### 7. Pas de Content Security Policy

| | |
|---|---|
| **Fichiers** | `vercel.json`, `next.config.ts` |
| **Severite initiale** | High |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : Le README mentionne des "security headers actives" et revendique ISO 25010. L'app n'a pas d'input utilisateur rendu en HTML brut (React echappe par defaut), pas de `dangerouslySetInnerHTML`, et pas de contenu dynamique genere cote serveur. Le risque XSS est donc faible intrinsequement. Cependant, une CSP reste une bonne pratique de defense en profondeur, surtout avec les connexions WebRTC et Upstash.

**Correction** : Ajouter une CSP basique. Retirer `X-XSS-Protection` (deprecie).

---

### 8. Pas de `max()` sur `word`/`category` dans les schemas Zod

| | |
|---|---|
| **Fichiers** | `src/lib/message-validation.ts` (lignes 17, 31) |
| **Severite initiale** | High |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : En contexte familial P2P, l'attaquant serait un joueur de la meme session (famille/amis). Le DoS n'affecterait que le navigateur de la victime, pas un serveur. Risque tres faible en pratique, mais la correction est triviale (ajout de `.max(100)`).

**Correction** : Quick fix recommande vu la simplicite.

---

### 9. Couverture de tests a 25% (seuil) vs 91% (reelle sur le domaine)

| | |
|---|---|
| **Fichiers** | `vitest.config.ts`, `__tests__/` |
| **Severite initiale** | High |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : Le README est plus nuance que l'audit initial. La couverture reelle sur `game-engine.ts` est de ~91%, et `difficulty-config.ts` + `words-difficulty.ts` sont a 100%. Le seuil de 25% dans vitest.config est bas, mais le README indique une checklist PR exigeant ">= 80%". Les 163 tests (106 unit + 57 E2E) couvrent les flux principaux. Le manque de tests sur les hooks est reel mais les hooks sont essentiellement des wrappers React — le coeur metier (game-engine) est bien teste.

**Correction** : Monter le seuil vitest a 70% pour matcher la realite. Ajouter des tests pour `message-validation.ts` (critique pour le P2P).

---

### 10. Animations ignorent `prefers-reduced-motion`

| | |
|---|---|
| **Fichiers** | `WordDisplay.tsx`, `BalloonDisplay.tsx`, `page.tsx` |
| **Severite initiale** | High |
| **Severite contextuelle** | **Medium** — retrograde |

**Analyse contextuelle** : Le README revendique ISO 25065 (UX/utilisabilite) et met en avant les "ballons animes (Framer Motion)" comme feature. Les animations sont centrales au jeu. Cependant, ne pas respecter `prefers-reduced-motion` est une violation d'accessibilite reelle. En contexte familial, un membre de la famille pourrait avoir un trouble vestibulaire. Retrograde a Medium car l'app fonctionne sans (les animations ne bloquent pas le gameplay), mais c'est un manquement aux standards revendiques.

**Correction** : Ajouter `motion-reduce:hidden` ou `useReducedMotion()`.

---

## Medium

### 11. `createRoom` sans timeout

| | |
|---|---|
| **Severite contextuelle** | **Medium** — maintenu |

Toujours pertinent. Un hang infini sans feedback est une mauvaise UX, surtout pour un public familial non technique.

---

### 12. Pas de heartbeat — joueurs fantomes

| | |
|---|---|
| **Severite contextuelle** | **Medium** — maintenu |

Pertinent en contexte familial : telephones en veille, tabs en arriere-plan. Un joueur fantome bloque la rotation des tours.

---

### 13. `DifficultyLevel` non valide au chargement localStorage

| | |
|---|---|
| **Severite contextuelle** | **Low** — retrograde |

La probabilite qu'un utilisateur familial corrompe manuellement le localStorage est quasi nulle. Crash possible mais improbable.

---

### 14. Page d'accueil `'use client'` inutilement

| | |
|---|---|
| **Severite contextuelle** | **Low** — retrograde |

La home page utilise GlassCard avec mouse tracking et Framer Motion — le `'use client'` est en fait justifie par les effets interactifs. L'impact perf est negligeable sur une seule page.

---

## Low

### 15-20. Points maintenus en Low

| # | Point | Contexte |
|---|-------|----------|
| 15 | `<foreignObject>` SVG sur Safari | Pertinent si des joueurs utilisent iPhone/iPad — verifier le rendu reel |
| 16 | Pas de meta Open Graph | Utile pour partager le lien du jeu en famille (WhatsApp, iMessage) — quick win |
| 17 | `playerName` accepte tous les Unicode | Risque nul en famille, React echappe le rendu |
| 18 | `generateId()` avec `Date.now()` | Collisions impossibles en pratique familiale |
| 19 | `aria-pressed` incorrect | Correction simple et pertinente pour l'accessibilite |
| 20 | Touch targets < 44px | Pertinent — les joueurs mobiles sont le public principal |
| 21 | Manifest PWA sans icone `maskable` | Pertinent — la PWA installable est une feature documentee |
| 22 | `scoreMultiplier` inutilise | Code mort a nettoyer |
| 23 | Pas de `<noscript>` | Non pertinent — une app React/Next.js necessite JS par definition |

---

## Declasses

Points de l'audit initial qui ne sont pas pertinents dans le contexte de l'app :

| # | Point initial | Raison du declassement |
|---|---------------|----------------------|
| 4 | Aucune autorite serveur | **Architecture P2P by design.** Le README et les docs d'architecture decrivent explicitement un choix P2P sans serveur de jeu. Pour 2-6 joueurs en famille qui se connaissent, la triche n'est pas un threat model realiste. |
| 12 | Leaderboard ecrit depuis le client | **Consequence directe du choix P2P.** Le leaderboard cloud est optionnel et secondaire. Les scores falsifiables ne sont pas un probleme quand les joueurs se font confiance. |
| 19 | Vercel deploie independamment du CI | **Acceptable pour un projet personnel.** Les hooks pre-push executent deja typecheck + lint + tests + build. Le dev est seul a pusher sur master. |
| 20 | Pas de Firefox/WebKit en E2E | **Nice-to-have.** 57 tests E2E sur Chrome desktop + mobile couvrent le public principal. Safari/Firefox seraient un plus mais ne sont pas bloquants. |
| 22 | Rate-limiting Redis | **Non pertinent.** 2-6 joueurs familiaux ne vont pas spam les appels Redis. |
| 28 | `<noscript>` | **Non pertinent.** App 100% client-side React. |
| 30 | `PNPM_VERSION` inutilisee | **Cosmetic.** Aucun impact fonctionnel. |

---

## Verdict contextualise

### Ce qui fonctionne bien

- Architecture Feature-Based + DDD coherente et bien documentee
- 163 tests (106 unit + 57 E2E) avec ~91% sur le domaine metier
- Pipeline CI 6 gates + hooks pre-commit/pre-push
- Security headers presents (meme si incomplets)
- Validation Zod sur les messages P2P
- PWA installable avec manifest et icones
- TypeScript strict, 0 `any`, 0 warnings ESLint
- Region Vercel cdg1 (Paris) adaptee au public francais

### Ce qui bloque la production

| # | Bloquant | Raison |
|---|----------|--------|
| 1 | Token Redis expose | Securite fondamentale — meme pour un jeu familial |
| 2 | Pas d'error boundary | Resilience minimale attendue |
| 5 | Pas de reconnexion P2P | UX critique pour le public cible (WiFi domestique, mobiles) |

### Conclusion

**L'app est production-ready pour un usage familial restreint**, a condition de corriger les 3 bloquants ci-dessus. La majorite des points de l'audit initial (autorite serveur, anti-triche, rate-limiting, CSP avancee) relevent de menaces qui ne s'appliquent pas a un jeu de pendu joue entre proches. L'architecture, la qualite du code et la couverture de tests sont au-dessus de la moyenne pour un projet personnel.

---

## Actions prioritaires (revisees)

| Priorite | Action | Effort | Justification contextuelle |
|----------|--------|--------|---------------------------|
| **P0** | Deplacer Upstash cote serveur | 1-2h | Token expose = faille reelle meme en familial |
| **P0** | Ajouter `error.tsx` par route | 30min | Ecran blanc = UX inacceptable |
| **P0** | Reconnexion P2P + timeout `createRoom` | 2-3h | WiFi domestique instable = public cible |
| **P1** | Heartbeat ping/pong | 1-2h | Joueurs fantomes bloquent la partie |
| **P1** | `.max()` sur schemas Zod | 15min | Quick fix trivial |
| **P1** | CSP basique + retirer `X-XSS-Protection` | 1h | Alignement avec les claims ISO 25010 |
| **P2** | `prefers-reduced-motion` | 1-2h | Accessibilite — alignement ISO 25065 |
| **P2** | Meta Open Graph | 30min | Partage du lien en famille (WhatsApp) |
| **P2** | Icone PWA `maskable` | 15min | PWA est une feature documentee |
| **P3** | Monter seuil couverture vitest | 15min | Aligner config sur la realite (>= 70%) |
| **P3** | Tests `message-validation.ts` | 1h | Module P2P critique non teste |
| **P3** | Touch targets clavier >= 44px | 30min | Mobile = usage principal |
