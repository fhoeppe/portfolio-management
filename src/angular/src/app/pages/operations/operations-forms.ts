import { ACCOUNTS, LINKED_BANKS, MIC_CURRENCY, TODAY, TRADABLE_SECURITIES, parseFr } from './operations-data';
import { ICON_CALENDAR, ICON_CASHFLOW, ICON_CORPORATE, ICON_TRADE, ICON_TRANSFER } from './operations-icons';
import type { Icon } from '../../shell/icon-shapes';

export type PanelKind = 'trade' | 'transfer' | 'calendar' | 'corporate' | 'cashflow';

/** État du formulaire courant, porté depuis `state.quick` du prototype — allégé des champs
 * jamais lus (`evNote`/`caNote`/`cfNote`, confirmés morts par grep sur `Ordres.dc.html`). */
export interface QuickState {
  account: string;
  security: string;
  price: string;
  extAccount: string;
  extFrom: string;
  qty: string;
  from: string;
  to: string;
  caType: string;
  caExDate: string;
  caPayDate: string;
  caAmount: string;
  caTax: string;
  cfTax: string;
  evType: string;
  evTitle: string;
  evDate: string;
  evTime: string;
  evRemind: string;
  evLink: string;
  amount: string;
  currency: string;
  cfType: string;
  date: string;
  linkedBank: string;
  fee: string;
  tax: string;
}

export function initialQuick(): QuickState {
  return {
    account: ACCOUNTS[0],
    security: TRADABLE_SECURITIES[0].label,
    price: '150,00',
    extAccount: '',
    extFrom: '',
    qty: '20',
    from: '',
    to: '',
    caType: 'DIV',
    caExDate: TODAY,
    caPayDate: TODAY,
    caAmount: '',
    caTax: '',
    cfTax: '',
    evType: 'ECHEANCE',
    evTitle: '',
    evDate: TODAY,
    evTime: '09:00',
    evRemind: '1',
    evLink: '',
    amount: '1 000,00',
    currency: 'EUR',
    cfType: 'DEPOSIT',
    date: TODAY,
    linkedBank: LINKED_BANKS[ACCOUNTS[0]][0],
    fee: '',
    tax: '',
  };
}

export const CCY_SYMBOL: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };

export function securityCurrency(security: string): { symbol: string; code: string } {
  const sec = TRADABLE_SECURITIES.find((s) => s.label === security);
  const code = sec ? MIC_CURRENCY[sec.mic] || 'EUR' : 'EUR';
  return { symbol: CCY_SYMBOL[code] || code, code };
}

export interface SidePanelInfo {
  readonly title: string;
  readonly subtitle: string;
  readonly bg: string;
  readonly tint: string;
  readonly border: string;
  readonly icon: Icon;
}

export function sidePanelInfo(kind: PanelKind, quick: QuickState): SidePanelInfo {
  switch (kind) {
    case 'trade':
      return { title: 'Créer un ordre', subtitle: 'Ordre au marché ou à cours limité', bg: 'var(--field-ok)', tint: 'rgba(11,95,87,0.08)', border: 'rgba(11,95,87,0.30)', icon: ICON_TRADE };
    case 'transfer':
      return {
        title: 'Initier un transfert',
        subtitle: quick.from === '__ext__' || quick.to === '__ext__' ? 'Un compte hors périmètre — une seule jambe suivie' : 'Entre deux comptes suivis',
        bg: 'var(--field-info)',
        tint: 'rgba(7,89,133,0.08)',
        border: 'rgba(7,89,133,0.30)',
        icon: ICON_TRANSFER,
      };
    case 'cashflow':
      return { title: 'Initier un cashflow', subtitle: 'Mouvement de trésorerie', bg: 'var(--field-magenta)', tint: 'rgba(162,28,175,0.08)', border: 'rgba(15,118,110,0.30)', icon: ICON_CASHFLOW };
    case 'calendar':
      return { title: 'Initier un événement calendrier', subtitle: 'Échéance, rappel, assemblée générale…', bg: 'var(--field-code, #3730a3)', tint: 'rgba(67,56,202,0.08)', border: 'rgba(67,56,202,0.30)', icon: ICON_CALENDAR };
    case 'corporate':
      return { title: 'Notifier une Corporate Action', subtitle: 'Détachement, split, fusion…', bg: 'var(--field-warn)', tint: 'rgba(143,63,6,0.08)', border: 'rgba(143,63,6,0.30)', icon: ICON_CORPORATE };
  }
}

