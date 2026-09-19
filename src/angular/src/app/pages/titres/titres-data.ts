/**
 * Données statiques portées depuis `Titres.dc.html`. Le fetch `indices-composants.csv` du
 * prototype n'a pas de fichier correspondant dans le dépôt (confirmé par une recherche) : il
 * échoue systématiquement et retombe sur les membres statiques ci-dessous — on utilise donc
 * directement `INDICES[i].members`, sans reproduire le fetch/fusion CSV.
 */

export type { PositionStatusKey, PositionStatusDef, Security } from '../../domain/security-reference';
export { FOLLOWED, POSITION_STATUS, PORTFOLIO_LINKS } from '../../domain/security-reference';

import type { PositionStatusKey, PositionStatusDef, Security } from '../../domain/security-reference';
import { PORTFOLIO_LINKS } from '../../domain/security-reference';

export interface Mandate {
  readonly value: string;
  readonly label: string;
}


/** Seul un compte actif est sélectionnable : projet, ouverture, gelé, clôture et clôturé sont exclus. */
export const ACCOUNT_OPEN: Record<string, boolean> = { 'BGM-004': true, 'INP-011': true, 'BGM-002': true, 'INP-008': false, 'GLG-002': false, 'GLG-005': false };

export const MANDATES: readonly Mandate[] = [
  { value: 'all', label: 'Tous les comptes' },
  { value: 'BGM-004', label: 'BGM-004 · Cheval Blanc SCI — actif' },
  { value: 'INP-011', label: 'INP-011 · Fondation Ravel — actif' },
  { value: 'BGM-002', label: 'BGM-002 · Hoffmann Patrimoine — actif' },
  { value: 'GLG-002', label: 'GLG-002 · Meridian Family Office — en ouverture' },
  { value: 'INP-008', label: 'INP-008 · Succession Lentz — gelé' },
  { value: 'GLG-005', label: 'GLG-005 · Atlas Industries — en clôture' },
];

