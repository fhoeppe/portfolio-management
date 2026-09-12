/**
 * Porté depuis `Positions.dc.html`. Deux référentiels de titres coexistent dans le
 * prototype, sans lien entre eux :
 *
 * - `POS` (mandats institutionnels BGM-004/INP-011/BGM-002) n'alimente, dans le rendu réel,
 *   que l'onglet Répartitions et le tableau de l'onglet Résultat — le sélecteur de compte qui
 *   aurait dû le filtrer (`ACCOUNTS`/`account`/`accountOptions`) n'est relié à aucun élément
 *   du template : ce référentiel reste donc toujours vu en entier ;
 * - `PORTFOLIOS` (comptes courtiers Bourse Direct/Degiro) alimente tout le reste : bandeau
 *   KPI, graphique, onglets Inventaire et Synthèse, panneau d'historique.
 *
 * Un bloc entier de logique calculée dans `renderVals()` (état `account`/`selected`/`sort`,
 * props `rows`/`cur`/`moves`/`sortTabs`/`totalValue`/`totalWeight`/`totalPnl`, tableau `MOVES`)
 * ne correspond à aucun `{{ ... }}` du template — confirmé en grepant le fichier source.
 * Non repris ici, comme `icon` dans Guide (voir `guide-data.ts`).
 */

export interface Position {
  readonly account: string;
  readonly ticker: string;
  readonly name: string;
  readonly isin: string;
  readonly cls: string;
  readonly region: string;
  readonly currency: 'EUR' | 'USD';
  readonly qty: number;
  readonly price: number;
  readonly cost: number;
  readonly realized: number;
  readonly income: number;
  readonly since: string;
  readonly custody: string;
}

const FX: Readonly<Record<string, number>> = { EUR: 1, USD: 0.92 };

function mk(
  account: string,
  ticker: string,
  name: string,
  isin: string,
  cls: string,
  region: string,
  currency: 'EUR' | 'USD',
  target: number,
  price: number,
  costRatio: number,
  realized: number,
  income: number,
  since: string,
  custody: string,
): Position {
  const qty = Math.round((target * 1000000) / (price * FX[currency]));
  return {
    account,
    ticker,
    name,
    isin,
    cls,
    region,
    currency,
    qty,
    price,
    cost: Math.round(price * costRatio * 100) / 100,
    realized,
    income,
    since,
    custody,
  };
}

