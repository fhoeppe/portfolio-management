/**
 * Données statiques portées depuis `Titres.dc.html`. Le fetch `indices-composants.csv` du
 * prototype n'a pas de fichier correspondant dans le dépôt (confirmé par une recherche) : il
 * échoue systématiquement et retombe sur les membres statiques ci-dessous — on utilise donc
 * directement `INDICES[i].members`, sans reproduire le fetch/fusion CSV.
 */

export type PositionStatusKey = 'held' | 'settled' | 'watch' | 'followed' | 'never';

export interface PositionStatusDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

export interface Mandate {
  readonly value: string;
  readonly label: string;
}

export interface Security {
  readonly ticker: string;
  readonly name: string;
  readonly isin: string;
  readonly market: string;
  readonly assetClass: string;
  readonly rating: string;
  readonly cap: number;
  readonly status: 'ok' | 'none';
  readonly liquidity: string;
  readonly esg: string;
  readonly domicile: string;
  readonly currency: string;
  readonly complexity: string;
  readonly held: number;
  readonly mandates: readonly string[];
  readonly reviewed: string;
  readonly by: string;
  readonly note: string;
}

export interface IndexMember {
  readonly name: string;
  readonly ticker: string;
  readonly isin: string;
  readonly sector: string;
  readonly weight: number;
  readonly cap: string;
  readonly ref: 'ok' | 'none';
}

