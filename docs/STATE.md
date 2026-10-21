# Project State

## Current Phase
- Branche active : `gem_check`
- Phase en cours : Phase 6 — Modes conceptuels & Polish

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
- Phase 4 terminée :
  - Implémentation du mode « Duel à Distance » (`js/arena/mode-ranged-duel.js`)
  - Barrière énergétique infranchissable aux combattants mais perméable aux tirs
  - 3 types de projectiles (Rapide, Lourd explosif, Rebondissant) et orbes de munitions
  - IA autonome d'esquive verticale prédictive et ramassage d'orbes
- Phase 5 terminée :
  - Implémentation du mode « Guerre de Territoire » (`js/arena/mode-territory-war.js`)
  - Grille dynamique de 160 dalles à conquérir par impact physique
  - Méga-bombes à détonation en chaîne et conversion de zone
  - Jauge HUD en direct avec calcul du pourcentage de possession et victoire par domination

## In Progress / Next
- Phase 6 : Documentation des modes de jeu (`docs/GAME_MODES.md`), conception de modes supplémentaires (Boss Rush, Course aux Cibles, Sumo Ring).
- Phase 7 : Tests navigateur, mise à jour de la documentation générale (`AI_CONTEXT_BRANCHES.md`, `PROJECT.md`).

## Open Issues
- `PROJECT.md` contient encore des références à l'ancienne architecture modulaire à nettoyer en Phase 7.