// Encours calibrés sur Comptes / Tableau de bord : BGM-004 486,2 M€, INP-011 212,7 M€, BGM-002 94,5 M€.
export const POS: readonly Position[] = [
  mk('BGM-004', 'GLBEQ', 'Global Equity Index', 'LU1234567890', 'Actions', 'Mondial', 'EUR', 96.4, 1019.6, 0.875, 128, 198, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'USLC', 'US Large Cap Core', 'IE00B1234567', 'Actions', 'Amérique du Nord', 'USD', 78.9, 44.1, 0.882, 84, 62, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'EUEQ', 'Europe ex-UK Equity', 'LU2345678901', 'Actions', 'Europe', 'EUR', 41.2, 225.1, 0.995, 0, 41, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'EMEQ', 'EM Equity Sleeve', 'LU4567890123', 'Actions', 'Émergents', 'USD', 27.6, 1000.0, 1.042, -38, 18, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'REIT', 'Listed Real Estate', 'LU7890123456', 'Actions', 'Europe', 'EUR', 19.8, 521.0, 1.040, -14, 74, '22/01/2026', 'Dépositaire LU'),
  mk('BGM-004', 'TSY10', 'Treasury 7–10 ans ETF', 'US912828XX12', 'Obligataire', 'Amérique du Nord', 'USD', 58.1, 100.2, 0.982, 0, 412, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'IGCRD', 'IG Corporate Bond', 'XS1234567890', 'Obligataire', 'Europe', 'EUR', 43.7, 100.0, 0.968, 12, 284, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'EUBND', 'Euro Aggregate Bond', 'LU8901234567', 'Obligataire', 'Europe', 'EUR', 16.5, 98.6, 0.975, 0, 96, '11/02/2026', 'Dépositaire LU'),
  mk('BGM-004', 'PRVE', 'Private Equity Co-invest', 'LU5678901234', 'Alternatifs', 'Mondial', 'EUR', 31.5, 1000.0, 0.920, 0, 0, '30/06/2025', 'Dépositaire LU'),
  mk('BGM-004', 'INFRA', 'Infrastructure Fund II', 'LU3456789012', 'Alternatifs', 'Europe', 'EUR', 29.4, 1240.0, 0.952, 0, 96, '30/06/2025', 'Dépositaire LU'),
  mk('BGM-004', 'EUR', 'Trésorerie EUR', '—', 'Trésorerie', 'Europe', 'EUR', 43.1, 1, 1, 0, 84, '11/02/2026', 'Compte courant'),

  mk('INP-011', 'IGCRD', 'IG Corporate Bond', 'XS1234567890', 'Obligataire', 'Europe', 'EUR', 130.2, 100.0, 0.968, 8, 642, '04/09/2023', 'Dépositaire LU'),
  mk('INP-011', 'GLBEQ', 'Global Equity Index', 'LU1234567890', 'Actions', 'Mondial', 'EUR', 60.4, 1019.6, 0.902, 24, 124, '04/09/2023', 'Dépositaire LU'),
  mk('INP-011', 'INFRA', 'Infrastructure Fund II', 'LU3456789012', 'Alternatifs', 'Europe', 'EUR', 8.7, 1240.0, 0.968, 0, 28, '30/06/2025', 'Dépositaire LU'),
  mk('INP-011', 'EUR', 'Trésorerie EUR', '—', 'Trésorerie', 'Europe', 'EUR', 13.4, 1, 1, 0, 32, '04/09/2023', 'Compte courant'),

  mk('BGM-002', 'GLBEQ', 'Global Equity Index', 'LU1234567890', 'Actions', 'Mondial', 'EUR', 31.4, 1019.6, 0.889, 12, 64, '19/06/2024', 'Dépositaire LU'),
  mk('BGM-002', 'USLC', 'US Large Cap Core', 'IE00B1234567', 'Actions', 'Amérique du Nord', 'USD', 18.5, 44.1, 0.874, 6, 21, '19/06/2024', 'Dépositaire LU'),
  mk('BGM-002', 'IGCRD', 'IG Corporate Bond', 'XS1234567890', 'Obligataire', 'Europe', 'EUR', 31.6, 100.0, 0.972, 0, 148, '19/06/2024', 'Dépositaire LU'),
  mk('BGM-002', 'INFRA', 'Infrastructure Fund II', 'LU3456789012', 'Alternatifs', 'Europe', 'EUR', 8.1, 1240.0, 0.960, 0, 26, '30/06/2025', 'Dépositaire LU'),
  mk('BGM-002', 'EUR', 'Trésorerie EUR', '—', 'Trésorerie', 'Europe', 'EUR', 4.9, 1, 1, 0, 11, '19/06/2024', 'Compte courant'),
];

export function value(p: Position): number {
  return (p.qty * p.price * FX[p.currency]) / 1;
}

export function bookCost(p: Position): number {
  return (p.qty * p.cost * FX[p.currency]) / 1;
}

// ---------------------------------------------------------------------------------------
// Comptes courtiers (bandeau KPI, graphique, Inventaire, Synthèse, panneau d'historique)
// ---------------------------------------------------------------------------------------

export const FXR: Readonly<Record<string, number>> = { EUR: 1, USD: 0.92, GBP: 1.17, CHF: 1.06 };

export interface PortfolioPosition {
  readonly isin: string;
  readonly ticker: string;
  readonly name: string;
  readonly currency: string;
  readonly qty: number;
  readonly pru: number;
  readonly price: number;
  readonly day: number;
  readonly realized: number;
  readonly lot: number;
}

export interface Portfolio {
  readonly id: string;
  readonly label: string;
  readonly cashCurrency: string;
  readonly cash: number;
  readonly realizedPct: number;
  readonly positions: readonly PortfolioPosition[];
}

