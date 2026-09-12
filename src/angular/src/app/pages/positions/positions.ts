import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CHART_ACCOUNTS,
  CHART_METRICS,
  CHART_RANGES,
  FXR,
  MONTHS_FR,
  PORTFOLIOS,
  POS,
  SECURITY_REF,
  SEC_EVENTS,
  bookCost,
  eur,
  fr,
  fr2,
  fr4,
  onBlueTone,
  pct,
  pnlTone,
  signed2,
  signedPct,
  value,
  type Portfolio,
  type PortfolioPosition,
  type Position,
} from './positions-data';
import { buildChart, computeAccountStats, computeHover } from './positions-chart';
import { nextSort, sortHeaderView } from './positions-sort';
import {
  ICON_ASSET_ALLOC,
  ICON_DIVIDEND,
  ICON_DRAG,
  ICON_HISTORY,
  ICON_SCOPE,
  ICON_SECTOR_ALLOC,
  ICON_TAB_BREAK,
  ICON_TAB_DASH,
  ICON_TAB_INVENTAIRE,
  ICON_TAB_PNL,
  ICON_TRENDING,
} from './positions-icons';
import { PositionHistoryDialog, type HistoryDialogData } from './position-history-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'detail' | 'break' | 'pnl' | 'dash';
type InvView = 'account' | 'position';

/** Palette des barres de répartition (classes d'actifs, secteurs...). */
const PALETTE: readonly string[] = ['var(--ink-brand)', 'var(--ink-ok-2)', 'var(--ink-warn-2)', '#5b6b8c', '#7c5cbf', '#a1673a', '#3f7d8c', 'var(--ink-warn)'];

const n2 = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pc = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + n2(Math.abs(v)) + ' EUR';
const fx = (v: number, c: string) => v * (FXR[c] || 1);

/**
 * Porté depuis `Positions.dc.html`. Voir `positions-data.ts` pour le détail des deux
 * référentiels de titres (POS/institutionnel, PORTFOLIOS/courtiers) et de ce qui, dans le
 * prototype, n'est en réalité jamais rendu (compte sélectionné, position sélectionnée, tri
 * par onglet…) malgré son calcul dans `renderVals()`.
 *
 * Le sélecteur de compte (bouton + liste) et le sélecteur de métrique du graphique
 * redeviennent un vrai `MatMenu`, comme le sélecteur de mandat de Tableau de bord — l'ancre
 * positionnée à la main (`measureAnchor`) du prototype disparaît avec.
 * Le glisser-déposer des comptes redevient `@angular/cdk/drag-drop`.
 */
@Component({
  selector: 'app-positions',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatMenuModule, MatTooltipModule, DragDropModule, MatIconModule, MatTableModule, MatTabsModule],
  templateUrl: './positions.html',
  styleUrl: './positions.css',
})
export class Positions {
  private readonly dialog = inject(MatDialog);

  protected readonly icons = {
    tabInventaire: ICON_TAB_INVENTAIRE,
    tabBreak: ICON_TAB_BREAK,
    tabPnl: ICON_TAB_PNL,
    tabDash: ICON_TAB_DASH,
    scope: ICON_SCOPE,
    drag: ICON_DRAG,
    history: ICON_HISTORY,
    dividend: ICON_DIVIDEND,
    assetAlloc: ICON_ASSET_ALLOC,
    sectorAlloc: ICON_SECTOR_ALLOC,
    trending: ICON_TRENDING,
    gainLoss: ICON_TAB_PNL,
  };

  protected readonly tabs: readonly { readonly key: Tab; readonly label: string }[] = [
    { key: 'detail', label: 'Inventaire' },
    { key: 'break', label: 'Répartitions' },
    { key: 'pnl', label: 'Résultat' },
    { key: 'dash', label: 'Synthèse' },
  ];

