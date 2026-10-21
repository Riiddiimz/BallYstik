# Spécifications & Banques de Modes de Jeu — BallYstik

> Date: 21 octobre 2026 — Branche `gem_check`

Ce document détaille les modes de jeu opérationnels, leurs règles précises, ainsi que les concepts innovants conçus pour maximiser l'engagement vidéo (TikTok / Shorts / Reels).

---

## 1. Modes de Jeu Opérationnels

### A. Battle Royale (Last Standing)
- **ID** : `lastStanding`
- **Fichier** : `js/arena/mode-last-standing.js`
- **Concept** : Le mode historique de BallYstik. Toutes les boules sont disposées en cercle et s'affrontent en chacun pour soi.
- **Règles & Mécaniques** :
  - Dégâts de contact physique et projection.
  - Ramassage d'orbes de pouvoirs parmi 14 capacités finales (laser, météore, clones, piques, boucliers...).
  - Mort subite : après 50 secondes, tous les dégâts sont doublés et les boules émettent une traînée de feu.
  - Clôture à 65 secondes avec classement aux PV en cas d'égalité prolongée.
- **Condition de Victoire** : Dernière boule réelle encore en vie.

---

### B. Duel à Distance (Ranged Duel)
- **ID** : `rangedDuel`
- **Fichier** : `js/arena/mode-ranged-duel.js`
- **Concept** : 2 combattants (Cyan vs Magenta) séparés par une cloison énergétique centrale infranchissable.
- **Règles & Mécaniques** :
  - **Champ de force central** : Bloque les boules avec rebond élastique et flash lumineux, mais laisse passer librement les tirs et projectiles.
  - **3 Types de Munitions** :
    - *Rapide* (`#38bdf8`) : Vitesse 480 px/s, dégâts 14, cadence élevée.
    - *Lourd / Explosif* (`#f97316`) : Vitesse 340 px/s, dégâts 28, onde de choc radiale.
    - *Rebondissant* (`#a855f7`) : Vitesse 430 px/s, dégâts 16, rebondit 2 fois sur les murs.
  - **IA d'esquive & visée** : Détection des tirs ennemis avec esquive verticale d'urgence ; anticipation du mouvement adverse lors du tir.
- **Condition de Victoire** : Élimination totale de l'adversaire ou plus grand nombre de PV restants au chrono.

---

### C. Guerre de Territoire (Territory War)
- **ID** : `territoryWar`
- **Fichier** : `js/arena/mode-territory-war.js`
- **Concept** : Affrontement territorial par équipe (2 Cyan vs 2 Magenta) sur une arène découpée en 160 dalles néon.
- **Règles & Mécaniques** :
  - **Conquête au choc** : Chaque impact de boule convertit instantanément la dalle à la couleur de son équipe avec feedback visuel.
  - **Méga-Bombes** : ~8.5% des dalles contiennent des bombes cachées. Tout choc déclenche une explosion en chaîne (rayon 2 cases) convertissant toute la zone !
  - **Jauge en direct** : Affichage temps réel du pourcentage de territoire contrôlé (Cyan vs Magenta vs Neutre).
- **Condition de Victoire** : Domination écrasante (atteinte de 75%+ du territoire) ou équipe possédant le plus de terrain à l'expiration du temps.

---

## 2. Banque de Concepts Futuristes (Prêts pour implémentation)

### 1. Boss Rush (Le Colosse d'Énergie)
- **Principe** : 1 méga-boule Boss (taille triple, 500 PV, aura de gravité) vs 4 petites boules rapides qui doivent coopérer pour la terrasser.
- **Spectacle TikTok** : La barre de vie massive du boss défile en haut de l'écran ; les petites boules tournent autour comme des satellites.

### 2. Sumo Ring (Éjection Hors Limites)
- **Principe** : L'arène n'a pas de murs mais des bords ouverts avec du vide ou de la lave. Chaque boule doit pousser ses adversaires vers le vide à l'aide de dashs et d'ondes de choc.
- **Spectacle TikTok** : Effets de tension maximale lorsque les boules frôlent le bord du vide avec étincelles.

### 3. Course aux Cibles (Target Frenzy)
- **Principe** : Des cibles dorées numérotées apparaissent dans l'arène pour quelques secondes seulement. La première boule à percuter la cible marque des points.
- **Spectacle TikTok** : Suspense intense et trajectoires frénétiques pour être le premier à intercepter le bonus.

### 4. Tag / Patate Chaude (Hot Potato)
- **Principe** : Une boule est infectée par un compte à rebours explosif de 6 secondes qui émet des éclairs rouges. Elle doit toucher une autre boule pour lui transférer la bombe avant qu'elle n'explose.
- **Spectacle TikTok** : Panique visuelle, poursuites haletantes au ralenti.

### 5. Labyrinthe Évolutif (Shifting Maze)
- **Principe** : Les murs intérieurs de l'arène s'ouvrent et se referment selon un rythme musical ou périodique, modifiant les trajectoires en temps réel.
- **Spectacle TikTok** : Les boules se retrouvent piégées ou propulsées dans de nouveaux couloirs à chaque pulsation.

### 6. Mode Miroir (Twin Synchronization)
- **Principe** : Chaque joueur contrôle ou observe deux boules jumelles aux mouvements symétriquement inversés. Si l'une périt, l'autre hérite de sa rage et double de vitesse.
- **Spectacle TikTok** : Hypnotisant et très visuel grâce à la symétrie parfaite des mouvements.
