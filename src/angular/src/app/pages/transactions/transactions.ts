import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { ColResize } from '../../ui/col-resize';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NonWorkingDaysService } from '../../domain/non-working-days.service';
import { settlementRuleFor } from '../../domain/settlement-calendar';
import {
  LEG_RULES,
  TRADABLE_SECURITIES,
  LIGHT_NATURE_TINT,
  NATURES,
  RECO,
  RECO_STATE,
  TODAY,
  TX,
  TX_OP,
  TYPE_TO_NATURE,
  kindOf,
  parseFr,
  type NatureKey,
  type RecoStateKey,
} from './transactions-data';
import {
  ACCOUNTS,
  SECURITIES,
  accOf,
  buildRows,
  LEG_COLUMNS,
  type GroupKey,
  buildSearchGroups,
  computeKpis,
  computePendingRows,
  computeRecoStamp,
  computeRecoStats,
  computeSuspense,
  filterTransactions,
  isPending,
  refOptions,
  searchHasNoMatch,
  secOf,
  type FilterState,
} from './transactions-filters';
import {
  computeFields,
  computeLegs,
  execRowsView,
  execToggleOptions,
  formFields2View,
  formFieldsView,
  hasPanel2,
  initialForm,
  type ExecRowState,
  type FormState,
} from './transactions-form';
import { dateToIso, isoToDate } from '../../shell/date-bridge';
import { TxSelect, type TxSelectOption } from './tx-select';
import { TxMultiSelect, type TxMultiOption } from './tx-multiselect';
import { TxStructDialog, type TxStructDialogData } from './tx-struct-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'new' | 'register' | 'pending';

/**
 * Porté depuis `Transactions.dc.html`. Toute la machinerie de positionnement manuel des menus
 * (`openMenu`/`measureMenu`/`menuAnchor`/écouteurs scroll-resize) disparaît avec les vrais
 * `MatMenu`/`MatAutocomplete`, qui gèrent eux-mêmes l'ancrage au CDK overlay — même principe
 * que Positions et Opérations. La recherche principale et le filtre de colonne Référence
 * redeviennent de vrais `MatAutocomplete` (le prototype les nommait déjà ainsi :
 * `data-mat-autocomplete`).
 *
 * `submitForm` du prototype ne modifie jamais le registre (`TX`) — seul un message est affiché
 * (confirmé par grep) : reproduit tel quel, sans mutation de données.
 * `role`/`isAdmin` ne varie jamais (aucun sélecteur de rôle dans l'écran) : simplifié en un
 * bouton « Modifier » toujours actif plutôt qu'un état mort.
 */
