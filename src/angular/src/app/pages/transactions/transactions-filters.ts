import {
  LEGS,
  LEG_OPNO,
  LEG_RULES,
  LIGHT_NATURE_TINT,
  NATURES,
  RECO,
  RECO_DETAIL,
  RECO_STATE,
  TODAY,
  TX,
  TX_OP,
  TX_OPNO,
  TYPE_TO_NATURE,
  eur,
  fmt,
  kindOf,
  type NatureKey,
  type RecoStateKey,
  type Transaction,
  currencyOfAccount,
  currencyOfSecurity,
  fxHint,
  fxLabel,
  fxRate,
} from './transactions-data';

/** Une transaction multi-jambes touche plusieurs comptes/titres : le filtre doit voir chacun. */
export function accOf(t: Transaction): string[] {
  const ls = LEGS[t.ref];
  const out = ls && ls.length ? ls.map((l) => l.account).filter(Boolean) : [];
  if (out.indexOf(t.account) < 0) out.push(t.account);
  return Array.from(new Set(out));
}

export function secOf(t: Transaction): string[] {
  const ls = LEGS[t.ref];
  const out = ls && ls.length ? ls.map((l) => l.security).filter(Boolean) : [];
  if (out.indexOf(t.security) < 0) out.push(t.security);
  return Array.from(new Set(out));
}

/** Listes statiques : TX/LEGS ne changent jamais à l'exécution (voir `submitForm`, qui ne
 * modifie pas le registre — confirmé par grep sur `Transactions.dc.html`). */
export const ACCOUNTS: readonly string[] = Array.from(new Set(([] as string[]).concat(...TX.map(accOf)))).sort((a, b) => a.localeCompare(b, 'fr'));
export const SECURITIES: readonly string[] = Array.from(new Set(([] as string[]).concat(...TX.map(secOf)))).sort((a, b) => a.localeCompare(b, 'fr'));

export function isPending(t: Transaction): boolean {
  return t.date <= TODAY && String(t.settle) > TODAY;
}

function hit(v: string | undefined, k: string | undefined): boolean {
  return !k || String(v || '').toLowerCase().indexOf(String(k).toLowerCase()) >= 0;
}

export interface FilterState {
  readonly query: string;
  readonly natKeys: readonly NatureKey[];
  readonly kindFilter: 'all' | 'security' | 'cash';
  readonly refFilter: string;
  readonly opNoFilter: string;
  readonly recoKeys: readonly RecoStateKey[];
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly typeKeys: readonly string[];
  readonly accKeys: readonly string[];
  readonly secKeys: readonly string[];
  readonly stateFilter: 'all' | 'pending' | 'settled';
}

export function filterTransactions(f: FilterState): Transaction[] {
  const q = f.query.trim().toLowerCase();
  return TX.filter((t) => {
    if (f.natKeys.length && f.natKeys.indexOf(t.nature) < 0) return false;
    if (f.kindFilter !== 'all' && kindOf(t.security) !== f.kindFilter) return false;
    if (!hit(t.ref, f.refFilter)) return false;
    if (f.opNoFilter) {
      const pool = [TX_OPNO[t.ref]].concat(LEG_OPNO[t.ref] || []);
      if (!pool.some((x) => hit(x, f.opNoFilter))) return false;
    }
    if (f.recoKeys.length && f.recoKeys.indexOf(RECO[t.ref] || 'pending') < 0) return false;
    if (f.dateFrom && t.date < f.dateFrom) return false;
    if (f.dateTo && t.date > f.dateTo) return false;
    if (f.typeKeys.length && f.typeKeys.indexOf(TX_OP[t.ref]) < 0) return false;
    if (f.accKeys.length && !accOf(t).some((a) => f.accKeys.indexOf(a) >= 0)) return false;
    if (f.secKeys.length && !secOf(t).some((x) => f.secKeys.indexOf(x) >= 0)) return false;
    if (f.stateFilter !== 'all' && (f.stateFilter === 'pending' ? !isPending(t) : isPending(t))) return false;
    if (!q) return true;
    return (t.ref + ' ' + t.nature + ' ' + t.account + ' ' + t.security).toLowerCase().indexOf(q) >= 0;
  });
}

