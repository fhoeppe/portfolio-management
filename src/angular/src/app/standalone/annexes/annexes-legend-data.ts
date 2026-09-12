/** Porté depuis les constantes `GROUPS`/`LEG_GROUP`/`OPT_GROUP` de `Legendes.dc.html`. */

import { LIGHT_NATURE_TINT, NATURES } from '../../pages/transactions/transactions-data';

export type LegendRowKind = 'chip' | 'swatch' | 'text' | 'code';
export type LegendGroupKey = 'states' | 'colors' | 'symbols' | 'terms' | 'legs' | 'codes';

export interface LegendRow {
  readonly kind: LegendRowKind;
  readonly label: string;
  readonly bg?: string;
  readonly fg?: string;
  readonly meaning: string;
  readonly where: string;
}

export interface LegendGroup {
  readonly key: LegendGroupKey;
  readonly title: string;
  readonly note: string;
  readonly rows: readonly LegendRow[];
}

const GREEN_BG = 'rgba(15,118,110,0.12)';
const GREEN_FG = 'var(--ink-ok-2)';
const AMBER_BG = 'rgba(180,83,9,0.12)';
const AMBER_FG = 'var(--ink-warn-2)';
const BLUE_BG = 'rgba(0,61,165,0.10)';
const BLUE_FG = 'var(--ink-brand-2)';
const GREY_BG = 'var(--color-neutral-200)';
const GREY_FG = 'var(--color-neutral-700)';

