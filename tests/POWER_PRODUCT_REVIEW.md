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
| Dernier Souffle | À la mort, inflige une explosion autour de la boule éliminée. | **Vérification corrigée :** le tuple du registre est ordonné `duration, weight`. Pour Dernier Souffle, la durée vaut `-1` (effet déclenché à la mort) et le poids vaut `4` ; il n'est donc pas exclu de la sélection aléatoire par son poids. |

### Anomalie détectée dans le test de fumée

**Faux positif corrigé :** le registre stocke `duration` avant `weight`. Dernier Souffle a une durée de `-1` (cohérente avec un déclenchement posthume) et un poids de `4`. Le compteur peut donc afficher `24 / 24 actifs` par défaut ; le test smoke existant est cohérent sur ce point. Aucun défaut de disponibilité n'est démontré par cette valeur.

### État de cette passe

- Revue statique du comportement : **24/24 pouvoirs parcourus**.
- Notes de beauté, compréhension observée, lisibilité mobile et rétention : **NON ÉVALUÉES**.
- Tests visuels individuels Playwright : **pas encore présents**.
- Ancienne alerte sur Dernier Souffle retirée : elle provenait d'une lecture erronée de l'ordre des champs `duration, weight`.
- Les observations ci-dessus sont des hypothèses de test fondées sur le code, pas des verdicts finaux sur le rendu.


## Deuxième passe — écarts code / promesse produit (18 octobre 2026)

Cette passe croise les descriptions du registre et les comportements de `js/arena/ability-powers.js`. Elle ne remplace pas l'observation visuelle en navigateur. Les points ci-dessous sont des écarts ou risques visibles dans le code, à confirmer en simulation avant toute modification.

### Anomalies et écarts prioritaires

| Priorité | Pouvoir | Constat dans le code | Risque spectateur / combat | Vérification à exécuter |
|---|---|---|---|---|
| P1 | Surcharge Électrique | La description promet des « décharges en chaîne », mais le comportement applique des dégâts aux ennemis proches du lanceur et le rendu dessine des éclairs autour de lui ; aucune chaîne visuelle de cible en cible n'apparaît dans ce fichier. | La promesse est plus spectaculaire que l'effet codé ; peut ressembler à une simple aura de dégâts. | Forcer deux ennemis proches et vérifier si l'éclair relie réellement plusieurs cibles. |
| P1 | Dôme Réfractaire | Le bouclier est consommé par le premier dégât positif, quelle que soit son importance ; il ne filtre pas les « grosses attaques ». Il réduit ce dégât à 18 %. | Une petite collision peut potentiellement consommer le bouclier malgré la description. | Comparer petite touche et gros impact ; vérifier la disparition visuelle. |
| P1 | Bélier Titan | Le lanceur prend une direction et une vitesse temporaire, mais sa trajectoire n'est pas corrigée explicitement vers la cible pendant la charge. Le contact doit se produire dans une fenêtre de 0,65 s. | Peut foncer à côté de la cible et paraître inefficace ou aléatoire. | Tester cible proche, latérale et mobile ; mesurer le taux d'impact. |
| P1 | Fantôme Éclair | Le dash dure 0,32 s ; la rémanence est dessinée depuis une position mémorisée avec des décalages de vitesse. | L'effet peut être trop bref ou les rémanences ne pas correspondre au chemin parcouru. | Capture vidéo, vérifier déplacement, invulnérabilité et retour de vitesse. |
| P1 | Portail Miroir | Le code téléporte la boule à l'opposé de la cible et dessine deux anneaux ; il ne crée pas de portail traversable. | Le nom peut suggérer un passage entre portails, alors qu'il s'agit d'une téléportation directe. | Regarder sans le nom : le spectateur comprend-il la téléportation ? |
| P1 | Orbite Folle | Le code fait tourner la direction de vitesse, mais la boule n'orbite pas autour d'un point ou d'un adversaire. | Le mouvement visible peut ne pas correspondre au mot « orbite ». | Filmer 1,2 s et juger si le mouvement se lit comme une rotation ou une trajectoire courbe. |
| P1 | Prison de Givre | Le code ralentit la cible et réduit ponctuellement sa vitesse, mais ne l'immobilise pas. | « Prison » peut surpromettre une immobilisation. | Mesurer la vitesse avant/après et vérifier le signal visuel du ralentissement. |
| P2 | Multiplication | Les doubles sont des leurres temporaires ; aucun lien visuel explicite n'identifie la vraie boule dans ce comportement. | Difficile de distinguer l'original des leurres dans un combat chargé. | Vérifier à l'échelle mobile si l'original est identifiable. |
| P2 | Tourelle Sentinelle | Les tirs infligent 6 dégâts toutes les 0,8 s ; la tourelle est représentée surtout par un anneau et quatre traits. | Elle peut être confondue avec un marqueur décoratif et son impact sembler faible. | Vérifier la lisibilité de la tourelle, des tirs et des pertes de PV. |
| P2 | Essaim Vorace | Six éléments tournent autour de la boule ; le rendu n'inclut pas d'animation de piqué dédiée au moment des dégâts. | Peut se lire comme une aura orbitale plutôt qu'un essaim qui attaque. | Vérifier si le contact drone-cible est visible au moment des dégâts. |
| P2 | Singularité | La zone attire et inflige 2 dégâts par tick ; le rendu est un trou noir avec anneaux. | Peut sembler décorative si l'aspiration ne déplace pas nettement les cibles. | Comparer la trajectoire avec/sans pouvoir et mesurer l'attraction vers le centre. |
| P2 | Distorsion Temporelle | Le ralentissement affecte les ennemis à moins de 180 px ; le rendu affiche deux anneaux autour du lanceur. | Le périmètre est lisible, mais le ralentissement lui-même peut être imperceptible visuellement. | Comparer la vitesse d'une cible dedans puis dehors ; envisager une teinte/traînée dédiée. |
| P2 | Détonateur Zéro | Le point de détonation est mémorisé au début de la charge ; le lanceur peut se déplacer pendant les 0,8 s. | L'explosion peut se produire derrière le lanceur et sembler manquer sa cible. | Vérifier si le point reste marqué et si les cibles dans le rayon sont touchées. |

