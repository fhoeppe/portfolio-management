import {
  ACCOUNTS_LIST,
  LIMIT_STRATEGIES,
  MIC_HINT,
  MIC_PLACES,
  MIC_SHORT,
  ORDER_STRATEGY,
  STRAT_HINT,
  STRAT_NAME,
  TIF,
  TIF_HINT,
  TODAY,
  TRADABLE_SECURITIES,
  eur,
  parseFr,
  type NatureKey,
} from './transactions-data';

export interface FormState {
  date: string;
  settle: string;
  account: string;
  security: string;
  qty: string;
  price: string;
  fees: string;
  taxes: string;
  amount: string;
  ratio: string;
  tif: string;
  mic: string;
  fill: string;
  strategy: string;
  execRows?: ExecRowState[];
}

export interface ExecRowState {
  date: string;
  qty: string;
  price: string;
  settle: string;
}

/** Les clés de `FormState` sont toutes des chaînes sauf `execRows` (géré à part par
 * `execRowsView`) : lecture générique sûre pour le rendu dynamique des champs. */
function fieldValue(f: FormState, key: string): string {
  return (f as unknown as Record<string, string>)[key] || '';
}

export function initialForm(): FormState {
  return { date: TODAY, settle: '2026-09-08', account: 'Degiro — CTO Degiro', security: 'AAPL — Apple Inc.', qty: '20', price: '150,00', fees: '12,00', taxes: '1,80', amount: '', ratio: '3', tif: 'DAY', mic: '', fill: 'full', strategy: 'MKT' };
}