// Inventaire par portefeuille : comptes brokers rattachés, valorisation au 04/09/2026.
export const PORTFOLIOS: readonly Portfolio[] = [
  { id: 'BD-CTO', label: 'Bourse Direct — CTO Bourse Direct', cashCurrency: 'EUR', cash: 0, realizedPct: 0, positions: [] },
  {
    id: 'DG-CTO',
    label: 'Degiro — CTO Degiro',
    cashCurrency: 'EUR',
    cash: 939.3,
    realizedPct: 23.03,
    positions: [
      { isin: 'US0378331005', ticker: 'AAPL', name: 'Apple Inc.', currency: 'USD', qty: 70, pru: 88.42, price: 117.10, day: -78.40, realized: 120.00, lot: 3 },
      { isin: 'NL0010273215', ticker: 'ASML', name: 'ASML Holding', currency: 'EUR', qty: 4, pru: 705.88, price: 738.20, day: -8.15, realized: 30.03, lot: 1 },
      { isin: 'US5949181045', ticker: 'MSFT', name: 'Microsoft Corp.', currency: 'USD', qty: 4, pru: 415.33, price: 528.90, day: -5.60, realized: 26.00, lot: 2 },
    ],
  },
  {
    id: 'BD-PEA',
    label: 'Bourse Direct — PEA Bourse Direct',
    cashCurrency: 'EUR',
    cash: 1786.5,
    realizedPct: -12.02,
    positions: [
      { isin: 'FR0000120073', ticker: 'AI', name: 'Air Liquide', currency: 'EUR', qty: 37, pru: 143.18, price: 166.80, day: 52.10, realized: -20.13, lot: 4 },
      { isin: 'FR0000121014', ticker: 'MC', name: 'LVMH', currency: 'EUR', qty: 5, pru: 745.80, price: 551.20, day: 9.40, realized: -95.00, lot: 1 },
      { isin: 'FR0000120321', ticker: 'OR', name: "L'Oréal", currency: 'EUR', qty: 5, pru: 402.38, price: 354.10, day: 7.80, realized: -30.00, lot: 2 },
    ],
  },
];

// ---------------------------------------------------------------------------------------
// Mise en forme
// ---------------------------------------------------------------------------------------

export function fr(v: number, d?: number): string {
  const digits = d === undefined ? 0 : d;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fr2(v: number): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fr4(v: number): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
export function eur(v: number): string {
  const a = Math.abs(v);
  if (a >= 1000000) return (v < 0 ? '−' : '') + fr(a / 1000000, 2) + ' M€';
  if (a >= 1000) return (v < 0 ? '−' : '') + fr(a / 1000, 1) + ' k€';
  return (v < 0 ? '−' : '') + fr(a, 0) + ' €';
}
export function pct(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
}
export function signed2(v: number, unit?: string): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr2(Math.abs(v)) + (unit ? ' ' + unit : '');
}
export function signedPct(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + fr2(Math.abs(v)) + '%';
}
export function pnlTone(v: number): string {
  return v > 0 ? 'var(--ink-ok-2)' : v < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)';
}
/** Tons du P/L lisibles sur le bandeau bleu plein des comptes. */
export function onBlueTone(v: number): string {
  return v > 0 ? '#7ff0d8' : v < 0 ? '#ffc9a3' : 'rgba(255,255,255,0.82)';
}

// ---------------------------------------------------------------------------------------
// Graphique de valorisation
// ---------------------------------------------------------------------------------------

export interface ChartAccount {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly start: number;
  readonly end: number;
  readonly seed: number;
  readonly drop?: number;
  readonly jump?: number;
}

// Séries de valorisation par compte broker, dérivées d'une marche pseudo-aléatoire déterministe.
export const CHART_ACCOUNTS: readonly ChartAccount[] = [
  { id: 'BD-CTO', label: 'Bourse Direct — CTO Bourse Direct', color: 'var(--field-brand)', start: 4780, end: 0, seed: 17, drop: 0.93 },
  { id: 'DG-CTO', label: 'Degiro — CTO Degiro', color: 'var(--field-ok)', start: 8180, end: 12440.39, seed: 41, jump: 0.93 },
  { id: 'BD-PEA', label: 'Bourse Direct — PEA Bourse Direct', color: 'var(--field-warn)', start: 10420, end: 10698.10, seed: 73 },
];

export interface ChartRange {
  readonly key: string;
  readonly label: string;
  readonly points: number;
  readonly months: number;
}

export const CHART_RANGES: readonly ChartRange[] = [
  { key: '5j', label: '5J', points: 40, months: 0 },
  { key: '1m', label: '1M', points: 30, months: 1 },
  { key: '6m', label: '6M', points: 130, months: 6 },
  { key: 'ytd', label: 'YTD', points: 172, months: 8 },
  { key: '1a', label: '1A', points: 250, months: 12 },
  { key: '5a', label: '5A', points: 320, months: 60 },
  { key: 'max', label: 'Max', points: 380, months: 96 },
];

