/**
 * Modèles de choc et référentiel d'actifs de l'écran « Gestion du risque ».
 *
 * Porté de `Simulation.dc.html`. Les treize modèles combinent un choc de valorisation global
 * (`shockPct`) et une trajectoire de dividendes (`divGrowth`) ; le choc réel subi par une classe
 * d'actifs est ce choc global multiplié par le coefficient de la classe pour ce modèle, ce qui
 * fait qu'un même scénario ne frappe pas les actions et la trésorerie de la même façon.
 */

export interface ScopeOption {
  readonly value: string;
  readonly label: string;
  /** Part du patrimoine total que représente ce périmètre. */
  readonly share: number;
}

export const SCOPES: readonly ScopeOption[] = [
  { value: 'all', label: 'Tous les comptes', share: 1 },
  { value: 'BGM-004', label: 'Degiro — CTO Degiro', share: 0.42 },
  { value: 'GLG-002', label: 'Bourse Direct — PEA', share: 0.31 },
  { value: 'TR-001', label: 'Trade Republic — CTO', share: 0.27 },
];

export interface ShockModel {
  readonly key: string;
  readonly title: string;
  readonly detail: string;
  readonly iconBg: string;
  readonly iconFg: string;
  /** Couleur du filet de gauche et de la pastille une fois le modèle retenu. */
  readonly mark: string;
  readonly shockPct: number;
  readonly divGrowth: number;
  readonly note: string;
}

export const MODELS: readonly ShockModel[] = [
  { key: 'crash', title: 'Krach actions', detail: '-20 % sur les marchés actions, mondial et immédiat.', iconBg: 'rgba(143,63,6,0.14)', iconFg: 'var(--ink-warn)', mark: 'var(--ink-warn)', shockPct: -0.2, divGrowth: -0.1, note: "Choc historique de type 2008 ou mars 2020, appliqué à l'ensemble des lignes actions." },
  { key: 'rates', title: 'Choc de taux', detail: '+150 points de base sur les taux souverains.', iconBg: 'rgba(0,61,165,0.14)', iconFg: 'var(--ink-brand)', mark: 'var(--ink-brand)', shockPct: -0.08, divGrowth: -0.02, note: 'Hausse brutale des taux, impact négatif sur la duration obligataire du portefeuille.' },
  { key: 'fx', title: 'Choc de change', detail: "EUR/USD +10 %, dépréciation de l'euro.", iconBg: 'rgba(15,118,110,0.14)', iconFg: 'var(--ink-ok)', mark: 'var(--ink-ok)', shockPct: -0.03, divGrowth: -0.01, note: 'Variation de change défavorable sur les positions libellées en devise étrangère non couvertes.' },
  { key: 'sector', title: 'Rotation sectorielle', detail: 'Technologie -15 %, valeurs défensives +5 %, par secteur GICS.', iconBg: 'rgba(124,92,191,0.16)', iconFg: 'var(--ink-alt)', mark: 'var(--ink-alt)', shockPct: -0.06, divGrowth: 0.01, note: 'Retournement de style, pénalise les portefeuilles concentrés sur la croissance.' },
  { key: 'liquidity', title: 'Crise de liquidité', detail: "Écartement des spreads, décote sur l'illiquide.", iconBg: 'rgba(180,83,9,0.14)', iconFg: 'var(--ink-warn-2)', mark: 'var(--ink-warn-2)', shockPct: -0.12, divGrowth: -0.03, note: "Décote appliquée aux actifs peu liquides (private equity, infrastructure) faute d'acheteurs." },
  { key: 'historical', title: 'Rejeu historique', detail: 'Reproduit la baisse du 1er trimestre 2020.', iconBg: 'rgba(2,132,199,0.14)', iconFg: 'var(--ink-info)', mark: 'var(--ink-info)', shockPct: -0.24, divGrowth: -0.08, note: 'Applique la trajectoire réelle des marchés sur une fenêtre historique choisie au portefeuille actuel.' },
  { key: 'dividend', title: 'Croissance des dividendes', detail: 'Projette une hausse de +5 % par an des dividendes versés.', iconBg: 'rgba(11,95,87,0.14)', iconFg: 'var(--ink-ok)', mark: 'var(--ink-ok)', shockPct: 0, divGrowth: 0.05, note: 'Aucun choc de valorisation : seule la trajectoire des revenus de dividendes est projetée sur un an.' },
  { key: 'inflation', title: 'Choc inflationniste', detail: 'Inflation à 6 %, taux réels négatifs.', iconBg: 'rgba(180,83,9,0.14)', iconFg: 'var(--ink-warn-2)', mark: 'var(--ink-warn-2)', shockPct: -0.11, divGrowth: 0.02, note: "Érosion du pouvoir d'achat des coupons fixes ; les actifs réels résistent mieux." },
  { key: 'concentration', title: "Défaut d'un émetteur", detail: 'Perte totale sur la première ligne du portefeuille.', iconBg: 'rgba(143,63,6,0.14)', iconFg: 'var(--ink-warn)', mark: 'var(--ink-warn)', shockPct: -0.09, divGrowth: -0.06, note: 'Teste la concentration : défaut du plus gros émetteur détenu, sans effet de contagion.' },
  { key: 'correlation', title: 'Rupture de corrélation', detail: 'Actions et obligations baissent ensemble.', iconBg: 'rgba(124,92,191,0.16)', iconFg: 'var(--ink-alt)', mark: 'var(--ink-alt)', shockPct: -0.16, divGrowth: -0.04, note: 'La diversification cesse de protéger : toutes les classes reculent simultanément, comme en 2022.' },
  { key: 'divcut', title: 'Coupe des dividendes', detail: '-40 % sur les dividendes annoncés.', iconBg: 'rgba(143,63,6,0.14)', iconFg: 'var(--ink-warn)', mark: 'var(--ink-warn)', shockPct: -0.04, divGrowth: -0.4, note: 'Scénario de préservation de trésorerie par les émetteurs : les revenus chutent avant les cours.' },
  { key: 'geopolitical', title: 'Choc géopolitique', detail: 'Énergie +40 %, émergents -25 %.', iconBg: 'rgba(2,132,199,0.14)', iconFg: 'var(--ink-info)', mark: 'var(--ink-info)', shockPct: -0.14, divGrowth: -0.05, note: "Rupture d'approvisionnement et fuite vers la qualité, pénalise les expositions émergentes." },
  { key: 'custom', title: 'Choc personnalisé', detail: 'Définissez vos propres hypothèses de marché.', iconBg: 'var(--color-neutral-200)', iconFg: 'var(--color-neutral-700)', mark: 'var(--color-neutral-500)', shockPct: -0.1, divGrowth: 0, note: "Combinez librement des variations par classe d'actifs pour tester un scénario spécifique." },
];