// ---------------------------------------------------------------------------
// Ordre (trade)
// ---------------------------------------------------------------------------

export interface TradeTotals {
  readonly gross: number;
  readonly net: number;
  readonly charges: number;
}

export function tradeTotals(qtyStr: string, priceStr: string, feesStr: string, taxesStr: string, side: string): TradeTotals {
  const qty = parseFr(qtyStr);
  const price = parseFr(priceStr);
  const charges = parseFr(feesStr) + parseFr(taxesStr);
  const gross = qty * price;
  const net = side === 'VENTE' ? gross - charges : gross + charges;
  return { gross, net, charges };
}

const eur = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function tradeEntryText(side: string, totals: TradeTotals): string {
  return side === 'VENTE'
    ? '465  Créances sur cessions de VMP      ' + eur(totals.net) +
        '\n         503  Actions (VMP)                      valeur comptable' +
        '\n         767  Produits nets sur cessions         résultat net' +
        '\n\nAu règlement : 465 → 512 pour ' + eur(totals.net)
    : '503  Actions (VMP)                     ' + eur(totals.gross) +
        '\n627  Services bancaires (frais)         ' + eur(totals.charges) +
        '\n         464  Dettes sur acquisitions de VMP     ' + eur(totals.net) +
        '\n\nAu règlement : 464 → 512 pour ' + eur(totals.net);
}

export interface ExecRow {
  date: string;
  qty: string;
  price: string;
  settle: string;
}

export interface TradeLeg {
  readonly seq: string;
  readonly type: string;
  readonly detail: string;
  readonly amount: string;
}

