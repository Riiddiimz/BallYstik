# Project State

## Current Phase
- Branche active : `gem_check`
- Phase en cours : Phase 3 — Intégration des maps

## Done
- Audit complet du codebase, identification des 7 points de vigilance (B1 à B7)
- Sauvegarde de tous les prototypes originaux dans `idees/originals/`
- Correction déterminisme B5 (`spawnCloneFor` avec `world.prng`) et B6 (`Arena` avec `prng`)
- Documentation créée : `docs/FEATURE_STATUS.md` et `docs/MAPS_CATALOG.md`
- Approbation du plan d'évolution en 7 phases
- Phase 2 terminée :
  - Création de `js/arena/game-modes.js` (registre extensible `GameModes`)
  - Extraction du mode `LastStandingMode` dans `js/arena/mode-last-standing.js`
  - Délégation du cycle de vie (init, update, render, checkVictory, onTimeout) dans `arena-battle.js`
  - Ajout du menu déroulant « Mode de jeu » dans `index.html` avec fiches descriptives
  - Synchronisation et persistance des options de mode dans `arena-battle-bindings.js`

## In Progress / Next
- Phase 3 : Intégrer les nouvelles maps et rendre accessibles `reactor`, `crossfire`, `void` ainsi que les maps de référence dans `arena.js` et l'UI.

## Open Issues
- `PROJECT.md` contient encore des références à l'ancienne architecture modulaire à nettoyer en Phase 7.

