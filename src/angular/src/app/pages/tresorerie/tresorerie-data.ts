/**
 * Référentiels de la trésorerie — portés de `Tresorerie.dc.html`.
 *
 * Les soldes sont tenus dans la devise du compte ; la contre-valeur en euro et tous les
 * agrégats en découlent par `FX`. Rien n'est stocké en double.
 */

export interface Option {
  readonly value: string;
  readonly label: string;
  /** Icone du registre Material, employee par les seules natures d'instruction. */
  readonly icon?: string;
}

export const MANDATES: readonly Option[] = [
  { value: 'bgm', label: 'Balanced Growth — BGM-004' },
  { value: 'inp', label: 'Income & Preservation — INP-011' },
  { value: 'glg', label: 'Global Growth — GLG-002' },
  { value: 'all', label: 'Tous les comptes' },
];

/** Contre-valeur d'une unité de devise en euro. */
export const FX: Readonly<Record<string, number>> = { EUR: 1, USD: 0.92, CHF: 1.04, GBP: 1.17 };

export const CURRENCIES: readonly string[] = ['EUR', 'USD', 'CHF', 'GBP'];

export interface CashAccount {
  readonly currency: string;
  readonly bank: string;
  readonly iban: string;
  readonly balance: number;
  /** Part du solde immobilisée en collatéral, indisponible. */
  readonly blocked: number;
}

export const ACCOUNTS: readonly CashAccount[] = [
  { currency: 'EUR', bank: 'Compte courant principal', iban: 'LU28 0019 4471 0028 0000', balance: 28640000, blocked: 1250000 },
  { currency: 'USD', bank: 'Compte devises', iban: 'LU28 0019 4471 0028 0201', balance: 7420000, blocked: 0 },
  { currency: 'CHF', bank: 'Compte devises', iban: 'LU28 0019 4471 0028 0305', balance: 1180000, blocked: 0 },
  { currency: 'GBP', bank: 'Compte devises', iban: 'LU28 0019 4471 0028 0410', balance: 640000, blocked: 120000 },
  { currency: 'EUR', bank: 'Compte de collatéral', iban: 'LU28 0019 4471 0028 0512', balance: -420000, blocked: 0 },
];

export type FlowState = 'Réglé' | 'Instruit' | 'Prévu' | 'À valider';

export interface Flow {
  readonly date: string;
  readonly label: string;
  readonly detail: string;
  readonly kind: string;
  /** Signé : positif à l'encaissement, négatif au décaissement. */
  readonly amount: number;
  readonly state: FlowState;
}

export const FLOWS: readonly Flow[] = [
  { date: '01/09', label: 'Coupon IG Corporate Bond', detail: 'Deux souches — sleeve obligataire', kind: 'Encaissement', amount: 182400, state: 'Prévu' },
  { date: '02/09', label: 'Frais de gestion T3', detail: 'Prélèvement automatique', kind: 'Décaissement', amount: -96200, state: 'Prévu' },
  { date: '03/09', label: 'Règlement ORD-2026-0841', detail: 'Achat USLC — 10 500 parts', kind: 'Décaissement', amount: -437300, state: 'Instruit' },
  { date: '08/09', label: 'Virement client LU12 …4471', detail: 'TRF-2026-0114', kind: 'Décaissement', amount: -750000, state: 'Instruit' },
  { date: '12/09', label: 'Appel de fonds Private Equity', detail: 'Cranmore Co-invest III', kind: 'Décaissement', amount: -1250000, state: 'Prévu' },
  { date: '15/09', label: 'Dividende GLBEQ', detail: 'DIV-2026-0207 — net de retenue', kind: 'Encaissement', amount: 168683, state: 'Prévu' },
  { date: '30/08', label: 'Vente EMEQ — produit net', detail: 'ORD-2026-0839', kind: 'Encaissement', amount: 112504, state: 'Réglé' },
  { date: '29/08', label: 'Achat IGCRD — règlement', detail: 'ORD-2026-0836', kind: 'Décaissement', amount: -247835, state: 'Réglé' },
];