export function tradeLegsFromExec(rows: readonly ExecRow[], side: string, security: string, account: string): TradeLeg[] {
  return rows.map((r, i) => ({
    seq: String(i + 1),
    type: side === 'VENTE' ? 'SELL' : 'BUY',
    detail: (security || 'Titre non renseigné') + ' · ' + (account || '') + ' · ' + (r.qty || '0') + ' × ' + (r.price || '0'),
    amount: (parseFr(r.qty) * parseFr(r.price)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €',
  }));
}

// ---------------------------------------------------------------------------
// Transfert
// ---------------------------------------------------------------------------

export interface DirLine {
  readonly code: string;
  readonly text: string;
}

export function trfDirLines(from: string, to: string): DirLine[] {
  if (!from || !to) {
    return [
      { code: 'TOUT', text: 'jambe sortante, qui retire les titres du compte source.' },
      { code: 'TIN', text: 'jambe entrante, qui les reçoit sur le compte destinataire.' },
      { code: 'TOUT TIN', text: "le couple des deux jambes ne se forme qu'entre comptes internes ouverts chez un même broker — renseignez les deux comptes pour déterminer le type." },
    ];
  }
  if (from === '__ext__') {
    return [
      { code: 'TOUT', text: "jambe sortante, qui retire les titres du compte source — ici hors périmètre, elle n'est pas suivie." },
      { code: 'TIN', text: "jambe entrante, qui les reçoit sur le compte destinataire — seule jambe suivie, au coût de base et non à un cours, donc sans résultat." },
      { code: 'TOUT TIN', text: "le couple des deux jambes ne se forme qu'entre comptes internes ouverts chez un même broker ; la source étant externe, il ne s'applique pas ici." },
    ];
  }
  if (to === '__ext__') {
    return [
      { code: 'TOUT', text: 'jambe sortante, qui retire les titres du compte source — seule jambe suivie, au coût de base et non à un cours, donc sans résultat.' },
      { code: 'TIN', text: "jambe entrante, qui les reçoit sur le compte destinataire — ici hors périmètre, elle n'est pas suivie." },
      { code: 'TOUT TIN', text: "le couple des deux jambes ne se forme qu'entre comptes internes ouverts chez un même broker ; le destinataire étant externe, il ne s'applique pas ici." },
    ];
  }
  return [
    { code: 'TOUT', text: 'jambe sortante, qui retire les titres du compte source — suivie, uniquement entre comptes internes ouverts chez un même broker.' },
    { code: 'TIN', text: "jambe entrante, qui les reçoit sur le compte destinataire — suivie, avec la même quantité et le même coût de base qu'à la sortie. Aucune décomptabilisation au sens d'IFRS 9 §3.2.3, donc aucun résultat." },
    { code: 'TOUT TIN', text: 'le couple des deux jambes, formé ici : transfert interne entre comptes ouverts chez un même broker, sans résultat constaté.' },
  ];
}

export interface KindBadge {
  readonly code: string;
  readonly bg: string;
  readonly fg: string;
}

const GREY_BADGE: KindBadge = { code: '—', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' };

export function trfKindBadges(from: string, to: string): KindBadge[] {
  if (!from || !to) return [GREY_BADGE];
  if (from === '__ext__') return [{ code: 'TIN', bg: 'rgba(2,132,199,0.16)', fg: 'var(--ink-info)' }];
  if (to === '__ext__') return [{ code: 'TOUT', bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' }];
  return [
    { code: 'TOUT', bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' },
    { code: 'TIN', bg: 'rgba(2,132,199,0.16)', fg: 'var(--ink-info)' },
  ];
}

export function trfKindHint(from: string, to: string): string {
  if (!from || !to) return 'Renseignez le compte source et le compte destinataire';
  if (from === '__ext__') return 'Source hors périmètre : seule la jambe entrante TIN est suivie';
  if (to === '__ext__') return 'Destinataire hors périmètre : seule la jambe sortante TOUT est suivie';
  return 'Transfert interne : jambe sortante TOUT et jambe entrante TIN';
}

export function trfLegsCount(from: string, to: string): string {
  return from === '__ext__' || to === '__ext__' ? '1 jambe' : '2 jambes';
}

export function trfValue(qtyStr: string, priceStr: string): number {
  return parseFr(qtyStr) * parseFr(priceStr);
}

export function trfLegs(quick: QuickState, extFrom: string, extAccount: string): TradeLeg[] {
  const sec = quick.security || 'Titre';
  const ccy = securityCurrency(quick.security).symbol;
  const valueStr = trfValue(quick.qty, quick.price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const out: TradeLeg[] = [];
  out.push(
    quick.from === '__ext__'
      ? { seq: '1', type: '—', detail: 'Compte externe ' + (extFrom || 'non renseigné') + ' — hors périmètre, non suivi', amount: '—' }
      : { seq: '1', type: 'TOUT', detail: sec + ' · ' + (quick.from || '—') + ' · ' + (quick.qty || '0') + ' titres', amount: ccy + ' ' + valueStr },
  );
  out.push(
    quick.to === '__ext__'
      ? { seq: '2', type: '—', detail: 'Compte externe ' + (extAccount || 'non renseigné') + ' — hors périmètre, non suivi', amount: '—' }
      : { seq: '2', type: 'TIN', detail: sec + ' · ' + (quick.to || '—') + ' · même quantité, même coût de base', amount: ccy + ' ' + valueStr },
  );
  return out;
}

export function trfEntryText(quick: QuickState): string {
  const qty = parseFr(quick.qty);
  const px = parseFr(quick.price);
  const val = (qty * px).toFixed(2).replace('.', ',');
  if (quick.to === '__ext__') {
    return (
      'Sortie de titres - compte source              ' + val +
      '\n         Compte de transfert en attente              ' + val +
      '\n\n' + qty + ' x ' + px.toFixed(2).replace('.', ',') + '  (cout de base)' +
      '\nresultat = 0,00 - transfert sortant, pas une cession'
    );
  }
  return (
    'Titres en portefeuille - compte destinataire   ' + val +
    '\n         Titres en portefeuille - compte source        ' + val +
    '\n\n' + qty + ' x ' + px.toFixed(2).replace('.', ',') + '  (cout de base, non un cours)' +
    '\nresultat = 0,00 - aucune decomptabilisation IFRS 9 3.2.3'
  );
}

// ---------------------------------------------------------------------------
// Événement calendrier
// ---------------------------------------------------------------------------

const EV_DEF_TITLE: Record<string, string> = {
  ECHEANCE: 'ÉCHÉANCE — date à ne pas dépasser',
  RAPPEL: 'RAPPEL — note datée',
  AG: 'AG — assemblée générale',
  REVUE: "REVUE — point d'étape planifié",
  PUBLICATION: 'PUBLICATION — indicateur ou résultat attendu',
  MARCHE: 'MARCHÉ — événement de marché, survenu ou en cours',
};
export function evDefTitle(t: string): string {
  return EV_DEF_TITLE[t] || '';
}

const EV_DEF_TEXT: Record<string, string> = {
  ECHEANCE: 'Apparaît dans Échéances et sur le calendrier ; le badge du menu compte les échéances du jour et à venir.',
  RAPPEL: 'Simple note portée au calendrier, sans incidence sur les positions ni les soldes.',
  AG: "Convocation d'assemblée : date de tenue, avec le rappel du délai de vote s'il est renseigné.",
  REVUE: "Revue de portefeuille ou de mandat, à rapprocher du comité d'investissement.",
  PUBLICATION: 'Publication de résultats ou indicateur macroéconomique attendu à cette date.',
  MARCHE: "Fait de marché à consigner : décision de banque centrale, choc de liquidité, suspension de cotation. Une date passée le classe en historique, une date du jour ou à venir en événement courant.",
};
export function evDefText(t: string): string {
  return EV_DEF_TEXT[t] || '';
}

const EV_TITLE_PLACEHOLDER: Record<string, string> = {
  ECHEANCE: 'Renouvellement KYC trésorier',
  RAPPEL: 'Relancer le broker sur le relevé',
  AG: 'Assemblée générale Air Liquide',
  REVUE: 'Revue trimestrielle BGM-004',
  PUBLICATION: 'Résultats semestriels LVMH',
  MARCHE: 'Hausse de taux BCE de 25 pb',
};
export function evTitlePlaceholder(t: string): string {
  return EV_TITLE_PLACEHOLDER[t] || '';
}

export function evWhenCode(d: string): string {
  if (!d) return '—';
  return d < TODAY ? 'HISTORIQUE' : d === TODAY ? 'EN COURS' : 'À VENIR';
}
export function evWhenBg(d: string): string {
  if (!d) return 'var(--color-neutral-200)';
  return d < TODAY ? 'var(--color-neutral-200)' : d === TODAY ? 'rgba(180,83,9,0.16)' : 'rgba(67,56,202,0.16)';
}
export function evWhenFg(d: string): string {
  if (!d) return 'var(--color-neutral-700)';
  return d < TODAY ? 'var(--color-neutral-700)' : d === TODAY ? 'var(--ink-warn)' : 'var(--ink-code)';
}
export function evWhenHint(d: string): string {
  if (!d) return 'Renseignez la date';
  return d < TODAY ? 'Date passée : événement consigné pour mémoire' : d === TODAY ? 'Date du jour : événement en cours' : 'Date future : événement attendu';
}

export const EV_REMIND_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: '0', label: 'Le jour même' },
  { value: '1', label: '1 jour avant' },
  { value: '3', label: '3 jours avant' },
  { value: '7', label: '1 semaine avant' },
  { value: '30', label: '1 mois avant' },
  { value: '', label: 'Aucun rappel' },
];

export function evLinkOptions(): readonly { readonly value: string; readonly label: string }[] {
  return [{ value: '', label: 'Aucun rattachement' }]
    .concat(ACCOUNTS.map((a) => ({ value: a, label: a })))
    .concat(TRADABLE_SECURITIES.map((x) => ({ value: x.label, label: x.mic + '.' + x.ticker + ' — ' + x.label.split(' — ')[1] })));
}

// ---------------------------------------------------------------------------
// Corporate action
// ---------------------------------------------------------------------------

export const CA_TYPE_OPTIONS: readonly { readonly key: string; readonly label: string }[] = [
  { key: 'DIV', label: 'DIV' },
  { key: 'DIVOPT', label: 'DIVOPT' },
  { key: 'SPLIT', label: 'SPLIT' },
  { key: 'SPINOFF', label: 'SPINOFF' },
  { key: 'MERGER', label: 'MERGER' },
];

const CA_DEF_TITLE: Record<string, string> = {
  DIV: 'DIV — dividende en numéraire',
  DIVOPT: 'DIVOPT — dividende optionnel',
  SPLIT: 'SPLIT — division du nominal',
  SPINOFF: 'SPINOFF — scission',
  MERGER: 'MERGER — fusion',
};
export function caDefTitle(t: string): string {
  return CA_DEF_TITLE[t] || '';
}

const CA_DEF_TEXT: Record<string, string> = {
  DIV: 'Produit acquis au détachement, encaissé à la mise en paiement. La retenue à la source est un impôt sur le résultat, non une réduction du produit.',
  DIVOPT: "Le porteur choisit entre titres et numéraire ; la fraction non convertible est réglée en soulte, qui ne se déduit d'aucun autre champ.",
  SPLIT: 'La parité modifie la quantité sans toucher au coût total : le prix de revient unitaire est divisé d\'autant. Aucune écriture de valeur.',
  SPINOFF: "Une jambe pour la ligne mère ; une seconde si la ligne créée entre sur un autre compte ou reste hors univers.",
  MERGER: 'Une jambe suffit quand la ligne reçue reste sur le même compte ; deux si une soulte en espèces est réglée.',
};
export function caDefText(t: string): string {
  return CA_DEF_TEXT[t] || '';
}

export function caAmountLabel(t: string): string {
  return t === 'SPLIT' ? 'Parité (pour 1)' : t === 'MERGER' || t === 'SPINOFF' ? "Parité d'échange" : 'Montant brut par titre';
}
export function caAmountPrefix(t: string): string {
  return t === 'DIV' || t === 'DIVOPT' ? '€' : '×';
}
export function caAmountPlaceholder(t: string): string {
  return t === 'SPLIT' ? '3' : t === 'DIV' || t === 'DIVOPT' ? '2,20' : '1,5';
}

const CA_IMPACT_CODE: Record<string, string> = { DIV: 'ESPÈCES', DIVOPT: 'TITRES + SOULTE', SPLIT: 'QUANTITÉ', SPINOFF: 'NOUVELLE LIGNE', MERGER: 'ÉCHANGE' };
export function caImpactCode(t: string): string {
  return CA_IMPACT_CODE[t] || '';
}

const CA_IMPACT_HINT: Record<string, string> = {
  DIV: "Crédit d'espèces net de retenue à la source",
  DIVOPT: 'Attribution de titres et soulte pour le rompu',
  SPLIT: 'Quantité multipliée, coût total inchangé',
  SPINOFF: 'Création d\'une ligne, coût de base réparti',
  MERGER: 'Titres reçus en échange, éventuelle soulte',
};
export function caImpactHint(t: string): string {
  return CA_IMPACT_HINT[t] || '';
}

export function caAmountStep(t: string): number {
  return t === 'DIV' || t === 'DIVOPT' ? 0.1 : 0.5;
}

export function caTaxPrefix(t: string): string {
  return t === 'DIV' || t === 'DIVOPT' ? '%' : '€';
}
export function caTaxPlaceholder(t: string): string {
  return t === 'DIV' || t === 'DIVOPT' ? '30,00' : '0,00';
}

// ---------------------------------------------------------------------------
// Cashflow
// ---------------------------------------------------------------------------

export function cfHasFee(t: string): boolean {
  return t === 'DEPOSIT' || t === 'WITHDRAW';
}
/** Versements et retraits d'espèces ne sont pas taxés. */
export function cfHasTax(t: string): boolean {
  return ['DEPOSIT', 'WITHDRAW', 'REFUND'].indexOf(t) < 0;
}
/** Sans frais ni taxes, brut et net se confondent : un seul montant. */
export function cfHasNet(t: string): boolean {
  return t !== 'REFUND';
}
export function cfGrossLabel(t: string): string {
  return t === 'REFUND' ? 'Montant' : 'Montant brut';
}
export function cfNetAmount(gross: string, fee: string, tax: string): string {
  const net = Math.max(0, parseFr(gross) - parseFr(fee) - parseFr(tax));
  return net.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function cfExternalAllowed(t: string): boolean {
  return ['DEPOSIT', 'WITHDRAW'].indexOf(t) >= 0;
}

const CF_INTERNAL_WHY: Record<string, string> = {
  FEE: 'Les frais sont prélevés sur la poche espèces du compte titre, sans passage par un compte bancaire externe.',
  INTEREST: 'Les intérêts sont crédités sur la poche espèces du compte titre, sans passage par un compte bancaire externe.',
  LENDING: 'La commission de prêt de titres est créditée sur la poche espèces du compte titre, sans passage par un compte bancaire externe.',
  REFUND: 'Le remboursement est crédité sur la poche espèces du compte titre, sans passage par un compte bancaire externe.',
};
export function cfInternalWhy(t: string): string {
  return CF_INTERNAL_WHY[t] || 'Cette nature se règle sur la poche espèces du compte titre.';
}
