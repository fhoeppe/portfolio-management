/**
 * Porté depuis `Performance.dc.html`. Données figées comme dans le prototype.
 *
 * Les mises en forme (`fr`, `pct`, `keur`, `eur`, `bps`, `tone`) sont reprises telles quelles :
 * elles sont partagées par les cinq onglets de l'écran et vivent donc ici plutôt que dans le
 * composant, qui ne garde que l'état et les vues calculées.
 */

/* ------------------------------------------------------------------ Mise en forme */

export function fr(v: number, d: number): string {
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Pourcentage signé. Le signe négatif est le vrai « − » (U+2212), comme dans le prototype. */
export function pct(v: number, d = 2): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr(Math.abs(v), d) + ' %';
}

/** Milliers d'euros : l'unité de tout l'onglet « Historique détaillé ». */
export function keur(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr(Math.abs(v), 0) + ' k€';
}

export function eur(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr(Math.abs(v), 0) + ' €';
}

/** Points de base : les écarts de performance se lisent en pb, pas en points de pourcentage. */
export function bps(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr(Math.abs(v) * 100, 0) + ' pb';
}

/**
 * Couleur d'un chiffre selon son signe. `invert` sert aux grandeurs où « moins » est bon
 * (volatilité, perte maximale) — le vert ne veut pas dire « positif » mais « favorable ».
 */
export function tone(v: number, invert = false): string {
  if (v === 0) return 'var(--color-text)';
  return (invert ? v < 0 : v > 0) ? 'var(--ink-ok)' : 'var(--ink-warn-2)';
}

export interface KpiTint {
  readonly bg: string;
  readonly ink: string;
  readonly value: string;
}

/**
 * Fond dégradé des cartouches : l'intensité suit l'ampleur du chiffre (plafonnée à 12 points),
 * la teinte son caractère favorable ou non. Repris tel quel du prototype, `oklch()` compris.
 */
export function kpiTint(v: number, invert = false): KpiTint {
  if (v === 0) return { bg: 'var(--surface)', ink: 'var(--color-neutral-700)', value: 'var(--color-text)' };
  const good = invert ? v < 0 : v > 0;
  const a = (0.1 + Math.min(1, Math.abs(v) / 12) * 0.06).toFixed(3);
  const hue = good ? 168 : 32;
  const layer = `oklch(0.62 ${a} ${hue} / ${a})`;
  return {
    bg: `linear-gradient(${layer}, ${layer}), var(--surface)`,
    ink: good ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
    value: good ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
  };
}

/* ------------------------------------------------------------------ Séries du graphique */

export type PeriodKey = 'm1' | 'm3' | 'm6' | 'ytd' | 'y1' | 'y3' | 'y5' | 'max';

export interface Serie {
  readonly label: string;
  readonly ticks: readonly string[];
  readonly port: readonly number[];
  readonly bench: readonly number[];
}

