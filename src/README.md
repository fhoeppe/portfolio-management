# Passation — Portfolio Management

## Objet

Application de gestion de portefeuille titres pour investisseur particulier multi-comptes : suivi des positions, saisie des transactions et de leurs jambes comptables, réconciliation avec les relevés brokers, univers d'investissement autorisé, analyse de performance et référentiels réglementaires.

## Nature des fichiers livrés

Les fichiers de ce dossier sont des **références de conception écrites en HTML** — des prototypes qui montrent l'apparence et le comportement attendus, **non du code de production à reprendre tel quel**.

Le travail consiste à **recréer ces écrans dans l'environnement du codebase cible** en suivant ses conventions établies. Ici la cible est explicite : un projet **Angular avec Angular Material** (un squelette existe déjà sous `angular/src/app/` : `shell/`, `ui/`, plus les services `mic.data.ts`, `mic.model.ts`, `mic.service.ts`).

Point capital : les prototypes **imitent** Angular Material sans l'exécuter. Ils portent des attributs de forme (`mat-table`, `mat-select`, `mat-chip-grid`, `mat-slider`, `mat-expansion-panel`, `matTooltip`, `mat-button-toggle`) et reproduisent son apparence en CSS. À l'implémentation, il faut **instancier les vrais composants** de `@angular/material` — pas transposer le CSS.

## Fidélité

**Haute fidélité.** Couleurs, typographie, espacements, états d'interaction et libellés sont définitifs. Les écrans doivent être reproduits fidèlement avec les composants Material réels.

Les **données sont fictives et codées en dur** dans chaque composant. Aucun appel réseau. Les jeux d'essai sont à remplacer par les services du codebase, mais leurs **structures sont normatives** : elles décrivent le modèle de données attendu (voir « Modèle de données »).

## Architecture des prototypes

Chaque écran est un fichier `.dc.html` autonome : un gabarit HTML à trous `{{ }}` et une classe de logique qui expose ses valeurs. La coque `Navigation Sobre.dc.html` porte le bandeau, le menu latéral et le routage ; elle monte chaque page dans un panneau `data-page-panel`.

Correspondance à établir côté Angular :

| Prototype | Angular |
|---|---|
| `Nom.dc.html` | un composant `nom.component.ts` + template |
| classe de logique, `renderVals()` | propriétés du composant et getters |
| `<sc-for list="{{ x }}">` | `@for (item of x; track item)` |
| `<sc-if value="{{ x }}">` | `@if (x)` |
| `data-page-panel` + `showPage()` | `RouterOutlet` et routes |
| `<dc-import name="X">` | composant enfant |

## Écrans

19 écrans routés depuis le menu, groupés en trois sections.

### GESTION

**Tableau de bord** — `TableauDeBord.dc.html`
Point d'entrée par défaut. Sélecteur de compte, huit périodes (YTD, 1M, 3M, 6M, 1A, 3A, 5A, MAX). Bandeau de quatre vignettes teintées selon le signe (actifs sous gestion, performance, écart d'allocation, anomalies ouvertes). Section Anomalies pleine largeur en panneau dépliable, encadrée d'ambre. Puis, en panneaux dépliables : performance cumulée contre référence (SVG), allocation par classe d'actifs, indicateurs de risque, expositions, activité récente, principales positions.

**Comptes** — `Comptes.dc.html`
Trois onglets. *Liste des comptes* : six comptes clients, recherche, filtre d'état, encours, performance, gérant. *Détail du compte* : identité (14 champs), quatre indicateurs, cycle de vie en jalons, historique. *Gérer compte* : segment Création / Modification / Clôture, puis stepper Material de 7 étapes (Titulaires, Broker, Compte titre, KYC, Liquidité, Contrôle, Statut) avec panneau latéral récapitulatif.

**Positions** — `Positions.dc.html`
Quatre onglets. *Inventaire* : comptes en panneaux dépliables indépendants, tableau des lignes triable, graphique d'évolution avec légende en ligne, bascule Par portefeuille / Par positions. *Répartitions* : quatre vignettes avec barre empilée à 100 %. *Résultat*. *Synthèse*. Panneau latéral d'historique par ligne ou par compte, à onglets.

**Titres** — `Titres.dc.html`
Deux onglets. *Univers d'investissement* : tableau « Titres négociables » (ISIN, ticker, nom, place, devise, statut) avec filtres par colonne en autocomplétion, tri, groupement par statut, plus un second tableau « Titres suivis » **entièrement indépendant** (état, filtres et tri propres). *Recherche de titres* : indice de référence avec aperçu des composants en boîte de dialogue, critères de recherche, résultats en mat-table avec sélection multiple. Panneau latéral à deux onglets : fiche du titre, évaluation.

