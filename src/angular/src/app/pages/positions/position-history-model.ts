import {
  CASH_KINDS,
  FXR,
  HIST_KINDS,
  MONTHS_FR,
  SEC_ACTIVITY,
  SECURITY_REF,
  cashHistory,
  positionHistory,
  type CashKindKey,
  type HistKindKey,
  type Portfolio,
  type PortfolioPosition,
} from './positions-data';

/**
 * Porté depuis les branches `__account`/`__cash`/position de la fonction `histInfo` dans
 * `Positions.dc.html`. `hist.events`/`hist.eventsNote` (calculés dans le prototype) ne sont
 * jamais lus par le template — confirmé au grep — et ne sont donc pas repris ici.
 */

const n2 = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day2 = (d: Date) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();

export interface HistKpi {
  readonly label: string;
  readonly value: string;
  readonly color: string;
}

export interface HistTableRow {
  readonly zebra: string;
  readonly date: string;
  readonly lot: string;
  readonly ticker?: string;
  readonly kind: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly qty: string;
  readonly price: string;
  readonly amount: string;
  readonly amountColor: string;
  readonly balance: string;
}

export interface HistJournal {
  readonly title: string;
  readonly subtitle: string;
  readonly note: string;
  readonly kpis: readonly HistKpi[];
  readonly path: string;
  readonly area: string;
  readonly ticks: readonly { readonly label: string }[];
  readonly rows: readonly HistTableRow[];
  readonly showTicker: boolean;
  readonly kindCounts: Readonly<Record<string, number>>;
}

export interface RefCard {
  readonly fields: readonly { readonly label: string; readonly value: string }[];
}

export interface HistRef {
  readonly name: string;
  readonly isin: string;
  readonly symbol: string;
  readonly currency: string;
  readonly index: string;
  readonly place: string;
  readonly kind: string;
  readonly activity: string;
  readonly activityNote: string;
  readonly cards: readonly RefCard[];
  readonly pricePath: string;
  readonly priceArea: string;
  readonly priceTicks: readonly { readonly label: string }[];
  readonly yearRange: string;
  readonly yearColor: string;
}

interface SortableRow {
  readonly d: Date;
  readonly lot?: number;
  readonly qty?: number;
  readonly price?: number;
  readonly balance?: number;
  readonly kind: string;
  readonly ticker?: string;
}

export function sortHistRows<T extends SortableRow>(list: readonly T[], key: string | null, dir: 'asc' | 'desc'): readonly T[] {
  if (!key) return list;
  const d = dir === 'desc' ? -1 : 1;
  const num = (r: T): number | null => {
    if (key === 'date') return r.d.getTime();
    if (key === 'lot') return r.lot || 0;
    if (key === 'quantity') return Math.abs(r.qty || 0);
    if (key === 'price') return r.price || 0;
    if (key === 'amount') return r.kind === 'div' ? (r.price || 0) * (r.balance || 1) : Math.abs(r.qty || 0) * (r.price || 0);
    if (key === 'position') return r.balance || 0;
    return null;
  };
  const txt = (r: T): string | null => (key === 'security' ? r.ticker ?? '' : key === 'operation' ? r.kind : null);
  return list.slice().sort((a, b) => {
    const na = num(a);
    if (na !== null) return (na - (num(b) as number)) * d;
    const ta = txt(a);
    if (ta === null) return 0;
    return String(ta).localeCompare(String(txt(b) ?? ''), 'fr') * d;
  });
}

