# Project State

## Current Phase
- Branche active : `gem_check`
- Phase en cours : Phase 2 — Architecture Game Mode (après validation du plan d'implémentation et clôture de la Phase 1)

## Done
- Audit complet du codebase, identification des 7 points de vigilance (B1 à B7)
- Sauvegarde de tous les prototypes originaux dans `idees/originals/`
- Correction déterminisme B5 (`spawnCloneFor` avec `world.prng`) et B6 (`Arena` avec `prng`)
- Documentation créée : `docs/FEATURE_STATUS.md` et `docs/MAPS_CATALOG.md`
- Approbation du plan d'évolution en 7 phases

## In Progress / Next
- Phase 2 : Créer le gestionnaire modulaire `js/arena/game-modes.js`
- Extraire "Last Standing" en mode dédié
- Ajouter le sélecteur "Mode de jeu" dans `index.html` et `arena-battle-bindings.js`

## Open Issues
- `PROJECT.md` contient encore des références à l'ancienne architecture modulaire à nettoyer en Phase 7.

