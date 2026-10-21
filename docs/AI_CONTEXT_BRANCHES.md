# BallYstik — dossier de reprise et feuille de route

> **Mis à jour le 21 octobre 2026.** Document de référence destiné à un développeur ou à une IA qui reprend le dépôt sans connaître les conversations précédentes. Il distingue l'intention produit, l'historique, l'état du code, les validations réellement effectuées et la suite du travail.

## 1. Résumé en une minute

BallYstik est un **générateur web de combats de boules destinés à devenir des vidéos TikTok verticales d'environ 60 secondes**. Ce n'est pas un projet visant à devenir un jeu complet avec une grande campagne ou une progression complexe. Le moteur de combat sert à produire une séquence visuelle immédiatement compréhensible, surprenante, reproductible et satisfaisante à regarder jusqu'à la fin.

Le résultat recherché :
- format vertical 9:16, avec une arène et des boules faciles à lire sur téléphone ;
- événements visuels distincts, impacts compréhensibles et escalade du suspense ;
- combats reproductibles grâce à une seed, pour pouvoir retrouver une séquence intéressante ;
- résultat clair à la fin, idéalement à 60 secondes, puis écran du gagnant ;
- à terme, export vidéo fiable en MP4, prêt à être monté ou publié sur TikTok.

La priorité actuelle est **la fiabilité du moteur et l'intégration fidèle des 14 nouveaux pouvoirs**, puis leur validation en conditions réelles. Les objectifs TikTok et la qualité visuelle comptent davantage que l'ajout de mécaniques complexes sans preuve qu'elles améliorent la vidéo.

## 2. Dépôt et état Git connu

- Dépôt : https://github.com/Riiddiimz/BallYstik
- Déploiement indiqué dans les métadonnées du dépôt : https://ballystik.vercel.app
- Branche par défaut GitHub constatée le 21 octobre 2026 : `v2`.
- La branche `main` a été alignée précédemment sur `feature/sanctuaire-chaos` afin d'en faire la base de travail courante. Ne pas supposer que `main` est la branche par défaut GitHub : ce sont deux notions distinctes.
- La PR #9, « Corriger les fuites d’effets et réaligner les tests sur les 14 pouvoirs », a été **fusionnée dans `main` le 21 octobre 2026**. Commit de merge : `cb730d0b2dd063703a6ad7cd5807257c76e721fe`.
- PR : https://github.com/Riiddiimz/BallYstik/pull/9
- Avant chaque nouvelle modification, vérifier la branche, le commit de tête et l'état réel du dépôt. Ne pas se fier uniquement à ce document pour connaître la dernière version déployée.

## 3. Comment le projet a évolué

### Étape A — moteur de combat d'arène

Le projet a commencé comme une application web de combats entre boules. Le code comporte une interface de réglages, une arène, déplacements et collisions, points de vie, dégâts, effets de statut, capacités, orbes/pickups, HUD, chronomètre et conditions de victoire. Le projet utilise HTML, CSS et JavaScript côté navigateur, avec des canvas pour le rendu.

La base a ensuite été recentrée sur Arena Brawl, avec un contrôleur et une boucle de rendu dédiés. La seed et les réglages locaux servent à rejouer des configurations. La présence d'un mécanisme dans le code ne garantit pas que tous ses scénarios ont été validés en navigateur.

### Étape B — objectif de production vidéo TikTok

La direction produit a été clarifiée : BallYstik doit servir à fabriquer des clips verticaux d'environ une minute, pas à devenir un jeu complet. Une bonne séquence doit accrocher immédiatement, montrer plusieurs événements lisibles, augmenter la tension et livrer un résultat marquant vers la fin.

La structure proposée pour les vidéos (à expérimenter, pas une règle absolue) :
- 0–3 s : accroche visuelle ou question ;
- 3–12 s : premier événement marquant ;
- 12–30 s : escalade avec des événements variés ;
- 30–45 s : retournement ou événement inattendu ;
- 45–57 s : moment le plus spectaculaire et gagnant compréhensible ;
- 57–60 s : fin propre ou boucle si elle améliore réellement le revisionnage.

