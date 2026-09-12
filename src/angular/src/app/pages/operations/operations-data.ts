/** Porté depuis les constantes de module et l'état initial d'`Ordres.dc.html`. */
import { CONTINENT_ORDER, continentOf, placeOf } from '../parametres/places-data';

export interface TradableSecurity {
  readonly ticker: string;
  readonly label: string;
  readonly mic: string;
}

export interface AccountRef {
  readonly value: string;
  readonly label: string;
  readonly code: string;
}

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectGroup {
  readonly label: string;
  readonly options: readonly (SelectOption & { disabled?: boolean })[];
}

/**
 * Zone géographique d'une place, pour regrouper les titres à la saisie d'un ordre : c'est la
 * première question qu'on se pose devant une liste de quinze instruments cotés sur huit places.
 *
 * Le vocabulaire et l'ordre sont ceux du référentiel des places, déjà employés par l'écran
 * Paramètres — un second découpage géographique dans la même application serait une source de
 * confusion pour rien.
 */
export function zoneOfMic(mic: string): string {
  if (mic === 'OTC') return 'Hors marché';
  const place = placeOf(mic);
  /* Les places absentes du référentiel — Eurex — sont européennes ; le repli vaut mieux qu'une
     rubrique « Autres » qui n'aurait qu'un occupant. */
  return place ? continentOf(place.code) : 'Europe';
}

/** Ordre d'affichage des zones, « Hors marché » fermant la marche : ce n'est pas une géographie. */
export const ZONE_ORDER: readonly string[] = [...CONTINENT_ORDER, 'Hors marché'];

export interface OrderRow {
  readonly id: string;
  readonly date: string;
  readonly side: 'ACHAT' | 'VENTE';
  readonly security: string;
  readonly account: string;
  readonly qty: number;
  readonly filled: number;
  readonly price: string;
  readonly tif: string;
  readonly cancelled?: boolean;
  readonly abandoned?: boolean;
}

export interface TransferRow {
  readonly id: string;
  readonly date: string;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: string;
  readonly state: string;
}

export interface CorporateEventRow {
  readonly id: string;
  readonly date: string;
  readonly type: string;
  readonly security: string;
  readonly account: string;
  readonly amount: number;
  readonly state: string;
  readonly deadline?: string;
}

export interface CashflowEventRow {
  readonly id: string;
  readonly date: string;
  readonly type: string;
  readonly account: string;
  readonly amount: number;
  readonly currency: string;
  readonly state: string;
}

export type OrderState = 'open' | 'partial' | 'full' | 'cancelled' | 'abandoned';

export const TIF_NAME: Record<string, string> = {
  DAY: "Jusqu'à la clôture de la séance",
  GTC: "Jusqu'à annulation",
  GTD: "Jusqu'à une date fixée",
  IOC: 'Immédiat, reliquat annulé',
  FOK: 'Tout ou rien, immédiat',
  AON: 'Tout ou rien, maintenu au carnet',
  OPG: "À l'ouverture uniquement",
  MOC: 'À la clôture uniquement',
};

export const TIF: readonly SelectOption[] = ['DAY', 'GTC', 'GTD', 'IOC', 'FOK', 'AON', 'OPG', 'MOC'].map((c) => ({
  value: c,
  label: c + ' — ' + TIF_NAME[c],
}));

export const TIF_HINT =
  "DAY jusqu'à la clôture · GTC jusqu'à annulation · GTD jusqu'à une date · " +
  "IOC immédiat ou annulé · FOK tout ou rien immédiat · AON tout ou rien · " +
  "OPG à l'ouverture · MOC à la clôture";

export const STRAT_NAME: Record<string, string> = {
  MKT: 'Au marché',
  LMT: 'À cours limité',
  STP: 'Stop',
  STPLMT: 'Stop limité',
  TS: 'Stop suiveur',
  MOO: "Au marché à l'ouverture",
  MOC: 'Au marché à la clôture',
  LOO: "Limité à l'ouverture",
  LOC: 'Limité à la clôture',
  PEG: 'Attaché à une référence',
  ICE: 'Iceberg',
  TWAP: 'Découpage dans le temps',
  VWAP: 'Découpage sur le volume',
};

