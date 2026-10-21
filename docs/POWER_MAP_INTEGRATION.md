# Intégration des pouvoirs et des maps — BallYstik

## Règle principale

Les 14 pouvoirs de `idees/powers_final.html` sont un système commun au moteur de combat, pas des effets propres à une map. Une map ajoutée doit utiliser le contrat `Arena` commun ; elle ne doit pas recopier les sorts ni modifier leurs dessins.

## Sources de vérité

- `idees/powers_final.html` : référence visuelle et comportementale validée des 14 pouvoirs.
- `js/arena/new-powers-behaviors.js` : adaptateur vers le moteur principal. Les définitions `cast/update/render` des 14 pouvoirs doivent rester identiques à la source de référence.
- `js/arena/ability-registry.js` : identifiants, noms, couleurs, poids et métadonnées des pouvoirs.
- `js/arena/ability-settings.js` : réglages communs persistés (activation, poids, durée et paramètres globaux).
- `js/arena/pickups.js` : création et ramassage des orbes.
- `js/arena/arena-battle.js` : octroi, durée, activation et mise à jour des pouvoirs.
- `js/arena/arena.js` : géométrie de la map et contraintes spatiales.

## Contrat requis pour une nouvelle map

Toute map utilise le même monde de combat : `world.balls`, `world.arena`, `world.time`, les projectiles et les effets. Les pouvoirs ne doivent pas dépendre du nom de la map.

La géométrie de la map expose :

- `isPointInside(x, y, padding)` : indique si un point avec une marge est dans la zone jouable.
- `constrainPoint(x, y, padding)` : renvoie une position ramenée dans la zone jouable.

Les maps rectangulaires utilisent l'implémentation commune de `Arena`. Une map circulaire ou de forme spéciale surcharge ces deux méthodes dans `Arena`, plutôt que d'ajouter un test portant sur son nom dans `arena-battle.js` ou `pickups.js`.

## Ajouter une map

1. Ajouter son rendu et sa géométrie dans `js/arena/arena.js`.
2. Respecter le contrat de position ci-dessus pour les formes non rectangulaires.
3. La rendre sélectionnable via `arenaMap` dans les options.
4. Vérifier le spawn automatique et manuel des orbes, les ramassages, les projectiles, les téléportations et les limites de l'arène.
5. Ne pas dupliquer `AbilityRegistry`, `AbilitySettings` ou `AbilityBehaviors`. Les mêmes 14 pouvoirs et réglages s'appliquent automatiquement à la map.

## Garde-fous de régression

- Garder les 14 identifiants synchronisés entre le registre, les réglages, le panneau et les comportements.
- Ne modifier aucun bloc `cast/update/render` extrait de `idees/powers_final.html) sans validation visuelle explicite.
- Vérifier qu'un même pouvoir ne produit pas deux orbes ou deux activations à l'obtention.
- Les contraintes de géométrie peuvent changer les positions de spawn ; elles ne doivent jamais modifier le code de rendu des sorts.
