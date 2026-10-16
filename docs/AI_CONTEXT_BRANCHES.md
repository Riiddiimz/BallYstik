# BallYstik — mémoire de reprise du projet

> Mis à jour le 16 octobre 2026 après archivage des travaux de `feature/fusion-circle`. Ce document est conservé sur `main` pour retrouver les idées et le travail historique même après suppression des autres branches. Il décrit ce qui a été fait, ce qui reste à tester et ce qui n'a pas été intégré au jeu principal.

## 1. Objectif du projet

BallYstik est un jeu web de combats entre boules dans une arène. L'objectif final confirmé est de produire des vidéos TikTok d'environ 60 secondes qui donnent envie de rester jusqu'à la fin, de gagner des abonnés et, si les résultats le permettent, d'envisager la monétisation.

Le jeu est donc aussi un outil de production de contenu :
- accroche visuelle immédiate, sans longue introduction ;
- combats lisibles et spectaculaires ;
- progression et surprises qui entretiennent le suspense ;
- payoff important vers la fin ;
- si pertinent, fin qui relance naturellement le début ;
- suivi de la rétention à 3 secondes, de la durée moyenne, du taux de complétion, des relectures, commentaires et abonnements par vue.

Ces principes sont des objectifs à tester, pas une garantie de viralité ou de monétisation.

## 2. Référence Git après nettoyage

