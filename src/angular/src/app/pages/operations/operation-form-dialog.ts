import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import { dateToIso, isoToDate } from '../../shell/date-bridge';
import { OpsSelect } from './ops-select';
import { OpsStepperInput } from './ops-stepper-input';
import {
  ACCOUNTS,
  ACCOUNTS_LIST,
  ACCOUNT_CURRENCY,
  CASHFLOW_TYPES,
  CURRENCY_SYMBOL,
  LINKED_BANKS,
  MIC_CURRENCY,
  MIC_HINT,
  MIC_PLACES,
  MIC_SHORT,
  ORDER_STRATEGY,
  STRAT_HINT,
  STRAT_NAME,
  TIF,
  TIF_HINT,
  TIF_NAME,
  TODAY,
  TRADABLE_SECURITIES,
  ZONE_ORDER,
  zoneOfMic,
  parseFr,
  type CashflowEventRow,
  type OrderRow,
  type TransferRow,
} from './operations-data';
import {
  CA_TYPE_OPTIONS,
  EV_REMIND_OPTIONS,
  type ExecRow,
  type PanelKind,
  type QuickState,
  caAmountLabel,
  caAmountPlaceholder,
  caAmountPrefix,
  caAmountStep,
  caDefText,
  caDefTitle,
  caImpactCode,
  caImpactHint,
  caTaxPlaceholder,
  caTaxPrefix,
  cfExternalAllowed,
  cfGrossLabel,
  cfHasFee,
  cfHasNet,
  cfHasTax,
  cfInternalWhy,
  cfNetAmount,
  evDefText,
  evDefTitle,
  evLinkOptions,
  evTitlePlaceholder,
  evWhenBg,
  evWhenCode,
  evWhenFg,
  evWhenHint,
  initialQuick,
  securityCurrency,
  sidePanelInfo,
  tradeEntryText,
  tradeLegsFromExec,
  tradeTotals,
  trfDirLines,
  trfEntryText,
  trfKindBadges,
  trfKindHint,
  trfLegs,
  trfLegsCount,
  trfValue,
} from './operations-forms';

export interface OperationFormData {
  readonly kind: PanelKind;
}

export type OperationResult =
  | { readonly kind: 'trade'; readonly order: OrderRow }
  | { readonly kind: 'transfer'; readonly transfer: TransferRow }
  | { readonly kind: 'cashflow'; readonly event: CashflowEventRow };

interface TradeForm {
  security: string;
  mic: string;
  qty: string;
  price: string;
  fees: string;
  taxes: string;
  strategy: string;
  tif: string;
  account: string;
  date: string;
}

function initialTradeForm(): TradeForm {
  return { security: '', mic: '', qty: '20', price: '150,00', fees: '12,00', taxes: '1,80', strategy: 'MKT', tif: 'DAY', account: ACCOUNTS[0], date: TODAY };
}

/**
 * Panneau latéral partagé des 5 formulaires de création (`sidePanel` du prototype :
 * trade/transfer/calendar/corporate/cashflow) — un seul dialogue plutôt que cinq, comme
 * `Ordres.dc.html` le fait déjà via `dc-import name="SidePanel"` et des branches `sc-if`.
 *
 * Deux comportements du prototype, confirmés par grep avant portage, sont repris tels quels :
 * - `submitQuick` (le gestionnaire `on-submit` commun aux 5 formulaires) ne traite que les cas
 *   trade/transfer/cashflow ; Corporate Action et Calendrier n'ont aucune branche, donc leur
 *   bouton « Enregistrer » ne fait rien (le panneau reste ouvert, sans retour visuel).
 * - `formStatus` (message de validation du formulaire Ordre : « Titre et quantité requis. »)
 *   n'est jamais rendu dans le template live : la validation existe mais reste invisible,
 *   l'échec de soumission est donc silencieux.
 */
