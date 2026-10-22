# Project State

## Current Phase
- Branche active : `gem_check`
- Phase en cours : maintenance des maps et première passe d'équilibrage des pouvoirs.

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
  - Intégration des maps originales de `idees/map_neon.html` et des maps thématiques dans la liste jouable.
  - Les aperçus fidèles par iframe ont été retirés car les maps sont intégrées au moteur.
  - Retrait de la sélection des maps `void` (Néant), `sablier` (Goulot) et `vortex_test` (WebGL). Le Vortex standard et la map source originale nommée « Le Sablier » restent distincts.
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
- Phase 6 terminée :
  - Création de `docs/GAME_MODES.md` (spécifications des 3 modes actifs + 6 modes conceptuels)
- Phase 7 terminée :
  - Validation syntaxique et intégrité JS de tous les modules
  - Création de `docs/AI_WORKFLOW.md`
  - Mise à jour de `docs/AI_CONTEXT_BRANCHES.md`, `docs/LESSONS.md` et `docs/STATE.md`

## In Progress / Next
- Déploiement et tests en production / partage avec le créateur pour retours vidéo TikTok.

## Open Issues
- Aucun bug bloquant. Toutes les mécaniques et nouveaux modes respectent le déterminisme seed Mulberry32.



## Dernière session — 2026-10-22

### Réalisé sur `gem_check`
- Suppression des deux blocs de prévisualisation iframe des prototypes originaux et de leur script UI ; les cartes intégrées restent disponibles dans la sélection Maps.
- Retrait de la sélection de « Le Néant (Singularité) », « Le Sablier (Goulot) » et « Vortex Test (WebGL) ».
- Ajout de la valeur `0` au curseur de fréquence des orbes ; à `0`, aucun nouvel orbe automatique n'est généré, mais les orbes déjà présents restent actifs.
- Première passe de réduction des dégâts sur les pouvoirs de burst/contrôle et ajustement de la réflexion du Prisme.
- Documentation des valeurs dans `docs/POWER_BALANCE.md`.

### Validation à faire
- Vérification statique des changements via les fichiers GitHub.
- Les tests navigateur et Playwright ne sont pas exécutés depuis cet accès ; il faut les lancer dans l'environnement de test du dépôt.
- Tester en priorité le curseur de fréquence à `0`, le retour à une fréquence positive, les 14 pouvoirs et le multiplicateur de dégâts de fin de partie.