Les métriques à observer après publication seront notamment la rétention à 3 secondes, la durée moyenne, le taux de complétion, les relectures, commentaires et abonnements par vue. La viralité et la monétisation ne sont pas garanties.

### Étape C — expérimentations de fusion et d'armes

Une branche historique `feature/fusion-circle` a exploré la fusion **Dash + Firetrail → Tornade de feu**, avec préparation, incantation, interruption possible et dégâts de zone. Elle contenait aussi des PNG de haches, un atelier SVG pour six familles d'armes (hache, épée, marteau, arc, sceptre, lance) et des pages de test.

Ces travaux sont de l'historique et des pistes : **ne pas présumer que tout le code de cette branche a été intégré à la version actuelle**. Les valeurs de combat décrites dans les anciens commits n'ont pas toutes été validées par des essais. L'atelier d'armes avait des problèmes d'affichage/sélection non diagnostiqués de manière concluante.

La direction produit a ensuite privilégié une première version plus simple, avec des armes et des pouvoirs distincts, plutôt que d'accumuler trop tôt des systèmes de fusion.

### Étape D — nouveau catalogue de pouvoirs depuis le fichier validé

Le fichier de référence demandé par le propriétaire est `idees/powers_final.html`. Les nouveaux pouvoirs intégrés doivent conserver **exactement leur rendu visuel d'origine** : formes, animations, couleurs et effets. Ne pas redessiner, simplifier, recolorer ou réinterpréter ces pouvoirs pour « améliorer » leur apparence sans autorisation explicite.

Le panneau de l'application sépare les « Pouvoirs d'origine » des « Nouveaux pouvoirs », ces derniers étant organisés par thème. Le panneau actuel référence 14 nouveaux pouvoirs répartis en quatre groupes :
1. Rayon du Jugement
2. Chasseur Stellaire
3. Bombe à fragmentation
4. Nova Sismique
5. Faille Magmatique
6. Singularité Violette
7. Saut Quantique
8. Surcharge Giga
9. Prisme Réflecteur
10. Division Cellulaire
11. Éclair en chaîne
12. Prison de Cristal
13. Fleur Explosive
14. Sceau d'Emprisonnement

Le fichier `js/arena/new-powers-behaviors.js` porte le moteur des effets repris du fichier original, avec un adaptateur vers les coordonnées, boules et dégâts du moteur natif. `js/arena/new-powers-panel.js` construit le panneau de sélection/spawn. Les pouvoirs doivent être disponibles via le menu de nouveaux pouvoirs, sans doublons accidentels, et les effets ne doivent pas continuer à polluer un combat suivant.

Le propriétaire a signalé auparavant des écarts visuels par rapport au fichier source, des pouvoirs dupliqués et des problèmes pour faire apparaître plusieurs pouvoirs. Toute validation doit donc comparer le rendu au fichier original, vérifier la liste du panneau, les catégories et les interactions de spawn.

## 4. Dernier audit technique et changements déjà fusionnés

L'audit réalisé par Claude sur la branche `gem_check` a été pris en compte dans la branche `fix/claude-audit`, puis fusionné dans `main` via la PR #9.

Modifications incluses :
- ajout de `AbilityBehaviors.resetAll()` pour vider les collections d'effets globaux et les entités conservées par les pouvoirs ;
- appel du nettoyage au début de l'initialisation d'un nouveau combat ;
- suppression d'une deuxième définition strictement identique de `drawCrystals` ; la définition restante et son dessin n'ont pas été modifiés ;
- mise à jour des tests d'interface qui attendaient une ancienne liste de 10 pouvoirs : ils vérifient désormais le panneau et le catalogue de 14 pouvoirs ;
- ajout d'un test de régression sur le nettoyage des entités des pouvoirs entre les combats.

