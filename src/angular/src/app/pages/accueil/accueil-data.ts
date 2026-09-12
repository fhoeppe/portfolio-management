export type NewsImpact = 'positive' | 'negative' | 'neutral' | 'corporate';

export interface NewsItem {
  readonly time: string;
  readonly ticker: string;
  readonly exposure: string;
  readonly source: string;
  readonly impact: NewsImpact;
  readonly move: string;
  readonly title: string;
  readonly body: string;
}

export interface Mover {
  readonly ticker: string;
  readonly name: string;
  readonly weight: string;
  readonly day: number;
  readonly contrib: number;
}

export interface Alert {
  readonly title: string;
  readonly detail: string;
  readonly level: 'high' | 'mid' | 'low';
}

export interface Deadline {
  readonly date: string;
  readonly label: string;
  readonly amount: string;
}

export interface IndexQuote {
  readonly name: string;
  readonly value: string;
  readonly chg: number;
}

export const NEWS: readonly NewsItem[] = [
  {
    time: '08:42',
    ticker: 'USLC',
    exposure: 'Poids 20,1 %',
    source: 'Reuters',
    impact: 'positive',
    move: '+1,4 %',
    title: 'Résultats trimestriels supérieurs aux attentes dans la technologie américaine',
    body: 'Les trois premières pondérations du sleeve US Large Cap publient des marges en hausse ; le consensus relève ses objectifs.',
  },
  {
    time: '08:15',
    ticker: 'EMEQ',
    exposure: 'Poids 5,7 %',
    source: 'Bloomberg',
    impact: 'negative',
    move: '−0,9 %',
    title: 'Tensions sur les devises émergentes après la décision de la banque centrale',
    body: "Le sleeve EM subit la baisse du real et du rand ; couverture partielle en place sur 40 % de l'exposition.",
  },
  {
    time: '07:58',
    ticker: 'INFRA',
    exposure: 'Poids 2,5 %',
    source: 'Communiqué',
    impact: 'neutral',
    move: '—',
    title: 'Infrastructure Fund II convoque son assemblée générale le 19 septembre',
    body: "Ordre du jour : prolongation de la période d'investissement et révision du règlement de gestion.",
  },
  {
    time: '07:30',
    ticker: 'IGCRD',
    exposure: 'Poids 9,1 %',
    source: 'S&P Global',
    impact: 'positive',
    move: '+0,2 %',
    title: 'Relèvement de notation sur deux émetteurs du portefeuille obligataire',
    body: "Passage de BBB à BBB+ ; l'écart de crédit moyen du sleeve se resserre de 6 points de base.",
  },
  {
    time: 'Hier',
    ticker: 'REIT',
    exposure: 'Poids 4,1 %',
    source: 'Les Échos',
    impact: 'negative',
    move: '−0,5 %',
    title: 'Le marché immobilier coté reste sous pression en zone euro',
    body: 'Les taux longs pèsent sur les valorisations ; la ligne reste sous sa cible de rendement annuelle.',
  },
  {
    time: 'Hier',
    ticker: 'TSY10',
    exposure: 'Poids 12,1 %',
    source: 'Trésor US',
    impact: 'neutral',
    move: '+0,1 %',
    title: 'Adjudication du 10 ans américain absorbée sans tension',
    body: 'Demande solide des investisseurs étrangers ; la duration du portefeuille reste à 5,4 ans.',
  },
  {
    time: '09:05',
    ticker: 'GLBEQ',
    exposure: 'Poids 20,1 %',
    source: 'Avis financier',
    impact: 'corporate',
    move: '2,10 €/part',
    title: 'Dividende annuel détaché le 08/09, versement le 15/09',
    body: 'Rendement de 2,4 % sur la ligne ; encaissement estimé à 198 400 € sur le compte espèces du compte.',
  },
  {
    time: '08:55',
    ticker: 'USLC',
    exposure: 'Poids 20,1 %',
    source: 'Convocation',
    impact: 'corporate',
    move: '—',
    title: 'Assemblée générale ordinaire le 24/09 — vote par procuration ouvert',
    body: "Résolutions : affectation du résultat, renouvellement du conseil, autorisation de rachat d'actions. Réponse avant le 20/09.",
  },
  {
    time: '08:30',
    ticker: 'IGCRD',
    exposure: 'Poids 9,1 %',
    source: 'Dépositaire',
    impact: 'corporate',
    move: '182 400 €',
    title: 'Coupon semestriel payable le 01/09',
    body: 'Deux souches concernées ; réinvestissement à instruire ou maintien en trésorerie selon le rééquilibrage en cours.',
  },
  {
    time: 'Hier',
    ticker: 'EUEQ',
    exposure: 'Poids 8,5 %',
    source: 'Avis financier',
    impact: 'corporate',
    move: '3 pour 1',
    title: 'Opération sur titre : division du nominal effective le 10/09',
    body: 'Le nombre de parts sera multiplié par trois sans effet sur la valorisation de la ligne.',
  },
];