/** Reprend `toneByColor` : le cadre des cartes KPI suit l'encre de famille (vert/rouge),
 * neutre quand la vignette n'a pas de teinte. */
export function toneByColor(k: { readonly label: string; readonly value: string; readonly note: string; readonly color: string }): {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly color: string;
  readonly bg: string;
  readonly labelColor: string;
} {
  const c = k.color;
  const green = c.indexOf('0f766e') >= 0 || c.indexOf('0b5f57') >= 0;
  const red = c.indexOf('b45309') >= 0;
  if (!green && !red) return { ...k, bg: 'var(--surface)', labelColor: 'var(--color-neutral-700)' };
  return {
    ...k,
    bg: green ? 'var(--band-ok)' : 'var(--band-warn)',
    labelColor: green ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
    color: green ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
  };
}

export interface KpiCard {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly color: string;
  readonly bg: string;
  readonly labelColor: string;
}

export function computeKpis(pending: readonly Transaction[], toPay: number, toGet: number): KpiCard[] {
  return [
    { label: 'Transactions', value: String(TX.length), note: TX.reduce((n, t) => n + t.legs, 0) + ' jambes au total', color: 'var(--color-text)' },
    { label: 'En suspens', value: String(pending.length), note: 'Négociées, non réglées', color: pending.length ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
    { label: 'À régler', value: eur(toPay, 0), note: 'Compte 464', color: toPay ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
    { label: 'À recevoir', value: eur(toGet, 0), note: 'Compte 465', color: toGet ? 'var(--ink-ok-2)' : 'var(--color-text)' },
  ].map(toneByColor);
}

export interface SuspenseRow {
  readonly code: string;
  readonly label: string;
  readonly amount: string;
  readonly count: string;
  readonly color: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly bg: string;
}

export function computeSuspense(pending: readonly Transaction[], toPay: number, toGet: number): SuspenseRow[] {
  return [
    { code: '464', label: 'Dettes sur acquisitions de valeurs mobilières de placement', amount: eur(toPay), count: String(pending.filter((t) => t.sense === 'debit').length), color: toPay ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)', tagBg: 'rgba(180,83,9,0.16)', tagFg: 'var(--ink-warn)', bg: 'var(--surface)' },
    { code: '465', label: 'Créances sur cessions de valeurs mobilières de placement', amount: eur(toGet), count: String(pending.filter((t) => t.sense === 'credit').length), color: toGet ? 'var(--ink-ok-2)' : 'var(--color-neutral-600)', tagBg: 'rgba(15,118,110,0.16)', tagFg: 'var(--ink-ok)', bg: 'rgba(0,0,0,0.025)' },
  ];
}

export interface PendingRow {
  readonly date: string;
  readonly settle: string;
  readonly type: string;
  readonly security: string;
  readonly amount: string;
  readonly color: string;
  readonly left: string;
  readonly leftColor: string;
  readonly bg: string;
}

export function computePendingRows(pending: readonly Transaction[]): PendingRow[] {
  return pending.map((t, i) => ({
    date: fmt(t.date),
    settle: fmt(t.settle),
    type: t.legs > 1 ? t.legs + ' jambes' : LEGS[t.ref]?.[0] ? LEGS[t.ref][0].type : t.nature,
    security: t.legs > 1 ? t.ref : t.security,
    amount: eur(t.amount),
    color: t.sense === 'credit' ? 'var(--ink-ok)' : 'var(--color-text)',
    left: (() => {
      const d = Math.round((new Date(t.settle).getTime() - new Date(TODAY).getTime()) / 86400000);
      return d <= 0 ? "Aujourd'hui" : 'Dans ' + d + ' j';
    })(),
    leftColor: 'var(--ink-warn-2)',
    bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
  }));
}

export interface RecoStatCard {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

export function computeRecoStats(): RecoStatCard[] {
  const total = TX.length;
  const by: Record<string, number> = {};
  TX.forEach((t) => {
    const k = RECO[t.ref] || 'pending';
    by[k] = (by[k] || 0) + 1;
  });
  const matched = by['matched'] || 0;
  const rate = Math.round((matched / total) * 100);
  const cards: RecoStatCard[] = [
    { key: 'rate', label: 'Taux', value: rate + ' %', bg: rate >= 80 ? 'rgba(15,118,110,0.14)' : 'rgba(143,63,6,0.16)', fg: rate >= 80 ? 'var(--ink-ok)' : 'var(--ink-warn)', hint: 'Part des transactions rapprochées sur le total du registre' },
  ];
  (['matched', 'pending', 'gap', 'unmatched', 'manual'] as const).forEach((k) => {
    if (by[k]) cards.push({ key: k, label: RECO_STATE[k].label, value: String(by[k]), bg: RECO_STATE[k].bg, fg: RECO_STATE[k].fg, hint: RECO_STATE[k].hint });
  });
  return cards;
}

export function computeRecoStamp(): string {
  const ats = Object.keys(RECO_DETAIL)
    .map((k) => RECO_DETAIL[k].at)
    .filter(Boolean)
    .sort();
  if (!ats.length) return 'Aucun rapprochement enregistré';
  const d = new Date(ats[ats.length - 1]);
  const p = (n: number) => String(n).padStart(2, '0');
  return `Dernier rapprochement le ${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} à ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// ---------------------------------------------------------------------------
// Lignes du registre : en-têtes de mois, transactions, détail des jambes
// ---------------------------------------------------------------------------

export interface MonthStat {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
}

export interface NatureTag {
  readonly label: string;
  readonly count: string;
  readonly bg: string;
  readonly fg: string;
}

export interface MonthRow {
  readonly kind: 'month';
  readonly key: string;
  readonly monthLabel: string;
  readonly monthCount: string;
  readonly monthOpen: boolean;
  readonly monthChevron: string;
  readonly monthToggleTitle: string;
  readonly monthStats: readonly MonthStat[];
  readonly monthNatures: readonly NatureTag[];
}

/** Sous-en-tête de nature, émis dans un mois dont le panneau demande le regroupement. */
export interface NatureRow {
  readonly kind: 'nature';
  readonly natureKey: string;
  readonly natureLabel: string;
  readonly natureCount: string;
  readonly natureBg: string;
  readonly natureFg: string;
}

export interface TxRow {
  readonly kind: 'tx';
  readonly ref: string;
  readonly recoLabel: string;
  readonly recoBg: string;
  readonly recoFg: string;
  readonly recoHint: string;
  readonly date: string;
  readonly op: string;
  readonly opNos: readonly string[];
  readonly opHint: string;
  readonly opBg: string | null;
  readonly opFg: string | null;
  readonly kindLabel: string;
  readonly kindHint: string;
  readonly kindBg: string;
  readonly kindFg: string;
  readonly isSecurity: boolean;
  readonly isCash: boolean;
  readonly nature: string;
  readonly natureBg: string;
  readonly natureFg: string;
  readonly legs: string;
  readonly legsTitle: string;
  readonly manyLegs: boolean;
  readonly rowTitle: string;
  readonly account: string;
  readonly security: string;
  readonly amount: string;
  readonly amountColor: string;
  readonly settle: string;
  readonly state: string;
  readonly stateHint: string;
  readonly stateBg: string;
  readonly stateFg: string;
  readonly bg: string;
}

/* Colonnes du tableau des jambes du panneau de detail. Change s'intercale juste avant Brut :
   le cours se lit ainsi entre le prix unitaire et le montant qu'il sert a convertir. */
export const LEG_COLUMNS: readonly string[] = ['opno', 'seq', 'date', 'type', 'account', 'security', 'qty', 'price', 'fees', 'taxes', 'fx', 'gross', 'net'];

export interface LegDetailRow {
  readonly opNo: string;
  /** Devise de cotation du titre, devise du compte, et cours qui mene de l'une a l'autre. */
  readonly currency: string;
  readonly fx: string;
  readonly fxHint: string;
  readonly seq: string;
  readonly date: string;
  readonly type: string;
  readonly account: string;
  readonly security: string;
  readonly qty: string;
  readonly price: string;
  readonly fees: string;
  readonly taxes: string;
  readonly amount: string;
  readonly net: string;
  readonly color: string;
  readonly bg: string;
}

export interface DetailRow {
  readonly kind: 'detail';
  readonly detailRef: string;
  readonly detailCount: string;
  readonly detailNature: string;
  readonly detailStamp: string;
  readonly detailStampHint: string;
  readonly detailReco: string;
  readonly detailRecoBg: string;
  readonly detailRecoFg: string;
  readonly detailRecoHint: string;
  readonly detailOwner: string;
  readonly detailComment: string;
  readonly detailTotal: string;
  readonly legRows: readonly LegDetailRow[];

}

export type RegisterRow = MonthRow | NatureRow | TxRow | DetailRow;

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export type GroupKey = 'none' | 'nature' | 'kind' | 'type' | 'account' | 'security';

/**
 * Critère de regroupement d'une transaction : le libellé du sous-en-tête et ses teintes.
 * Nature, Objet et Type reprennent les couleurs de leur pastille dans le tableau ; Compte et
 * Titre, qui n'en ont pas, restent en gris neutre.
 */
function groupOf(t: Transaction, by: GroupKey): { key: string; label: string; bg: string; fg: string } {
  const neutre = { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-800)' };
  switch (by) {
    case 'nature':
      return {
        key: t.nature,
        label: NATURES[t.nature]?.label || t.nature,
        bg: (NATURES as Record<string, { bg: string }>)[t.nature]?.bg || neutre.bg,
        fg: (NATURES as Record<string, { fg: string }>)[t.nature]?.fg || neutre.fg,
      };
    case 'kind': {
      const cash = kindOf(t.security) === 'cash';
      return {
        key: cash ? 'cash' : 'security',
        label: cash ? 'Trésorerie' : 'Titre',
        bg: cash ? 'var(--tx-treso-bg)' : 'var(--tx-titre-bg)',
        fg: cash ? 'var(--ink-magenta)' : 'var(--ink-brand-2)',
      };
    }
    case 'type': {
      const code = TX_OP[t.ref] || '—';
      const nat = TYPE_TO_NATURE[code] as NatureKey | undefined;
      return {
        key: code,
        label: code,
        bg: (nat && LIGHT_NATURE_TINT[nat]?.bg) || neutre.bg,
        fg: (nat && LIGHT_NATURE_TINT[nat]?.fg) || neutre.fg,
      };
    }
    case 'account':
      return { key: t.account, label: t.account, ...neutre };
    case 'security':
      return { key: t.security, label: t.security, ...neutre };
    default:
      return { key: '', label: '', ...neutre };
  }
}

/**
 * `monthGroups` : pour chaque mois, le critère de regroupement demandé par son panneau. Le
 * parcours se fait mois par mois plutôt que transaction par transaction — c'est la seule façon
 * de réordonner les lignes d'un mois et d'y intercaler des sous-en-têtes sans perturber les
 * autres.
 */
export function buildRows(
  list: readonly Transaction[],
  openMonths: ReadonlySet<string>,
  open: ReadonlySet<string>,
  monthGroups: ReadonlyMap<string, GroupKey> = new Map<string, GroupKey>(),
): RegisterRow[] {
  const out: RegisterRow[] = [];

  /* Mois dans leur ordre d'apparition : `list` est déjà trié, le regroupement ne fait que le
     refléter sans le retrier. */
  const byMonth = new Map<string, Transaction[]>();
  list.forEach((t) => {
    const ym = t.date.slice(0, 7);
    const bucket = byMonth.get(ym);
    if (bucket) bucket.push(t);
    else byMonth.set(ym, [t]);
  });

  byMonth.forEach((monthRows, month) => {
    const by = monthGroups.get(month) ?? 'none';
    const grouped = by !== 'none';
    /* Regroupé : les transactions sont rangées par critère et un sous-en-tête est émis à chaque
       changement. Les natures suivent l'ordre de NATURES (du plus courant au plus rare), les
       autres critères l'ordre alphabétique de leur libellé. Sinon l'ordre chronologique est
       conservé. */
    const natureOrder = Object.keys(NATURES);
    const rank = (t: Transaction) =>
      by === 'nature' ? String(natureOrder.indexOf(t.nature)).padStart(3, '0') : groupOf(t, by).label;
    const ordered = grouped ? [...monthRows].sort((a, b) => rank(a).localeCompare(rank(b), 'fr')) : monthRows;
    let lastGroup: string | null = null;

    ordered.forEach((t, i) => {
      const ym = month;
      if (i === 0) {
      const mi = Number(ym.slice(5, 7)) - 1;
      const mRows = list.filter((x) => x.date.slice(0, 7) === ym);
      const mOpen = openMonths.has(ym);
      const mLegs = mRows.reduce((n, x) => n + (x.legs || 1), 0);
      const mNet = mRows.reduce((n, x) => n + (x.sense === 'credit' ? x.amount || 0 : -(x.amount || 0)), 0);
      const mFees = mRows.reduce((n, x) => {
        const ls = LEGS[x.ref];
        if (ls && ls.length) return n + ls.reduce((m, l) => m + (l.fees || 0) + (l.taxes || 0), 0);
        return n + (x.fees || 0) + (x.taxes || 0);
      }, 0);
      const mPend = mRows.filter((x) => isPending(x)).length;
      const mGap = mRows.filter((x) => (RECO[x.ref] || 'pending') === 'gap').length;
      const byNat: Record<string, number> = {};
      mRows.forEach((x) => {
        byNat[x.nature] = (byNat[x.nature] || 0) + 1;
      });
      out.push({
        kind: 'month',
        key: ym,
        monthLabel: `${MONTHS_FR[mi] || ''} ${ym.slice(0, 4)}`,
        monthCount: `${mRows.length}${mRows.length > 1 ? ' transactions' : ' transaction'}`,
        monthOpen: mOpen,
        monthChevron: mOpen ? '180deg' : '0deg',
        monthToggleTitle: mOpen ? 'Replier la synthèse du mois' : 'Déplier la synthèse du mois',
        monthStats: [
          { label: 'Opérations', value: String(mLegs) },
          { label: 'Flux net', value: (mNet >= 0 ? '+' : '−') + eur(Math.abs(mNet)), color: mNet >= 0 ? 'var(--ink-ok)' : 'var(--color-text)' },
          { label: 'Frais et taxes', value: eur(mFees) },
          { label: 'En suspens', value: String(mPend), color: mPend ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)' },
          { label: 'Écarts de réconciliation', value: String(mGap), color: mGap ? 'var(--ink-warn-2)' : 'var(--ink-ok)' },
        ],
        monthNatures: Object.keys(byNat)
          .sort()
          .map((k) => ({
            label: k,
            count: String(byNat[k]),
            bg: (NATURES as Record<string, { bg: string }>)[k]?.bg || 'var(--color-neutral-200)',
            fg: (NATURES as Record<string, { fg: string }>)[k]?.fg || 'var(--color-neutral-800)',
          })),
      });
    }

    if (grouped) {
      const g = groupOf(t, by);
      if (g.key !== lastGroup) {
        lastGroup = g.key;
        const count = ordered.filter((x) => groupOf(x, by).key === g.key).length;
        out.push({
          kind: 'nature',
          natureKey: `${month}-${g.key}`,
          natureLabel: g.label,
          natureCount: `${count} transaction${count > 1 ? 's' : ''}`,
          natureBg: g.bg,
          natureFg: g.fg,
        });
      }
    }

    const p = isPending(t);
    const isOpen = open.has(t.ref);
    const k = kindOf(t.security);
    out.push({
      kind: 'tx',
      ref: t.ref,
      recoLabel: RECO_STATE[RECO[t.ref] || 'pending'].label,
      recoBg: RECO_STATE[RECO[t.ref] || 'pending'].bg,
      recoFg: RECO_STATE[RECO[t.ref] || 'pending'].fg,
      recoHint: RECO_STATE[RECO[t.ref] || 'pending'].hint,
      date: fmt(t.date),
      op: TX_OP[t.ref] || '',
      // Tous les codes, et non plus un résumé « premier … dernier » : le gabarit les empile,
      // une ligne par opération.
      opNos: LEG_OPNO[t.ref] ?? (TX_OPNO[t.ref] ? [TX_OPNO[t.ref]] : []),
      opHint: LEG_RULES[TX_OP[t.ref]]?.why || '',
      // Types de TRADE et CORPORATE en teinte plus claire que leur badge Nature (voir
      // LIGHT_NATURE_TINT dans transactions-data.ts) plutôt que l'indigo générique des
      // autres codes d'opération.
      opBg: LIGHT_NATURE_TINT[TYPE_TO_NATURE[TX_OP[t.ref]] as NatureKey]?.bg ?? null,
      opFg: LIGHT_NATURE_TINT[TYPE_TO_NATURE[TX_OP[t.ref]] as NatureKey]?.fg ?? null,
      kindLabel: k === 'cash' ? 'Trésorerie' : 'Titre',
      kindHint: k === 'cash' ? "Mouvement d'espèces : la poche touchée est un compte de liquidité" : 'Opération sur titre : la poche touchée est une ligne de portefeuille',
      // Titre et Trésorerie volontairement plus foncés que l'intensité normale des badges
      // (0.16) : la colonne Objet distingue le type de poche touchée, pas la nature de
      // l'opération — elle mérite de rester repérable au premier coup d'œil dans le registre.
      // Jetons CSS (--tx-titre-bg/--tx-treso-bg dans transactions.css), pas des rgba() en dur :
      // une opacité fixe calculée pour un fond clair devient un aplat sombre en thème sombre
      // (le fond derrière change), avec un texte --ink-brand-2 éclairci qui y ressort presque
      // blanc — chaque thème a donc sa propre valeur, posée en CSS, pas ici.
      kindBg: k === 'cash' ? 'var(--tx-treso-bg)' : 'var(--tx-titre-bg)',
      // --ink-brand (pas --ink-brand-2) donnait au badge le même bleu que les titres de page
      // et le bandeau de marque — --ink-brand-2 est le bleu réservé aux badges dans le reste
      // de l'appli (ex. le chip Achat de « Nature des opérations sur une position »).
      kindFg: k === 'cash' ? 'var(--ink-magenta)' : 'var(--ink-brand-2)',
      isSecurity: k === 'security',
      isCash: k === 'cash',
      nature: NATURES[t.nature].label,
      natureBg: NATURES[t.nature].bg,
      natureFg: NATURES[t.nature].fg,
      legs: String(t.legs),
      legsTitle: t.legs + ' jambes',
      manyLegs: t.legs > 1,
      rowTitle: isOpen ? 'Replier le détail' : 'Dérouler le détail',
      account: (() => {
        const ls = LEGS[t.ref];
        if (!ls || !ls.length) return t.account;
        const seen = new Set<string>();
        return ls
          .map((l) => l.account)
          .filter((x) => x && !seen.has(x) && seen.add(x))
          .join(', ');
      })(),
      security: t.security,
      amount: t.amount ? eur(t.amount) : '—',
      amountColor: t.amount ? (t.sense === 'credit' ? 'var(--ink-ok)' : 'var(--color-text)') : 'var(--color-neutral-600)',
      settle: fmt(t.settle),
      state: p ? 'En suspens' : 'Réglé',
      stateHint: p ? 'Négociée, pas encore réglée : comptes 464 ou 465' : 'Dénouée : espèces et titres livrés',
      stateBg: p ? 'rgba(180,83,9,0.12)' : 'rgba(15,118,110,0.14)',
      stateFg: p ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
      bg: isOpen ? 'rgba(0,61,165,0.34)' : i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
    });

    if (isOpen) {
      const legSource: readonly LegDetailSource[] =
        LEGS[t.ref] && LEGS[t.ref].length
          ? LEGS[t.ref]
          : [{ type: TX_OP[t.ref], account: t.account, security: t.security, settle: t.settle, amount: t.amount, sense: t.sense, qty: t.qty, price: t.price, fees: t.fees, taxes: t.taxes }];
      out.push({
        kind: 'detail',
        detailRef: t.ref,
        detailCount: legSource.length + (legSource.length > 1 ? ' jambes' : ' jambe'),
        detailNature: NATURES[t.nature]?.label || t.nature,
        detailStamp: (() => {
          const d = t.date.split('-').reverse().join('/');
          return t.time ? d + ' à ' + t.time : d;
        })(),
        detailStampHint: (() => {
          const d = t.date.split('-').reverse().join('/');
          const c = t.time ? 'Créée le ' + d + ' à ' + t.time : 'Créée le ' + d;
          return t.modified ? c + ' · dernière modification le ' + t.modified.split('-').reverse().join('/') : c;
        })(),
        detailReco: RECO_STATE[RECO[t.ref] || 'pending'].label,
        detailRecoBg: RECO_STATE[RECO[t.ref] || 'pending'].bg,
        detailRecoFg: RECO_STATE[RECO[t.ref] || 'pending'].fg,
        detailRecoHint: RECO_STATE[RECO[t.ref] || 'pending'].hint,
        detailOwner: t.owner || '—',
        detailComment: t.comment || '',
        detailTotal: (() => {
          const g = legSource.reduce((a, l) => a + (Number(l.amount) || 0), 0);
          return g ? 'Total ' + g.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : '';
        })(),
        legRows: legSource.map((l, k) => ({
          opNo: (LEG_OPNO[t.ref] || [])[k] || TX_OPNO[t.ref] || '',
          currency: currencyOfSecurity(l.security),
          fx: fxLabel(fxRate(currencyOfSecurity(l.security), currencyOfAccount(l.account))),
          fxHint: fxHint(currencyOfSecurity(l.security), currencyOfAccount(l.account), fxRate(currencyOfSecurity(l.security), currencyOfAccount(l.account))),
          seq: String(k + 1),
          date: fmt(l.settle),
          type: l.type,
          account: l.account,
          security: l.security,
          qty: l.qty ? l.qty.toLocaleString('fr-FR') : '—',
          price: typeof l.price === 'number' ? l.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
          fees: l.fees ? l.fees.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
          taxes: l.taxes ? l.taxes.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
          amount: l.amount ? eur(l.amount) : '—',
          net: (() => {
            const charges = (l.fees || 0) + (l.taxes || 0);
            if (!l.amount) return charges ? eur(charges) : '—';
            return eur(l.sense === 'credit' ? l.amount - charges : l.amount + charges);
          })(),
          color: l.amount ? (l.sense === 'credit' ? 'var(--ink-ok)' : 'var(--color-text)') : 'var(--color-neutral-600)',
          bg: k % 2 ? 'rgba(255,255,255,0.55)' : 'var(--surface)',
        })),
      });
    }
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Recherche : barre principale (groupée) et filtre de colonne Référence
// ---------------------------------------------------------------------------

export interface AutocompleteGroup {
  readonly label: string;
  readonly items: readonly { readonly label: string; readonly count: string }[];
}

export function buildSearchGroups(query: string): AutocompleteGroup[] {
  const q = query.trim().toLowerCase();
  const groups: { readonly label: string; readonly values: readonly string[] }[] = [
    { label: 'Référence', values: TX.map((x) => x.ref) },
    { label: 'Titre ou poche', values: ([] as string[]).concat(...TX.map(secOf)) },
    { label: 'Compte', values: ([] as string[]).concat(...TX.map(accOf)) },
  ];
  return groups
    .map((g) => {
      const counts: Record<string, number> = {};
      g.values.forEach((v) => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
      const items = Object.keys(counts)
        .filter((v) => !q || v.toLowerCase().indexOf(q) >= 0)
        .sort((a, b) => a.localeCompare(b, 'fr'))
        .slice(0, 8)
        .map((v) => ({ label: v, count: String(counts[v]) }));
      return { label: g.label, items };
    })
    .filter((g) => g.items.length > 0);
}

export function searchHasNoMatch(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const pool = TX.map((x) => x.ref + ' ' + x.security + ' ' + x.account)
    .join(' ')
    .toLowerCase();
  return pool.indexOf(q) < 0;
}

export function refOptions(refFilter: string): readonly string[] {
  const q = refFilter.trim().toLowerCase();
  return TX.map((x) => x.ref).filter((r) => !q || r.toLowerCase().indexOf(q) >= 0);
}

interface LegDetailSource {
  readonly type: string;
  readonly account: string;
  readonly security: string;
  readonly settle: string;
  readonly amount: number;
  readonly sense: 'debit' | 'credit' | 'none';
  readonly qty?: number;
  readonly price?: number;
  readonly fees?: number;
  readonly taxes?: number;
}