export const SERIES: Readonly<Record<PeriodKey, Serie>> = {
  ytd: {
    label: 'Depuis janvier',
    ticks: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.'],
    port: [0, 1.4, 0.6, 2.8, 4.1, 3.2, 5.6, 6.9, 7.4],
    bench: [0, 1.1, 0.2, 2.1, 3.4, 2.6, 4.5, 5.4, 5.9],
  },
  m1: {
    label: '1 mois',
    ticks: ['04/08', '11/08', '18/08', '25/08', '01/09', '08/09'],
    port: [0, 0.6, 0.2, 1.1, 1.6, 1.9],
    bench: [0, 0.5, 0.1, 0.8, 1.2, 1.4],
  },
  m3: {
    label: '3 mois',
    ticks: ['juin', 'juil.', 'août', 'sept.'],
    port: [0, 1.8, 3.1, 4.2],
    bench: [0, 1.5, 2.4, 3.3],
  },
  m6: {
    label: '6 mois',
    ticks: ['mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.'],
    port: [0, 1.9, 3.2, 2.4, 4.7, 6.0, 6.5],
    bench: [0, 1.6, 2.7, 1.9, 3.8, 4.7, 5.2],
  },
  y1: {
    label: '1 an',
    ticks: ['09/25', '11/25', '01/26', '03/26', '05/26', '07/26', '09/26'],
    port: [0, 2.6, 1.9, 4.8, 7.2, 9.4, 10.8],
    bench: [0, 2.1, 1.2, 3.6, 5.6, 7.4, 8.6],
  },
  y3: {
    label: '3 ans',
    ticks: ['2023', '2024', '2025', '2026'],
    port: [0, 9.6, 16.4, 27.9],
    bench: [0, 8.1, 13.2, 22.4],
  },
  y5: {
    label: '5 ans',
    ticks: ['2021', '2022', '2023', '2024', '2025', '2026'],
    port: [0, 11.4, 2.0, 11.8, 18.7, 30.6],
    bench: [0, 9.8, -2.5, 5.4, 10.4, 19.3],
  },
  max: {
    label: 'Max',
    ticks: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    port: [0, 6.2, 14.1, 27.1, 15.9, 26.8, 34.9, 48.6],
    bench: [0, 4.8, 11.2, 22.1, 8.4, 17.2, 23.6, 34.1],
  },
};

/** Ordre d'affichage du sélecteur de période, différent de l'ordre de déclaration ci-dessus. */
export const PERIOD_ORDER: readonly PeriodKey[] = ['m1', 'm3', 'm6', 'ytd', 'y1', 'y3', 'y5', 'max'];

export interface ScopeOption {
  readonly value: string;
  readonly label: string;
}

export const SCOPES: readonly ScopeOption[] = [
  { value: 'all', label: 'Tous les comptes actifs' },
  { value: 'DG-CTO', label: 'Degiro — CTO Degiro' },
  { value: 'BD-PEA', label: 'Bourse Direct — PEA Bourse Direct' },
  { value: 'TR-CTO', label: 'Trade Republic — CTO Trade Republic' },
];

/* ------------------------------------------------------------------ Vue d'ensemble */

export interface PeriodRow {
  readonly label: string;
  readonly port: number;
  readonly bench: number;
  readonly contrib: number;
}

export const PERIOD_ROWS: readonly PeriodRow[] = [
  { label: '1 mois', port: 1.9, bench: 1.4, contrib: 0.4 },
  { label: '3 mois', port: 4.2, bench: 3.3, contrib: 0.9 },
  { label: '6 mois', port: 6.5, bench: 5.2, contrib: 1.4 },
  { label: 'Depuis janvier', port: 7.4, bench: 5.9, contrib: 1.6 },
  { label: '1 an', port: 10.8, bench: 8.6, contrib: 2.3 },
  { label: '3 ans annualisés', port: 8.5, bench: 6.9, contrib: 5.4 },
];

/* ------------------------------------------------------------------ Attribution */

export interface AttribRow {
  readonly label: string;
  readonly weight: number;
  readonly benchWeight: number;
  readonly alloc: number;
  readonly sel: number;
}

export const ATTRIB_CLASS: readonly AttribRow[] = [
  { label: 'Actions', weight: 58.4, benchWeight: 55.0, alloc: 0.24, sel: 0.86 },
  { label: 'Obligations', weight: 24.1, benchWeight: 28.0, alloc: 0.18, sel: -0.12 },
  { label: 'Alternatifs', weight: 11.2, benchWeight: 10.0, alloc: 0.09, sel: 0.31 },
  { label: 'Trésorerie', weight: 6.3, benchWeight: 7.0, alloc: -0.04, sel: 0.02 },
];

export const ATTRIB_GEO: readonly AttribRow[] = [
  { label: 'Europe', weight: 41.6, benchWeight: 38.0, alloc: 0.19, sel: 0.42 },
  { label: 'Amérique du Nord', weight: 34.2, benchWeight: 36.0, alloc: -0.08, sel: 0.61 },
  { label: 'Asie-Pacifique', weight: 12.7, benchWeight: 13.0, alloc: 0.03, sel: -0.18 },
  { label: 'Marchés émergents', weight: 5.2, benchWeight: 6.0, alloc: -0.06, sel: 0.14 },
  { label: 'Trésorerie', weight: 6.3, benchWeight: 7.0, alloc: -0.04, sel: 0.02 },
];