/** Rendement du dividende retenu pour la projection à douze mois. */
export const DIV_YIELD = 0.028;

export interface AssetClass {
  readonly label: string;
  readonly weight: number;
  /** Clé du champ de saisie correspondant, en mode personnalisé. */
  readonly customKey: CustomKey;
  /** Sensibilité de la classe à chaque modèle : 1 = elle subit le choc global tel quel. */
  readonly mult: Readonly<Record<string, number>>;
}

export type CustomKey = 'equity' | 'bonds' | 'alt' | 'cash';

export const ASSET_CLASSES: readonly AssetClass[] = [
  { label: 'Actions', weight: 0.55, customKey: 'equity', mult: { crash: 1.15, rates: 0.6, fx: 0.7, sector: 1.2, liquidity: 0.4, historical: 1.1, custom: 1.0, dividend: 0, inflation: 0.9, concentration: 1.3, correlation: 1.1, divcut: 1.2, geopolitical: 1.2 } },
  { label: 'Obligations', weight: 0.26, customKey: 'bonds', mult: { crash: 0.2, rates: 1.3, fx: 0.3, sector: 0.1, liquidity: 0.5, historical: 0.4, custom: 1.0, dividend: 0, inflation: 1.4, concentration: 0.7, correlation: 1.2, divcut: 0.1, geopolitical: 0.5 } },
  { label: 'Alternatifs', weight: 0.13, customKey: 'alt', mult: { crash: 0.5, rates: 0.4, fx: 0.5, sector: 0.3, liquidity: 1.6, historical: 0.6, custom: 1.0, dividend: 0, inflation: 0.5, concentration: 0.6, correlation: 0.9, divcut: 0.3, geopolitical: 1.0 } },
  { label: 'Trésorerie', weight: 0.06, customKey: 'cash', mult: { crash: 0.0, rates: 0.1, fx: 0.2, sector: 0.0, liquidity: 0.0, historical: 0.0, custom: 1.0, dividend: 0, inflation: 0.6, concentration: 0.0, correlation: 0.0, divcut: 0.0, geopolitical: 0.0 } },
];

export const CUSTOM_FIELDS: readonly { key: CustomKey; label: string; placeholder: string }[] = [
  { key: 'equity', label: 'Actions (%)', placeholder: '-15' },
  { key: 'bonds', label: 'Obligations (%)', placeholder: '-5' },
  { key: 'alt', label: 'Alternatifs (%)', placeholder: '-8' },
  { key: 'cash', label: 'Trésorerie (%)', placeholder: '0' },
];

export const CUSTOM_DEFAULTS: Readonly<Record<CustomKey, string>> = {
  equity: '-15',
  bonds: '-5',
  alt: '-8',
  cash: '0',
};

/** Patrimoine de référence, tous comptes confondus. */
export const TOTAL_BASE = 486_200_000;

/** Trajectoire de référence : trois points avant le choc, quatre après. */
export const BASE_SERIE: readonly number[] = [100, 101, 99, 102, 101, 103, 102];

export const TICKS: readonly string[] = ['J-30', 'J-20', 'J-10', 'Choc', 'J+10', 'J+20', 'J+30'];

export function eur(v: number): string {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
}

/** Le signe négatif est un moins typographique, pas un trait d'union. */
export function pct(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(1).replace('.', ',') + ' %';
}

/** Tracé SVG d'une série, mise à l'échelle sur sa propre amplitude. */
export function path(series: readonly number[]): string {
  const w = 320;
  const h = 110;
  const min = Math.min(...series);
  const max = Math.max(...series);
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 7 - ((v - min) / (max - min || 1)) * (h - 20);
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
