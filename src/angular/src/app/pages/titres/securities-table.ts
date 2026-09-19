import { ChangeDetectionStrategy, Component, WritableSignal, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ViewStateService } from '../../shell/view-state.service';
import { SecurityUniverseStore } from '../../domain/security-universe.store';
import type { SecurityElement } from '../../domain/security-reference';
import { nextSort, sortHeaderView } from '../positions/positions-sort';
import {
  buildCurrencyOptions,
  buildPlaceOptions,
  buildStatusOptions,
  buildTickerOptions,
  computeUniRows,
  groupUniRows,
  sortUniRows,
  toggleAllInSet,
  toggleInSet,
  type SortDir,
  type UniRow,
  type UniScope,
  type UniRowGroup,
} from './titres-filters';
import { TiMultiSelect } from './ti-multiselect';

/** Ligne du tableau : soit un titre, soit l'en-tête d'une section de groupement. */
export type SecuritiesTableRow =
  | { readonly kind: 'sec'; readonly r: UniRow }
  | { readonly kind: 'group'; readonly g: UniRowGroup };

/**
 * Le tableau d'une liste de titres — celle qu'on lui donne.
 *
 * ## Ce que l'entrée apporte
 *
 * `securities` est la liaison : le composant rend **la liste qu'il reçoit**, sans savoir d'où elle
 * vient ni ce qui la définit. L'écran lui passe `universe.tradable()`, c'est-à-dire ce que sert
 * `GET /v1/securities?tradable=true&followed=false` ; il pourrait tout aussi bien lui passer la
 * veille, ou le résultat d'une recherche. Le tableau ne connaissait jusqu'ici qu'une seule liste,
 * qu'il allait chercher lui-même dans l'écran — il ne pouvait donc en servir qu'une.
 *
 * ## Ce que le composant garde pour lui
 *
 * Les filtres de colonnes, le tri et le groupement : ce sont des états de *ce tableau-ci*, et rien
 * au-dehors n'a à les connaître. Ils restent persistés — d'où `stateKey`, qui préfixe leurs clés :
 * deux tableaux montés côte à côte ne doivent pas se marcher dessus.
 *
 * ## Ce qu'il ne fait pas
 *
 * Il ne supprime ni n'ouvre : il le demande. `open` et `remove` sortent le mnémonique, et c'est
 * l'écran qui décide de ce qu'il en fait — ouvrir un panneau, refuser une suppression. Un tableau
 * qui appellerait lui-même le store ne serait plus un tableau, ce serait la moitié d'un écran.
 */