export interface ChartMetric {
  readonly key: 'holdings' | 'growth';
  readonly label: string;
}

export const CHART_METRICS: readonly ChartMetric[] = [
  { key: 'holdings', label: 'Holdings Value' },
  { key: 'growth', label: 'Holdings Growth' },
];

export const MONTHS_FR: readonly string[] = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

export function chartSeries(acc: ChartAccount, n: number, factor: number): number[] {
  const out: number[] = [];
  let seed = acc.seed;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const jumpAt = acc.jump ? Math.floor(n * acc.jump) : -1;
  const dropAt = acc.drop ? Math.floor(n * acc.drop) : -1;
  const base = acc.start * factor;
  const target = acc.jump || acc.drop ? base * 1.03 : acc.end * factor;
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 1;
    let v = base + (target - base) * t + (rnd() - 0.5) * base * 0.012;
    if (jumpAt >= 0 && i >= jumpAt) v = acc.end * factor + (rnd() - 0.5) * acc.end * factor * 0.006;
    if (dropAt >= 0 && i >= dropAt) v = acc.end * factor;
    out.push(Math.max(0, v));
  }
  out[n - 1] = acc.end * factor;
  return out;
}

// ---------------------------------------------------------------------------------------
// Panneau d'historique
// ---------------------------------------------------------------------------------------

export interface HistRange {
  readonly key: string;
  readonly label: string;
  readonly months: number;
}

export const HIST_RANGES: readonly HistRange[] = [
  { key: '1a', label: '1 an', months: 12 },
  { key: '5a', label: '5 ans', months: 60 },
  { key: 'all', label: 'Tout', months: 0 },
];

export type HistKindKey = 'buy' | 'sell' | 'div' | 'split';