export interface Contributor {
  readonly ticker: string;
  readonly name: string;
  readonly value: number;
}

export const CONTRIBUTORS: readonly Contributor[] = [
  { ticker: 'MC', name: 'LVMH', value: 1.24 },
  { ticker: 'AAPL', name: 'Apple Inc.', value: 0.86 },
  { ticker: 'OR', name: "L'Oréal", value: 0.52 },
  { ticker: 'USLC', name: 'US Large Cap Core', value: 0.38 },
  { ticker: 'IGCRD', name: 'Investment Grade Credit', value: -0.21 },
  { ticker: 'EMEQ', name: 'Emerging Markets Equity', value: -0.44 },
];

/* ------------------------------------------------------------------ Analyse détaillée */

export type FreqKey = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface Frequency {
  readonly key: FreqKey;
  readonly label: string;
  /** Employé dans le titre de la carte : « Rendement <title> ». */
  readonly title: string;
  /** Observations par an — sert au libellé et à l'annualisation (√points). */
  readonly points: number;
  readonly hint: string;
  /** Nom de l'unité au pluriel, pour le décompte affiché en en-tête. */
  readonly unit: string;
}

export const FREQUENCIES: readonly Frequency[] = [
  { key: 'daily', label: 'Quotidienne', title: 'quotidien', points: 252, hint: '252 observations par an — jours de bourse', unit: 'séances' },
  { key: 'weekly', label: 'Hebdomadaire', title: 'hebdomadaire', points: 52, hint: '52 observations par an — clôtures du vendredi', unit: 'semaines' },
  { key: 'monthly', label: 'Mensuelle', title: 'mensuel', points: 12, hint: '12 observations par an — clôtures de fin de mois', unit: 'mois' },
  { key: 'quarterly', label: 'Trimestrielle', title: 'trimestriel', points: 4, hint: '4 observations par an — fins de trimestre', unit: 'trimestres' },
];

export interface FreqRow {
  readonly label: string;
  readonly port: number;
  readonly bench: number;
}

export const MONTHLY: readonly FreqRow[] = [
  { label: 'oct. 25', port: -5.9, bench: -6.8 },
  { label: 'nov. 25', port: 4.8, bench: 3.9 },
  { label: 'déc. 25', port: 1.6, bench: 1.2 },
  { label: 'janv. 26', port: 2.1, bench: 1.7 },
  { label: 'févr. 26', port: -1.4, bench: -1.9 },
  { label: 'mars 26', port: 2.2, bench: 1.9 },
  { label: 'avr. 26', port: 1.3, bench: 1.3 },
  { label: 'mai 26', port: -0.9, bench: -0.8 },
  { label: 'juin 26', port: 2.4, bench: 1.9 },
  { label: 'juil. 26', port: 1.3, bench: 0.9 },
  { label: 'août 26', port: 0.6, bench: 0.5 },
  { label: 'sept. 26', port: 0.4, bench: 0.3 },
];

/**
 * Vingt derniers jours de bourse. Le prototype les engendrait au chargement depuis une graine
 * de rendements ; la référence vaut 78 % du portefeuille, à deux décimales.
 */
const DAILY_SEED: readonly number[] = [
  0.21, -0.14, 0.32, 0.08, -0.26, 0.41, 0.12, -0.09, 0.28, 0.05,
  -0.18, 0.34, 0.16, -0.22, 0.11, 0.24, -0.07, 0.19, 0.13, 0.06,
];

const DAILY: readonly FreqRow[] = DAILY_SEED.map((p, i) => ({
  label: `${String(8 - Math.floor(i / 5) * 2).padStart(2, '0')}/09`,
  port: p,
  bench: Number((p * 0.78).toFixed(2)),
}));

