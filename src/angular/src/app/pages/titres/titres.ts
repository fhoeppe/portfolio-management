import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ViewStateService } from '../../shell/view-state.service';
import { IndexCompositionService } from '../../domain/index-composition.service';
import { IndexFeedService } from '../../domain/index-feed.service';
import { SecurityUniverseStore } from '../../domain/security-universe.store';

import { nextSort, sortHeaderView } from '../positions/positions-sort';
import { ACCOUNT_OPEN, PORTFOLIO_LINKS, PositionStatusKey, REGIONS, SECURITIES, INDICES } from './titres-data';
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
  defaultSearch,
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
  /* Le routeur détruit la page à chaque navigation : onglet, filtres, tris, ligne consultée et
     titres cochés sont empruntés au service plutôt que déclarés ici, sans quoi une sélection
     patiemment montée dans l'écran de recherche serait perdue en allant vérifier une position.
     Les messages d'état (`status`, `deleteNote`, `pickStatus`…) restent locaux : ils commentent
     un geste qui vient d'avoir lieu, les rappeler au retour n'aurait aucun sens. */
  private readonly viewState = inject(ViewStateService);
  /* Le panneau des indices ne dérive plus lui-même l'identité de la place ni le rattachement des
     composants à l'univers : `IndexCompositionService` rapproche les trois référentiels — membres,
     registre ISO 10383, pays — et rend une fiche complète. L'écran n'a qu'à la lire. */
  private readonly indexService = inject(IndexCompositionService);
  /* Le chargeur n'est lu que pour sa provenance : la composition, elle, arrive par le référentiel,
     que le service remplace au démarrage. L'écran n'a rien à déclencher — il dit seulement d'où
     vient ce qu'il affiche, ce qu'une composition d'indice non datée ne permet pas de vérifier. */
  private readonly indexFeed = inject(IndexFeedService);
  /* Les titres négociables et suivis ont leur service : il porte les décisions du comité, les
     suppressions et les règles qui vont avec. L'écran n'en garde que l'affichage. */
  private readonly universe = inject(SecurityUniverseStore);

  // -- Onglets ----------------------------------------------------------------------------
  protected readonly tab = this.viewState.remember<Tab>('titres.tab', 'universe');
  protected readonly pageTabs: readonly { readonly key: Tab; readonly label: string }[] = [
    { key: 'universe', label: "Univers d'investissement" },
    { key: 'search', label: 'Recherche de titres' },
  ];
  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  /* Signal et non chaîne figée : le décompte était calculé une fois à la construction de l'écran et
     restait à quinze après une suppression. */
  protected readonly subtitle = computed(
    () => "Univers autorisé à l'achat · " + this.universe.counts().referenced + ' titres référencés · dernière revue du comité le 18/07/2026',
  );

  // -- État partagé -------------------------------------------------------------------------
  /* Décisions et suppressions ne sont plus des signaux d'écran : ils appartiennent au service,
     qui survit à la navigation par nature — un service racine n'est pas détruit avec la page. */
  protected readonly decisions = this.universe.decisionMap;
  protected readonly selected = this.viewState.remember('titres.selected', 'GLBEQ');
  protected readonly status = signal('');
  protected readonly deleted = this.universe.deletedSet;
  protected readonly deleteNote = signal('');

  /* Les décomptes viennent du service ; l'écran n'en fait que la mise en forme. */
  protected readonly kpis = computed(() => computeKpis(this.universe.counts()));

  protected decide(ticker: string, next: 'ok' | 'none', label: string): void {
    this.universe.decide(ticker, next);
    this.status.set(ticker + ' — ' + label);
  }

  protected deleteSecurity(ticker: string): void {
    const s = this.universe.find(ticker);
    /* Le refus vient du service : la vue désactive bien le bouton, mais ce n'est pas elle qui
       décide si un titre est supprimable. */
    if (!s || !this.universe.remove(ticker)) return;
    this.deleteNote.set(ticker + ' — ' + s.name + ' supprimé des titres négociables.');
  }

  protected openSecurity(ticker: string): void {
    const security = this.universe.find(ticker);
    if (!security) return;
    this.selected.set(ticker);
    this.status.set('');
    this.dialog.open<TiSecurityDialog, TiSecurityDialogData>(TiSecurityDialog, {
      data: {
        security,
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
  /**
   * Les deux tableaux de l'univers partent vides.
   *
   * Sans filtre ni recherche, ils déversaient le référentiel entier — ce qui n'est pas un résultat,
   * c'est l'absence de question. On pose un critère, ils répondent ; on réinitialise la carte, ils
   * se taisent de nouveau. Un état par carte : réinitialiser les négociables ne vide pas les suivis.
   */
  protected readonly uniShown = this.viewState.remember('titres.uniShown', false);

  /**
   * Filtres de colonnes et recherche libre des deux cartes.
   *
   * Ils passent par ici plutôt que d'écrire dans leur signal depuis le gabarit : sur une carte
   * vide, saisir un filtre doit la réveiller, sans quoi le champ répondrait à un tableau qu'on ne
   * rend pas.
   */
  protected setUniFilter(key: 'query' | 'colIsin' | 'colName', value: string): void {
    ({ query: this.query, colIsin: this.colIsin, colName: this.colName })[key].set(value);
    this.uniShown.set(true);
  }

  protected setWatchFilter(key: 'watchColIsin' | 'watchColName', value: string): void {
    ({ watchColIsin: this.watchColIsin, watchColName: this.watchColName })[key].set(value);
    this.watchShown.set(true);
  }
  protected readonly watchShown = this.viewState.remember('titres.watchShown', false);

  protected readonly query = this.viewState.remember('titres.query', '');
  protected readonly filter = this.viewState.remember<'all' | 'ok'>('titres.filter', 'all');
  protected readonly acctPick = this.viewState.remember<ReadonlySet<string> | null>('titres.acctPick', null);
  protected readonly groupByStatus = this.viewState.remember('titres.groupByStatus', false);
  protected readonly sortKey = this.viewState.remember<string | null>('titres.sortKey', null);
  protected readonly sortDir = this.viewState.remember<SortDir>('titres.sortDir', 'asc');
  protected readonly colIsin = this.viewState.remember('titres.colIsin', '');
  protected readonly colName = this.viewState.remember('titres.colName', '');
  protected readonly tickPick = this.viewState.remember<ReadonlySet<string>>('titres.tickPick', new Set());
  protected readonly placePick = this.viewState.remember<ReadonlySet<string>>('titres.placePick', new Set());
  protected readonly curPick = this.viewState.remember<ReadonlySet<string>>('titres.curPick', new Set());
  protected readonly statPick = this.viewState.remember<ReadonlySet<string>>('titres.statPick', new Set());

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

  /** Ce que le tableau rend : rien tant qu'aucun filtre n'a été posé. */
  protected readonly uniShownRows = computed<readonly UniTableRow[]>(() => (this.uniShown() ? this.uniTableRows() : []));
  protected readonly noRows = computed(() => this.uniShownRows().length === 0);
  protected readonly uniEmptyNote = computed(() =>
    this.uniShown() ? 'Aucun titre ne correspond aux filtres.' : 'Posez un filtre ou une recherche pour afficher les titres négociables.',
  );
  protected readonly listNote = computed(() =>
    this.uniShown() ? this.uniRowsRaw().length + ' / ' + this.universe.counts().referenced + ' titres' : 'Aucun filtre posé',
  );
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
    this.uniShown.set(true);
    if (!ACCOUNT_OPEN[value]) return;
    const set = new Set(this.acctKeys());
    if (set.has(value)) set.delete(value);
    else set.add(value);
    this.acctPick.set(set);
  }
  protected toggleAllAccounts(): void {
    this.uniShown.set(true);
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
    this.uniShown.set(true);
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
    /* On repart de zéro : la carte se tait jusqu'au prochain filtre. */
    this.uniShown.set(false);
    this.watchShown.set(false);
  }

  // -----------------------------------------------------------------------------------------
  // Univers — Titres suivis (watchlist)
  // -----------------------------------------------------------------------------------------
  protected readonly watchColIsin = this.viewState.remember('titres.watchColIsin', '');
  protected readonly watchColName = this.viewState.remember('titres.watchColName', '');
  protected readonly watchTickPick = this.viewState.remember<ReadonlySet<string>>('titres.watchTickPick', new Set());
  protected readonly watchPlacePick = this.viewState.remember<ReadonlySet<string>>('titres.watchPlacePick', new Set());
  protected readonly watchCurPick = this.viewState.remember<ReadonlySet<string>>('titres.watchCurPick', new Set());
  protected readonly watchSortKey = this.viewState.remember<string | null>('titres.watchSortKey', null);
  protected readonly watchSortDir = this.viewState.remember<SortDir>('titres.watchSortDir', 'asc');

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
  protected readonly watchShownRows = computed(() => (this.watchShown() ? this.watchRows() : []));
  protected readonly noWatchRows = computed(() => this.watchShownRows().length === 0);
  protected readonly watchEmptyNote = computed(() =>
    this.watchShown() ? 'Aucun titre uniquement suivi.' : 'Posez un filtre pour afficher les titres suivis.',
  );
  protected readonly watchNote = computed(() => {
    /* Tant que la carte n'a rien à montrer, elle ne prétend pas compter : annoncer « 4 titres
       suivis » au-dessus d'un tableau vide serait se contredire à une ligne d'intervalle. */
    if (!this.watchShown()) return 'Aucun filtre posé';
    const n = this.watchShownRows().filter((r) => r.posKey === 'followed').length;
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
    this.watchShown.set(false);
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Indices de référence »
  // -----------------------------------------------------------------------------------------
  protected readonly index = this.viewState.remember('titres.index', 'cac40');
  protected readonly refs = this.viewState.remember<ReadonlyMap<string, 'ok' | 'none'>>('titres.refs', new Map());
  /**
   * D'où vient la composition affichée. La ligne portait une date en dur — « 31/08/2026, 18:05 » —
   * qui ne correspondait à rien ; maintenant qu'une source répond, elle dit ce qu'elle sait :
   * provenance déclarée, date d'arrêté, volume livré, ou le repli embarqué le cas échéant.
   */
  protected readonly indexOrigin = computed(() => this.indexFeed.origin());
  /* Indices et critères repliés à l'ouverture : ce sont des panneaux de saisie, on les déplie quand
     on a une question à poser. Seuls les résultats sont dépliés d'emblée — c'est ce qu'on vient
     lire. L'état reste mémorisé pour la session : un panneau ouvert le reste d'un écran à l'autre. */
  protected readonly panels = this.viewState.remember<{ readonly index: boolean; readonly crit: boolean; readonly res: boolean }>('titres.panels', { index: false, crit: false, res: true });

  protected readonly indexNote = INDICES.length + ' indices suivis sur ' + REGIONS.length + ' zones géographiques';
  protected readonly selectedIndex = computed(() => INDICES.find((i) => i.key === this.index()) ?? INDICES[0]);
  protected readonly indexMembersCurrent = computed(() => this.selectedIndex().members);
  protected readonly indexGroups = computed(() => buildIndexGroups(this.refs(), this.decisions()));

  /* Composée sur la liste courante et non sur celle du référentiel : un rechargement de l'indice
     doit se voir dans la couverture comme dans le rattachement. */
  protected readonly indexComposition = computed(() =>
    this.indexService.withMembers(this.selectedIndex().key, this.indexMembersCurrent()),
  );

  /** Place et devise de cotation — « plusieurs places » quand l'indice en couvre plusieurs. */
  protected readonly indexIdentity = computed(() => {
    const c = this.indexComposition();
    if (!c) return '';
    const venue = c.mic ? `${c.mic} · ${c.place}` : `Plusieurs places · ${c.place}`;
    return `${venue} · ${c.currency}`;
  });

  /** Ce que le référentiel détaille vraiment, en composants et en poids. */
  protected readonly indexCoverage = computed(() => {
    const c = this.indexComposition();
    if (!c) return '';
    const weight = c.detailedWeight.toFixed(1).replace('.', ',');
    return `${c.detailedCount} / ${c.declaredCount} composants · ${weight} % du poids`;
  });

  /**
   * Croisement avec l'univers d'investissement, compté par le service. La part de poids compte plus
   * que le nombre : connaître deux valeurs sur dix ne dit rien, savoir qu'elles pèsent 13 % de
   * l'indice dit tout.
   */
  protected readonly indexUniverse = computed(() => {
    const c = this.universeCoverage();
    if (!c.known) return 'Aucun composant à l’univers';
    const weight = c.knownWeight.toFixed(1).replace('.', ',');
    const parts = [`${c.known} à l’univers · ${weight} % du poids`];
    if (c.retained) parts.push(`${c.retained} retenu${c.retained > 1 ? 's' : ''}`);
    if (c.held) parts.push(`${c.held} détenu${c.held > 1 ? 's' : ''}`);
    return parts.join(' · ');
  });

  private readonly universeCoverage = computed(() => this.indexService.universeCoverage(this.selectedIndex().key));

  protected togglePanel(key: 'index' | 'crit' | 'res'): void {
    this.panels.update((p) => ({ ...p, [key]: !p[key] }));
  }

  protected setIndex(key: string): void {
    this.index.set(key);
    /* Changer d'indice relance la recherche du panneau qui s'en nourrit. */
    this.shownBySource.update((p) => ({ ...p, index: true }));
  }

  protected openPreview(): void {
    this.dialog.open<TiPreviewDialog, TiPreviewDialogData>(TiPreviewDialog, {
      data: { idx: this.selectedIndex(), refs: this.refs },
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: false,
    });
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Critères de recherche »
  // -----------------------------------------------------------------------------------------
  /* À l'ouverture, les critères du prototype — dont la notation minimale `A−`. La
     réinitialisation, elle, rend des critères vraiment vides : voir `defaultSearch`. */
  protected readonly search = this.viewState.remember<SearchState>('titres.search', defaultSearch());

  /**
   * Critères effectivement appliqués aux résultats, distincts de ceux affichés dans le formulaire.
   *
   * Les deux étaient confondus : chaque champ modifié relançait la recherche au clavier. Avec un
   * bouton « Rechercher », on compose ses critères puis on les soumet — et le formulaire peut être
   * réinitialisé sans que les résultats bougent, ce qui n'était pas possible tant qu'ils dérivaient
   * directement de lui.
   */
  private readonly appliedSearch = this.viewState.remember<SearchState>('titres.appliedSearch', defaultSearch());

  /** Le formulaire diffère-t-il de ce qui est appliqué ? Sert à signaler qu'il faut relancer. */
  protected readonly searchDirty = computed(() => JSON.stringify(this.search()) !== JSON.stringify(this.appliedSearch()));
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
  protected readonly searchSummary = computed(() => {
    if (this.searchDirty()) return 'Critères modifiés — lancez la recherche pour les appliquer.';
    return this.activeCriteria()
      ? 'Les critères se cumulent : seuls les titres satisfaisant l\'ensemble sont retenus.'
      : 'Aucun critère : la liste complète des titres référencés est affichée.';
  });

  protected patchSearch(patch: Partial<SearchState>): void {
    this.search.update((s) => ({ ...s, ...patch }));
  }

  /**
   * Soumet les critères du formulaire.
   *
   * La recherche porte sur le panneau « Selon les critères », qui est donc ramené au premier plan :
   * lancer une recherche et continuer d'afficher la composition d'un indice n'aurait aucun sens.
   */
  protected runSearch(): void {
    this.appliedSearch.set(this.search());
    this.resSource.set('criteria');
    this.shownBySource.update((p) => ({ ...p, criteria: true }));
    this.pickStatus.set('');
  }

  /**
   * Réinitialise le panneau « Critères de recherche », et lui seul : les critères repassent à
   * vide.
   *
   * Il vidait aussi le tableau des résultats, c'est-à-dire un panneau qui ne lui appartient pas.
   * Chaque bouton de réinitialisation reste chez lui ; les résultats se vident depuis leur propre
   * barre. Qu'ils se recomposent ici est une conséquence, pas une action : ils sont dérivés des
   * critères, et des critères vides rendent la liste complète.
   */
  protected resetSearch(): void {
    this.search.set(blankSearch());
  }

  // -----------------------------------------------------------------------------------------
  // Onglet Recherche — panneau « Résultats »
  // -----------------------------------------------------------------------------------------
  protected readonly resColName = this.viewState.remember('titres.resColName', '');
  protected readonly resColCls = this.viewState.remember('titres.resColCls', '');
  protected readonly resColCurrency = this.viewState.remember('titres.resColCurrency', '');
  protected readonly resColRating = this.viewState.remember('titres.resColRating', '');
  protected readonly resColLiquidity = this.viewState.remember('titres.resColLiquidity', '');
  protected readonly resStatusPick = this.viewState.remember<ReadonlySet<PositionStatusKey>>('titres.resStatusPick', new Set());
  protected readonly resSortKey = this.viewState.remember<string | null>('titres.resSortKey', null);
  protected readonly resSortDir = this.viewState.remember<SortDir>('titres.resSortDir', 'asc');
  protected readonly resSource = this.viewState.remember<'criteria' | 'index'>('titres.resSource', 'criteria');
  /**
   * Sélection en cours, **une par panneau**.
   *
   * Les deux sources de résultats — « Selon les critères » et « Selon l'indice retenu » —
   * partageaient un seul ensemble. Trois conséquences, toutes fâcheuses : passer d'un panneau à
   * l'autre effaçait la sélection en cours, une réinitialisation faite sur l'un emportait le
   * travail fait sur l'autre, et verser dans l'univers depuis un panneau vidait aussi le second.
   * Les deux panneaux répondent à deux questions distinctes — ce que les critères trouvent, ce que
   * l'indice contient — et on passe de l'un à l'autre pour les comparer, pas pour repartir de zéro.
   */
  private readonly pickedBySource = this.viewState.remember<Readonly<Record<'criteria' | 'index', ReadonlySet<string>>>>(
    'titres.pickedBySource',
    { criteria: new Set(), index: new Set() },
  );
  protected readonly picked = computed(() => this.pickedBySource()[this.resSource()]);

  /**
   * Un tableau de résultats a-t-il quelque chose à montrer ?
   *
   * Sans critères, la recherche rendrait l'univers entier — ce qui n'est pas un résultat, c'est
   * l'absence de question. Réinitialiser efface donc aussi les résultats de la recherche
   * précédente : le tableau reste vide jusqu'à ce qu'un critère soit posé. Un par panneau, comme la
   * sélection : réinitialiser « Selon les critères » ne doit pas effacer ce que montre l'autre.
   */
  private readonly shownBySource = this.viewState.remember<Readonly<Record<'criteria' | 'index', boolean>>>(
    'titres.shownBySource',
    /* Les deux panneaux partent vides : pas de résultats sans recherche. Le panneau des critères
       attend « Rechercher », celui de l'indice attend qu'un indice soit choisi. Ouvrir sur une
       liste que personne n'a demandée revenait à répondre avant la question. */
    { criteria: false, index: false },
  );
  protected readonly resultsShown = computed(() => this.shownBySource()[this.resSource()]);

  private setShown(on: boolean): void {
    this.shownBySource.update((p) => ({ ...p, [this.resSource()]: on }));
  }

  /** Remplace la sélection du panneau courant, sans toucher à celle de l'autre. */
  private setPicked(next: ReadonlySet<string>): void {
    this.pickedBySource.update((p) => ({ ...p, [this.resSource()]: next }));
  }
  protected readonly pickStatus = signal('');
  protected readonly pickStatusColor = signal('var(--ink-ok-2)');

  protected readonly resSources: readonly { readonly key: 'criteria' | 'index'; readonly label: string }[] = [
    { key: 'criteria', label: 'Selon les critères' },
    { key: 'index', label: "Selon l'indice retenu" },
  ];

  protected readonly searchPool = computed(() => buildSearchPool(this.resSource() === 'index', this.selectedIndex()));
  protected readonly resStatusOptions = computed(() => buildResStatusOptions(this.searchPool(), this.decisions()));

  protected readonly searchRows = computed(() =>
    computeSearchRows({
      pool: this.searchPool(),
      fromIndex: this.resSource() === 'index',
      search: this.appliedSearch(),
      resCol: { name: this.resColName(), cls: this.resColCls(), currency: this.resColCurrency(), rating: this.resColRating(), liquidity: this.resColLiquidity() },
      resStatusKeys: this.resStatusPick(),
      decisions: this.decisions(),
      picked: this.picked(),
      sortKey: this.resSortKey(),
      sortDir: this.resSortDir(),
    }),
  );
  /** Ce que le tableau rend réellement : rien tant que la recherche n'a pas été relancée. */
  protected readonly shownRows = computed(() => (this.resultsShown() ? this.searchRows() : []));
  /* Le total est celui de la source interrogée, pas celui de l'univers : sur un indice de quarante
     composants, « 40 / 15 titres » n'avait aucun sens. */
  protected readonly searchCount = computed(() =>
    this.resultsShown() ? this.searchRows().length + ' / ' + this.searchPool().length + ' titres' : 'Aucune recherche en cours',
  );
  protected readonly noSearchRows = computed(() => this.shownRows().length === 0);
  /** Texte de l'encart vide : distinguer « rien ne correspond » de « rien n'a été demandé ». */
  protected readonly emptyNote = computed(() =>
    this.resultsShown()
      ? 'Aucun titre ne satisfait ces critères.'
      : 'Résultats vidés. Posez un critère de recherche, ou choisissez un indice, pour relancer la recherche.',
  );
  protected readonly allPicked = computed(() => this.shownRows().length > 0 && this.shownRows().every((r) => this.picked().has(r.ticker)));
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
    /* Changer de panneau ne détruit plus rien : chacun garde sa sélection, on revient sur l'autre
       et on la retrouve. */
    /* Basculer d'un panneau à l'autre ne relance rien : chacun garde son état, résultats compris.
       Un panneau vidé le reste tant qu'aucun critère n'y est posé — sans quoi la réinitialisation
       serait défaite par un simple aller-retour. */
    this.resSource.set(key);
    this.pickStatus.set('');
  }

  protected togglePicked(ticker: string): void {
    const next = new Set(this.picked());
    if (next.has(ticker)) next.delete(ticker);
    else next.add(ticker);
    this.setPicked(next);
    this.pickStatus.set('');
  }

  protected togglePickAll(): void {
    const rows = this.searchRows();
    const all = rows.length > 0 && rows.every((r) => this.picked().has(r.ticker));
    const next = new Set(this.picked());
    rows.forEach((r) => (all ? next.delete(r.ticker) : next.add(r.ticker)));
    this.setPicked(next);
    this.pickStatus.set('');
  }

  protected addPickedOk(): void {
    const keys = Array.from(this.picked());
    if (!keys.length) {
      this.pickStatus.set('Aucun titre sélectionné.');
      this.pickStatusColor.set('var(--ink-warn-2)');
      return;
    }
    this.universe.retain(keys);
    this.setPicked(new Set());
    this.pickStatus.set(keys.length + " titre(s) ajouté(s) à l'univers.");
    this.pickStatusColor.set('var(--ink-ok-2)');
  }

  /**
   * Réinitialise le panneau de résultats affiché — sa sélection, ses filtres de colonnes, son tri,
   * et les résultats eux-mêmes, vidés jusqu'à la prochaine recherche.
   *
   * Trois choses qu'il ne touche pas, parce qu'elles ne sont pas à lui : la sélection de l'autre
   * panneau de résultats, les critères de recherche — qui ont leur propre bouton —, et les
   * décisions du comité, prises dans l'onglet Univers et valables pour toute la session.
   */
  protected resetPicked(): void {
    this.setPicked(new Set());
    this.resColName.set('');
    this.resColCls.set('');
    this.resColCurrency.set('');
    this.resColRating.set('');
    this.resColLiquidity.set('');
    this.resStatusPick.set(new Set());
    this.resSortKey.set(null);
    this.resSortDir.set('asc');
    this.setShown(false);
    this.pickStatus.set('Panneau réinitialisé : sélection, filtres, tri et résultats.');
    this.pickStatusColor.set('var(--ink-ok-2)');
  }

  // -----------------------------------------------------------------------------------------
  // Sélections multiples génériques (colonne Ticker/Place/Devise/Statut, univers + suivis + résultats)
  // -----------------------------------------------------------------------------------------
  protected toggleTick(key: string): void {
    this.uniShown.set(true);
    toggleInSet(this.tickPick, key);
  }
  protected toggleAllTick(): void {
    this.uniShown.set(true);
    toggleAllInSet(this.tickPick, this.tickerOptions().map((o) => o.key));
  }
  protected togglePlace(key: string): void {
    this.uniShown.set(true);
    toggleInSet(this.placePick, key);
  }
  protected toggleAllPlace(): void {
    this.uniShown.set(true);
    toggleAllInSet(this.placePick, this.placeOptions().map((o) => o.key));
  }
  protected toggleCur(key: string): void {
    this.uniShown.set(true);
    toggleInSet(this.curPick, key);
  }
  protected toggleAllCur(): void {
    this.uniShown.set(true);
    toggleAllInSet(this.curPick, this.currencyOptions().map((o) => o.key));
  }
  protected toggleStat(key: string): void {
    this.uniShown.set(true);
    toggleInSet(this.statPick, key);
  }
  protected toggleAllStat(): void {
    this.uniShown.set(true);
    toggleAllInSet(this.statPick, this.statusOptions().map((o) => o.key));
  }

  protected toggleWatchTick(key: string): void {
    this.watchShown.set(true);
    toggleInSet(this.watchTickPick, key);
  }
  protected toggleAllWatchTick(): void {
    this.watchShown.set(true);
    toggleAllInSet(this.watchTickPick, this.watchTickerOptions.map((o) => o.key));
  }
  protected toggleWatchPlace(key: string): void {
    this.watchShown.set(true);
    toggleInSet(this.watchPlacePick, key);
  }
  protected toggleAllWatchPlace(): void {
    this.watchShown.set(true);
    toggleAllInSet(this.watchPlacePick, this.watchPlaceOptions.map((o) => o.key));
  }
  protected toggleWatchCur(key: string): void {
    this.watchShown.set(true);
    toggleInSet(this.watchCurPick, key);
  }
  protected toggleAllWatchCur(): void {
    this.watchShown.set(true);
    toggleAllInSet(this.watchCurPick, this.watchCurrencyOptions.map((o) => o.key));
  }

  protected toggleResStatus(key: string): void {
    toggleInSet(this.resStatusPick, key as PositionStatusKey);
    this.setShown(true);
  }
  protected toggleAllResStatus(): void {
    toggleAllInSet(this.resStatusPick, this.resStatusOptions().map((o) => o.key as PositionStatusKey));
    this.setShown(true);
  }

  /**
   * Filtres de colonnes du tableau des résultats.
   *
   * Ils passent par ici plutôt que d'écrire directement dans leur signal : sur un panneau qu'on
   * vient de réinitialiser, saisir un filtre doit relancer la recherche. Sans cela le champ
   * répondrait à un tableau vide, et rien ne se passerait.
   */
  protected setResCol(key: 'name' | 'cls' | 'currency' | 'rating' | 'liquidity', value: string): void {
    ({ name: this.resColName, cls: this.resColCls, currency: this.resColCurrency, rating: this.resColRating, liquidity: this.resColLiquidity })[key].set(value);
    this.setShown(true);
  }
}
