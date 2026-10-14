# BallYstik — Résumé produit et pistes d'idées

> Document de référence destiné à conserver une trace de l'état produit connu de BallYstik et à pouvoir être copié dans d'autres IA pour des recherches d'idées et de concepts.
>
> **Dernière mise à jour : 14 octobre 2026**
> **Statut :** synthèse basée sur les descriptions échangées. Ce document n'est pas un audit complet du jeu. Les éléments inconnus sont explicitement indiqués.

## Comment lire ce document

- **Confirmé / décrit :** information explicitement donnée dans les échanges.
- **Hypothèse :** interprétation produit plausible, mais pas validée.
- **Non fourni / à confirmer :** information qui n'a pas été précisée.
- Les idées de la partie 2 sont des propositions, pas des fonctionnalités déjà présentes.
- L'export vidéo TikTok est une idée future : il n'est pas développé et n'est pas détaillé ici.

# PARTIE 1 — Résumé du jeu actuel

## 1. Résumé exécutif

BallYstik est un jeu web centré sur des combats entre boules dans une arène.

- Les boules se déplacent dans l'arène et interagissent physiquement avec ses limites.
- Le jeu comprend des capacités offensives et défensives.
- Des armes peuvent apparaître dans l'arène et être ramassées, notamment des lames.
- L'apparition des armes est pensée comme un événement visuel spectaculaire.
- L'arène peut rétrécir pendant une partie.
- Un chronomètre est utilisé et un gagnant doit être désigné à la fin du temps imparti, même s'il reste plusieurs boules.
- Les collisions, les rebonds sur les angles arrondis, l'affichage du gagnant et les interactions avec les armes ont fait l'objet de demandes de correction ou d'amélioration.
- L'export vidéo d'environ une minute pour TikTok est une idée pour plus tard, pas une fonctionnalité actuelle.

## 2. Objectif et proposition de valeur

### Faits connus
- Le jeu repose sur des affrontements entre boules.
- L'arène, les collisions, les capacités, les armes et le rétrécissement du terrain participent aux combats.
- Le joueur peut utiliser un menu de capacités et une liste permettant de faire apparaître des objets, dont des armes.
- L'expérience recherchée doit être plus intéressante et cohérente que de simples effets visuels.

### Hypothèse produit
La proposition de valeur pourrait être de proposer des combats courts, lisibles, spectaculaires et imprévisibles, où les collisions, les capacités, les armes et les événements de l'arène créent des retournements de situation.

### À confirmer
Le joueur contrôle-t-il directement une boule, configure-t-il les combattants qui se battent automatiquement, observe-t-il des combats autonomes, ou combine-t-il ces approches ?

## 3. Public cible et cas d'usage

| Élément | État connu |
|---|---|
| Public cible précis | Non fourni |
| Âge visé | Non fourni |
| Jeu solo ou multijoueur | Non confirmé |
| Contrôle direct des boules | Non confirmé |
| Combats automatiques regardés par le joueur | Possible, mais à confirmer |
| Sessions courtes et spectaculaires | Hypothèse |
| Création future de contenu TikTok | Intention future confirmée |

Les publics possibles — joueurs occasionnels, amateurs de stratégie, fans de jeux d'arène ou spectateurs de combats automatiques — restent des pistes, pas un public cible validé.

## 4. Boucle de jeu principale

L'ordre exact n'est pas confirmé. La boucle reconstituée à partir des éléments connus est la suivante :

1. Préparation ou configuration de la partie — détails non fournis.
2. Combat entre les boules dans l'arène.
3. Interactions physiques et utilisation éventuelle de capacités.
4. Apparition et ramassage possibles d'armes ou d'autres objets.
5. Rétrécissement éventuel de l'arène.
6. Arrivée du chronomètre à zéro ou fin du combat selon les règles.
7. Désignation du gagnant.
8. Relance de la partie — parcours exact non fourni.

