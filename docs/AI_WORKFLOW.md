# Workflow IA & Guide de Contribution — BallYstik

> Date: 21 octobre 2026 — Branche `gem_check`

Ce document récapitule l'architecture de BallYstik, la méthodologie de travail appliquée et les consignes pour toute IA ou développeur intervenant sur ce dépôt.

---

## 1. Principes Fondamentaux de BallYstik

1. **Objectif TikTok / Formats Courts** : Le simulateur est conçu pour captiver l'œil en 3 à 5 secondes. Chaque mode, arène ou pouvoir doit offrir du contraste lumineux, de la tension dramatique, un enjeu clair et des retournements de situation.
2. **Déterminisme Absolu** : Chaque simulation est gouvernée par une seed pseudo-aléatoire (PRNG Mulberry32). Deux exécutions avec la même seed doivent impérativement produire un combat identique à la frame près.
   - Ne **JAMAIS** utiliser `Math.random()` dans la boucle de simulation, le calcul des trajectoires, les obstacles ou les spawns d'orbes. Toujours utiliser `world.prng.next()`.
   - Les effets purement visuels décoratifs indépendants de la physique peuvent utiliser leur propre générateur local.
3. **Format Vertical 9:16** : L'arène est optimisée pour un affichage sur smartphone, sans défilement horizontal ni rognage des éléments vitaux.

---

## 2. Architecture Technique

### A. Cycle de Simulation Fixed-Timestep
- Boucle cadencée à 60 FPS (`dt = 1/60`).
- Sous-étapes physiques pour prévenir le tunneling des boules à grande vitesse.
- Enregistrement direct du canvas via `MediaRecorder` et transcodage MP4 avec FFmpeg WASM.

### B. Système Modulaire de Modes de Jeu (`js/arena/game-modes.js`)
Tout nouveau mode implémente l'interface suivante et s'enregistre via `window.GameModes.register(MonMode)` :
```javascript
{
    id: 'monMode',
    name: 'Nom affiché',
    description: 'Description pour l\'UI',
    victoryCondition: 'Règle de victoire',
    customBallSpawn: (world, battle) => { /* spawn custom optionnel */ },
    init: (world, battle) => { /* initialisation état */ },
    update: (dt, world, battle) => { /* logique de manche */ },
    renderBackground: (ctx, world, battle) => { /* rendu sous les boules */ },
    render: (ctx, world, battle) => { /* rendu d'avant-plan */ },
    checkVictory: (world, battle) => { return { finished: true, winner, reason }; },
    onTimeout: (world, battle) => { return { finished: true, winner, reason }; }
}
```

### C. Catalogue des Maps (`js/arena/arena.js`)
L'arène supporte 12 cartes configurables :
- `neon`, `neon_grid`, `volcan`, `nexus`, `reactor`, `crossfire`, `void`, `sablier`, `cyber_core`, `vortex`, `vortex_test`, `sanctuaire`.
- Les dimensions jouables sont calculées via les marges configurables et respectent le ratio vertical.

---

## 3. Règles de Triage et Méthodologie IA

- **Niveau S** : Modif directe, pas de lecture de doc superflue, pas de délégation.
- **Niveau M** : Lecture de `STATE.md` + `LESSONS.md`. Plan concis en 3-5 lignes, validation et mise à jour de `STATE.md`.
- **Niveau L** : Plan complet, validation, découpage en phases, mise à jour de la documentation à chaque étape.

---

## 4. Statut de la Branche `gem_check`
- La branche `gem_check` constitue la version de référence consolidant :
  - L'architecture modulaire de modes de jeu.
  - L'intégration complète des 12 cartes de combat.
  - Les 3 modes jouables : Last Standing, Duel à Distance, Guerre de Territoire.
  - Le strict respect du déterminisme PRNG.
