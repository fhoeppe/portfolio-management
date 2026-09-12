import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { nextSort, sortHeaderView } from '../positions/positions-sort';
import { ACCOUNT_OPEN, IndexMember, PORTFOLIO_LINKS, PositionStatusKey, REGIONS, SECURITIES, INDICES } from './titres-data';
import {
  CLASS_SELECT_GROUPS,
  CONSENSUS_SELECT_GROUPS,
  CURRENCY_SELECT_GROUPS,
  DIV_FREQ_SELECT_GROUPS,
  ESG_SELECT_GROUPS,
  LIQUIDITY_SELECT_GROUPS,
  MultiOption,
  OPEN_ACCOUNTS,
  PLACE_SELECT_GROUPS,
  RATING_SELECT_GROUPS,
  SearchState,
  SECTOR_SELECT_GROUPS,
  accountNote as accountNoteText,
  accountTriggerLabel,
  blankSearch,
  buildAccountOptions,
  buildCurrencyOptions,
  buildIndexGroups,
  buildPlaceOptions,
  buildResStatusOptions,
  buildSearchPool,
  buildStatusOptions,
  buildTickerOptions,
  buildWatchCurrencyOptions,
  buildWatchPlaceOptions,
  buildWatchTickerOptions,
  computeKpis,
  computeSearchRows,
  computeUniRows,
  computeWatchRows,
  computeWatchSource,
  groupUniRows,
  pickedAccountKeys,
  refreshIndex,
  sortUniRows,
} from './titres-filters';
import type { UniRow, UniRowGroup } from './titres-filters';
import { TiMultiSelect } from './ti-multiselect';
import { TiSelect } from './ti-select';
import { TiPreviewDialog, TiPreviewDialogData } from './ti-preview-dialog';
import { TiSecurityDialog, TiSecurityDialogData } from './ti-security-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'universe' | 'search';
type SortDir = 'asc' | 'desc';

/** Ligne du tableau de l'univers : soit un en-tête de section, soit un titre. */
type UniTableRow = { readonly kind: 'group'; readonly g: UniRowGroup } | { readonly kind: 'sec'; readonly r: UniRow };