  protected readonly tab = signal<Tab>('detail');
  protected readonly query = signal('');
  protected readonly chartOpen = signal(true);
  protected readonly chartRange = signal('6m');
  protected readonly chartMetric = signal<'holdings' | 'growth'>('holdings');
  protected readonly chartOff = signal<Record<string, boolean>>({});
  protected readonly chartAccount = signal('all');
  protected readonly hoverIdx = signal<number | null>(null);
  protected readonly invView = signal<InvView>('account');
  protected readonly invOpen = signal<Record<string, boolean>>({ 'DG-CTO': true });
  protected readonly portfolioOrder = signal<readonly string[]>(PORTFOLIOS.map((p) => p.id));
  protected readonly posSortKey = signal<string | null>(null);
  protected readonly posSortDir = signal<'asc' | 'desc'>('asc');

  protected readonly metricOptions = CHART_METRICS;
  protected readonly chartRangeOptions = CHART_RANGES;

  protected readonly scopeLabel = computed(() => (this.chartAccount() === 'all' ? 'Tous les comptes' : (CHART_ACCOUNTS.find((a) => a.id === this.chartAccount())?.label ?? 'Tous les comptes')));

  protected readonly subtitle = computed(() => this.scopeLabel() + ' · valorisation au 04/09/2026, 17:30');

  protected readonly metricLabel = computed(() => (this.metricOptions.find((m) => m.key === this.chartMetric()) ?? this.metricOptions[0]).label);

  private readonly scopedFlat = computed(() => {
    const sc = this.chartAccount();
    const out: { pf: Portfolio; p: PortfolioPosition }[] = [];
    PORTFOLIOS.filter((pf) => sc === 'all' || pf.id === sc).forEach((pf) => pf.positions.forEach((p) => out.push({ pf, p })));
    return out;
  });

  private readonly scopedCash = computed(() => {
    const sc = this.chartAccount();
    return PORTFOLIOS.filter((pf) => sc === 'all' || pf.id === sc).reduce((n, pf) => n + pf.cash, 0);
  });

  protected readonly kpis = computed(() => {
    const flat = this.scopedFlat();
    const eur2 = (v: number) => n2(v) + ' EUR';
    const cost = flat.reduce((n, x) => n + fx(x.p.qty * x.p.pru, x.p.currency), 0);
    const mv = flat.reduce((n, x) => n + fx(x.p.qty * x.p.price, x.p.currency), 0);
    const day = flat.reduce((n, x) => n + x.p.day, 0);
    const realized = flat.reduce((n, x) => n + x.p.realized, 0);
    const cash = this.scopedCash();
    const tickers = new Set(flat.map((x) => x.p.ticker));
    return [
      { label: 'Valorisation totale', value: eur2(mv + cash), note: `${flat.length} ligne(s) · ${tickers.size} titre(s) · trésorerie ${eur2(cash)}`, color: 'var(--color-text)' },
      { label: 'Prix de revient', value: eur2(cost), note: 'Frais inclus', color: 'var(--color-neutral-800)' },
      {
        label: 'P/L latent',
        value: eur2(mv - cost),
        note: pc(cost ? ((mv - cost) / cost) * 100 : 0) + ' · jour ' + pc(mv ? (day / mv) * 100 : 0),
        color: mv - cost >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
      },
      { label: 'P/L réalisé', value: eur2(realized), note: 'Cessions dénouées', color: realized >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)' },
    ];
  });

  // -------------------------------------------------------------------------------------
  // Graphique
  // -------------------------------------------------------------------------------------

  protected readonly chart = computed(() => buildChart(CHART_ACCOUNTS, this.chartRange(), this.chartMetric(), this.chartOff(), this.chartAccount()));
  protected readonly chartStats = computed(() => computeAccountStats(CHART_ACCOUNTS, this.chartRange()));
  protected readonly hover = computed(() => computeHover(this.chart(), this.hoverIdx()));