- Dépôt : `Riiddiimz/BallYstik`
- Branche à conserver : `main`
- Commit de référence observé sur `main) avant cette mise à jour documentaire : `d3944a91689b7a7aa89fada2b6a358f3262b6b92` — « docs: réduire le stun du dash à 2 secondes ».
- Les travaux détaillés ci-dessous ont été réalisés sur l'ancienne branche `feature/fusion-circle`. **Ils sont documentés ici, mais cela ne signifie pas que leur code a été fusionné dans `main`.**
- Cette mise à jour archive les informations pour une reprise éventuelle ; elle ne fusionne pas les modifications de gameplay de l'ancienne branche.
- À la date de rédaction, la suppression effective des autres branches doit encore être confirmée. Ne pas considérer le nettoyage terminé tant que la liste des branches GitHub ne montre que `main`.

Le projet est une application web statique en HTML/CSS/JavaScript, prévue pour être hébergée sur un hébergement statique/Vercel. Toujours vérifier l'état réel du dépôt et le commit de tête avant de modifier quoi que ce soit.

## 3. État général du jeu principal

D'après les documents et les fichiers précédemment observés, le projet comprend ou documente :
- une arène de combat entre boules, déplacements et collisions ;
- points de vie, dégâts, effets de statut, nombres de dégâts et éliminations ;
- capacités offensives, défensives et utilitaires ;
- pickups/orbes et armes ;
- rétrécissement de l'arène ;
- chronomètre et conditions de victoire ;
- audio synthétisé avec Web Audio API ;
- seed et options locales ;
- interface de jeu, contrôles et panneaux de réglages.

Cette liste ne certifie pas que chaque fonction marche actuellement dans la version déployée. Refaire des tests après toute modification importante. Aucun test navigateur ne doit être déclaré effectué s'il ne l'a pas réellement été.

## 4. Travaux de l'ancienne branche `feature/fusion-circle`

Dernier commit connu de cette branche : `7ff90f327f5713338e772ae74adecf6b0d561dde` — ajout du document de mémoire de travail. Le commit précédent notable était `97f7ad385a4022ca8d8f547fce916dcf4af43035` — « Add independent weapon selection fallback ».

### 4.1 Système de fusion de capacités

Fichiers ajoutés :
- `js/arena/ability-fusion.js` : logique de progression et d'exécution des fusions.
- `js/arena/ability-fusion-registry.js` : registre des paires compatibles.
- `js/arena/fusion-info.js` : informations/UI liées à la fusion.
- `tests/ability-fusion.test.js` : tests automatisés du système de fusion.

La seule fusion explicitement répertoriée dans le registre observé était :

**Dash + Firetrail → Tornade de feu**

Paramètres présents dans le registre :
- type : offensive ;
- préparation/potentiel : 2 secondes ;
- incantation : 3 secondes ;
- rayon d'interruption : 60 ;
- délai de pression avant recul : 3 secondes ;
- recul par seconde : 0,10 ;
- rayon de cible : 200 ;
- attente prête : 5 secondes ;
- tornade : rayon 60, vitesse 235, dégâts 8 DPS, durée 8 secondes, brûlure pendant 3 secondes.

Ces valeurs sont les valeurs de code observées, pas un équilibrage confirmé par des essais de jeu. La fusion prévoit une phase de préparation/incantation et peut être interrompue. Un commentaire du code précise que les effets visuels n'utilisent pas le générateur pseudo-aléatoire du monde, afin de ne pas modifier les résultats du combat.

Un rendu de tornade de feu en Canvas 2D a également été décrit : silhouette conique, spirales, flammes animées, noyau incandescent et base lumineuse. Retrouver et vérifier le code exact avant de le réutiliser.

**Statut : présent dans l'ancienne branche, intégration à `main` non confirmée et comportement en navigateur à retester.**

### 4.2 Armes et images

Assets ajoutés dans l'ancienne branche :
- `assets/weapons/axe_a.png`
- `assets/weapons/axe_b.png`
- `assets/weapons/axe_c.png`
- `assets/weapons/axe_s.png`

Il s'agit de quatre PNG transparents de haches préparés à partir des versions PhotoRoom. Les anciennes variantes et suffixes PhotoRoom avaient été nettoyés ; les fichiers finaux reprenaient le nommage attendu. `NOTES_DEV.md` indiquait que le rendu des armes/pickups faisait référence à ces images dans `js/arena/ability-offensive.js` et `js/arena/pickups.js`.

Autres assets d'armes observés : `assets/weapons/blade.png` et `assets/weapons/blade2.png`.

**Attention :** la présence de ces fichiers sur l'ancienne branche ne veut pas dire que les PNG de haches ont été copiés dans `main`.

### 4.3 Atelier de création d'armes

Fichiers/pages présents dans l'ancienne branche :
- `atelier-armes.html) : atelier autonome de dessin d'armes en SVG/code ;
- `test-armes.html` ;
- `test-armes-live.html).

L'atelier propose six catégories : Hache, Épée, Marteau, Arc, Sceptre et Lance. Il comprend des réglages visuels tels que taille, rotation, palette, lueur et arrière-plan, ainsi que l'export SVG/PNG.

Problème rencontré : les armes ne s'affichaient pas correctement et le changement d'arme ne fonctionnait pas pour l'utilisateur. Plusieurs correctifs ont été ajoutés :
- SVG avec dimensions explicites ;
- SVG de hache statique comme fallback ;
- script indépendant écoutant les clics sur `.weapon-choice[data-weapon]` et remplaçant le SVG par une silhouette simplifiée si le rendu principal ne se met pas à jour, avec mise à jour du titre/sous-titre et du bouton actif.

**Statut : correctifs de secours présents dans l'ancienne branche, mais pas de test navigateur réel confirmé. La cause racine n'a pas été établie.** Si l'atelier est recréé plus tard, diagnostiquer d'abord le chargement JavaScript, les erreurs console, les sélecteurs et l'ordre d'initialisation plutôt que d'ajouter encore des fallbacks.

### 4.4 Prototype d'arène et contrôles

La page `test.html` de l'ancienne branche avait été décrite comme un prototype d'arène isométrique en losange avec quadrillage/relief, obstacles, boules avec ombres/reflets et vies, combats, dégâts, éliminations, orbes, déplacement, dash et pause. Elle avait aussi été adaptée à une présentation mobile verticale 9:16 avec joystick tactile et bouton Dash, tout en conservant les contrôles clavier ZQSD/WASD/flèches et Espace.

Il faut inspecter la version exacte avant de réutiliser le prototype : cette description ne garantit pas que toutes les interactions étaient fiables.

### 4.5 Fichiers modifiés dans l'ancienne branche

Les fichiers du système de fusion et les fichiers d'interface associés incluaient notamment :
- `js/arena/ability-offensive.js`
- `js/arena/ability-registry.js`
- `js/arena/arena-battle-bindings.js`
- `js/arena/arena-battle.js`
- `js/arena/pickups.js`
- `css/style.css`
- `index.html)

La liste exacte du diff peut être retrouvée via l'historique Git tant que les commits sont accessibles. Avant suppression de branches, vérifier que les commits historiques resteront retrouvables dans le dépôt ou sauvegarder les références SHA importantes. Ne pas supposer que le code est présent sur `main` simplement parce que cette mémoire le décrit.

## 5. Autres pistes historiques à conserver comme idées

Les branches de travail historiques contenaient ou exploraient des sujets différents. Les points suivants sont des pistes à examiner, pas des fonctions garanties dans la version actuelle :

