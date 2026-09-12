/**
 * Référentiels de la comptabilité — portés de `Comptabilite.dc.html`.
 *
 * Les écritures sont la seule source : la balance et les totaux du journal en sont dérivés par
 * agrégation, ils ne sont stockés nulle part. Le compte de résultat, lui, est saisi tel quel —
 * il porte un cumul depuis le 1er janvier que les écritures du seul mois ne permettraient pas
 * de reconstituer.
 */

export interface Option {
  readonly value: string;
  readonly label: string;
}

export const JOURNALS: readonly Option[] = [
  { value: 'TIT', label: 'TIT — Opérations titres' },
  { value: 'BQ', label: 'BQ — Banque' },
  { value: 'OD', label: 'OD — Opérations diverses' },
  { value: 'FR', label: 'FR — Frais et commissions' },
];

export const PERIODS: readonly Option[] = [
  { value: '2026-08', label: 'Août 2026' },
  { value: '2026-07', label: 'Juillet 2026' },
  { value: '2026-06', label: 'Juin 2026' },
  { value: '2026-T2', label: 'Trimestre 2 2026' },
];

export type EntryState = 'Validée' | 'À valider';

export interface EntryLine {
  readonly account: string;
  readonly name: string;
  readonly debit: number;
  readonly credit: number;
}

export interface Entry {
  readonly ref: string;
  readonly date: string;
  readonly journal: string;
  readonly label: string;
  /** Pièce d'origine : ordre, transfert, facture ou calcul automatique. */
  readonly origin: string;
  readonly state: EntryState;
  readonly lines: readonly EntryLine[];
}

export const ENTRIES: readonly Entry[] = [
  {
    ref: '2026-08-4471', date: '30/08', journal: 'TIT', label: 'Achat IGCRD 250 000 nominal',
    origin: 'ORD-2026-0836 · règlement J+2', state: 'Validée',
    lines: [
      { account: '3020', name: 'Titres obligataires — portefeuille', debit: 247625, credit: 0 },
      { account: '6270', name: 'Frais de transaction', debit: 210, credit: 0 },
      { account: '5120', name: 'Banque — compte courant EUR', debit: 0, credit: 247835 },
    ],
  },
  {
    ref: '2026-08-4470', date: '30/08', journal: 'TIT', label: 'Vente EMEQ 5 000 parts',
    origin: 'ORD-2026-0839', state: 'Validée',
    lines: [
      { account: '5120', name: 'Banque — compte courant EUR', debit: 112504, credit: 0 },
      { account: '3010', name: 'Titres de participation — actions', debit: 0, credit: 108500 },
      { account: '7620', name: 'Plus-value de cession', debit: 0, credit: 4004 },
    ],
  },
  {
    ref: '2026-08-4469', date: '29/08', journal: 'BQ', label: 'Transfert de titres reçu',
    origin: 'TRF-2026-0113', state: 'Validée',
    lines: [
      { account: '3010', name: 'Titres de participation — actions', debit: 265860, credit: 0 },
      { account: '4670', name: 'Compte de liaison dépositaire', debit: 0, credit: 265860 },
    ],
  },
  {
    ref: '2026-08-4468', date: '28/08', journal: 'FR', label: 'Droits de garde août',
    origin: 'Facture dépositaire 8842', state: 'À valider',
    lines: [
      { account: '6220', name: 'Droits de garde', debit: 14380, credit: 0 },
      { account: '4010', name: 'Fournisseurs — dépositaire', debit: 0, credit: 14380 },
    ],
  },
  {
    ref: '2026-08-4467', date: '26/08', journal: 'OD', label: 'Provision coupon couru IGCRD',
    origin: 'Calcul automatique', state: 'Validée',
    lines: [
      { account: '3088', name: 'Intérêts courus non échus', debit: 31200, credit: 0 },
      { account: '7610', name: "Produits d'intérêts", debit: 0, credit: 31200 },
    ],
  },
  {
    ref: '2026-08-4466', date: '25/08', journal: 'FR', label: 'Commission de gestion T3 — provision',
    origin: 'Barème compte BGM-004', state: 'À valider',
    lines: [
      { account: '6210', name: 'Commissions de gestion', debit: 96200, credit: 0 },
      { account: '4680', name: 'Charges à payer', debit: 0, credit: 96200 },
    ],
  },
  {
    ref: '2026-08-4465', date: '22/08', journal: 'BQ', label: 'Encaissement dividende REIT',
    origin: 'DIV-2026-0198', state: 'Validée',
    lines: [
      { account: '5120', name: 'Banque — compte courant EUR', debit: 41820, credit: 0 },
      { account: '7630', name: 'Revenus de participations', debit: 0, credit: 49200 },
      { account: '4487', name: 'Retenue à la source récupérable', debit: 7380, credit: 0 },
    ],
  },
];