@Component({
  selector: 'pm-securities-table',
  imports: [MatIconModule, MatTableModule, MatTooltipModule, TiMultiSelect],
  templateUrl: './securities-table.html',
  styleUrls: ['./titres-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuritiesTable {
  private readonly viewState = inject(ViewStateService);
  private readonly universe = inject(SecurityUniverseStore);

  // -- Entrées ------------------------------------------------------------------------------

  /**
   * La liste à rendre. C'est la seule chose que le tableau ne décide pas.
   *
   * Défaut vide plutôt que `input.required` : l'écran lit `matchingCount()` depuis un `computed`
   * pour afficher « n / m titres », et une entrée requise lue avant sa première liaison lève
   * NG0950. Le défaut fait de cette lecture précoce un zéro, que le calcul corrige dès que la
   * liaison est posée. Les deux appelants passent la liste ; ce qui manquait n'était pas la
   * garantie, c'était la tolérance à l'ordre d'évaluation.
   */
  readonly securities = input<readonly SecurityElement[]>([]);

  /**
   * Quelle moitié de l'univers ce tableau montre.
   *
   * Il reçoit déjà la bonne liste — l'API partitionne. Le critère reste nécessaire parce que les
   * décisions de la session, elles, peuvent déplacer un titre d'une carte à l'autre sans que le
   * serveur en sache rien : mettre un titre en veille doit le faire sortir des négociables ici
   * et maintenant, pas au prochain chargement.
   */
  readonly scope = input<UniScope>('tradable');

  /** La liste est-elle en cours de récupération ? Change ce que dit le tableau vide. */
  readonly loading = input(false);

  /** Comptes retenus par la barre d'outils de l'écran ; vide, le critère ne départage pas. */
  readonly accountKeys = input<readonly string[]>([]);

  /** Recherche libre de l'écran, appliquée par-dessus les filtres de colonnes. */
  readonly query = input('');

  /** Segment de l'écran : tout, ou seulement les titres retenus. */
  readonly decisionFilter = input<'all' | 'ok'>('all');

  /** Une section par statut, titres classés par nom. */
  readonly groupByStatus = input(false);

  /** Préfixe des clés d'état persisté. Un tableau, un préfixe. */
  readonly stateKey = input('titres.uni');

  /**
   * La colonne « Statut » porte-t-elle un filtre ?
   *
   * Non sur la veille : ses titres ont tous le même statut, et une liste déroulante à une entrée
   * n'est pas un filtre, c'est une décoration.
   */
  readonly statusFilterable = input(true);

  /** Ce que dit le tableau quand les filtres ne laissent rien passer. */
  readonly noMatchNote = input('Aucun titre ne correspond aux filtres.');

  // -- Sorties ------------------------------------------------------------------------------

  /** Le mnémonique du titre dont on demande le détail. */
  readonly open = output<string>();

  /** Le mnémonique du titre qu'on demande à retirer. */
  readonly remove = output<string>();

  // -- État du tableau ----------------------------------------------------------------------

  /**
   * Les états persistés sont exposés en accesseurs, et non en champs.
   *
   * Ce n'est pas une coquetterie : un champ est initialisé dans le constructeur, où une entrée
   * signal **n'est pas encore posée** — `stateKey()` y rend sa valeur par défaut. Les deux
   * tableaux de l'écran tombaient alors sur les mêmes cellules et partageaient leurs filtres :
   * taper dans l'un remplissait l'autre. Un accesseur résout la clé à la première lecture, une
   * fois les entrées en place ; `ViewStateService.remember` étant mémoïsé par clé, le coût se
   * réduit à une recherche dans une `Map`.
   */
  private cell<T>(suffix: string, initial: T): WritableSignal<T> {
    return this.viewState.remember<T>(`${this.stateKey()}.${suffix}`, initial);
  }

  protected get sortKey(): WritableSignal<string | null> {
    return this.cell<string | null>('sortKey', null);
  }
  protected get sortDir(): WritableSignal<SortDir> {
    return this.cell<SortDir>('sortDir', 'asc');
  }
  protected get colIsin(): WritableSignal<string> {
    return this.cell('colIsin', '');
  }
  protected get colName(): WritableSignal<string> {
    return this.cell('colName', '');
  }
  protected get tickPick(): WritableSignal<ReadonlySet<string>> {
    return this.cell<ReadonlySet<string>>('tickPick', new Set());
  }
  protected get placePick(): WritableSignal<ReadonlySet<string>> {
    return this.cell<ReadonlySet<string>>('placePick', new Set());
  }
  protected get curPick(): WritableSignal<ReadonlySet<string>> {
    return this.cell<ReadonlySet<string>>('curPick', new Set());
  }
  protected get statPick(): WritableSignal<ReadonlySet<string>> {
    return this.cell<ReadonlySet<string>>('statPick', new Set());
  }

  // -- Options de filtres -------------------------------------------------------------------

  private readonly deleted = this.universe.deletedSet;
  private readonly decisions = this.universe.decisionMap;
  private readonly followed = this.universe.followedSet;

  protected readonly tickerOptions = computed(() => buildTickerOptions(this.securities(), this.deleted()));
  protected readonly placeOptions = computed(() => buildPlaceOptions(this.securities(), this.deleted()));
  protected readonly currencyOptions = computed(() => buildCurrencyOptions(this.securities(), this.deleted()));
  protected readonly statusOptions = computed(() => buildStatusOptions(this.securities(), this.deleted(), this.decisions(), this.followed()));

  // -- Lignes -------------------------------------------------------------------------------

  /**
   * Les lignes retenues, avant tri et groupement.
   *
   * `computeUniRows` conserve ses propres exclusions — titres suivis, titres écartés. Sur une liste
   * déjà partitionnée par le serveur elles ne retirent rien ; ce sont elles, en revanche, qui
   * appliquent les décisions de la session, que le serveur ne connaît pas.
   */
  readonly matching = computed(() =>
    computeUniRows({
      scope: this.scope(),
      followed: this.followed(),
      securities: this.securities(),
      decisions: this.decisions(),
      deleted: this.deleted(),
      query: this.query(),
      filter: this.decisionFilter(),
      acctKeys: this.accountKeys(),
      colIsin: this.colIsin(),
      colName: this.colName(),
      tickKeys: this.tickPick(),
      placeKeys: this.placePick(),
      curKeys: this.curPick(),
      statKeys: this.statPick(),
    }),
  );

  /** Combien de lignes répondent aux critères — ce que l'écran affiche au-dessus du tableau. */
  readonly matchingCount = computed(() => this.matching().length);

  private readonly sorted = computed(() => sortUniRows(this.matching(), this.sortKey(), this.sortDir()));
  private readonly groups = computed(() => groupUniRows(this.sorted(), this.groupByStatus()));

  /**
   * Ce que le tableau rend.
   *
   * MatTable n'a qu'un seul corps de tableau : les sections sont aplaties en une seule liste où
   * l'en-tête de section devient une ligne à part entière, reconnue par `isGroupRow`.
   *
   * ## Pourquoi il n'y a plus de porte devant
   *
   * Le tableau restait vide jusqu'à ce qu'un filtre soit posé, au motif qu'une liste sans question
   * n'est pas un résultat. C'était vrai d'une recherche ; ça ne l'est pas d'une liste de
   * référentiel, qui *est* la réponse — « quel est mon univers ? » ne se pose pas, elle se lit.
   *
   * Et la porte coupait le fil : retenir des titres depuis l'onglet Recherche recalculait bien
   * `universe.tradable()`, le signal traversait bien `matching`, mais le rendu s'arrêtait là. Le
   * geste paraissait sans effet alors que l'univers avait changé — le pire des deux mondes, car
   * rien ne signalait que quelque chose était arrivé. La chaîne va maintenant du store au DOM sans
   * interruption : liste servie → décisions de session → filtres de colonnes → tri → lignes.
   */
  protected readonly shownRows = computed<readonly SecuritiesTableRow[]>(() =>
    this.groups().flatMap((g) => [
      ...(g.hasHeader ? [{ kind: 'group' as const, g }] : []),
      ...g.rows.map((r) => ({ kind: 'sec' as const, r })),
    ]),
  );

  protected readonly isEmpty = computed(() => this.shownRows().length === 0);

  protected readonly emptyNote = computed(() => {
    if (this.loading() && !this.securities().length) return 'Chargement du référentiel…';
    return this.noMatchNote();
  });

  protected readonly isGroupRow = (_: number, row: SecuritiesTableRow) => row.kind === 'group';
  protected readonly trackBy = (_: number, row: SecuritiesTableRow) =>
    row.kind === 'group' ? 'g:' + row.g.label : 's:' + row.r.ticker;

  protected readonly columns = ['isin', 'ticker', 'name', 'place', 'currency', 'status', 'actions'];
  protected readonly filterColumns = ['isinFilter', 'tickerFilter', 'nameFilter', 'placeFilter', 'currencyFilter', 'statusFilter', 'actionsFilter'];
  protected readonly groupColumns = ['uniGroupHead'];

  // -- Interactions -------------------------------------------------------------------------

  /** Les filtres passent par ici plutôt que d'écrire dans leur signal depuis le gabarit. */
  protected setColumnFilter(key: 'colIsin' | 'colName', value: string): void {
    ({ colIsin: this.colIsin, colName: this.colName })[key].set(value);
  }

  protected sortHeader(key: string) {
    return sortHeaderView(this.sortKey(), this.sortDir(), key);
  }

  protected onSort(key: string): void {
    const next = nextSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.key);
    this.sortDir.set(next.dir);
  }

  protected toggleTick(k: string): void {
    toggleInSet(this.tickPick, k);
  }
  protected toggleAllTick(): void {
    toggleAllInSet(this.tickPick, this.tickerOptions().map((o) => o.key));
  }
  protected togglePlace(k: string): void {
    toggleInSet(this.placePick, k);
  }
  protected toggleAllPlace(): void {
    toggleAllInSet(this.placePick, this.placeOptions().map((o) => o.key));
  }
  protected toggleCur(k: string): void {
    toggleInSet(this.curPick, k);
  }
  protected toggleAllCur(): void {
    toggleAllInSet(this.curPick, this.currencyOptions().map((o) => o.key));
  }
  protected toggleStat(k: string): void {
    toggleInSet(this.statPick, k);
  }
  protected toggleAllStat(): void {
    toggleAllInSet(this.statPick, this.statusOptions().map((o) => o.key));
  }

  protected requestOpen(ticker: string): void {
    this.open.emit(ticker);
  }

  protected requestRemove(ticker: string): void {
    this.remove.emit(ticker);
  }

  /** Remet le tableau dans l'état où l'écran l'a trouvé. Appelé par le bouton de la barre d'outils. */
  reset(): void {
    this.sortKey.set(null);
    this.sortDir.set('asc');
    this.colIsin.set('');
    this.colName.set('');
    this.tickPick.set(new Set());
    this.placePick.set(new Set());
    this.curPick.set(new Set());
    this.statPick.set(new Set());
  }
}