function simpleLinePath(values: readonly number[], w: number, h: number, pad: number): { path: string; area: string } {
  const max = Math.max(...values) || 1;
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const path = values.map((v, i) => (i ? 'L' : 'M') + ((i / (values.length - 1 || 1)) * w).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
  return { path, area: values.length ? path + ' L' + w + ' ' + y(0).toFixed(1) + ' L0 ' + y(0).toFixed(1) + ' Z' : '' };
}

export function buildAccountJournal(pf: Portfolio, months: number, rangeLabel: string, kinds: Readonly<Record<HistKindKey, boolean>>, sortKey: string | null, sortDir: 'asc' | 'desc'): HistJournal {
  const all: Array<{ d: Date; kind: HistKindKey; ticker: string; lot: number; qty: number; price: number; balance: number }> = [];
  pf.positions.forEach((p) => {
    positionHistory(p, months).forEach((h) => {
      all.push({ d: h.d, kind: h.kind, ticker: p.ticker, lot: h.lot, qty: h.qty, price: h.price, balance: h.balance });
    });
  });
  all.sort((a, b) => a.d.getTime() - b.d.getTime());
  const shown = all.filter((r) => kinds[r.kind] !== false);
  const fx = (v: number, c: string) => v * (FXR[c] || 1);
  const posByTicker = new Map(pf.positions.map((p) => [p.ticker, p]));
  const currencyOf = (ticker: string) => posByTicker.get(ticker)?.currency || 'EUR';
  const invested = all.filter((r) => r.kind === 'buy').reduce((n, r) => n + fx(r.qty * r.price, currencyOf(r.ticker)), 0);
  const sold = all.filter((r) => r.kind === 'sell').reduce((n, r) => n + fx(Math.abs(r.qty) * r.price, currencyOf(r.ticker)), 0);
  const income = all.filter((r) => r.kind === 'div').reduce((n, r) => n + fx(r.price * (r.balance || 1), currencyOf(r.ticker)), 0);
  const mv = pf.positions.reduce((n, p) => n + fx(p.qty * p.price, p.currency), 0);

  const nS = 90;
  const serie: number[] = [];
  let seed = pf.id.length * 331 + 5;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < nS; i++) {
    const t = i / (nS - 1);
    serie.push(Math.max(0, mv * (0.62 + 0.38 * t) + (rnd() - 0.5) * mv * 0.05));
  }
  serie[nS - 1] = mv;
  const { path, area } = simpleLinePath(serie, 1000, 150, 8);

  const first = all.length ? all[0].d : new Date(2021, 2, 15);
  const last = new Date(2026, 8, 4);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(first.getTime() + ((last.getTime() - first.getTime()) / 4) * i);
    return { label: MONTHS_FR[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) };
  });

  const kindCounts: Record<string, number> = { buy: 0, sell: 0, div: 0, split: 0 };
  all.forEach((r) => {
    kindCounts[r.kind] = (kindCounts[r.kind] || 0) + 1;
  });
  const sorted = sortHistRows(shown.slice().reverse(), sortKey, sortDir);
  return {
    title: pf.label,
    kindCounts,
    subtitle: pf.positions.length + ' ligne(s) · toutes opérations du compte',
    note: shown.length + ' / ' + all.length + ' opération(s) · ' + rangeLabel.toLowerCase(),
    kpis: [
      { label: 'Valeur des positions', value: n2(mv) + ' EUR', color: 'var(--color-text)' },
      { label: 'Investi (période)', value: n2(invested) + ' EUR', color: 'var(--color-text)' },
      { label: 'Produits de cession', value: n2(sold) + ' EUR', color: 'var(--ink-ok-2)' },
      { label: 'Dividendes', value: n2(income) + ' EUR', color: 'var(--ink-ok-2)' },
    ],
    path,
    area,
    ticks,
    showTicker: true,
    rows: sorted.map((r, ri) => ({
      zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      date: day2(r.d),
      lot: String(r.lot),
      ticker: r.ticker,
      kind: HIST_KINDS[r.kind].label,
      tagBg: HIST_KINDS[r.kind].bg,
      tagFg: HIST_KINDS[r.kind].fg,
      qty: r.qty ? n2(Math.abs(r.qty)) : '—',
      price: n2(r.price),
      amount: (r.kind === 'buy' ? '−' : '+') + n2(r.kind === 'div' ? r.price * (r.balance || 1) : Math.abs(r.qty) * r.price) + ' ' + currencyOf(r.ticker),
      amountColor: r.kind === 'buy' ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
      balance: n2(r.balance),
    })),
  };
}