export const ORDER_STRATEGY: readonly SelectOption[] = [
  'MKT', 'LMT', 'STP', 'STPLMT', 'TS', 'MOO', 'MOC', 'LOO', 'LOC', 'PEG', 'ICE', 'TWAP', 'VWAP',
].map((c) => ({ value: c, label: (c === 'STPLMT' ? 'STP LMT' : c) + ' — ' + STRAT_NAME[c] }));

export const STRAT_HINT =
  'MKT au marché · LMT à cours limité · STP stop · STP LMT stop limité · ' +
  'TS stop suiveur · MOO/MOC au marché à l\'ouverture ou à la clôture · ' +
  'LOO/LOC limité à l\'ouverture ou à la clôture · PEG attaché à une référence · ' +
  'ICE iceberg · TWAP/VWAP découpage automatique dans le temps ou sur le volume';

export const TRADABLE_SECURITIES: readonly TradableSecurity[] = [
  { ticker: 'AI', label: 'AI — Air Liquide', mic: 'XPAR' },
  { ticker: 'MC', label: 'MC — LVMH', mic: 'XPAR' },
  { ticker: 'OR', label: "OR — L'Oréal", mic: 'XPAR' },
  { ticker: 'GLBEQ', label: 'GLBEQ — Global Equity Index', mic: 'XLUX' },
  { ticker: 'USLC', label: 'USLC — US Large Cap Core', mic: 'XDUB' },
  { ticker: 'IGCRD', label: 'IGCRD — IG Corporate Bond', mic: 'XLON' },
  { ticker: 'EMEQ', label: 'EMEQ — EM Equity Sleeve', mic: 'XLUX' },
  { ticker: 'HYBND', label: 'HYBND — High Yield Bond Fund', mic: 'XDUB' },
  { ticker: 'TSY10', label: 'TSY10 — Treasury 7–10 ans ETF', mic: 'XNYS' },
];

export const MIC_SHORT: Record<string, string> = { XPAR: 'Paris', XLUX: 'Luxembourg', XDUB: 'Dublin', XLON: 'Londres', XNYS: 'New York' };
export const MIC_CURRENCY: Record<string, string> = { XPAR: 'EUR', XLUX: 'EUR', XDUB: 'EUR', XLON: 'GBP', XNYS: 'USD' };

export const MIC_PLACES: readonly SelectOption[] = Array.from(new Set(TRADABLE_SECURITIES.map((s) => s.mic))).map((mic) => ({
  value: mic,
  label: mic + (MIC_SHORT[mic] ? ' — ' + MIC_SHORT[mic] : ''),
}));

export const MIC_HINT = Array.from(new Set(TRADABLE_SECURITIES.map((s) => s.mic)))
  .map((mic) => mic + ' ' + (MIC_SHORT[mic] || ''))
  .join(' · ');

export const ACCOUNTS_LIST: readonly AccountRef[] = [
  { value: 'Degiro — CTO Degiro', label: 'Degiro', code: 'DG-CTO-4521' },
  { value: 'Bourse Direct — PEA', label: 'Bourse Direct', code: 'BD-PEA-1187' },
  { value: 'Trade Republic — CTO Trade Republic', label: 'Trade Republic', code: 'TR-CTO-0932' },
];
export const ACCOUNTS: readonly string[] = ACCOUNTS_LIST.map((a) => a.value);

export const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' };

export const ACCOUNT_CURRENCY: Record<string, string> = {
  'Degiro — CTO Degiro': 'EUR',
  'Bourse Direct — PEA': 'EUR',
  'Trade Republic — CTO Trade Republic': 'EUR',
};

export const LINKED_BANKS: Record<string, readonly string[]> = {
  'Degiro — CTO Degiro': ['Fortuneo — Compte courant', 'Revolut — Compte courant'],
  'Bourse Direct — PEA': ['BNP Paribas — Compte courant', 'Boursorama — Livret'],
  'Trade Republic — CTO Trade Republic': ['N26 — Compte courant'],
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function isoDate(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export const TODAY = isoDate(new Date());
export const HORIZON = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return isoDate(d);
})();
export const IN_7D = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return isoDate(d);
})();

