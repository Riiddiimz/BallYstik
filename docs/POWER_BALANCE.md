# Équilibrage des pouvoirs — BallYstik

## Base de réglage

- Référence de comparaison : 100 PV par boule.
- Les dégâts de contact restent la source de dégâts fréquents ; les pouvoirs doivent créer un avantage lisible sans supprimer une boule en un seul impact ordinaire.
- Les valeurs ci-dessous sont les dégâts de base avant les multiplicateurs globaux éventuels, dont le multiplicateur de dégâts de fin de partie.
- Ce réglage est une première passe statique : il doit être confirmé par des simulations répétées et des tests de jeu. Il ne constitue pas une preuve d'équilibrage définitif.

## Revue des 14 pouvoirs actuellement proposés dans le panneau

| Pouvoir | Dégâts / effet après ajustement | Justification |
|---|---|---|
| Rayon du Jugement | 26 dégâts à l'impact | Tir instantané et très lisible ; reste puissant sans retirer près de la moitié des PV. |
| Chasseur Stellaire | 22 dégâts à l'impact du missile | Le guidage augmente la probabilité de toucher ; dégâts légèrement inférieurs au rayon instantané. |
| Bombe à fragmentation | Jusqu'à 16 dégâts de zone au centre, plus 8 fragments à 5 dégâts chacun | Dégâts répartis entre explosion et fragments ; le nombre de fragments correspond maintenant au libellé « 8 fragments ». Plusieurs fragments peuvent encore toucher une même cible. |
| Nova Sismique | 14 dégâts par cible touchée une fois, avec repoussement | Le déplacement est une partie importante de la puissance ; les dégâts restent modérés. |
| Faille Magmatique | 8 dégâts par seconde pendant le contact avec la zone | Les dégâts sont progressifs et dépendent du temps passé dans la lave ; ils ne doivent pas être comparés à un impact instantané. |
| Surcharge Giga | Bonus de dégâts de contact de 35 % pendant 3 secondes | Pouvoir de renforcement et de taille, pas une attaque instantanée ; bonus réduit de 60 % à 35 %. |
| Éclair en chaîne | 18 dégâts à chacun des deux combattants reliés, une fois par déclenchement | Contrôle forcé et effet visuel de chaîne justifient des dégâts moyens, sans punition de 28 PV par cible. |
| Fleur Explosive | 16 dégâts par pétale qui touche | Attaque de zone avec trajectoires multiples ; chaque impact doit rester modéré. |
| Prison de Cristal | 22 dégâts à la libération après immobilisation | L'immobilisation d'environ 1,1 s apporte déjà un fort avantage ; réduction de 36 à 22 dégâts. |
| Sceau d'Emprisonnement | 8 dégâts par cible piégée, une seule fois par cible | L'effet principal est le confinement temporaire ; les dégâts restent secondaires. |
| Singularité Violette | Jusqu'à 28 dégâts à l'implosion, avec décroissance selon la distance | L'attraction puis l'implosion offrent déjà une forte mise en scène et un contrôle de position. |
| Prisme Réflecteur | La cible protégée reçoit 40 % des dégâts initiaux ; 45 % sont renvoyés à l'attaquant | Défense forte mais non invulnérable ; la réflexion reste significative sans annuler presque toute attaque. |
| Saut Quantique | 0 dégât direct ; téléportation et 0,4 s d'invulnérabilité | Pouvoir de mobilité/évasion : aucun dégât direct n'est nécessaire. |
| Division Cellulaire | 0 dégât direct ; deux leurres durant 3 s | Pouvoir de confusion : sa valeur vient du leurre, pas de dégâts artificiels. |

## Points à vérifier en simulation

1. Tester chaque pouvoir seul contre des adversaires à 100 PV, avec la même seed et les mêmes conditions.
2. Répéter les essais avec 2, 4 et 8 boules et mesurer les dégâts cumulés par pouvoir.
3. Vérifier les dégâts après activation du multiplicateur de fin de partie.
4. Vérifier qu'une bombe ne touche pas excessivement une cible avec plusieurs fragments simultanés.
5. Vérifier que les pouvoirs de contrôle (Prison de Cristal, Sceau d'Emprisonnement, Singularité) ne combinent pas contrôle prolongé et dégâts excessifs.
6. Ajuster après les résultats mesurés, pas seulement à partir de l'impression visuelle.

## Limites connues

- La bombe peut infliger plusieurs impacts de fragments à une même cible : 5 dégâts par fragment n'est pas un plafond total.
- La Faille Magmatique inflige des dégâts sur la durée ; le total dépend du nombre de frames de contact.
- Le multiplicateur de fin de partie peut augmenter les dégâts effectifs ; il faut vérifier les valeurs en jeu avec ce réglage actif.
- Aucun test navigateur / Playwright n'a été exécuté par cette modification via l'accès GitHub seul.
