/** Porté depuis `Reconciliation.dc.html`. Données figées comme dans le prototype. */

export interface ScopeOption {
  value: string;
  label: string;
}

export const SCOPES: ScopeOption[] = [
  { value: 'bgm', label: 'BGM-004' },
  { value: 'inp', label: 'INP-011' },
  { value: 'glg', label: 'GLG-002' },
  { value: 'all', label: 'Tous les comptes' },
];

export interface ReconLine {
  ticker: string;
  name: string;
  internal: number;
  custody: number;
  unit: string;
  cause: string;
  ref: string;
}

export const LINES: ReconLine[] = [
  { ticker: 'GLBEQ', name: 'Global Equity Index', internal: 94500, custody: 94500, unit: 'parts', cause: '', ref: 'CUST-77361' },
  {
    ticker: 'USLC',
    name: 'US Large Cap Core',
    internal: 189400,
    custody: 178900,
    unit: 'parts',
    cause: "Exécution partielle du 31/08 saisie mais absente du rapport broker (10 500 parts)",
    ref: 'ORD-2026-0841',
  },
  { ticker: 'TSY10', name: 'Treasury 7–10 ans', internal: 580000, custody: 580000, unit: 'nominal', cause: '', ref: 'CUST-77290' },
  { ticker: 'IGCRD', name: 'IG Corporate Bond', internal: 437000, custody: 437000, unit: 'nominal', cause: '', ref: 'CUST-77388' },
  {
    ticker: 'EUEQ',
    name: 'Europe ex-UK Equity',
    internal: 61000,
    custody: 183000,
    unit: 'parts',
    cause: 'Division 3 pour 1 présente dans le rapport broker, absente de la saisie',
    ref: 'SPL-2026-0044',
  },
  { ticker: 'EMEQ', name: 'EM Equity Sleeve', internal: 27600, custody: 27600, unit: 'parts', cause: '', ref: 'CUST-77412' },
  { ticker: 'REIT', name: 'Listed Real Estate', internal: 38000, custody: 38000, unit: 'parts', cause: '', ref: 'CUST-77208' },
  {
    ticker: 'INFRA',
    name: 'Infrastructure Fund II',
    internal: 12100,
    custody: 12000,
    unit: 'parts',
    cause: 'Écart de 100 parts entre la saisie et le rapport broker',
    ref: 'MRG-2026-0009',
  },
  { ticker: 'PRVE', name: 'Private Equity Co-invest', internal: 31500, custody: 31500, unit: 'parts', cause: '', ref: 'CUST-77102' },
];

export interface CashLine {
  label: string;
  internal: number;
  bank: number;
  cause: string;
}

export const CASH: CashLine[] = [
  { label: 'EUR — compte courant', internal: 28640000, bank: 28640000, cause: '—' },
  { label: 'USD — compte devises', internal: 7420000, bank: 7420000, cause: '—' },
  { label: 'EUR — compte collatéral', internal: -420000, bank: -419580, cause: 'Intérêts débiteurs présents au relevé broker, non saisis' },
  { label: 'GBP — compte devises', internal: 640000, bank: 640000, cause: '—' },
];

export type ReconStateKey = 'ok' | 'pending' | 'gap' | 'justified' | 'escalated';

export interface ReconStateDef {
  label: string;
  bg: string;
  fg: string;
}

export const STATE: Record<ReconStateKey, ReconStateDef> = {
  ok: { label: 'Rapproché', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  pending: { label: 'En attente de dénouement', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  gap: { label: 'Écart à traiter', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  justified: { label: 'Justifié', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  escalated: { label: 'Escaladé', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
};

export function num(v: number): string {
  return Math.abs(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

export function signed(v: number): string {
  return v === 0 ? '—' : (v > 0 ? '+' : '−') + num(v);
}

export interface Kpi {
  label: string;
  value: string;
  note: string;
  color: string;
}

export interface ToneKpi extends Kpi {
  bg: string;
  labelColor: string;
}

/** Teinte des vignettes : vert marqué si la valeur est positive, rouge marqué sinon, dérivée
 * de la couleur de la valeur déjà définie par la vignette. */
export function toneByColor(k: Kpi): ToneKpi {
  const c = String(k.color || '');
  const green = c.indexOf('0f766e') >= 0 || c.indexOf('0b5f57') >= 0 || c.indexOf('15803d') >= 0;
  const red = c.indexOf('b45309') >= 0 || c.indexOf('a4552c') >= 0 || c.indexOf('dc2626') >= 0;
  if (!green && !red) return { ...k, bg: 'var(--surface)', labelColor: 'var(--color-neutral-700)' };
  const tint = green ? 'var(--band-ok)' : 'var(--band-warn)';
  const ink = green ? 'var(--ink-ok)' : 'var(--ink-warn-2)';
  return { ...k, bg: tint, labelColor: ink, color: ink };
}