**Ordres** — `Ordres.dc.html`
Cinq onglets (Aperçu, Ordres, Transferts, Corporate Actions, Cashflows), chacun avec sa couleur. L'aperçu réunit quatre bandeaux en accordéon lié — un seul ouvert à la fois. Un bouton d'action ouvre une feuille de choix (`matBottomSheet`) : Créer un ordre, Initier un transfert, Notifier une Corporate Action, Initier un cashflow. Chacune ouvre un panneau latéral de saisie, redimensionnable, à deux sous-onglets (formulaire / jambes et comptabilité).

**Trésorerie** — `Tresorerie.dc.html` · **Réconciliation** — `Reconciliation.dc.html` · **Transactions** — `Transactions.dc.html` · **Performance** — `Performance.dc.html` · **Gestion du risque** — `Simulation.dc.html` · **Comptabilité** — `Comptabilite.dc.html` · **Documents** — `Documents.dc.html`

Détail de ces sept écrans : voir `ECRANS.md`.

### MARCHÉ

**Échéances** — `Echeances.dc.html` (deux badges : échéances du jour, à venir) · **Calendrier** — `Calendrier.dc.html` (vues semaine, mois, année ; événements et tâches).

### ADMINISTRATION

**Rapports** — `Rapports.dc.html` · **Paramètres** — `Parametres.dc.html` (quatre onglets : Préférences, Prélèvement à la source, Règlement-livraison, Places boursières) · **Annexes et légendes** — `Legendes.dc.html`.

Hors menu : **Guide** (9 onglets thématiques, ouvert par un bouton du bandeau), **Visionneuse Document**.

## Jetons de conception

### Couleurs

Le design system **Modernist** est lié sous `_ds/modernist-…/styles.css` ; toutes les couleurs neutres et de marque viennent de ses variables. L'application ajoute deux familles de variables, déclarées dans le `<style>` de chaque composant :

| Variable | Clair | Sombre | Rôle |
|---|---|---|---|
| `--ink-brand` | `#002a6e` | `#9db6d9` | encre de marque : titres, pictogrammes |
| `--ink-brand-2` | `#003da5` | `#8fb4ee` | encre de marque secondaire, focus |
| `--ink-ok` / `--ink-ok-2` | `#0b5f57` / `#0f766e` | `#5fd6c4` / `#4fd1c5` | valeurs favorables |
| `--ink-warn` / `--ink-warn-2` | `#8f3f06` / `#b45309` | `#f0a868` / `#f3b782` | alertes, anomalies |
| `--ink-alt` | `#5b3ea8` | `#c4b5fd` | référence, séries secondaires |
| `--ink-code` | `#3730a3` | `#a5b4fc` | badges de code |
| `--field-brand` | `#002a6e` | `#12325e` | **fond** sous texte clair |
| `--field-brand-hover` | `#003da5` | `#1a4179` | survol de ce fond |

Distinction essentielle : `--ink-*` s'éclaircit en mode nuit (c'est de l'encre), `--field-*` reste foncée (c'est un fond sous texte blanc). Confondre les deux rend le texte illisible en thème sombre.

Palette pastel du graphique annuel de Performance, réglable par props : gain `#8fd4c4`, perte `#e59289`, dividendes `#a8c5e8`, frais `#f0c9a0`, taxes `#e8b0a8`. Bordure de chaque segment = sa teinte assombrie à 68 % de luminosité.

### Typographie

- Interface : **Aptos**, replis `Aptos Display`, `Segoe UI Variable`, `Segoe UI`, `system-ui`, `sans-serif`.
- Code, badges de code et JSON : **JetBrains Mono**, replis `ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`, `monospace`.

Échelle : titre de page 18 px / 700 · titre de carte 14 px · onglet actif 14 px / 700, inactif 12 px / 400 · corps 12–13 px · libellé de champ 11 px / 600 · en-tête de colonne 12 px / 500 · sur-titre 10 px / 700, `letter-spacing: 0.05em`, capitales · badge 10–11 px / 700.

Tout nombre porte `font-variant-numeric: tabular-nums`.

### Espacements, rayons, ombres

Corps de page `16px 20px 24px` · en-tête `14px 20px 0` · cellule de tableau `0 12px`, première et dernière `0 16px` · rangée de tableau 34–38 px · hauteur de champ 30–32 px.

Rayons : carte et champ 6 px · badge de code 4 px · pastille 999 px · **jamais** au-delà de 8 px.

