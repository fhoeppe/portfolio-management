import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { NgTemplateOutlet } from '@angular/common';
import {
  ACCOUNTS,
  ACCOUNT_CASH,
  BROKERS,
  QUALITIES,
  STAGES,
  STATES,
  TODAY_ISO,
  type Account,
  type AccountState,
  fr,
  ibanCheck,
  pct,
} from './comptes-data';
import {
  type AcField,
  type AcSelectGroup,
  type CashEntry,
  type CoHolder,
  type FormState,
  type OpKind,
  bankGroups,
  blankForm,
  buildCashRows,
  buildCoRow,
  buildField,
  cashCurrencyGroups,
  opCols,
  opDefs,
} from './comptes-form';
import { dateToIso, isoToDate } from '../../shell/date-bridge';
import {
  ENTRY_LAST_STAGE,
  ENTRY_PHASES,
  KIND_LABEL,
  ONBOARDING_CASES,
  phaseOfStage,
  progress,
  stageLabel,
} from './comptes-onboarding';
import { AcSelect } from './ac-select';
import { AcChips } from './ac-chips';
import { AcDetailDialog, type AcDetailDialogData } from './ac-detail-dialog';
import { AcRecapDialog, type AcRecapDialogData } from './ac-recap-dialog';
import { AcCreateDialog, type AcCreateDialogData, type AcCreateDialogResult } from './ac-create-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'list' | 'ops' | 'entry';

/**
 * Porté depuis `Comptes.dc.html`. Deux onglets réels seulement (`tabs` du prototype, lignes
 * 2747-2749) : « Liste des comptes » et « Gérer compte » — la branche `t.isDetail`/`key==='detail'`
 * du template (ligne 93/2754) est morte, aucun onglet n'a jamais cette clé. Le détail d'un
 * compte (`detailOpen`) est un panneau latéral (`AcDetailDialog`), pas un onglet.
 *
 * Toute la géométrie de positionnement manuel des menus du prototype (`measureAnchor`/
 * `comboGeo`/`openCombo`/`state.combo`) disparaît avec de vrais `MatMenu` (voir `ac-select.ts`/
 * `ac-chips.ts`) : ancrage, défilement et fermeture au clic extérieur ou à Échap viennent du
 * CDK overlay plutôt que d'un état applicatif `combo` à fermer à la main.
 */
@Component({
  selector: 'app-comptes',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, MatStepperModule, MatTableModule, NgTemplateOutlet, AcSelect, AcChips],
  templateUrl: './comptes.html',
  styleUrl: './comptes.css',
})
export class Comptes {
  /* MatDatepicker travaille en `Date`, le domaine en ISO : conversion aux bornes du gabarit
     (voir date-bridge.ts), pour ne rien changer au stockage ni aux comparaisons existantes. */
  protected readonly isoToDate = isoToDate;
  protected readonly dateToIso = dateToIso;

  private readonly dialog = inject(MatDialog);

  // ---- En-tête / liste --------------------------------------------------
  protected readonly tab = signal<Tab>('list');
  protected readonly query = signal('');
  protected readonly statusFilter = signal<'all' | AccountState>('all');
  protected readonly selected = signal<string>('BGM-004');

  protected readonly filtersOff = computed(() => this.tab() !== 'list');
  protected readonly filtersTitle = computed(() => (this.tab() === 'list' ? 'Filtrer la liste des comptes' : "Disponible dans l'onglet Liste des comptes"));

  protected readonly filteredAccounts = computed(() => {
    const q = this.query().trim().toLowerCase();
    const sf = this.statusFilter();
    return ACCOUNTS.filter((a) => {
      if (sf !== 'all' && a.state !== sf) return false;
      if (!q) return true;
      return (a.client + ' ' + a.id + ' ' + a.profile + ' ' + a.manager).toLowerCase().indexOf(q) >= 0;
    });
  });

