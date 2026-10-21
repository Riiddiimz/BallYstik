# Catalogue des Maps de BallYstik

> Date: 21 octobre 2026 — Branche `gem_check`

Ce document répertorie l'ensemble des arènes intégrées, cachées et issues des fichiers prototypes de référence.

---

## 1. Maps actives dans l'interface (12 arènes)

| Clé ID | Nom affiché | Géométrie | Éléments & Mécaniques |
|---|---|---|---|
| `neon` | Néon (Défaut) | Rectangle vertical | Grille cyberpunk, bordures luminescentes néon, obstacles au centre. |
| `neon_grid` | Néon Grid | Rectangle vertical | Grille rétro-futuriste, 3 bumpers circulaires à répulsion active. |
| `volcan` | Volcan | Rectangle vertical | Arène de roche sombre, coulée de lave centrale, projections de braises. |
| `nexus` | Nexus Spatial | Rectangle vertical | Étoiles défilantes, nébuleuse sombre, 3 astéroïdes flottants interactifs. |
| `reactor` | Cœur de Réacteur | Rectangle vertical | Ondes de choc radiales périodiques repoussant les boules avec dégâts. |
| `crossfire` | Tir Croisé | Rectangle vertical | Faisceau laser traversant périodique balayant l'arène. |
| `void` | Le Néant | Rectangle vertical | 2 singularités gravitationnelles asymétriques déviant les trajectoires. |
| `sablier` | Le Sablier | Rectangle vertical | Étranglement en sablier au centre avec 4 bumpers défensifs. |
| `cyber_core` | Cyber Core | Rectangle vertical | Noyau central pulsar ultra-répulsif avec 4 micro-bumpers satellites. |
| `vortex` | Vortex Spirale | Cercle / Arène ronde | Force centripète continue vers le centre, particules de succion. |
| `vortex_test` | Vortex Test (WebGL) | Cercle / Arène ronde | Rendu shader GLSL interactif avec distorsion d'espace-temps. |
| `sanctuaire` | Sanctuaire du Chaos | Rectangle vertical | Style mystique, piliers d'énergie pulsée, décharges arcaniques. |

---

## 3. Banques d'idées de maps prototypes (`idees/`)

### A. Fichier `idees/map_neon.html` (11 Maps Spéciales)
1. **L'Hexagone** : Arène polygonale à 6 côtés, rebonds inclinés imprévisibles.
2. **La Croix** : Cloisons intérieures en croix divisant l'arène en 4 quadrants.
3. **Le Diamant** : Arène en losange favorisant les accélérations angulaires.
4. **Le Stade** : Ovaloïde avec poches de rebonds rapides sur les courbes.
5. **Le Sablier** : Étranglement central forçant les affrontements au goulot.
6. **Cyber Core** : Noyau central réactif déviant les trajectoires avec flash lumineux.
7. **Anomalie Spatiale** : Distorsion gravitationnelle asymétrique.
8. **Forge Magmatique** : Plaques chauffantes infligeant des dégâts de zone périodiques.
9. **Labo Quantique** : Portails de téléportation reliant deux coins opposés.
10. **Sanctuaire Aurora** : Vagues d'énergie boréale modifiant la friction.
11. **Néon Arena** : Arène dynamique avec bumpers lumineux multi-étages.

### B. Fichier `idees/ballystik_maps_refonte.html` (4 Maps Thématiques Visuelles)
1. **Canopée Vivante** : Ambiance jungle / bioluminescence, lianes élastiques comme absorbeurs de choc.
2. **Caldeira Furieuse** : Cratère volcanique avec fumerolles explosives périodiques.
3. **Récif Tourbillon** : Courants marins circulaires modifiant les vitesses angulaires.
4. **Ruines d'Amon** : Tempête de sable avec zones de ralentissement sablonneuses.

---

## 4. Plan de sélection pour intégration Phase 3
Pour enrichir immédiatement le gameplay sans alourdir les perfs :
1. Intégrer et exposer `reactor`, `crossfire`, `void` dans le sélecteur HTML.
2. Ajouter **Le Sablier** (forme physique spectaculaire en goulot).
3. Ajouter **La Croix** (obstacles structurants favorisant les duels tactiques).
4. Ajouter **Labo Quantique** (avec mécanique de portails de téléportation fonctionnels).
5. Ajouter **Caldeira Furieuse** (thème visuel fort très adapté aux vidéos courtes).