export function buildCashJournal(pf: Portfolio, months: number, rangeLabel: string, kinds: Readonly<Record<CashKindKey, boolean>>, sortKey: string | null, sortDir: 'asc' | 'desc'): HistJournal {
  const cRows = cashHistory(pf, months);
  const shown = cRows.filter((r) => kinds[r.kind] !== false);
  const ins = cRows.filter((r) => r.amount > 0).reduce((n, r) => n + r.amount, 0);
  const outs = cRows.filter((r) => r.amount < 0).reduce((n, r) => n + r.amount, 0);
  const fees = cRows.filter((r) => r.kind === 'fee').reduce((n, r) => n + r.amount, 0);
  const bal = cRows.map((r) => r.balance).concat([pf.cash]);
  const { path, area } = simpleLinePath(bal.slice(0, -1), 1000, 150, 8);

  const first = cRows.length ? cRows[0].d : new Date(2021, 2, 1);
  const last = new Date(2026, 8, 4);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(first.getTime() + ((last.getTime() - first.getTime()) / 4) * i);
    return { label: MONTHS_FR[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) };
  });

  const kindCounts: Record<string, number> = {};
  cRows.forEach((r) => {
    kindCounts[r.kind] = (kindCounts[r.kind] || 0) + 1;
  });
  const sorted = sortHistRows(shown.slice().reverse(), sortKey, sortDir);
  return {
    title: 'Trésorerie ' + pf.cashCurrency,
    kindCounts,
    subtitle: pf.label + ' · compte de liquidité rattaché',
    note: shown.length + ' / ' + cRows.length + ' mouvement(s) · ' + rangeLabel.toLowerCase(),
    kpis: [
      { label: 'Solde actuel', value: n2(pf.cash) + ' ' + pf.cashCurrency, color: 'var(--color-text)' },
      { label: 'Entrées (période)', value: n2(ins) + ' ' + pf.cashCurrency, color: 'var(--ink-ok-2)' },
      { label: 'Sorties (période)', value: n2(Math.abs(outs)) + ' ' + pf.cashCurrency, color: 'var(--ink-warn-2)' },
      { label: 'Frais', value: n2(Math.abs(fees)) + ' ' + pf.cashCurrency, color: 'var(--color-neutral-800)' },
    ],
    path,
    area,
    ticks,
    showTicker: false,
    rows: sorted.map((r, ri) => ({
      zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      date: day2(r.d),
      lot: '—',
      kind: CASH_KINDS[r.kind].label,
      tagBg: CASH_KINDS[r.kind].bg,
      tagFg: CASH_KINDS[r.kind].fg,
      qty: '—',
      price: '—',
      amount: (r.amount > 0 ? '+' : '−') + n2(Math.abs(r.amount)) + ' ' + pf.cashCurrency,
      amountColor: r.amount > 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
      balance: n2(r.balance),
    })),
  };
}

export function buildPositionJournal(pf: Portfolio, pos: PortfolioPosition, months: number, rangeLabel: string, kinds: Readonly<Record<HistKindKey, boolean>>, sortKey: string | null, sortDir: 'asc' | 'desc'): HistJournal {
  const allRows = positionHistory(pos, months);
  const rows = allRows.filter((r) => kinds[r.kind] !== false);
  const bought = allRows.filter((r) => r.kind === 'buy');
  const sold = allRows.filter((r) => r.kind === 'sell');
  const divs = allRows.filter((r) => r.kind === 'div');
  const invested = bought.reduce((n, r) => n + r.qty * r.price, 0);
  const proceeds = sold.reduce((n, r) => n + Math.abs(r.qty) * r.price, 0);
  const income = divs.reduce((n, r) => n + r.price * (r.balance || pos.qty), 0);
  const realized = proceeds - bought.slice(0, Math.max(0, bought.length - 1)).reduce((n, r) => n + r.qty * r.price, 0);
  const mv = pos.qty * pos.price;

  const n = 90;
  const openedAt = allRows.length ? allRows[0].d : new Date(2021, 2, 15);
  const last = new Date(2026, 8, 4);
  const windowStart = months ? new Date(last.getFullYear(), last.getMonth() - months, last.getDate()) : new Date(2021, 2, 15);
  const first = months ? windowStart : openedAt;
  const series: number[] = [];
  let seed = pos.ticker.length * 41 + 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const sd = pos.pru * 0.8 + (pos.price - pos.pru * 0.8) * t + (rnd() - 0.5) * pos.pru * 0.06;
    series.push(Math.max(0, sd * pos.qty));
  }
  series[n - 1] = mv;
  const { path, area } = simpleLinePath(series, 1000, 150, 8);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(first.getTime() + ((last.getTime() - first.getTime()) / 4) * i);
    return { label: MONTHS_FR[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) };
  });

  const kindCounts: Record<string, number> = { buy: 0, sell: 0, div: 0, split: 0 };
  allRows.forEach((r) => {
    kindCounts[r.kind] = (kindCounts[r.kind] || 0) + 1;
  });
  const sorted = sortHistRows(rows.slice().reverse(), sortKey, sortDir);
  return {
    title: pos.ticker + ' — ' + pos.name,
    kindCounts,
    subtitle: pf.label + ' · ' + pos.isin + ' · lot en cours ' + (pos.lot || 1),
    note: rows.length + ' / ' + allRows.length + ' opération(s) · position ouverte ' + (pos.lot || 1) + ' fois · ' + rangeLabel.toLowerCase(),
    kpis: [
      { label: 'Position actuelle', value: n2(pos.qty) + ' titres', color: 'var(--color-text)' },
      { label: 'Investi (période)', value: n2(invested) + ' ' + pos.currency, color: 'var(--color-text)' },
      { label: 'P/L réalisé', value: n2(realized) + ' ' + pos.currency, color: realized >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)' },
      { label: 'Dividendes', value: n2(income) + ' ' + pos.currency, color: 'var(--ink-ok-2)' },
    ],
    path,
    area,
    ticks,
    showTicker: false,
    rows: sorted.map((r, ri) => ({
      zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      date: day2(r.d),
      lot: String(r.lot),
      kind: HIST_KINDS[r.kind].label,
      tagBg: HIST_KINDS[r.kind].bg,
      tagFg: HIST_KINDS[r.kind].fg,
      qty: r.qty ? n2(Math.abs(r.qty)) : '—',
      price: n2(r.price),
      amount: (r.kind === 'sell' ? '+' : r.kind === 'buy' ? '−' : '+') + n2(r.kind === 'div' ? r.price * (r.balance || pos.qty) : Math.abs(r.qty) * r.price) + ' ' + pos.currency,
      amountColor: r.kind === 'buy' ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
      balance: n2(r.balance),
    })),
  };
}