export const MOVERS: readonly Mover[] = [
  { ticker: 'USLC', name: 'US Large Cap Core', weight: '20,1 %', day: 1.42, contrib: 0.29 },
  { ticker: 'GLBEQ', name: 'Global Equity Index', weight: '20,1 %', day: 0.61, contrib: 0.12 },
  { ticker: 'IGCRD', name: 'IG Corporate Bond', weight: '9,1 %', day: 0.18, contrib: 0.02 },
  { ticker: 'REIT', name: 'Listed Real Estate', weight: '4,1 %', day: -0.52, contrib: -0.02 },
  { ticker: 'EMEQ', name: 'EM Equity Sleeve', weight: '5,7 %', day: -0.88, contrib: -0.05 },
  { ticker: 'HYLD', name: 'High Yield Sleeve', weight: '3,5 %', day: -0.24, contrib: -0.01 },
];

export const ALERTS: readonly Alert[] = [
  {
    title: 'Actions : 57,3 % contre 55 % de cible',
    detail: 'Écart de 2,3 points, hors bande de tolérance de 2 points. Rééquilibrage à instruire.',
    level: 'high',
  },
  {
    title: 'Trésorerie : 8,6 % contre 5 % de cible',
    detail: 'Excédent de liquidité depuis le remboursement du coupon TSY10.',
    level: 'mid',
  },
  {
    title: 'Concentration émetteur : 4,1 %',
    detail: 'Sous la limite interne de 5 % ; surveillance maintenue sur la ligne USLC.',
    level: 'low',
  },
];

export const DEADLINES: readonly Deadline[] = [
  { date: '01/09', label: 'Coupon IG Corporate Bond', amount: '182 400 €' },
  { date: '05/09', label: 'Reporting mensuel client BGM-004', amount: '—' },
  { date: '12/09', label: 'Appel de fonds Private Equity', amount: '1 250 000 €' },
  { date: '19/09', label: 'Assemblée générale Infrastructure Fund II', amount: '—' },
  { date: '30/09', label: 'Clôture trimestrielle et valorisation', amount: '—' },
];

export const INDICES: readonly IndexQuote[] = [
  { name: 'CAC 40', value: '7 842,15', chg: 0.42 },
  { name: 'Euro Stoxx 50', value: '4 986,70', chg: 0.31 },
  { name: 'S&P 500', value: '5 614,08', chg: 0.58 },
  { name: 'Nasdaq 100', value: '19 927,44', chg: 0.86 },
  { name: 'MSCI World', value: '3 712,90', chg: 0.39 },
  { name: 'MSCI EM', value: '1 108,26', chg: -0.74 },
  { name: 'Bund 10 a.', value: '2,41 %', chg: -0.03 },
  { name: 'UST 10 a.', value: '4,12 %', chg: 0.02 },
  { name: 'EUR/USD', value: '1,0874', chg: -0.12 },
  { name: 'Or', value: '2 418 $', chg: 0.21 },
];

export const NEWS_TAGS: Readonly<Record<NewsImpact, { readonly label: string; readonly bg: string; readonly fg: string }>> = {
  positive: { label: 'Favorable', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  negative: { label: 'Défavorable', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  neutral: { label: 'Neutre', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  corporate: { label: 'Vie du titre', bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' },
};

export interface Todo {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly urgent: boolean;
  readonly done: boolean;
}

export const INITIAL_TODOS: readonly Todo[] = [
  { id: 't1', label: 'Valider les ordres de rééquilibrage actions', meta: 'À faire aujourd\'hui · 4 ordres', urgent: true, done: false },
  { id: 't2', label: 'Revue KYC — Meridian Family', meta: 'Échéance 02/09', urgent: false, done: false },
  { id: 't3', label: "Confirmer l'appel de fonds Private Equity", meta: 'Échéance 12/09', urgent: false, done: false },
  { id: 't4', label: 'Signer le reporting mensuel BGM-004', meta: 'Terminé', urgent: false, done: true },
];