const WEEKLY: readonly FreqRow[] = [
  { label: 's. 27', port: 0.6, bench: 0.4 }, { label: 's. 28', port: -0.3, bench: -0.4 },
  { label: 's. 29', port: 0.8, bench: 0.6 }, { label: 's. 30', port: 0.2, bench: 0.3 },
  { label: 's. 31', port: -0.4, bench: -0.5 }, { label: 's. 32', port: 0.5, bench: 0.4 },
  { label: 's. 33', port: 0.3, bench: 0.2 }, { label: 's. 34', port: -0.2, bench: -0.1 },
  { label: 's. 35', port: 0.4, bench: 0.3 }, { label: 's. 36', port: 0.1, bench: 0.1 },
  { label: 's. 37', port: 0.3, bench: 0.2 },
];

const QUARTERLY: readonly FreqRow[] = [
  { label: 'T4 25', port: 0.4, bench: -1.9 }, { label: 'T1 26', port: 2.9, bench: 1.7 },
  { label: 'T2 26', port: 2.8, bench: 2.4 }, { label: 'T3 26', port: 2.3, bench: 1.7 },
];

export const BY_FREQ: Readonly<Record<FreqKey, readonly FreqRow[]>> = {
  daily: DAILY,
  weekly: WEEKLY,
  monthly: MONTHLY,
  quarterly: QUARTERLY,
};

export type SortKey = 'contrib' | 'weight' | 'perf';

export interface Holding {
  readonly ticker: string;
  readonly name: string;
  readonly cls: string;
  readonly weight: number;
  readonly perf: number;
  readonly contrib: number;
  readonly vol: number;
  readonly beta: number;
}

export const HOLDINGS: readonly Holding[] = [
  { ticker: 'MC', name: 'LVMH', cls: 'Actions', weight: 12.4, perf: 14.8, contrib: 1.24, vol: 21.4, beta: 1.18 },
  { ticker: 'AAPL', name: 'Apple Inc.', cls: 'Actions', weight: 9.8, perf: 11.2, contrib: 0.86, vol: 24.1, beta: 1.24 },
  { ticker: 'OR', name: "L'Oréal", cls: 'Actions', weight: 8.1, perf: 7.4, contrib: 0.52, vol: 17.8, beta: 0.94 },
  { ticker: 'AI', name: 'Air Liquide', cls: 'Actions', weight: 6.9, perf: 5.1, contrib: 0.34, vol: 15.2, beta: 0.81 },
  { ticker: 'USLC', name: 'US Large Cap Core', cls: 'ETF', weight: 11.6, perf: 4.1, contrib: 0.38, vol: 14.6, beta: 1.02 },
  { ticker: 'EUEQ', name: 'Europe ex-UK Equity', cls: 'ETF', weight: 9.6, perf: 3.2, contrib: 0.29, vol: 13.9, beta: 0.96 },
  { ticker: 'IGCRD', name: 'Investment Grade Credit', cls: 'Obligations', weight: 14.2, perf: -1.4, contrib: -0.21, vol: 5.1, beta: 0.18 },
  { ticker: 'TSY10', name: 'US Treasury 7-10Y', cls: 'Obligations', weight: 9.9, perf: 1.8, contrib: 0.18, vol: 6.4, beta: 0.12 },
  { ticker: 'EMEQ', name: 'Emerging Markets Equity', cls: 'Actions', weight: 5.2, perf: -7.9, contrib: -0.44, vol: 26.8, beta: 1.34 },
  { ticker: 'INFRA', name: 'Infrastructures européennes', cls: 'Alternatifs', weight: 6.0, perf: 6.2, contrib: 0.31, vol: 11.2, beta: 0.54 },
  { ticker: 'CASH', name: 'Trésorerie et équivalents', cls: 'Trésorerie', weight: 6.3, perf: 2.4, contrib: 0.14, vol: 0.2, beta: 0.01 },
];

