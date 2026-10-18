# Grille d’audit produit — pouvoirs BallYstik

## Objectif

Évaluer chacun des 24 pouvoirs de la branche `v2-power` pour décider s’il améliore réellement une vidéo de combat BallYstik : utilité en combat, beauté visuelle, compréhension immédiate, lisibilité sur téléphone et contribution au rythme/à la rétention.

Cette grille complète `tests/POWER_AUDIT.md`. Un test technique réussi ne signifie pas qu’un pouvoir est bon visuellement ou compréhensible.

## Barème commun

Pour chaque critère noté, attribuer une note de 1 à 5 :
- **1 — Échec :** absent, confus, peu utile ou nuisible.
- **2 — Faible :** fonctionne à peine ; défaut important.
- **3 — Correct :** utilisable, mais amélioration évidente.
- **4 — Très bon :** clair, efficace et cohérent.
- **5 — Excellent :** immédiat, marquant et distinctif.

Ajouter une preuve ou un exemple concret à chaque note. Si l’effet n’a pas été observé, utiliser **NON ÉVALUÉ** au lieu d’inventer une note.

## Checklist à appliquer à chaque pouvoir

### A. Utilité en combat
- [ ] Le pouvoir a-t-il un effet réel et identifiable sur l’issue du combat ?
- [ ] Son rôle est-il distinct des autres pouvoirs ?
- [ ] Son effet est-il assez fort pour être remarqué, sans être injuste ou inutile ?
- [ ] Fonctionne-t-il dans des situations réalistes (cible proche/loin, mur, plusieurs boules, cible presque morte) ?
- [ ] Sa fréquence, sa durée et ses dégâts sont-ils adaptés à une vidéo d’environ 60 secondes ?
- **Note utilité :** /5
- **Verdict :** utile / situationnel / redondant / inutile.

### B. Beauté et impact visuel
- [ ] L’effet est-il spectaculaire dès son apparition ?
- [ ] Les formes, couleurs, particules et mouvements sont-ils soignés et cohérents avec le style BallYstik ?
- [ ] L’animation a-t-elle une montée, un impact et une fin lisibles ?
- [ ] L’effet se distingue-t-il visuellement des autres pouvoirs ?
- [ ] Évite-t-il le bruit visuel excessif, les flashs agressifs ou le masquage des boules ?
- **Note visuelle :** /5
- **Observation :** ce qui attire l’œil / ce qui manque.

### C. Compréhension immédiate
- [ ] Peut-on deviner ce que fait le pouvoir en le regardant sans explication ?
- [ ] L’origine de l’effet et sa cible sont-elles identifiables ?
- [ ] La relation cause → effet est-elle claire ?
- [ ] Le résultat correspond-il au nom et à l’animation ?
- [ ] Le pouvoir peut-il être compris sans audio et sans lire un long texte ?
- **Note compréhension :** /5
- **Interprétation probable du spectateur :** une phrase.

### D. Lisibilité TikTok / téléphone
- [ ] L’effet reste-t-il lisible dans l’arène verticale 9:16 sur un écran de téléphone ?
- [ ] Est-il visible à une taille réduite, sans zoomer ?
- [ ] Les boules, leurs couleurs et leurs PV restent-ils visibles ?
- [ ] L’effet est-il assez long pour être compris, sans être trop lent ?
- [ ] Les bords de l’arène, les HUD ou les autres effets ne le masquent-ils pas ?
- **Note lisibilité mobile :** /5.

### E. Rythme et rétention
- [ ] Crée-t-il un moment marquant, une surprise ou un retournement de situation ?
- [ ] Peut-il susciter une réaction (« oh ! »), de la tension ou l’envie de voir la suite ?
- [ ] Est-il visuellement différent des événements déjà présents dans la vidéo ?
- [ ] Son activation arrive-t-elle avec un signal suffisant pour que le spectateur la remarque ?
- [ ] Évite-t-il les longues phases sans action ou les effets répétitifs ?
- **Note impact vidéo :** /5
- **Potentiel de rétention :** faible / moyen / fort, avec justification.

### F. Fiabilité et finition
- [ ] Se déclenche-t-il de façon fiable dans le scénario prévu ?
- [ ] La conséquence de gameplay est-elle vérifiable, et pas seulement décorative ?
- [ ] Se termine-t-il correctement (pas d’effet bloqué, fantôme ou persistant) ?
- [ ] Gère-t-il correctement les murs, les collisions, la mort d’une boule et la fin du combat ?
- [ ] N’engendre-t-il pas d’erreur JavaScript ou de régression ?
- **État technique :** PASS / À CORRIGER / BLOQUÉ / NON TESTÉ.