export const TRANSFERS: readonly TransferRow[] = [
  { id: 'TRF-0012', date: '2026-09-03', from: ACCOUNTS[0], to: ACCOUNTS[1], amount: 1500, currency: 'EUR', state: 'Exécuté' },
  { id: 'TRF-0011', date: '2026-09-01', from: ACCOUNTS[2], to: ACCOUNTS[0], amount: 4200, currency: 'EUR', state: 'En cours' },
  { id: 'TRF-0010', date: '2026-08-27', from: ACCOUNTS[1], to: ACCOUNTS[2], amount: 800, currency: 'USD', state: 'Exécuté' },
];

export const CORPORATE_EVENTS: readonly CorporateEventRow[] = [
  { id: 'CA-0048', date: '2026-10-01', type: 'DIV', security: 'IGCRD — IG Corporate Bond', account: ACCOUNTS[0], amount: 14201.25, state: 'Annoncé', deadline: '' },
  { id: 'CA-0047', date: '2026-09-28', type: 'RIGHTS', security: 'USLC — US Large Cap Core', account: ACCOUNTS[0], amount: 0, state: 'À instruire', deadline: '2026-09-22' },
  { id: 'CA-0046', date: '2026-09-19', type: 'AGM', security: 'INFRA — Infrastructure Fund II', account: ACCOUNTS[0], amount: 0, state: 'À instruire', deadline: '2026-09-12' },
  { id: 'CA-0045', date: '2026-09-18', type: 'MERGER', security: 'REIT — Listed Real Estate', account: ACCOUNTS[1], amount: 0, state: 'En cours', deadline: '2026-09-05' },
  { id: 'CA-0044', date: '2026-09-15', type: 'DIV', security: 'GLBEQ — Global Equity Index', account: ACCOUNTS[0], amount: 198450, state: 'Annoncé', deadline: '' },
  { id: 'CA-0043', date: '2026-09-10', type: 'SPLIT', security: 'EUEQ — Europe ex-UK Equity', account: ACCOUNTS[0], amount: 0, state: 'À appliquer', deadline: '' },
  { id: 'CA-0042', date: '2026-09-08', type: 'DIV', security: 'GLBEQ — Global Equity Index', account: ACCOUNTS[0], amount: 0, state: 'À appliquer', deadline: '' },
  { id: 'CA-0041', date: '2026-09-02', type: 'DIV', security: 'AI — Air Liquide', account: ACCOUNTS[0], amount: 220, state: 'Comptabilisé' },
  { id: 'CA-0040', date: '2026-08-27', type: 'SPLIT', security: 'MC — LVMH', account: ACCOUNTS[1], amount: 0, state: 'Appliqué' },
  { id: 'CA-0039', date: '2026-08-14', type: 'DIVOPT', security: "OR — L'Oréal", account: ACCOUNTS[0], amount: 154, state: 'En cours' },
];

export const CASHFLOW_EVENTS: readonly CashflowEventRow[] = [
  { id: 'CF-0018', date: '2026-09-03', type: 'DEPOSIT', account: ACCOUNTS[0], amount: 5000, currency: 'EUR', state: 'Exécuté' },
  { id: 'CF-0017', date: '2026-08-29', type: 'FEE', account: ACCOUNTS[1], amount: -48.6, currency: 'EUR', state: 'Exécuté' },
  { id: 'CF-0016', date: '2026-08-20', type: 'INTEREST', account: ACCOUNTS[0], amount: 12.4, currency: 'EUR', state: 'Exécuté' },
];