export const CLASS_TINT: Readonly<Record<string, { readonly bg: string; readonly fg: string }>> = {
  'Actions': { bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)' },
  'ETF': { bg: 'rgba(91,62,168,0.16)', fg: 'var(--ink-alt)' },
  'Obligations': { bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)' },
  'Alternatifs': { bg: 'rgba(143,63,6,0.14)', fg: 'var(--ink-warn)' },
  'Trésorerie': { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-800)' },
};

/* ------------------------------------------------------------------ Historique détaillé */

export type BandKey = 'pnl' | 'div' | 'fees' | 'tax';

/** Composition du résultat cumulé, en milliers d'euros. */
export const RESULT: Readonly<Record<BandKey, number>> = { pnl: 4820, div: 2140, fees: -286, tax: -642 };

export interface BandDef {
  readonly key: BandKey;
  readonly label: string;
  readonly color: string;
  readonly hint: string;
}

export const BANDS: readonly BandDef[] = [
  { key: 'pnl', label: 'P/L réalisé', color: 'var(--ink-ok)', hint: 'Plus et moins-values de cession' },
  { key: 'div', label: 'Dividendes', color: 'var(--ink-brand-2)', hint: 'Dividendes encaissés nets' },
  { key: 'fees', label: 'Frais', color: 'var(--ink-warn)', hint: 'Courtage et droits de garde' },
  { key: 'tax', label: 'Taxes', color: 'var(--ink-warn-2)', hint: 'Retenues à la source et impôts de bourse' },
];

export const BAND_COLOR: Readonly<Record<BandKey, string>> = {
  pnl: 'var(--ink-ok)',
  div: 'var(--ink-brand-2)',
  fees: 'var(--ink-warn)',
  tax: 'var(--ink-warn-2)',
};

export interface ResultLine {
  readonly a: string;
  readonly b: string;
  readonly c: string;
  readonly d: string;
  readonly e: string;
  readonly f: number;
}

export interface ResultBlock {
  readonly title: string;
  readonly cols: readonly string[];
  readonly rows: readonly ResultLine[];
}

export const RESULT_LINES: Readonly<Record<BandKey, ResultBlock>> = {
  pnl: {
    title: 'Plus et moins-values réalisées',
    cols: ['Titre', 'Cession', 'Quantité', 'Prix de revient', 'Produit', 'Résultat'],
    rows: [
      { a: 'MC — LVMH', b: '12/06/2026', c: '40', d: '24 120', e: '31 480', f: 7360 },
      { a: 'AAPL — Apple Inc.', b: '28/04/2026', c: '60', d: '8 940', e: '11 220', f: 2280 },
      { a: "OR — L'Oréal", b: '19/03/2026', c: '25', d: '9 640', e: '10 810', f: 1170 },
      { a: 'EMEQ — Emerging Markets', b: '05/02/2026', c: '300', d: '14 700', e: '12 480', f: -2220 },
      { a: 'IGCRD — IG Credit', b: '21/01/2026', c: '150', d: '15 900', e: '14 940', f: -960 },
    ],
  },
  div: {
    title: 'Dividendes encaissés',
    cols: ['Titre', 'Détachement', 'Quantité', 'Brut unitaire', 'Retenue', 'Net'],
    rows: [
      { a: "OR — L'Oréal", b: '26/08/2026', c: '100', d: '2,20', e: '−66', f: 154 },
      { a: 'AI — Air Liquide', b: '14/05/2026', c: '180', d: '3,10', e: '−167', f: 391 },
      { a: 'MC — LVMH', b: '23/04/2026', c: '40', d: '13,00', e: '−156', f: 364 },
      { a: 'TSY10 — US Treasury', b: '15/03/2026', c: '200', d: '4,80', e: '−144', f: 816 },
      { a: 'AAPL — Apple Inc.', b: '09/02/2026', c: '120', d: '0,96', e: '−17', f: 98 },
    ],
  },
  fees: {
    title: 'Frais de courtage et droits de garde',
    cols: ['Nature', 'Date', 'Compte', 'Opération', 'Assiette', 'Montant'],
    rows: [
      { a: 'Droits de garde', b: '30/06/2026', c: 'Degiro — CTO', d: 'Semestriel', e: '284 100', f: -142 },
      { a: 'Courtage', b: '12/06/2026', c: 'Degiro — CTO', d: 'Cession MC', e: '31 480', f: -62 },
      { a: 'Droits de garde', b: '31/12/2025', c: 'Bourse Direct — PEA', d: 'Semestriel', e: '148 900', f: -49 },
      { a: 'Courtage', b: '28/04/2026', c: 'Degiro — CTO', d: 'Cession AAPL', e: '11 220', f: -21 },
      { a: 'Courtage', b: '05/02/2026', c: 'Trade Republic — CTO', d: 'Cession EMEQ', e: '12 480', f: -12 },
    ],
  },
  tax: {
    title: 'Taxes et retenues à la source',
    cols: ['Nature', 'Date', 'Source', 'Assiette', 'Taux', 'Montant'],
    rows: [
      { a: 'Retenue à la source', b: '15/03/2026', c: 'États-Unis', d: '960', e: '15,0 %', f: -144 },
      { a: 'Retenue à la source', b: '14/05/2026', c: 'France', d: '558', e: '30,0 %', f: -167 },
      { a: 'Retenue à la source', b: '23/04/2026', c: 'France', d: '520', e: '30,0 %', f: -156 },
      { a: 'Retenue à la source', b: '26/08/2026', c: 'France', d: '220', e: '30,0 %', f: -66 },
      { a: 'Taxe sur transactions', b: '12/06/2026', c: 'France', d: '31 480', e: '0,30 %', f: -94 },
    ],
  },
};