export const ENTRY_STATE_TINT: Readonly<Record<EntryState, { bg: string; fg: string }>> = {
  'Validée': { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  'À valider': { bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
};

export interface ResultRow {
  readonly label: string;
  readonly amount?: number;
  /** En-tête de section : pas de montant, pas de part. */
  readonly total?: boolean;
  readonly indent?: boolean;
  readonly subtotal?: boolean;
  readonly result?: boolean;
}

export const RESULT_ROWS: readonly ResultRow[] = [
  { label: 'Produits financiers', total: true },
  { label: 'Revenus de participations', amount: 214600, indent: true },
  { label: "Produits d'intérêts", amount: 186300, indent: true },
  { label: 'Plus-values nettes de cession', amount: 412800, indent: true },
  { label: 'Total des produits', amount: 813700, subtotal: true },
  { label: 'Charges', total: true },
  { label: 'Commissions de gestion', amount: -96200, indent: true },
  { label: 'Droits de garde', amount: -14380, indent: true },
  { label: 'Frais de transaction', amount: -8940, indent: true },
  { label: 'Retenues à la source non récupérables', amount: -12400, indent: true },
  { label: 'Total des charges', amount: -131920, subtotal: true },
  { label: 'Résultat de la période', amount: 681780, result: true },
];

/** Base de calcul des parts affichées en regard de chaque poste. */
export const TOTAL_PRODUITS = 813700;

export type CheckLevel = 'ok' | 'warn';

export interface Check {
  readonly label: string;
  readonly detail: string;
  readonly level: CheckLevel;
}

export const CHECKS: readonly Check[] = [
  { label: 'Équilibre débit / crédit', detail: 'Journal équilibré sur la période, écart nul.', level: 'ok' },
  { label: 'Rapprochement bancaire', detail: '5 comptes rapprochés, 1 écart de 420 € en suspens sur le compte collatéral.', level: 'warn' },
  { label: 'Rapprochement dépositaire', detail: 'Positions internes conformes aux positions dépositaire.', level: 'ok' },
  { label: 'Provisions de charges', detail: 'Commission T3 et droits de garde encore à valider.', level: 'warn' },
  { label: 'Écritures antidatées', detail: 'Aucune écriture postérieure à la date de clôture.', level: 'ok' },
];

export interface CloseTask {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly done: boolean;
  /** Un travail bloquant interdit la clôture tant qu'il n'est pas fait. */
  readonly blocking: boolean;
}

export const CLOSE_TASKS: readonly CloseTask[] = [
  { id: 'c1', label: 'Valider les écritures en attente', meta: '2 écritures à valider', done: false, blocking: true },
  { id: 'c2', label: 'Rapprocher les comptes bancaires', meta: 'Écart de 420 € sur le compte collatéral', done: false, blocking: true },
  { id: 'c3', label: 'Comptabiliser les coupons courus', meta: 'Fait le 26/08', done: true, blocking: false },
  { id: 'c4', label: 'Valoriser le portefeuille à la date de clôture', meta: 'Fait le 31/08', done: true, blocking: false },
  { id: 'c5', label: 'Contrôler les provisions de frais', meta: 'Commission T3 à confirmer', done: false, blocking: false },
  { id: 'c6', label: 'Éditer la liasse de clôture', meta: 'À produire après validation', done: false, blocking: false },
];

/** Montant en euros sans décimale, valeur absolue — le signe est porté à part. */
export function num(v: number): string {
  return Math.abs(v).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** Le signe négatif est un moins typographique, pas un trait d'union. */
export function eur(v: number): string {
  return `${v < 0 ? '−' : ''}${num(v)} €`;
}

export function periodLabel(value: string): string {
  return PERIODS.find((p) => p.value === value)?.label ?? PERIODS[0].label;
}
