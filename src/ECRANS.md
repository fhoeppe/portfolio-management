# Détail des écrans complémentaires

Complète le `README.md` pour les sept écrans de la section GESTION qui n'y sont que nommés.

## Trésorerie — `Tresorerie.dc.html`

Deux onglets.

**Vue d'ensemble** — soldes par compte, prévisionnel de trésorerie, points de vigilance (seuil minimum franchi), suggestions de placement du disponible. Vignettes teintées selon le signe.

**Nouvelle opération** — formulaire d'instruction de trésorerie. Le compte de rattachement précède le compte du broker ; s'il n'y en a qu'un, il est sélectionné et grisé. Frais et taxes en champs distincts, montants précédés du symbole de la devise du compte (la devise n'est jamais saisie : elle découle du compte).

Un bouton d'historique par ligne ouvre le panneau latéral partagé.

## Réconciliation — `Reconciliation.dc.html`

Rapprochement entre les données saisies dans l'application et les relevés fournis par les brokers.

Quatre vignettes : lignes rapprochées, écarts à traiter, en attente de dénouement, écarts espèces.

Rapprochement titres ligne à ligne avec quantité interne, quantité relevé, écart. Le pied de tableau ne somme pas les quantités — elles sont hétérogènes (parts et nominal) — mais affiche le décompte des lignes et le nombre d'écarts.

Rapprochement espèces séparé. Statuts : `matched`, `gap`, `pending`, `manual`, déclinés **par opération** et non seulement par transaction.

## Transactions — `Transactions.dc.html`

Deux onglets.

**Registre** — mat-table de 13 colonnes : chevron d'expansion, date, maillon (transaction multi-opérations), référence `TXN000000`, opération `000000` (colonne masquable par un bouton œil), objet (Titre / Trésorerie), nature, type, compte, titre ou poche, coût brut, coût net, règlement, état, édition.

Bandeau de mois inséré à chaque changement de mois : même hauteur qu'une ligne, fond bleu léger, dépliable sur une synthèse de cinq indicateurs (opérations, flux net, frais et taxes, en suspens, écarts) et les natures présentes en badges.

Rangée de filtres sous les en-têtes : autocomplétion sur référence, type, compte, titre ; menus multi-sélection avec « tout sélectionner » sur objet, nature, type ; plage de dates `mat-date-range-input` ; liste d'états.

Une ligne à plusieurs jambes se déplie sur un tableau imbriqué borné à la largeur du parent : numéro d'opération, rang, date, type, compte, titre, quantité, prix, frais, taxes, coût brut, coût net. La ligne dépliée **conserve sa couleur de sélection** ; plusieurs lignes peuvent l'être simultanément.

Le bouton œil de la barre ouvre un panneau latéral affichant la **structure JSON** de la transaction, en JetBrains Mono, coloration syntaxique. Seul un administrateur peut éditer une transaction.

**Nouvelle transaction** — sélection de la nature du fait puis du type d'opération en `mat-button-toggle-group`, aux couleurs du référentiel. Un encart annonce le nombre de jambes que le fait impose et pourquoi. Champs adaptés au type ; aperçu des jambes engendrées et de l'écriture comptable correspondante.

## Performance — `Performance.dc.html`

Trois onglets.

**Synthèse** — quatre vignettes, courbe de performance cumulée contre référence, contributions.

**Attribution** — décomposition de l'écart à la référence par classe d'actifs et par ligne : effet d'allocation, effet de sélection, total. Colonnes Portefeuille, Référence, Allocation, Sélection, Total.

**Historique détaillé** — carte « Résultat par année civile » : histogramme empilé bidirectionnel, cinq années. Au-dessus de l'axe, les composantes positives (plus-values, dividendes) ; en dessous, les négatives (moins-values, frais, taxes). Hauteurs 240 px au-dessus, 150 px en dessous.

Trame de niveaux en pointillé, valeurs affichées **à gauche** des barres. Les colonnes sont en retrait de 74 px à gauche et 20 px à droite pour ne pas recouvrir ces valeurs ; le cadre intérieur fait 694 px afin que les cinq colonnes tiennent sans défilement et que la trame couvre exactement la même boîte.

Curseur `mat-slider` dans l'en-tête : opacité du remplissage des barres, de 20 à 100 % par pas de 5, **25 % par défaut**. Les bordures gardent leur teinte pleine, donc le contour reste lisible à faible opacité.

Chaque segment porte une infobulle (composante, année, montant, part du total). Le placement est recalculé au survol : si l'espace au-dessus, mesuré depuis le premier ancêtre qui rogne, est inférieur à 52 px, l'infobulle bascule sous le segment.

Bandeau des années séparé du graphique : fond clair, bordure supérieure grise, chaque année cliquable pour mise en avant, résultat net affiché au-dessus du millésime.

Tableau de détail sous le graphique, une ligne par année : plus-values, moins-values, dividendes, frais, taxes, net. La ligne sélectionnée est mise en avant dans le graphique.

Props exposées : couleurs des cinq composantes, hauteurs, opacité initiale.

## Gestion du risque — `Simulation.dc.html`

Modèles de choc appliqués à un compte ou au portefeuille entier.

Bibliothèque de scénarios : chocs de marché (baisse actions, hausse des taux, écartement du crédit), chocs de change, chocs de liquidité, événements historiques (2008, 2020, 2022) et scénarios composites.

Pour chaque scénario : valeur avant, valeur après, delta en montant et en pourcentage, contribution par ligne. Un scénario historique documente l'événement de référence.

Bouton de réinitialisation en pictogramme seul.

## Comptabilité — `Comptabilite.dc.html`

Traduction comptable des opérations titres.

Classement IFRS 9 par instrument, doctrine de comptabilisation (date de négociation ou date de règlement), suspens de règlement aux comptes PCG 464 et 465, écritures produites par type d'opération.

Le suspens **ne se stocke pas** : il se déduit du couple de dates de l'opération. Une opération est en suspens à une date d'arrêté si elle est négociée et pas encore réglée. Solde projeté = solde réglé + à recevoir − à régler, soit 512 + 465 − 464.

Frais de transaction : en charges immédiates en juste valeur par résultat, incorporés au coût d'entrée dans les autres catégories.

## Documents — `Documents.dc.html`

Trois onglets.

**Gestion documentaire** — liste des documents, filtres, prévisualisation.

**Nouveau document** — stepper Material. Deux modes au premier pas : dépôt de fichier, qui déroule le parcours complet (dépôt, analyse OCR, analyse IA, métadonnées, contrôle) ; ou saisie manuelle, qui grise les étapes OCR et IA et présente un aperçu du PDF avec le formulaire de métadonnées.

**Revue et métadonnées** — liste complète : date d'émission, date de réception, échéance, référence du document, date de revue, type de document (original, copie, duplicata), nature du document (CNI, facture, relevé, avis d'opéré, convention…), émetteur, destinataire, compte rattaché, version.
