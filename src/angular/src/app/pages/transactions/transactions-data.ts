/** Porté depuis les constantes de module de `Transactions.dc.html`. */

export type NatureKey = 'TRADE' | 'TRANSFER' | 'CORPORATE' | 'CASHFLOW';

export interface NatureDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly types: readonly string[];
  readonly desc: string;
}

export const NATURES: Record<NatureKey, NatureDef> = {
  TRADE: { label: 'TRADE', bg: 'rgba(15,118,110,0.32)', fg: 'var(--ink-ok)', types: ['BUY', 'SELL'], desc: 'Achat ou vente décidé par le détenteur.' },
  TRANSFER: { label: 'TRANSFER', bg: 'rgba(2,132,199,0.32)', fg: 'var(--ink-info)', types: ['TOUT', 'TIN', 'CASH'], desc: 'Déplacement entre deux comptes suivis ; le patrimoine total ne change pas.' },
  CORPORATE: { label: 'CORPORATE', bg: 'rgba(180,83,9,0.32)', fg: 'var(--ink-warn)', types: ['SPLIT', 'SPINOFF', 'MERGER', 'DIV', 'DIVOPT', 'BUYOPT'], desc: "Subi, décidé par l'émetteur et non par le détenteur." },
  CASHFLOW: { label: 'CASHFLOW', bg: 'rgba(162,28,175,0.32)', fg: 'var(--ink-magenta)', types: ['DEPOSIT', 'WITHDRAW', 'FEE', 'INTEREST', 'LENDING', 'REFUND'], desc: 'Espèces sans contrepartie en titres.' },
};

/** Teinte du badge Type (`.tx-type-badge`), plus claire que le badge Nature dont le type
 * dépend, pour les quatre natures : TRADE (BUY/SELL), CORPORATE (SPLIT/SPINOFF/MERGER/DIV/
 * DIVOPT/BUYOPT), CASHFLOW (DEPOSIT/WITHDRAW/FEE/INTEREST/LENDING/REFUND) et TRANSFER
 * (CASH/TIN/TOUT). Pas de jeton --ink-magenta-2/--ink-info-2 dans l'appli : pour CASHFLOW et
 * TRANSFER, seul le fond s'éclaircit, le texte reste --ink-magenta/--ink-info.
 * Partagé entre `transactions.ts` (détail des jambes) et `transactions-filters.ts` (registre). */
export const LIGHT_NATURE_TINT: Partial<Record<NatureKey, { readonly bg: string; readonly fg: string }>> = {
  TRADE: { bg: 'rgba(15,118,110,0.23)', fg: 'var(--ink-ok-2)' },
  CORPORATE: { bg: 'rgba(180,83,9,0.23)', fg: 'var(--ink-warn-2)' },
  CASHFLOW: { bg: 'rgba(162,28,175,0.23)', fg: 'var(--ink-magenta)' },
  TRANSFER: { bg: 'rgba(2,132,199,0.23)', fg: 'var(--ink-info)' },
};

export const TYPE_TO_NATURE: Partial<Record<string, NatureKey>> = Object.fromEntries(
  (Object.keys(NATURES) as NatureKey[]).flatMap((k) => NATURES[k].types.map((t) => [t, k])),
);

export interface TradableSecurity {
  readonly ticker: string;
  readonly label: string;
  readonly mic: string;
  readonly place: string;
}