export function buildPositionRef(pos: PortfolioPosition): HistRef {
  const r2 = SECURITY_REF[pos.ticker] || {
    name: pos.name,
    symbol: pos.ticker,
    place: '—',
    country: '—',
    sector: '—',
    index: '—',
    kind: 'Titre',
    lotSize: '—',
    settle: '—',
  };
  const nP = 120;
  const HP = 120;
  const WP = 1000;
  const padP = 6;
  const prices: number[] = [];
  let seed = pos.ticker.length * 173 + 11;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < nP; i++) {
    const t = i / (nP - 1);
    const sp = pos.pru * 0.86 + (pos.price - pos.pru * 0.86) * t + (rnd() - 0.5) * pos.pru * 0.07;
    prices.push(Math.max(0.01, sp));
  }
  prices[nP - 1] = pos.price;
  const maxP = Math.max(...prices);
  const minP = Math.min(...prices);
  const yP = (v: number) => HP - padP - ((v - minP * 0.98) / ((maxP - minP * 0.98) || 1)) * (HP - padP * 2);
  const pathP = prices.map((v, i) => (i ? 'L' : 'M') + ((i / (nP - 1)) * WP).toFixed(1) + ' ' + yP(v).toFixed(1)).join(' ');
  const last = new Date(2026, 8, 4);
  const priceTicks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(last.getFullYear(), last.getMonth() - 12 + i * 3, 1);
    return { label: MONTHS_FR[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) };
  });
  const chg = prices[0] ? ((pos.price - prices[0]) / prices[0]) * 100 : 0;

  return {
    name: r2.name,
    isin: pos.isin,
    symbol: r2.symbol,
    currency: pos.currency,
    index: r2.index,
    place: r2.place.replace(/ [A-Z]{4}$/, ''),
    kind: r2.kind === 'Action ordinaire' ? 'Titre' : r2.kind,
    activity: SEC_ACTIVITY[pos.ticker] || 'Activité non renseignée.',
    activityNote: r2.sector + ' · ' + r2.country,
    cards: [
      { fields: [{ label: 'Nom', value: r2.name }, { label: 'Dernier cours', value: n2(pos.price) + ' ' + pos.currency + ' · ' + day2(last) }] },
      { fields: [{ label: 'ISIN', value: pos.isin }, { label: 'Symbole', value: r2.symbol }, { label: 'Place boursière', value: r2.place }] },
      { fields: [{ label: 'Situation géographique', value: r2.country }, { label: "Secteur d'activité", value: r2.sector }, { label: 'Quotité · dénouement', value: r2.lotSize + ' · ' + r2.settle }] },
    ],
    pricePath: pathP,
    priceArea: pathP + ' L' + WP + ' ' + (HP - padP).toFixed(1) + ' L0 ' + (HP - padP).toFixed(1) + ' Z',
    priceTicks,
    yearRange: n2(minP) + ' — ' + n2(maxP) + ' ' + pos.currency + ' · ' + (chg > 0 ? '+' : chg < 0 ? '−' : '') + Math.abs(chg).toFixed(2).replace('.', ',') + ' %',
    yearColor: chg >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
  };
}