interface SelectOpt {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface FieldDef {
  readonly key: string;
  readonly label: string;
  readonly span: string;
  readonly isDate?: boolean;
  readonly select?: readonly SelectOpt[];
  readonly hint?: string;
  readonly ph?: string;
  readonly readOnly?: boolean;
}

/** Les 7 clés du panneau « Exécution » (fill/execDate/execQty/execPrice/settle/ratio/amount) :
 * exclues du panneau « Définition de l'ordre », rendues via `formFields2`/`execRows`. */
const PANEL2_KEYS = ['fill', 'execDate', 'execQty', 'execPrice', 'settle', 'ratio', 'amount'];
const PANEL2_BODY_KEYS = ['execDate', 'execQty', 'execPrice', 'settle', 'ratio', 'amount'];

const IS_SECURITY_TYPE = new Set(['BUY', 'SELL', 'BUYOPT', 'TOUT', 'DIVOPT', 'SPLIT']);

export function computeFields(ft: string, f: FormState): FieldDef[] {
  const isSecurity = IS_SECURITY_TYPE.has(ft);
  if (!isSecurity) {
    return [
      { key: 'date', label: 'Date', span: 'auto', isDate: true },
      { key: 'settle', label: 'Date de valeur', span: 'auto', isDate: true },
      { key: 'account', label: 'Compte', span: 'span 2', ph: 'Broker — nom du compte' },
      { key: 'security', label: 'Poche ou libellé', span: 'span 2', ph: 'Espèces EUR' },
      { key: 'amount', label: 'Montant', span: 'auto', ph: '1 500,00' },
      { key: 'fees', label: 'Frais de courtage', span: 'auto', ph: '0,00' },
      { key: 'taxes', label: 'Taxes et impôts', span: 'auto', ph: '0,00' },
    ];
  }
  if (ft === 'BUY' || ft === 'SELL' || ft === 'BUYOPT') {
    return [
      { key: 'date', label: 'Date', span: '1 / 2', isDate: true },
      { key: 'account', label: 'Compte', span: '2 / 4', hint: 'Compte concerné par le trade — Degiro CTO, Bourse Direct PEA, Trade Republic CTO', select: [{ value: '', label: 'Aucun' }, ...ACCOUNTS_LIST] },
      { key: 'mic', label: 'Place (MIC)', span: '4 / 5', hint: MIC_HINT, select: [{ value: '', label: 'Aucune' }, ...MIC_PLACES] },
      {
        key: 'security', label: 'Titre', span: '5 / 7', hint: 'Titre négociable — le libellé complet reste la valeur enregistrée',
        select: [{ value: '', label: 'Aucun' }, ...TRADABLE_SECURITIES.filter((s) => !f.mic || f.mic === 'XXXX' || s.mic === f.mic).map((s) => ({ value: s.label, label: s.ticker }))],
      },
      { key: 'qty', label: 'Quantité', span: '1 / 2', ph: '20' },
      { key: 'price', label: 'Prix unitaire', span: '2 / 3', ph: '150,00' },
      { key: 'fees', label: 'Frais de courtage', span: '3 / 4', ph: '12,00' },
      { key: 'taxes', label: 'Taxes et impôts', span: '4 / 5', ph: '1,80' },
      { key: 'strategy', label: 'Stratégie', span: '5 / 6', select: ORDER_STRATEGY, hint: STRAT_HINT },
      { key: 'tif', label: 'Validité', span: '6 / 7', select: TIF, hint: TIF_HINT },
      { key: 'gross', label: 'Coût brut', span: '1 / 2', readOnly: true },
      { key: 'net', label: 'Coût net', span: '2 / 3', readOnly: true },
      { key: 'fill', label: 'Exécution', span: 'auto', select: [{ value: 'full', label: 'Totale' }, { value: 'partial', label: 'Partielle' }] },
      { key: 'execDate', label: "Date d'exécution", span: 'auto', isDate: true },
      { key: 'execQty', label: 'Quantité exécutée', span: 'auto', ph: '20' },
      { key: 'execPrice', label: "Prix d'exécution", span: 'auto', ph: '150,00' },
      { key: 'settle', label: 'Date de règlement', span: 'auto', isDate: true },
    ];
  }
  const base: FieldDef[] = [
    { key: 'date', label: ft === 'SPLIT' ? "Date d'annonce" : 'Date de négociation', span: 'auto', isDate: true },
    { key: 'settle', label: ft === 'SPLIT' ? "Date d'effet" : 'Date de règlement', span: 'auto', isDate: true },
    { key: 'account', label: 'Compte', span: 'span 2', ph: 'Broker — nom du compte' },
    { key: 'security', label: 'Titre', span: 'span 2', ph: 'Ticker — nom' },
    { key: 'qty', label: 'Quantité', span: 'auto', ph: '20' },
  ];
  if (ft === 'SPLIT') {
    base.push({ key: 'ratio', label: 'Parité (pour 1)', span: 'auto', ph: '3' });
    return base;
  }
  base.push({ key: 'price', label: ft === 'TOUT' ? 'Coût de base unitaire' : 'Prix unitaire', span: 'auto', ph: '150,00' });
  base.push({ key: 'fees', label: 'Frais de courtage', span: 'auto', ph: '12,00' });
  base.push({ key: 'taxes', label: 'Taxes et impôts', span: 'auto', ph: '1,80' });
  if (ft === 'DIVOPT') {
    base.push({ key: 'amount', label: 'Soulte en espèces', span: 'auto', ph: '26,00' });
  }
  return base;
}

export type FormFieldView =
  | { readonly kind: 'select'; readonly key: string; readonly label: string; readonly span: string; readonly maxWidth: string; readonly hint: string; readonly value: string; readonly options: readonly SelectOpt[]; readonly sub: string }
  | { readonly kind: 'date'; readonly key: string; readonly label: string; readonly span: string; readonly maxWidth: string; readonly max: string; readonly value: string }
  | { readonly kind: 'readonly'; readonly key: string; readonly label: string; readonly span: string; readonly maxWidth: string; readonly value: string }
  | { readonly kind: 'input'; readonly key: string; readonly label: string; readonly span: string; readonly maxWidth: string; readonly placeholder: string; readonly value: string };

export function formFieldsView(fields: readonly FieldDef[], f: FormState, qty: number, price: number, cash: number): FormFieldView[] {
  return fields
    .filter((x) => !PANEL2_KEYS.includes(x.key))
    .map((x): FormFieldView => {
      const maxW = x.key === 'fees' ? '150px' : 'none';
      if (x.key === 'gross') return { kind: 'readonly', key: x.key, label: x.label, span: x.span, maxWidth: maxW, value: eur(qty * price) };
      if (x.key === 'net') return { kind: 'readonly', key: x.key, label: x.label, span: x.span, maxWidth: maxW, value: eur(cash) };
      if (x.select) {
        const sub =
          x.key === 'mic' ? (f.mic === 'XXXX' ? 'Place inconnue' : MIC_SHORT[f.mic] || (f.mic ? f.mic : 'Toutes places'))
          : x.key === 'account' ? ACCOUNTS_LIST.find((a) => a.value === f.account)?.code || 'Aucun compte'
          : x.key === 'strategy' ? STRAT_NAME[f.strategy] || 'Aucune stratégie'
          : '';
        const options = x.key === 'strategy' ? x.select.map((o) => ({ ...o, disabled: o.value !== 'MKT' && o.value !== 'LMT' })) : x.select;
        return { kind: 'select', key: x.key, label: x.label, span: x.span, maxWidth: maxW, hint: x.hint || x.label, value: fieldValue(f, x.key) || x.select[0].value, options, sub };
      }
      if (x.isDate) return { kind: 'date', key: x.key, label: x.label, span: x.span, maxWidth: maxW, max: x.key === 'settle' ? '' : TODAY, value: fieldValue(f, x.key) };
      return { kind: 'input', key: x.key, label: x.label, span: x.span, maxWidth: maxW, placeholder: x.ph || '', value: fieldValue(f, x.key) };
    });
}

export function hasPanel2(fields: readonly FieldDef[]): boolean {
  return fields.some((x) => PANEL2_KEYS.includes(x.key));
}

export function formFields2View(fields: readonly FieldDef[], f: FormState): FormFieldView[] {
  const out: FormFieldView[] = [];
  fields
    .filter((x) => PANEL2_BODY_KEYS.includes(x.key))
    .forEach((x) => {
      if (x.key === 'execDate' || x.key === 'execQty' || x.key === 'execPrice' || x.key === 'settle') return;
      if (x.select) {
        out.push({ kind: 'select', key: x.key, label: x.label, span: x.span, maxWidth: 'none', hint: '', value: fieldValue(f, x.key) || x.select[0].value, options: x.select, sub: '' });
        return;
      }
      if (x.isDate) {
        out.push({ kind: 'date', key: x.key, label: x.label, span: x.span, maxWidth: 'none', max: '', value: fieldValue(f, x.key) });
        return;
      }
      out.push({ kind: 'input', key: x.key, label: x.label, span: x.span, maxWidth: 'none', placeholder: x.ph || '', value: fieldValue(f, x.key) });
    });
  return out;
}

export function execToggleOptions(fields: readonly FieldDef[]): readonly SelectOpt[] | null {
  const fillField = fields.find((x) => x.key === 'fill');
  return fillField?.select ?? null;
}

// ---------------------------------------------------------------------------
// Jambes engendrées par la transaction en cours de saisie
// ---------------------------------------------------------------------------

export interface FormLeg {
  readonly seq: string;
  readonly type: string;
  readonly detail: string;
  readonly amount: string;
  readonly color: string;
}

/** BUY/SELL/BUYOPT : « une opération, ou une par exécution partielle » (voir `LEG_RULES`) —
 * le prototype affiche ce texte mais son calcul de jambes l'ignore et n'en produit jamais
 * qu'une. Corrigé ici pour suivre réellement les lignes d'exécution saisies : une jambe par
 * ligne dès que l'exécution partielle porte plusieurs lignes, frais et taxes de l'ordre
 * répartis au prorata de la quantité de chacune (le formulaire ne les saisit qu'une fois, pour
 * l'ordre entier).
 */
const PER_EXECUTION_TYPES = new Set(['BUY', 'SELL', 'BUYOPT']);

export function computeLegs(nature: NatureKey, ft: string, f: FormState, legRuleLegs: number): FormLeg[] {
  const qty = parseFr(f.qty);
  const price = parseFr(f.price);
  const fees = parseFr(f.fees);
  const taxes = parseFr(f.taxes);
  const amount = parseFr(f.amount);
  const charges = fees + taxes;
  const cash = ft === 'SELL' ? qty * price - charges : qty * price + charges;
  const isSecurity = IS_SECURITY_TYPE.has(ft);
  const ratio = parseFr(f.ratio) || 0;
  const legs: FormLeg[] = [];

  if (legRuleLegs === 0) {
    // Le fait vit dans les champs de la transaction : aucune jambe (ex. DIV).
  } else if (ft === 'SPLIT') {
    legs.push({
      seq: '1', type: 'SPLIT',
      detail: `${f.security} · ${f.account} · ${qty} → ${ratio ? qty * ratio : qty} titres, parité ${ratio || '—'} pour 1`,
      amount: '—', color: 'var(--color-neutral-600)',
    });
  } else if (ft === 'TOUT') {
    legs.push({ seq: '1', type: 'TOUT', detail: `${f.security} · ${f.account} · ${qty} × ${price.toFixed(2).replace('.', ',')} (coût de base)`, amount: eur(qty * price), color: 'var(--color-neutral-600)' });
    legs.push({ seq: '2', type: 'TIN', detail: 'Compte destinataire · même quantité, même coût de base', amount: eur(qty * price), color: 'var(--color-neutral-600)' });
    if (fees) legs.push({ seq: String(legs.length + 1), type: 'FEE', detail: 'Frais de courtage portés par le compte source', amount: eur(fees), color: 'var(--color-text)' });
    if (taxes) legs.push({ seq: String(legs.length + 1), type: 'TAX', detail: 'Taxes et impôts sur le transfert', amount: eur(taxes), color: 'var(--color-text)' });
  } else if (PER_EXECUTION_TYPES.has(ft) && f.fill === 'partial' && f.execRows && f.execRows.length > 1) {
    const rows = f.execRows;
    const totalQty = rows.reduce((n, r) => n + parseFr(r.qty), 0) || qty;
    rows.forEach((r, i) => {
      const qtyI = parseFr(r.qty);
      const priceI = parseFr(r.price) || price;
      const share = totalQty ? qtyI / totalQty : 0;
      const feesI = fees * share;
      const taxesI = taxes * share;
      const grossI = qtyI * priceI;
      const cashI = ft === 'SELL' ? grossI - feesI - taxesI : grossI + feesI + taxesI;
      legs.push({
        seq: String(i + 1), type: ft,
        detail: `${f.security} · ${f.account} · ${qtyI} × ${priceI.toFixed(2).replace('.', ',')} · exécution du ${r.date ? r.date.split('-').reverse().join('/') : '—'}`,
        amount: eur(cashI), color: ft === 'SELL' ? 'var(--ink-ok)' : 'var(--color-text)',
      });
    });
  } else if (isSecurity) {
    legs.push({
      seq: '1', type: ft,
      detail: `${f.security} · ${f.account} · ${qty} × ${price.toFixed(2).replace('.', ',')}${charges ? ' · frais ' + fees.toFixed(2).replace('.', ',') + ' + taxes ' + taxes.toFixed(2).replace('.', ',') : ''}`,
      amount: eur(cash), color: ft === 'SELL' ? 'var(--ink-ok)' : 'var(--color-text)',
    });
    if (ft === 'DIVOPT' && amount) legs.push({ seq: '2', type: 'DIVOPT', detail: 'Soulte en espèces pour la fraction non convertible', amount: eur(amount), color: 'var(--ink-ok)' });
  } else {
    legs.push({ seq: '1', type: ft, detail: `${f.security} · ${f.account}`, amount: eur(amount), color: ft === 'FEE' ? 'var(--color-text)' : 'var(--ink-ok)' });
    if (ft === 'CASH') legs.push({ seq: '2', type: 'CASH', detail: 'Compte destinataire · crédit de même montant', amount: eur(amount), color: 'var(--ink-ok)' });
    if (fees) legs.push({ seq: String(legs.length + 1), type: 'FEE', detail: 'Frais de courtage sur le mouvement', amount: eur(fees), color: 'var(--color-text)' });
    if (taxes) legs.push({ seq: String(legs.length + 1), type: 'TAX', detail: 'Taxes et impôts sur le mouvement', amount: eur(taxes), color: 'var(--color-text)' });
  }
  return legs;
}

// ---------------------------------------------------------------------------
// Lignes d'exécution (BUY/SELL/BUYOPT — exécution totale ou partielle)
// ---------------------------------------------------------------------------

export interface ExecRowView {
  readonly idx: number;
  readonly date: string;
  readonly qty: string;
  readonly price: string;
  readonly priceReadOnly: boolean;
  readonly settle: string;
  readonly dateMax: string;
  readonly canRemove: boolean;
  readonly isLast: boolean;
  readonly addDisabled: boolean;
  readonly addTitle: string;
}

export function execRowsView(f: FormState): ExecRowView[] {
  const isLmt = f.strategy === 'LMT';
  const orderQty = parseFr(f.qty);
  const stored: ExecRowState[] = f.execRows && f.execRows.length ? f.execRows : [{ date: TODAY, qty: '', price: isLmt ? f.price : '', settle: f.settle || '' }];
  const total = stored.reduce((n, r) => n + parseFr(r.qty), 0);
  const canAdd = !orderQty || total < orderQty;
  return stored.map((r, i) => ({
    idx: i,
    date: r.date || TODAY,
    qty: r.qty || '',
    price: isLmt ? f.price : r.price || '',
    priceReadOnly: isLmt,
    settle: r.settle || f.settle || '',
    dateMax: TODAY,
    canRemove: stored.length > 1,
    isLast: i === stored.length - 1,
    addDisabled: !canAdd,
    addTitle: canAdd ? "Ajouter l'exécution suivante" : 'Quantité déjà totalement exécutée',
  }));
}