À confirmer : comment une partie est lancée, si les boules sont contrôlées ou autonomes, quelles sont les conditions d'élimination, et comment une partie se relance.

## 5. Fonctionnalités connues

| Fonctionnalité | Description connue | Entrées / déclenchement | Résultat et règles |
|---|---|---|---|
| Arène | Terrain principal du combat | Paramètres exacts non fournis | Contient les boules et objets |
| Déplacement et collisions | Les boules se déplacent et rebondissent | Physique du jeu, détails non fournis | Les collisions influencent les trajectoires |
| Angles arrondis | Les rebonds dans les angles ont nécessité plusieurs corrections | Contact avec les limites | Le comportement exact actuel reste à confirmer |
| Arène rétrécissante | La zone de combat peut diminuer | Déclenchement exact non fourni | Les boules doivent rester dans le terrain |
| Capacités offensives | Catégorie de capacités de combat | Choix et effets précis non fournis | Effets exacts à confirmer |
| Capacités défensives | Catégorie distincte de capacités | Choix et effets précis non fournis | Effets exacts à confirmer |
| Armes | Des objets comme des lames peuvent être ramassés | Apparition et ramassage ; détails exacts à confirmer | Une boule peut porter une arme |
| Apparition spectaculaire d'armes | Effets visuels marqués lors du spawn | Apparition d'une arme | Animation souhaitée autour d'une seconde dans les dernières modifications |
| Menu des capacités | Interface de réglage des capacités | Choix du joueur | Doit rester cohérente avec les autres menus |
| Apparition manuelle d'objets | Liste permettant de faire apparaître des objets, dont une épée | Sélection dans la liste | L'objet choisi apparaît dans l'arène |
| Chronomètre | La partie est limitée dans le temps | Durée exacte non fournie | La fin du temps doit entraîner une décision |
| Fin de partie | Un gagnant doit être affiché à zéro | Chronomètre et état du combat | Un gagnant doit être désigné même si plusieurs boules restent |

Ces éléments ont été décrits dans le cadre du projet, mais cela ne garantit pas que chaque fonction soit parfaitement opérationnelle dans la version en ligne à la date de lecture.

## 6. Écrans et vues

| Écran / vue | État |
|---|---|
| Vue de l'arène | Confirmée |
| Menu des capacités | Confirmé |
| Menu de réglages | Confirmé dans son principe ; contenu exact non fourni |
| Menu d'apparition des objets | Confirmé |
| Affichage du chronomètre | Confirmé dans son principe ; présentation exacte non fournie |
| Écran de victoire | Fonction attendue ; rendu exact non fourni |
| Écran de défaite ou d'élimination | Non fourni |
| Écran d'accueil | Non fourni |
| Historique des parties | Non fourni |
| Paramètres audio et graphiques | Non fourni |

## 7. Parcours utilisateur connu

1. L'utilisateur accède au jeu web — écran d'arrivée non décrit.
2. Il peut consulter des réglages et le menu des capacités.
3. Il peut faire apparaître des objets, notamment des armes, à l'aide d'une liste.
4. Les boules combattent dans l'arène et interagissent avec ses limites.
5. Des capacités, des armes et le rétrécissement de l'arène peuvent modifier le combat.
6. Le chronomètre atteint zéro.
7. Un gagnant doit être désigné, même si plusieurs boules restent présentes.
8. La façon de relancer une partie ou d'enchaîner les combats est non fournie.

## 8. Mécaniques de jeu

| Mécanique | Connu | À confirmer |
|---|---|---|
| Déplacement | Les boules se déplacent | Contrôle humain ou comportement automatique |
| Collision | Les boules rebondissent sur les limites | Détails des collisions entre boules et objets |
| Combat | Capacités offensives et défensives | Dégâts, effets, conditions d'élimination |
| Armes | Une boule peut ramasser et porter une lame | Dégâts, portée, durée, autres armes |
| Rétrécissement | L'arène peut diminuer | Rythme, fréquence et déclenchement |
| Chronomètre | Une durée limitée est prévue | Durée exacte, prolongation éventuelle |
| Victoire | Un gagnant doit être désigné à la fin du temps | Méthode de départage |
| Score | Non fourni | Points, classement, statistiques |
| Progression | Non fournie | Niveaux, expérience, déblocages |
| Récompenses | Non fournies | Récompenses après une victoire |