Bordures : filet interne `1px var(--color-neutral-200)` · contour de carte `1px var(--color-neutral-300)` · séparation d'en-tête `1px var(--ink-brand)`.

## Conventions d'interaction

Ces règles ont été établies écran par écran ; elles doivent être respectées partout.

**Onglets de page** — actif : 40 px de haut, fond `--field-brand`, texte blanc, 700. Inactif : 32 px, fond bleu 8 %, texte `--ink-brand`. Écart de 2 px, coins hauts arrondis, pictogramme à gauche, filet `--ink-brand` sous la rangée.

**Menu latéral** — item sélectionné : fond `--field-brand`, texte et pictogramme blancs, liseré gauche de 3 px en `#b45309`. Survol : bleu 10 %, jamais gris. Bande de sélection en retrait de 10 px. Sections (Gestion, Marché, Administration) dépliables, chevron à droite.

**Badges de compteur** — fond bleu clair, chiffre `--ink-brand` ; sur item sélectionné, fond blanc et chiffre bleu foncé pour rester lisible.

**Focus** — `border-color: var(--ink-brand-2)` plus `box-shadow: 0 0 0 1px rgba(0,61,165,0.34), 0 0 0 3px rgba(0,61,165,0.10)`. Jamais l'anneau bleu du navigateur.

**Menus déroulants** — ancrage mesuré : sous le champ si la place suffit, au-dessus sinon ; hauteur bornée à l'espace disponible ; recalage sur le bord droit près du bord de fenêtre. Un seul menu ouvert à la fois. Fermeture au clic extérieur et à Échap. Côté Angular, `MatSelect` et `MatMenu` gèrent cela nativement.

**Panneaux latéraux** — un composant partagé, `SidePanel.dc.html`, porte le chrome commun : en-tête coloré (pictogramme 34 px, titre, sous-titre), épingle qui bloque la fermeture par voile et par Échap, bouton de fermeture, poignée de redimensionnement à gauche (grip de points, 340 px à 75 % de la largeur), bandeau de pied avec Enregistrer et Annuler. À porter en `MatSidenav` ou `MatDialog` paramétré.

**Infobulles** — fond `#161514`, texte blanc, rayon 7 px, 12,5 px, flèche vers l'élément, **sans délai**. Placement recalculé au survol pour ne pas être coupé par un ancêtre en `overflow`. À remplacer par `matTooltip` avec `matTooltipShowDelay="0"`.

**Masquage des montants** — un bouton œil du bandeau floute toute valeur contenant un symbole monétaire, sur toutes les pages.

**Mode sombre** — chaque composant déclare un bloc `[data-theme="dark"]` qui inverse sa rampe de gris et éclaircit ses encres. `--surface` vaut `var(--theme-surface, #ffffff)` afin d'hériter du thème de la coque au lieu de l'écraser.

## Modèle de données

### Transaction et opérations

Le modèle central, documenté dans l'onglet Annexes : **une transaction porte la cause, ses opérations portent les effets**. Structure sérialisée, visible dans le panneau de détail du registre :

```json
{
  "id": 39,
  "owner": "Fabrice HOËPPE",
  "nature": "TRANSFER",
  "date": "2026-08-28",
  "time": "14:35",
  "lastModified": "2026-08-30",
  "comment": "Transfert interne vers Trade Republic",
  "operations": [
    {
      "id": 39, "sequence": 1, "date": "2026-08-28", "type": "TOUT",
      "platform": 1, "toPlatform": 3, "isin": "US0378331005",
      "quantity": 40, "price": 88.24, "fee": 0, "tax": 0
    }
  ]
}
```

Invariants à préserver :

- `id` **distinct par opération** ;
- `toPlatform` renseigné sur la jambe sortante d'un transfert, `null` sinon ;
- un transfert interne porte **le coût de base, jamais un cours** — sans quoi il produirait un résultat interdit (IFRS 9 §3.2.3) ;
- la somme des jambes d'un transfert vaut zéro.

Correspondance nature → types :

| Nature | Types |
|---|---|
| `TRADE` | BUY, SELL |
| `SUBSCRIPTION` | BUYOPT |
| `TRANSFER` | TOUT, TIN, TRANSFER |
| `CORPORATE` | SPLIT, SPINOFF, MERGER, DIV, DIVOPT |
| `CASHFLOW` | DEPOSIT, WITHDRAW, FEE, INTEREST, LENDING, REFUND |

Un ordre à cours limité dénoué en plusieurs exécutions produit **autant d'opérations que d'exécutions**.

### Statuts

*Position d'un titre* — cinq états : `held` En position · `settled` Position soldée · `watch` Retenu · `followed` Suivi · `never` Non retenu.