  protected readonly accountRows = computed(() => this.filteredAccounts().map((a) => this.buildRow(a)));
  protected readonly noAccounts = computed(() => this.filteredAccounts().length === 0);
  protected readonly listNote = computed(() => this.filteredAccounts().length + ' / ' + ACCOUNTS.length);
  protected readonly subtitle = computed(() => {
    const totalAum = ACCOUNTS.reduce((n, a) => n + a.aum, 0);
    const onboarding = ACCOUNTS.filter((a) => a.state === 'onboarding').length;
    return ACCOUNTS.length + ' comptes · ' + fr(totalAum) + ' M€ sous gestion · ' + onboarding + ' en ouverture';
  });

  private buildRow(a: Account) {
    const isBenef = (r: string) => r.toLowerCase().indexOf('bénéficiaire') >= 0;
    const benef = a.holders.filter((h) => isBenef(h.role));
    const cash = ACCOUNT_CASH[a.id];
    const st = STATES[a.state] || STATES['active'];
    const on = a.id === this.selected();
    return {
      id: a.id,
      client: a.client,
      meta: a.manager + ' · ' + a.currency,
      aum: a.aum ? fr(a.aum) + ' M€' : '—',
      perf: a.aum ? pct(a.perf) : 'Non investi',
      perfColor: a.aum === 0 ? 'var(--color-neutral-600)' : a.perf >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
      beneficiaries: benef.length ? String(benef.length) : '—',
      beneficiariesTitle: benef.length ? benef.map((h) => h.name).join(' · ') : 'Aucun bénéficiaire effectif déclaré',
      cashFlag: (cash && cash.flag) || '',
      cashBank: (cash && cash.bank) || 'À rattacher',
      cashMeta: !cash || !cash.bank ? 'Aucun compte espèces' : cash.currency + ' · ' + cash.iban + (cash.extra ? ' · +' + cash.extra + ' secondaire' + (cash.extra > 1 ? 's' : '') : ''),
      state: st.label, stateBg: st.bg, stateFg: st.fg,
      bg: on ? 'var(--color-neutral-100)' : 'var(--surface)',
      mark: on ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'transparent',
      weight: on ? '700' : '500',
      manageOptions: this.manageOptionsFor(a),
    };
  }

  protected manageOptionsFor(a: Account): readonly { readonly key: OpKind; readonly label: string; readonly hint: string; readonly disabled: boolean }[] {
    // Projet / En ouverture : création seule. Actif, Gelé, En clôture : modification ou clôture.
    const opening = a.state === 'onboarding';
    const creatable = opening;
    const modifiable = !opening;
    const closable = !opening;
    const mk = (key: OpKind, label: string, hint: string, ok: boolean) => ({ key, label, hint: ok ? hint : 'Indisponible — ' + hint, disabled: !ok });
    return [
      mk('create', 'Création', creatable ? "Finaliser l'ouverture du compte" : 'le compte est déjà créé', creatable),
      mk('modify', 'Modification', modifiable ? 'Avenant sur le compte existant' : "le compte doit d'abord être créé", modifiable),
      mk('close', 'Clôture', closable ? 'Résiliation et sortie de relation' : "le compte doit d'abord être créé", closable),
    ];
  }


  // ---- Entrée en relation -------------------------------------------------
  protected readonly entryPhases = ENTRY_PHASES;
  protected readonly entryCount = computed(() => ONBOARDING_CASES.length);
  protected readonly selectedCase = signal(ONBOARDING_CASES[0].id);

  private readonly cases = computed(() =>
    ONBOARDING_CASES.map((c) => ({
      ...c,
      kindLabel: KIND_LABEL[c.kind],
      phase: phaseOfStage(c.stage),
      stageLabel: stageLabel(c.stage),
      progress: progress(c.stage),
      aum: `${fr(c.aumTarget / 1000000, 1)} M€`,
      tone: c.blocked ? 'warn' : 'ok',
    })),
  );