export interface ResultYear {
  readonly year: string;
  readonly pnl: number;
  readonly div: number;
  readonly fees: number;
  readonly tax: number;
}

/** Résultat par année civile, en milliers d'euros — alimente le graphique à barres empilées. */
export const RESULT_YEARS: readonly ResultYear[] = [
  { year: '2022', pnl: -1840, div: 1420, fees: -240, tax: -412 },
  { year: '2023', pnl: 2960, div: 1610, fees: -258, tax: -478 },
  { year: '2024', pnl: 1740, div: 1780, fees: -262, tax: -524 },
  { year: '2025', pnl: 3420, div: 1960, fees: -274, tax: -588 },
  { year: '2026', pnl: 4820, div: 2140, fees: -286, tax: -642 },
];

export interface ResultYearDetail {
  readonly year: string;
  readonly gain: number;
  readonly loss: number;
  readonly div: number;
  readonly fees: number;
  readonly tax: number;
}

/** Même matière que RESULT_YEARS, plus et moins-values séparées — alimente le tableau. */
export const RESULT_YEARS_DETAIL: readonly ResultYearDetail[] = [
  { year: '2022', gain: 1240, loss: -3080, div: 1420, fees: -240, tax: -412 },
  { year: '2023', gain: 3840, loss: -880, div: 1610, fees: -258, tax: -478 },
  { year: '2024', gain: 2610, loss: -870, div: 1780, fees: -262, tax: -524 },
  { year: '2025', gain: 4180, loss: -760, div: 1960, fees: -274, tax: -588 },
  { year: '2026', gain: 5940, loss: -1120, div: 2140, fees: -286, tax: -642 },
];

/**
 * Teintes pastel du graphique annuel. C'étaient des `props` réglables dans l'éditeur du
 * prototype ; l'app n'ayant pas cet éditeur, seules les valeurs par défaut sont reprises.
 */
export const YEAR_PALETTE = {
  gain: '#8fd4c4',
  loss: '#e59289',
  div: '#a8c5e8',
  fees: '#f0c9a0',
  tax: '#e8b0a8',
} as const;