### G. Originalité et valeur dans le catalogue
- [ ] Apporte-t-il une expérience différente d’un autre pouvoir ?
- [ ] Son identité est-elle mémorable ?
- [ ] Le catalogue gagnerait-il quelque chose à le conserver ?
- [ ] Existe-t-il une façon plus simple et plus claire d’obtenir le même résultat ?
- **Note originalité :** /5
- **Comparaison :** pouvoir le plus proche et différence réelle.

## Pondération du score final

Calculer une note sur 100 à partir des notes /5 :
- Utilité en combat : **20 %**
- Beauté / impact visuel : **20 %**
- Compréhension immédiate : **20 %**
- Lisibilité mobile : **15 %**
- Rythme / rétention : **15 %**
- Originalité : **10 %**

La fiabilité technique est un **verrou séparé**, pas une note compensable : un pouvoir qui plante ou dont l’effet principal ne fonctionne pas ne peut pas recevoir une recommandation « conserver tel quel », même si son visuel est beau.

Si une catégorie est NON ÉVALUÉE, ne pas calculer un score final définitif. Indiquer « audit incomplet ».

## Règles de décision

- **80–100 : CONSERVER** — fort, lisible et utile ; retouches mineures possibles.
- **65–79 : AMÉLIORER** — bonne idée, mais un ou deux défauts empêchent son plein potentiel.
- **45–64 : REVOIR** — utilité, lisibilité ou originalité trop faibles ; simplifier ou repenser.
- **0–44 : REMPLACER / SUPPRIMER** — apporte peu de valeur ou fait doublon, après confirmation par observation.
- **Toute panne technique majeure : CORRIGER AVANT DÉCISION FINALE.**
- Ces seuils guident la décision ; ils ne remplacent pas les preuves et le jugement qualitatif.

## Protocole d’observation pour chaque pouvoir

1. Lire son code et sa description pour comprendre l’intention, sans confondre l’intention avec le résultat réel.
2. L’isoler et le déclencher dans un scénario reproductible.
3. Observer une séquence complète : signal, activation, impact, conséquence, fin.
4. Capturer l’effet à son meilleur moment et à l’échelle d’un téléphone 9:16.
5. Vérifier le résultat gameplay (PV, position, vitesse, bouclier, invocation ou état pertinent).
6. Regarder la séquence sans audio et, si possible, sans le nom du pouvoir affiché ; noter ce qu’un spectateur pourrait croire qu’il se passe.
7. Comparer avec les pouvoirs proches pour repérer les doublons.
8. Appliquer la checklist, calculer le score si toutes les catégories sont évaluées et formuler une recommandation concrète.
9. Noter explicitement toute limite : effet non reproductible, capture manquante, comportement non observable ou jugement visuel encore incertain.

## Format du résumé individuel

Pour chaque pouvoir, produire ce résumé :

- **Nom / famille :**
- **Ce qu’il est censé faire :**
- **Ce qu’on voit réellement :**
- **Utilité en combat :** note /5 + justification
- **Beauté / impact visuel :** note /5 + justification
- **Compréhension immédiate :** note /5 + interprétation probable du spectateur
- **Lisibilité mobile :** note /5 + défaut éventuel
- **Impact vidéo / rétention :** note /5 + justification
- **Originalité :** note /5 + comparaison
- **Fiabilité technique :** statut + preuve
- **Score global :** /100 ou audit incomplet
- **Problème principal :** une phrase concrète
- **Correction prioritaire :** action précise
- **Décision :** conserver / améliorer / revoir / remplacer / supprimer
- **Confiance :** élevée / moyenne / faible, selon la qualité des preuves

## Tableau de suivi des 24 pouvoirs

Tous les pouvoirs commencent en **NON ÉVALUÉ**. Ne jamais remplir des notes à partir du nom ou du code seul.