function toggleInSet<T>(sig: WritableSignal<ReadonlySet<T>>, key: T): void {
  sig.update((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}

function toggleAllInSet<T>(sig: WritableSignal<ReadonlySet<T>>, all: readonly T[]): void {
  sig.update((s) => (all.length > 0 && all.every((v) => s.has(v)) ? new Set<T>() : new Set(all)));
}

/**
 * Porté depuis `Titres.dc.html` (`UniversePage`). Le prototype propose un 3ᵉ onglet
 * « Critères » (`isCriteria`/`onCriteria`/`goCriteria`) : aucun bouton ne le déclenche jamais
 * (`pageTabs` ne liste que `universe`/`search`), c'est du code mort, non repris ici — de même
 * qu'un pan entier de `render()` jamais lu par le template : liste de règles d'éligibilité
 * globales (`RULES`/`rules`), formulaire d'ajout manuel de titre (`formFieldsTop/Bottom`),
 * tableau des composants de l'indice sélectionné avec actions Proposer/Retirer par ligne
 * (`members`/`memberTabs`), et l'enrichissement CSV (`indices-composants.csv`, absent du
 * dépôt — le fetch échoue toujours en pratique). Voir `titres-filters.ts` pour le détail des
 * fonctions pures portées.
 *
 * Les listes de filtres à sélection multiple (menus `data-mat-select[aria-multiselectable]`
 * positionnés à la main) redeviennent de vrais `MatMenu` via `TiMultiSelect`/`TiSelect`, comme
 * `TxMultiSelect`/`TxSelect` de Transactions. La modale d'aperçu d'indice perd son
 * glisser-déposer manuel (`startDrag`) au profit d'un `MatDialog` standard.
 */
@Component({
  selector: 'app-titres',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatCheckboxModule, MatSlideToggleModule, MatTableModule, MatTooltipModule, TiMultiSelect, TiSelect],
  templateUrl: './titres.html',
  styleUrl: './titres.css',
})
export class Titres {
  private readonly dialog = inject(MatDialog);

  // -- Onglets ----------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('universe');
  protected readonly pageTabs: readonly { readonly key: Tab; readonly label: string }[] = [
    { key: 'universe', label: "Univers d'investissement" },
    { key: 'search', label: 'Recherche de titres' },
  ];
  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected readonly subtitle = "Univers autorisé à l'achat · " + SECURITIES.length + ' titres référencés · dernière revue du comité le 18/07/2026';

  // -- État partagé -------------------------------------------------------------------------
  protected readonly decisions = signal<ReadonlyMap<string, 'ok' | 'none'>>(new Map());
  protected readonly selected = signal('GLBEQ');
  protected readonly status = signal('');
  protected readonly deleted = signal<ReadonlySet<string>>(new Set());
  protected readonly deleteNote = signal('');

  protected readonly kpis = computed(() => computeKpis(this.decisions()));

  protected decide(ticker: string, next: 'ok' | 'none', label: string): void {
    this.decisions.update((m) => {
      const n = new Map(m);
      n.set(ticker, next);
      return n;
    });
    this.status.set(ticker + ' — ' + label);
  }

  protected deleteSecurity(ticker: string): void {
    const s = SECURITIES.find((x) => x.ticker === ticker);
    const link = PORTFOLIO_LINKS[ticker];
    if (!s || link?.held || link?.history) return;
    this.deleted.update((d) => new Set(d).add(ticker));
    this.deleteNote.set(ticker + ' — ' + s.name + ' supprimé des titres négociables.');
  }

  protected openSecurity(ticker: string): void {
    const security = SECURITIES.find((s) => s.ticker === ticker);
    if (!security) return;
    this.selected.set(ticker);
    this.status.set('');
    this.dialog.open<TiSecurityDialog, TiSecurityDialogData>(TiSecurityDialog, {
      data: {
        security,
        decisions: this.decisions,
        status: this.status,
        onAuthorize: (t) => this.decide(t, 'ok', "retenu dans l'univers."),
      },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  // -----------------------------------------------------------------------------------------
  // Univers — Titres négociables
  // -----------------------------------------------------------------------------------------
  protected readonly query = signal('');
  protected readonly filter = signal<'all' | 'ok'>('all');
  protected readonly acctPick = signal<ReadonlySet<string> | null>(null);
  protected readonly groupByStatus = signal(false);
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<SortDir>('asc');
  protected readonly colIsin = signal('');
  protected readonly colName = signal('');
  protected readonly tickPick = signal<ReadonlySet<string>>(new Set());
  protected readonly placePick = signal<ReadonlySet<string>>(new Set());
  protected readonly curPick = signal<ReadonlySet<string>>(new Set());
  protected readonly statPick = signal<ReadonlySet<string>>(new Set());

  protected readonly acctKeys = computed(() => pickedAccountKeys(this.acctPick()));
  protected readonly acctKeysSet = computed(() => new Set(this.acctKeys()));
  protected readonly accountOptions: readonly MultiOption[] = buildAccountOptions();
  protected readonly accountTrigger = computed(() => accountTriggerLabel(this.acctPick()));
  protected readonly accountAllOn = computed(() => OPEN_ACCOUNTS.every((v) => this.acctKeys().indexOf(v) >= 0));
  protected readonly accountNote = computed(() => accountNoteText(this.acctKeys().length));

  protected readonly tickerOptions = computed(() => buildTickerOptions(this.deleted()));
  protected readonly placeOptions = computed(() => buildPlaceOptions(this.deleted()));
  protected readonly currencyOptions = computed(() => buildCurrencyOptions(this.deleted()));
  protected readonly statusOptions = computed(() => buildStatusOptions(this.deleted(), this.decisions()));

  protected readonly uniRowsRaw = computed(() =>
    computeUniRows({
      decisions: this.decisions(),
      deleted: this.deleted(),
      query: this.query(),
      filter: this.filter(),
      acctKeys: this.acctKeys(),
      colIsin: this.colIsin(),
      colName: this.colName(),
      tickKeys: this.tickPick(),
      placeKeys: this.placePick(),
      curKeys: this.curPick(),
      statKeys: this.statPick(),
    }),
  );
  protected readonly uniRowsSorted = computed(() => sortUniRows(this.uniRowsRaw(), this.sortKey(), this.sortDir()));
  protected readonly uniGroups = computed(() => groupUniRows(this.uniRowsSorted(), this.groupByStatus()));
  /**
   * MatTable n'a qu'un seul corps de tableau : les sections de `uniGroups()` sont aplaties en
   * une seule liste où l'en-tête de section devient une ligne à part entière, reconnue par
   * `isGroupRow` et rendue par son propre `matRowDef`.
   */
  protected readonly uniTableRows = computed<readonly UniTableRow[]>(() =>
    this.uniGroups().flatMap((g) => [
      ...(g.hasHeader ? [{ kind: 'group' as const, g }] : []),
      ...g.rows.map((r) => ({ kind: 'sec' as const, r })),
    ]),
  );
  protected readonly isGroupRow = (_: number, row: UniTableRow) => row.kind === 'group';
  protected readonly uniTrackBy = (_: number, row: UniTableRow) => (row.kind === 'group' ? 'g:' + row.g.label : 's:' + row.r.ticker);

  protected readonly uniColumns = ['isin', 'ticker', 'name', 'place', 'currency', 'status', 'actions'];
  protected readonly uniFilterColumns = ['isinFilter', 'tickerFilter', 'nameFilter', 'placeFilter', 'currencyFilter', 'statusFilter', 'actionsFilter'];
  protected readonly uniGroupColumns = ['uniGroupHead'];
  protected readonly resColumns = ['select', 'security', 'cls', 'currency', 'rating', 'liquidity', 'status', 'actions'];
  protected readonly resFilterColumns = ['selectFilter', 'securityFilter', 'clsFilter', 'currencyFilter', 'ratingFilter', 'liquidityFilter', 'statusFilter', 'actionsFilter'];

  protected readonly listNote = computed(() => this.uniRowsRaw().length + ' / ' + SECURITIES.length + ' titres');
  protected readonly noRows = computed(() => this.uniRowsRaw().length === 0);
  protected readonly listNoteMargin = computed(() => (this.deleteNote() ? '12px' : 'auto'));

  protected readonly UNI_SORT_COLS = ['isin', 'ticker', 'name', 'place', 'currency', 'status'] as const;
  protected uniSortHeader(key: string) {
    return sortHeaderView(this.sortKey(), this.sortDir(), key);
  }
  protected onUniSort(key: string): void {
    const next = nextSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.key);
    this.sortDir.set(next.dir);
  }

  protected toggleAccount(value: string): void {
    if (!ACCOUNT_OPEN[value]) return;
    const set = new Set(this.acctKeys());
    if (set.has(value)) set.delete(value);
    else set.add(value);
    this.acctPick.set(set);
  }
  protected toggleAllAccounts(): void {
    const full = OPEN_ACCOUNTS.every((v) => this.acctKeys().indexOf(v) >= 0);
    this.acctPick.set(full ? new Set() : new Set(OPEN_ACCOUNTS));
  }

  protected toggleGrouping(): void {
    this.groupByStatus.update((v) => !v);
  }

  protected readonly statusTabsLabel: readonly { readonly key: 'all' | 'ok'; readonly label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'ok', label: 'Retenus' },
  ];
  protected setFilter(f: 'all' | 'ok'): void {
    this.filter.set(f);
  }

  protected resetUniverseView(): void {
    this.sortKey.set(null);
    this.sortDir.set('asc');
    this.groupByStatus.set(false);
    this.acctPick.set(null);
    this.colIsin.set('');
    this.colName.set('');
    this.tickPick.set(new Set());
    this.watchColIsin.set('');
    this.watchColName.set('');
    this.watchTickPick.set(new Set());
    this.watchSortKey.set(null);
    this.watchSortDir.set('asc');
    this.deleteNote.set('');
    this.filter.set('all');
    this.query.set('');
  }

  // -----------------------------------------------------------------------------------------
  // Univers — Titres suivis (watchlist)
  // -----------------------------------------------------------------------------------------
  protected readonly watchColIsin = signal('');
  protected readonly watchColName = signal('');
  protected readonly watchTickPick = signal<ReadonlySet<string>>(new Set());
  protected readonly watchPlacePick = signal<ReadonlySet<string>>(new Set());
  protected readonly watchCurPick = signal<ReadonlySet<string>>(new Set());
  protected readonly watchSortKey = signal<string | null>(null);
  protected readonly watchSortDir = signal<SortDir>('asc');

  protected readonly watchTickerOptions: readonly MultiOption[] = buildWatchTickerOptions();
  protected readonly watchPlaceOptions: readonly MultiOption[] = buildWatchPlaceOptions();
  protected readonly watchCurrencyOptions: readonly MultiOption[] = buildWatchCurrencyOptions();

  protected readonly watchSource = computed(() => computeWatchSource(this.decisions()));
  protected readonly watchRows = computed(() =>
    computeWatchRows(this.watchSource(), {
      colIsin: this.watchColIsin(),
      colName: this.watchColName(),
      tickKeys: this.watchTickPick(),
      placeKeys: this.watchPlacePick(),
      curKeys: this.watchCurPick(),
      sortKey: this.watchSortKey(),
      sortDir: this.watchSortDir(),
    }),
  );
  protected readonly noWatchRows = computed(() => this.watchRows().length === 0);
  protected readonly watchNote = computed(() => {
    const n = this.watchSource().filter((r) => r.posKey === 'followed').length;
    return n + (n > 1 ? ' titres suivis' : ' titre suivi');
  });

  protected watchSortHeader(key: string) {
    return sortHeaderView(this.watchSortKey(), this.watchSortDir(), key);
  }
  protected onWatchSort(key: string): void {
    const next = nextSort(this.watchSortKey(), this.watchSortDir(), key);
    this.watchSortKey.set(next.key);
    this.watchSortDir.set(next.dir);
  }

  protected resetWatchView(): void {
    this.watchColIsin.set('');
    this.watchColName.set('');
    this.watchTickPick.set(new Set());
    this.watchSortKey.set(null);
    this.watchSortDir.set('asc');
    this.watchPlacePick.set(new Set());
    this.watchCurPick.set(new Set());
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Indices de référence »
  // -----------------------------------------------------------------------------------------
  protected readonly index = signal('cac40');
  protected readonly refs = signal<ReadonlyMap<string, 'ok' | 'none'>>(new Map());
  protected readonly indexMembers = signal<Readonly<Record<string, readonly IndexMember[]>>>({});
  protected readonly lastUpdate = signal('31/08/2026, 18:05');
  protected readonly indexAction = signal('');
  protected readonly panels = signal<{ readonly index: boolean; readonly crit: boolean; readonly res: boolean }>({ index: true, crit: true, res: true });

  protected readonly indexNote = INDICES.length + ' indices suivis sur ' + REGIONS.length + ' zones géographiques';
  protected readonly selectedIndex = computed(() => INDICES.find((i) => i.key === this.index()) ?? INDICES[0]);
  protected readonly indexMembersCurrent = computed(() => this.indexMembers()[this.selectedIndex().key] || this.selectedIndex().members);
  protected readonly indexGroups = computed(() => buildIndexGroups(this.indexMembers(), this.refs(), this.decisions()));
  protected readonly refreshLabel = computed(() => this.indexMembersCurrent().length + ' / ' + this.selectedIndex().count + ' composants — rafraîchir');

  protected togglePanel(key: 'index' | 'crit' | 'res'): void {
    this.panels.update((p) => ({ ...p, [key]: !p[key] }));
  }

  protected setIndex(key: string): void {
    this.index.set(key);
    this.indexAction.set('');
  }

  protected refreshIndexAction(): void {
    const idx = this.selectedIndex();
    const result = refreshIndex(idx, this.indexMembersCurrent());
    this.indexMembers.update((m) => ({ ...m, [idx.key]: result.members }));
    this.lastUpdate.set(result.lastUpdate);
    this.indexAction.set(result.indexAction);
  }

  protected openPreview(): void {
    this.dialog.open<TiPreviewDialog, TiPreviewDialogData>(TiPreviewDialog, {
      data: { idx: this.selectedIndex(), indexMembers: this.indexMembers, refs: this.refs, decisions: this.decisions },
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: false,
    });
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Critères de recherche »
  // -----------------------------------------------------------------------------------------
  protected readonly search = signal<SearchState>(blankSearch());
  protected readonly classGroups = CLASS_SELECT_GROUPS;
  protected readonly currencyGroups = CURRENCY_SELECT_GROUPS;
  protected readonly liquidityGroups = LIQUIDITY_SELECT_GROUPS;
  protected readonly ratingGroups = RATING_SELECT_GROUPS;
  protected readonly esgGroups = ESG_SELECT_GROUPS;
  protected readonly consensusGroups = CONSENSUS_SELECT_GROUPS;
  protected readonly divFreqGroups = DIV_FREQ_SELECT_GROUPS;
  protected readonly sectorGroups = SECTOR_SELECT_GROUPS;
  protected readonly placeGroups = PLACE_SELECT_GROUPS;

  protected readonly activeCriteria = computed(() => {
    const sr = this.search();
    const n = (['cls', 'currency', 'liquidity', 'rating', 'esg', 'consensus', 'divFreq', 'sector', 'place'] as const).filter((k) => sr[k] !== 'all').length;
    return n + (sr.q.trim() ? 1 : 0) + (sr.eps.trim() ? 1 : 0);
  });
  protected readonly searchNote = computed(() => this.activeCriteria() + ' critère(s) actif(s)');
  protected readonly searchSummary = computed(() =>
    this.activeCriteria() ? 'Les critères se cumulent : seuls les titres satisfaisant l\'ensemble sont retenus.' : 'Aucun critère : la liste complète des titres référencés est affichée.',
  );

  protected patchSearch(patch: Partial<SearchState>): void {
    this.search.update((s) => ({ ...s, ...patch }));
  }

  protected resetSearch(): void {
    this.search.set(blankSearch());
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Résultats »
  // -----------------------------------------------------------------------------------------
  protected readonly resColName = signal('');
  protected readonly resColCls = signal('');
  protected readonly resColCurrency = signal('');
  protected readonly resColRating = signal('');
  protected readonly resColLiquidity = signal('');
  protected readonly resStatusPick = signal<ReadonlySet<PositionStatusKey>>(new Set());
  protected readonly resSortKey = signal<string | null>(null);
  protected readonly resSortDir = signal<SortDir>('asc');
  protected readonly resSource = signal<'criteria' | 'index'>('criteria');
  protected readonly picked = signal<ReadonlySet<string>>(new Set());
  protected readonly pickStatus = signal('');
  protected readonly pickStatusColor = signal('var(--ink-ok-2)');

  protected readonly resSources: readonly { readonly key: 'criteria' | 'index'; readonly label: string }[] = [
    { key: 'criteria', label: 'Selon les critères' },
    { key: 'index', label: "Selon l'indice retenu" },
  ];

  protected readonly searchPool = computed(() => buildSearchPool(this.resSource() === 'index', this.selectedIndex(), this.indexMembers()));
  protected readonly resStatusOptions = computed(() => buildResStatusOptions(this.searchPool(), this.decisions()));

  protected readonly searchRows = computed(() =>
    computeSearchRows({
      pool: this.searchPool(),
      fromIndex: this.resSource() === 'index',
      search: this.search(),
      resCol: { name: this.resColName(), cls: this.resColCls(), currency: this.resColCurrency(), rating: this.resColRating(), liquidity: this.resColLiquidity() },
      resStatusKeys: this.resStatusPick(),
      decisions: this.decisions(),
      picked: this.picked(),
      sortKey: this.resSortKey(),
      sortDir: this.resSortDir(),
    }),
  );
  protected readonly searchCount = computed(() => this.searchRows().length + ' / ' + SECURITIES.length + ' titres');
  protected readonly noSearchRows = computed(() => this.searchRows().length === 0);
  protected readonly allPicked = computed(() => this.searchRows().length > 0 && this.searchRows().every((r) => this.picked().has(r.ticker)));
  protected readonly noPick = computed(() => this.picked().size === 0);
  protected readonly pickNote = computed(() => {
    const n = this.picked().size;
    return n ? n + (n > 1 ? ' titres sélectionnés' : ' titre sélectionné') : 'Sélectionnez des titres pour les verser dans l\'univers';
  });

  protected resSortHeader(key: string) {
    return sortHeaderView(this.resSortKey(), this.resSortDir(), key);
  }
  protected onResSort(key: string): void {
    const next = nextSort(this.resSortKey(), this.resSortDir(), key);
    this.resSortKey.set(next.key);
    this.resSortDir.set(next.dir);
  }

  protected setResSource(key: 'criteria' | 'index'): void {
    this.resSource.set(key);
    this.picked.set(new Set());
    this.pickStatus.set('');
  }

  protected togglePicked(ticker: string): void {
    toggleInSet(this.picked, ticker);
    this.pickStatus.set('');
  }

  protected togglePickAll(): void {
    const rows = this.searchRows();
    const all = rows.length > 0 && rows.every((r) => this.picked().has(r.ticker));
    this.picked.update((p) => {
      const next = new Set(p);
      rows.forEach((r) => (all ? next.delete(r.ticker) : next.add(r.ticker)));
      return next;
    });
    this.pickStatus.set('');
  }

  protected addPickedOk(): void {
    const keys = Array.from(this.picked());
    if (!keys.length) {
      this.pickStatus.set('Aucun titre sélectionné.');
      this.pickStatusColor.set('var(--ink-warn-2)');
      return;
    }
    this.decisions.update((m) => {
      const next = new Map(m);
      keys.forEach((k) => next.set(k, 'ok'));
      return next;
    });
    this.picked.set(new Set());
    this.pickStatus.set(keys.length + " titre(s) ajouté(s) à l'univers.");
    this.pickStatusColor.set('var(--ink-ok-2)');
  }

  protected resetPicked(): void {
    this.picked.set(new Set());
    this.decisions.set(new Map());
    this.search.set(blankSearch());
    this.resColName.set('');
    this.resColCls.set('');
    this.resColCurrency.set('');
    this.resColRating.set('');
    this.resColLiquidity.set('');
    this.resStatusPick.set(new Set());
    this.resSortKey.set(null);
    this.resSortDir.set('asc');
    this.pickStatus.set('Sélection, critères et décisions de session réinitialisés.');
    this.pickStatusColor.set('var(--ink-ok-2)');
  }

  // -----------------------------------------------------------------------------------------
  // Sélections multiples génériques (colonne Ticker/Place/Devise/Statut, univers + suivis + résultats)
  // -----------------------------------------------------------------------------------------
  protected toggleTick(key: string): void {
    toggleInSet(this.tickPick, key);
  }
  protected toggleAllTick(): void {
    toggleAllInSet(this.tickPick, this.tickerOptions().map((o) => o.key));
  }
  protected togglePlace(key: string): void {
    toggleInSet(this.placePick, key);
  }
  protected toggleAllPlace(): void {
    toggleAllInSet(this.placePick, this.placeOptions().map((o) => o.key));
  }
  protected toggleCur(key: string): void {
    toggleInSet(this.curPick, key);
  }
  protected toggleAllCur(): void {
    toggleAllInSet(this.curPick, this.currencyOptions().map((o) => o.key));
  }
  protected toggleStat(key: string): void {
    toggleInSet(this.statPick, key);
  }
  protected toggleAllStat(): void {
    toggleAllInSet(this.statPick, this.statusOptions().map((o) => o.key));
  }

  protected toggleWatchTick(key: string): void {
    toggleInSet(this.watchTickPick, key);
  }
  protected toggleAllWatchTick(): void {
    toggleAllInSet(this.watchTickPick, this.watchTickerOptions.map((o) => o.key));
  }
  protected toggleWatchPlace(key: string): void {
    toggleInSet(this.watchPlacePick, key);
  }
  protected toggleAllWatchPlace(): void {
    toggleAllInSet(this.watchPlacePick, this.watchPlaceOptions.map((o) => o.key));
  }
  protected toggleWatchCur(key: string): void {
    toggleInSet(this.watchCurPick, key);
  }
  protected toggleAllWatchCur(): void {
    toggleAllInSet(this.watchCurPick, this.watchCurrencyOptions.map((o) => o.key));
  }

  protected toggleResStatus(key: string): void {
    toggleInSet(this.resStatusPick, key as PositionStatusKey);
  }
  protected toggleAllResStatus(): void {
    toggleAllInSet(this.resStatusPick, this.resStatusOptions().map((o) => o.key as PositionStatusKey));
  }
}
