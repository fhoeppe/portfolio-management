/**
 * Jeu de données figé du prototype `TableauDeBord.dc.html` (README : « les données sont
 * fictives et codées en dur dans chaque composant »). À remplacer par les services réels
 * (positions, performance, anomalies…) quand ils existeront ; les structures ci-dessous
 * sont normatives au sens du README du dossier de conception.
 */

export type PeriodKey = 'ytd' | '1m' | '3m' | '6m' | '1a' | '3a' | '5a' | 'max';

export interface Mandate {
  readonly value: string;
  readonly label: string;
}

export const MANDATES: readonly Mandate[] = [
  { value: 'bgm', label: 'Balanced Growth — BGM-004' },
  { value: 'inp', label: 'Income & Preservation — INP-011' },
  { value: 'glg', label: 'Global Growth — GLG-002' },
  { value: 'all', label: 'Tous les comptes' },
];

export interface PeriodSeries {
  readonly ticks: readonly string[];
  readonly perf: readonly number[];
  readonly bench: readonly number[];
}

export const SERIES: Readonly<Record<PeriodKey, PeriodSeries>> = {
  ytd: {
    ticks: ['Janv.', 'Mars', 'Mai', 'Juil.', 'Sept.'],
    perf: [0, 1.8, 3.1, 2.6, 4.9, 6.2, 5.7, 7.4, 8.94],
    bench: [0, 1.4, 2.4, 2.2, 3.8, 5.0, 4.9, 6.1, 7.2],
  },
  '1m': {
    ticks: ['4 août', '11', '18', '25', '3 sept.'],
    perf: [0, 0.4, 0.9, 0.6, 1.2, 1.0, 1.62],
    bench: [0, 0.3, 0.6, 0.5, 0.8, 0.9, 1.1],
  },
  '3m': {
    ticks: ['Juin', 'Juil.', 'Août', 'Sept.'],
    perf: [0, 0.9, 1.6, 1.2, 2.4, 3.1, 3.42],
    bench: [0, 0.7, 1.2, 1.0, 1.9, 2.4, 2.61],
  },
  '6m': {
    ticks: ['Mars', 'Mai', 'Juil.', 'Sept.'],
    perf: [0, 1.2, 2.4, 2.0, 3.6, 4.8, 5.61],
    bench: [0, 1.0, 1.9, 1.7, 2.9, 3.9, 4.42],
  },
  '1a': {
    ticks: ['Sept. 25', 'Déc.', 'Mars', 'Juin', 'Sept. 26'],
    perf: [0, 2.2, 4.1, 5.6, 7.2, 8.1, 9.8, 11.4, 12.6],
    bench: [0, 1.8, 3.2, 4.4, 5.9, 6.6, 8.0, 9.2, 10.4],
  },
  '3a': {
    ticks: ['2023', '2024', '2025', '2026'],
    perf: [0, 5.2, 9.8, 14.6, 19.3, 24.1, 28.7, 31.4],
    bench: [0, 4.1, 7.6, 11.4, 15.2, 19.1, 23.0, 25.6],
  },
  '5a': {
    ticks: ['2021', '2022', '2023', '2024', '2025', '2026'],
    perf: [0, 8.4, 4.2, 16.8, 27.4, 38.1, 46.2, 52.8],
    bench: [0, 7.1, 2.6, 13.9, 22.8, 31.4, 38.6, 44.1],
  },
  max: {
    ticks: ['2018', '2020', '2022', '2024', '2026'],
    perf: [0, 6.2, 11.4, 9.8, 22.6, 34.8, 48.2, 61.4, 74.6, 86.2],
    bench: [0, 5.1, 9.4, 7.8, 18.9, 29.2, 40.6, 51.8, 62.4, 71.8],
  },
};

export const PERIOD_LABEL: Readonly<Record<PeriodKey, string>> = {
  ytd: 'YTD',
  '1m': '1M',
  '3m': '3M',
  '6m': '6M',
  '1a': '1A',
  '3a': '3A',
  '5a': '5A',
  max: 'MAX',
};