@Component({
  selector: 'app-operation-form-dialog',
  imports: [MatTabsModule, MatIconModule, SidePanel, MatButtonModule, MatButtonToggleModule, MatMenuModule, MatTooltipModule, MatDatepickerModule, OpsSelect, OpsStepperInput],
  templateUrl: './operation-form-dialog.html',
  styleUrl: './operation-form-dialog.css',
})
export class OperationFormDialog {
  /* MatDatepicker travaille en `Date`, le domaine en ISO : conversion aux bornes du gabarit
     (voir date-bridge.ts), pour ne rien changer au stockage ni aux comparaisons existantes. */
  protected readonly isoToDate = isoToDate;
  protected readonly dateToIso = dateToIso;

  private readonly data = inject<OperationFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OperationFormDialog, OperationResult | undefined>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly kind = this.data.kind;
  protected readonly today = TODAY;

  protected readonly quick = signal<QuickState>(initialQuick());
  protected readonly info = computed(() => sidePanelInfo(this.kind, this.quick()));

  // ---- Ordre (trade) --------------------------------------------------
  protected readonly side = signal<'ACHAT' | 'VENTE'>('ACHAT');
  protected readonly tradeSub = signal<'main' | 'legs'>('main');
  protected readonly tradeFill = signal<'full' | 'partial'>('full');
  protected readonly form = signal<TradeForm>(initialTradeForm());
  protected readonly execRows = signal<ExecRow[]>([{ date: TODAY, qty: '20', price: '150,00', settle: TODAY }]);
  protected readonly tradeComment = signal('');

  protected readonly accountOptions = [{ value: '', label: 'Aucun' }, ...ACCOUNTS_LIST.map((a) => ({ value: a.value, label: a.label }))];
  protected readonly micOptions = [{ value: '', label: 'Aucune' }, ...MIC_PLACES];
  protected readonly strategyOptions = ORDER_STRATEGY.map((o) => ({ ...o, disabled: o.value !== 'MKT' && o.value !== 'LMT' }));
  protected readonly tifOptions = TIF;
  protected readonly micHint = MIC_HINT;
  protected readonly stratHint = STRAT_HINT;
  protected readonly tifHint = TIF_HINT;

  /** « Aucun » reste hors groupe : il n'appartient à aucune zone. */
  protected readonly securityOptions = [{ value: '', label: 'Aucun' }];

  /**
   * Titres négociables rangés par zone géographique. À quinze instruments sur huit places, la
   * liste à plat obligeait à lire chaque ligne pour retrouver un titre ; la zone est la première
   * question qu'on se pose. Une zone sans titre — après filtre sur la place — ne s'affiche pas,
   * plutôt que d'exposer une rubrique vide.
   */
  protected readonly securityGroups = computed(() => {
    const mic = this.form().mic;
    const list = TRADABLE_SECURITIES.filter((s) => !mic || s.mic === mic);
    return ZONE_ORDER.map((zone) => ({
      label: zone,
      options: list
        .filter((s) => zoneOfMic(s.mic) === zone)
        .map((s) => ({ value: s.label, label: `${s.mic}.${s.ticker} — ${s.label.split(' — ')[1]}` })),
    })).filter((g) => g.options.length > 0);
  });
  protected readonly securitySub = computed(() => {
    const sec = TRADABLE_SECURITIES.find((s) => s.label === this.form().security);
    return sec ? 'Devise : ' + (MIC_CURRENCY[sec.mic] || '—') + ' (' + sec.mic + ')' : '';
  });
  protected readonly accountSub = computed(() => ACCOUNTS_LIST.find((a) => a.value === this.form().account)?.code || 'Aucun compte');
  protected readonly micSub = computed(() => MIC_SHORT[this.form().mic] || (this.form().mic ? this.form().mic : 'Toutes places'));
  protected readonly strategySub = computed(() => STRAT_NAME[this.form().strategy] || 'Aucune stratégie');
  protected readonly tifSub = computed(() => TIF_NAME[this.form().tif] || '');

