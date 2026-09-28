import { Component, computed, effect, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { NgTemplateOutlet } from '@angular/common';
import {
  ACCOUNTS,
  ACCOUNT_BROKERS,
  ACCOUNT_CASH,
  BROKERS,
  FIELD_ICONS,
  QUALITIES,
  STATES,
  TODAY_ISO,
  type Account,
  type AccountState,
  type Broker,
  fr,
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
  blankTitre,
  blankTitreFields,
  cashCurrencyGroups,
  holderIssues,
  titreFields,
  titreFromForm,
  titreIssues,
  type TitreEntry,
  holderKey,
  nextClientRef,
  opCols,
  opDefs,
} from './comptes-form';
import { dateToIso, isoToDate } from '../../shell/date-bridge';
import { AcSelect } from './ac-select';
import { AcMultiSelect, type AcMultiOption } from './ac-multiselect';
import { FXR, PORTFOLIOS, fr2, pnlTone, signedPct } from '../positions/positions-data';
import { AcDetailDialog, type AcDetailDialogData } from './ac-detail-dialog';
import { AcRecapDialog, type AcRecapDialogData } from './ac-recap-dialog';
import { AcCreateDialog, type AcCreateDialogData, type AcCreateDialogResult } from './ac-create-dialog';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';
import { ViewStateService } from '../../shell/view-state.service';
import { COUNTRIES } from '../../domain/countries';

type Tab = 'list' | 'ops';

/**
 * Porté depuis `Comptes.dc.html`. Deux onglets réels seulement (`tabs` du prototype, lignes
 * 2747-2749) : « Liste des comptes » et « Gérer compte » — la branche `t.isDetail`/`key==='detail'`
 * du template (ligne 93/2754) est morte, aucun onglet n'a jamais cette clé. Le détail d'un
 * compte (`detailOpen`) est un panneau latéral (`AcDetailDialog`), pas un onglet.
 *
 * Toute la géométrie de positionnement manuel des menus du prototype (`measureAnchor`/
 * `comboGeo`/`openCombo`/`state.combo`) disparaît avec de vrais `MatMenu` (voir `ac-select.ts`/
 * `ac-multiselect.ts`) : ancrage, défilement et fermeture au clic extérieur ou à Échap viennent du
 * CDK overlay plutôt que d'un état applicatif `combo` à fermer à la main.
 */
/* Le compte porte le NOM de son pays de domiciliation, pas son code ISO : le référentiel des pays
   est donc indexé par nom pour retrouver le drapeau. Fait une fois au chargement du module — la
   liste compte plus de deux cents entrées, la parcourir à chaque ligne de tableau serait du
   gâchis. */
const FLAG_BY_COUNTRY = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c.flag]));

@Component({
  selector: 'app-comptes',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, MatStepperModule, NgTemplateOutlet, AcSelect, AcMultiSelect],
  templateUrl: './comptes.html',
  styleUrl: './comptes.css',
})
export class Comptes {
  /* MatDatepicker travaille en `Date`, le domaine en ISO : conversion aux bornes du gabarit
     (voir date-bridge.ts), pour ne rien changer au stockage ni aux comparaisons existantes. */
  protected readonly isoToDate = isoToDate;
  protected readonly dateToIso = dateToIso;

  private readonly dialog = inject(MatDialog);

  /* Le routeur détruit cette page à chaque navigation : ce qui relève de l'état d'affichage —
     onglet ouvert, recherche, filtres, tableaux dépliés, saisie en cours du parcours « Gérer
     compte » — est emprunté au service plutôt que déclaré ici, sans quoi tout repartirait à zéro
     au retour sur l'écran. Même recette que Titres et Calendrier. */
  private readonly viewState = inject(ViewStateService);

  // ---- En-tête / liste --------------------------------------------------
  protected readonly tab = this.viewState.remember<Tab>('comptes.tab', 'list');
  protected readonly query = this.viewState.remember('comptes.query', '');
  /**
   * États retenus. Ensemble vide = aucun filtre, et non « aucun état » : c'est la lecture de tous
   * les filtres à cases de l'application, et elle évite qu'une liste vide soit le résultat par
   * défaut d'un filtre qu'on vient d'ouvrir.
   */
  protected readonly statusPick = this.viewState.remember<ReadonlySet<AccountState>>('comptes.statusPick', new Set());

  protected readonly statusOptions = computed<readonly AcMultiOption[]>(() =>
    (['active', 'onboarding', 'frozen', 'closing', 'closed'] as const).map((key) => {
      const st = STATES[key];
      return {
        key,
        label: st.label,
        /* La pastille de l'option porte les couleurs de l'état, comme la colonne : on reconnaît
           « Gelé » à sa teinte avant d'avoir lu le mot. */
        badgeBg: st.bg,
        badgeFg: st.fg,
        count: ACCOUNTS.filter((a) => a.state === key).length,
      };
    }),
  );