## 9. Existant, futur et inconnu

### Décrit comme existant ou présent dans le projet
- Arène avec boules en mouvement.
- Mécaniques de collision et de rebond.
- Chronomètre de partie.
- Catégories de capacités offensives et défensives.
- Armes ramassables, notamment des lames.
- Menu pour faire apparaître des objets.
- Arène rétrécissante.
- Menus de réglage.
- Effets visuels d'apparition d'armes en cours d'amélioration.

### Non confirmé ou non fourni
- Modes de jeu et nombre de combattants.
- Liste complète des capacités et effets.
- Règles exactes d'élimination et de départage.
- Progression, récompenses et statistiques.
- Classements, fonctions sociales et multijoueur en ligne.
- Options audio, d'accessibilité et de personnalisation.
- Monétisation.

### Prévu pour plus tard
- Export vidéo TikTok : idée future, non développé. Ce document ne décrit pas sa réalisation.

## 10. Forces et risques produit

### Forces potentielles
- Des combats potentiellement imprévisibles.
- Une base visuelle simple à comprendre : boules, arène et interactions.
- Les armes peuvent créer des événements marquants et changer la situation.
- Le rétrécissement de l'arène peut faire monter la tension.
- Les catégories offensives et défensives ouvrent la voie à des styles différents.

### Risques à vérifier
- Des capacités qui ne produisent que des effets visuels, sans conséquence tactique, peuvent manquer d'intérêt.
- Une arme trop puissante peut décider d'un combat à elle seule.
- Des rebonds incohérents peuvent donner une impression d'injustice.
- Des parties trop similaires peuvent réduire l'envie de rejouer.
- Si les raisons d'une victoire ou d'une défaite ne sont pas compréhensibles, le résultat peut sembler arbitraire.

Ce sont des risques de conception à évaluer, pas des défauts tous confirmés.

# PARTIE 2 — Idées pour enrichir BallYstik

Les idées suivantes sont des propositions. Aucune ne doit être considérée comme déjà implémentée. L'effort indiqué est une estimation produit globale, pas un plan de réalisation.

## A. Gameplay et mécaniques

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Armes aux styles distincts | Lame rapide, marteau puissant, bouclier, lance ou arme à distance | Rend les choix d'armes tactiques | Moyen |
| Capacités qui interagissent | Feu, vent, glace et foudre avec effets combinés | Crée des synergies et des contres | Élevé |
| Arènes à événements | Zones dangereuses, plateformes mobiles, courants d'air | Le terrain devient un acteur du combat | Élevé |
| Objets surprises | Bonus temporaires, pièges, accélérations ou gravité modifiée | Crée des retournements inattendus | Moyen |
| Personnalités de combattants | Style agressif, prudent, opportuniste ou chercheur d'armes | Rend les combats plus variés et identifiables | Élevé |
| Mécanique de dernier recours | Possibilité limitée de revenir dans un combat défavorable | Augmente le suspense sans garantir la victoire | Moyen |

## B. Progression et rétention

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Défis quotidiens | Objectifs de combat renouvelés | Donne une raison de revenir | Faible |
| Succès et trophées | Récompenses pour des exploits précis | Valorise les styles de jeu différents | Faible |
| Collection d'armes cosmétiques | Débloquer des apparences et variantes visuelles | Crée des objectifs à long terme | Moyen |
| Collection de boules | Skins, motifs et effets visuels | Renforce l'attachement au jeu | Moyen |
| Statistiques personnelles | Victoires, éliminations, armes favorites, records de survie | Rend les progrès visibles | Moyen |
| Série de victoires | Titre ou effet visuel pour les séries | Encourage à enchaîner les parties | Faible |
| Maîtrise d'une arme | Récompenses liées à son utilisation | Encourage à explorer plusieurs styles | Moyen |