### Ordre recommandé pour les tests dynamiques

1. **Dernier Souffle** — disponibilité et activation à la mort.
2. **Dôme Réfractaire** — règle de consommation du bouclier.
3. **Bélier Titan** — taux de contact et vitesse après la charge.
4. **Surcharge Électrique** — chaîne électrique annoncée vs aura de proximité.
5. **Fantôme Éclair / Portail Miroir / Orbite Folle** — lisibilité des mouvements en vidéo.
6. **Prison de Givre / Distorsion Temporelle / Singularité** — preuve visuelle de l'effet sur les adversaires.
7. **Multiplication / Tourelle Sentinelle / Essaim Vorace** — identification des invocations et preuve de dégâts.

### Statut après cette passe

- Revue statique : **24/24 parcourus**.
- Écarts code/promesse listés : **14 points à vérifier**.
- Notes de beauté/compréhension sur téléphone : **NON ÉVALUÉES**, aucune capture vidéo n'a été revue.
- Tests individuels de déclenchement : **NON EXÉCUTÉS** dans cette passe ; le workflow smoke ne couvre pas les comportements de combat.
- Aucune note globale /100 n'est attribuée à ce stade.


## Troisième passe — conclusion de l'audit statique (18 octobre 2026)

### Vérification du faux positif Dernier Souffle

Le registre utilise l'ordre `duration, weight`. Pour `last_breath`, `duration = -1` et `weight = 4`. La sélection aléatoire filtre le poids et non la durée : **Dernier Souffle n'est donc pas exclu par le registre**. L'ancienne ligne P0 de la deuxième passe était erronée et est retirée. Il reste **13 risques code/promesse** listés dans le tableau ci-dessus.

### Contrôles exécutés

- Revue statique des 24 entrées du registre et des 24 comportements.
- Smoke Playwright : menu des 24 pouvoirs, groupes, réglages persistés et contrôles du combat.
- Tests comportementaux ciblés réussis dans Chromium : Dernier Souffle (explosion posthume), Dôme Réfractaire (réduction/consommation), Bélier Titan (déclenchement de charge) et Surcharge Électrique (dégâts à proximité).
- Workflow GitHub Actions : [run 39163652606 — succès](https://github.com/Riiddiimz/BallYstik/actions/runs/39163652606), commit testé `424c1307c3e687c45c483b04f76381048322af2b`.

### Verdict honnête

L'audit de code des **24/24 pouvoirs est terminé**. Les quatre tests ciblés ci-dessus passent, mais cela ne prouve pas à lui seul que chaque pouvoir est équilibré, qu'il se déclenche dans un vrai combat, ou que son animation est compréhensible sur téléphone. Les notes visuelles, la compréhension sans nom/audio et la rétention restent **NON ÉVALUÉES**, faute de captures/vidéos de chaque pouvoir effectivement observées. Ne pas présenter les 24 pouvoirs comme validés visuellement.

### Priorités de correction

1. **Surcharge Électrique** — soit implémenter une vraie chaîne visuelle de cible en cible, soit reformuler la promesse en aura électrique de proximité.
2. **Dôme Réfractaire** — aligner la règle « prochaine grosse attaque » sur le comportement réel ; aujourd'hui le premier dégât positif consomme le bouclier.
3. **Bélier Titan** — mesurer le taux d'impact sur cible mobile et vérifier la remise à la vitesse normale après la charge.
4. **Prison de Givre** — choisir entre un vrai gel temporaire et une description explicite de ralentissement.
5. **Fantôme Éclair / Portail Miroir / Orbite Folle** — capturer la séquence réelle pour vérifier la lecture des déplacements.
6. **Multiplication / Tourelle Sentinelle / Essaim Vorace** — rendre immédiatement identifiable la vraie boule, la tourelle et les attaques des drones.
7. **Singularité / Distorsion Temporelle / Détonateur Zéro** — prouver visuellement l'aspiration, le ralentissement et le point de détonation.

Aucun score sur 100 n'est attribué tant que les dimensions visuelles et de compréhension n'ont pas été observées.


## Quatrième passe — résultats individuels Playwright

Le [workflow Playwright 39164180097](https://github.com/Riiddiimz/BallYstik/actions/runs/39164180097) a réussi sur le commit `61c3f887627cc90bad89cdcbf614017dce7baa89` : **31 tests passés**, dont 24 scénarios individuels, un par pouvoir.

Les 24 comportements ont été activés dans des mondes isolés, leurs conséquences techniques principales ont été contrôlées, et leurs fonctions de rendu Canvas ont été appelées sans exception. Le premier passage avait révélé trois scénarios de test trop courts ou mal positionnés (zones pas encore déposées, cible au centre de la Singularité) ; ces scénarios ont été corrigés, puis les 24 tests ont réussi. Ces échecs initiaux étaient des défauts de configuration des tests, pas des bugs prouvés dans les pouvoirs.

**Interprétation :** fiabilité minimale du déclenchement et absence d'exception au rendu confirmées dans les scénarios simulés. Les visuels n'ont pas été notés : aucune vidéo/capture réelle par pouvoir n'a été examinée. Les 13 écarts code/promesse listés dans la deuxième passe restent à traiter comme risques produit prioritaires, pas comme 13 défauts tous confirmés visuellement.