export const GROUPS: readonly LegendGroup[] = [
  {
    key: 'states',
    title: 'États des comptes',
    note: 'Page Comptes · ordre du cycle de vie',
    rows: [
      { kind: 'chip', label: 'Projet', bg: '#f5d90a', fg: 'var(--ink-5c4700)', meaning: "Saisie de création en cours : le compte n'existe pas encore dans le référentiel.", where: 'Onglet Gérer compte, parcours de création' },
      { kind: 'chip', label: 'En ouverture', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)', meaning: 'Entrée en relation engagée, dossier KYC ou convention non finalisé.', where: 'Aucun ordre possible avant la première dotation' },
      { kind: 'chip', label: 'Actif', bg: 'var(--field-ok)', fg: '#ffffff', meaning: 'Compte en gestion, opérations et versements autorisés.', where: 'Liste des comptes, fiche compte, cycle de vie' },
      { kind: 'chip', label: 'Gelé', bg: 'var(--field-warn)', fg: '#ffffff', meaning: 'Mouvements suspendus sur instruction (succession, décision de conformité).', where: 'Les frais de gestion continuent de courir' },
      { kind: 'chip', label: 'En clôture', bg: GREY_BG, fg: GREY_FG, meaning: 'Résiliation notifiée, liquidation des positions en cours.', where: 'Solde à transférer au compte désigné' },
      { kind: 'chip', label: 'Clôturé', bg: '#3f3b39', fg: '#ffffff', meaning: 'Relation terminée : positions liquidées, solde transféré, aucun mouvement possible.', where: 'Dernière étape du cycle de vie, comptes archivés' },
    ],
  },
  {
    key: 'states',
    title: 'États des documents',
    note: 'Page Documents',
    rows: [
      { kind: 'chip', label: 'Validé', bg: GREEN_BG, fg: GREEN_FG, meaning: 'Métadonnées contrôlées et pièce classée définitivement.', where: 'Gestion documentaire, revue des métadonnées' },
      { kind: 'chip', label: 'À revoir', bg: AMBER_BG, fg: AMBER_FG, meaning: 'Métadonnée manquante ou incohérente à corriger avant classement.', where: 'Onglet Revue et métadonnées' },
      { kind: 'chip', label: 'En saisie', bg: BLUE_BG, fg: BLUE_FG, meaning: 'Document déposé, parcours de saisie non terminé.', where: 'Onglet Nouveau document, stepper en cours' },
      { kind: 'chip', label: 'Archivé', bg: GREY_BG, fg: GREY_FG, meaning: 'Pièce conservée pour la durée légale, hors circuit courant.', where: 'Gestion documentaire, filtre Archivés' },
    ],
  },
  {
    key: 'states',
    title: 'États de réconciliation',
    note: 'Page Réconciliation',
    rows: [
      { kind: 'chip', label: 'Rapproché', bg: GREEN_BG, fg: GREEN_FG, meaning: "Saisie de l'application identique au rapport broker.", where: 'Onglets Titres et Liquidité' },
      { kind: 'chip', label: 'Écart à traiter', bg: AMBER_BG, fg: AMBER_FG, meaning: 'Différence constatée, ni justifiée ni escaladée.', where: "Alimente le compteur d'écarts et le badge de l'onglet" },
      { kind: 'chip', label: 'En attente de dénouement', bg: BLUE_BG, fg: BLUE_FG, meaning: 'Écart explicable par une opération non encore dénouée (J+2).', where: "N'est pas compté comme écart ouvert" },
      { kind: 'chip', label: 'Justifié', bg: GREY_BG, fg: GREY_FG, meaning: 'Cause identifiée et documentée, correction planifiée.', where: 'Journal de réconciliation' },
      { kind: 'chip', label: 'Escaladé', bg: AMBER_BG, fg: AMBER_FG, meaning: "Demande d'investigation transmise au broker.", where: 'Reste compté comme écart ouvert' },
    ],
  },
  {
    key: 'states',
    title: 'Statuts des titres',
    note: 'Page Titres · état de position et de sélection',
    rows: [
      { kind: 'chip', label: 'En position', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)', meaning: 'Le titre est détenu dans au moins un portefeuille.', where: "Titres négociables, résultats, aperçu d'indice" },
      { kind: 'chip', label: 'Retenu', bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)', meaning: "Retenu dans l'univers d'investissement, jamais négocié.", where: "Titres négociables, résultats, aperçu d'indice" },
      { kind: 'chip', label: 'Position soldée', bg: 'rgba(124,92,191,0.16)', fg: 'var(--ink-alt)', meaning: "Plus détenu, mais présent dans l'historique des mouvements.", where: "Titres négociables, résultats, aperçu d'indice" },
      { kind: 'chip', label: 'Non retenu', bg: GREY_BG, fg: GREY_FG, meaning: "Hors univers d'investissement et jamais négocié.", where: "Titres négociables, résultats, aperçu d'indice" },
    ],
  },
  {
    key: 'states',
    title: 'États des transactions',
    note: 'Page Transactions',
    rows: [
      { kind: 'chip', label: 'Comptabilisé', bg: GREEN_BG, fg: GREEN_FG, meaning: 'Événement final : écriture comptable passée.', where: 'Tous les types de flux' },
      { kind: 'chip', label: 'Exécuté / Réglé', bg: GREEN_BG, fg: GREEN_FG, meaning: 'Ordre entièrement exécuté ou transfert dénoué.', where: 'Ordres, transferts' },
      { kind: 'chip', label: 'Partiel / Instruit', bg: BLUE_BG, fg: BLUE_FG, meaning: "Traitement en cours : exécution partielle, instruction émise.", where: 'Ordres, transferts' },
      { kind: 'chip', label: 'Rejeté / Détaché', bg: AMBER_BG, fg: AMBER_FG, meaning: "Refus de la contrepartie, ou coupon détaché en attente d'encaissement.", where: 'Transferts, dividendes' },
      { kind: 'chip', label: 'Annulé', bg: GREY_BG, fg: GREY_FG, meaning: 'Flux clos sans effet en portefeuille.', where: 'Ordres' },
    ],
  },
  {
    key: 'states',
    title: 'Gravité des anomalies',
    note: 'Tableau de bord',
    rows: [
      { kind: 'chip', label: 'Bloquante', bg: AMBER_BG, fg: AMBER_FG, meaning: "Empêche une opération ou expose à un dépassement : traitement immédiat.", where: 'Panneau Anomalies détectées, filtre Bloquantes' },
      { kind: 'chip', label: 'À traiter', bg: BLUE_BG, fg: BLUE_FG, meaning: 'À régler dans la journée ou la semaine, sans blocage immédiat.', where: 'Panneau Anomalies détectées, filtre À traiter' },
      { kind: 'chip', label: 'Surveillance', bg: GREY_BG, fg: GREY_FG, meaning: 'Point à suivre, sans échéance contraignante.', where: 'Panneau Anomalies détectées' },
    ],
  },
  {
    key: 'colors',
    title: 'Couleurs des vignettes',
    note: 'Règle commune à toutes les pages',
    rows: [
      { kind: 'swatch', label: 'Vert', bg: 'var(--band-ok)', fg: 'var(--ink-ok)', meaning: "Valeur favorable : performance positive, apport net, aucun écart. La teinte du chiffre s'intensifie avec l'ampleur.", where: 'Actifs sous gestion, performance, lignes rapprochées' },
      { kind: 'swatch', label: 'Rouge', bg: 'var(--band-warn)', fg: 'var(--ink-warn-2)', meaning: 'Valeur défavorable : performance négative, écart ouvert, anomalie. Le chiffre rougit avec le nombre ou le montant.', where: 'Anomalies ouvertes, écarts, retards' },
      { kind: 'swatch', label: 'Neutre', bg: '#ffffff', fg: 'var(--color-neutral-700)', meaning: 'Indicateur de volume sans jugement de valeur.', where: 'Nombre de lignes, devises suivies, part du total' },
    ],
  },
  {
    key: 'colors',
    title: "Couleurs de l'interface",
    note: 'Charte de navigation',
    rows: [
      { kind: 'swatch', label: 'Bleu foncé', bg: 'var(--field-brand)', fg: 'var(--ink-brand)', meaning: 'Bandeau, titres de panneaux, pictogrammes et liserés de structure.', where: "Toute l'application" },
      { kind: 'swatch', label: 'Bleu de marque', bg: 'var(--field-brand)', fg: 'var(--ink-brand-2)', meaning: 'Élément actif : onglet sélectionné, bouton principal, item de menu courant.', where: 'Onglets, segments, steppers' },
      { kind: 'swatch', label: 'Bleu léger', bg: 'rgba(0,61,165,0.08)', fg: 'var(--ink-brand)', meaning: 'Élément sélectionnable au repos, survol, ligne sélectionnée.', where: "Segments inactifs, en-têtes de colonnes, survols" },
      { kind: 'swatch', label: "Rouge d'alerte", bg: 'var(--field-warn)', fg: 'var(--ink-warn-2)', meaning: "Anomalies et liseré de l'item de menu sélectionné.", where: 'Panneau Anomalies, menu latéral' },
    ],
  },
  {
    key: 'states',
    title: 'Rang des comptes de liquidité',
    note: 'Page Comptes · onglet Gérer compte',
    rows: [
      { kind: 'chip', label: 'P', bg: 'var(--field-brand)', fg: '#ffffff', meaning: "Compte principal : il porte les mouvements d'espèces par défaut et ne peut pas être supprimé.", where: 'Toujours en tête de la liste des établissements bancaires' },
      { kind: 'chip', label: 'S', bg: 'var(--color-neutral-300)', fg: 'var(--color-neutral-800)', meaning: 'Compte secondaire : rattaché au compte titre, supprimable, promouvable en principal.', where: 'Le passage de S à P échange le rang avec le compte principal' },
    ],
  },
  {
    key: 'states',
    title: "Contrôle de l'IBAN",
    note: 'Clé de contrôle MOD-97',
    rows: [
      { kind: 'chip', label: '✓', bg: 'var(--field-ok)', fg: '#ffffff', meaning: "Clé conforme : l'IBAN satisfait le calcul MOD-97, le rattachement peut être enregistré.", where: 'Champ IBAN, comptes de liquidité' },
      { kind: 'chip', label: '!', bg: 'var(--field-warn)', fg: '#ffffff', meaning: "Clé non conforme : la saisie est refusée jusqu'à correction.", where: 'Champ IBAN, comptes de liquidité' },
    ],
  },
  {
    key: 'states',
    title: 'Nature des opérations sur une position',
    note: 'Positions · panneau Historique des transactions',
    rows: [
      { kind: 'chip', label: 'Achat', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)', meaning: "Ouverture ou renforcement d'un lot : la position augmente, la trésorerie diminue.", where: 'Journal des transactions' },
      { kind: 'chip', label: 'Vente', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)', meaning: 'Cession totale ou partielle : referme le lot et dégage un P/L réalisé.', where: 'Journal des transactions' },
      { kind: 'chip', label: 'Dividende', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)', meaning: 'Revenu encaissé sur la position, sans effet sur la quantité détenue.', where: 'Journal des transactions' },
      { kind: 'chip', label: 'Division', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)', meaning: 'Division ou regroupement du nominal : la quantité change, la valorisation reste neutre.', where: 'Journal des transactions' },
    ],
  },
  {
    key: 'states',
    title: 'Nature des transactions',
    note: 'Page Transactions · colonne Nature (mêmes jetons que NATURES, transactions-data.ts)',
    rows: [
      { kind: 'chip', label: NATURES.TRADE.label, bg: NATURES.TRADE.bg, fg: NATURES.TRADE.fg, meaning: NATURES.TRADE.desc, where: 'Colonne Nature du registre' },
      { kind: 'chip', label: NATURES.CORPORATE.label, bg: NATURES.CORPORATE.bg, fg: NATURES.CORPORATE.fg, meaning: NATURES.CORPORATE.desc, where: 'Colonne Nature du registre' },
      { kind: 'chip', label: NATURES.TRANSFER.label, bg: NATURES.TRANSFER.bg, fg: NATURES.TRANSFER.fg, meaning: NATURES.TRANSFER.desc, where: 'Colonne Nature du registre' },
      { kind: 'chip', label: NATURES.CASHFLOW.label, bg: NATURES.CASHFLOW.bg, fg: NATURES.CASHFLOW.fg, meaning: NATURES.CASHFLOW.desc, where: 'Colonne Nature du registre' },
    ],
  },
  {
    key: 'states',
    title: 'Objet des transactions',
    note: 'Page Transactions · colonne Objet',
    rows: [
      { kind: 'chip', label: 'Titre', bg: 'var(--tx-titre-bg)', fg: 'var(--ink-brand-2)', meaning: 'Opération sur titre : la poche touchée est une ligne de portefeuille.', where: 'Colonne Objet du registre' },
      { kind: 'chip', label: 'Trésorerie', bg: 'var(--tx-treso-bg)', fg: 'var(--ink-magenta)', meaning: "Mouvement d'espèces : la poche touchée est un compte de liquidité.", where: 'Colonne Objet du registre' },
    ],
  },
  {
    key: 'symbols',
    title: 'Repères des positions',
    note: 'Page Positions',
    rows: [
      { kind: 'text', label: '3', meaning: 'Numéro de lot : nombre de fois où la position a été ouverte sur le compte. Le lot en cours est le dernier.', where: "Colonne Lot de l'inventaire et journal des transactions" },
      { kind: 'text', label: '⠿', meaning: 'Grip 3 × 3 : saisir pour réorganiser les comptes de l\'inventaire par glisser-déposer.', where: 'Panneaux de compte, inventaire' },
      { kind: 'text', label: '⇔', meaning: "Poignée de redimensionnement d'un panneau latéral : glisser pour élargir ou rétrécir.", where: 'Panneaux Historique de la position et Récapitulatif' },
      { kind: 'text', label: '⌖', meaning: 'Épingle : maintient le panneau latéral ouvert malgré un clic à l\'extérieur.', where: 'Panneaux latéraux' },
    ],
  },
  {
    key: 'colors',
    title: "Courbes du graphique d'évolution",
    note: 'Positions · Évolution du portefeuille',
    rows: [
      { kind: 'swatch', label: 'Bleu', bg: 'var(--field-brand)', meaning: 'CTO Bourse Direct.', where: 'Une couleur par compte, reprise dans la légende et le sélecteur de compte' },
      { kind: 'swatch', label: 'Vert', bg: 'var(--field-ok)', meaning: 'CTO Degiro.', where: 'Une couleur par compte' },
      { kind: 'swatch', label: 'Ambre', bg: 'var(--field-warn)', meaning: 'PEA Bourse Direct.', where: 'Une couleur par compte' },
    ],
  },
  {
    key: 'symbols',
    title: 'Symboles et pictogrammes',
    note: 'Repères de lecture',
    rows: [
      { kind: 'text', label: '✓', meaning: 'Étape franchie dans un stepper ou contrôle conforme.', where: "Documents, Opération sur titre, cycle de vie du compte" },
      { kind: 'text', label: '+ / −', meaning: 'Sens de la variation ; le signe moins typographique (−) est employé pour les valeurs négatives.', where: 'Performances, écarts, montants' },
      { kind: 'text', label: '|', meaning: 'Trait vertical sur une barre : cible ou limite contractuelle à ne pas dépasser.', where: 'Allocation, contraintes du compte' },
      { kind: 'text', label: '6', meaning: 'Badge de comptage sur un item de menu : éléments ouverts ou à traiter.', where: 'Comptes, Positions, Titres, Opération sur titre' },
      { kind: 'text', label: '◉', meaning: 'Œil de la barre de contexte : masque ou révèle tous les montants en devise.', where: 'Barre de contexte' },
    ],
  },
  {
    key: 'terms',
    title: 'Vocabulaire métier',
    note: 'Termes employés dans les écrans',
    rows: [
      { kind: 'text', label: 'OST', meaning: 'Opération sur titre : événement affectant un titre détenu (dividende, division, fusion, droit de souscription, assemblée générale).', where: 'Menu Opération sur titre' },
      { kind: 'text', label: 'Lot', meaning: 'Une ouverture de position sur un compte. Un lot se referme à la cession complète ; racheter le même titre ouvre un nouveau lot.', where: 'Positions, inventaire et historique' },
      { kind: 'text', label: 'PRU', meaning: "Prix de revient unitaire : coût moyen d'acquisition d'un titre, frais inclus.", where: 'Inventaire des positions' },
      { kind: 'text', label: 'MOD-97', meaning: "Algorithme de contrôle de la clé d'un IBAN (norme ISO 13616).", where: 'Comptes, saisie des comptes de liquidité' },
      { kind: 'text', label: 'YTD', meaning: "Year to date : depuis le 1ᵉʳ janvier de l'exercice en cours.", where: 'Tableau de bord, Positions' },
      { kind: 'text', label: 'Bande', meaning: "Tolérance autour de l'allocation cible ; au-delà, un rééquilibrage est requis.", where: 'Tableau de bord, Comptes' },
      { kind: 'text', label: 'Dénouement', meaning: 'Livraison des titres contre paiement, généralement à J+2.', where: 'Transactions, Réconciliation' },
      { kind: 'text', label: 'Parité', meaning: "Rapport d'échange entre titre ancien et titre nouveau lors d'une fusion ou d'une division.", where: 'Opération sur titre' },
      { kind: 'text', label: 'Retenue à la source', meaning: 'Prélèvement fiscal opéré par le dépositaire sur un dividende ou un coupon.', where: 'Transactions, Comptabilité' },
      { kind: 'text', label: 'Écart', meaning: "Différence entre la saisie de l'application et le rapport fourni par le broker.", where: 'Réconciliation' },
      { kind: 'text', label: 'Univers', meaning: "Ensemble des titres autorisés à l'achat par le comité d'investissement.", where: 'Titres' },
    ],
  },
];

