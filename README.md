# BallYstik — Last Sphere Standing

BallYstik est un jeu de combat de boules en arène, conçu pour un affichage vertical 9:16. Les boules disposent de points de vie, s'affrontent, récupèrent des capacités et la partie se termine selon le mode de victoire choisi.

## Lancer le jeu

Le projet est une application web statique. Ouvrir `index.html` dans un navigateur ou déployer le dépôt sur un hébergement statique (par exemple Vercel). Les styles Tailwind et Font Awesome sont chargés depuis leurs CDN.

## Structure

- `index.html` — structure de l'interface, panneau de réglages, canvas et HUD.
- `css/style.css` — styles de base et cadre de jeu.
- `js/app.js` — interactions de l'interface (panneaux, accordéons, plein écran et bouton audio).
- `js/audio.js` — synthétiseur audio optionnel.
- `js/arena/arena.js` — arène, obstacles et zone rétrécissante.
- `js/arena/arena-battle.js` — logique du match, déplacements, dégâts et conditions de victoire.
- `js/arena/arena-battle-bindings.js` — boucle de jeu autonome, seed, sauvegarde des options et branchement des contrôles.
- `js/arena/health.js` — points de vie.
- `js/arena/status-effects.js` — effets de statut.
- `js/arena/ability-registry.js` — catalogue des capacités.
- `js/arena/ability-offensive.js`, `ability-defensive.js`, `ability-utility.js` — comportements des capacités.
- `js/arena/pickups.js` — apparition et collecte des orbes.
- `js/arena/arena-hud.js` — barres de vie, classement et flux d'éliminations.
- `js/arena/damage-numbers.js` — nombres de dégâts.

## Seed et réglages

La seed permet de reproduire la configuration initiale. Les options de match sont enregistrées localement dans le navigateur. Les données de sauvegarde sont propres au navigateur et à l'origine du site.

## Architecture

Arena Brawl démarre directement depuis son propre contrôleur et sa propre boucle de rendu. Le bootstrap et le moteur multi-modes historiques (Classic/Escape, ancien chercheur de durée et ancien moteur physique) ont été retirés du chemin d'exécution et les fichiers devenus inutiles ont été supprimés.

## À vérifier avant une version de production

- Tester les trois conditions de victoire : dernier survivant, durée limitée et premier à 10 éliminations.
- Vérifier les capacités, les effets de statut et le rétrécissement de l'arène.
- Vérifier le rendu sur mobile, le plein écran, le son et la persistance des options.
- Confirmer que la seed reproduit bien les éléments aléatoires attendus sur plusieurs navigateurs.