| Famille | Pouvoir | Statut | Score /100 | Décision |
|---|---|---|---:|---|
| À distance | Rayon du Jugement | NON ÉVALUÉ | — | — |
| À distance | Chasseur Stellaire | NON ÉVALUÉ | — | — |
| À distance | Billard Fantôme | NON ÉVALUÉ | — | — |
| Impact | Nova Sismique | NON ÉVALUÉ | — | — |
| Impact | Bélier Titan | NON ÉVALUÉ | — | — |
| Impact | Détonateur Zéro | NON ÉVALUÉ | — | — |
| Zone | Faille Magmatique | NON ÉVALUÉ | — | — |
| Zone | Prison de Givre | NON ÉVALUÉ | — | — |
| Zone | Brouillard Toxique | NON ÉVALUÉ | — | — |
| Contrôle | Singularité | NON ÉVALUÉ | — | — |
| Contrôle | Polarité Inversée | NON ÉVALUÉ | — | — |
| Contrôle | Distorsion Temporelle | NON ÉVALUÉ | — | — |
| Mobilité | Fantôme Éclair | NON ÉVALUÉ | — | — |
| Mobilité | Portail Miroir | NON ÉVALUÉ | — | — |
| Mobilité | Orbite Folle | NON ÉVALUÉ | — | — |
| Invocation | Multiplication | NON ÉVALUÉ | — | — |
| Invocation | Tourelle Sentinelle | NON ÉVALUÉ | — | — |
| Invocation | Essaim Vorace | NON ÉVALUÉ | — | — |
| Transformation | Colosse | NON ÉVALUÉ | — | — |
| Transformation | Surcharge Électrique | NON ÉVALUÉ | — | — |
| Transformation | Comète Ardente | NON ÉVALUÉ | — | — |
| Défense / Réactif | Dôme Réfractaire | NON ÉVALUÉ | — | — |
| Défense / Réactif | Miroir Vengeur | NON ÉVALUÉ | — | — |
| Défense / Réactif | Dernier Souffle | NON ÉVALUÉ | — | — |

## Résumé final du catalogue

Une fois les 24 audits terminés, fournir :
- les 5 meilleurs pouvoirs et pourquoi ;
- les pouvoirs les moins clairs ;
- les pouvoirs les moins spectaculaires ;
- les doublons ou rôles redondants ;
- les pouvoirs utiles mais trop discrets ;
- les corrections prioritaires classées par impact spectateur / effort ;
- une recommandation de catalogue : conserver, améliorer, fusionner ou supprimer chaque pouvoir.

**État initial honnête :** aucun pouvoir n’a encore été évalué selon cette grille. Les résultats doivent être renseignés après observation et test, pas supposés à partir de cette fiche.


## Première passe — revue statique du code (18 octobre 2026)

**Portée :** lecture du registre et de `js/arena/ability-powers.js`. Ce n'est pas encore une validation visuelle en navigateur. Les notes de beauté, compréhension réelle sur téléphone et rétention restent **NON ÉVALUÉES** jusqu'à observation des effets.

### Fiches initiales par pouvoir