  protected readonly statusAllSelected = computed(() => this.statusPick().size === this.statusOptions().length);
  protected readonly statusTriggerLabel = computed(() => {
    const picked = this.statusPick();
    if (!picked.size || picked.size === this.statusOptions().length) return 'Tous';
    const first = this.statusOptions().find((o) => picked.has(o.key as AccountState));
    return first ? first.label : 'Tous';
  });
  /* « +2 » quand plusieurs états sont cochés : le déclencheur nomme le premier et compte le reste,
     faute de quoi il faudrait rouvrir le menu pour savoir ce qui filtre. */
  protected readonly statusTriggerMore = computed(() => (this.statusPick().size > 1 ? '+' + (this.statusPick().size - 1) : ''));
  protected readonly selected = this.viewState.remember('comptes.selected', 'BGM-004');

  protected readonly filtersOff = computed(() => this.tab() !== 'list');
  protected readonly filtersTitle = computed(() => (this.tab() === 'list' ? 'Filtrer la liste des comptes' : "Disponible dans l'onglet Liste des comptes"));

  /* Filtres de colonne, distincts de la recherche : celle-ci cherche un compte sans savoir où,
     ceux-là restreignent une colonne qu'on regarde. Les deux se cumulent. */
  /**
   * Comptes dont le tableau des brokers est déplié.
   *
   * Un ensemble et non une clé unique : comparer deux clients suppose de voir leurs brokers en
   * même temps, et refermer l'un pour ouvrir l'autre obligerait à retenir ce qu'on vient de lire.
   */
  protected readonly expanded = this.viewState.remember<ReadonlySet<string>>('comptes.expanded', new Set());

  protected readonly colClient = this.viewState.remember('comptes.colClient', '');
  protected readonly colRef = this.viewState.remember('comptes.colRef', '');
  protected readonly colCountry = this.viewState.remember('comptes.colCountry', 'all');

  /**
   * Les pays effectivement présents, pour que le filtre ne propose jamais une liste vide.
   *
   * La valeur reste le nom seul — c'est lui que le compte porte et sur lequel le filtre compare ;
   * le drapeau n'appartient qu'au libellé affiché, où il sert de repère avant même la lecture.
   */
  protected readonly countryOptions = computed(() =>
    [...new Set(ACCOUNTS.map((a) => a.domicile))]
      .sort((x, y) => x.localeCompare(y, 'fr'))
      .map((name) => {
        const flag = FLAG_BY_COUNTRY.get(name.toLowerCase()) ?? '';
        return { value: name, label: flag ? `${flag} ${name}` : name };
      }),
  );

  protected readonly filtersActive = computed(
    () => !!this.query().trim() || this.statusPick().size > 0 || !!this.colClient().trim() || !!this.colRef().trim() || this.colCountry() !== 'all',
  );

  /**
   * Ce sur quoi la recherche porte : nom, broker, bénéficiaire, référence.
   *
   * « Broker » n'est pas un champ du compte — les comptes portent un dépositaire, et leur compte
   * espèces une banque. Ce sont les deux établissements auxquels un compte est rattaché, et c'est
   * à eux que la recherche répond : demander « Spuerkeess » ou « dépositaire » doit ramener le
   * compte, quel que soit celui des deux qui porte le nom.
   */
  private searchIndex(a: Account): string {
    const cash = ACCOUNT_CASH[a.id];
    const benef = a.holders.filter((h) => h.role.toLowerCase().indexOf('bénéficiaire') >= 0).map((h) => h.name).join(' ');
    return [a.client, a.custodian, cash?.bank ?? '', benef, a.id, a.domicile].join(' ').toLowerCase();
  }

