import { Component, WritableSignal, computed, inject, signal, viewChild } from '@angular/core';
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
import { ACCOUNT_OPEN, PORTFOLIO_LINKS, PositionStatusKey, REGIONS, INDICES } from './titres-data';
import {
  accountNote as accountNoteText,
  accountTriggerLabel,
  blankSearch,
  buildAccountOptions,
  buildIndexGroups,
  buildResStatusOptions,
  buildSearchPool,
  CLASS_SELECT_GROUPS,
  computeKpis,
  computeSearchRows,
  CONSENSUS_SELECT_GROUPS,
  CURRENCY_SELECT_GROUPS,
  defaultSearch,
  DIV_FREQ_SELECT_GROUPS,
  ESG_SELECT_GROUPS,
  LIQUIDITY_SELECT_GROUPS,
  MultiOption,
  OPEN_ACCOUNTS,
  pickedAccountKeys,
  placeSelectGroups,
  RATING_SELECT_GROUPS,
  refOf,
  SearchState,
  SECTOR_SELECT_GROUPS,
  type SortDir,
  toggleAllInSet,
  toggleInSet,
} from './titres-filters';
import { SecuritiesTable } from './securities-table';
import { TiMultiSelect } from './ti-multiselect';
import { TiSelect } from './ti-select';
import { TiPreviewDialog, TiPreviewDialogData } from './ti-preview-dialog';
import { TiSecurityDialog, TiSecurityDialogData } from './ti-security-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'universe' | 'search';

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
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatCheckboxModule, MatSlideToggleModule, MatTableModule, MatTooltipModule, SecuritiesTable, TiMultiSelect, TiSelect],
  templateUrl: './titres.html',
  styleUrls: ['./titres.css', './titres-table.css'],
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
  protected readonly universe = inject(SecurityUniverseStore);

  /* Le catalogue des titres est récupéré à la demande, pas au démarrage : l'écran qui en a besoin
     le réclame. Un `constructor` plutôt qu'un `ngOnInit` — l'appel est idempotent et n'attend
     rien, il n'a pas à guetter un cycle de vie. */
  constructor() {
    this.universe.load();
  }

  /** Le catalogue courant — vide tant qu'il n'est pas arrivé, d'où le passage par un signal. */
  private readonly securities = computed(() => this.universe.all());

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
  /* Le périmètre de veille de la session : les tableaux en ont besoin pour que `follow()` se voie. */
  protected readonly followed = this.universe.followedSet;
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
   * Les deux tableaux de l'univers montrent leur liste, sans attendre de question.
   *
   * Ils partaient vides jusqu'à ce qu'un filtre soit posé — au motif qu'une liste non filtrée
   * n'est pas un résultat. L'argument vaut pour une recherche, pas pour un référentiel : l'univers
   * d'investissement *est* ce qu'on vient lire. Surtout, l'attente cassait le lien avec l'onglet
   * Recherche : y retenir des titres mettait bien `universe.tradable()` à jour, mais la carte des
   * négociables restait vide, et le geste semblait n'avoir rien fait.
   */
  protected setUniFilter(_key: 'query', value: string): void {
    this.query.set(value);
  }

  protected readonly query = this.viewState.remember('titres.query', '');
  protected readonly filter = this.viewState.remember<'all' | 'ok'>('titres.filter', 'all');
  protected readonly acctPick = this.viewState.remember<ReadonlySet<string> | null>('titres.acctPick', null);
  protected readonly groupByStatus = this.viewState.remember('titres.groupByStatus', false);

  protected readonly acctKeys = computed(() => pickedAccountKeys(this.acctPick()));
  protected readonly acctKeysSet = computed(() => new Set(this.acctKeys()));
  protected readonly accountOptions: readonly MultiOption[] = buildAccountOptions();
  protected readonly accountTrigger = computed(() => accountTriggerLabel(this.acctPick()));
  protected readonly accountAllOn = computed(() => OPEN_ACCOUNTS.every((v) => this.acctKeys().indexOf(v) >= 0));
  protected readonly accountNote = computed(() => accountNoteText(this.acctKeys().length));

  /* Le décompte est celui du tableau, qui tient ses filtres : l'écran le lui demande plutôt que de
     refaire le calcul avec des critères qu'il ne détient plus. */
  private readonly uniTable = viewChild('uniTable', { read: SecuritiesTable });
  private readonly watchTable = viewChild('watchTable', { read: SecuritiesTable });
  /**
   * « n / m titres » : m est la population dont le tableau tire ses lignes, pas le référentiel.
   *
   * Le dénominateur valait `referenced`, tout le référentiel — 15 — alors que la carte ne montre
   * que les négociables et qu'un filtre par compte éligible s'applique par-dessus. « 9 / 15 »
   * rapprochait donc deux populations différentes ; c'est « 9 sur les 11 négociables » qu'il faut
   * lire, et c'est ce que compte la vignette juste au-dessus.
   */
  protected readonly listNote = computed(
    () => (this.uniTable()?.matchingCount() ?? 0) + ' / ' + this.universe.tradableCount() + ' titres',
  );
  protected readonly listNoteMargin = computed(() => (this.deleteNote() ? '12px' : 'auto'));

  /* Les tableaux des titres suivis et des résultats de recherche partagent les colonnes du tableau
     des négociables — qui, lui, les porte désormais chez lui. Ils les gardent ici tant qu'ils n'ont
     pas suivi le même chemin. */
  protected readonly resColumns = ['select', 'security', 'cls', 'currency', 'rating', 'liquidity', 'status', 'actions'];
  protected readonly resFilterColumns = ['selectFilter', 'securityFilter', 'clsFilter', 'currencyFilter', 'ratingFilter', 'liquidityFilter', 'statusFilter', 'actionsFilter'];


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
    this.uniTable()?.reset();
    this.groupByStatus.set(false);
    this.acctPick.set(null);
    this.deleteNote.set('');
    this.filter.set('all');
    this.query.set('');
  }

  // -----------------------------------------------------------------------------------------
  // Univers — Titres suivis (watchlist)
  // -----------------------------------------------------------------------------------------

  protected readonly watchNote = computed(() => {
    const n = this.watchTable()?.matchingCount() ?? 0;
    return n + (n > 1 ? ' titres suivis' : ' titre suivi');
  });


  protected resetWatchView(): void {
    this.watchTable()?.reset();
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
  protected readonly indexGroups = computed(() => buildIndexGroups(this.securities(), this.refs(), this.decisions()));

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
    /* Changer d'indice relance la recherche du panneau qui s'en nourrit, et lève la restriction
       posée par un « Charger dans la liste » précédent : elle portait sur l'indice d'avant. */
    this.indexCharges.set([]);
    this.shownBySource.update((p) => ({ ...p, index: true }));
  }

  /**
   * Ouvre l'aperçu de la composition, et verse le résultat dans la liste si on le demande.
   *
   * « Charger dans la liste » ne chargeait rien : les deux boutons du pied du dialogue appelaient
   * la même fermeture, et les titres retenus dans l'aperçu n'apparaissaient nulle part. Le
   * dialogue rend maintenant `true` quand on presse ce bouton-là, et l'écran bascule ses
   * résultats sur l'indice — ce qui est exactement ce que le libellé annonce.
   *
   * Le dialogue ne connaît pas le panneau de résultats et n'a pas à le connaître : il dit ce
   * qu'on lui a demandé, l'écran décide de la suite.
   */
  protected openPreview(): void {
    this.dialog
      .open<TiPreviewDialog, TiPreviewDialogData, readonly string[] | undefined>(TiPreviewDialog, {
        data: { idx: this.selectedIndex(), refs: this.refs },
        maxWidth: '96vw',
        maxHeight: '90vh',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((nouveaux) => {
        /* `undefined` = fermé sans charger. Un tableau vide, lui, est une réponse : on a pressé
           « Charger » sans avoir rien retenu de nouveau, et la liste le dira. */
        if (!nouveaux) return;
        this.indexCharges.set(nouveaux);
        this.resSource.set('index');
        this.shownBySource.update((p) => ({ ...p, index: true }));
        /* Le panneau se déplie s'il était replié : charger une liste pour la laisser cachée
           reviendrait à ne rien faire, ce que le bouton faisait déjà. */
        this.panels.update((p) => ({ ...p, res: true }));
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
  protected readonly placeGroups = computed(() => placeSelectGroups(this.securities()));

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

  /**
   * Les titres que le dernier « Charger dans la liste » a versés.
   *
   * Vide tant que personne n'a chargé, et remis à vide dès qu'on change d'indice : la sélection
   * d'un indice ne dit rien de ce qu'on a retenu dans un autre, et garder la restriction
   * afficherait une liste vide sans qu'on comprenne pourquoi.
   */
  private readonly indexCharges = signal<readonly string[]>([]);

  protected readonly searchPool = computed(() =>
    buildSearchPool(this.securities(), this.resSource() === 'index', this.selectedIndex(), this.indexCharges()),
  );

  /**
   * Décisions telles qu'elles s'appliquent aux résultats.
   *
   * Sur la source « indice », un composant retenu depuis l'aperçu porte sa décision dans `refs`,
   * à la clé `indice/mnémonique` — pas dans les décisions du comité. Sans ce recouvrement, un
   * titre qu'on venait de retenir dans l'aperçu ressortait « Non retenu » dans la liste : l'aperçu
   * et les résultats affirmaient deux choses contraires sur le même titre.
   *
   * Le recouvrement passe par `refOf`, la fonction dont l'aperçu se sert lui-même. C'est la seule
   * façon que les deux vues ne divergent pas — une seconde règle écrite ici finirait par dire
   * autre chose.
   */
  protected readonly resDecisions = computed(() => {
    const base = this.decisions();
    if (this.resSource() !== 'index') return base;
    const idx = this.selectedIndex();
    const refs = this.refs();
    const pool = this.securities();
    const effectives = new Map(base);
    idx.members.forEach((m) => effectives.set(m.ticker, refOf(pool, refs, idx.key, m, base)));
    return effectives;
  });

  protected readonly resStatusOptions = computed(() => buildResStatusOptions(this.searchPool(), this.resDecisions(), this.followed()));

  protected readonly searchRows = computed(() =>
    computeSearchRows({
      pool: this.searchPool(),
      followed: this.followed(),
      fromIndex: this.resSource() === 'index',
      search: this.appliedSearch(),
      resCol: { name: this.resColName(), cls: this.resColCls(), currency: this.resColCurrency(), rating: this.resColRating(), liquidity: this.resColLiquidity() },
      resStatusKeys: this.resStatusPick(),
      decisions: this.resDecisions(),
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
    const added = this.universe.retain(...keys);
    this.setPicked(new Set());
    /* Le store rend ce qui a effectivement changé : annoncer « 3 ajoutés » quand deux l'étaient
       déjà serait faux, et c'est le genre de faux qu'on ne remarque jamais. */
    this.pickStatus.set(
      added ? added + " titre(s) ajouté(s) à l'univers." : 'Ces titres sont déjà négociables.',
    );
    this.pickStatusColor.set('var(--ink-ok-2)');
  }

  /**
   * Met la sélection en suivi.
   *
   * Jumeau d'`addPickedOk`, et sa contrepartie exacte : l'un verse les titres dans l'univers
   * négociable, l'autre les met sous surveillance. Le même geste, deux destinations — c'est
   * pourquoi les deux boutons sont côte à côte, et pourquoi les deux rendent compte de la même
   * façon.
   *
   * Un titre déjà en veille — livré tel quel par le référentiel, ou mis en suivi plus tôt — n'est
   * pas recompté : le store rend ce qui a effectivement changé.
   */
  protected async addPickedWatch(): Promise<void> {
    const keys = Array.from(this.picked());
    if (!keys.length) {
      this.pickStatus.set('Aucun titre sélectionné.');
      this.pickStatusColor.set('var(--ink-warn-2)');
      return;
    }

    /* La sélection est vidée avant l'attente : le tableau des suivis, lui, a déjà bougé — le store
       écrit l'état de session avant d'appeler le référentiel. L'écran ne fait donc rien patienter,
       il ne fait que rendre compte une fois l'écriture connue. */
    this.setPicked(new Set());
    const report = await this.universe.follow(...keys);

    if (!report.added) {
      this.pickStatus.set('Ces titres sont déjà suivis.');
      this.pickStatusColor.set('var(--ink-ok-2)');
      return;
    }

    /* Enregistré au référentiel ou retenu pour la séance : ce n'est pas la même promesse, et la
       seconde doit se dire. Une veille annoncée comme acquise et perdue au rechargement est un
       mensonge que l'écran a les moyens d'éviter. */
    const enregistres = report.persisted === report.added;
    this.pickStatus.set(
      enregistres
        ? report.added + ' titre(s) mis en suivi au référentiel.'
        : report.added + ' titre(s) mis en suivi pour la séance' + (report.reason ? ' — ' + report.reason : '') + '.',
    );
    this.pickStatusColor.set(enregistres ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)');
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