  /* Le vivier est présenté par phase plutôt qu'à plat : c'est la phase qui dit à qui la main
     revient — le gérant, la conformité, la direction, le back office. */
  protected readonly entryPipeline = computed(() =>
    ENTRY_PHASES.map((p) => {
      const cases = this.cases().filter((c) => c.stage >= p.from && c.stage <= p.upTo);
      return { label: p.label, count: cases.length, cases };
    }),
  );

  protected readonly entryKpis = computed(() => {
    const all = this.cases();
    const bloques = all.filter((c) => c.blocked).length;
    const avance = all.reduce((n, c) => n + c.progress, 0) / (all.length || 1);
    const pieces = all.reduce((n, c) => n + c.missingDocs.length, 0);
    return [
      { label: 'Dossiers en cours', value: String(all.length), note: `${ENTRY_PHASES.length} phases d'entrée`, tone: 'neutral' },
      { label: 'Avancement moyen', value: `${Math.round(avance)} %`, note: `sur ${ENTRY_LAST_STAGE + 1} étapes`, tone: 'neutral' },
      { label: 'Dossiers bloqués', value: String(bloques), note: bloques ? 'Action de conformité attendue' : 'Aucun blocage', tone: bloques ? 'warn' : 'ok' },
      { label: 'Pièces manquantes', value: String(pieces), note: 'Tous dossiers confondus', tone: pieces ? 'warn' : 'ok' },
    ];
  });

  protected readonly currentCase = computed(
    () => this.cases().find((c) => c.id === this.selectedCase()) ?? this.cases()[0],
  );

  /* Le détail reprend les étapes du cycle de vie d'un compte, arrêtées à l'apport initial :
     l'entrée en relation n'est pas un parcours à part, c'en est la première moitié. */
  protected readonly caseStages = computed(() => {
    const c = this.currentCase();
    return STAGES.slice(0, ENTRY_LAST_STAGE + 1).map((s, i) => ({
      ...s,
      index: i,
      done: i < c.stage,
      current: i === c.stage,
      phase: phaseOfStage(i),
    }));
  });

  protected selectCase(id: string): void {
    this.selectedCase.set(id);
  }