  protected readonly filteredAccounts = computed(() => {
    const q = this.query().trim().toLowerCase();
    const picked = this.statusPick();
    const client = this.colClient().trim().toLowerCase();
    const ref = this.colRef().trim().toLowerCase();
    const country = this.colCountry();

    return ACCOUNTS.filter((a) => {
      if (picked.size && !picked.has(a.state)) return false;
      if (q && this.searchIndex(a).indexOf(q) < 0) return false;
      if (client && (a.client + ' ' + a.manager).toLowerCase().indexOf(client) < 0) return false;
      if (ref && a.id.toLowerCase().indexOf(ref) < 0) return false;
      if (country !== 'all' && a.domicile !== country) return false;
      return true;
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

  /**
   * Les brokers rattachés au compte, avec ce qu'on tient chez chacun.
   *
   * Le rattachement vient de `ACCOUNT_BROKERS` (une graine, voir son commentaire) ; l'encours et
   * la performance, eux, sont calculés sur les comptes courtiers de l'écran Positions, avec la
   * formule de cet écran — cours × quantité converti par `FXR`, plus les espèces — pour que deux
   * écrans ne puissent pas annoncer deux encours différents. Un broker rattaché mais sans compte
   * courtier chez nous affiche « — » plutôt que zéro : ne rien détenir et détenir zéro ne se
   * lisent pas pareil.
   */
  private brokerRows(a: Account) {
    const names = ACCOUNT_BROKERS[a.id] ?? [];

    return names
      .map((name) => BROKERS.find((b) => b.label === name))
      .filter((b): b is Broker => !!b)
      .flatMap((b) => {
        const identite = {
          label: b.label,
          flag: b.flag,
          place: b.place,
          url: b.url,
          /* Le domaine seul : l'adresse complète déborderait la colonne, et c'est lui qu'on lit
             pour reconnaître un établissement. Le lien, lui, garde l'URL entière. */
          host: b.url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        };

        const comptes = PORTFOLIOS.filter((pf) => pf.label.startsWith(b.label));

        /* Un broker rattaché sans compte courtier chez nous garde sa ligne : c'est un
           rattachement déclaré dont il reste à ouvrir le compte, et le taire donnerait une liste
           plus courte que le décompte de la colonne. */
        if (!comptes.length) {
          return [{ ...identite, account: '—', accountType: '—', aum: '—', perf: '—', perfColor: 'var(--color-neutral-600)' }];
        }

        /* Une ligne par compte, et non par broker : un même courtier en tient plusieurs — CTO et
           PEA chez Bourse Direct — qui n'ont ni le même régime ni le même encours, et les
           additionner masquerait précisément ce qu'on vient lire. */
        return comptes.map((pf) => {
          const market = pf.positions.reduce((m, p) => m + p.qty * p.price * (FXR[p.currency] || 1), 0);
          const cost = pf.positions.reduce((m, p) => m + p.qty * p.pru * (FXR[p.currency] || 1), 0);
          return {
            ...identite,
            /* Le jeu de données ne porte pas de numéro de compte chez le courtier : l'identifiant
               du compte courtier (`DG-CTO`) est ce qui en tient lieu dans toute l'application. */
            account: pf.id,
            accountType: pf.id.split('-')[1] ?? '—',
            aum: fr2(market + pf.cash) + ' EUR',
            perf: cost ? signedPct(((market - cost) / cost) * 100) : '—',
            perfColor: cost ? pnlTone(market - cost) : 'var(--color-neutral-600)',
          };
        });
      });
  }

  private buildRow(a: Account) {
    const isBenef = (r: string) => r.toLowerCase().indexOf('bénéficiaire') >= 0;
    const benef = a.holders.filter((h) => isBenef(h.role));
    const brokers = this.brokerRows(a);
    const etablissements = new Set(brokers.map((b) => b.label)).size;
    const comptes = brokers.filter((b) => b.account !== '—').length;
    const st = STATES[a.state] || STATES['active'];
    const on = a.id === this.selected();
    return {
      id: a.id,
      client: a.client,
      meta: a.manager + ' · ' + a.currency,
      aum: a.aum ? fr(a.aum) + ' M€' : '—',
      perf: a.aum ? pct(a.perf) : 'Non investi',
      perfColor: a.aum === 0 ? 'var(--color-neutral-600)' : a.perf >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
      /* Un compte clôturé ne se modifie plus et n'a plus à être isolé pour être travaillé : les
         deux commandes qui mènent à une suite — la loupe et le crayon — se grisent. Un compte
         « en clôture », lui, est encore en vie : on y liquide, on y transfère, ses commandes
         restent actives. La fiche reste ouverte dans les deux cas — consulter un compte fermé est
         précisément ce qu'on veut pouvoir faire. */
      closed: a.state === 'closed',
      brokers,
      /* Le compte de la colonne est celui des LIGNES du tableau déplié, et non celui des
         établissements : un chiffre qui annonce trois et ouvre sur quatre lignes fait douter des
         deux. Bourse Direct compte donc deux fois, une par compte. */
      brokerCount: brokers.length ? String(brokers.length) : '—',
      /* L'info-bulle nomme ces mêmes lignes, compte par compte : le nombre seul dit qu'il y en a
         quatre, pas lesquelles, et c'est souvent la question qu'on se pose avant de déplier. */
      brokersTitle: brokers.length
        ? brokers.map((b) => (b.account === '—' ? b.label : b.label + ' — ' + b.account)).join(' · ')
        : 'Aucun broker rattaché',
      brokersNote: etablissements
        ? etablissements + ' broker' + (etablissements > 1 ? 's' : '') + ' · ' + comptes + ' compte' + (comptes > 1 ? 's' : '') + ' ouvert' + (comptes > 1 ? 's' : '')
        : 'aucun',
      country: a.domicile,
      countryFlag: FLAG_BY_COUNTRY.get(a.domicile.toLowerCase()) ?? '',
      beneficiaries: benef.length ? String(benef.length) : '—',
      beneficiariesTitle: benef.length ? benef.map((h) => h.name).join(' · ') : 'Aucun bénéficiaire effectif déclaré',
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
    const shut = a.state === 'closed';
    const creatable = opening;
    const modifiable = !opening && !shut;
    const closable = !opening && !shut;
    const mk = (key: OpKind, label: string, hint: string, ok: boolean) => ({ key, label, hint: ok ? hint : 'Indisponible — ' + hint, disabled: !ok });
    return [
      mk('create', 'Création', creatable ? "Finaliser l'ouverture du compte" : 'le compte est déjà créé', creatable),
      mk('modify', 'Modification', modifiable ? 'Avenant sur le compte existant' : shut ? 'le compte est clôturé' : "le compte doit d'abord être créé", modifiable),
      mk('close', 'Clôture', closable ? 'Résiliation et sortie de relation' : shut ? 'le compte est déjà clôturé' : "le compte doit d'abord être créé", closable),
    ];
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }
  protected setQuery(v: string): void {
    this.query.set(v);
  }
  protected toggleStatus(key: string): void {
    this.statusPick.update((cur) => {
      const next = new Set(cur);
      if (!next.delete(key as AccountState)) next.add(key as AccountState);
      return next;
    });
  }
  protected toggleAllStatus(): void {
    this.statusPick.update((cur) =>
      cur.size === this.statusOptions().length ? new Set<AccountState>() : new Set(this.statusOptions().map((o) => o.key as AccountState)),
    );
  }
  protected setColFilter(key: 'client' | 'ref', v: string): void {
    ({ client: this.colClient, ref: this.colRef })[key].set(v);
  }
  protected setCountryFilter(v: string): void {
    this.colCountry.set(v);
  }
  protected clearFilters(): void {
    this.query.set('');
    this.statusPick.set(new Set());
    this.colClient.set('');
    this.colRef.set('');
    this.colCountry.set('all');
  }
  /**
   * Déplie ou replie, sous la ligne, les brokers rattachés au compte — comme le registre des
   * transactions déplie les jambes d'une transaction sous la sienne.
   *
   * Autant de dépliés que voulu : chacun se referme par sa propre loupe.
   */
  protected toggleBrokers(id: string, e?: Event): void {
    if (e) e.stopPropagation();
    this.selected.set(id);
    this.expanded.update((cur) => {
      const next = new Set(cur);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** Referme tout : une seule commande quand plusieurs tableaux sont ouverts. */
  protected collapseAllBrokers(): void {
    this.expanded.set(new Set());
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

  // ---- Onglet « Gérer compte portefeuille » --------------------------------

  protected readonly op = this.viewState.remember<OpKind>('comptes.op', 'create');
  protected readonly opStep = this.viewState.remember('comptes.opStep', 0);
  protected readonly opStatus = this.viewState.remember('comptes.opStatus', '');
  /* Compte créé : le dossier reste affiché, verrouillé en lecture seule, jusqu'à ce qu'on
     demande une nouvelle création. Remettre le formulaire à blanc dès la création rendait tous
     les champs saisissables à l'instant même où le compte venait d'être figé — et effaçait ce
     qu'on venait de vérifier. */
  protected readonly created = this.viewState.remember('comptes.created', false);
  protected readonly locked = computed(() => this.op() === 'create' && this.created());
  /* La saisie en cours fait partie de l'état de la page, et c'est même le morceau qui coûte le
     plus cher à perdre : quitter l'écran pour vérifier une référence et revenir devant un
     formulaire vidé est la façon la plus sûre de faire recommencer quelqu'un. */
  protected readonly form = this.viewState.remember<FormState>('comptes.form', blankForm());
  protected readonly co = this.viewState.remember<CoHolder[]>('comptes.co', []);
  protected readonly cash = this.viewState.remember<CashEntry[]>('comptes.cash', []);
  /* Les comptes titre déjà versés au dossier ; le bloc de saisie n'en est que le brouillon du
     prochain. */
  protected readonly titres = this.viewState.remember<TitreEntry[]>('comptes.titres', []);
  /* Le compte titre déplié — celui que les champs du formulaire et le tableau des comptes de
     liquidité éditent. -1 : tous repliés. Un seul à la fois : les champs sont un tampon unique,
     partagé par tous les comptes, chargé au dépliage et recopié vers le compte à chaque frappe. */
  protected readonly activeTitre = this.viewState.remember('comptes.activeTitre', -1);
  /* Ce que valait le compte déplié à son ouverture — « Annuler » y revient — et s'il vient d'être
     ouvert par « Ajouter » : alors « Annuler » le retire, et le bouton de validation s'appelle
     « Ajouter » plutôt qu'« OK ». `titreTried` : « OK » a été demandé sur un compte incomplet, la
     liste des manques s'affiche sous ses champs. */
  private readonly titreSnapshot = this.viewState.remember<TitreEntry | null>('comptes.titreSnapshot', null);
  protected readonly titreIsNew = this.viewState.remember('comptes.titreIsNew', false);
  protected readonly titreTried = this.viewState.remember('comptes.titreTried', false);
  protected readonly holderPane = this.viewState.remember('comptes.holderPane', 'main');

  protected readonly opKinds: readonly OpKind[] = ['create', 'modify', 'close'];
  protected readonly defs = computed(() => opDefs());
  /* L'onglet décide du jeu d'étapes, la pastille ne décide que du genre d'opération : l'ouverture
     des comptes a son propre onglet et aucune pastille, tout en partageant le même moteur. */
  protected readonly def = computed(() => this.defs()[this.op()]);
  protected readonly currentStepIndex = computed(() => Math.min(this.opStep(), this.def().steps.length - 1));
  protected readonly currentStep = computed(() => this.def().steps[this.currentStepIndex()]);
  protected readonly isLastStep = computed(() => this.currentStepIndex() === this.def().steps.length - 1);
  /* « Terminé » ne se déduit plus du compte rendu de pied de page : tout message y passe
     (« Titulaires vérifiés », « Saisie effacée »…) et chacun figeait le statut sur Actif comme si
     le compte existait. Seule une opération réellement aboutie — compte créé, avenant ou clôture
     enregistrés — le déclare. */
  private readonly opDone = this.viewState.remember('comptes.opDone', false);
  protected readonly done = computed(() => this.opDone());

  /* Sur l'onglet actif, la pastille dit où l'on en est ; ailleurs, elle ne dit que le nombre
     d'étapes — afficher « 2/3 » sur un parcours qu'on ne regarde pas laisserait croire qu'il est
     commencé. */
  protected readonly opsBadge = computed(() => {
    const total = this.def().steps.length;
    return this.tab() === 'ops' ? `${this.currentStepIndex() + 1}/${total}` : String(total);
  });

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
  /* Le statut conclut les deux blocs de l'étape des comptes : il ne figure pas dans la grille
     du compte titre, il vient après le compte de liquidité, seul sur sa ligne. */
  protected readonly opCashStatusField = computed<AcField | null>(() =>
    this.currentStep().withCash ? buildField('status', this.fieldCtx()) : null,
  );
  protected readonly opColsValue = computed(() => opCols(this.currentStep().fields));
  /* Repère d'étape porté par la grille, pour les rares réglages qui ne valent que sur l'une
     d'elles — la largeur du statut à l'étape de contrôle. Déduit des champs plutôt que du titre :
     un intitulé se réécrit, la composition d'une étape non. */
  protected readonly opStepKey = computed(() => {
    const f = this.currentStep().fields;
    if (f.includes('lastName')) return 'titulaires';
    if (f.includes('broker')) return 'compte-titre';
    if (f.includes('closed')) return 'controle';
    return 'autre';
  });
  protected labelIcon(key: string): string {
    return FIELD_ICONS[key] || '';
  }
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

  protected readonly onCashStep = computed(() => !!this.currentStep().withCash);
  protected readonly onHolderStep = computed(() => this.currentStep().title === 'Titulaires');
  protected readonly onCoPane = computed(() => this.onHolderStep() && this.holderPane() !== 'main');
  /* Le rappel « Vérifier la saisie » ouvre le récapitulatif : sur l'étape Contrôle des
     opérations qui en ont une, et sur l'étape des comptes quand elle conclut le parcours — c'est
     elle qui crée le compte, désormais. */
  protected readonly onCheckStep = computed(() => this.currentStep().title === 'Contrôle' || (this.onCashStep() && this.isLastStep()));

  // ---- Comptes titre du dossier -------------------------------------------

  constructor() {
    /* Recopie du tampon vers le compte déplié : chaque modification des champs ou du tableau des
       comptes de liquidité met à jour le compte titre concerné, sans étape « enregistrer ». */
    effect(() => {
      const i = this.activeTitre();
      if (i < 0) return;
      const entry = titreFromForm(this.form(), this.cash());
      this.titres.update((list) => (i < list.length ? list.map((t, j) => (j === i ? entry : t)) : list));
    });
  }

  protected readonly titreViews = computed(() =>
    this.titres().map((t, index) => {
      const missing = titreIssues(t, t.cash);
      const b = BROKERS.find((x) => x.label === t.broker);
      const parts = [t.broker ? (b ? b.flag + ' ' : '') + t.broker : '', t.accountType, t.number ? 'n° ' + t.number : ''].filter(Boolean);
      return {
        index,
        title: t.alias || 'Compte titre ' + (index + 1),
        hint: parts.length ? parts.join(' · ') : 'À renseigner',
        missing,
        state: missing.length ? `${missing.length} à compléter` : 'Complet',
        open: index === this.activeTitre(),
      };
    }),
  );
  protected readonly titresIncomplete = computed(() => this.titreViews().filter((t) => t.missing.length).length);
  /* Un seul compte titre en cours à la fois : tant qu'un bloc est ouvert, « Ajouter » reste
     grisé — c'est « Valider » qui le rend disponible, une fois le compte versé au dossier. En
     ouvrir un second par-dessus laisserait le premier à moitié renseigné sans rien dire. */
  protected readonly titreAddDisabled = computed(() => this.activeTitre() >= 0);
  protected readonly titreAddNote = computed(() => {
    const n = this.titres().length;
    if (this.titreAddDisabled()) {
      const name = this.titres()[this.activeTitre()]?.alias;
      return `Validez ${name ? '« ' + name + ' »' : 'le compte titre ouvert'} pour pouvoir en ajouter un autre.`;
    }
    if (!n) return "Aucun compte titre au dossier — « Ajouter » en ouvre un, à renseigner avec son compte de liquidité.";
    const inc = this.titresIncomplete();
    return `${n} compte${n > 1 ? 's' : ''} titre au dossier` + (inc ? ` · ${inc} à compléter.` : ' · tous complets.') + " « Ajouter » en ouvre un autre.";
  });
  /* Charge le compte `i` dans le tampon de saisie — ou vide le tampon quand plus rien n'est
     déplié, pour qu'aucune valeur d'un compte ne traîne dans les champs d'un autre. */
  private loadTitre(i: number, isNew = false): void {
    const t = this.titres()[i];
    this.activeTitre.set(t ? i : -1);
    this.titreSnapshot.set(t ?? null);
    this.titreIsNew.set(!!t && isNew);
    this.titreTried.set(false);
    this.patchForm(t ? titreFields(t) : blankTitreFields());
    this.cash.set(t ? [...t.cash] : []);
  }
  /* « Ajouter » ouvre un compte titre vierge, déplié, prêt à être renseigné. */
  protected addTitre(): void {
    this.titres.update((list) => [...list, blankTitre()]);
    this.loadTitre(this.titres().length - 1, true);
    this.opStatus.set('');
  }
  protected toggleTitre(index: number): void {
    this.loadTitre(index === this.activeTitre() ? -1 : index);
  }
  /* Vérification du compte déplié : « Ajouter » ne s'allume qu'une fois la saisie relue et
     validée dans le panneau. L'empreinte est le contenu même du compte — le modifier après coup
     périme la vérification, et il faut la repasser. */
  private readonly titreVerifiedKey = this.viewState.remember('comptes.titreVerifiedKey', '');
  private readonly activeTitreKey = computed(() => {
    const t = this.titres()[this.activeTitre()];
    return t ? JSON.stringify(t) : '';
  });
  protected readonly titreVerified = computed(() => !!this.activeTitreKey() && this.titreVerifiedKey() === this.activeTitreKey());
  protected readonly titreConfirmBlocked = computed(() => this.activeTitre() < 0 || !this.titreVerified());
  protected readonly titreConfirmNote = computed(() => {
    if (!this.titreConfirmBlocked()) return 'Verse ce compte titre et son compte de liquidité au dossier';
    return this.activeTitreIssues().length
      ? 'À renseigner : ' + this.activeTitreIssues().join(', ') + ' — puis « Vérifier la saisie ».'
      : 'Vérifiez la saisie et validez-la dans le panneau pour activer « Ajouter ».';
  });

  /* Manques du compte déplié, tels que « Valider » les a constatés. */
  protected readonly activeTitreIssues = computed(() => {
    const t = this.titreViews()[this.activeTitre()];
    return t ? t.missing : [];
  });
  /* « OK » / « Ajouter » : le compte est validé s'il est complet — il se replie, et le dossier le
     compte ; sinon il reste ouvert et dit ce qui manque. */
  protected confirmTitre(): void {
    const i = this.activeTitre();
    if (i < 0) return;
    if (this.titreConfirmBlocked()) {
      this.titreTried.set(true);
      return;
    }
    const alias = this.titres()[i]?.alias || 'Compte titre ' + (i + 1);
    const wasNew = this.titreIsNew();
    this.loadTitre(-1);
    this.opStatus.set(`Compte titre « ${alias} » ${wasNew ? 'ajouté' : 'validé'} — ${this.titres().length} au dossier.`);
  }
  /* « Vérifier la saisie » du bloc : relit ce seul compte titre — le broker et ses comptes de
     liquidité — et conclut par « Ajouter », qui vaut le bouton du bloc. */
  protected verifyTitre(): void {
    this.openRecap('Récapitulatif des comptes titres', 'titres', 'Valider')
      .afterClosed()
      .subscribe((result) => {
        if (result !== 'ok') return;
        /* Validé : « Ajouter » s'allume si le compte est complet ; sinon la relecture n'a fait
           que confirmer ce qui manque, et le bloc l'affiche. */
        if (this.activeTitreIssues().length) {
          this.titreTried.set(true);
          return;
        }
        this.titreVerifiedKey.set(this.activeTitreKey());
        this.titreTried.set(false);
      });
  }

  /* « Annuler » : un compte qui vient d'être ajouté est retiré ; un compte existant retrouve ce
     qu'il valait à l'ouverture. Dans les deux cas le bloc se replie. */
  protected cancelTitre(): void {
    const i = this.activeTitre();
    if (i < 0) return;
    if (this.titreIsNew()) {
      this.removeTitre(i);
      return;
    }
    const snap = this.titreSnapshot();
    this.activeTitre.set(-1);
    if (snap) this.titres.update((list) => list.map((t, j) => (j === i ? snap : t)));
    this.loadTitre(-1);
    this.opStatus.set('');
  }
  protected removeTitre(index: number, event?: Event): void {
    event?.stopPropagation();
    const active = this.activeTitre();
    this.activeTitre.set(-1);
    this.titres.update((list) => list.filter((_, j) => j !== index));
    if (active > index) this.loadTitre(active - 1);
    else if (active === index) this.loadTitre(-1);
    else this.loadTitre(active);
    this.opStatus.set('');
  }

  // ---- Vérification de l'étape Titulaires ---------------------------------

  /* « Vérifier la saisie » sur l'étape Titulaires : Suivant reste inactif tant que la saisie
     n'a pas été vérifiée — et vérifiée telle qu'elle est. La vérification est attachée à une
     empreinte des champs contrôlés : modifier un nom après coup la périme, et il faut vérifier
     de nouveau. Un échec est lui aussi attaché à son empreinte, pour que la liste des manques
     s'efface dès qu'on corrige quelque chose plutôt que de rester affichée à tort. */
  private readonly holderVerifiedKey = this.viewState.remember('comptes.holderVerifiedKey', '');
  private readonly holderFailedKey = this.viewState.remember('comptes.holderFailedKey', '');
  private readonly holderStateKey = computed(() => holderKey(this.form(), this.co()));
  protected readonly holderIssuesView = computed(() => holderIssues(this.form(), this.co()));
  protected readonly holderCheck = computed<'none' | 'ok' | 'fail'>(() => {
    const key = this.holderStateKey();
    if (this.holderVerifiedKey() === key) return 'ok';
    if (this.holderFailedKey() === key) return 'fail';
    return 'none';
  });
  /* Le contrôle rend son verdict dans le bandeau de l'étape, puis ouvre le récapitulatif : c'est
     là qu'on relit ce qui a été vérifié — et, en cas de manque, qu'on voit précisément quelle
     ligne est « À renseigner ». Le même geste que sur la dernière étape, avec le verdict en plus. */
  protected verifyHolders(): void {
    const key = this.holderStateKey();
    if (this.holderIssuesView().length) {
      this.holderFailedKey.set(key);
      this.opStatus.set('');
    } else {
      this.holderVerifiedKey.set(key);
      this.opStatus.set('Titulaires vérifiés — vous pouvez passer aux comptes.');
    }
    /* Récapitulatif validé par « OK » sur une saisie vérifiée : on enchaîne sur l'étape suivante
       sans repasser par « Suivant » — le bouton s'active de toute façon, pour qui referme par
       « Annuler » et veut relire l'étape avant. */
    this.openRecap().afterClosed().subscribe((result) => {
      if (result === 'ok' && this.holderCheck() === 'ok' && this.onHolderStep()) this.opNext();
    });
  }
  private readonly holderBlocked = computed(() => this.onHolderStep() && !this.locked() && this.holderCheck() !== 'ok');

  protected readonly opChecksView = computed(() =>
    this.currentStep().checks.map((c) => ({ label: c.label, color: c.level === 'warn' ? 'var(--ink-warn-2)' : 'var(--ds-brand-fill, var(--ink-brand-2))' })),
  );

  // ---- Compte(s) de liquidité --------------------------------------------

  protected readonly cashRows = computed(() => buildCashRows(this.form(), this.cash()));
  protected readonly bankGroupsList: readonly AcSelectGroup[] = bankGroups();
  protected readonly cashCurrencyGroupsList: readonly AcSelectGroup[] = cashCurrencyGroups();

  protected addCash(): void {
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

  protected setDateField(key: string, value: string): void {
    if (key === 'opened') { this.setOpenedDate(value); return; }
    if (key === 'closed') { this.setClosedDate(value); return; }
    this.patchForm({ [key]: value } as Partial<FormState>);
  }

  protected setTextField(key: string, value: string): void {
    if (key === 'number') { this.setNumber(value); return; }
    this.patchForm({ [key]: value } as Partial<FormState>);
  }

  // ---- Navigation de l'assistant ------------------------------------------

  protected switchOp(k: OpKind): void {
    this.op.set(k);
    this.opStep.set(0);
    this.opStatus.set('');
    this.opDone.set(false);
  }
  protected goStep(i: number): void {
    this.opStep.set(i);
  }

  /* Créer le compte suppose au moins un compte titre, et tous complets — IBAN vérifiés compris. */
  private readonly titresBlocked = computed(() => this.onCashStep() && !this.locked() && (!this.titres().length || this.titresIncomplete() > 0));
  protected readonly opNextBlocked = computed(() => this.holderBlocked() || this.titresBlocked() || (this.locked() && this.isLastStep()));
  protected readonly opNextBlockedNote = computed(() => {
    if (this.locked() && this.isLastStep()) return 'Compte déjà créé — « Nouvelle création » pour ouvrir un autre dossier.';
    if (this.holderBlocked()) return this.holderCheck() === 'fail' ? 'Saisie incomplète — corrigez les manques listés, puis vérifiez de nouveau.' : 'Vérifiez la saisie des titulaires avant de passer aux comptes.';
    if (this.titresBlocked()) {
      const inc = this.titresIncomplete();
      return this.titres().length
        ? `${inc} compte${inc > 1 ? 's' : ''} titre à compléter avant de créer le compte.`
        : 'Ajoutez au moins un compte titre — avec son compte de liquidité — avant de créer le compte.';
    }
    return '';
  });
  protected readonly opNextLabel = computed(() => (this.isLastStep() ? this.def().next : 'Suivant'));
  protected readonly opPrevLabel = computed(() => (this.currentStepIndex() === 0 ? (this.locked() ? 'Nouvelle création' : 'Annuler') : 'Précédent'));

  protected opPrev(): void {
    if (this.opStep() > 0) {
      this.opStep.update((s) => s - 1);
      return;
    }
    const wasLocked = this.locked();
    this.form.set(blankForm());
    this.co.set([]);
    this.cash.set([]);
    this.titres.set([]);
    this.activeTitre.set(-1);
    this.created.set(false);
    this.opDone.set(false);
    this.holderPane.set('main');
    this.opStatus.set(wasLocked ? 'Nouvelle création — le formulaire est prêt.' : 'Saisie effacée — le formulaire est prêt pour une prochaine création.');
  }

  protected opNext(): void {
    if (this.opNextBlocked()) {
      this.opStatus.set('');
      return;
    }
    if (this.currentStepIndex() < this.def().steps.length - 1) {
      this.opStep.update((s) => s + 1);
      this.opStatus.set('');
      /* Passer aux comptes fait sortir le dossier du stade « Projet » : il est « En ouverture »
         dès lors, c'est le seul statut que cette étape sache choisir. */
      if (this.op() === 'create' && this.onCashStep() && this.form().statusChoice !== 'En ouverture') this.patchForm({ statusChoice: 'En ouverture' });
      return;
    }
    if (this.op() === 'create') {
      this.openCreateDialog();
      return;
    }
    this.opDone.set(true);
    this.opStatus.set(this.def().label + ' enregistrée — dossier transmis au contrôle interne.');
  }

  protected opReset(): void {
    this.form.set(blankForm());
    this.co.set([]);
    this.cash.set([]);
    this.titres.set([]);
    this.activeTitre.set(-1);
    this.opStep.set(0);
    this.holderPane.set('main');
    this.created.set(false);
    this.opDone.set(false);
    this.opStatus.set('Saisie réinitialisée.');
  }

  // ---- Récapitulatif / création ------------------------------------------

  /* Le compte titre déplié, seul : c'est de lui que parle son propre récapitulatif. */
  private readonly activeTitreOnly = computed(() => {
    const t = this.titres()[this.activeTitre()];
    return t ? [t] : [];
  });
  protected openRecap(title?: string, scope: 'all' | 'titres' = 'all', submitLabel?: string): MatDialogRef<AcRecapDialog, 'ok' | undefined> {
    return this.dialog.open<AcRecapDialog, AcRecapDialogData, 'ok' | undefined>(AcRecapDialog, {
      data: {
        form: this.form, co: this.co,
        titres: scope === 'titres' ? this.activeTitreOnly : this.titres,
        title, scope, submitLabel,
      },
      panelClass: 'pm-side-panel-overlay',
      position: SIDE_PANEL_LAYOUT.position,
      height: SIDE_PANEL_LAYOUT.height,
      maxWidth: '100vw',
      autoFocus: false,
    });
  }

  protected openCreateDialog(): void {
    const ref = this.dialog.open<AcCreateDialog, AcCreateDialogData, AcCreateDialogResult>(AcCreateDialog, {
      data: { form: this.form, titres: this.titres },
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'ok') {
        /* Le dossier créé reste sous les yeux, avec la référence que le référentiel vient de lui
           attribuer et son statut Actif, mais plus rien ne s'y modifie : `created` verrouille
           chaque étape. « Nouvelle création » — ou la réinitialisation — rend un formulaire vierge. */
        const ref = nextClientRef(ACCOUNTS.length);
        this.form.update((f) => ({ ...f, clientRef: ref, statusChoice: 'Actif' }));
        this.created.set(true);
        this.opDone.set(true);
        this.opStatus.set(`Compte créé — référence client ${ref} attribuée. Dossier verrouillé en lecture seule.`);
      }
    });
  }
}