Les récompenses permanentes devraient idéalement enrichir l'expérience sans rendre les nouveaux joueurs nettement moins puissants.

## C. Niveaux, modes et événements

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Arène volcanique | Zones qui deviennent dangereuses | Force à surveiller le terrain | Moyen |
| Arène glacée | Surface glissante | Change les déplacements sans ajouter forcément beaucoup de capacités | Moyen |
| Arène néon | Environnement futuriste très identifiable | Renforce l'identité visuelle | Moyen |
| Dernière boule debout | Le dernier combattant restant gagne | Règle simple et immédiatement lisible | Faible |
| Match chronométré | Temps limité et critère de départage clair | Rend chaque seconde importante | Faible |
| Roi de l'arène | Contrôler une zone centrale rapporte des points ou avantages | Encourage la confrontation | Moyen |
| Chasse au trésor | Objets à récupérer pendant le combat | Ajoute un objectif secondaire | Moyen |
| Boss | Plusieurs boules affrontent un adversaire puissant | Propose un défi différent | Élevé |
| Tournoi | Plusieurs manches successives | Crée une progression sur plusieurs combats | Moyen |
| Chaos total | Événements et objets plus imprévisibles | Offre un mode déjanté | Moyen |

## D. Social, multijoueur et classements

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Classement des champions | Classement selon les résultats | Donne un objectif compétitif | Moyen |
| Défi entre amis | Comparer les résultats selon les mêmes règles | Favorise le partage | Élevé |
| Codes de combat | Partager une configuration de match à reproduire | Simplifie les défis | Moyen |
| Revanche immédiate | Relancer avec les mêmes paramètres | Réduit les interruptions | Faible |
| Hall of Fame | Mettre en avant les records et victoires marquantes | Valorise les exploits | Moyen |
| Défis communautaires | Objectif collectif sur une période | Crée un sentiment de participation | Élevé |
| Mode spectateur | Observer un combat sans intervenir | Utile si les combats peuvent être autonomes | Élevé |

Ces idées ne supposent pas que BallYstik possède déjà un mode en ligne.

## E. Monétisation éventuelle

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Apparences cosmétiques | Skins, traînées, effets de victoire | Personnalisation sans avantage compétitif | Moyen |
| Packs d'arènes | Thèmes visuels de terrain | Renouvelle l'apparence des combats | Moyen |
| Packs d'effets | Effets d'apparition, de collision et de victoire | Valorise le spectacle | Moyen |
| Packs thématiques | Ensemble de skins et effets assortis | Offre simple à comprendre | Faible à moyen |
| Version premium | Options de personnalisation ou de confort | Peut soutenir le projet | Moyen |
| Soutien volontaire | Contribution facultative | Monétisation légère | Faible |

Piste à privilégier : les cosmétiques. Des armes ou capacités payantes donnant un avantage important risqueraient de nuire à l'équilibre et à la confiance.

## F. Ambiance, direction artistique et son

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Identité visuelle des armes | Silhouette, couleur et effet distinctifs | Les armes sont immédiatement reconnaissables | Moyen |
| Impacts différenciés | Effets et sons distincts selon la force de l'impact | Rend les actions lisibles et satisfaisantes | Moyen |
| Montée en tension | Musique et ambiance plus intenses en fin de partie | Transforme le chronomètre en suspense | Moyen |
| Signatures sonores | Son propre à chaque famille d'armes ou capacité | Améliore la lisibilité | Faible à moyen |
| Annonce d'arme rare | Signal sonore et visuel distinctif | Crée de l'attente | Faible à moyen |
| Célébrations de victoire | Effet propre au type de victoire | Renforce la satisfaction | Moyen |
| Mode visuel minimal | Réduire les effets décoratifs | Facilite le suivi des trajectoires | Faible à moyen |