@Component({
  selector: 'app-transactions',
  imports: [MatIconModule, MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatTableModule, MatTooltipModule, MatDatepickerModule, MatTabsModule, ColResize, TxSelect, TxMultiSelect],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions {
  /* MatDatepicker travaille en `Date`, le domaine en ISO : conversion aux bornes du gabarit
     (voir date-bridge.ts), pour ne rien changer aux comparaisons de chaînes des filtres. */
  protected readonly isoToDate = isoToDate;
  protected readonly dateToIso = dateToIso;

  private readonly dialog = inject(MatDialog);
  private readonly nonWorking = inject(NonWorkingDaysService);

  protected readonly today = TODAY;

  /** Types de TRADE (BUY/SELL) et de CORPORATE (SPLIT/SPINOFF/MERGER/DIV/DIVOPT/BUYOPT) en
   * teinte plus claire que le badge Nature dont ils dépendent (voir `LIGHT_NATURE_TINT` dans
   * `transactions-data.ts`), plutôt que l'indigo générique de `.tx-type-badge` partagé par
   * tous les codes d'opération — repris dans chaque table de détail des jambes (registre,
   * suspens, aperçu de saisie). TRANSFER et CASHFLOW gardent l'indigo par défaut, non demandé. */
  protected tradeTypeBg(type: string): string | null {
    const nature = TYPE_TO_NATURE[type];
    return (nature && LIGHT_NATURE_TINT[nature]?.bg) || null;
  }
  protected tradeTypeFg(type: string): string | null {
    const nature = TYPE_TO_NATURE[type];
    return (nature && LIGHT_NATURE_TINT[nature]?.fg) || null;
  }

  // ---- Onglets --------------------------------------------------------
  protected readonly tab = signal<Tab>('register');

  // ---- Filtres du registre ----------------------------------------------
  protected readonly query = signal('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly refFilter = signal('');
  protected readonly opNoFilter = signal('');
  protected readonly kindFilter = signal<'all' | 'security' | 'cash'>('all');
  protected readonly natPick = signal<ReadonlySet<NatureKey>>(new Set());
  protected readonly typePick = signal<ReadonlySet<string>>(new Set());
  protected readonly accPick = signal<ReadonlySet<string>>(new Set());
  protected readonly secPick = signal<ReadonlySet<string>>(new Set());
  protected readonly stateFilter = signal<'all' | 'pending' | 'settled'>('all');
  /* Même système que Nature/Type/Compte/Titre : sélection multiple à cases, et non plus une
     valeur unique. Un ensemble vide vaut « tous les états », comme pour les autres. */
  protected readonly recoPick = signal<ReadonlySet<RecoStateKey>>(new Set());
  protected readonly showOp = signal(false);
  protected readonly selected = signal<string | null>(null);
  protected readonly open = signal<ReadonlySet<string>>(new Set());
  protected readonly openMonths = signal<ReadonlySet<string>>(new Set());
  /* Critère de regroupement demandé, mois par mois. Réglage par mois et non global : la
     commande vit dans le panneau d'un mois donné, elle ne doit pas en engager d'autres. */
  protected readonly monthGroups = signal<ReadonlyMap<string, GroupKey>>(new Map());

  /* L'entrée neutre en tête — elle n'est pas un critère mais leur absence —, puis les critères
     par ordre alphabétique, comme les listes des filtres de colonnes.
     Icônes reprises de l'endroit où chaque notion vit déjà dans l'app : la navigation pour
     Comptes et Titres. L'entrée neutre porte un signe « moins », seul symbole qui dit une
     absence plutôt qu'un critère de plus. */
  protected readonly monthGroupOptions = [
    { value: 'none', label: 'Aucun regroupement', icon: 'minus' },
    { value: 'account', label: 'Par compte', icon: 'ledger-book' },
    { value: 'nature', label: 'Par nature', icon: 'sector' },
    { value: 'kind', label: 'Par objet', icon: 'allocation-split' },
    { value: 'security', label: 'Par titre', icon: 'library' },
    { value: 'type', label: 'Par type', icon: 'list-dots' },
  ];

  protected monthGroupOf(key: string): string {
    return this.monthGroups().get(key) ?? 'none';
  }

  protected setMonthGroup(key: string, value: string): void {
    this.monthGroups.update((m) => {
      const next = new Map(m);
      if (value === 'none') next.delete(key);
      else next.set(key, value as GroupKey);
      return next;
    });
  }

  private readonly filterState = computed<FilterState>(() => ({
    query: this.query(),
    natKeys: Array.from(this.natPick()),
    kindFilter: this.kindFilter(),
    refFilter: this.refFilter(),
    opNoFilter: this.opNoFilter(),
    recoKeys: Array.from(this.recoPick()),
    dateFrom: this.dateFrom(),
    dateTo: this.dateTo(),
    typeKeys: Array.from(this.typePick()),
    accKeys: Array.from(this.accPick()),
    secKeys: Array.from(this.secPick()),
    stateFilter: this.stateFilter(),
  }));

  protected readonly list = computed(() => filterTransactions(this.filterState()));
  protected readonly listNote = computed(() => `${this.list().length} / ${TX.length} transactions`);
  protected readonly noRows = computed(() => this.list().length === 0);
  protected readonly rows = computed(() => buildRows(this.list(), this.openMonths(), this.open(), this.monthGroups()));

  protected readonly pending = computed(() => TX.filter(isPending));
  protected readonly toPay = computed(() => this.pending().filter((t) => t.sense === 'debit').reduce((n, t) => n + t.amount, 0));
  protected readonly toGet = computed(() => this.pending().filter((t) => t.sense === 'credit').reduce((n, t) => n + t.amount, 0));
  protected readonly kpis = computed(() => computeKpis(this.pending(), this.toPay(), this.toGet()));
  protected readonly suspense = computed(() => computeSuspense(this.pending(), this.toPay(), this.toGet()));
  protected readonly pendingNote = computed(() => `${this.pending().length} opération(s) négociée(s), non réglée(s)`);
  protected readonly noPending = computed(() => this.pending().length === 0);
  protected readonly pendingRows = computed(() => computePendingRows(this.pending()));

  protected readonly recoStats = computeRecoStats();
  protected readonly recoStamp = computeRecoStamp();
  protected readonly recoKeysAll = (Object.keys(RECO_STATE) as RecoStateKey[]).sort((a, b) =>
    RECO_STATE[a].label.localeCompare(RECO_STATE[b].label, 'fr'),
  );
  protected readonly recoOptions = computed<readonly TxMultiOption[]>(() =>
    this.recoKeysAll.map((k) => ({
      key: k,
      label: RECO_STATE[k].label,
      count: TX.filter((x) => (RECO[x.ref] || 'pending') === k).length,
      badgeBg: RECO_STATE[k].bg,
      badgeFg: RECO_STATE[k].fg,
    })),
  );
  protected readonly recoAllSelected = computed(() => this.recoKeysAll.every((k) => this.recoPick().has(k)));
  /* Texte du déclencheur replié, commun aux cinq filtres à sélection multiple. Trois règles :
     - aucune valeur cochée, ou toutes : le libellé « tout », car dans les deux cas rien n'est
       filtré — afficher « Écart (+4) » quand les cinq états sont cochés serait trompeur ;
     - les valeurs sont lues dans l'ordre de la liste (alphabétique) et non dans l'ordre où
       elles ont été cochées, pour que le déclencheur soit stable et prévisible ;
     - au-delà d'une valeur, un simple « +N » : les colonnes font 100 à 175px, « (+2 autres) »
       y était systématiquement tronqué. Le détail complet passe par l'infobulle. */
  private buildTrigger<K extends string>(
    all: readonly K[],
    picked: ReadonlySet<K>,
    allLabel: string,
    meta: (k: K) => { label: string; bg?: string; fg?: string },
  ): { label: string; badge: { bg: string; fg: string } | null; more: string; hint: string } {
    const keys = all.filter((k) => picked.has(k));
    if (!keys.length || keys.length === all.length) {
      return { label: allLabel, badge: null, more: '', hint: '' };
    }
    const first = meta(keys[0]);
    const labels = keys.map((k) => meta(k).label);
    return {
      label: first.label,
      badge: first.bg ? { bg: first.bg, fg: first.fg as string } : null,
      more: keys.length > 1 ? `+${keys.length - 1}` : '',
      hint: labels.length > 1 ? labels.join(', ') : '',
    };
  }

  protected readonly recoTrigger = computed(() =>
    this.buildTrigger(this.recoKeysAll, this.recoPick(), 'Tous', (k) => RECO_STATE[k]),
  );


  /* État reste à sélection unique — les deux valeurs s'excluent — mais reprend l'habillage des
     autres filtres : pastilles aux couleurs de la colonne du tableau, triées alphabétiquement,
     « Tous » épinglé en tête puisqu'il n'est pas une valeur mais l'absence de filtre. */
  protected readonly stateOptions: readonly TxSelectOption[] = [
    { value: 'all', label: 'Tous' },
    ...(
      [
        { value: 'pending', label: 'En suspens', badgeBg: 'rgba(180,83,9,0.12)', badgeFg: 'var(--ink-warn-2)' },
        { value: 'settled', label: 'Réglé', badgeBg: 'rgba(15,118,110,0.14)', badgeFg: 'var(--ink-ok-2)' },
      ] as TxSelectOption[]
    ).sort((a, b) => a.label.localeCompare(b.label, 'fr')),
  ];

  protected readonly subtitle = computed(() => `${TX.length} transactions · ${this.pending().length} en suspens · journal au ${TODAY.split('-').reverse().slice(0, 2).join('/')}/${TODAY.slice(0, 4)}`);

  protected readonly pageTabs = computed(() => {
    const legsCount = this.legs().length;
    const defs: readonly { readonly key: Tab; readonly label: string; readonly badge: string }[] = [
      { key: 'new', label: 'Nouvelle transaction', badge: String(legsCount) },
      { key: 'register', label: 'Registre', badge: String(TX.length) },
      { key: 'pending', label: 'Suspens de règlement', badge: String(this.pending().length) },
    ];
    const tab = this.tab();
    return defs.map((t) => {
      const on = tab === t.key;
      return {
        key: t.key, label: t.label, badge: t.badge,
        height: on ? '40px' : '32px', padding: on ? '0 20px' : '0 14px', size: on ? '14px' : '12px',
        bg: on ? 'var(--ds-brand-fill, var(--field-brand))' : 'rgba(0,61,165,0.08)',
        fg: on ? '#ffffff' : 'var(--ink-brand)', weight: on ? '700' : '400',
        badgeBg: on ? 'rgba(255,255,255,0.24)' : 'rgba(0,61,165,0.16)', badgeFg: on ? '#ffffff' : 'var(--ink-brand)',
      };
    });
  });

  // ---- Colonne « Opération » (masquée par défaut) ------------------------
  /* Avec MatTable la colonne se retire de la liste des colonnes affichées plutôt que de rester
     dans le tableau en `display: none` — c'est la liste qui fait foi, y compris pour le nombre
     de colonnes que couvrent les lignes pleine largeur (`detailSpan`). */
  protected readonly txColumns = computed(() =>
    this.showOp()
      ? ['date', 'link', 'ref', 'op', 'kind', 'nature', 'type', 'account', 'security', 'amount', 'settle', 'state', 'reco', 'edit']
      : ['date', 'link', 'ref', 'kind', 'nature', 'type', 'account', 'security', 'amount', 'settle', 'state', 'reco', 'edit'],
  );
  protected readonly txFilterColumns = computed(() => this.txColumns().map((c) => c + 'Filter'));
  protected readonly txMonthColumns = ['monthCell'];
  protected readonly txMonthDetailColumns = ['monthDetailCell'];
  protected readonly txNatureColumns = ['natureCell'];
  protected readonly legColumns = LEG_COLUMNS;
  protected readonly txDetailColumns = ['detailCell'];
  protected readonly suspenseColumns = ['code', 'label', 'amount', 'count'];
  protected readonly pendingColumns = ['date', 'settle', 'type', 'security', 'amount', 'left'];
  protected readonly formLegColumns = ['seq', 'type', 'detail', 'amount'];

  /* Les trois natures de lignes de `rows()` (en-tête de mois, transaction, détail des jambes)
     se distinguent par `kind` ; le détail d'un mois est une seconde ligne engendrée par la
     même donnée, d'où `multiTemplateDataRows` sur le tableau. */
  protected readonly isMonthRow = (_: number, row: { readonly kind: string }) => row.kind === 'month';
  protected readonly isMonthOpenRow = (_: number, row: { readonly kind: string; readonly monthOpen?: boolean }) => row.kind === 'month' && !!row.monthOpen;
  protected readonly isTxRow = (_: number, row: { readonly kind: string }) => row.kind === 'tx';
  protected readonly isDetailRow = (_: number, row: { readonly kind: string }) => row.kind === 'detail';
  protected readonly isNatureRow = (_: number, row: { readonly kind: string }) => row.kind === 'nature';

  protected readonly detailSpan = computed(() => this.txColumns().length);
  protected readonly opColTitle = computed(() => (this.showOp() ? 'Masquer la colonne Opération — numéro unique de chaque opération' : 'Afficher la colonne Opération — numéro unique de chaque opération'));
  /* Plancher du tableau : somme des colonnes à largeur fixe (915px) plus un minimum lisible
     pour les deux colonnes en largeur `auto` (Compte, Titre ou poche), qui se partagent tout
     le reste. Volontairement bas, pour que la barre de défilement horizontale n'apparaisse que
     sur des fenêtres vraiment étroites : au-dessus de ce seuil le tableau s'étire pour remplir
     son conteneur, en dessous `.tx-table-scroll` prend le relais. */
  protected readonly tableMinWidth = computed(() => (this.showOp() ? '1316px' : '1166px'));

  // ---- Recherche principale (barre groupée) et filtre Référence ---------
  protected readonly acGroups = computed(() => buildSearchGroups(this.query()));
  protected readonly acEmpty = computed(() => searchHasNoMatch(this.query()));
  protected readonly refOpts = computed(() => refOptions(this.refFilter()));

  // ---- Filtre Objet (titre/trésorerie — sélection simple) ---------------
  /* Mêmes principes que les filtres à sélection multiple plus bas : valeurs triées
     alphabétiquement, « Tous » épinglé en tête — ce n'est pas une valeur mais l'absence de
     filtre, sa place est au-dessus de la liste, pas dedans. */
  protected readonly kindOptions: readonly TxSelectOption[] = [
    { value: 'all', label: `Tous (${TX.length})` },
    ...(
      [
        { value: 'security', label: `Titre (${TX.filter((x) => kindOf(x.security) === 'security').length})` },
        { value: 'cash', label: `Trésorerie (${TX.filter((x) => kindOf(x.security) === 'cash').length})` },
      ] as TxSelectOption[]
    ).sort((a, b) => a.label.localeCompare(b.label, 'fr')),
  ];

  // ---- Filtres à sélection multiple (Nature/Type/Compte/Titre) -----------
  /* Listes des filtres triées alphabétiquement sur le libellé affiché, et non dans l'ordre de
     déclaration des données : dans une liste à cocher on cherche une valeur qu'on connaît, cet
     ordre est le seul où on sait où regarder. Le tableau, lui, garde l'ordre métier. */
  protected readonly natKeysAll = (Object.keys(NATURES) as NatureKey[]).sort((a, b) =>
    NATURES[a].label.localeCompare(NATURES[b].label, 'fr'),
  );
  protected readonly natOptions = computed<readonly TxMultiOption[]>(() =>
    this.natKeysAll.map((k) => ({ key: k, label: NATURES[k].label, count: TX.filter((x) => x.nature === k).length, badgeBg: NATURES[k].bg, badgeFg: NATURES[k].fg })),
  );
  protected readonly natAllSelected = computed(() => this.natKeysAll.every((k) => this.natPick().has(k)));
  protected readonly natTrigger = computed(() =>
    this.buildTrigger(this.natKeysAll, this.natPick(), 'Toutes', (k) => NATURES[k]),
  );

  protected readonly typeKeysAll = Object.keys(LEG_RULES).sort((a, b) => a.localeCompare(b, 'fr'));
  protected readonly typeOptions = computed<readonly TxMultiOption[]>(() =>
    /* Mêmes teintes que la pastille Type du tableau : celle de la nature dont relève le code
       (voir tradeTypeBg/tradeTypeFg), et l'indigo générique seulement pour les codes qui n'en
       ont pas. Auparavant tous les types partageaient cet indigo, sans lien avec le tableau. */
    this.typeKeysAll.map((k) => ({
      key: k,
      label: k,
      count: TX.filter((x) => TX_OP[x.ref] === k).length,
      badgeBg: this.tradeTypeBg(k) ?? 'rgba(67,56,202,0.16)',
      badgeFg: this.tradeTypeFg(k) ?? 'var(--ink-code)',
    })),
  );
  protected readonly typeAllSelected = computed(() => this.typeKeysAll.every((k) => this.typePick().has(k)));
  protected readonly typeTrigger = computed(() =>
    this.buildTrigger(this.typeKeysAll, this.typePick(), 'Tous', (k) => ({
      label: k,
      bg: this.tradeTypeBg(k) ?? 'rgba(67,56,202,0.16)',
      fg: this.tradeTypeFg(k) ?? 'var(--ink-code)',
    })),
  );

  protected readonly ACCOUNTS = ACCOUNTS;
  protected readonly SECURITIES = SECURITIES;
  protected readonly accOptions = computed<readonly TxMultiOption[]>(() =>
    ACCOUNTS.map((a) => ({ key: a, label: a, count: TX.filter((t) => accOf(t).indexOf(a) >= 0).length })).sort((x, y) =>
      x.label.localeCompare(y.label, 'fr'),
    ),
  );
  protected readonly accAllSelected = computed(() => ACCOUNTS.every((k) => this.accPick().has(k)));
  protected readonly accTrigger = computed(() =>
    this.buildTrigger(this.ACCOUNTS, this.accPick(), 'Tous', (k) => ({ label: k })),
  );

  protected readonly secOptions = computed<readonly TxMultiOption[]>(() =>
    SECURITIES.map((x) => ({ key: x, label: x, count: TX.filter((t) => secOf(t).indexOf(x) >= 0).length })).sort((a, b) =>
      a.label.localeCompare(b.label, 'fr'),
    ),
  );
  protected readonly secAllSelected = computed(() => SECURITIES.every((k) => this.secPick().has(k)));
  protected readonly secTrigger = computed(() =>
    this.buildTrigger(this.SECURITIES, this.secPick(), 'Tous', (k) => ({ label: k })),
  );

  // ---- Struct ------------------------------------------------------------
  protected readonly structBtnOff = computed(() => !this.selected());
  protected readonly structBtnTitle = computed(() => (this.selected() ? `Structure de la transaction ${this.selected()}` : 'Sélectionnez une transaction pour voir sa structure'));

  // ---- Formulaire « Nouvelle transaction » -------------------------------
  protected readonly formNature = signal<NatureKey>('TRADE');
  protected readonly formType = signal('BUY');
  protected readonly formStatus = signal('');
  protected readonly form = signal<FormState>(initialForm());

  protected readonly allowedTypes = computed(() => NATURES[this.formNature()].types);
  protected readonly ft = computed(() => (this.allowedTypes().includes(this.formType()) ? this.formType() : this.allowedTypes()[0]));
  protected readonly rule = computed(() => LEG_RULES[this.ft()] || LEG_RULES['BUY']);

  protected readonly natureChoices = computed(() => {
    const nature = this.formNature();
    return (Object.keys(NATURES) as NatureKey[]).map((k) => ({ key: k, label: NATURES[k].label, on: nature === k, bg: nature === k ? NATURES[k].fg : NATURES[k].bg, fg: nature === k ? '#ffffff' : NATURES[k].fg }));
  });
  protected readonly natureDesc = computed(() => NATURES[this.formNature()].desc);
  protected readonly typeChoices = computed(() => {
    const ft = this.ft();
    return this.allowedTypes().map((k) => ({ key: k, label: k, on: ft === k, bg: ft === k ? 'var(--field-code)' : 'rgba(67,56,202,0.16)', fg: ft === k ? '#ffffff' : 'var(--ink-code)' }));
  });
  protected readonly legHint = computed(() => this.rule().hint);
  protected readonly legWhy = computed(() => this.rule().why);

  protected readonly qty = computed(() => parseFr(this.form().qty));
  protected readonly price = computed(() => parseFr(this.form().price));
  protected readonly fees = computed(() => parseFr(this.form().fees));
  protected readonly taxes = computed(() => parseFr(this.form().taxes));
  protected readonly cash = computed(() => (this.ft() === 'SELL' ? this.qty() * this.price() - this.fees() - this.taxes() : this.qty() * this.price() + this.fees() + this.taxes()));

  protected readonly fields = computed(() => computeFields(this.ft(), this.form()));
  protected readonly formFields = computed(() => formFieldsView(this.fields(), this.form(), this.qty(), this.price(), this.cash()));
  protected readonly formFields2 = computed(() => formFields2View(this.fields(), this.form()));
  protected readonly hasPanel2Val = computed(() => hasPanel2(this.fields()));
  protected readonly execToggle = computed(() => execToggleOptions(this.fields()));
  // -- Dénouement -------------------------------------------------------------------------
  /**
   * Place qui fait foi pour le dénouement : celle de l'ordre si elle a été fixée, sinon celle
   * où le titre se traite. `XXXX` est le code « toutes places » du formulaire, pas une place.
   */
  private readonly settlementMic = computed(() => {
    const f = this.form();
    if (f.mic && f.mic !== 'XXXX') return f.mic;
    return TRADABLE_SECURITIES.find((s) => s.label === f.security)?.mic ?? '';
  });

  protected readonly settlementRule = computed(() => settlementRuleFor(this.settlementMic()));

  /**
   * Dénouement théorique d'une exécution : le cycle de la place, compté en jours **ouvrés** de
   * cette place. C'est toute la raison d'être du calcul — un T+2 exécuté un vendredi tombe le
   * mardi suivant, et saute en plus les fériés locaux.
   */
  private settlementOf(execIso: string): string {
    if (!execIso) return '';
    const rule = this.settlementRule();
    return this.nonWorking.addBusinessDays(execIso, rule.cycle, rule.zoneId);
  }

  protected readonly execRows = computed(() => {
    const rule = this.settlementRule();
    return execRowsView(this.form()).map((r) => {
      /* Le dénouement reste modifiable à la main : on ne le corrige pas, on signale seulement
         qu'il tombe un jour où la place ne dénoue pas. */
      const off = r.settle ? this.nonWorking.nonWorkingOn(r.settle, rule.zoneId) : null;
      return {
        ...r,
        settleHint: rule.label,
        settleWarn: off
          ? off.kind === 'weekend'
            ? 'Fin de semaine — la place ne dénoue pas'
            : `Férié ${rule.label.split(' · ')[1] ?? ''} — ${off.holiday?.name}`
          : '',
      };
    });
  });
  protected readonly legs = computed(() => computeLegs(this.formNature(), this.ft(), this.form(), this.rule().legs));
  protected readonly formLegs = computed(() => this.legs().map((l, i) => ({ ...l, bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)' })));
  protected readonly legsCount = computed(() => (this.legs().length === 0 ? 'Aucune jambe — le fait vit dans les champs de la transaction' : this.legs().length + (this.legs().length > 1 ? ' jambes' : ' jambe')));

  // -------------------------------------------------------------------------

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected setKindFilter(v: string): void {
    this.kindFilter.set(v as 'all' | 'security' | 'cash');
  }

  protected setStateFilter(v: string): void {
    this.stateFilter.set(v as 'all' | 'pending' | 'settled');
  }

  protected pickSearch(v: string): void {
    this.query.set(v);
  }

  protected pickRef(v: string): void {
    this.refFilter.set(v);
  }

  protected toggleSet<T>(sig: WritableSignal<ReadonlySet<T>>, key: T): void {
    sig.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected toggleAllSet<T>(sig: WritableSignal<ReadonlySet<T>>, all: readonly T[], currentlyAll: boolean): void {
    sig.set(currentlyAll ? new Set() : new Set(all));
  }

  protected toggleMonth(key: string): void {
    this.openMonths.update((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected selectRow(ref: string): void {
    const wasOpen = this.open().has(ref);
    this.open.update((s) => {
      const next = new Set(s);
      if (wasOpen) next.delete(ref);
      else next.add(ref);
      return next;
    });
    this.selected.set(wasOpen ? null : ref);
  }

  protected openStructFromRow(ref: string, e: Event): void {
    e.stopPropagation();
    this.selected.set(ref);
    this.openStruct(ref);
  }

  protected openStructFromSelection(): void {
    const ref = this.selected();
    if (!ref) return;
    this.openStruct(ref);
  }

  private openStruct(ref: string): void {
    this.dialog.open<TxStructDialog, TxStructDialogData>(TxStructDialog, {
      data: { ref },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  protected resetView(): void {
    this.query.set('');
    this.recoPick.set(new Set());
    this.dateFrom.set('');
    this.dateTo.set('');
    this.natPick.set(new Set());
    this.kindFilter.set('all');
    this.typePick.set(new Set());
    this.accPick.set(new Set());
    this.secPick.set(new Set());
    this.refFilter.set('');
    this.opNoFilter.set('');
    this.stateFilter.set('all');
    this.open.set(new Set());
    /* Le regroupement demandé mois par mois fait partie de la vue au même titre que les filtres :
       le laisser en place après une remise à zéro laissait le registre découpé en sous-en-têtes
       sans qu'aucune commande visible n'en rende compte. */
    this.monthGroups.set(new Map());
  }

  protected patchForm(patch: Partial<FormState>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  /** Les expressions de gabarit Angular n'acceptent pas les clés calculées ({ [f.key]: v }) —
   * ce point d'entrée nommé fait le pont depuis le rendu générique des champs dynamiques. */
  protected setFieldValue(key: string, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }) as FormState);
  }

  protected setNature(k: NatureKey): void {
    this.formNature.set(k);
    this.formType.set(NATURES[k].types[0]);
    this.formStatus.set('');
  }

  protected setType(k: string): void {
    this.formType.set(k);
    this.formStatus.set('');
  }

  protected setExecRow(i: number, patch: Partial<ExecRowState>): void {
    /* Déplacer la date d'exécution recale le dénouement sur le cycle de la place. Calculé avant
       la mise à jour : `settlementOf` lit le formulaire, qui n'a pas encore changé — et de
       toute façon ni la place ni le titre ne bougent ici. Une saisie explicite du dénouement
       (`patch.settle`) n'est jamais écrasée. */
    const settle = patch.date !== undefined && patch.settle === undefined ? this.settlementOf(patch.date) : undefined;
    this.form.update((f) => {
      const stored = f.execRows && f.execRows.length ? f.execRows : execRowsView(f).map((r) => ({ date: r.date, qty: r.qty, price: r.price, settle: r.settle }));
      const cur = stored.slice();
      cur[i] = { ...cur[i], ...patch, ...(settle !== undefined ? { settle } : {}) };
      return { ...f, execRows: cur };
    });
  }

  protected setExecQty(i: number, raw: string): void {
    const f = this.form();
    const orderQty = parseFr(f.qty);
    const stored = f.execRows && f.execRows.length ? f.execRows : execRowsView(f).map((r) => ({ date: r.date, qty: r.qty, price: r.price, settle: r.settle }));
    const value = parseFr(raw);
    const others = stored.reduce((n, x, k) => n + (k === i ? 0 : parseFr(x.qty)), 0);
    const capped = orderQty ? Math.max(0, Math.min(value, orderQty - others)) : value;
    this.setExecRow(i, { qty: String(capped) });
  }

  protected addExecRow(): void {
    this.form.update((f) => {
      const orderQty = parseFr(f.qty);
      const rows = f.execRows && f.execRows.length ? f.execRows.slice() : execRowsView(f).map((r) => ({ date: r.date, qty: r.qty, price: r.price, settle: r.settle }));
      const total = rows.reduce((n, r) => n + parseFr(r.qty), 0);
      if (rows.length && orderQty && total >= orderQty) return f;
      /* Nouvelle exécution datée d'aujourd'hui : son dénouement se déduit du cycle de la place
         plutôt que de recopier celui de l'ordre, qui vaut pour une autre date d'exécution. */
      rows.push({ date: TODAY, qty: '', price: '', settle: this.settlementOf(TODAY) || f.settle || '' });
      return { ...f, execRows: rows };
    });
  }

  protected removeExecRow(i: number): void {
    this.form.update((f) => {
      const stored = f.execRows && f.execRows.length ? f.execRows : execRowsView(f).map((r) => ({ date: r.date, qty: r.qty, price: r.price, settle: r.settle }));
      return { ...f, execRows: stored.filter((_, k) => k !== i) };
    });
  }

  /** Le prototype remplace entièrement `form` par un objet à 10 clés (voir `resetForm` de
   * `Transactions.dc.html`) : tif/mic/fill/stratégie n'en font pas partie et redeviennent donc
   * vides — sans effet visible, les sélecteurs retombent sur leur première option par défaut. */
  protected resetForm(): void {
    this.formStatus.set('Saisie annulée.');
    this.form.set({ date: TODAY, settle: '', account: '', security: '', qty: '', price: '', fees: '', taxes: '', amount: '', ratio: '', tif: '', mic: '', fill: '', strategy: '' });
  }

  protected submitForm(): void {
    const legs = this.legs();
    this.formStatus.set(`${this.formNature()} / ${this.ft()} enregistrée — ${legs.length === 0 ? 'aucune jambe' : legs.length + (legs.length > 1 ? ' jambes portées' : ' jambe portée')} au registre.`);
  }
}