export const SECURITIES: readonly Security[] = [
  {
    ticker: 'AI', name: 'Air Liquide', isin: 'FR0000120073', market: 'Euronext Paris', assetClass: 'Action',
    rating: 'A− (S&P)', cap: 5, status: 'ok', liquidity: 'Élevée · 118 M€ de volume moyen', esg: 'Article 8 SFDR',
    domicile: 'France', currency: 'EUR', complexity: 'Non complexe', held: 37,
    mandates: ['BGM-004', 'BGM-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Valeur défensive de la cote parisienne, détenue au PEA Bourse Direct.',
  },
  {
    ticker: 'MC', name: 'LVMH', isin: 'FR0000121014', market: 'Euronext Paris', assetClass: 'Action',
    rating: 'A+ (S&P)', cap: 5, status: 'ok', liquidity: 'Élevée · 240 M€ de volume moyen', esg: 'Article 8 SFDR',
    domicile: 'France', currency: 'EUR', complexity: 'Non complexe', held: 5,
    mandates: ['BGM-004', 'BGM-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Première capitalisation du CAC 40, détenue au PEA Bourse Direct.',
  },
  {
    ticker: 'OR', name: "L'Oréal", isin: 'FR0000120321', market: 'Euronext Paris', assetClass: 'Action',
    rating: 'AA− (S&P)', cap: 5, status: 'ok', liquidity: 'Élevée · 165 M€ de volume moyen', esg: 'Article 8 SFDR',
    domicile: 'France', currency: 'EUR', complexity: 'Non complexe', held: 5,
    mandates: ['BGM-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Plafond de 5 % par compte : position à surveiller après la baisse récente.',
  },
  {
    ticker: 'GLBEQ', name: 'Global Equity Index', isin: 'LU1234567896', market: 'Luxembourg', assetClass: 'ETF',
    rating: '—', cap: 20, status: 'ok', liquidity: 'Élevée · 42 M€ de volume moyen', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 94500,
    mandates: ['BGM-004', 'INP-011', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: "Support cœur de l'allocation actions, éligible à tous les profils.",
  },
  {
    ticker: 'USLC', name: 'US Large Cap Core', isin: 'IE00B1234566', market: 'Dublin', assetClass: 'ETF',
    rating: '—', cap: 18, status: 'ok', liquidity: 'Élevée · 31 M€', esg: 'Article 8 SFDR',
    domicile: 'Irlande', currency: 'USD', complexity: 'Non complexe', held: 178900,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: 'Exposition devise à couvrir au-delà de 15 % du portefeuille.',
  },
  {
    ticker: 'IGCRD', name: 'IG Corporate Bond', isin: 'XS1234567896', market: 'Euronext', assetClass: 'ETF',
    rating: 'A− (S&P)', cap: 25, status: 'ok', liquidity: 'Moyenne · 12 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 437000,
    mandates: ['BGM-004', 'INP-011'], reviewed: '03/07/2026', by: "Comité d'investissement",
    note: 'Notation minimale du compte prudent respectée.',
  },
  {
    ticker: 'EMEQ', name: 'EM Equity Sleeve', isin: 'LU4567890125', market: 'Luxembourg', assetClass: 'Fonds',
    rating: '—', cap: 10, status: 'ok', liquidity: 'Moyenne · 8 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'USD', complexity: 'Non complexe', held: 27600,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Plafond de 10 % et couverture de change obligatoire au-delà de 5 %.',
  },
  {
    ticker: 'INFRA', name: 'Infrastructure Fund II', isin: 'LU3456789018', market: 'Hors marché', assetClass: 'Fonds',
    rating: '—', cap: 8, status: 'ok', liquidity: 'Faible · valorisation trimestrielle', esg: 'Article 9 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Complexe', held: 12100,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '30/06/2026', by: "Comité d'investissement",
    note: 'Réservé aux clients professionnels ; interdit au compte prudent.',
  },
  {
    ticker: 'PRVE', name: 'Private Equity Co-invest', isin: 'LU5678901230', market: 'Hors marché', assetClass: 'Fonds',
    rating: '—', cap: 6, status: 'ok', liquidity: 'Illiquide · appels de fonds', esg: 'Non classé',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Complexe', held: 31500,
    mandates: ['GLG-002'], reviewed: '30/06/2026', by: "Comité d'investissement",
    note: 'Validation du client requise avant tout nouvel engagement.',
  },
  {
    ticker: 'HYBND', name: 'High Yield Bond Fund', isin: 'IE00B7654320', market: 'Dublin', assetClass: 'Fonds',
    rating: 'BB− (S&P)', cap: 4, status: 'ok', liquidity: 'Moyenne · 6 M€', esg: 'Non classé',
    domicile: 'Irlande', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: [], reviewed: '18/07/2026', by: 'Conformité',
    note: 'Notation inférieure au minimum contractuel (BBB−) pour tous les comptes.',
  },
  {
    ticker: 'CRYPT', name: 'Digital Asset Tracker', isin: 'JE00BLD4ZL15', market: 'Xetra', assetClass: 'ETF',
    rating: '—', cap: 2, status: 'ok', liquidity: 'Élevée mais volatilité extrême', esg: 'Non classé',
    domicile: 'Jersey', currency: 'USD', complexity: 'Complexe', held: 0,
    mandates: [], reviewed: '05/05/2026', by: 'Conformité',
    note: "Classe d'actifs exclue par la politique d'investissement.",
  },
  {
    ticker: 'SMLCP', name: 'Euro Small Cap Growth', isin: 'LU6789012347', market: 'Luxembourg', assetClass: 'Fonds',
    rating: '—', cap: 3, status: 'ok', liquidity: 'Faible · 2 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: ['GLG-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Liquidité faible : achat plafonné à 3 % et accord préalable requis.',
  },
  {
    ticker: 'TSY10', name: 'Treasury 7–10 ans ETF', isin: 'US912828XX18', market: 'États-Unis', assetClass: 'ETF',
    rating: 'AA+ (S&P)', cap: 35, status: 'ok', liquidity: 'Très élevée', esg: 'Non applicable',
    domicile: 'États-Unis', currency: 'USD', complexity: 'Non complexe', held: 580000,
    mandates: ['BGM-004', 'INP-011', 'GLG-002'], reviewed: '03/07/2026', by: "Comité d'investissement",
    note: 'Support de duration, éligible sans restriction.',
  },
  {
    ticker: 'CAC40', name: 'Indice CAC 40', isin: 'FR0003500008', market: 'Euronext Paris', assetClass: 'Index',
    rating: '—', cap: 0, status: 'ok', liquidity: 'Très élevée · indice de référence', esg: 'Non applicable',
    domicile: 'France', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: ['BGM-004', 'INP-011', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: 'Indice de référence autorisé pour la mesure de performance et la couverture.',
  },
  {
    ticker: 'SX5E', name: 'Indice EURO STOXX 50', isin: 'EU0009658145', market: 'Zone euro', assetClass: 'Index',
    rating: '—', cap: 0, status: 'ok', liquidity: 'Très élevée · indice de référence', esg: 'Non applicable',
    domicile: 'Zone euro', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: "Indice de référence du sleeve actions zone euro.",
  },
];

export interface PricePeriod {
  readonly key: string;
  readonly label: string;
  readonly months: number;
}

export const PRICE_PERIODS: readonly PricePeriod[] = [
  { key: 'ytd', label: 'YTD', months: new Date().getMonth() + 1 },
  { key: '1m', label: '1 mois', months: 1 },
  { key: '6m', label: '6 mois', months: 6 },
  { key: '1a', label: '1 an', months: 12 },
  { key: '3a', label: '3 ans', months: 36 },
  { key: '5a', label: '5 ans', months: 60 },
  { key: 'max', label: 'Max', months: 120 },
];

export const PRICE_LAST: Record<string, number> = {
  AI: 166.8, MC: 551.2, OR: 354.1, GLBEQ: 1019.6, USLC: 44.1, IGCRD: 100.0,
  EMEQ: 1000.0, INFRA: 1240.0, PRVE: 1000.0, HYBND: 92.4, CRYPT: 38.6,
  SMLCP: 148.2, TSY10: 100.2, EUEQ: 225.1, REIT: 521.0,
};

/** Série de cours pseudo-aléatoire déterministe (seed dérivée du ticker) — pure, sans I/O. */
export function priceSeries(ticker: string, months: number): number[] {
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed = (seed * 31 + ticker.charCodeAt(i)) % 100000;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const last = PRICE_LAST[ticker] || 100;
  const n = Math.max(3, Math.min(months, 120));
  const drift = (rnd() - 0.42) * 0.012;
  const vol = 0.035 + rnd() * 0.03;
  const out = [last];
  for (let j = 1; j <= n; j++) {
    const prev = out[out.length - 1];
    out.push(Math.max(prev * 0.55, prev / (1 + drift + (rnd() - 0.5) * vol)));
  }
  return out.reverse();
}

export interface PriceGeometry {
  readonly line: string;
  readonly area: string;
  readonly ticks: readonly { readonly label: string }[];
  readonly up: boolean;
  readonly change: string;
  readonly stats: readonly { readonly label: string; readonly value: string }[];
}

export function priceGeometry(serie: readonly number[], devise: string): PriceGeometry {
  const w = 320, top = 8, bottom = 90;
  const min = Math.min(...serie), max = Math.max(...serie);
  const span = max - min || 1;
  const pts = serie.map((v, i) => [(i / (serie.length - 1)) * w, bottom - ((v - min) / span) * (bottom - top)] as const);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fmt = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + devise;
  const ticks: { label: string }[] = [];
  for (let k = 0; k < 5; k++) {
    const idx = Math.round((k / 4) * (serie.length - 1));
    const back = serie.length - 1 - idx;
    ticks.push({ label: back === 0 ? "aujourd'hui" : '−' + back + ' m' });
  }
  const first = serie[0], lastV = serie[serie.length - 1];
  const pct = first ? ((lastV - first) / first) * 100 : 0;
  return {
    line,
    area: line + ' L' + w + ' ' + bottom + ' L0 ' + bottom + ' Z',
    ticks,
    up: lastV >= first,
    change: (pct >= 0 ? '+' : '−') + Math.abs(pct).toFixed(2).replace('.', ',') + ' %',
    stats: [
      { label: 'Plus bas', value: fmt(min) },
      { label: 'Plus haut', value: fmt(max) },
      { label: 'Amplitude', value: ((span / (min || 1)) * 100).toFixed(1).replace('.', ',') + ' %' },
    ],
  };
}


export interface MarketInfo {
  readonly symbol: string;
  readonly place: string;
  readonly country: string;
  readonly sector: string;
  readonly index: string;
  readonly activity: string;
}

export const MARKET_INFO: Record<string, MarketInfo> = {
  AI: { symbol: 'XPAR.AI', place: 'Euronext Paris', country: 'France', sector: 'Gaz industriels et santé', index: 'CAC 40', activity: 'Production et distribution de gaz industriels et médicaux.' },
  MC: { symbol: 'XPAR.MC', place: 'Euronext Paris', country: 'France', sector: 'Luxe', index: 'CAC 40', activity: 'Groupe de produits de luxe : mode, maroquinerie, vins et spiritueux.' },
  OR: { symbol: 'XPAR.OR', place: 'Euronext Paris', country: 'France', sector: 'Cosmétiques', index: 'CAC 40', activity: 'Fabrication et vente de produits cosmétiques et dermatologiques.' },
  GLBEQ: { symbol: 'XLUX.GLBEQ', place: 'Bourse de Luxembourg', country: 'Luxembourg', sector: 'Fonds indiciel — actions monde', index: 'MSCI World', activity: "Réplication d'un indice actions mondial, capitalisation large et moyenne." },
  USLC: { symbol: 'XDUB.USLC', place: 'Euronext Dublin', country: 'Irlande', sector: 'Fonds indiciel — actions américaines', index: 'S&P 500', activity: 'Exposition aux grandes capitalisations américaines.' },
  IGCRD: { symbol: 'XLON.IGCRD', place: 'London Stock Exchange', country: 'Luxembourg', sector: 'Obligations — crédit investment grade', index: 'iBoxx € Corporates', activity: "Portefeuille d'obligations d'entreprises de qualité investment grade." },
  EMEQ: { symbol: 'XLUX.EMEQ', place: 'Bourse de Luxembourg', country: 'Luxembourg', sector: 'Fonds indiciel — actions émergentes', index: 'MSCI EM', activity: 'Exposition aux marchés actions émergents.' },
  INFRA: { symbol: 'OTC.INFRA', place: 'Hors marché', country: 'Luxembourg', sector: 'Alternatifs — infrastructures', index: '—', activity: "Investissement direct dans des actifs d'infrastructure européens." },
  PRVE: { symbol: 'OTC.PRVE', place: 'Hors marché', country: 'Luxembourg', sector: 'Alternatifs — capital-investissement', index: '—', activity: 'Co-investissements en capital-développement.' },
  HYBND: { symbol: 'XDUB.HYBND', place: 'Euronext Dublin', country: 'Irlande', sector: 'Obligations — haut rendement', index: '—', activity: "Obligations d'entreprises à haut rendement." },
  CRYPT: { symbol: 'XETR.CRYPT', place: 'Xetra Francfort', country: 'Jersey', sector: 'Alternatifs — actifs numériques', index: '—', activity: 'Réplication du cours de plusieurs actifs numériques.' },
  SMLCP: { symbol: 'XLUX.SMLCP', place: 'Bourse de Luxembourg', country: 'Luxembourg', sector: 'Fonds indiciel — petites capitalisations', index: 'MSCI Europe Small Cap', activity: 'Exposition aux petites capitalisations européennes.' },
  TSY10: { symbol: 'XNYS.TSY10', place: 'New York Stock Exchange', country: 'États-Unis', sector: "Obligations — dette d'État", index: 'ICE US Treasury 7-10Y', activity: "Emprunts d'État américains de maturité 7 à 10 ans." },
};

export const STATUS: Record<'ok' | 'none', { readonly label: string; readonly bg: string; readonly fg: string }> = {
  ok: { label: 'Retenu', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  none: { label: 'Hors univers', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

export const IG_GRADES: readonly string[] = ['AAA', 'AA+', 'AA', 'AA−', 'A+', 'A', 'A−', 'BBB+', 'BBB', 'BBB−'];

export const CONSENSUS: Record<string, { readonly view: string; readonly target: string; readonly analysts: number }> = {
  AI: { view: 'Achat', target: '192,00 EUR', analysts: 23 },
  MC: { view: 'Conserver', target: '605,00 EUR', analysts: 28 },
  OR: { view: 'Achat', target: '402,00 EUR', analysts: 21 },
  GLBEQ: { view: 'Achat', target: '1 105,00 EUR', analysts: 18 },
  USLC: { view: 'Achat fort', target: '49,80 USD', analysts: 24 },
  IGCRD: { view: 'Conserver', target: '101,20 EUR', analysts: 9 },
  EMEQ: { view: 'Conserver', target: '1 020,00 USD', analysts: 12 },
  INFRA: { view: 'Achat', target: '1 310,00 EUR', analysts: 4 },
  PRVE: { view: 'Conserver', target: '—', analysts: 3 },
  HYBND: { view: 'Vendre', target: '92,40 EUR', analysts: 7 },
  CRYPT: { view: 'Vendre fort', target: '—', analysts: 2 },
  SMLCP: { view: 'Achat', target: '164,00 EUR', analysts: 11 },
  TSY10: { view: 'Conserver', target: '101,00 USD', analysts: 6 },
};

export const FUNDAMENTALS: Record<string, { readonly divFreq: string; readonly eps: number; readonly sector: string }> = {
  AI: { divFreq: 'Annuelle', eps: 6.6, sector: 'Matériaux de base' },
  MC: { divFreq: 'Semestrielle', eps: 24.2, sector: 'Consommation discrétionnaire' },
  OR: { divFreq: 'Annuelle', eps: 12.4, sector: 'Consommation de base' },
  GLBEQ: { divFreq: 'Semestrielle', eps: 0, sector: 'Diversifié' },
  USLC: { divFreq: 'Trimestrielle', eps: 0, sector: 'Diversifié' },
  IGCRD: { divFreq: 'Trimestrielle', eps: 0, sector: 'Finance' },
  EMEQ: { divFreq: 'Annuelle', eps: 0, sector: 'Diversifié' },
  INFRA: { divFreq: 'Semestrielle', eps: 42.6, sector: 'Services aux collectivités' },
  PRVE: { divFreq: 'Aucune', eps: 0, sector: 'Finance' },
  HYBND: { divFreq: 'Mensuelle', eps: 0, sector: 'Finance' },
  CRYPT: { divFreq: 'Aucune', eps: 0, sector: 'Technologie' },
  SMLCP: { divFreq: 'Annuelle', eps: 3.8, sector: 'Industrie' },
  TSY10: { divFreq: 'Semestrielle', eps: 0, sector: 'Souverain' },
};

export const DIV_FREQ: readonly string[] = ['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle', 'Irrégulière', 'Aucune'];

export const SECTORS: readonly { readonly name: string; readonly icon: string }[] = [
  { name: 'Énergie', icon: '⛽' },
  { name: 'Matériaux de base', icon: '⛏️' },
  { name: 'Industrie', icon: '🏭' },
  { name: 'Consommation discrétionnaire', icon: '🛍️' },
  { name: 'Consommation de base', icon: '🧺' },
  { name: 'Santé', icon: '🩺' },
  { name: 'Finance', icon: '🏦' },
  { name: 'Technologie', icon: '💻' },
  { name: 'Services de communication', icon: '📡' },
  { name: 'Services aux collectivités', icon: '💡' },
  { name: 'Immobilier', icon: '🏢' },
  { name: 'Souverain', icon: '🏛️' },
  { name: 'Diversifié', icon: '🌐' },
];

export const CONSENSUS_VIEWS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Achat fort', label: 'Achat fort' },
  { value: 'Achat', label: 'Achat' },
  { value: 'Conserver', label: 'Conserver' },
  { value: 'Vendre', label: 'Vendre' },
  { value: 'Vendre fort', label: 'Vendre fort' },
];

export const RATING_SCALE: readonly { readonly code: string; readonly label: string }[] = [
  { code: 'AAA', label: 'Qualité de crédit la plus élevée' },
  { code: 'AA+', label: 'Très haute qualité' },
  { code: 'AA', label: 'Très haute qualité' },
  { code: 'AA−', label: 'Très haute qualité' },
  { code: 'A+', label: 'Haute qualité' },
  { code: 'A', label: 'Haute qualité' },
  { code: 'A−', label: 'Haute qualité' },
  { code: 'BBB+', label: 'Qualité moyenne supérieure' },
  { code: 'BBB', label: 'Qualité moyenne' },
  { code: 'BBB−', label: 'Dernier échelon investment grade' },
  { code: 'BB+', label: 'Spéculatif — surveillance' },
  { code: 'BB', label: 'Spéculatif' },
  { code: 'BB−', label: 'Spéculatif' },
  { code: 'B+', label: 'Très spéculatif' },
  { code: 'B', label: 'Très spéculatif' },
  { code: 'B−', label: 'Très spéculatif' },
  { code: 'CCC+', label: 'Risque de défaut élevé' },
  { code: 'CCC', label: 'Risque de défaut élevé' },
  { code: 'CCC−', label: 'Risque de défaut élevé' },
  { code: 'CC', label: 'Défaut très probable' },
  { code: 'C', label: 'Défaut imminent' },
  { code: 'D', label: 'En défaut de paiement' },
];
export const RATING_ORDER: readonly string[] = RATING_SCALE.map((r) => r.code);

/* Les indices et leur composition sont sortis vers `domain/indices.ts` : ils ne décrivent aucun
   écran, et `IndexCompositionService` les lisait depuis cette page, ce qui faisait dépendre un
   service de domaine d'un dossier de pages. Réexportés ici pour que les appelants historiques —
   la page Titres, ses filtres, l'Accueil — n'aient rien à changer. */
export type { IndexDef, IndexMember } from '../../domain/indices';
export { INDICES, INDEX_MIC, indexMic, indexOf } from '../../domain/indices';

export const REGIONS: readonly string[] = ['Europe continentale', 'Royaume-Uni', 'Suisse', 'Amérique du Nord', 'Asie-Pacifique', 'Marchés émergents', 'Mondial'];


/** Teinte des vignettes KPI : verte si la valeur est positive, rouge sinon (dérivée de la couleur déjà posée). */
export function toneByColor<T extends { readonly color?: string; readonly valueColor?: string; readonly noteColor?: string }>(
  k: T,
): T & { readonly bg: string; readonly labelColor: string } {
  const c = String(k.color || k.valueColor || k.noteColor || '');
  const green = c.indexOf('0f766e') >= 0 || c.indexOf('0b5f57') >= 0 || c.indexOf('15803d') >= 0;
  const red = c.indexOf('b45309') >= 0 || c.indexOf('a4552c') >= 0 || c.indexOf('dc2626') >= 0;
  if (!green && !red) return { ...k, bg: 'var(--surface)', labelColor: 'var(--color-neutral-700)' };
  const tint = green ? 'var(--band-ok)' : 'var(--band-warn)';
  const ink = green ? 'var(--ink-ok)' : 'var(--ink-warn-2)';
  return { ...k, bg: tint, labelColor: ink, color: ink, valueColor: ink } as T & { readonly bg: string; readonly labelColor: string };
}