export const TRADABLE_SECURITIES: readonly TradableSecurity[] = [
  { ticker: 'AI', label: 'AI — Air Liquide', mic: 'XPAR', place: 'Euronext Paris' },
  { ticker: 'MC', label: 'MC — LVMH', mic: 'XPAR', place: 'Euronext Paris' },
  { ticker: 'OR', label: "OR — L'Oréal", mic: 'XPAR', place: 'Euronext Paris' },
  { ticker: 'GLBEQ', label: 'GLBEQ — Global Equity Index', mic: 'XLUX', place: 'Bourse de Luxembourg' },
  { ticker: 'USLC', label: 'USLC — US Large Cap Core', mic: 'XDUB', place: 'Euronext Dublin' },
  { ticker: 'IGCRD', label: 'IGCRD — IG Corporate Bond', mic: 'XLON', place: 'London Stock Exchange' },
  { ticker: 'EMEQ', label: 'EMEQ — EM Equity Sleeve', mic: 'XLUX', place: 'Bourse de Luxembourg' },
  { ticker: 'INFRA', label: 'INFRA — Infrastructure Fund II', mic: 'OTC', place: 'Hors marché' },
  { ticker: 'PRVE', label: 'PRVE — Private Equity Co-invest', mic: 'OTC', place: 'Hors marché' },
  { ticker: 'HYBND', label: 'HYBND — High Yield Bond Fund', mic: 'XDUB', place: 'Euronext Dublin' },
  { ticker: 'CRYPT', label: 'CRYPT — Digital Asset Tracker', mic: 'XETR', place: 'Xetra Francfort' },
  { ticker: 'SMLCP', label: 'SMLCP — Euro Small Cap Growth', mic: 'XLUX', place: 'Bourse de Luxembourg' },
  { ticker: 'TSY10', label: 'TSY10 — Treasury 7–10 ans ETF', mic: 'XNYS', place: 'New York Stock Exchange' },
  { ticker: 'CAC40', label: 'CAC40 — Indice CAC 40', mic: 'XPAR', place: 'Euronext Paris' },
  { ticker: 'SX5E', label: 'SX5E — Indice EURO STOXX 50', mic: 'XEUR', place: 'Eurex' },
];

export const MIC_SHORT: Record<string, string> = {
  XPAR: 'Paris', XLUX: 'Luxembourg', XDUB: 'Dublin', XLON: 'Londres',
  OTC: 'Hors marché', XETR: 'Francfort', XNYS: 'New York', XEUR: 'Eurex',
};

export const MIC_PLACES: readonly { readonly value: string; readonly label: string }[] = Array.from(
  new Set(TRADABLE_SECURITIES.map((s) => s.mic)),
)
  .map((mic) => ({ value: mic, label: mic }))
  .concat([{ value: 'XXXX', label: 'XXXX' }]);

export const MIC_HINT =
  Array.from(new Set(TRADABLE_SECURITIES.map((s) => s.mic)))
    .map((mic) => mic + ' ' + (MIC_SHORT[mic] || ''))
    .join(' · ') + ' · XXXX place inconnue — tous les titres restent proposés';

export interface AccountRef {
  readonly value: string;
  readonly label: string;
  readonly code: string;
}

export const ACCOUNTS_LIST: readonly AccountRef[] = [
  { value: 'Degiro — CTO Degiro', label: 'Degiro — CTO', code: 'DG-CTO-4521' },
  { value: 'Bourse Direct — PEA', label: 'Bourse Direct — PEA', code: 'BD-PEA-1187' },
  { value: 'Trade Republic — CTO Trade Republic', label: 'Trade Republic — CTO', code: 'TR-CTO-0932' },
];

export const TIF: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'DAY', label: 'DAY' }, { value: 'GTC', label: 'GTC' }, { value: 'GTD', label: 'GTD' },
  { value: 'IOC', label: 'IOC' }, { value: 'FOK', label: 'FOK' }, { value: 'AON', label: 'AON' },
  { value: 'OPG', label: 'OPG' }, { value: 'MOC', label: 'MOC' },
];

export const LIMIT_STRATEGIES: readonly string[] = ['LMT', 'STPLMT', 'LOO', 'LOC', 'PEG'];

export const ORDER_STRATEGY: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'MKT', label: 'MKT' }, { value: 'LMT', label: 'LMT' }, { value: 'STP', label: 'STP' },
  { value: 'STPLMT', label: 'STP LMT' }, { value: 'TS', label: 'TS' }, { value: 'MOO', label: 'MOO' },
  { value: 'MOC', label: 'MOC' }, { value: 'LOO', label: 'LOO' }, { value: 'LOC', label: 'LOC' },
  { value: 'PEG', label: 'PEG' }, { value: 'ICE', label: 'ICE' }, { value: 'TWAP', label: 'TWAP' },
  { value: 'VWAP', label: 'VWAP' },
];

export const STRAT_NAME: Record<string, string> = {
  MKT: 'Au marché', LMT: 'À cours limité', STP: 'Stop', STPLMT: 'Stop limité',
  TS: 'Stop suiveur', MOO: "Au marché à l'ouverture", MOC: 'Au marché à la clôture',
  LOO: "Limité à l'ouverture", LOC: 'Limité à la clôture', PEG: 'Attaché à une référence',
  ICE: 'Iceberg', TWAP: 'Découpage dans le temps', VWAP: 'Découpage sur le volume',
};