export const FLOW_STATE_TINT: Readonly<Record<FlowState, { bg: string; fg: string }>> = {
  'Réglé': { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  'Instruit': { bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  'Prévu': { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  'À valider': { bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
};

export type HorizonKey = '30j' | '90j' | '12m';

export interface Horizon {
  readonly key: HorizonKey;
  readonly label: string;
  /** Libellé de chaque barre du prévisionnel. */
  readonly buckets: readonly string[];
  /** Solde projeté en millions d'euros, une valeur par barre. */
  readonly series: readonly number[];
}

export const HORIZONS: readonly Horizon[] = [
  { key: '30j', label: '30 jours', buckets: ['S36', 'S37', 'S38', 'S39', 'S40'], series: [28.6, 27.9, 26.4, 25.1, 26.8] },
  { key: '90j', label: '90 jours', buckets: ['Sep', 'Oct', 'Nov'], series: [26.8, 24.2, 22.6] },
  { key: '12m', label: '12 mois', buckets: ['T3', 'T4', 'T1', 'T2'], series: [26.8, 22.6, 19.4, 21.2] },
];

/** Seuil de trésorerie minimum fixé par le compte, en millions d'euros. */
export const MIN_CASH = 22;

export interface Alert {
  readonly title: string;
  readonly detail: string;
  readonly color: string;
}

export const ALERTS: readonly Alert[] = [
  { title: 'Compte de collatéral débiteur', detail: '−420 000 € sur le compte 0512 ; appel de marge à couvrir avant le 02/09.', color: 'var(--ink-warn-2)' },
  { title: 'Seuil minimum approché le 12/09', detail: "L'appel de fonds Private Equity ramène le solde projeté à 25,1 M€.", color: 'var(--ds-brand-fill, var(--ink-brand-2))' },
  { title: 'Excédent de liquidité', detail: '3,6 points au-dessus de la cible du compte : placement ou réemploi à instruire.', color: 'var(--color-neutral-500)' },
];

export interface Placement {
  readonly label: string;
  readonly detail: string;
  readonly rate: string;
  readonly horizon: string;
}

export const PLACEMENTS: readonly Placement[] = [
  { label: 'Dépôt à terme 1 mois', detail: 'Banque dépositaire · EUR', rate: '3,15 %', horizon: '30 jours' },
  { label: 'Fonds monétaire court terme', detail: 'Liquidité quotidienne · EUR', rate: '3,02 %', horizon: 'J+1' },
  { label: 'Bons du Trésor 3 mois', detail: 'Zone euro · EUR', rate: '2,88 %', horizon: '90 jours' },
];

/* Les icones disent ce que l'instruction fait a la tresorerie, pas ce qu'elle est : la
   sortie de fonds, la demande recue, l'echange d'une devise contre une autre, l'immobilisation
   pour une duree. */
export const INSTRUCTION_KINDS: readonly Option[] = [
  { value: 'virement', label: 'Virement sortant', icon: 'log-out' },
  { value: 'appel', label: 'Appel de fonds', icon: 'receipt' },
  { value: 'fx', label: 'Opération de change', icon: 'shuffle' },
  { value: 'placement', label: 'Placement à terme', icon: 'clock' },
];

export const FLOW_FILTERS: readonly Option[] = [
  { value: 'all', label: 'Tous' },
  { value: 'in', label: 'Encaissements' },
  { value: 'out', label: 'Décaissements' },
];

/* Teinte d'une vignette. Le prototype la devinait en cherchant des codes hexadécimaux dans la
   couleur déjà posée ; elle est ici déclarée pour ce qu'elle est — une intention de lecture —
   plutôt que reniflée dans une chaîne de style. */
export type Tone = 'ok' | 'warn' | 'neutral';

export const TONE_TINT: Readonly<Record<Tone, { bg: string; ink: string }>> = {
  ok: { bg: 'var(--band-ok)', ink: 'var(--ink-ok)' },
  warn: { bg: 'var(--band-warn)', ink: 'var(--ink-warn-2)' },
  neutral: { bg: 'var(--surface)', ink: 'var(--color-neutral-700)' },
};

export function num(v: number, d = 0): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Contre-valeur en euro d'un montant libellé dans une devise. */
export function toEur(amount: number, currency: string): number {
  return amount * (FX[currency] ?? 1);
}

/** Montant signé, le moins étant typographique et non un trait d'union. */
export function signed(v: number, suffix = ' €'): string {
  return `${v > 0 ? '+' : '−'}${num(Math.abs(v))}${suffix}`;
}

/** Saisie à la française vers nombre : espaces, virgule décimale et symboles tolérés. */
export function parseAmount(raw: string): number {
  return parseFloat(String(raw).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
}