  protected readonly ccy = computed(() => securityCurrency(this.form().security));
  protected readonly totals = computed(() => tradeTotals(this.form().qty, this.form().price, this.form().fees, this.form().taxes, this.side()));
  protected readonly grossLabel = computed(() => this.ccy().symbol + ' ' + this.totals().gross.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  protected readonly netLabel = computed(() => this.ccy().symbol + ' ' + this.totals().net.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  protected readonly readOnlyTone = computed(() => (this.side() === 'VENTE' ? '#b91c1c' : '#4338ca'));
  protected readonly readOnlyToneBg = computed(() => (this.side() === 'VENTE' ? 'rgba(185,28,28,0.08)' : 'rgba(67,56,202,0.08)'));

  protected readonly tradeLegs = computed(() => tradeLegsFromExec(this.execRows(), this.side(), this.form().security, this.form().account));
  protected readonly tradeEntryText = computed(() => tradeEntryText(this.side(), this.totals()));
  protected readonly execTotalQty = computed(() => this.execRows().reduce((n, r) => n + parseFr(r.qty), 0));
  protected readonly canAddExecRow = computed(() => {
    const orderQty = parseFr(this.form().qty);
    return this.tradeFill() === 'partial' && (!orderQty || this.execTotalQty() < orderQty);
  });
  protected readonly addExecRowTitle = computed(() =>
    this.canAddExecRow()
      ? "Ajouter l'exécution suivante"
      : this.tradeFill() !== 'partial'
        ? 'Passer en exécution partielle pour ajouter une ligne'
        : 'Quantité déjà totalement exécutée',
  );

  // ---- Transfert --------------------------------------------------------
  protected readonly trfSub = signal<'init' | 'legs'>('init');
  protected readonly trfComment = signal('');

  protected readonly transferFromOptions = computed(() => {
    const q = this.quick();
    return ACCOUNTS.map((a) => ({ value: a, label: a, disabled: a === q.to }))
      .concat([{ value: '__ext__', label: q.to === '__ext__' ? 'Compte externe — indisponible (destinataire déjà externe)' : 'Compte externe — à saisir', disabled: q.to === '__ext__' }]);
  });
  protected readonly transferToOptions = computed(() => {
    const q = this.quick();
    return ACCOUNTS.map((a) => ({ value: a, label: a, disabled: a === q.from }))
      .concat([{ value: '__ext__', label: q.from === '__ext__' ? 'Compte externe — indisponible (source déjà externe)' : 'Compte externe — à saisir', disabled: q.from === '__ext__' }]);
  });
  protected readonly transferSecOptions = TRADABLE_SECURITIES.map((x) => ({ value: x.label, label: x.mic + '.' + x.ticker + ' — ' + x.label.split(' — ')[1] }));
  protected readonly trfFromExternal = computed(() => this.quick().from === '__ext__');
  protected readonly trfIsExternal = computed(() => this.quick().to === '__ext__');
  protected readonly trfDirLines = computed(() => trfDirLines(this.quick().from, this.quick().to));
  protected readonly trfKindBadges = computed(() => trfKindBadges(this.quick().from, this.quick().to));
  protected readonly trfKindHint = computed(() => trfKindHint(this.quick().from, this.quick().to));
  protected readonly trfLegsCount = computed(() => trfLegsCount(this.quick().from, this.quick().to));
  protected readonly trfMic = computed(() => TRADABLE_SECURITIES.find((s) => s.label === this.quick().security)?.mic || '—');
  protected readonly trfMicPlace = computed(() => {
    const sec = TRADABLE_SECURITIES.find((s) => s.label === this.quick().security);
    return sec ? MIC_SHORT[sec.mic] || '' : '';
  });
  protected readonly trfCurrency = computed(() => securityCurrency(this.quick().security).symbol);
  protected readonly trfValueLabel = computed(() => trfValue(this.quick().qty, this.quick().price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  protected readonly trfLegs = computed(() => trfLegs(this.quick(), this.quick().extFrom, this.quick().extAccount));
  protected readonly trfEntryText = computed(() => trfEntryText(this.quick()));

  // ---- Calendrier ---------------------------------------------------------
  protected readonly evComment = signal('');
  protected readonly evTypeOptions: readonly { readonly key: string; readonly label: string }[] = [
    { key: 'ECHEANCE', label: 'ÉCHÉANCE' },
    { key: 'RAPPEL', label: 'RAPPEL' },
    { key: 'AG', label: 'AG' },
    { key: 'REVUE', label: 'REVUE' },
    { key: 'PUBLICATION', label: 'PUBLICATION' },
    { key: 'MARCHE', label: 'MARCHÉ' },
  ];
  protected readonly evRemindOptions = EV_REMIND_OPTIONS;
  protected readonly evLinkOptions = evLinkOptions();
  protected readonly evDefTitle = computed(() => evDefTitle(this.quick().evType || 'ECHEANCE'));
  protected readonly evDefText = computed(() => evDefText(this.quick().evType || 'ECHEANCE'));
  protected readonly evTitlePlaceholder = computed(() => evTitlePlaceholder(this.quick().evType || 'ECHEANCE'));
  protected readonly evWhenCode = computed(() => evWhenCode(this.quick().evDate));
  protected readonly evWhenBg = computed(() => evWhenBg(this.quick().evDate));
  protected readonly evWhenFg = computed(() => evWhenFg(this.quick().evDate));
  protected readonly evWhenHint = computed(() => evWhenHint(this.quick().evDate));

  // ---- Corporate action ---------------------------------------------------
  protected readonly caComment = signal('');
  protected readonly caTypeOptions = CA_TYPE_OPTIONS;
  protected readonly caSecOptions = TRADABLE_SECURITIES.map((x) => ({ value: x.label, label: x.mic + '.' + x.ticker + ' — ' + x.label.split(' — ')[1] }));
  protected readonly caDefTitle = computed(() => caDefTitle(this.quick().caType || 'DIV'));
  protected readonly caDefText = computed(() => caDefText(this.quick().caType || 'DIV'));
  protected readonly caAmountLabel = computed(() => caAmountLabel(this.quick().caType || 'DIV'));
  protected readonly caAmountPrefix = computed(() => caAmountPrefix(this.quick().caType || 'DIV'));
  protected readonly caAmountPlaceholder = computed(() => caAmountPlaceholder(this.quick().caType || 'DIV'));
  protected readonly caImpactCode = computed(() => caImpactCode(this.quick().caType || 'DIV'));
  protected readonly caImpactHint = computed(() => caImpactHint(this.quick().caType || 'DIV'));
  protected readonly caTaxPrefix = computed(() => caTaxPrefix(this.quick().caType || 'DIV'));
  protected readonly caTaxPlaceholder = computed(() => caTaxPlaceholder(this.quick().caType || 'DIV'));
  protected readonly caAmountStep = computed(() => caAmountStep(this.quick().caType || 'DIV'));

  // ---- Cashflow -------------------------------------------------------------
  protected readonly cfComment = signal('');
  protected readonly cfTypeOptions = CASHFLOW_TYPES;
  protected readonly cfTypeDef = computed(() => CASHFLOW_TYPES.find((t) => t.value === this.quick().cfType) || CASHFLOW_TYPES[0]);
  protected readonly cfCurrency = computed(() => CURRENCY_SYMBOL[ACCOUNT_CURRENCY[this.quick().account] || 'EUR'] || '€');
  protected readonly cfExternalAllowed = computed(() => cfExternalAllowed(this.quick().cfType));
  protected readonly cfInternalWhy = computed(() => cfInternalWhy(this.quick().cfType));
  protected readonly cfGrossLabel = computed(() => cfGrossLabel(this.quick().cfType));
  protected readonly cfHasFee = computed(() => cfHasFee(this.quick().cfType));
  protected readonly cfHasTax = computed(() => cfHasTax(this.quick().cfType));
  protected readonly cfHasNet = computed(() => cfHasNet(this.quick().cfType));
  protected readonly cfNetAmount = computed(() => cfNetAmount(this.quick().amount, this.quick().fee, this.quick().tax));
  protected readonly cfBankOptions = computed(() => {
    const banks = LINKED_BANKS[this.quick().account] || [];
    return banks.map((b, i) => ({ value: b, label: i === 0 ? b + ' — principal' : b }));
  });
  protected readonly cfBankLocked = computed(() => (LINKED_BANKS[this.quick().account] || []).length <= 1);
  protected readonly cfAccOptions = ACCOUNTS_LIST.map((a) => ({ value: a.value, label: a.value }));

  // -------------------------------------------------------------------------

  protected patchQuick(patch: Partial<QuickState>): void {
    this.quick.update((q) => ({ ...q, ...patch }));
  }

  protected setAccount(value: string): void {
    this.quick.update((q) => ({ ...q, account: value, linkedBank: (LINKED_BANKS[value] || [])[0] || '' }));
  }

  protected setCfType(value: string): void {
    const ext = value === 'DEPOSIT' || value === 'WITHDRAW';
    this.quick.update((q) => ({ ...q, cfType: value, linkedBank: ext ? q.linkedBank : '' }));
  }

  protected patchForm(patch: Partial<TradeForm>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  protected setFillFull(): void {
    const orderQty = parseFr(this.form().qty);
    this.tradeFill.set('full');
    this.execRows.set([{ date: TODAY, qty: String(orderQty || 20), price: this.form().price || '', settle: this.form().date || TODAY }]);
  }

  protected setFillPartial(): void {
    this.tradeFill.set('partial');
  }

  protected setExecRow(i: number, patch: Partial<ExecRow>): void {
    this.execRows.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  protected setExecQty(i: number, raw: string): void {
    this.setExecRow(i, { qty: raw.replace(/[^0-9]/g, '') });
  }

  protected addExecRow(): void {
    if (!this.canAddExecRow()) return;
    this.execRows.update((rows) => [...rows, { date: TODAY, qty: '', price: '', settle: '' }]);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }

  protected submit(): void {
    if (this.kind === 'trade') {
      this.submitTrade();
    } else if (this.kind === 'transfer') {
      this.submitTransfer();
    } else if (this.kind === 'cashflow') {
      this.submitCashflow();
    }
    // Corporate Action et Calendrier : aucune branche dans le prototype (voir la note de
    // classe) — le bouton « Enregistrer » de ces deux formulaires ne fait rien.
  }

  private submitTrade(): void {
    const f = this.form();
    const qty = parseFr(f.qty);
    if (!f.security || !qty) return;
    const priceLabel = f.strategy === 'LMT' ? (f.price || '0') + ' (LMT)' : 'Au marché (MKT)';
    const order: OrderRow = { id: 'ORD-' + Date.now().toString().slice(-4), date: f.date || TODAY, side: this.side(), security: f.security, account: f.account, qty, filled: 0, price: priceLabel, tif: f.tif };
    this.dialogRef.close({ kind: 'trade', order });
  }

  private submitTransfer(): void {
    const q = this.quick();
    const transfer: TransferRow = {
      id: 'TRF-' + Date.now().toString().slice(-4),
      date: TODAY,
      from: q.from,
      to: q.to,
      amount: parseFr(q.amount),
      currency: q.currency,
      state: 'En cours',
    };
    this.dialogRef.close({ kind: 'transfer', transfer });
  }

  private submitCashflow(): void {
    const q = this.quick();
    const event: CashflowEventRow = {
      id: 'CF-' + Date.now().toString().slice(-4),
      date: TODAY,
      type: q.cfType,
      account: q.account,
      amount: parseFr(q.amount),
      currency: q.currency,
      state: 'Exécuté',
    };
    this.dialogRef.close({ kind: 'cashflow', event });
  }
}