  protected readonly scopeOptions = computed(() => {
    const stats = this.chartStats();
    return [{ id: 'all', label: 'Tous les comptes', color: 'var(--ink-brand)', note: `${CHART_ACCOUNTS.length} comptes` }].concat(
      CHART_ACCOUNTS.map((a) => ({ id: a.id, label: a.label, color: a.color, note: stats[a.id]?.value ?? '' })),
    );
  });

  protected readonly chartLegend = computed(() => {
    const stats = this.chartStats();
    return CHART_ACCOUNTS.filter((a) => this.chartAccount() === 'all' || a.id === this.chartAccount()).map((a) => {
      const on = !this.chartOff()[a.id];
      const stat = stats[a.id] || { value: '—', growth: '—', up: 0 };
      return {
        id: a.id,
        label: a.label,
        color: a.color,
        on,
        value: stat.value,
        growth: stat.growth,
        growthColor: on ? (stat.up > 0 ? 'var(--ink-ok-2)' : stat.up < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)') : 'var(--color-neutral-500)',
        opacity: on ? '1' : '0.35',
        fg: on ? 'var(--color-text)' : 'var(--color-neutral-600)',
        trackBg: on ? 'var(--field-brand)' : 'var(--color-neutral-400)',
        knob: on ? '14px' : '0px',
      };
    });
  });

  protected toggleLegend(id: string): void {
    this.chartOff.update((o) => ({ ...o, [id]: !o[id] }));
  }

  protected toggleChart(): void {
    this.chartOpen.update((v) => !v);
  }

  protected setChartRange(v: string): void {
    this.chartRange.set(v);
  }

  protected setChartMetric(v: 'holdings' | 'growth'): void {
    this.chartMetric.set(v);
  }

  protected setScope(id: string): void {
    this.chartAccount.set(id);
    this.hoverIdx.set(null);
  }