export const PERIOD_LONG: Readonly<Record<PeriodKey, string>> = {
  ytd: 'depuis le 1er janvier',
  '1m': 'sur 1 mois',
  '3m': 'sur 3 mois',
  '6m': 'sur 6 mois',
  '1a': 'sur 1 an',
  '3a': 'sur 3 ans',
  '5a': 'sur 5 ans',
  max: "depuis l'origine",
};

export interface PositionRaw {
  readonly ticker: string;
  readonly name: string;
  readonly value: number;
  readonly weight: number;
  readonly day: number;
  readonly ytd: number;
}

export const POSITIONS: readonly PositionRaw[] = [
  { ticker: 'GLBEQ', name: 'Global Equity Index', value: 96.4, weight: 19.8, day: 0.61, ytd: 11.8 },
  { ticker: 'USLC', name: 'US Large Cap Core', value: 78.9, weight: 16.2, day: 1.42, ytd: 14.3 },
  { ticker: 'TSY10', name: 'Treasury 7–10 ans', value: 58.1, weight: 12.0, day: 0.11, ytd: 2.6 },
  { ticker: 'IGCRD', name: 'IG Corporate Bond', value: 43.7, weight: 9.0, day: 0.18, ytd: 3.4 },
  { ticker: 'EUEQ', name: 'Europe ex-UK Equity', value: 41.2, weight: 8.5, day: -0.18, ytd: 6.4 },
  { ticker: 'PRVE', name: 'Private Equity Co-invest', value: 31.5, weight: 6.5, day: 0, ytd: 8.9 },
  { ticker: 'EMEQ', name: 'EM Equity Sleeve', value: 27.6, weight: 5.7, day: -0.88, ytd: 3.1 },
  { ticker: 'REIT', name: 'Listed Real Estate', value: 19.8, weight: 4.1, day: -0.52, ytd: -2.4 },
];

export interface AllocationRaw {
  readonly label: string;
  readonly actual: number;
  readonly target: number;
}

export const ALLOCATION: readonly AllocationRaw[] = [
  { label: 'Actions', actual: 57.3, target: 55 },
  { label: 'Obligations', actual: 25.4, target: 26 },
  { label: 'Alternatifs', actual: 13.1, target: 14 },
  { label: 'Trésorerie', actual: 8.6, target: 5 },
];

export interface ExposureItem {
  readonly label: string;
  readonly value: number;
}

export const EXPOSURES: Readonly<Record<'currency' | 'region', readonly ExposureItem[]>> = {
  currency: [
    { label: 'EUR', value: 58.2 },
    { label: 'USD', value: 27.4 },
    { label: 'CHF', value: 6.1 },
    { label: 'GBP', value: 4.8 },
    { label: 'Autres', value: 3.5 },
  ],
  region: [
    { label: 'Zone euro', value: 41.6 },
    { label: 'Amérique du N.', value: 32.8 },
    { label: 'Asie dév.', value: 12.4 },
    { label: 'Émergents', value: 9.1 },
    { label: 'Autres', value: 4.1 },
  ],
};

export interface ActivityRaw {
  readonly time: string;
  readonly label: string;
  readonly detail: string;
  readonly tag: string;
  readonly level: 'ok' | 'info' | 'warn';
}

export const ACTIVITY: readonly ActivityRaw[] = [
  { time: '09:41', label: 'Exécution partielle ORD-2026-0841', detail: '3 100 parts USLC à 41,71 €', tag: 'Ordre', level: 'info' },
  { time: '08:26', label: 'Ordre validé ORD-2026-0841', detail: 'Achat 12 000 parts, limite 41,80 €', tag: 'Ordre', level: 'info' },
  { time: '07:45', label: 'Transfert de titres dénoué', detail: 'TRF-2026-0113 — 4 200 parts GLBEQ', tag: 'Transfert', level: 'ok' },
  { time: '07:20', label: 'Confirmation dépositaire', detail: 'ORD-2026-0839 — référence CUST-77412', tag: 'Titres', level: 'ok' },
  { time: 'Hier', label: 'Dividende annoncé GLBEQ', detail: '2,10 € par part, détachement le 08/09', tag: 'Dividende', level: 'info' },
  { time: 'Hier', label: 'Dépassement de bande actions', detail: '57,3 % contre 55 % de cible', tag: 'Limite', level: 'warn' },
];