export const STRAT_HINT =
  'MKT au marché · LMT à cours limité · STP stop · STP LMT stop limité · ' +
  "TS stop suiveur · MOO/MOC au marché à l'ouverture ou à la clôture · " +
  "LOO/LOC limité à l'ouverture ou à la clôture · PEG attaché à une référence · " +
  'ICE iceberg · TWAP/VWAP découpage automatique dans le temps ou sur le volume';

export const TIF_HINT =
  "DAY jusqu'à la clôture · GTC jusqu'à annulation · GTD jusqu'à une date · " +
  "IOC immédiat ou annulé · FOK tout ou rien immédiat · AON tout ou rien · " +
  "OPG à l'ouverture · MOC à la clôture";

export const FILL_STATUS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'full', label: 'Totale' },
  { value: 'partial', label: 'Partielle' },
];

export interface LegRule {
  readonly legs: number;
  readonly hint: string;
  readonly why: string;
}

export const LEG_RULES: Record<string, LegRule> = {
  BUY: { legs: 1, hint: 'Une opération, ou une par exécution partielle', why: "Le décaissement se déduit de quantité × prix + frais. Un ordre à cours limité dénoué en plusieurs exécutions, parfois sur plusieurs jours, produit autant d'opérations BUY que d'exécutions." },
  SELL: { legs: 1, hint: 'Une opération, ou une par exécution partielle', why: "L'encaissement se déduit de quantité × prix − frais. Même règle qu'à l'achat : chaque exécution partielle d'un ordre à cours limité est une opération SELL distincte." },
  BUYOPT: { legs: 1, hint: 'Une opération, ou une par exécution partielle', why: "Comptabilisée comme un achat : une souscription dénouée en plusieurs exécutions produit autant d'opérations BUYOPT." },
  TOUT: { legs: 2, hint: 'Deux opérations si la contrepartie est suivie', why: 'Départ et arrivée portent la même quantité et le même prix — un coût de base, jamais un cours.' },
  CASH: { legs: 2, hint: 'Deux opérations', why: "Débit à la source, crédit à l'arrivée : deux poches distinctes d'espèces — à ne pas confondre avec TOUT/TIN, qui déplacent des titres." },
  DIV: { legs: 0, hint: 'Aucune opération', why: 'Le dividende en numéraire vit dans les champs de la transaction : le net se déduit de brut − retenue.' },
  DIVOPT: { legs: 2, hint: 'Une ou deux opérations', why: "Une jambe si la parité tombe juste ; deux dès qu'un rompu est réglé en espèces." },
  SPLIT: { legs: 1, hint: 'Une opération par compte', why: "La parité fait tout : autant d'opérations que de comptes portant le titre." },
  DEPOSIT: { legs: 1, hint: 'Une opération', why: 'Une seule poche touchée.' },
  FEE: { legs: 1, hint: 'Une opération', why: 'À distinguer des frais portés par une opération sur titres.' },
  INTEREST: { legs: 1, hint: 'Une opération', why: 'Produit d’intérêts crédité sur la poche espèces.' },
  TIN: { legs: 1, hint: "Une opération, en pendant d'un TOUT", why: 'Réception d’un transfert sortant : même quantité, même coût de base que la jambe TOUT.' },
  SPINOFF: { legs: 1, hint: 'Une ou deux opérations', why: 'Une jambe pour la ligne mère ; une seconde si la ligne créée entre sur un autre compte ou reste hors univers.' },
  MERGER: { legs: 1, hint: 'Une ou deux opérations', why: 'Une jambe suffit quand la ligne reçue reste sur le même compte ; deux si une soulte en espèces est réglée.' },
  WITHDRAW: { legs: 1, hint: 'Une opération', why: "Retrait d'espèces débité sur la poche source." },
  LENDING: { legs: 1, hint: 'Une ou deux opérations', why: 'La commission seule, ou deux jambes si le prêt est suivi côté titres.' },
  REFUND: { legs: 1, hint: 'Une opération', why: "Remboursement d'espèces crédité sur la poche destinataire." },
};