  protected onChartMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const n = this.chart().n;
    if (!n) return;
    const b = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - b.left) / (b.width || 1)));
    const idx = Math.round(ratio * (n - 1));
    if (idx !== this.hoverIdx()) this.hoverIdx.set(idx);
  }

  protected onChartLeave(): void {
    if (this.hoverIdx() !== null) this.hoverIdx.set(null);
  }

  // -------------------------------------------------------------------------------------
  // Inventaire (Détail)
  // -------------------------------------------------------------------------------------

  protected setInvView(v: InvView): void {
    this.invView.set(v);
  }

  protected toggleAccountOpen(id: string): void {
    this.invOpen.update((o) => ({ ...o, [id]: !o[id] }));
  }

  protected readonly orderedPortfolios = computed(() => {
    const order = this.portfolioOrder();
    const byId = new Map(PORTFOLIOS.map((p) => [p.id, p]));
    const sc = this.chartAccount();
    return order.map((id) => byId.get(id)!).filter((pf) => sc === 'all' || pf.id === sc);
  });

  protected dropAccount(event: CdkDragDrop<readonly string[]>): void {
    const order = [...this.portfolioOrder()];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.portfolioOrder.set(order);
  }

  private sortPos(list: readonly PortfolioPosition[], accountLabel: string): readonly PortfolioPosition[] {
    const k = this.posSortKey();
    if (!k) return list;
    const dir = this.posSortDir() === 'desc' ? -1 : 1;
    const num = (p: PortfolioPosition): number | null => {
      if (k === 'quantity') return p.qty;
      if (k === 'pru') return p.pru;
      if (k === 'price') return p.price;
      if (k === 'marketValue') return p.qty * p.price;
      if (k === 'costValue') return p.qty * p.pru;
      if (k === 'unrealized') return p.qty * p.price - p.qty * p.pru;
      if (k === 'unrealizedPct') {
        const b = p.qty * p.pru;
        return b ? (p.qty * p.price - b) / b : 0;
      }
      if (k === 'lot') return p.lot || 1;
      return null;
    };
    const txt = (p: PortfolioPosition): string => (({ isin: p.isin, ticker: p.ticker, name: p.name, currency: p.currency, account: accountLabel } as Record<string, string>)[k] ?? '');
    return list.slice().sort((a, b) => {
      const na = num(a);
      if (na !== null) return (na - (num(b) as number)) * dir;
      return txt(a).localeCompare(txt(b), 'fr') * dir;
    });
  }

  protected readonly invAccounts = computed(() => {
    const list = this.orderedPortfolios();
    return list.map((pf) => {
      const cost = pf.positions.reduce((n, p) => n + p.qty * p.pru * (FXR[p.currency] || 1), 0);
      const market = pf.positions.reduce((n, p) => n + p.qty * p.price * (FXR[p.currency] || 1), 0);
      const day = pf.positions.reduce((n, p) => n + p.day, 0);
      const realized = pf.positions.reduce((n, p) => n + p.realized, 0);
      const unreal = market - cost;
      return {
        id: pf.id,
        label: pf.label,
        symbols: String(pf.positions.length),
        empty: pf.positions.length === 0,
        cost: fr2(cost) + ' EUR',
        market: fr2(market) + ' EUR',
        day: signed2(day, 'EUR'),
        dayPct: signedPct(market ? (day / market) * 100 : 0),
        dayColor: onBlueTone(day),
        unrealized: signed2(unreal, 'EUR'),
        unrealizedPct: signedPct(cost ? (unreal / cost) * 100 : 0),
        unrColor: onBlueTone(unreal),
        realized: signed2(realized, 'EUR'),
        realizedPct: signedPct(pf.realizedPct),
        realColor: onBlueTone(realized),
        cash: fr2(pf.cash) + ' ' + pf.cashCurrency,
        open: !!this.invOpen()[pf.id],
        rows: this.sortPos(pf.positions, pf.label).map((p, ri) => {
          const buy = p.qty * p.pru;
          const mv = p.qty * p.price;
          const pnl = mv - buy;
          return {
            zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
            isin: p.isin,
            ticker: p.ticker,
            name: p.name,
            currency: p.currency,
            lot: String(p.lot || 1),
            qty: fr4(p.qty),
            pru: fr2(p.pru),
            buyValue: fr2(buy) + ' ' + p.currency,
            price: fr2(p.price),
            marketValue: fr2(mv) + ' ' + p.currency,
            pnl: fr2(pnl) + ' ' + p.currency,
            pnlPct: fr2(buy ? (pnl / buy) * 100 : 0) + ' %',
            pnlColor: pnlTone(pnl),
          };
        }),
      };
    }).map((a) => ({
      ...a,
      /* MatTable n'a qu'un seul corps : la ligne « Trésorerie » qui fermait le tableau devient
         une ligne de données à part, reconnue par `isCashRow` et rendue par son propre
         `matRowDef` — ce qui la laisse à sa place, dernière ligne du `tbody`. */
      tableRows: [...a.rows.map((r) => ({ kind: 'pos' as const, r })), { kind: 'cash' as const, r: null }],
    }));
  });

  protected readonly isCashRow = (_: number, row: { readonly kind: string }) => row.kind === 'cash';
  protected readonly accountRowTrackBy = (i: number, row: { readonly kind: string; readonly r: { readonly isin: string; readonly ticker: string } | null }) =>
    row.kind === 'cash' ? 'cash' : row.r!.isin + row.r!.ticker;

  protected readonly accountColumns = ['isin', 'ticker', 'name', 'lot', 'currency', 'quantity', 'pru', 'costValue', 'price', 'marketValue', 'unrealized', 'unrealizedPct', 'actions'];
  protected readonly accountCashColumns = ['cashLabel', 'cashBlank1', 'cashBlank2', 'cashBlank3', 'cashCurrency', 'cashSpan4', 'cashAmount', 'cashSpan2', 'cashActions'];
  protected readonly flatColumns = ['ticker', 'name', 'isin', 'account', 'lot', 'currency', 'quantity', 'pru', 'price', 'marketValue', 'unrealized', 'unrealizedPct', 'actions'];
  protected readonly pnlColumns = ['security', 'costBasis', 'valuation', 'unrealized', 'realized', 'income', 'yield'];

  protected readonly invFlat = computed(() => {
    interface FlatRow {
      readonly pfId: string;
      readonly ticker: string;
      readonly name: string;
      readonly isin: string;
      readonly account: string;
      readonly accountBroker: string;
      readonly accountName: string;
      readonly currency: string;
      readonly lot: string;
      readonly qty: string;
      readonly pru: string;
      readonly price: string;
      readonly marketValue: string;
      readonly pnl: string;
      readonly pnlPct: string;
      readonly pnlColor: string;
      readonly sortKey: number;
      readonly _lot: number;
      readonly _qty: number;
      readonly _pru: number;
      readonly _price: number;
      readonly _cost: number;
      readonly _mv: number;
      readonly _pnl: number;
      readonly _pnlPct: number;
    }
    const rows: FlatRow[] = [];
    PORTFOLIOS.forEach((pf) => {
      pf.positions.forEach((p) => {
        const buy = p.qty * p.pru;
        const mv = p.qty * p.price;
        const pnl = mv - buy;
        const parts = pf.label.split(' — ');
        rows.push({
          pfId: pf.id,
          ticker: p.ticker,
          name: p.name,
          isin: p.isin,
          account: pf.label,
          accountBroker: parts[0],
          accountName: parts[1] || '',
          currency: p.currency,
          lot: String(p.lot || 1),
          qty: fr4(p.qty),
          pru: fr2(p.pru),
          price: fr2(p.price),
          marketValue: fr2(mv) + ' ' + p.currency,
          pnl: fr2(pnl) + ' ' + p.currency,
          pnlPct: fr2(buy ? (pnl / buy) * 100 : 0) + ' %',
          pnlColor: pnlTone(pnl),
          sortKey: mv * (FXR[p.currency] || 1),
          _lot: p.lot || 1,
          _qty: p.qty,
          _pru: p.pru,
          _price: p.price,
          _cost: buy,
          _mv: mv,
          _pnl: pnl,
          _pnlPct: buy ? pnl / buy : 0,
        });
      });
    });
    const k = this.posSortKey();
    let done: readonly FlatRow[];
    if (!k) {
      done = rows.slice().sort((a, b) => b.sortKey - a.sortKey);
    } else {
      const dir = this.posSortDir() === 'desc' ? -1 : 1;
      const numOf: Record<string, keyof FlatRow> = { lot: '_lot', quantity: '_qty', pru: '_pru', price: '_price', costValue: '_cost', marketValue: '_mv', unrealized: '_pnl', unrealizedPct: '_pnlPct' };
      const txtOf: Record<string, keyof FlatRow> = { isin: 'isin', ticker: 'ticker', name: 'name', currency: 'currency', account: 'account' };
      const nk = numOf[k];
      const tk = txtOf[k];
      done = rows.slice().sort((a, b) => (nk ? ((a[nk] as number) - (b[nk] as number)) * dir : String(a[tk] ?? '').localeCompare(String(b[tk] ?? ''), 'fr') * dir));
    }
    return done.map((r, ri) => ({ ...r, zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)' }));
  });

  protected sortHeader(key: string) {
    return sortHeaderView(this.posSortKey(), this.posSortDir(), key);
  }

  protected onSort(key: string): void {
    const next = nextSort(this.posSortKey(), this.posSortDir(), key);
    this.posSortKey.set(next.key);
    this.posSortDir.set(next.dir);
  }

  protected openHistory(portfolioId: string, target: string): void {
    // Le panneau se glisse sous le bandeau bleu et le fil d'Ariane de la coque (.pm-topbar
    // 56px + .pm-context-bar 58px), plutôt que de les recouvrir — les deux restent visibles
    // et cliquables pendant que le panneau est ouvert.
    this.dialog.open<PositionHistoryDialog, HistoryDialogData>(PositionHistoryDialog, {
      data: { portfolioId, target },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  // -------------------------------------------------------------------------------------
  // Répartitions (POS, non filtré — voir le commentaire de classe)
  // -------------------------------------------------------------------------------------

  private group(key: 'cls' | 'region' | 'currency' | 'account', title: string, note: string) {
    const list = POS;
    const total = list.reduce((n, p) => n + value(p), 0) || 1;
    const acc: Record<string, number> = {};
    list.forEach((p) => {
      acc[p[key]] = (acc[p[key]] || 0) + value(p);
    });
    const rows = Object.keys(acc).sort((x, y) => acc[y] - acc[x]);
    const max = acc[rows[0]] || 1;
    return {
      title,
      note,
      stack: rows.map((k, i) => ({
        label: k,
        title: k + ' — ' + eur(acc[k]) + ' (' + fr((acc[k] / total) * 100, 1) + ' %)',
        share: fr((acc[k] / total) * 100, 1) + ' %',
        width: ((acc[k] / total) * 100).toFixed(2) + '%',
        color: PALETTE[i % PALETTE.length],
      })),
      rows: rows.map((k) => ({ label: k, value: eur(acc[k]), share: fr((acc[k] / total) * 100, 1) + ' %', width: ((acc[k] / max) * 100).toFixed(1) + '%' })),
    };
  }

  protected readonly breakdowns = [
    this.group('cls', "Par classe d'actifs", 'Valorisation et part du portefeuille'),
    this.group('region', 'Par zone géographique', 'Après conversion en euro'),
    this.group('currency', 'Par devise', 'Avant couverture de change'),
    this.group('account', 'Par compte', 'Répartition des encours'),
  ];

  // -------------------------------------------------------------------------------------
  // Résultat (POS, filtré par recherche)
  // -------------------------------------------------------------------------------------

  protected readonly pnlNote = 'Latent, réalisé et revenus depuis le 1er janvier 2026';

  protected readonly pnlRows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = POS.filter((p) => !q || (p.ticker + ' ' + p.name + ' ' + p.isin).toLowerCase().includes(q));
    const base = list.slice().sort((a, b) => value(b) - value(a));
    const k = this.posSortKey();
    const dir = this.posSortDir() === 'desc' ? -1 : 1;
    let sorted = base;
    if (k === 'security') {
      sorted = base.slice().sort((a, b) => a.ticker.localeCompare(b.ticker, 'fr') * dir);
    } else if (k) {
      const num = (p: Position): number => {
        const v = value(p);
        const c = bookCost(p);
        if (k === 'costBasis') return c;
        if (k === 'valuation') return v;
        if (k === 'unrealized') return v - c;
        if (k === 'realized') return p.realized;
        if (k === 'income') return p.income;
        if (k === 'yield') return (v - c + (p.realized + p.income) * 1000) / (c || 1);
        return 0;
      };
      sorted = base.slice().sort((a, b) => (num(a) - num(b)) * dir);
    }
    return sorted.map((p, ri) => {
      const v = value(p);
      const c = bookCost(p);
      const l = v - c;
      const inc = p.income * 1000;
      const rea = p.realized * 1000;
      return {
        zebra: ri % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
        ticker: p.ticker,
        name: p.name,
        cost: eur(c),
        value: eur(v),
        latent: eur(l),
        latentColor: l > 0 ? 'var(--ink-ok-2)' : l < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
        realized: eur(rea),
        realizedColor: rea > 0 ? 'var(--ink-ok-2)' : rea < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
        income: eur(inc),
        yield: pct(((l + rea + inc) / (c || 1)) * 100),
        yieldColor: l + rea + inc >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
      };
    });
  });

  protected setQuery(v: string): void {
    this.query.set(v);
  }

  // -------------------------------------------------------------------------------------
  // Synthèse (PORTFOLIOS, filtré par le scope du graphique)
  // -------------------------------------------------------------------------------------

  protected readonly dash = computed(() => {
    const scope = this.chartAccount();
    const list = PORTFOLIOS.filter((p) => scope === 'all' || p.id === scope);
    const flat: { pf: Portfolio; p: PortfolioPosition }[] = [];
    list.forEach((pf) => pf.positions.forEach((p) => flat.push({ pf, p })));
    const cost = flat.reduce((n, x) => n + fx(x.p.qty * x.p.pru, x.p.currency), 0);
    const mv = flat.reduce((n, x) => n + fx(x.p.qty * x.p.price, x.p.currency), 0);
    const day = flat.reduce((n, x) => n + x.p.day, 0);
    const realized = flat.reduce((n, x) => n + x.p.realized, 0);
    const unreal = mv - cost;
    const tone = (v: number) => (v > 0 ? 'var(--ink-ok-2)' : v < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)');

    const perLine = flat
      .map((x) => {
        const buy = x.p.qty * x.p.pru;
        const val = x.p.qty * x.p.price;
        return { ticker: x.p.ticker, pnl: val - buy, pct: buy ? ((val - buy) / buy) * 100 : 0, currency: x.p.currency };
      })
      .sort((a, b) => b.pnl - a.pnl);
    const maxAbs = Math.max(...perLine.map((r) => Math.abs(r.pnl)), 1);

    const divs: { d: Date; ticker: string; amount: number; currency: string; detail: string; state: string }[] = [];
    flat.forEach((x) =>
      (SEC_EVENTS[x.p.ticker] || []).forEach((e) => {
        if (e.label.toLowerCase().indexOf('dividende') < 0) return;
        const amt = parseFloat(String(e.impact).replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
        divs.push({ d: new Date(e.d), ticker: x.p.ticker, amount: amt, currency: x.p.currency, detail: e.detail, state: e.state });
      }),
    );
    const months: { d: Date; sum: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(2026, 8 - i, 1);
      const sum = divs.filter((v) => v.d.getFullYear() === d.getFullYear() && v.d.getMonth() === d.getMonth()).reduce((n, v) => n + fx(v.amount, v.currency), 0);
      months.push({ d, sum });
    }
    const maxM = Math.max(...months.map((m) => m.sum), 1);
    const divTotal = months.reduce((n, m) => n + m.sum, 0);

    const byKey = (fn: (x: { pf: Portfolio; p: PortfolioPosition }) => string) => {
      const acc: Record<string, number> = {};
      flat.forEach((x) => {
        const k = fn(x);
        acc[k] = (acc[k] || 0) + fx(x.p.qty * x.p.price, x.p.currency);
      });
      return Object.keys(acc)
        .sort((a, b) => acc[b] - acc[a])
        .map((k) => ({ label: k, value: acc[k] }));
    };
    const assets = byKey((x) => ((SECURITY_REF[x.p.ticker] || ({} as { kind?: string })).kind === 'Action ordinaire' ? 'Actions' : 'Autres titres'));
    const cash = list.reduce((n, pf) => n + pf.cash, 0);
    if (cash) assets.push({ label: 'Trésorerie', value: cash });
    const assetTotal = assets.reduce((n, a) => n + a.value, 0) || 1;
    const sectors = byKey((x) => (((SECURITY_REF[x.p.ticker] || ({} as { sector?: string })).sector || 'Non classé') as string).split(' — ')[0]);
    const sectorTotal = sectors.reduce((n, a) => n + a.value, 0) || 1;
    const maxSector = sectors.length ? sectors[0].value : 1;

    const trending = flat
      .map((x) => {
        const val = fx(x.p.qty * x.p.price, x.p.currency);
        return { ticker: x.p.ticker, name: SECURITY_REF[x.p.ticker]?.name || x.p.name, price: x.p.price, currency: x.p.currency, day: x.p.day, pct: val ? (x.p.day / val) * 100 : 0 };
      })
      .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

    const spark = (seedBase: number, up: boolean) => {
      let sd = seedBase * 613 + 17;
      const rn = () => {
        sd = (sd * 1103515245 + 12345) % 2147483648;
        return sd / 2147483648;
      };
      const pts: string[] = [];
      for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const v = 14 + (up ? -8 : 8) * t + (rn() - 0.5) * 6;
        pts.push(((i / 19) * 100).toFixed(1) + ' ' + Math.max(2, Math.min(26, v)).toFixed(1));
      }
      return 'M' + pts.join(' L');
    };

    return {
      gainNote: `${flat.length} ligne(s) · prix de revient ${n2(cost)} EUR`,
      gainKpis: [
        { label: 'Valeur de marché', value: n2(mv) + ' EUR', note: 'Positions hors trésorerie', color: 'var(--color-text)' },
        { label: 'P/L latent', value: sg(unreal), note: pc(cost ? (unreal / cost) * 100 : 0) + ' du prix de revient', color: tone(unreal) },
        { label: 'P/L réalisé', value: sg(realized), note: 'Cessions dénouées', color: tone(realized) },
        { label: 'Variation du jour', value: sg(day), note: pc(mv ? (day / mv) * 100 : 0), color: tone(day) },
      ],
      gainRows: perLine.map((r) => {
        const half = (Math.abs(r.pnl) / maxAbs) * 50;
        return { ticker: r.ticker, value: n2(r.pnl) + ' ' + r.currency, pct: pc(r.pct), color: tone(r.pnl), left: r.pnl >= 0 ? '50%' : (50 - half).toFixed(2) + '%', width: half.toFixed(2) + '%' };
      }),
      divNote: `${n2(divTotal)} EUR encaissés sur 12 mois`,
      divMonths: months.map((m) => ({
        label: MONTHS_FR[m.d.getMonth()].slice(0, 1).toUpperCase(),
        amount: m.sum ? String(Math.round(m.sum)) : '',
        title: `${MONTHS_FR[m.d.getMonth()]} ${m.d.getFullYear()} — ${n2(m.sum)} EUR`,
        height: Math.max(3, (m.sum / maxM) * 88).toFixed(0) + 'px',
        color: m.sum ? 'var(--ink-ok-2)' : 'var(--color-neutral-300)',
      })),
      divRows: divs
        .slice()
        .sort((a, b) => b.d.getTime() - a.d.getTime())
        .slice(0, 4)
        .map((v) => ({ ticker: v.ticker, detail: `${v.detail} · ${v.state}`, amount: '+' + n2(v.amount) + ' ' + v.currency })),
      assetNote: `${n2(assetTotal)} EUR au total`,
      assets: assets.map((a, i) => ({
        label: a.label,
        value: n2(a.value) + ' EUR',
        share: ((a.value / assetTotal) * 100).toFixed(1).replace('.', ',') + ' %',
        width: ((a.value / assetTotal) * 100).toFixed(2) + '%',
        title: `${a.label} — ${n2(a.value)} EUR`,
        color: PALETTE[i % PALETTE.length],
      })),
      sectorNote: `${sectors.length} secteur(s) représenté(s)`,
      sectors: sectors.map((a, i) => ({ label: a.label, share: ((a.value / sectorTotal) * 100).toFixed(1).replace('.', ',') + ' %', width: ((a.value / maxSector) * 100).toFixed(1) + '%', color: PALETTE[i % PALETTE.length] })),
      trendNote: 'Plus fortes variations du jour',
      trending: trending.map((t, i) => ({
        rank: String(i + 1),
        rankBg: i === 0 ? 'var(--ink-brand)' : 'rgba(0,61,165,0.14)',
        rankFg: i === 0 ? '#ffffff' : 'var(--ink-brand)',
        ticker: t.ticker,
        name: t.name,
        price: n2(t.price) + ' ' + t.currency,
        change: pc(t.pct),
        color: tone(t.day),
        spark: spark(t.ticker.length + i, t.day > 0),
      })),
    };
  });
}