*Cycle de vie d'un compte* — six états : Projet, En ouverture, Actif, Gelé, En clôture, Clôturé. Les transitions autorisées dépendent de l'état courant (un compte actif se modifie ou se clôture ; un compte en ouverture reste en création).

*Réconciliation* — `matched`, `gap`, `pending`, `manual`, avec granularité par opération.

### Services de données

Cinq fichiers JavaScript portent les référentiels, à porter en services Angular :

| Fichier | Contenu | Service cible |
|---|---|---|
| `mic-registry.js` | 291 codes MIC ISO 10383 (281 marchés réglementés actifs sur 66 pays, plus XOFF et XXXX) — extrait de votre `mic.data.ts` | `MicService` existant |
| `places-service.js` | 21 places suivies : géographie, devise, fuseau IANA, séance, indice, cycle de dénouement, dépositaire | `PlacesService` |
| `withholding-rates.js` | retenues à la source par pays de source et de résidence, taux légal et conventionnel, groupés par continent | `WithholdingRatesService` |
| `securities-singleton.js` | titres et informations de marché | `SecuritiesService` |
| `annexe-data.js` | contenu documentaire des annexes | données statiques ou CMS |

`mic-registry.js` reprend l'API de votre `MicService` : `all()`, `getByMic()`, `getGroup()`, `byCountry()`, `search()`, plus `operators()`, `countries()`, `regulated()`.

## Composants Material à instancier

| Prototype | Angular Material |
|---|---|
| `mat-table`, `mat-header-row`, `mat-row`, `mat-sort-header` | `MatTableModule`, `MatSortModule` |
| `mat-select`, `mat-option`, `mat-form-field` | `MatSelectModule`, `MatFormFieldModule` |
| `mat-chip-grid`, `mat-chip-row`, `matChipRemove` | `MatChipsModule` |
| `mat-slider`, `matSliderThumb` | `MatSliderModule` |
| `mat-expansion-panel` | `MatExpansionModule` |
| `mat-button-toggle-group` | `MatButtonToggleModule` |
| `matTooltip` | `MatTooltipModule` |
| `matBadge` | `MatBadgeModule` |
| stepper horizontal | `MatStepperModule` |
| feuille d'actions | `MatBottomSheetModule` |
| sélecteur de date | `MatDatepickerModule` |
| plage de dates | `MatDateRangeInput` |
| `mat-checkbox` | `MatCheckboxModule` |
| panneau latéral | `MatSidenavModule` ou `MatDialog` |

Le thème Material doit être construit sur les couleurs ci-dessus : primaire `#002a6e`, accent `#003da5`, avertissement `#b45309`, avec palette sombre correspondante.

## Points de vigilance

Erreurs rencontrées pendant la conception, à ne pas reproduire :

1. **Encre contre fond** — utiliser une variable d'encre comme couleur de fond casse le mode sombre. Deux familles distinctes.
2. **Hauteurs en pourcentage** — une barre en `height: %` exige un parent à hauteur définie ; sans quoi elle se résout à zéro.
3. **Infobulle sur `<tr>`** — un élément de tableau n'établit pas de bloc conteneur fiable : un `::after` absolu y rend n'importe comment. Même remarque pour `filter` sur une rangée.
4. **Cadre défilant** — `overflow-x: auto` impose `overflow-y: auto`, donc rogne verticalement. Une infobulle en position absolue y est coupée.
5. **`colSpan`** — doit suivre le nombre réel de colonnes visibles, colonne masquée comprise.
6. **Tintes translucides** — se composer sur `var(--surface)` et non sur le fond du conteneur, sinon la surface disparaît.
7. **Tableaux jumeaux** — deux tableaux de même structure sur un écran doivent avoir des états séparés, données comprises, sinon filtrer l'un vide l'autre.

## Fichiers du dossier

- `README.md` — ce document
- `ECRANS.md` — détail des sept écrans non développés ci-dessus
- `*.dc.html` — les 25 prototypes
- `*.js` — les cinq services de données
- `_ds/` — le design system Modernist
- `Portfolio Management — maquette autonome.html` — la maquette entière en un fichier, ouvrable hors ligne

## Ce qui reste à faire

- brancher les cinq services sur des sources réelles ;
- définir la construction de la **référence de performance** : elle est aujourd'hui codée en dur (composite 60/40) ; trois voies possibles — sélecteur de référence, composite déduit des poids du mandat, ou service dédié ;
- instancier les vrais composants Material en lieu et place de leurs imitations ;
- rôles et permissions : seul un administrateur peut éditer une transaction du registre, règle posée mais non reliée à une authentification.
