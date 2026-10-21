# Feature Status & Audit (gem_check)

> Date: 21 octobre 2026 — Branche `gem_check`

## 1. Vue d'ensemble du codebase

BallYstik est un simulateur de combats automatisés de billes en arène 2D, pensé pour générer des vidéos captivantes (TikTok / Shorts).
Le moteur tourne en Canvas 2D (avec shader WebGL optionnel pour l'arène Vortex Test), piloté par une boucle fixed-timestep à 60 FPS avec seed déterministe (Mulberry32).

### Fichiers de code actifs

| Fichier | Description | État |
|---|---|---|
| `index.html` | Page principale, conteneur canvas 9:16, panneau de contrôle, HUD | Fonctionnel, à enrichir (sélecteur mode de jeu) |
| `js/arena/arena.js` | Arène, bordures, rétrécissement, obstacles, styles visuels | Fonctionnel, déterministe (PRNG câblé) |
| `js/arena/arena-battle.js` | Moteur de simulation, balles, physique, collisions, dégâts, KO | Fonctionnel (mode Last Standing hardcodé) |
| `js/arena/arena-battle-bindings.js` | UI bindings, sliders, seed searcher, export MP4/MediaRecorder | Fonctionnel |
| `js/arena/new-powers-behaviors.js` | 14 pouvoirs complets (attaques, shields, clones, météores...) | Complet et fonctionnel |
| `js/arena/pickups.js` | Spawner d'orbes de pouvoir, collisions, attraction | Fonctionnel |
| `js/arena/arena-hud.js` | Affichage du score, PV, kill feed, vainqueur | Fonctionnel |
| `js/arena/floating-text.js` | Textes flottants (critiques, dégâts, popups) | Fonctionnel |
| `js/arena/damage-numbers.js` | Numéros de dégâts colorés | Fonctionnel |
| `js/arena/health.js` | Gestion PV, barres de vie | Fonctionnel |
| `js/arena/status-effects.js` | Effets de statut (gel, brûlure, etc.) | Fonctionnel |

---

## 2. État des fonctionnalités

### Systèmes principaux
- [x] **Physique & Collisions** : Intégration Euler, sous-étapes, rebonds élastiques avec amortissement.
- [x] **Système de PV & Dégâts** : PV max configurables, knockback proportionnel, mort subite (>50s dégâts doublés).
- [x] **14 Pouvoirs** : Intégrés avec timers, particules, animations d'impact et effets uniques.
- [x] **Déterminisme (Seed)** : PRNG Mulberry32. Bugs de random résolus (spawnCloneFor & obstacles arena).
- [x] **Export Vidéo** : Canvas stream -> WebM -> FFmpeg WASM conversion MP4.

### Modes de jeu
- [x] **Last Standing** : Actuellement le seul mode, en cours d'extraction dans l'architecture modulaire.
- [ ] **Duel à Distance** : 2 combattants séparés par une cloison, tirs de projectiles, esquive IA.
- [ ] **Guerre de Territoire** : Casse-briques / Paintball territorial, capture et conversion dynamique.
- [ ] **Modes bonus** : Concepts documentés (Boss Rush, Course d'Obstacles, etc.).

---

## 3. Correctifs récents

1. **B5** : Remplacement de `Math.random()` par `world.prng.next()` dans `spawnCloneFor` (`js/arena/arena-battle.js`).
2. **B6** : Câblage de `world.prng` dans `Arena` et utilisation de `prng.next()` dans `_buildObstacles` (`js/arena/arena.js`).
3. **Sauvegardes** : Tous les prototypes de référence (`map_neon.html`, `ballystik_maps_refonte.html`, etc.) copiés dans `idees/originals/`.