// Une teinte par nature, reprise telle quelle de LIGHT_NATURE_TINT (transactions-data.ts) —
// celle que porte désormais chaque badge Type sur la page Transactions elle-même. Assignée
// ligne à ligne ci-dessous plutôt que déduite du label : « TOUT + TIN » et « TRANSFER »
// (nom hérité du prototype pour le virement CASH) ne sont pas des codes de type réels.
const TRADE_TONE = LIGHT_NATURE_TINT.TRADE!;
const CORPORATE_TONE = LIGHT_NATURE_TINT.CORPORATE!;
const TRANSFER_TONE = LIGHT_NATURE_TINT.TRANSFER!;
const CASHFLOW_TONE = LIGHT_NATURE_TINT.CASHFLOW!;

export const LEG_GROUP: LegendGroup = {
  key: 'legs',
  title: 'Nombre de jambes par transaction',
  note: 'Annexe · une opération par effet dont le montant ne se déduit pas des autres',
  rows: [
    { kind: 'code', label: 'BUY', ...TRADE_TONE, meaning: "Achat de titres · nature TRADE · Le décaissement se déduit de quantité × prix + frais + taxe : aucune jambe d'espèces.", where: '1 opération' },
    { kind: 'code', label: 'SELL', ...TRADE_TONE, meaning: "Vente de titres · nature TRADE · L'encaissement se déduit de quantité × prix − frais − taxe.", where: '1 opération' },
    { kind: 'code', label: 'BUYOPT', ...CORPORATE_TONE, meaning: "Souscription par exercice de droits · nature CORPORATE · Comptabilisée comme un achat : le paiement se déduit des champs.", where: '1 opération' },
    { kind: 'code', label: 'SPLIT', ...CORPORATE_TONE, meaning: 'Division ou regroupement · nature CORPORATE · La parité fait tout ; une opération par compte détenteur, sous la même transaction.', where: '1 par compte' },
    { kind: 'code', label: 'SPINOFF', ...CORPORATE_TONE, meaning: 'Scission · nature CORPORATE · Le coût de revient se répartit entre ligne mère et ligne reçue.', where: '1 opération' },
    { kind: 'code', label: 'MERGER', ...CORPORATE_TONE, meaning: "Fusion-absorption · nature CORPORATE · Le coût passe intégralement sur la ligne de l'absorbante.", where: '1 opération' },
    { kind: 'code', label: 'DIV', ...CORPORATE_TONE, meaning: "Dividende en numéraire · nature CORPORATE · Vit dans corporateActions : ni transactions ni cashOperations, le net se déduit de amount − tax.", where: '0 (champs à plat)' },
    { kind: 'code', label: 'DIVOPT', ...CORPORATE_TONE, meaning: 'Dividende optionnel sans rompu · nature CORPORATE · La parité tombe juste : titres seuls, coût total inchangé.', where: '1 opération' },
    { kind: 'code', label: 'DIVOPT', ...CORPORATE_TONE, meaning: "Dividende optionnel avec soulte · nature CORPORATE · La soulte ne se déduit de rien : jambe de titres + jambe d'espèces (sense = soulte).", where: '2 opérations' },
    { kind: 'code', label: 'TOUT', ...TRANSFER_TONE, meaning: "Transfert sortant hors périmètre · nature TRANSFER · Le compte d'arrivée n'est pas suivi : rien à apparier.", where: '1 opération' },
    { kind: 'code', label: 'TOUT + TIN', ...TRANSFER_TONE, meaning: "Transfert entre deux comptes suivis · nature TRANSFER · Départ et arrivée, éventuellement à des dates différentes ; supprimer une jambe supprime l'autre.", where: '2 opérations' },
    { kind: 'code', label: 'TIN', ...TRANSFER_TONE, meaning: 'Entrée depuis un établissement non suivi · nature TRANSFER · La saisie fournit le coût de base, qui devient le PRU d\'entrée.', where: '1 opération' },
    { kind: 'code', label: 'TRANSFER', ...TRANSFER_TONE, meaning: "Virement d'espèces entre comptes · nature TRANSFER · Débit à la source, crédit à l'arrivée : deux poches distinctes, aucune ne se déduit de l'autre.", where: '2 opérations' },
    { kind: 'code', label: 'DEPOSIT', ...CASHFLOW_TONE, meaning: "Versement d'espèces · nature CASHFLOW · Fait simple : une seule poche touchée.", where: '1 opération' },
    { kind: 'code', label: 'WITHDRAW', ...CASHFLOW_TONE, meaning: "Retrait d'espèces · nature CASHFLOW · Identique au versement, sens inverse.", where: '1 opération' },
    { kind: 'code', label: 'INTEREST', ...CASHFLOW_TONE, meaning: 'Intérêts sur liquidités · nature CASHFLOW · Aucun titre en jeu.', where: '1 opération' },
    { kind: 'code', label: 'FEE', ...CASHFLOW_TONE, meaning: "Frais et droits de garde · nature CASHFLOW · À distinguer des frais portés par une opération sur titres.", where: '1 opération' },
    { kind: 'code', label: 'LENDING', ...CASHFLOW_TONE, meaning: "Revenus de prêt de titres · nature CASHFLOW · Seule la commission est enregistrée ; le prêt lui-même n'est pas suivi.", where: '1 opération' },
    { kind: 'code', label: 'REFUND', ...CASHFLOW_TONE, meaning: 'Remboursement · nature CASHFLOW · La charge remboursée reste inscrite à sa date.', where: '1 opération' },
  ],
};