**Limite importante :** la PR indique que les tests Playwright n'ont pas encore été exécutés dans un navigateur sur l'hébergement réel. Les changements ont fait l'objet d'une comparaison ciblée du code, mais ce n'est pas l'équivalent d'une validation complète du jeu en fonctionnement. Ne pas déclarer la correction totalement testée.

Les blocs `POWERS.*` et leurs fonctions de dessin n'ont volontairement pas été retouchés. Les impulsions/propulsions, le gel, la règle de dégâts à 50 secondes, les halos et le DPR ont été laissés inchangés tant qu'une validation ou une décision produit n'est pas disponible.

## 5. Points techniques connus à traiter

À reprendre dans cet ordre, en privilégiant les corrections isolées et testables :

1. **Validation réelle des 14 pouvoirs.** Ouvrir l'application, comparer chaque effet à `idees/powers_final.html`, tester chaque bouton, les apparitions multiples, les collisions, les dégâts, les durées et la fin des effets.
2. **Cycle de vie des effets.** Vérifier le nettoyage lorsqu'une boule porteuse meurt, perd son pouvoir ou qu'un combat est réinitialisé. L'audit a signalé notamment le risque autour de Prison de Cristal et d'effets globaux qui peuvent survivre à leur porteur. Le reset entre combats a été ajouté, mais les cas de mort/perte de pouvoir doivent encore être validés et corrigés si nécessaire.
3. **Conflit entre vitesse de base et effets de mouvement.** Vérifier si `_keepBaseSpeed` annule ou réduit des propulsions/attractions prévues. Ne pas modifier la sensation de mouvement sans reproduire le problème.
4. **Tests automatisés.** Exécuter les tests Playwright dans un environnement réel ou CI, corriger les échecs, et ajouter des tests de comportement au-delà des seuls contrôles d'interface.
5. **Rendu et performances.** Vérifier le DPR, les halos et le pré-rendu sans changer l'apparence des pouvoirs validés. Comparer des captures au fichier source.
6. **Export vidéo.** Tester l'enregistrement complet et le téléchargement sur l'hébergement cible. Des erreurs passées concernaient `VideoEncoder ... closed codec` et `SharedArrayBuffer is not defined`. La compatibilité MP4 ne doit pas être annoncée tant qu'un fichier MP4 réel n'a pas été exporté et lu correctement.
7. **Durée de combat.** La cible produit exprimée est un gagnant déterminé exactement à 1:00, puis un écran gagnant de 2 secondes. Le multiplicateur de dégâts x2 doit commencer à 50 secondes exactement. Ces points sont des exigences à vérifier, pas des garanties validées par le présent document.
8. **Arène et format vertical.** Conserver le format 9:16 et la zone de cadrage convenue : haut 16 %, bas 10 %, gauche 0 %, droite 14 %. Les cartes doivent rester dans la même zone utile. Le rétrécissement de l'arène et les obstacles doivent être testés visuellement.
9. **Cartes et obstacles.** Le menu de cartes visé comprend Défaut, des obstacles centraux réglables jusqu'à 10 et placement aléatoire, ainsi qu'une option Vortex (Test) avec nombre d'obstacles réglable, y compris zéro. Inspecter l'état réel avant d'annoncer toutes ces options comme livrées.
10. **Fichiers historiques.** Ne pas supprimer `spiral.html`, `deepseek_html_20261015_b8d319.html`, d'anciens modules ou assets sans vérifier leurs références et obtenir l'accord du propriétaire si leur utilité est incertaine.

## 6. Règles visuelles et de collaboration

