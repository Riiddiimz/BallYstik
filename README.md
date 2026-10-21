# BallYstik — générateur de combats pour TikTok

BallYstik est une application web de combats de boules en arène, pensée avant tout comme un **outil de création de vidéos verticales 9:16 d'environ 60 secondes**. L'objectif est de produire des combats visuellement lisibles, spectaculaires, reproductibles et avec une fin marquante. Le projet ne vise pas à devenir un jeu complet.

## Démarrer

Application web statique HTML/CSS/JavaScript. Ouvrir `index.html` dans un navigateur ou déployer le dépôt sur un hébergement statique, par exemple Vercel. Certaines dépendances de style et d'icônes sont chargées depuis des CDN.

- Application : https://ballystik.vercel.app
- Dépôt GitHub : https://github.com/Riiddiimz/BallYstik

## Documentation pour reprendre le projet

**Avant de modifier le code, lire [le dossier de reprise et la feuille de route](docs/AI_CONTEXT_BRANCHES.md).** Il résume l'objectif produit, l'évolution du projet, les nouveaux pouvoirs, les corrections déjà fusionnées, les points non validés et l'ordre recommandé des prochaines tâches.

La référence visuelle des 14 nouveaux pouvoirs est `idees/powers_final.html`. Leur dessin, couleurs et animations doivent rester fidèles à ce fichier : les corrections doivent se concentrer sur l'intégration et la logique, sans refaire leur visuel.

## Principaux fichiers

- `index.html` — interface et panneaux de réglages.
- `css/style.css` — styles de l'interface.
- `js/app.js` — interactions de l'interface.
- `js/arena/arena.js` — arène, obstacles et rétrécissement.
- `js/arena/arena-battle.js` — simulation, dégâts et conditions de victoire.
- `js/arena/arena-battle-bindings.js` — boucle de jeu, seed et options.
- `js/arena/new-powers-panel.js` — panneau des 14 nouveaux pouvoirs.
- `js/arena/new-powers-behaviors.js` — comportements et rendu des nouveaux pouvoirs.
- `idees/powers_final.html` — référence visuelle source.
- `docs/LESSONS.md` — leçons techniques à consulter avant les corrections liées.

## État et prudence

La PR #9 qui ajoute le nettoyage des effets entre les combats et réaligne les tests sur les 14 pouvoirs a été fusionnée dans `main` le 21 octobre 2026 : https://github.com/Riiddiimz/BallYstik/pull/9. Les tests Playwright n'avaient pas encore été exécutés sur l'hébergement réel au moment de la fusion. Il reste donc à valider le comportement en navigateur, la fidélité visuelle des pouvoirs, les effets persistants et l'export vidéo.

Ne déclarez jamais une fonction « testée » si elle a seulement été lue dans le code. Vérifiez la branche et le commit avant tout travail : la branche par défaut GitHub constatée le 21 octobre 2026 est `v2`, tandis que les changements récents documentés ici concernent `main`.