  /* La liste reprend les memes dossiers que le vivier, a plat et tries par avancement
     decroissant : le vivier sert a voir ou chaque dossier en est dans le parcours, la liste a
     les comparer entre eux. Cliquer une ligne selectionne le meme dossier que le vivier. */
  protected readonly entryRows = computed(() =>
    [...this.cases()].sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name, 'fr')),
  );

  protected readonly entryColumns = ['ref', 'case', 'origin', 'stage', 'owner', 'aum', 'progress', 'state'];

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }
  protected setQuery(v: string): void {
    this.query.set(v);
  }
  protected setStatusFilter(v: string): void {
    this.statusFilter.set(v as 'all' | AccountState);
  }
  protected pickAccount(id: string): void {
    this.selected.set(id);
  }
  protected pickManage(id: string, key: OpKind): void {
    this.selected.set(id);
    this.tab.set('ops');
    this.op.set(key);
    this.opStep.set(0);
    this.opStatus.set('');
  }

  protected openDetail(id: string, e?: Event): void {
    if (e) e.stopPropagation();
    this.selected.set(id);
    this.dialog.open<AcDetailDialog, AcDetailDialogData>(AcDetailDialog, {
      data: { accountId: id },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  // ---- Onglet « Gérer compte » -------------------------------------------

  protected readonly op = signal<OpKind>('create');
  protected readonly opStep = signal(0);
  protected readonly opStatus = signal('');
  protected readonly form = signal<FormState>(blankForm());
  protected readonly co = signal<CoHolder[]>([]);
  protected readonly cash = signal<CashEntry[]>([]);
  protected readonly holderPane = signal('main');
  protected readonly cashPane = signal(0);

  protected readonly opKinds: readonly OpKind[] = ['create', 'modify', 'close'];
  protected readonly defs = computed(() => opDefs());
  protected readonly def = computed(() => this.defs()[this.op()]);
  protected readonly currentStepIndex = computed(() => Math.min(this.opStep(), this.def().steps.length - 1));
  protected readonly currentStep = computed(() => this.def().steps[this.currentStepIndex()]);
  protected readonly isLastStep = computed(() => this.currentStepIndex() === this.def().steps.length - 1);
  protected readonly done = computed(() => !!this.opStatus());

  protected readonly opsBadge = computed(() => this.currentStepIndex() + 1 + '/' + this.def().steps.length);

  protected readonly fieldCtx = computed(() => ({
    form: this.form(),
    op: this.op(),
    stepTitle: this.currentStep().title,
    stepFields: this.currentStep().fields,
    done: this.done(),
    last: this.isLastStep(),
  }));

  protected readonly opFields = computed<readonly AcField[]>(() => {
    if (this.currentStep().title === 'Titulaires' && this.holderPane() !== 'main') return [];
    return this.currentStep().fields.map((k) => buildField(k, this.fieldCtx()));
  });
  protected readonly opCashStatusField = computed<AcField | null>(() =>
    this.currentStep().title === 'Compte de liquidité' ? buildField('status', this.fieldCtx()) : null,
  );
  protected readonly opColsValue = computed(() => opCols(this.currentStep().fields));
  protected readonly opStepTitle = computed(() => this.currentStep().title + ' — ' + this.currentStep().hint.toLowerCase());

  protected readonly opSteps = computed(() =>
    this.def().steps.map((s, i) => ({
      title: s.title,
      hint: s.hint,
      badge: String(i + 1),
      isDone: i < this.currentStepIndex(),
      hasLine: i < this.def().steps.length - 1,
    })),
  );

  protected readonly onCashStep = computed(() => this.currentStep().title === 'Compte de liquidité');
  protected readonly onHolderStep = computed(() => this.currentStep().title === 'Titulaires');
  protected readonly onCoPane = computed(() => this.onHolderStep() && this.holderPane() !== 'main');
  protected readonly onCheckStep = computed(() => this.currentStep().title === 'Contrôle');

  protected readonly opChecksView = computed(() =>
    this.currentStep().checks.map((c) => ({ label: c.label, color: c.level === 'warn' ? 'var(--ink-warn-2)' : 'var(--ds-brand-fill, var(--ink-brand-2))' })),
  );

  // ---- Compte(s) de liquidité --------------------------------------------

  protected readonly cashRows = computed(() => buildCashRows(this.form(), this.cash()));
  protected readonly cashSelected = computed(() => {
    const rows = this.cashRows();
    return [rows[this.cashPane()] ?? rows[0]];
  });
  protected readonly cashTabsView = computed(() => {
    const on = this.cashPane() || 0;
    const f = this.form();
    return [{ key: 0, chip: 'P', label: f.cashLabel || 'Compte principal' }, ...this.cash().map((c, i) => ({ key: i + 1, chip: 'S', label: c.bank || 'Établissement ' + (i + 2) }))]
      .map((t) => ({ ...t, active: t.key === on }));
  });
  protected readonly bankGroupsList: readonly AcSelectGroup[] = bankGroups();
  protected readonly cashCurrencyGroupsList: readonly AcSelectGroup[] = cashCurrencyGroups();

  protected pickCashTab(key: number): void {
    this.cashPane.set(key);
  }
  protected addCash(): void {
    this.cashPane.set(this.cash().length + 1);
    this.cash.update((list) => [...list, { bank: '', iban: '', currency: 'EUR' }]);
  }
  protected removeCash(index: number): void {
    if (index === -1) return;
    this.cash.update((list) => list.filter((_, j) => j !== index));
  }
  protected patchCashField(index: number, patch: Partial<CashEntry>): void {
    if (index === -1) {
      this.patchForm({
        cashLabel: patch.bank !== undefined ? patch.bank : this.form().cashLabel,
        cashIban: patch.iban !== undefined ? patch.iban : this.form().cashIban,
        cashCurrency: patch.currency !== undefined ? patch.currency : this.form().cashCurrency,
      });
      return;
    }
    this.cash.update((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }
  protected promoteCash(index: number): void {
    if (index === -1) return;
    const list = this.cash();
    const promoted = list[index];
    if (!promoted) return;
    const demoted: CashEntry = { bank: this.form().cashLabel, iban: this.form().cashIban, currency: this.form().cashCurrency };
    const next = list.slice();
    next[index] = demoted;
    this.cash.set(next);
    this.patchForm({ cashLabel: promoted.bank, cashIban: promoted.iban, cashCurrency: promoted.currency });
  }

  // ---- Co-titulaires ------------------------------------------------------

  protected readonly holderTabsView = computed(() => {
    const f = this.form();
    const on = String(this.holderPane());
    const main = { key: 'main', chip: 'T', label: (f.lastName + ' ' + f.firstName).trim() || 'Titulaire principal' };
    const rest = this.co().map((h, i) => ({ key: String(i), chip: (h.role || 'C').charAt(0).toUpperCase(), label: (h.last + ' ' + h.first).trim() || (h.role || 'Co-titulaire') + ' ' + (i + 1) }));
    return [main, ...rest].map((t) => ({ ...t, active: t.key === on }));
  });
  protected readonly coSelected = computed(() => {
    const hp = this.holderPane();
    if (hp === 'main') return [];
    const i = Number(hp);
    const h = this.co()[i];
    return h ? [buildCoRow(i, h, this.form().clientRef)] : [];
  });
  protected readonly qualityGroups: readonly AcSelectGroup[] = [{ heading: '', flag: '', options: QUALITIES.map((q) => ({ value: q, label: q })) }];

  protected pickHolderTab(key: string): void {
    this.holderPane.set(key);
  }
  protected addCo(): void {
    this.holderPane.set(String(this.co().length));
    this.co.update((list) => [...list, { last: '', first: '', role: 'Co-titulaire' }]);
  }
  protected removeCo(index: number): void {
    this.holderPane.set('main');
    this.co.update((list) => list.filter((_, j) => j !== index));
  }
  protected setCoLast(index: number, v: string): void {
    this.co.update((list) => list.map((h, j) => (j === index ? { ...h, last: v } : h)));
  }
  protected setCoFirst(index: number, v: string): void {
    this.co.update((list) => list.map((h, j) => (j === index ? { ...h, first: v } : h)));
  }
  protected setCoRole(index: number, v: string): void {
    this.co.update((list) => list.map((h, j) => (j === index ? { ...h, role: v } : h)));
  }

  // ---- Champs du formulaire -----------------------------------------------

  protected patchForm(patch: Partial<FormState>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  protected setField(key: string, value: string): void {
    if (key === 'broker') {
      const b = BROKERS.find((x) => x.label === value);
      this.patchForm({ broker: value, jurisdiction: b ? b.country : this.form().jurisdiction, url: b ? b.url : this.form().url });
      return;
    }
    if (key === 'taxRegime') {
      this.patchForm({ taxRegime: 'Résident ' + value });
      return;
    }
    if (key === 'status') {
      this.patchForm({ statusChoice: value });
      return;
    }
    this.patchForm({ [key]: value } as Partial<FormState>);
  }

  protected setNumber(value: string): void {
    this.patchForm({ number: value.replace(/[^0-9]/g, '').slice(0, 16) });
  }

  protected setOpenedDate(value: string): void {
    this.patchForm({ opened: value && value > TODAY_ISO ? TODAY_ISO : value });
  }
  protected setClosedDate(value: string): void {
    this.patchForm({ closed: value || '—' });
  }
  protected setKycExpiry(value: string): void {
    this.patchForm({ kycIdExpiry: value });
  }

  protected setDateField(key: string, value: string): void {
    if (key === 'opened') { this.setOpenedDate(value); return; }
    if (key === 'closed') { this.setClosedDate(value); return; }
    if (key === 'kycIdExpiry') { this.setKycExpiry(value); return; }
    this.patchForm({ [key]: value } as Partial<FormState>);
  }

  protected setTextField(key: string, value: string): void {
    if (key === 'number') { this.setNumber(value); return; }
    this.patchForm({ [key]: value } as Partial<FormState>);
  }

  protected toggleKycOrigin(value: string): void {
    const chips = this.form().kycOrigin.split(' · ').filter(Boolean);
    const next = chips.includes(value) ? chips.filter((x) => x !== value) : chips.concat([value]);
    this.patchForm({ kycOrigin: next.join(' · ') });
  }

  // ---- Navigation de l'assistant ------------------------------------------

  protected switchOp(k: OpKind): void {
    this.op.set(k);
    this.opStep.set(0);
    this.opStatus.set('');
  }
  protected goStep(i: number): void {
    this.opStep.set(i);
  }

  protected readonly ibanMainState = computed(() => ibanCheck(this.form().cashIban).state);
  protected readonly opNextBlocked = computed(() => this.currentStep().title === 'Compte de liquidité' && this.ibanMainState() !== 'ok');
  protected readonly opNextLabel = computed(() => (this.isLastStep() ? this.def().next : 'Suivant'));
  protected readonly opPrevLabel = computed(() => (this.currentStepIndex() === 0 ? 'Annuler' : 'Précédent'));
  protected readonly opDraftDisabled = computed(() => this.currentStepIndex() === 0);

  protected opPrev(): void {
    if (this.opStep() > 0) {
      this.opStep.update((s) => s - 1);
      return;
    }
    this.form.set(blankForm());
    this.co.set([]);
    this.opStatus.set('Saisie effacée — le formulaire est prêt pour une prochaine création.');
  }

  protected opNext(): void {
    if (this.opNextBlocked()) {
      this.opStatus.set('');
      return;
    }
    if (this.currentStepIndex() < this.def().steps.length - 1) {
      this.opStep.update((s) => s + 1);
      this.opStatus.set('');
      return;
    }
    if (this.op() === 'create') {
      this.openCreateDialog();
      return;
    }
    this.opStatus.set(this.def().label + ' enregistrée — dossier transmis au contrôle interne.');
  }

  protected opDraft(): void {
    if (this.opDraftDisabled()) return;
    this.opStatus.set('Brouillon enregistré — la saisie sera reprise à l\'étape ' + this.currentStep().title + '.');
  }

  protected opReset(): void {
    this.form.set(blankForm());
    this.co.set([]);
    this.cash.set([]);
    this.opStep.set(0);
    this.holderPane.set('main');
    this.cashPane.set(0);
    this.opStatus.set('Saisie réinitialisée.');
  }

  // ---- Récapitulatif / création ------------------------------------------

  protected openRecap(): void {
    this.dialog.open<AcRecapDialog, AcRecapDialogData>(AcRecapDialog, {
      data: { form: this.form, co: this.co, cash: this.cash },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  protected openCreateDialog(): void {
    const ref = this.dialog.open<AcCreateDialog, AcCreateDialogData, AcCreateDialogResult>(AcCreateDialog, {
      data: { form: this.form, cash: this.cash },
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'ok') {
        this.form.set(blankForm());
        this.co.set([]);
        this.cash.set([]);
        this.opStep.set(0);
        this.holderPane.set('main');
        this.cashPane.set(0);
        this.opStatus.set('Compte créé — le formulaire est réinitialisé pour une nouvelle création.');
      }
    });
  }
}