export const LEG_OPNO: Record<string, readonly string[]> = {
  TXN000039: ['OPE000114', 'OPE000115'],
  TXN000038: ['OPE000112', 'OPE000113'],
  TXN000036: ['OPE000108', 'OPE000109'],
  TXN000035: ['OPE000105', 'OPE000106'],
};

export const TX_OPNO: Record<string, string> = {
  TXN000041: 'OPE000117', TXN000040: 'OPE000116', TXN000039: 'OPE000114', TXN000038: 'OPE000112',
  TXN000037: 'OPE000110', TXN000036: 'OPE000108', TXN000035: 'OPE000105', TXN000034: 'OPE000103',
  TXN000033: 'OPE000101', TXN000032: 'OPE000098', TXN000031: 'OPE000095',
};

export const TX_OP: Record<string, string> = {
  TXN000041: 'BUY', TXN000040: 'SELL', TXN000039: 'TOUT', TXN000038: 'DIVOPT',
  TXN000037: 'DIV', TXN000036: 'CASH', TXN000035: 'SPLIT', TXN000034: 'DEPOSIT',
  TXN000033: 'FEE', TXN000032: 'BUYOPT', TXN000031: 'INTEREST',
};

export const PLATFORM_ID: Record<string, number> = {
  'Degiro — CTO Degiro': 1,
  'Bourse Direct — PEA': 2,
  'Bourse Direct — PEA Bourse Direct': 2,
  'Trade Republic — CTO Trade Republic': 3,
};

export const ISIN_BY_TICKER: Record<string, string> = {
  AAPL: 'US0378331005', MC: 'FR0000121014', AI: 'FR0000120073', OR: 'FR0000120321',
  ASML: 'NL0010273215', MSFT: 'US5949181045', GLBEQ: 'LU1234567890',
  USLC: 'IE00B1234567', EUEQ: 'LU0000000001', REIT: 'LU5678901234',
};

export type RecoStateKey = 'matched' | 'pending' | 'gap' | 'unmatched' | 'manual';

export interface RecoStateDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

export const RECO_STATE: Record<RecoStateKey, RecoStateDef> = {
  matched: { label: 'Rapprochée', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok)', hint: 'Montant, quantité et date concordent avec le relevé du broker' },
  pending: { label: 'En attente', bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)', hint: 'Relevé du broker non encore reçu pour cette période' },
  gap: { label: 'Écart', bg: 'rgba(143,63,6,0.16)', fg: 'var(--ink-warn)', hint: 'Divergence de montant, de quantité ou de frais avec le relevé' },
  unmatched: { label: 'Sans contrepartie', bg: 'rgba(162,28,175,0.14)', fg: 'var(--ink-magenta)', hint: 'Aucune ligne correspondante dans le relevé du broker' },
  manual: { label: 'Forcée', bg: 'rgba(0,0,0,0.10)', fg: 'var(--color-neutral-700)', hint: 'Rapprochement validé manuellement malgré un écart résiduel' },
};

export interface RecoStatementLine {
  readonly line: string;
  readonly gross: number;
  readonly fee: number;
  readonly tax: number;
}

export const RECO_OP: Record<string, readonly RecoStatementLine[]> = {
  TXN000039: [
    { line: 'TRF-88412-OUT', gross: 3529.6, fee: 4.5, tax: 0 },
    { line: 'TRF-88412-IN', gross: 3529.6, fee: 0, tax: 0 },
  ],
  TXN000038: [
    { line: 'DIV-77120-T', gross: 168.2, fee: 0, tax: 0 },
    { line: 'DIV-77120-C', gross: 26, fee: 0, tax: 0 },
  ],
  TXN000037: [{ line: 'DIV-44012', gross: 154, fee: 0, tax: 0 }],
  TXN000036: [
    { line: 'CSH-10233-D', gross: 1500, fee: 1.2, tax: 0 },
    { line: 'CSH-10233-C', gross: 1500, fee: 0, tax: 0 },
  ],
  TXN000035: [
    { line: 'SPL-00891-A', gross: 0, fee: 0, tax: 0 },
    { line: 'SPL-00891-B', gross: 0, fee: 0, tax: 0 },
  ],
  TXN000034: [{ line: 'CSH-10190', gross: 5000, fee: 0, tax: 0 }],
  TXN000033: [{ line: 'FEE-00512', gross: 46.8, fee: 0, tax: 0 }],
  TXN000031: [{ line: 'INT-00077', gross: 12.4, fee: 0, tax: 0 }],
};