/** Bordure des barres : la teinte pastel assombrie d'environ 30 %. */
export function darken(hex: string): string {
  const n = hex.replace('#', '');
  if (n.length !== 6) return hex;
  return (
    '#' +
    [0, 2, 4]
      .map((i) => Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * 0.68)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/* ------------------------------------------------------------------ Risque et pertes */

export interface RiskRow {
  readonly label: string;
  readonly value: number;
  readonly bench: number;
  readonly unit: '%' | '';
  /** Sens favorable : « high » = plus c'est haut mieux c'est. */
  readonly good: 'high' | 'low';
  readonly hint: string;
}

export const RISK: readonly RiskRow[] = [
  { label: 'Volatilité annualisée', value: 9.4, bench: 10.8, unit: '%', good: 'low', hint: 'Écart-type annualisé des rendements quotidiens' },
  { label: 'Ratio de Sharpe', value: 0.82, bench: 0.63, unit: '', good: 'high', hint: 'Rendement excédentaire par unité de volatilité totale' },
  { label: 'Ratio de Sortino', value: 1.18, bench: 0.87, unit: '', good: 'high', hint: 'Rendement excédentaire par unité de volatilité baissière' },
  { label: "Ratio d'information", value: 0.54, bench: 0, unit: '', good: 'high', hint: 'Écart de performance rapporté au risque actif' },
  { label: 'Bêta contre référence', value: 0.91, bench: 1, unit: '', good: 'low', hint: 'Sensibilité aux mouvements de la référence' },
  { label: 'Erreur de suivi', value: 4.1, bench: 0, unit: '%', good: 'low', hint: "Volatilité de l'écart avec la référence" },
  { label: 'Perte maximale', value: -12.6, bench: -15.4, unit: '%', good: 'high', hint: 'Recul le plus profond entre un sommet et le point bas suivant' },
];

export interface Drawdown {
  readonly label: string;
  readonly depth: number;
  readonly detail: string;
}

export const DRAWDOWNS: readonly Drawdown[] = [
  { label: 'Mars — avril 2026', depth: -6.4, detail: '28 jours de recul · récupéré en 41 jours' },
  { label: 'Octobre 2025', depth: -12.6, detail: '19 jours de recul · récupéré en 63 jours' },
  { label: 'Juin — juillet 2025', depth: -4.8, detail: '22 jours de recul · récupéré en 18 jours' },
  { label: 'Février 2024', depth: -8.1, detail: '15 jours de recul · récupéré en 34 jours' },
];

export interface YearReturn {
  readonly label: string;
  readonly port: number;
  readonly bench: number;
}

export const YEARS: readonly YearReturn[] = [
  { label: '2022', port: -8.4, bench: -11.2 },
  { label: '2023', port: 9.6, bench: 8.1 },
  { label: '2024', port: 6.2, bench: 4.7 },
  { label: '2025', port: 9.9, bench: 8.1 },
  { label: '2026', port: 7.4, bench: 5.9 },
];

/* ------------------------------------------------------------------ Mesures fixes */

export interface Measure {
  readonly label: string;
  readonly value: string;
  readonly color: string;
  readonly hint: string;
}

export const MEASURES: readonly Measure[] = [
  { label: 'Rendement annualisé sur 3 ans', value: pct(8.5, 1), color: tone(8.5), hint: 'Taux de croissance annuel composé' },
  { label: 'Rendement de la référence', value: pct(6.9, 1), color: 'var(--color-text)', hint: 'Composite 60 / 40 sur la même période' },
  { label: 'Écart annualisé', value: bps(1.6), color: tone(1.6), hint: 'Surperformance annualisée nette de frais' },
  { label: 'Meilleur mois', value: pct(4.8, 1), color: tone(4.8), hint: 'Novembre 2025' },
  { label: 'Pire mois', value: pct(-5.9, 1), color: tone(-5.9), hint: 'Octobre 2025' },
  { label: 'Mois positifs', value: '24 / 36', color: 'var(--color-text)', hint: 'Sur les trois dernières années' },
];
