# Process d’audit Playwright — pouvoirs BallYstik

Ce protocole est à appliquer **séparément aux 24 pouvoirs**, puis à rejouer après chaque modification d’un pouvoir. Il distingue les contrôles automatisables (présence, déclenchement, erreurs, traces visuelles) de la validation de lisibilité, qui exige de regarder les captures comme un spectateur sur téléphone.

## 1. Fiche obligatoire par pouvoir

Pour chaque pouvoir, remplir une fiche avec :
- **ID / nom / famille**
- **Promesse en une phrase** : ce que le spectateur doit comprendre immédiatement (« X frappe Y », « X ralentit Y », etc.).
- **Déclencheur** : comment et quand le pouvoir s’active.
- **Signal visuel avant activation** : avertissement, charge, projectile, animation de la boule, etc.
- **Conséquence visible** : dégâts, déplacement, immobilisation, protection, invocation, transformation…
- **Preuve** : capture avant, capture pendant, capture après; vidéo courte si le mouvement est essentiel.
- **Résultat** : PASS / À CORRIGER / BLOQUÉ, avec une note concrète.

## 2. Séquence standard à exécuter pour chaque pouvoir

1. **Préparer** — ouvrir la version locale servie par Playwright, viewport desktop puis viewport mobile 9:16 (390 × 844), vider les erreurs précédentes et repartir d’un combat neuf.
2. **Isoler** — désactiver les 23 autres pouvoirs, activer uniquement celui qui est audité. Vérifier que l’interface affiche le bon état et le bon compteur.
3. **Déclencher de façon déterministe** — utiliser le mécanisme de spawn/test du pouvoir si disponible. Si le pouvoir ne peut pas être forcé de façon reproductible, marquer le test « BLOQUÉ — déclencheur non déterministe » et noter ce qu’il faut exposer pour le rendre testable. Ne jamais conclure PASS parce qu’un pouvoir n’a simplement pas planté.
4. **Contrôler l’activation** — vérifier que le pouvoir s’active une fois, que le bon effet est attaché à la bonne boule/cible, et qu’aucune exception JavaScript ni erreur de console n’apparaît.
5. **Capturer** — enregistrer trois états : juste avant, au moment où l’effet est le plus visible, et après la conséquence. Pour les effets très brefs, conserver une vidéo Playwright ou plusieurs captures rapprochées.
6. **Contrôler la conséquence** — vérifier un résultat observable adapté au pouvoir : HP changés, cible déplacée/ralentie/gelée, bouclier visible, projectile ou invocation présent, état transformé, etc. Définir la mesure attendue dans la fiche avant d’exécuter le test.
7. **Contrôler la lisibilité mobile** — regarder les captures à taille de téléphone, sans audio : l’action et sa conséquence doivent être identifiables sans devoir lire un long texte. Le pouvoir ne doit pas être caché par les bords de l’arène, les HUD, les menus ou d’autres effets.
8. **Contrôler la durée** — l’avertissement, l’action et la conséquence doivent rester visibles assez longtemps pour être compris, sans effet persistant après sa durée prévue.
9. **Contrôler les collisions et la fin** — pas d’erreur quand la cible touche un mur/une autre boule, quand une boule meurt ou quand la partie se termine.
10. **Classer et corriger** — PASS uniquement si les vérifications techniques ET la revue visuelle passent. Sinon À CORRIGER (problème visuel/effet) ou BLOQUÉ (pas de déclenchement déterministe / conséquence impossible à observer).

## 3. Critères PASS

Un pouvoir est PASS seulement si toutes les cases suivantes sont confirmées :
- [ ] Le bon pouvoir est activé seul et son déclencheur est reproductible.
- [ ] Aucun crash ni erreur JavaScript/console.
- [ ] Son animation est réellement visible (pas uniquement une classe CSS ou une entrée dans le menu).
- [ ] La conséquence annoncée se produit et peut être vérifiée.
- [ ] La cible et l’origine de l’effet sont identifiables.
- [ ] L’effet est lisible en 9:16 sur un viewport de téléphone, sans audio.
- [ ] L’effet ne masque pas durablement les boules, PV ou limites de l’arène.
- [ ] L’effet se termine correctement et ne casse pas le combat.

## 4. Automatisation Playwright

Playwright doit produire des preuves et vérifier les invariants, mais ne peut pas décider seul si un humain comprend l’effet :
- **Automatique** : chargement, sélection/activation exclusive, absence d’erreurs, déclenchement reproductible, changement d’état mesurable, captures et vidéos, vérification mobile, absence de régression du menu.
- **Revue visuelle humaine obligatoire** : compréhension immédiate, contraste, hiérarchie visuelle, confusion avec les contacts normaux, durée perçue et lisibilité sans audio.
- **Interdit** : déclarer un pouvoir PASS seulement parce que le menu contient son nom, qu’une animation existe dans le code, ou que le test n’a pas échoué.