export interface RecoDetail {
  readonly statement: string;
  readonly line: string;
  readonly gross: number;
  readonly fee: number;
  readonly tax: number;
  readonly at: string;
  readonly by: string;
}

export const RECO_DETAIL: Record<string, RecoDetail> = {
  TXN000039: { statement: 'DG-2026-08-STMT', line: 'TRF-88412', gross: 3529.6, fee: 4.5, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000038: { statement: 'DG-2026-08-STMT', line: 'DIV-77120', gross: 168.2, fee: 0, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000037: { statement: 'BD-2026-08-STMT', line: 'DIV-44012', gross: 154, fee: 0, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000036: { statement: 'BD-2026-08-STMT', line: 'CSH-10233', gross: 1500, fee: 1.2, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000035: { statement: 'DG-2026-08-STMT', line: 'SPL-00891', gross: 0, fee: 0, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000034: { statement: 'DG-2026-08-STMT', line: 'CSH-10190', gross: 5000, fee: 0, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
  TXN000033: { statement: 'BD-2026-08-STMT', line: 'FEE-00512', gross: 46.8, fee: 0, tax: 0, at: '2026-08-31T09:40:00Z', by: 'A. Meyer' },
  TXN000031: { statement: 'DG-2026-08-STMT', line: 'INT-00077', gross: 12.4, fee: 0, tax: 0, at: '2026-08-31T07:15:00Z', by: 'Rapprochement automatique' },
};

export const RECO: Record<string, RecoStateKey> = {
  TXN000041: 'pending', TXN000040: 'pending', TXN000039: 'matched',
  TXN000038: 'gap', TXN000037: 'matched', TXN000036: 'matched',
  TXN000035: 'matched', TXN000034: 'matched', TXN000033: 'manual',
  TXN000032: 'unmatched', TXN000031: 'matched',
};

export interface Transaction {
  readonly ref: string;
  readonly nature: NatureKey;
  readonly date: string;
  readonly owner: string;
  readonly time: string;
  readonly modified: string;
  readonly comment: string;
  readonly legs: number;
  readonly account: string;
  readonly security: string;
  readonly qty?: number;
  readonly price?: number;
  readonly fees?: number;
  readonly taxes?: number;
  readonly amount: number;
  readonly sense: 'debit' | 'credit' | 'none';
  readonly settle: string;
}

export const TX: readonly Transaction[] = [
  { ref: 'TXN000041', nature: 'TRADE', date: '2026-09-03', owner: 'Fabrice HOËPPE', time: '09:41', modified: '2026-09-03', comment: 'Renforcement de la ligne technologique', legs: 1, account: 'Degiro — CTO Degiro', security: 'AAPL — Apple Inc.', qty: 20, price: 150, fees: 12, taxes: 1.8, amount: 3000, sense: 'debit', settle: '2026-09-07' },
  { ref: 'TXN000040', nature: 'TRADE', date: '2026-09-02', owner: 'Fabrice HOËPPE', time: '15:12', modified: '2026-09-04', comment: 'Allègement partiel avant détachement', legs: 1, account: 'Bourse Direct — PEA', security: 'MC — LVMH', qty: 10, price: 152.3, fees: 2.5, taxes: 0.46, amount: 1523, sense: 'credit', settle: '2026-09-08' },
  { ref: 'TXN000039', nature: 'TRANSFER', date: '2026-08-28', owner: 'Fabrice HOËPPE', time: '14:35', modified: '2026-08-30', comment: 'Consolidation des comptes', legs: 2, account: 'Degiro — CTO Degiro', security: 'AAPL — Apple Inc.', amount: 0, sense: 'none', settle: '2026-09-10' },
  { ref: 'TXN000038', nature: 'CORPORATE', date: '2026-08-26', owner: 'Fabrice HOËPPE', time: '08:20', modified: '2026-08-26', comment: 'Dividende optionnel — option titres retenue', legs: 2, account: 'Degiro — CTO Degiro', security: 'AI — Air Liquide', amount: 26, sense: 'credit', settle: '2026-08-26' },
  { ref: 'TXN000037', nature: 'CORPORATE', date: '2026-08-20', owner: 'Fabrice HOËPPE', time: '07:00', modified: '2026-08-20', comment: 'Détachement du coupon annuel', legs: 1, account: 'Bourse Direct — PEA', security: "OR — L'Oréal", amount: 154, sense: 'credit', settle: '2026-08-26' },
  { ref: 'TXN000036', nature: 'TRANSFER', date: '2026-08-18', owner: 'Fabrice HOËPPE', time: '11:05', modified: '2026-08-18', comment: 'Approvisionnement du PEA', legs: 2, account: 'Degiro — CTO Degiro', security: 'Espèces EUR', amount: 1500, sense: 'none', settle: '2026-08-18' },
  { ref: 'TXN000035', nature: 'CORPORATE', date: '2026-08-14', owner: 'Fabrice HOËPPE', time: '07:10', modified: '2026-08-14', comment: 'Division du nominal 3 pour 1', legs: 2, account: 'Degiro — CTO Degiro', security: 'EUEQ — Europe ex-UK Equity', amount: 0, sense: 'none', settle: '2026-08-14' },
  { ref: 'TXN000034', nature: 'CASHFLOW', date: '2026-08-12', owner: 'Fabrice HOËPPE', time: '10:30', modified: '2026-08-12', comment: 'Versement mensuel', legs: 1, account: 'Degiro — CTO Degiro', security: 'Espèces EUR', amount: 5000, sense: 'credit', settle: '2026-08-12' },
  { ref: 'TXN000033', nature: 'CASHFLOW', date: '2026-08-10', owner: 'Fabrice HOËPPE', time: '23:59', modified: '2026-08-10', comment: 'Droits de garde du trimestre', legs: 1, account: 'Bourse Direct — PEA', security: 'Droits de garde', amount: 48.6, sense: 'debit', settle: '2026-08-10' },
  { ref: 'TXN000032', nature: 'CORPORATE', date: '2026-08-06', owner: 'Fabrice HOËPPE', time: '16:45', modified: '2026-08-07', comment: "Souscription à l'augmentation de capital", legs: 1, account: 'Degiro — CTO Degiro', security: 'USLC — US Large Cap Core', qty: 300, price: 38.5, fees: 4, taxes: 0.6, amount: 11550, sense: 'debit', settle: '2026-09-09' },
  { ref: 'TXN000031', nature: 'CASHFLOW', date: '2026-08-04', owner: 'Fabrice HOËPPE', time: '23:59', modified: '2026-08-04', comment: 'Intérêts créditeurs du mois', legs: 1, account: 'Degiro — CTO Degiro', security: 'Espèces EUR', amount: 12.4, sense: 'credit', settle: '2026-08-04' },
];

export interface TxLeg {
  readonly type: string;
  readonly account: string;
  readonly security: string;
  readonly qty?: number;
  readonly price?: number;
  readonly fees?: number;
  readonly taxes?: number;
  readonly amount: number;
  readonly sense: 'debit' | 'credit' | 'none';
  readonly settle: string;
}

/** Devise de reference des restitutions : tout est ramene a l'euro. */
export const REPORTING_CURRENCY = 'EUR';

/* Devise de cotation, par ticker. Seuls les titres qui ne cotent pas en euro figurent ici :
   l'euro est la valeur par defaut, et le referentiel des places donnerait la devise du marche,
   pas celle du titre — un fonds irlandais peut coter en dollar tout en etant admis a Euronext
   Dublin, ce qui est le cas de USLC. */
export const SECURITY_CURRENCY: Record<string, string> = {
  AAPL: 'USD',
  MSFT: 'USD',
  USLC: 'USD',
  EMEQ: 'USD',
  TSY10: 'USD',
  IGCRD: 'GBP',
};

/** Devise de tenue du compte. Les trois comptes suivis sont en euro. */
export const ACCOUNT_CURRENCY: Record<string, string> = {
  'Degiro — CTO Degiro': 'EUR',
  'Bourse Direct — PEA': 'EUR',
  'Trade Republic — CTO Trade Republic': 'EUR',
};

/* Cours de change applique : 1 unite de la devise vaut n euros. Memes valeurs que le tableau
   de conversion des Positions, pour qu'un meme titre ne se convertisse pas de deux facons
   selon l'ecran qui l'affiche. */
export const FX_TO_EUR: Record<string, number> = { EUR: 1, USD: 0.92, GBP: 1.17, CHF: 1.06 };

/** Devise d'une jambe, deduite du ticker qui prefixe son libelle de titre. */
export function currencyOfSecurity(security: string): string {
  const ticker = String(security ?? '').split('—')[0].trim();
  return SECURITY_CURRENCY[ticker] ?? REPORTING_CURRENCY;
}

export function currencyOfAccount(account: string): string {
  return ACCOUNT_CURRENCY[account] ?? REPORTING_CURRENCY;
}

/**
 * Cours applique a une jambe : combien d'unites de la devise du compte vaut une unite de la
 * devise du titre. Les deux devises confondues, il n'y a pas de conversion et le cours vaut 1.
 */
export function fxRate(securityCurrency: string, accountCurrency: string): number {
  if (securityCurrency === accountCurrency) return 1;
  const from = FX_TO_EUR[securityCurrency];
  const to = FX_TO_EUR[accountCurrency];
  if (!from || !to) return 1;
  return from / to;
}

/* Le cours est affiche sans decimales quand il vaut exactement 1 : aligner « 1,0000 » sur les
   cours reels laisserait croire a une precision la ou il n'y a pas de conversion du tout. */
export function fxLabel(rate: number): string {
  return rate === 1 ? '1' : rate.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/** Infobulle du cours : rappelle le couple de devises dont il provient. */
export function fxHint(securityCurrency: string, accountCurrency: string, rate: number): string {
  if (rate === 1) {
    return securityCurrency === accountCurrency
      ? `Titre et compte en ${securityCurrency} — aucune conversion`
      : 'Aucun cours connu pour ce couple de devises';
  }
  return `1 ${securityCurrency} = ${rate.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${accountCurrency}`;
}

export const LEGS: Record<string, readonly TxLeg[]> = {
  TXN000039: [
    { type: 'TOUT', account: 'Degiro — CTO Degiro', security: 'AAPL — Apple Inc.', qty: 40, price: 88.24, fees: 4.5, taxes: 0, amount: 3529.6, sense: 'none', settle: '2026-08-28' },
    { type: 'TIN', account: 'Trade Republic — CTO Trade Republic', security: 'AAPL — Apple Inc.', qty: 40, price: 88.24, fees: 0, taxes: 0, amount: 3529.6, sense: 'none', settle: '2026-09-10' },
  ],
  TXN000038: [
    { type: 'DIVOPT', account: 'Degiro — CTO Degiro', security: 'AI — Air Liquide', qty: 4, price: 41.6, amount: 166.4, sense: 'none', settle: '2026-08-26' },
    { type: 'DIVOPT', account: 'Degiro — CTO Degiro', security: 'Espèces EUR — soulte', fees: 0, taxes: 3.9, amount: 26, sense: 'credit', settle: '2026-08-26' },
  ],
  TXN000036: [
    { type: 'CASH', account: 'Degiro — CTO Degiro', security: 'Espèces EUR', fees: 1.2, taxes: 0, amount: 1500, sense: 'debit', settle: '2026-08-18' },
    { type: 'CASH', account: 'Bourse Direct — PEA', security: 'Espèces EUR', amount: 1500, sense: 'credit', settle: '2026-08-18' },
  ],
  TXN000035: [
    { type: 'SPLIT', account: 'Degiro — CTO Degiro', security: 'EUEQ — Europe ex-UK Equity', qty: 61000, amount: 0, sense: 'none', settle: '2026-08-14' },
    { type: 'SPLIT', account: 'Trade Republic — CTO Trade Republic', security: 'EUEQ — Europe ex-UK Equity', qty: 12000, amount: 0, sense: 'none', settle: '2026-08-14' },
  ],
};

const CASH_HINTS = ['espèces', 'droits de garde', 'intérêts', 'frais', 'soulte'];
export function kindOf(security: string | undefined): 'cash' | 'security' {
  const t = String(security || '').toLowerCase();
  return CASH_HINTS.some((h) => t.indexOf(h) >= 0) ? 'cash' : 'security';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
export const TODAY = (() => {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
})();

export function eur(v: number, d?: number): string {
  const digits = d === undefined ? 2 : d;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + ' €';
}

export function fmt(iso: string): string {
  const p = String(iso).split('-');
  return p[2] + '/' + p[1];
}

export function parseFr(v: string | undefined): number {
  return Number(String(v || '0').replace(/\s/g, '').replace(',', '.')) || 0;
}