export type Severity = 'high' | 'medium' | 'low';

export interface AnomalyRaw {
  readonly label: string;
  readonly detail: string;
  readonly source: string;
  readonly when: string;
  readonly severity: Severity;
  readonly action: string;
}

export const ANOMALIES: readonly AnomalyRaw[] = [
  {
    label: 'Écart de position EUEQ',
    detail: '61 000 parts en interne contre 183 000 chez le dépositaire — division du nominal non appliquée',
    source: 'Réconciliation',
    when: "Aujourd'hui 07:16",
    severity: 'high',
    action: 'Appliquer la division',
  },
  {
    label: "Bande d'allocation actions dépassée",
    detail: "57,3 % contre une cible de 55 %, hors bande de 2 points",
    source: 'Contrôle des limites',
    when: "Aujourd'hui 07:05",
    severity: 'high',
    action: 'Instruire un rééquilibrage',
  },
  {
    label: 'Compte de collatéral débiteur',
    detail: '−420 000 € ; appel de marge à couvrir avant le 02/09',
    source: 'Trésorerie',
    when: 'Hier 18:20',
    severity: 'high',
    action: 'Alimenter le compte',
  },
  {
    label: 'Ordre partiellement exécuté non dénoué',
    detail: 'ORD-2026-0841 — 10 500 parts USLC en attente de confirmation',
    source: 'Transactions',
    when: "Aujourd'hui 09:41",
    severity: 'medium',
    action: 'Suivre le dénouement',
  },
  {
    label: 'Écritures comptables en attente de validation',
    detail: '2 pièces : droits de garde août et commission T3',
    source: 'Comptabilité',
    when: 'Hier 07:40',
    severity: 'medium',
    action: 'Valider les écritures',
  },
  {
    label: 'Écart espèces sur compte collatéral',
    detail: "420 € d'intérêts débiteurs non comptabilisés",
    source: 'Réconciliation',
    when: "Aujourd'hui 07:16",
    severity: 'medium',
    action: 'Comptabiliser',
  },
  {
    label: 'KYC trésorier à renouveler',
    detail: "Fondation Ravel — pièce d'identité expirée depuis le 12/08",
    source: 'Comptes',
    when: '12/08',
    severity: 'low',
    action: 'Relancer le client',
  },
  {
    label: 'Prix de valorisation ancien',
    detail: 'Infrastructure Fund II — dernière valeur liquidative du 30/06',
    source: 'Positions',
    when: '30/06',
    severity: 'low',
    action: 'Demander la VL',
  },
];

export const SEVERITY_LABEL: Readonly<Record<Severity, string>> = {
  high: 'Bloquante',
  medium: 'À traiter',
  low: 'Surveillance',
};

export type Tone = 'warn' | 'ok' | 'neutral';

export interface RiskIndicator {
  readonly label: string;
  readonly detail: string;
  readonly value: string;
  readonly tone: Tone;
}

export const RISK_INDICATORS: readonly RiskIndicator[] = [
  { label: 'VaR 1 mois, 99 %', detail: 'Historique, 3 ans de données', value: '−4,8 %', tone: 'warn' },
  { label: 'Volatilité annualisée', detail: 'Réf. 9,4 %', value: '8,7 %', tone: 'neutral' },
  { label: 'Bêta actions', detail: 'Contre MSCI World', value: '1,02', tone: 'neutral' },
  { label: 'Duration obligataire', detail: 'Limite du compte 7 ans', value: '5,4 a.', tone: 'neutral' },
  { label: 'Ratio de Sharpe', detail: '12 mois glissants', value: '1,18', tone: 'ok' },
  { label: 'Part illiquide', detail: 'Limite 20 %', value: '9,0 %', tone: 'neutral' },
];
