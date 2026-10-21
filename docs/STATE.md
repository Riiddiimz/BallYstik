# Project State

## Current Phase
- Branche active : `gem_check`
- Phase en cours : Phase 4 — Mode Duel à Distance

## Done
- Audit complet du codebase, identification des 7 points de vigilance (B1 à B7)
- Sauvegarde de tous les prototypes originaux dans `idees/originals/`
- Correction déterminisme B5 (`spawnCloneFor` avec `world.prng`) et B6 (`Arena` avec `prng`)
- Documentation créée : `docs/FEATURE_STATUS.md` et `docs/MAPS_CATALOG.md` (12 maps documentées)
- Approbation du plan d'évolution en 7 phases
- Phase 2 terminée :
  - Création de `js/arena/game-modes.js` (registre extensible `GameModes`)
  - Extraction du mode `LastStandingMode` dans `js/arena/mode-last-standing.js`
  - Délégation du cycle de vie (init, update, render, checkVictory, onTimeout) dans `arena-battle.js`
  - Ajout du menu déroulant « Mode de jeu » dans `index.html` avec fiches descriptives
  - Synchronisation et persistance des options de mode dans `arena-battle-bindings.js`
- Phase 3 terminée :
  - Déblocage et exposition des 3 maps mécaniques cachées : `reactor`, `crossfire`, `void`
  - Intégration de 2 maps spectaculaires issues de `idees/map_neon.html` : `sablier` et `cyber_core`
  - Rendu personnalisé, obstacles dédiés et fiches descriptives dans l'arène et l'UI (total 12 maps actives)

## In Progress / Next
- Phase 4 : Implémenter le mode « Duel à Distance » (`js/arena/mode-ranged-duel.js`) avec cloison physique séparatrice, système de munitions/projectiles et IA de visée/esquive.

## Open Issues
- `PROJECT.md` contient encore des références à l'ancienne architecture modulaire à nettoyer en Phase 7.