| Pouvoir | Ce que le code fait actuellement | Point à vérifier en priorité |
|---|---|---|
| Rayon du Jugement | Charge sur une cible proche puis tire un rayon très bref ; peut toucher jusqu'à deux ennemis alignés. | Le rayon reste-t-il visible assez longtemps sur mobile ? La charge est-elle évidente ? |
| Chasseur Stellaire | Tire un projectile qui poursuit une cible et inflige des dégâts avec explosion. | L'effet de poursuite est-il visible, et l'explosion distingue-t-elle ce pouvoir des autres tirs ? |
| Billard Fantôme | Tire trois projectiles violets avec rebonds muraux. | Les rebonds sont-ils assez lisibles pour qu'on comprenne qu'ils sont volontaires ? Vérifier le comportement aux murs. |
| Nova Sismique | Onde circulaire immédiate, dégâts et forte poussée. | Bon potentiel de lecture immédiate ; vérifier que l'onde se distingue des autres explosions. |
| Bélier Titan | Accélère vers la cible la plus proche et blesse au contact. | Vérifier qu'il touche réellement sa cible et que la vitesse revient toujours à la normale. |
| Détonateur Zéro | Mémorise la position du lanceur au début d'une charge de 0,8 s, puis explose à cet endroit. | Le lanceur peut s'éloigner pendant la charge : vérifier que le spectateur comprend pourquoi l'explosion ne le suit pas. |
| Faille Magmatique | Dépose une zone brûlante à intervalles réguliers pendant le déplacement. | Risque d'accumulation visuelle : vérifier que les fissures restent distinctes des boules et des autres zones. |
| Prison de Givre | Place une zone sur la cible la plus proche ; applique un ralentissement et réduit ponctuellement sa vitesse. | Le code ne fige pas la cible : vérifier que l'animation et la description ne promettent pas une vraie prison. |
| Brouillard Toxique | Laisse des zones vertes successives qui infligent des dégâts et posent un effet de poison. | Vérifier que le poison et les dégâts sont perceptibles sans audio, sans recouvrir les boules. |
| Singularité | Crée un trou noir temporaire qui attire les ennemis et inflige de faibles dégâts périodiques. | Le mouvement d'aspiration doit être perceptible ; vérifier que l'effet n'est pas confondu avec une simple zone décorative. |
| Polarité Inversée | Applique à la cible une traction vers le lanceur avec une composante latérale pendant une courte durée. | Le code évoque davantage une traction magnétique qu'une inversion de polarité ; vérifier si la cause et l'effet se lisent clairement. |
| Distorsion Temporelle | Pendant 1,5 s, ralentit les ennemis à moins de 180 px ; anneaux dessinés autour du lanceur. | L'anneau doit communiquer la zone réellement affectée et le ralentissement doit être visible en mouvement. |
| Fantôme Éclair | Fait un dash très court vers la cible, avec une brève fenêtre d'invulnérabilité. | Vérifier que le déplacement est assez visible ; les rémanences dessinées doivent correspondre à la trajectoire réelle. |
| Portail Miroir | Téléporte la boule d'environ 190 px dans la direction opposée à la cible et affiche deux anneaux. | Vérifier que le saut de position et les deux points de sortie sont faciles à suivre dans une arène chargée. |
| Orbite Folle | Fait tourner rapidement la direction de déplacement et réduit les dégâts reçus pendant l'effet. | Le mouvement peut sembler imprévisible plutôt qu'orbital ; vérifier si le nom correspond à ce que l'on voit. |
| Multiplication | Crée deux leurres temporaires à faible PV qui imitent approximativement le mouvement. | Vérifier que les clones sont distincts de la vraie boule et que leur durée/disparition correspond à la description. |
| Tourelle Sentinelle | Pose une tourelle fixe pendant 4 s qui tire des projectiles peu puissants. | Vérifier la lisibilité de la tourelle et de ses tirs ; mesurer si elle influence suffisamment le combat. |
| Essaim Vorace | Six points tournent autour de la boule et blessent les ennemis proches à répétition. | Les six drones doivent être reconnaissables, pas seulement comme des particules ; vérifier la lisibilité à petite taille. |
| Colosse | Augmente le rayon de la boule de 60 %, réduit sa vitesse et les dégâts reçus pendant 3 s. | Vérifier que la taille accrue est évidente et que la boule ne se coince pas ou ne traverse pas les limites. |
| Surcharge Électrique | Déclenche des dégâts répétés à courte portée avec des éclairs dessinés autour du lanceur. | **Écart possible description/code :** le registre parle de décharges en chaîne, mais le rendu examiné dessine surtout des éclairs autour de la boule, pas de liaison électrique vers les cibles. À confirmer en simulation. |
| Comète Ardente | Accélère la boule et laisse une succession de petites zones de feu derrière elle. | Risque de surcharge visuelle avec de nombreuses zones très rapprochées ; vérifier l'impact réel des flammes. |
| Dôme Réfractaire | Réduit le prochain dégât reçu à 18 % de sa valeur, puis se brise. | Le bouclier doit être visiblement brisé au premier impact et la réduction doit être confirmée en combat. |
| Miroir Vengeur | Pendant une fenêtre courte, renvoie 75 % des dégâts à l'attaquant et réduit les dégâts reçus. | Vérifier que le retour de dégâts est visible et que le spectateur comprend qui a renvoyé le coup. |
| Dernier Souffle | À la mort, inflige une explosion autour de la boule éliminée. | **Disponibilité à confirmer :** son poids de registre vaut -1, donc il est exclu de la sélection aléatoire standard qui ignore les poids nuls ou négatifs. Vérifier s'il est volontairement réservé au spawn manuel ou s'il ne peut jamais apparaître en partie normale. |

### Anomalie détectée dans le test de fumée

Le test Playwright attend le texte **« 24 / 24 »**, mais le compteur de réglages ne compte que les pouvoirs activés avec un poids strictement supérieur à zéro. Comme **Dernier Souffle** est configuré avec un poids de **-1**, le compteur devrait afficher **23 / 24 actifs** au chargement. Il faut aligner le test sur la règle voulue : soit le pouvoir est exclu par conception et le test doit l'indiquer, soit son poids/comportement doit être revu. Cette incohérence est vérifiable par lecture du code ; le résultat du workflow actuel doit être relancé pour confirmer l'état CI actuel.

### État de cette passe

- Revue statique du comportement : **24/24 pouvoirs parcourus**.
- Notes de beauté, compréhension observée, lisibilité mobile et rétention : **NON ÉVALUÉES**.
- Tests visuels individuels Playwright : **pas encore présents**.
- Première anomalie à résoudre : compteur/test « 24 / 24 » contre le poids négatif de Dernier Souffle.
- Les observations ci-dessus sont des hypothèses de test fondées sur le code, pas des verdicts finaux sur le rendu.