export const OPT_GROUP: LegendGroup = {
  key: 'legs',
  title: 'Transactions à nombre de jambes variable',
  note: 'Annexe · le nombre découle du fait, il ne se choisit pas',
  rows: [
    { kind: 'code', label: 'DIVOPT', ...CORPORATE_TONE, meaning: "Dividende optionnel — Une seule jambe quand la parité tombe juste ; deux dès qu'un rompu est réglé en espèces — la soulte ne se déduit d'aucun autre champ. Un journal ancien porte la soulte dans cashBalance de la jambe de titres, forme encore lue telle quelle.", where: '1 ou 2' },
    { kind: 'code', label: 'TOUT', ...TRANSFER_TONE, meaning: "Transfert sortant de titres — Une jambe si le compte d'arrivée n'est pas suivi ; deux dès que la contrepartie est un compte du journal, la jambe TIN étant alors appariée et supprimée avec elle.", where: '1 ou 2' },
    { kind: 'code', label: 'SPLIT', ...CORPORATE_TONE, meaning: "Division ou regroupement — Autant d'opérations que de comptes portant le titre : une décision de l'émetteur touche toutes les lignes, sous une même transaction.", where: '1 par compte' },
    { kind: 'code', label: 'SPINOFF', ...CORPORATE_TONE, meaning: 'Scission — Une jambe pour la ligne mère ; une seconde si la ligne créée entre sur un autre compte ou si une soulte règle les rompus.', where: '1, parfois 2' },
    { kind: 'code', label: 'MERGER', ...CORPORATE_TONE, meaning: "Fusion-absorption — Une jambe suffit quand la ligne reçue reste sur le même compte ; deux si une soulte en espèces complète la parité d'échange.", where: '1, parfois 2' },
    { kind: 'code', label: 'FEE', ...CASHFLOW_TONE, meaning: 'Frais — Une jambe de trésorerie seule, ou deux quand les frais accompagnent un mouvement de titres — la nature CASHFLOW couvre les deux journaux.', where: '1 ou 2' },
    { kind: 'code', label: 'LENDING', ...CASHFLOW_TONE, meaning: 'Prêt de titres — La commission seule, ou deux jambes si le prêt est suivi côté titres — le type couvre les deux journaux.', where: '1 ou 2' },
  ],
};
