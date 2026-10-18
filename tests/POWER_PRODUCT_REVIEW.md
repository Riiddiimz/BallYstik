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