- **Priorité absolue : fidélité visuelle** des pouvoirs provenant de `idees/powers_final.html). La logique d'intégration peut être adaptée, pas le dessin original.
- Éviter les refontes globales et les changements de gameplay non demandés. Préférer une correction ciblée, un test ciblé, puis une vérification visuelle.
- Garder les modifications sur une branche de travail avant de les fusionner dans `main`, sauf demande explicite contraire.
- Avant de coder, vérifier les fichiers et le commit de la branche cible ; l'historique du chat ou une branche ancienne ne remplace pas le code actuel.
- Pour chaque lot de changements, noter : branche, commit/PR, fichiers touchés, tests réellement lancés, résultat, limites et problèmes restants.
- Séparer explicitement les statuts : **présent dans le code**, **test automatisé exécuté**, **test navigateur réalisé**, **à valider**, **idée future**.
- Ne jamais dire « testé » si seule une lecture du code a été faite.
- Ne pas retirer les pouvoirs d'origine sans demande explicite ; conserver leur menu distinct des nouveaux pouvoirs.

## 7. Feuille de route recommandée

### Phase 1 — stabiliser ce qui existe
- récupérer le dernier état Git et vérifier que le déploiement correspond à la bonne branche ;
- exécuter les tests automatisés ;
- faire une passe de validation visuelle des 14 pouvoirs source par source ;
- corriger les doublons, le spawn multiple et le nettoyage des effets, sans modifier les dessins ;
- vérifier le redémarrage du combat et l'absence d'effets fantômes.

### Phase 2 — rendre le combat reproductible et conforme à la vidéo cible
- confirmer le cadrage vertical 9:16 ;
- confirmer la chronologie : x2 à 50 s, gagnant à 60 s, écran gagnant pendant 2 s ;
- vérifier les seeds et créer un outil de recherche de seeds produisant un vainqueur au temps demandé ;
- vérifier les cartes, les obstacles et le comportement des boules au contact des obstacles.

### Phase 3 — rendre l'export fiable
- choisir et tester une méthode d'enregistrement compatible avec l'hébergement ;
- générer un vrai fichier vidéo vertical, idéalement MP4 1080 × 1920 ;
- vérifier lecture, durée, synchronisation et absence de corruption dans plusieurs lecteurs ;
- si le navigateur ne peut pas produire le MP4 de manière fiable, choisir explicitement une solution de conversion au lieu de présenter un WebM comme un MP4.

### Phase 4 — optimiser la vidéo, pas complexifier le jeu
- augmenter la variété des événements et la lisibilité des impacts ;
- concevoir une accroche et un payoff visuel par combat ;
- ajouter éventuellement textes, réactions et appel à l'abonnement au stade du montage ;
- mesurer les performances des vidéos avant d'investir dans davantage d'armes, fusions ou systèmes.

## 8. Architecture et documents à lire

Application web statique HTML/CSS/JavaScript :
- `index.html` : interface principale ;
- `css/style.css` : styles ;
- `js/app.js` : interactions de l'interface ;
- `js/arena/arena.js` : arène, obstacles et zone rétrécissante ;
- `js/arena/arena-battle.js` : combat, déplacements, dégâts et victoire ;
- `js/arena/arena-battle-bindings.js` : boucle autonome, seed, options et contrôles ;
- `js/arena/new-powers-panel.js` : panneau des 14 nouveaux pouvoirs ;
- `js/arena/new-powers-behaviors.js` : logique et rendu des nouveaux pouvoirs ;
- `idees/powers_final.html` : source visuelle de référence à préserver ;
- `docs/LESSONS.md` : leçons techniques issues des corrections précédentes ;
- `NOTES_DEV.md` : notes de développement, si présent sur la branche consultée.

## 9. Liens

- Dépôt : https://github.com/Riiddiimz/BallYstik
- Branche `main` : https://github.com/Riiddiimz/BallYstik/tree/main
- Branche par défaut constatée : https://github.com/Riiddiimz/BallYstik/tree/v2
- PR d'audit fusionnée : https://github.com/Riiddiimz/BallYstik/pull/9
- Source des pouvoirs (si présente sur la branche consultée) : https://github.com/Riiddiimz/BallYstik/blob/main/idees/powers_final.html
- Application : https://ballystik.vercel.app