Chaque pouvoir doit avoir un scénario d’activation contrôlable par test. Si l’interface de test existante ne permet pas de le déclencher, ajouter un point d’entrée de test clairement séparé du comportement normal (par exemple une fonction de test exposée uniquement en mode test), plutôt que de dépendre d’une seed aléatoire.

## 5. Registre de suivi

Utiliser une ligne par pouvoir. Laisser le statut **NON AUDITÉ** jusqu’à l’exécution des contrôles techniques et de la revue des captures.

| Famille | Pouvoir | Statut | Preuve / défaut à noter |
|---|---|---|---|
| À distance | Rayon du Jugement | NON AUDITÉ | |
| À distance | Chasseur Stellaire | NON AUDITÉ | |
| À distance | Billard Fantôme | NON AUDITÉ | |
| Impact | Nova Sismique | NON AUDITÉ | |
| Impact | Bélier Titan | NON AUDITÉ | |
| Impact | Détonateur Zéro | NON AUDITÉ | |
| Zone | Faille Magmatique | NON AUDITÉ | |
| Zone | Prison de Givre | NON AUDITÉ | |
| Zone | Brouillard Toxique | NON AUDITÉ | |
| Contrôle | Singularité | NON AUDITÉ | |
| Contrôle | Polarité Inversée | NON AUDITÉ | |
| Contrôle | Distorsion Temporelle | NON AUDITÉ | |
| Mobilité | Fantôme Éclair | NON AUDITÉ | |
| Mobilité | Portail Miroir | NON AUDITÉ | |
| Mobilité | Orbite Folle | NON AUDITÉ | |
| Invocation | Multiplication | NON AUDITÉ | |
| Invocation | Tourelle Sentinelle | NON AUDITÉ | |
| Invocation | Essaim Vorace | NON AUDITÉ | |
| Transformation | Colosse | NON AUDITÉ | |
| Transformation | Surcharge Électrique | NON AUDITÉ | |
| Transformation | Comète Ardente | NON AUDITÉ | |
| Défense / Réactif | Dôme Réfractaire | NON AUDITÉ | |
| Défense / Réactif | Miroir Vengeur | NON AUDITÉ | |
| Défense / Réactif | Dernier Souffle | NON AUDITÉ | |

## 6. Rapport à produire après chaque passe

Le rapport doit contenir :
1. commit testé et navigateur/viewport ;
2. nombre de pouvoirs PASS / À CORRIGER / BLOQUÉ / NON AUDITÉ ;
3. liens vers captures/vidéos de chaque pouvoir ;
4. erreurs console et assertions échouées ;
5. défauts classés par impact sur la compréhension du spectateur ;
6. une action de correction précise pour chaque défaut.

**État initial :** les tests smoke actuels ne valident pas les animations et conséquences des 24 pouvoirs. Ne pas marquer de pouvoir PASS avant que son scénario individuel ait été exécuté et ses preuves revues.


## Passe exécutée — 18 octobre 2026

**Référence de code testée :** `424c1307c3e687c45c483b04f76381048322af2b`  
**Navigateur CI :** Chromium via Playwright, viewport par défaut du test.  
**Résultat du workflow :** [Playwright v2-power — succès](https://github.com/Riiddiimz/BallYstik/actions/runs/39163652606).

### Résultats réels

- **24/24** : revue statique du registre et des comportements terminée.
- **Smoke UI** : chargement, présence des 24 entrées, 8 familles, interaction/persistance des réglages et présence des contrôles principaux — réussi.
- **4 pouvoirs testés dynamiquement** : Dernier Souffle, Dôme Réfractaire, Bélier Titan et Surcharge Électrique — assertions ciblées réussies.
- **20 pouvoirs restants** : pas encore couverts par un test de conséquence individuelle dans Playwright.
- **24/24 pouvoirs** : validation visuelle mobile et compréhension sans audio **non réalisée** ; aucune note visuelle ne doit être inventée.

### Limite de validation

Le workflow ne doit pas être interprété comme un audit visuel complet : il n'a pas produit/revu une capture avant-pendant-après pour chacun des pouvoirs. Le statut produit final de chaque pouvoir reste **NON ÉVALUÉ** jusqu'à l'exécution du protocole complet de la section 2. La revue statique et les quatre tests comportementaux sont des éléments de preuve partiels, pas des PASS définitifs.