## G. Accessibilité et confort

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Vitesse réglable | Voir le combat au ralenti ou en accéléré | Aide à comprendre ou à parcourir les combats | Faible à moyen |
| Réduction des effets | Diminuer flashs, particules et secousses | Améliore le confort visuel | Faible à moyen |
| Pause et reprise | Mettre en pause si le mode le permet | Facilite les sessions courtes | Faible |
| Règles visibles | Expliquer les conditions de victoire avant le match | Évite les fins incomprises | Faible |
| Indicateurs lisibles | Distinguer les boules, armes et capacités | Rend l'action plus claire | Moyen |
| Tutoriel progressif | Introduire les règles par petites étapes | Réduit la barrière d'entrée | Moyen |
| Commandes personnalisables | Adapter les commandes | Améliore le confort | Moyen |
| Mode sans son | Jouer sans dépendre des indices audio | Élargit les situations d'utilisation | Faible |

## H. Idées conceptuelles pour de futurs contenus vidéo

Cette section ne décrit pas la création ou l'export technique des vidéos. Elle porte uniquement sur les concepts de contenu potentiellement intéressants.

| Idée | Description courte | Pourquoi ce serait mieux | Effort |
|---|---|---|---|
| Le combat du siècle | Affrontement particulièrement serré | Offre une histoire facile à suivre | Moyen |
| Retournement impossible | Une boule gagne alors qu'elle semblait condamnée | Favorise la surprise | Faible à moyen |
| Arme légendaire | Une apparition d'arme devient un événement rare | Crée de l'attente | Moyen |
| Champion invincible | Suivre une boule qui enchaîne les victoires | Favorise l'attachement à un personnage | Moyen |
| Chaos de l'arène | Combats riches en événements inattendus | Produit des moments drôles ou spectaculaires | Moyen |
| Défis inhabituels | Combats sans armes ou avec une seule capacité autorisée | Renouvelle les affrontements | Faible à moyen |
| Rivalités récurrentes | Les mêmes combattants s'affrontent à nouveau | Crée une continuité entre les épisodes | Moyen |
| Statistiques surprenantes | Records et résultats inattendus | Donne un angle narratif au combat | Moyen |
| Identité des combattants | Nom, apparence et style reconnaissables pour chaque boule | Rend les personnages mémorables | Moyen |
| Vote du public | Les spectateurs choisissent une règle ou un duel futur | Peut encourager la participation | Moyen |

Principe éditorial : même sans connaître toutes les règles, un spectateur devrait rapidement comprendre qui domine, quel événement vient de se produire et pourquoi la fin est surprenante.

# Questions encore ouvertes

Ces questions sont à poser à l'utilisateur en conversation ; elles ne sont pas des faits manquants à combler par supposition.

1. Le joueur contrôle-t-il une boule, configure-t-il les combattants ou regarde-t-il des boules se battre automatiquement ?
2. Combien de boules participent généralement à une partie ?
3. Comment une boule est-elle éliminée ?
4. Comment le gagnant est-il choisi lorsque le chronomètre atteint zéro ?
5. Quelles capacités existent aujourd'hui et que font-elles ?
6. Quels effets la lame et les autres armes ont-elles sur les adversaires ?
7. Quels paramètres peut-on modifier avant ou pendant une partie ?
8. Quel est le but principal visé : jeu actif, combats autonomes à observer, bac à sable de création de combats, ou mélange ?
9. Quelles sont les trois idées proposées les plus attirantes ?
10. Quelle ambiance faut-il privilégier : compétitive et stratégique, arcade chaotique, spectaculaire et cinématographique, humoristique, ou mélange ?

---
**Note de mise à jour :** lors des prochaines révisions, conserver les informations confirmées, corriger les éléments devenus obsolètes et garder une distinction claire entre état actuel, hypothèses et idées futures.