export const ORDERS: readonly OrderRow[] = [
  { id: 'ORD-0031', date: '2026-09-04', side: 'ACHAT', security: 'AAPL — Apple Inc.', account: ACCOUNTS[0], qty: 20, filled: 0, price: '150,00 (LMT)', tif: 'DAY' },
  { id: 'ORD-0030', date: '2026-09-03', side: 'ACHAT', security: 'USLC — US Large Cap Core', account: ACCOUNTS[0], qty: 300, filled: 300, price: '38,50 (LMT)', tif: 'GTC' },
  { id: 'ORD-0029', date: '2026-09-02', side: 'VENTE', security: 'MC — LVMH', account: ACCOUNTS[1], qty: 10, filled: 10, price: 'Au marché (MKT)', tif: 'DAY' },
  { id: 'ORD-0028', date: '2026-09-01', side: 'ACHAT', security: 'EUEQ — Europe ex-UK Equity', account: ACCOUNTS[0], qty: 500, filled: 220, price: '41,20 (LMT)', tif: 'GTD' },
  { id: 'ORD-0027', date: '2026-08-29', side: 'VENTE', security: "OR — L'Oréal", account: ACCOUNTS[1], qty: 5, filled: 3, price: '395,00 (LMT)', tif: 'GTC' },
  { id: 'ORD-0026', date: '2026-08-27', side: 'ACHAT', security: 'AI — Air Liquide', account: ACCOUNTS[2], qty: 15, filled: 0, price: 'Au marché (MKT)', tif: 'IOC' },
  { id: 'ORD-0025', date: '2026-08-22', side: 'ACHAT', security: 'AAPL — Apple Inc.', account: ACCOUNTS[0], qty: 8, filled: 8, price: '225,10 (LMT)', tif: 'DAY' },
  { id: 'ORD-0024', date: '2026-08-18', side: 'ACHAT', security: 'EUEQ — Europe ex-UK Equity', account: ACCOUNTS[2], qty: 200, filled: 60, price: '39,80 (LMT)', tif: 'GTD', abandoned: true },
];

export const STATE_TONE: Record<OrderState, { readonly label: string; readonly bg: string; readonly fg: string; readonly hint: string }> = {
  open: { label: 'En cours', bg: 'rgba(0,61,165,0.12)', fg: 'var(--ink-brand)', hint: 'Ordre transmis, non exécuté' },
  partial: { label: 'Exécuté partiellement', bg: 'rgba(180,83,9,0.14)', fg: 'var(--ink-warn)', hint: 'Une partie de la quantité a été exécutée' },
  full: { label: 'Exécuté totalement', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok)', hint: 'Quantité entièrement exécutée' },
  cancelled: { label: 'Annulé', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)', hint: 'Ordre annulé sans effet' },
  abandoned: { label: 'Abandonné', bg: 'var(--band-brand)', fg: 'var(--ink-6b5d3f)', hint: 'Validité expirée sans exécution ou avec exécution partielle non complétée' },
};

export function stateOf(o: OrderRow): OrderState {
  if (o.cancelled) return 'cancelled';
  if (o.abandoned) return 'abandoned';
  if (o.filled <= 0) return 'open';
  if (o.filled >= o.qty) return 'full';
  return 'partial';
}

export function num(v: number): string {
  return v.toLocaleString('fr-FR');
}

export const CASHFLOW_TYPES: readonly { readonly value: string; readonly label: string; readonly title: string; readonly text: string }[] = [
  { value: 'DEPOSIT', label: 'DEPOSIT', title: 'Dépôt', text: "Versement d'espèces qui alimente le compte." },
  { value: 'WITHDRAW', label: 'WITHDRAW', title: 'Retrait', text: "Retrait d'espèces débité sur la poche source." },
  { value: 'FEE', label: 'FEE', title: 'Frais', text: 'Frais prélevés (garde, gestion, courtage hors ordre).' },
  { value: 'INTEREST', label: 'INTEREST', title: 'Intérêts', text: 'Intérêts créditeurs ou débiteurs sur la poche espèces.' },
  { value: 'LENDING', label: 'LENDING', title: 'Prêt de titres', text: 'Commission perçue au titre du prêt de titres, ou jambe suivie côté titres.' },
  { value: 'REFUND', label: 'REFUND', title: 'Remboursement', text: "Remboursement d'espèces crédité sur la poche destinataire." },
];

/** Formatte un montant en devise `fr-FR`, deux décimales, avec le symbole `code`. */
export function fmtAmount(v: number): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseFr(v: string | undefined): number {
  return Number(String(v || '0').replace(/\s/g, '').replace(',', '.')) || 0;
}

export function frDate(iso: string): string {
  return iso.split('-').reverse().join('/');
}