export const HIST_KINDS: Readonly<Record<HistKindKey, { readonly label: string; readonly bg: string; readonly fg: string }>> = {
  buy: { label: 'Achat', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  sell: { label: 'Vente', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  div: { label: 'Dividende', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  split: { label: 'Division', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

export interface HistRow {
  readonly d: Date;
  readonly lot: number;
  readonly kind: HistKindKey;
  readonly qty: number;
  readonly price: number;
  readonly balance: number;
}

/** Journal d'une position : un lot par ouverture, refermé sauf le dernier. */
export function positionHistory(pos: { readonly ticker: string; readonly lot: number; readonly qty: number; readonly pru: number }, months: number): readonly HistRow[] {
  const lots = pos.lot || 1;
  const openAt = new Date(2021, 2, 15);
  const rows: Array<{ d: Date; lot: number; kind: HistKindKey; qty: number; price: number }> = [];
  let seed = pos.ticker.length * 977 + lots * 31;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let l = 1; l <= lots; l++) {
    const t0 = new Date(openAt);
    t0.setMonth(t0.getMonth() + Math.round(((l - 1) / lots) * 54));
    const qty = l === lots ? pos.qty : Math.max(1, Math.round(pos.qty * (0.4 + rnd() * 0.6)));
    const price = pos.pru * (0.72 + rnd() * 0.5);
    rows.push({ d: new Date(t0), lot: l, kind: 'buy', qty, price });
    const dv = new Date(t0);
    dv.setMonth(dv.getMonth() + 6);
    rows.push({ d: dv, lot: l, kind: 'div', qty: 0, price: price * 0.012 });
    if (l < lots) {
      const t1 = new Date(t0);
      t1.setMonth(t1.getMonth() + Math.round(8 + rnd() * 10));
      rows.push({ d: t1, lot: l, kind: 'sell', qty: -qty, price: price * (0.9 + rnd() * 0.45) });
    }
  }
  rows.sort((a, b) => a.d.getTime() - b.d.getTime());
  let run = 0;
  const dated: HistRow[] = rows.map((r) => {
    run += r.qty;
    return { ...r, balance: run };
  });
  if (!months) return dated;
  const cut = new Date(2026, 8, 4);
  cut.setMonth(cut.getMonth() - months);
  return dated.filter((r) => r.d >= cut);
}

export type CashKindKey = 'in' | 'out' | 'div' | 'buy' | 'sell' | 'fee';

export const CASH_KINDS: Readonly<Record<CashKindKey, { readonly label: string; readonly bg: string; readonly fg: string }>> = {
  in: { label: 'Versement', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  out: { label: 'Retrait', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  div: { label: 'Dividende', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  buy: { label: 'Règlement achat', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  sell: { label: 'Produit de vente', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  fee: { label: 'Frais', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

export interface CashRow {
  readonly d: Date;
  readonly kind: CashKindKey;
  readonly label: string;
  readonly amount: number;
  readonly balance: number;
}

/** Journal du compte de liquidité, reconstitué depuis les mouvements titres et les apports. */
export function cashHistory(pf: Portfolio, months: number): readonly CashRow[] {
  const rows: Array<{ d: Date; kind: CashKindKey; label: string; amount: number }> = [];
  let seed = pf.id.length * 613 + 29;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const start = new Date(2021, 2, 1);
  rows.push({ d: new Date(start), kind: 'in', label: 'Apport initial', amount: 12000 });
  pf.positions.forEach((p) => {
    const hist = positionHistory(p, 0);
    hist.forEach((h) => {
      const amt = h.kind === 'div' ? h.price * (h.balance || p.qty) : Math.abs(h.qty) * h.price;
      if (h.kind === 'buy') rows.push({ d: h.d, kind: 'buy', label: 'Achat ' + p.ticker + ' — lot ' + h.lot, amount: -amt });
      if (h.kind === 'sell') rows.push({ d: h.d, kind: 'sell', label: 'Vente ' + p.ticker + ' — lot ' + h.lot, amount: amt });
      if (h.kind === 'div') rows.push({ d: h.d, kind: 'div', label: 'Dividende ' + p.ticker, amount: amt });
    });
  });
  for (let y = 2022; y <= 2026; y++) {
    rows.push({ d: new Date(y, 0, 31), kind: 'fee', label: 'Droits de garde ' + (y - 1), amount: -(40 + Math.round(rnd() * 60)) });
  }
  rows.push({ d: new Date(2024, 5, 12), kind: 'in', label: 'Versement complémentaire', amount: 5000 });
  rows.push({ d: new Date(2025, 10, 20), kind: 'out', label: 'Retrait vers compte bancaire', amount: -3500 });
  rows.sort((a, b) => a.d.getTime() - b.d.getTime());
  let bal = 0;
  const dated: CashRow[] = rows.map((r) => {
    bal += r.amount;
    return { ...r, balance: bal };
  });
  if (!months) return dated;
  const cut = new Date(2026, 8, 4);
  cut.setMonth(cut.getMonth() - months);
  return dated.filter((r) => r.d >= cut);
}

// ---------------------------------------------------------------------------------------
// Fiche titre (onglet « Fiche du titre » du panneau d'historique)
// ---------------------------------------------------------------------------------------

export interface SecurityRef {
  readonly name: string;
  readonly symbol: string;
  readonly place: string;
  readonly country: string;
  readonly sector: string;
  readonly index: string;
  readonly kind: string;
  readonly lotSize: string;
  readonly settle: string;
}

export const SECURITY_REF: Readonly<Record<string, SecurityRef>> = {
  AAPL: { name: 'Apple Inc.', symbol: 'XNAS.AAPL', place: 'Nasdaq New York XNAS', country: 'États-Unis', sector: 'Technologie — matériel informatique', index: 'NASDAQ 100', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+1' },
  ASML: { name: 'ASML Holding', symbol: 'XAMS.ASML', place: 'Euronext Amsterdam XAMS', country: 'Pays-Bas', sector: 'Technologie — équipements de semi-conducteurs', index: 'AEX 25', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+2' },
  MSFT: { name: 'Microsoft Corp.', symbol: 'XNAS.MSFT', place: 'Nasdaq New York XNAS', country: 'États-Unis', sector: 'Technologie — logiciels', index: 'NASDAQ 100', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+1' },
  AI: { name: 'Air Liquide', symbol: 'XPAR.AI', place: 'Euronext Paris XPAR', country: 'France', sector: 'Chimie — gaz industriels', index: 'CAC 40', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+2' },
  MC: { name: 'LVMH', symbol: 'XPAR.MC', place: 'Euronext Paris XPAR', country: 'France', sector: 'Biens de consommation — luxe', index: 'CAC 40', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+2' },
  OR: { name: "L'Oréal", symbol: 'XPAR.OR', place: 'Euronext Paris XPAR', country: 'France', sector: 'Biens de consommation — cosmétiques', index: 'CAC 40', kind: 'Action ordinaire', lotSize: '1 titre', settle: 'J+2' },
};

export const SEC_ACTIVITY: Readonly<Record<string, string>> = {
  AAPL: 'Conception et vente de matériel informatique grand public, de logiciels et de services numériques associés.',
  ASML: 'Fabrication de systèmes de photolithographie destinés à la production de circuits intégrés.',
  MSFT: 'Édition de logiciels, services cloud et licences pour les entreprises et les particuliers.',
  AI: 'Production et distribution de gaz industriels et médicaux, et services associés.',
  MC: 'Groupe de maisons de luxe : mode et maroquinerie, vins et spiritueux, parfums et cosmétiques, horlogerie.',
  OR: 'Fabrication et distribution de produits cosmétiques et de soins capillaires.',
};

export interface SecEvent {
  readonly d: string;
  readonly label: string;
  readonly detail: string;
  readonly impact: string;
  readonly up: 0 | 1;
  readonly state: string;
}

export const SEC_EVENTS: Readonly<Record<string, readonly SecEvent[]>> = {
  AAPL: [
    { d: '2026-08-14', label: 'Dividende trimestriel', detail: '0,26 USD par titre, détachement le 14/08', impact: '+18,20 USD', up: 1, state: 'Encaissé' },
    { d: '2026-05-15', label: 'Dividende trimestriel', detail: '0,25 USD par titre', impact: '+17,50 USD', up: 1, state: 'Encaissé' },
    { d: '2026-02-27', label: 'Assemblée générale', detail: '11 résolutions, vote par correspondance', impact: '—', up: 0, state: 'Voté' },
    { d: '2025-06-10', label: 'Division du nominal', detail: '4 pour 1, ajustement du PRU', impact: '×4 titres', up: 0, state: 'Appliqué' },
  ],
  ASML: [
    { d: '2026-04-24', label: 'Dividende annuel', detail: '6,40 EUR par titre', impact: '+25,60 EUR', up: 1, state: 'Encaissé' },
    { d: '2026-04-23', label: 'Assemblée générale', detail: 'Approbation des comptes 2025', impact: '—', up: 0, state: 'Voté' },
  ],
  MSFT: [
    { d: '2026-08-21', label: 'Dividende trimestriel', detail: '0,83 USD par titre', impact: '+3,32 USD', up: 1, state: 'Encaissé' },
    { d: '2026-12-11', label: 'Assemblée générale', detail: 'Convocation reçue, vote avant le 08/12', impact: '—', up: 0, state: 'À instruire' },
  ],
  AI: [
    { d: '2026-05-20', label: 'Dividende annuel', detail: '3,20 EUR par titre', impact: '+118,40 EUR', up: 1, state: 'Encaissé' },
    { d: '2026-06-02', label: 'Attribution gratuite', detail: '1 action nouvelle pour 10 détenues', impact: '+3 titres', up: 1, state: 'Appliqué' },
    { d: '2026-05-05', label: 'Assemblée générale', detail: '24 résolutions', impact: '—', up: 0, state: 'Voté' },
  ],
  MC: [
    { d: '2026-04-28', label: 'Dividende annuel', detail: '13,00 EUR par titre', impact: '+65,00 EUR', up: 1, state: 'Encaissé' },
    { d: '2026-04-16', label: 'Assemblée générale', detail: 'Renouvellement du conseil', impact: '—', up: 0, state: 'Voté' },
  ],
  OR: [
    { d: '2026-05-04', label: 'Dividende annuel', detail: '6,60 EUR par titre', impact: '+33,00 EUR', up: 1, state: 'Encaissé' },
    { d: '2026-09-18', label: 'Dividende exceptionnel', detail: 'Annoncé le 28/08, détachement le 18/09', impact: '+10,00 EUR', up: 1, state: 'Annoncé' },
  ],
};

export const EVENT_STATES: Readonly<Record<string, { readonly bg: string; readonly fg: string }>> = {
  'Encaissé': { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  'Appliqué': { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  'Voté': { bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  'Annoncé': { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  'À instruire': { bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
};