- **Spectacle de l'arène :** Canon à plasma avec charge visible, obus explosif et dégâts de zone ; Bobine Tesla avec charge, éclair et foudre en chaîne.
- **Variété des cartes :** Néon, Réacteur avec onde radiale, Crossfire avec faisceau annoncé, Néant avec puits gravitationnels. Vérifier l'état du code avant d'en faire une feuille de route ferme.
- **Réglages des capacités :** une ancienne branche travaillait sur le panneau de contrôle des capacités et le redémarrage d'une nouvelle partie avec une seed randomisée.
- **Démarrage Arena Brawl :** une ancienne branche avait pour objectif de démarrer ce mode automatiquement au chargement.
- **Physique Arena Brawl :** une ancienne branche visait à isoler ce mode de l'ancienne architecture multi-modes et retirait la gravité de la physique des boules dans son diff de tête.
- **Collisions sur coins arrondis :** une branche de correction abordait la normalisation des angles autour de -PI/PI et l'utilisation d'une distance point-segment exacte.
- **Nettoyage de l'ancien arcade :** une ancienne branche retirait des implémentations de modes inutilisés, mais utilisait une structure de fichiers plus ancienne. Ne pas reprendre son code sans comparer avec `main`.

## 6. Notes techniques déjà retenues

Le document `docs/LESSONS.md` répertorie notamment :
- la traversée de murs à grande vitesse traitée avec plusieurs sous-pas de physique ;
- l'apparition initiale d'une boule adaptée au rayon de l'anneau ;
- la normalisation des angles de collision autour de -PI/PI ;
- les rampes de volume Web Audio sécurisées et l'initialisation audio après interaction ;
- la correction d'un saut de défilement dans l'interface ;
- les accordéons fermés masqués via `display: none !important` ;
- le rendu canvas haute densité et le budget de temps de la recherche de seed ;
- un générateur aléatoire séparé pour les effets visuels afin qu'ils ne changent pas le résultat du combat.

Relire ce fichier avant de retoucher les zones concernées.

## 7. Objectif TikTok : priorités MVP

Une structure narrative à tester pour une vidéo d'environ 60 secondes :
- **0–3 s :** hook visuel immédiat, une question ou une promesse claire ;
- **3–12 s :** premier test d'arme ou premier événement qui prouve le concept ;
- **12–30 s :** escalade avec des événements distincts, pas des répétitions longues ;
- **30–45 s :** twist ou combinaison inattendue ;
- **45–57 s :** payoff le plus spectaculaire et résultat compréhensible ;
- **57–60 s :** boucle de fin/début si elle améliore réellement le revisionnage.

Priorité MVP conseillée : peu d'armes mais très différentes, un adversaire/cible clair, des impacts lisibles, une combinaison spectaculaire (la Tornade de feu est une candidate à tester), puis un mode tournage reproductible.

Fonctionnalités **non confirmées comme livrées** :
- mode tournage avec événements planifiés et répétables ;
- cadrage vertical fiable en 1080 × 1920 (9:16) ;
- enregistrement/export du résultat vidéo ;
- timeline pour textes, sons et réactions ;
- génération reproductible d'une séquence complète d'environ 60 secondes.

Le jeu doit être pensé comme le moteur de la vidéo, mais il faut d'abord rendre la séquence fiable, lisible et reproductible avant d'ajouter beaucoup de contenu.

## 8. Règles de reprise après nettoyage des branches

1. Commencer par lire ce fichier, `NOTES_DEV.md` et `docs/LESSONS.md`.
2. Confirmer que la branche courante est `main` et relever son commit de tête.
3. Ne pas supposer que le code de l'ancienne branche `feature/fusion-circle` a été fusionné. Cette mémoire est une archive d'idées et d'historique, pas un patch.
4. Si une ancienne fonctionnalité doit être reprise, retrouver son commit à partir des SHA ci-dessus ou de l'historique Git ; inspecter le diff et ne réintroduire que les changements nécessaires.
5. Après chaque changement important, noter la branche, le commit, les fichiers concernés, les tests réellement exécutés et les problèmes ouverts.
6. Distinguer systématiquement **présent dans le code**, **testé**, **à tester** et **idée future**.
7. Ne jamais déclarer qu'un test navigateur a été effectué sans l'avoir fait.
8. Garder l'objectif final en tête : créer des combats qui retiennent l'attention jusqu'au payoff, puis ajouter les outils nécessaires pour tourner/exporter des vidéos TikTok d'environ une minute.

## 9. Références utiles

- Dépôt : https://github.com/Riiddiimz/BallYstik
- Branche principale : https://github.com/Riiddiimz/BallYstik/tree/main
- Ce document : https://github.com/Riiddiimz/BallYstik/blob/main/docs/AI_CONTEXT_BRANCHES.md
- Ancien compare entre branches (utile si encore accessible) : https://github.com/Riiddiimz/BallYstik/compare/main...feature/fusion-circle