export interface IndexDef {
  readonly key: string;
  readonly region: string;
  readonly name: string;
  readonly place: string;
  readonly currency: string;
  readonly count: number;
  readonly detail: string;
  readonly members: readonly IndexMember[];
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
    ticker: 'GLBEQ', name: 'Global Equity Index', isin: 'LU1234567890', market: 'Luxembourg', assetClass: 'ETF',
    rating: '—', cap: 20, status: 'ok', liquidity: 'Élevée · 42 M€ de volume moyen', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 94500,
    mandates: ['BGM-004', 'INP-011', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: "Support cœur de l'allocation actions, éligible à tous les profils.",
  },
  {
    ticker: 'USLC', name: 'US Large Cap Core', isin: 'IE00B1234567', market: 'Dublin', assetClass: 'ETF',
    rating: '—', cap: 18, status: 'ok', liquidity: 'Élevée · 31 M€', esg: 'Article 8 SFDR',
    domicile: 'Irlande', currency: 'USD', complexity: 'Non complexe', held: 178900,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '12/06/2026', by: "Comité d'investissement",
    note: 'Exposition devise à couvrir au-delà de 15 % du portefeuille.',
  },
  {
    ticker: 'IGCRD', name: 'IG Corporate Bond', isin: 'XS1234567890', market: 'Euronext', assetClass: 'ETF',
    rating: 'A− (S&P)', cap: 25, status: 'ok', liquidity: 'Moyenne · 12 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 437000,
    mandates: ['BGM-004', 'INP-011'], reviewed: '03/07/2026', by: "Comité d'investissement",
    note: 'Notation minimale du compte prudent respectée.',
  },
  {
    ticker: 'EMEQ', name: 'EM Equity Sleeve', isin: 'LU4567890123', market: 'Luxembourg', assetClass: 'Fonds',
    rating: '—', cap: 10, status: 'ok', liquidity: 'Moyenne · 8 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'USD', complexity: 'Non complexe', held: 27600,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Plafond de 10 % et couverture de change obligatoire au-delà de 5 %.',
  },
  {
    ticker: 'INFRA', name: 'Infrastructure Fund II', isin: 'LU3456789012', market: 'Hors marché', assetClass: 'Fonds',
    rating: '—', cap: 8, status: 'ok', liquidity: 'Faible · valorisation trimestrielle', esg: 'Article 9 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Complexe', held: 12100,
    mandates: ['BGM-004', 'GLG-002'], reviewed: '30/06/2026', by: "Comité d'investissement",
    note: 'Réservé aux clients professionnels ; interdit au compte prudent.',
  },
  {
    ticker: 'PRVE', name: 'Private Equity Co-invest', isin: 'LU5678901234', market: 'Hors marché', assetClass: 'Fonds',
    rating: '—', cap: 6, status: 'ok', liquidity: 'Illiquide · appels de fonds', esg: 'Non classé',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Complexe', held: 31500,
    mandates: ['GLG-002'], reviewed: '30/06/2026', by: "Comité d'investissement",
    note: 'Validation du client requise avant tout nouvel engagement.',
  },
  {
    ticker: 'HYBND', name: 'High Yield Bond Fund', isin: 'IE00B7654321', market: 'Dublin', assetClass: 'Fonds',
    rating: 'BB− (S&P)', cap: 4, status: 'ok', liquidity: 'Moyenne · 6 M€', esg: 'Non classé',
    domicile: 'Irlande', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: [], reviewed: '18/07/2026', by: 'Conformité',
    note: 'Notation inférieure au minimum contractuel (BBB−) pour tous les comptes.',
  },
  {
    ticker: 'CRYPT', name: 'Digital Asset Tracker', isin: 'JE00BLD4ZL17', market: 'Xetra', assetClass: 'ETF',
    rating: '—', cap: 2, status: 'ok', liquidity: 'Élevée mais volatilité extrême', esg: 'Non classé',
    domicile: 'Jersey', currency: 'USD', complexity: 'Complexe', held: 0,
    mandates: [], reviewed: '05/05/2026', by: 'Conformité',
    note: "Classe d'actifs exclue par la politique d'investissement.",
  },
  {
    ticker: 'SMLCP', name: 'Euro Small Cap Growth', isin: 'LU6789012345', market: 'Luxembourg', assetClass: 'Fonds',
    rating: '—', cap: 3, status: 'ok', liquidity: 'Faible · 2 M€', esg: 'Article 8 SFDR',
    domicile: 'Luxembourg', currency: 'EUR', complexity: 'Non complexe', held: 0,
    mandates: ['GLG-002'], reviewed: '18/07/2026', by: "Comité d'investissement",
    note: 'Liquidité faible : achat plafonné à 3 % et accord préalable requis.',
  },
  {
    ticker: 'TSY10', name: 'Treasury 7–10 ans ETF', isin: 'US912828XX12', market: 'États-Unis', assetClass: 'ETF',
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

/** Titres sous surveillance : suivis sans être retenus dans l'univers. */
export const FOLLOWED: readonly string[] = ['INFRA', 'PRVE', 'SX5E', 'HYBND'];

export const POSITION_STATUS: Record<PositionStatusKey, PositionStatusDef> = {
  held: { label: 'En position', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)', hint: 'Détenu dans au moins un portefeuille' },
  settled: { label: 'Position soldée', bg: 'rgba(124,92,191,0.16)', fg: 'var(--ink-alt)', hint: "Plus détenu, présent dans l'historique des mouvements" },
  watch: { label: 'Retenu', bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)', hint: "Retenu dans l'univers, jamais négocié" },
  followed: { label: 'Suivi', bg: 'rgba(245,217,10,0.30)', fg: 'var(--ink-5c4700)', hint: "Sous surveillance : pas encore négociable, peut être retenu dans l'univers" },
  never: { label: 'Non retenu', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)', hint: "Hors univers d'investissement et jamais négocié" },
};

export const PORTFOLIO_LINKS: Record<string, { readonly held?: boolean; readonly history?: boolean }> = {
  AAPL: { held: true, history: true },
  ASML: { held: true, history: true },
  MSFT: { held: true, history: true },
  AI: { held: true, history: true },
  MC: { held: true, history: true },
  OR: { held: true, history: true },
  GLBEQ: { held: false, history: true },
  USLC: { held: false, history: true },
  TSY10: { held: false, history: true },
};

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

function synth(
  key: string, region: string, name: string, place: string, currency: string, count: number, detail: string,
  rows: readonly [string, string, string, string, number, string, 'ok' | 'none'][],
): IndexDef {
  return {
    key, region, name, place, currency, count, detail,
    members: rows.map((r) => ({ name: r[0], ticker: r[1], isin: r[2], sector: r[3], weight: r[4], cap: r[5], ref: r[6] })),
  };
}

const BASE_INDICES: readonly IndexDef[] = [
  {
    key: 'cac40', region: 'Europe continentale', name: 'CAC 40', place: 'Euronext Paris', currency: 'EUR', count: 40,
    detail: '40 valeurs · révision trimestrielle · devise EUR',
    members: [
      { name: 'TotalEnergies', ticker: 'TTE', isin: 'FR0000120271', sector: 'Énergie', weight: 8.4, cap: '148 Md€', ref: 'ok' },
      { name: 'LVMH', ticker: 'MC', isin: 'FR0000121014', sector: 'Consommation discrétionnaire', weight: 7.9, cap: '312 Md€', ref: 'ok' },
      { name: 'Sanofi', ticker: 'SAN', isin: 'FR0000120578', sector: 'Santé', weight: 6.1, cap: '124 Md€', ref: 'ok' },
      { name: 'Schneider Electric', ticker: 'SU', isin: 'FR0000121972', sector: 'Industrie', weight: 5.8, cap: '132 Md€', ref: 'ok' },
      { name: 'Air Liquide', ticker: 'AI', isin: 'FR0000120073', sector: 'Matériaux', weight: 5.2, cap: '104 Md€', ref: 'ok' },
      { name: 'BNP Paribas', ticker: 'BNP', isin: 'FR0000131104', sector: 'Finance', weight: 4.6, cap: '78 Md€', ref: 'ok' },
      { name: 'Hermès International', ticker: 'RMS', isin: 'FR0000052292', sector: 'Consommation discrétionnaire', weight: 4.1, cap: '228 Md€', ref: 'none' },
      { name: 'STMicroelectronics', ticker: 'STMPA', isin: 'NL0000226223', sector: 'Technologie', weight: 2.4, cap: '31 Md€', ref: 'none' },
      { name: 'Vinci', ticker: 'DG', isin: 'FR0000125486', sector: 'Industrie', weight: 3.2, cap: '68 Md€', ref: 'ok' },
      { name: 'Renault', ticker: 'RNO', isin: 'FR0000131906', sector: 'Automobile', weight: 0.8, cap: '13 Md€', ref: 'none' },
    ],
  },
  {
    key: 'dax', region: 'Europe continentale', name: 'DAX 40', place: 'Deutsche Börse', currency: 'EUR', count: 40,
    detail: '40 valeurs · révision trimestrielle · devise EUR',
    members: [
      { name: 'SAP', ticker: 'SAP', isin: 'DE0007164600', sector: 'Technologie', weight: 14.2, cap: '242 Md€', ref: 'ok' },
      { name: 'Siemens', ticker: 'SIE', isin: 'DE0007236101', sector: 'Industrie', weight: 9.8, cap: '164 Md€', ref: 'ok' },
      { name: 'Allianz', ticker: 'ALV', isin: 'DE0008404005', sector: 'Assurance', weight: 7.1, cap: '116 Md€', ref: 'ok' },
      { name: 'Deutsche Telekom', ticker: 'DTE', isin: 'DE0005557508', sector: 'Télécommunications', weight: 6.4, cap: '142 Md€', ref: 'ok' },
      { name: 'Airbus', ticker: 'AIR', isin: 'NL0000235190', sector: 'Aéronautique', weight: 5.9, cap: '128 Md€', ref: 'none' },
      { name: 'Munich Re', ticker: 'MUV2', isin: 'DE0008430026', sector: 'Assurance', weight: 4.2, cap: '64 Md€', ref: 'none' },
      { name: 'Mercedes-Benz Group', ticker: 'MBG', isin: 'DE0007100000', sector: 'Automobile', weight: 3.1, cap: '54 Md€', ref: 'ok' },
      { name: 'Rheinmetall', ticker: 'RHM', isin: 'DE0007030009', sector: 'Défense', weight: 2.8, cap: '42 Md€', ref: 'none' },
    ],
  },
  {
    key: 'sx5e', region: 'Europe continentale', name: 'EURO STOXX 50', place: 'Zone euro', currency: 'EUR', count: 50,
    detail: '50 valeurs de la zone euro · révision annuelle',
    members: [
      { name: 'ASML Holding', ticker: 'ASML', isin: 'NL0010273215', sector: 'Technologie', weight: 8.1, cap: '286 Md€', ref: 'ok' },
      { name: 'SAP', ticker: 'SAP', isin: 'DE0007164600', sector: 'Technologie', weight: 6.9, cap: '242 Md€', ref: 'ok' },
      { name: 'LVMH', ticker: 'MC', isin: 'FR0000121014', sector: 'Consommation discrétionnaire', weight: 5.4, cap: '312 Md€', ref: 'ok' },
      { name: 'Siemens', ticker: 'SIE', isin: 'DE0007236101', sector: 'Industrie', weight: 4.6, cap: '164 Md€', ref: 'ok' },
      { name: 'Iberdrola', ticker: 'IBE', isin: 'ES0144580Y14', sector: 'Services aux collectivités', weight: 3.4, cap: '92 Md€', ref: 'none' },
      { name: 'Enel', ticker: 'ENEL', isin: 'IT0003128367', sector: 'Services aux collectivités', weight: 3.1, cap: '74 Md€', ref: 'none' },
      { name: 'Intesa Sanpaolo', ticker: 'ISP', isin: 'IT0000072618', sector: 'Finance', weight: 2.7, cap: '68 Md€', ref: 'ok' },
      { name: 'Banco Santander', ticker: 'SAN', isin: 'ES0113900J37', sector: 'Finance', weight: 2.5, cap: '72 Md€', ref: 'ok' },
    ],
  },
  {
    key: 'spx', region: 'Amérique du Nord', name: 'S&P 500', place: 'NYSE / Nasdaq', currency: 'USD', count: 500,
    detail: '500 valeurs américaines · révision trimestrielle · devise USD',
    members: [
      { name: 'Apple', ticker: 'AAPL', isin: 'US0378331005', sector: 'Technologie', weight: 7.2, cap: '3 420 Md$', ref: 'ok' },
      { name: 'Microsoft', ticker: 'MSFT', isin: 'US5949181045', sector: 'Technologie', weight: 6.8, cap: '3 180 Md$', ref: 'ok' },
      { name: 'Nvidia', ticker: 'NVDA', isin: 'US67066G1040', sector: 'Semi-conducteurs', weight: 6.4, cap: '2 940 Md$', ref: 'ok' },
      { name: 'Amazon', ticker: 'AMZN', isin: 'US0231351067', sector: 'Consommation discrétionnaire', weight: 3.9, cap: '1 980 Md$', ref: 'ok' },
      { name: 'Alphabet', ticker: 'GOOGL', isin: 'US02079K3059', sector: 'Communication', weight: 3.6, cap: '2 140 Md$', ref: 'ok' },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', isin: 'US0846707026', sector: 'Finance', weight: 1.8, cap: '980 Md$', ref: 'none' },
      { name: 'JPMorgan Chase', ticker: 'JPM', isin: 'US46625H1005', sector: 'Finance', weight: 1.5, cap: '712 Md$', ref: 'ok' },
      { name: 'Tesla', ticker: 'TSLA', isin: 'US88160R1014', sector: 'Automobile', weight: 1.4, cap: '798 Md$', ref: 'none' },
    ],
  },
  {
    key: 'ftse', region: 'Royaume-Uni', name: 'FTSE 100', place: 'London Stock Exchange', currency: 'GBP', count: 100,
    detail: '100 valeurs britanniques · révision trimestrielle · devise GBP',
    members: [
      { name: 'AstraZeneca', ticker: 'AZN', isin: 'GB0009895292', sector: 'Santé', weight: 8.6, cap: '198 Md£', ref: 'ok' },
      { name: 'Shell', ticker: 'SHEL', isin: 'GB00BP6MXD84', sector: 'Énergie', weight: 7.9, cap: '164 Md£', ref: 'ok' },
      { name: 'HSBC Holdings', ticker: 'HSBA', isin: 'GB0005405286', sector: 'Finance', weight: 6.2, cap: '142 Md£', ref: 'ok' },
      { name: 'Unilever', ticker: 'ULVR', isin: 'GB00B10RZP78', sector: 'Consommation courante', weight: 5.1, cap: '118 Md£', ref: 'ok' },
      { name: 'RELX', ticker: 'REL', isin: 'GB00B2B0DG97', sector: 'Services professionnels', weight: 3.4, cap: '72 Md£', ref: 'none' },
      { name: 'BP', ticker: 'BP', isin: 'GB0007980591', sector: 'Énergie', weight: 3.1, cap: '64 Md£', ref: 'none' },
      { name: 'Rio Tinto', ticker: 'RIO', isin: 'GB0007188757', sector: 'Matériaux', weight: 2.8, cap: '58 Md£', ref: 'none' },
    ],
  },
  {
    key: 'smi', region: 'Suisse', name: 'SMI', place: 'SIX Swiss Exchange', currency: 'CHF', count: 20,
    detail: '20 valeurs suisses · révision annuelle · devise CHF',
    members: [
      { name: 'Nestlé', ticker: 'NESN', isin: 'CH0038863350', sector: 'Consommation courante', weight: 17.4, cap: '242 MdCHF', ref: 'ok' },
      { name: 'Roche Holding', ticker: 'ROG', isin: 'CH0012032048', sector: 'Santé', weight: 15.8, cap: '218 MdCHF', ref: 'ok' },
      { name: 'Novartis', ticker: 'NOVN', isin: 'CH0012005267', sector: 'Santé', weight: 14.2, cap: '206 MdCHF', ref: 'ok' },
      { name: 'UBS Group', ticker: 'UBSG', isin: 'CH0244767585', sector: 'Finance', weight: 6.1, cap: '92 MdCHF', ref: 'ok' },
      { name: 'Zurich Insurance', ticker: 'ZURN', isin: 'CH0011075394', sector: 'Assurance', weight: 5.4, cap: '78 MdCHF', ref: 'none' },
      { name: 'ABB', ticker: 'ABBN', isin: 'CH0012221716', sector: 'Industrie', weight: 4.8, cap: '96 MdCHF', ref: 'none' },
    ],
  },
];

export const REGIONS: readonly string[] = ['Europe continentale', 'Royaume-Uni', 'Suisse', 'Amérique du Nord', 'Asie-Pacifique', 'Marchés émergents', 'Mondial'];

const MORE_INDICES: readonly IndexDef[] = [
  synth('bel20', 'Europe continentale', 'BEL 20', 'Euronext Bruxelles', 'EUR', 20, '20 valeurs belges · révision annuelle · devise EUR', [
    ['KBC Groupe', 'KBC', 'BE0003565737', 'Finance', 12.4, '32 Md€', 'ok'],
    ['UCB', 'UCB', 'BE0003739530', 'Santé', 11.8, '38 Md€', 'ok'],
    ['Ageas', 'AGS', 'BE0974264930', 'Assurance', 8.1, '11 Md€', 'none'],
    ['Solvay', 'SOLB', 'BE0003470755', 'Matériaux', 6.4, '9 Md€', 'none'],
    ['Umicore', 'UMI', 'BE0974320526', 'Matériaux', 4.2, '4 Md€', 'none'],
  ]),
  synth('aex', 'Europe continentale', 'AEX', 'Euronext Amsterdam', 'EUR', 25, '25 valeurs néerlandaises · révision trimestrielle · devise EUR', [
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 18.2, '286 Md€', 'ok'],
    ['Shell', 'SHELL', 'GB00BP6MXD84', 'Énergie', 12.6, '164 Md€', 'ok'],
    ['ING Groep', 'INGA', 'NL0011821202', 'Finance', 7.4, '54 Md€', 'ok'],
    ['Wolters Kluwer', 'WKL', 'NL0000395903', 'Services professionnels', 5.8, '38 Md€', 'ok'],
    ['Adyen', 'ADYEN', 'NL0012969182', 'Paiements', 4.9, '46 Md€', 'none'],
  ]),
  synth('ibex', 'Europe continentale', 'IBEX 35', 'Bolsa de Madrid', 'EUR', 35, '35 valeurs espagnoles · révision semestrielle · devise EUR', [
    ['Inditex', 'ITX', 'ES0148396007', 'Consommation discrétionnaire', 15.1, '148 Md€', 'ok'],
    ['Iberdrola', 'IBE', 'ES0144580Y14', 'Services aux collectivités', 14.2, '92 Md€', 'none'],
    ['Banco Santander', 'SAN', 'ES0113900J37', 'Finance', 11.8, '72 Md€', 'ok'],
    ['BBVA', 'BBVA', 'ES0113211835', 'Finance', 9.6, '58 Md€', 'ok'],
    ['Amadeus IT', 'AMS', 'ES0109067019', 'Technologie', 5.2, '28 Md€', 'none'],
  ]),
  synth('ftsemib', 'Europe continentale', 'FTSE MIB', 'Borsa Italiana', 'EUR', 40, '40 valeurs italiennes · révision trimestrielle · devise EUR', [
    ['Enel', 'ENEL', 'IT0003128367', 'Services aux collectivités', 11.4, '74 Md€', 'none'],
    ['Intesa Sanpaolo', 'ISP', 'IT0000072618', 'Finance', 10.8, '68 Md€', 'ok'],
    ['UniCredit', 'UCG', 'IT0005239360', 'Finance', 9.7, '62 Md€', 'ok'],
    ['Ferrari', 'RACE', 'NL0011585146', 'Automobile', 8.2, '78 Md€', 'ok'],
    ['Eni', 'ENI', 'IT0003132476', 'Énergie', 6.4, '46 Md€', 'none'],
  ]),
  synth('omx', 'Europe continentale', 'OMX Stockholm 30', 'Nasdaq Stockholm', 'SEK', 30, '30 valeurs suédoises · révision semestrielle · devise SEK', [
    ['Atlas Copco', 'ATCO A', 'SE0017486889', 'Industrie', 11.2, '780 MdSEK', 'ok'],
    ['Investor AB', 'INVE B', 'SE0015811963', 'Holding', 9.4, '620 MdSEK', 'none'],
    ['Volvo', 'VOLV B', 'SE0000115446', 'Industrie', 8.1, '540 MdSEK', 'ok'],
    ['Ericsson', 'ERIC B', 'SE0000108656', 'Télécommunications', 5.6, '260 MdSEK', 'none'],
    ['Hexagon', 'HEXA B', 'SE0015961909', 'Technologie', 4.8, '290 MdSEK', 'none'],
  ]),
  synth('stoxx600', 'Europe continentale', 'STOXX Europe 600', 'Europe', 'EUR', 600, '600 valeurs européennes · révision trimestrielle · devise EUR', [
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 2.8, '286 Md€', 'ok'],
    ['Novo Nordisk', 'NOVO B', 'DK0062498333', 'Santé', 2.6, '294 Md€', 'ok'],
    ['Nestlé', 'NESN', 'CH0038863350', 'Consommation courante', 2.4, '242 MdCHF', 'ok'],
    ['SAP', 'SAP', 'DE0007164600', 'Technologie', 2.2, '242 Md€', 'ok'],
    ['AstraZeneca', 'AZN', 'GB0009895292', 'Santé', 2.1, '198 Md£', 'ok'],
    ['LVMH', 'MC', 'FR0000121014', 'Consommation discrétionnaire', 1.9, '312 Md€', 'ok'],
  ]),
  synth('ftse250', 'Royaume-Uni', 'FTSE 250', 'London Stock Exchange', 'GBP', 250, '250 valeurs britanniques de moyenne capitalisation · devise GBP', [
    ['Games Workshop', 'GAW', 'GB0003718474', 'Consommation discrétionnaire', 2.1, '5 Md£', 'none'],
    ['Bellway', 'BWY', 'GB0000904986', 'Construction', 1.4, '3 Md£', 'none'],
    ['Greggs', 'GRG', 'GB00B63QSB39', 'Consommation courante', 1.2, '3 Md£', 'none'],
    ['Britvic', 'BVIC', 'GB00B0N8QD54', 'Consommation courante', 1.1, '3 Md£', 'none'],
  ]),
  synth('nikkei', 'Asie-Pacifique', 'Nikkei 225', 'Tokyo Stock Exchange', 'JPY', 225, '225 valeurs japonaises · pondération par les prix · devise JPY', [
    ['Fast Retailing', '9983', 'JP3802300008', 'Consommation discrétionnaire', 10.4, '14 000 MdJPY', 'none'],
    ['Tokyo Electron', '8035', 'JP3571400005', 'Semi-conducteurs', 7.8, '11 000 MdJPY', 'ok'],
    ['Advantest', '6857', 'JP3122400009', 'Semi-conducteurs', 5.2, '6 800 MdJPY', 'none'],
    ['Sony Group', '6758', 'JP3435000009', 'Technologie', 3.4, '18 000 MdJPY', 'ok'],
    ['Toyota Motor', '7203', 'JP3633400001', 'Automobile', 2.1, '42 000 MdJPY', 'ok'],
  ]),
  synth('topix', 'Asie-Pacifique', 'TOPIX', 'Tokyo Stock Exchange', 'JPY', 2100, 'Ensemble du premier marché japonais · devise JPY', [
    ['Toyota Motor', '7203', 'JP3633400001', 'Automobile', 4.2, '42 000 MdJPY', 'ok'],
    ['Sony Group', '6758', 'JP3435000009', 'Technologie', 2.8, '18 000 MdJPY', 'ok'],
    ['Mitsubishi UFJ', '8306', 'JP3902900004', 'Finance', 2.4, '22 000 MdJPY', 'ok'],
    ['Keyence', '6861', 'JP3236200006', 'Industrie', 1.9, '15 000 MdJPY', 'none'],
  ]),
  synth('hsi', 'Asie-Pacifique', 'Hang Seng Index', 'Hong Kong', 'HKD', 82, '82 valeurs cotées à Hong Kong · devise HKD', [
    ['Tencent Holdings', '0700', 'KYG875721634', 'Technologie', 9.8, '4 200 MdHKD', 'ok'],
    ['Alibaba Group', '9988', 'KYG017191142', 'Consommation discrétionnaire', 8.4, '1 900 MdHKD', 'ok'],
    ['HSBC Holdings', '0005', 'GB0005405286', 'Finance', 7.6, '1 400 MdHKD', 'ok'],
    ['AIA Group', '1299', 'HK0000069689', 'Assurance', 6.2, '780 MdHKD', 'none'],
    ['Meituan', '3690', 'KYG596691041', 'Consommation discrétionnaire', 4.1, '760 MdHKD', 'none'],
  ]),
  synth('asx200', 'Asie-Pacifique', 'S&P/ASX 200', 'Australian Securities Exchange', 'AUD', 200, '200 valeurs australiennes · révision trimestrielle · devise AUD', [
    ['BHP Group', 'BHP', 'AU000000BHP4', 'Matériaux', 9.4, '210 MdAUD', 'ok'],
    ['Commonwealth Bank', 'CBA', 'AU000000CBA7', 'Finance', 8.8, '190 MdAUD', 'ok'],
    ['CSL', 'CSL', 'AU000000CSL8', 'Santé', 6.1, '140 MdAUD', 'ok'],
    ['Macquarie Group', 'MQG', 'AU000000MQG1', 'Finance', 4.2, '78 MdAUD', 'none'],
  ]),
  synth('kospi', 'Asie-Pacifique', 'KOSPI 200', 'Korea Exchange', 'KRW', 200, '200 valeurs coréennes · devise KRW', [
    ['Samsung Electronics', '005930', 'KR7005930003', 'Technologie', 22.4, '480 000 MdKRW', 'ok'],
    ['SK hynix', '000660', 'KR7000660001', 'Semi-conducteurs', 9.8, '160 000 MdKRW', 'ok'],
    ['Hyundai Motor', '005380', 'KR7005380001', 'Automobile', 4.1, '52 000 MdKRW', 'none'],
    ['Samsung Biologics', '207940', 'KR7207940008', 'Santé', 3.6, '68 000 MdKRW', 'none'],
  ]),
  synth('nasdaq100', 'Amérique du Nord', 'Nasdaq 100', 'Nasdaq', 'USD', 100, '100 valeurs non financières du Nasdaq · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 8.9, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 8.4, '3 180 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 7.8, '2 940 Md$', 'ok'],
    ['Broadcom', 'AVGO', 'US11135F1012', 'Semi-conducteurs', 4.6, '1 120 Md$', 'none'],
    ['Meta Platforms', 'META', 'US30303M1027', 'Communication', 4.2, '1 480 Md$', 'ok'],
  ]),
  synth('djia', 'Amérique du Nord', 'Dow Jones Industrial Average', 'NYSE', 'USD', 30, '30 valeurs américaines · pondération par les prix · devise USD', [
    ['UnitedHealth Group', 'UNH', 'US91324P1021', 'Santé', 8.2, '520 Md$', 'ok'],
    ['Goldman Sachs', 'GS', 'US38141G1040', 'Finance', 7.4, '168 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 6.8, '3 180 Md$', 'ok'],
    ['Home Depot', 'HD', 'US4370761029', 'Consommation discrétionnaire', 5.9, '380 Md$', 'ok'],
    ['Caterpillar', 'CAT', 'US1491231015', 'Industrie', 5.1, '176 Md$', 'none'],
  ]),
  synth('russell2000', 'Amérique du Nord', 'Russell 2000', 'NYSE / Nasdaq', 'USD', 2000, '2 000 petites capitalisations américaines · révision annuelle', [
    ['Super Micro Computer', 'SMCI', 'US86800U1043', 'Technologie', 0.8, '24 Md$', 'none'],
    ['Comfort Systems', 'FIX', 'US1998051019', 'Industrie', 0.4, '14 Md$', 'none'],
    ['Fabrinet', 'FN', 'KYG3323L1005', 'Technologie', 0.3, '9 Md$', 'none'],
  ]),
  synth('tsx', 'Amérique du Nord', 'S&P/TSX 60', 'Toronto Stock Exchange', 'CAD', 60, '60 grandes valeurs canadiennes · devise CAD', [
    ['Royal Bank of Canada', 'RY', 'CA7800871021', 'Finance', 9.2, '240 MdCAD', 'ok'],
    ['Shopify', 'SHOP', 'CA82509L1076', 'Technologie', 7.4, '180 MdCAD', 'none'],
    ['Enbridge', 'ENB', 'CA29250N1050', 'Énergie', 5.8, '128 MdCAD', 'none'],
    ['Canadian National Railway', 'CNR', 'CA1363751027', 'Industrie', 4.6, '96 MdCAD', 'ok'],
  ]),
  synth('msciem', 'Marchés émergents', 'MSCI Emerging Markets', 'Mondial', 'USD', 1400, 'Environ 1 400 valeurs de 24 pays émergents · devise USD', [
    ['TSMC', '2330', 'TW0002330008', 'Semi-conducteurs', 10.2, '980 Md$', 'ok'],
    ['Tencent Holdings', '0700', 'KYG875721634', 'Technologie', 4.4, '540 Md$', 'ok'],
    ['Samsung Electronics', '005930', 'KR7005930003', 'Technologie', 3.6, '360 Md$', 'ok'],
    ['Alibaba Group', '9988', 'KYG017191142', 'Consommation discrétionnaire', 2.8, '240 Md$', 'ok'],
    ['Reliance Industries', 'RELIANCE', 'INE002A01018', 'Énergie', 1.4, '210 Md$', 'none'],
  ]),
  synth('sensex', 'Marchés émergents', 'BSE SENSEX', 'Bombay Stock Exchange', 'INR', 30, '30 valeurs indiennes · devise INR', [
    ['HDFC Bank', 'HDFCBANK', 'INE040A01034', 'Finance', 13.8, '15 000 MdINR', 'ok'],
    ['Reliance Industries', 'RELIANCE', 'INE002A01018', 'Énergie', 11.2, '18 000 MdINR', 'none'],
    ['ICICI Bank', 'ICICIBANK', 'INE090A01021', 'Finance', 9.4, '9 000 MdINR', 'ok'],
    ['Infosys', 'INFY', 'INE009A01021', 'Technologie', 6.1, '7 000 MdINR', 'ok'],
  ]),
  synth('bovespa', 'Marchés émergents', 'Ibovespa', 'B3 São Paulo', 'BRL', 87, '87 valeurs brésiliennes · révision trimestrielle · devise BRL', [
    ['Vale', 'VALE3', 'BRVALEACNOR0', 'Matériaux', 11.4, '280 MdBRL', 'ok'],
    ['Petrobras', 'PETR4', 'BRPETRACNPR6', 'Énergie', 9.8, '480 MdBRL', 'none'],
    ['Itaú Unibanco', 'ITUB4', 'BRITUBACNPR1', 'Finance', 8.2, '320 MdBRL', 'ok'],
    ['Ambev', 'ABEV3', 'BRABEVACNOR1', 'Consommation courante', 4.6, '190 MdBRL', 'none'],
  ]),
  synth('msciworld', 'Mondial', 'MSCI World', 'Mondial', 'USD', 1500, 'Environ 1 500 valeurs de 23 pays développés · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 5.1, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 4.8, '3 180 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 4.4, '2 940 Md$', 'ok'],
    ['Amazon', 'AMZN', 'US0231351067', 'Consommation discrétionnaire', 2.6, '1 980 Md$', 'ok'],
    ['Novo Nordisk', 'NOVO B', 'DK0062498333', 'Santé', 0.9, '294 Md€', 'ok'],
  ]),
  synth('msciacwi', 'Mondial', 'MSCI ACWI', 'Mondial', 'USD', 2900, 'Marchés développés et émergents réunis · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 4.5, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 4.2, '3 180 Md$', 'ok'],
    ['TSMC', '2330', 'TW0002330008', 'Semi-conducteurs', 1.2, '980 Md$', 'ok'],
    ['Nestlé', 'NESN', 'CH0038863350', 'Consommation courante', 0.4, '242 MdCHF', 'ok'],
  ]),
  synth('ftseallworld', 'Mondial', 'FTSE All-World', 'Mondial', 'USD', 4200, 'Environ 4 200 valeurs, grandes et moyennes capitalisations mondiales', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 4.3, '3 420 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 3.9, '2 940 Md$', 'ok'],
    ['Alphabet', 'GOOGL', 'US02079K3059', 'Communication', 2.2, '2 140 Md$', 'ok'],
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 0.6, '286 Md€', 'ok'],
  ]),
];

export const INDICES: readonly IndexDef[] = [...BASE_INDICES, ...MORE_INDICES];

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
