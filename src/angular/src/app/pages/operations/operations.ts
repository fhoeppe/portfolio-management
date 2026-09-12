import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  CASHFLOW_EVENTS,
  CORPORATE_EVENTS,
  HORIZON,
  IN_7D,
  ORDERS,
  STATE_TONE,
  TODAY,
  TRANSFERS,
  frDate,
  num,
  stateOf,
  type CashflowEventRow,
  type CorporateEventRow,
  type OrderRow,
  type OrderState,
  type TransferRow,
} from './operations-data';
import { OperationFormDialog, type OperationFormData, type OperationResult } from './operation-form-dialog';
import { OperationsActionSheet } from './operations-action-sheet';
import type { PanelKind } from './operations-forms';
import { SIDE_PANEL_LAYOUT } from '../../ui/side-panel/side-panel-layout';

type Tab = 'overview' | 'list' | 'transfers' | 'corporate' | 'cashflow';
type PanelSection = 'ordres' | 'transferts' | 'corporate' | 'cashflow';

interface Kpi {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly labelColor: string;
  readonly color: string;
  readonly bg: string;
  readonly border: string;
}

function withBorders(list: readonly Omit<Kpi, 'border'>[]): Kpi[] {
  return list.map((k) => ({
    ...k,
    border: !k.color || k.color === 'var(--color-text)' || !k.bg || k.bg === 'var(--surface)' ? 'var(--color-neutral-300)' : k.color,
  }));
}

/**
 * Porté depuis `Ordres.dc.html`. Le bandeau d'accordéon (Ordres/Transferts/Corporate
 * Actions/Cashflows) est un `mat-accordion` à ouverture unique : à la différence du prototype,
 * qui gardait toujours une section ouverte, cliquer la section ouverte la referme — comportement
 * naturel de Material, retenu volontairement. Son état `openPanels` (pluriel, multi-ouverture)
 * est mort, jamais lu (confirmé par grep), seul `openPanel` (singulier) pilote `panel()`.
 *
 * Les émulations `data-mat-select` et `mat-button-toggle`-stylées des 5 formulaires de
 * création deviennent de vrais `MatMenu`/`mat-button-toggle-group` dans `OperationFormDialog`,
 * hébergé par le `SidePanel` partagé — même principe que le sélecteur de mandat de Positions.
 * La feuille « Initier un événement » devient un vrai `MatBottomSheet`.
 */
@Component({
  selector: 'app-operations',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatTableModule, MatTooltipModule, MatExpansionModule],
  templateUrl: './operations.html',
  styleUrl: './operations.css',
})
export class Operations {
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly today = TODAY;

  protected readonly orders = signal<OrderRow[]>([...ORDERS]);
  protected readonly transfers = signal<TransferRow[]>([...TRANSFERS]);
  protected readonly corporateEvents = signal<CorporateEventRow[]>([...CORPORATE_EVENTS]);
  protected readonly cashflowEvents = signal<CashflowEventRow[]>([...CASHFLOW_EVENTS]);

  protected readonly tab = signal<Tab>('overview');
  protected readonly stateFilter = signal<'all' | OrderState>('all');
  protected readonly openPanel = signal<PanelSection | null>('ordres');

  protected readonly counts = computed(() => {
    const c: Record<OrderState, number> = { open: 0, partial: 0, full: 0, cancelled: 0, abandoned: 0 };
    this.orders().forEach((o) => c[stateOf(o)]++);
    return c;
  });

  protected readonly filteredOrders = computed(() => {
    const sf = this.stateFilter();
    return this.orders().filter((o) => sf === 'all' || stateOf(o) === sf);
  });

  protected readonly subtitle = computed(() => `${this.orders().length} ordres · ${this.counts().open} en cours · au ${frDate(TODAY)}`);

  protected readonly pageTabs = computed(() => {
    const defs: readonly { readonly key: Tab; readonly label: string; readonly badge: string; readonly on2: string; readonly fg2: string; readonly bg2: string }[] = [
      { key: 'overview', label: 'Aperçu', badge: '', on2: 'rgba(0,61,165,0.08)', fg2: 'var(--ink-brand)', bg2: 'var(--field-brand)' },
      { key: 'list', label: 'Ordres', badge: String(this.orders().length), on2: 'rgba(15,118,110,0.16)', fg2: 'var(--ink-ok)', bg2: 'var(--field-ok)' },
      { key: 'transfers', label: 'Transferts', badge: String(this.transfers().length), on2: 'rgba(2,132,199,0.16)', fg2: 'var(--ink-info)', bg2: 'var(--field-info)' },
      { key: 'corporate', label: 'Corporate Actions', badge: String(this.corporateEvents().length), on2: 'rgba(180,83,9,0.16)', fg2: 'var(--ink-warn)', bg2: 'var(--field-warn)' },
      { key: 'cashflow', label: 'Cashflows', badge: String(this.cashflowEvents().length), on2: 'rgba(162,28,175,0.16)', fg2: 'var(--ink-magenta)', bg2: 'var(--field-magenta)' },
    ];
    const tab = this.tab();
    return defs.map((t) => {
      const on = tab === t.key;
      return {
        key: t.key,
        label: t.label,
        badge: t.badge,
        hasBadge: !!t.badge,
        height: on ? '40px' : '32px',
        padding: on ? '0 20px' : '0 14px',
        size: on ? '14px' : '12px',
        bg: on ? t.bg2 : t.on2,
        fg: on ? '#ffffff' : t.fg2,
        weight: on ? '700' : '400',
        borderColor: t.fg2,
        badgeBg: on ? 'rgba(255,255,255,0.28)' : t.fg2,
      };
    });
  });

  protected readonly kpis = computed(() =>
    withBorders([
      { label: 'En cours', value: String(this.counts().open), note: 'Transmis, non exécutés', labelColor: 'var(--ink-brand)', color: 'var(--ink-brand)', bg: 'rgba(0,42,110,0.16)' },
      { label: 'Exécutés partiellement', value: String(this.counts().partial), note: 'Une partie de la quantité', labelColor: 'var(--ink-warn)', color: 'var(--ink-warn)', bg: 'rgba(143,63,6,0.16)' },
      { label: 'Exécutés totalement', value: String(this.counts().full), note: 'Quantité entièrement servie', labelColor: 'var(--ink-ok)', color: 'var(--ink-ok)', bg: 'rgba(11,95,87,0.16)' },
      { label: 'Annulés ou abandonnés', value: String(this.counts().cancelled + this.counts().abandoned), note: `${this.counts().abandoned} abandonné(s) · ${this.counts().cancelled} annulé(s)`, labelColor: 'var(--color-neutral-700)', color: 'var(--color-text)', bg: 'var(--surface)' },
    ]),
  );

  protected readonly transferKpis = computed(() => {
    const transfers = this.transfers();
    const total = transfers.length;
    const pending = transfers.filter((x) => x.state === 'En cours').length;
    const done = transfers.filter((x) => x.state === 'Exécuté').length;
    const sumEur = transfers.filter((x) => x.currency === 'EUR').reduce((n, x) => n + x.amount, 0);
    return withBorders([
      { label: 'Transferts', value: String(total), note: 'Toutes devises confondues', labelColor: 'var(--ink-info)', color: 'var(--ink-info)', bg: 'rgba(7,89,133,0.16)' },
      { label: 'En cours', value: String(pending), note: 'Non encore dénoués', labelColor: 'var(--ink-info)', color: 'var(--ink-info)', bg: 'rgba(7,89,133,0.16)' },
      { label: 'Exécutés', value: String(done), note: 'Dénoués', labelColor: 'var(--ink-ok)', color: 'var(--ink-ok)', bg: 'rgba(11,95,87,0.16)' },
      { label: 'Montant total EUR', value: sumEur.toLocaleString('fr-FR') + ' €', note: 'Somme des virements en euros', labelColor: 'var(--ink-info)', color: 'var(--ink-info)', bg: 'rgba(7,89,133,0.16)' },
    ]);
  });

  protected readonly corporateKpis = computed(() => {
    const evs = this.corporateEvents();
    const up = evs.filter((x) => x.date >= TODAY && x.date <= HORIZON);
    const toDo = up.filter((x) => x.deadline);
    const late = toDo.filter((x) => (x.deadline as string) < TODAY).length;
    const soon = toDo.filter((x) => (x.deadline as string) >= TODAY && (x.deadline as string) <= IN_7D).length;
    return withBorders([
      { label: 'À venir sur 30 jours', value: String(up.length), note: `Du ${frDate(TODAY)} au ${HORIZON.split('-').reverse().slice(0, 2).join('/')}`, labelColor: 'var(--ink-warn)', color: 'var(--ink-warn)', bg: 'rgba(143,63,6,0.16)' },
      { label: 'À instruire', value: String(toDo.length), note: late ? `${late} échéance(s) dépassée(s)` : 'Réponse attendue du porteur', labelColor: late ? 'var(--ink-magenta)' : 'var(--ink-warn)', color: late ? 'var(--ink-magenta)' : 'var(--ink-warn)', bg: late ? 'rgba(162,28,175,0.16)' : 'rgba(143,63,6,0.16)' },
      { label: 'Sous 7 jours', value: String(soon), note: 'Échéances de la semaine', labelColor: 'var(--ink-warn)', color: 'var(--ink-warn)', bg: 'rgba(143,63,6,0.16)' },
      { label: 'Titres concernés', value: String(new Set(up.map((x) => x.security)).size), note: 'Lignes touchées sur la période', labelColor: 'var(--ink-ok)', color: 'var(--ink-ok)', bg: 'rgba(11,95,87,0.16)' },
    ]);
  });

  protected readonly cashflowKpis = computed(() => {
    const evs = this.cashflowEvents();
    const total = evs.length;
    const inflow = evs.filter((x) => x.amount > 0).reduce((n, x) => n + x.amount, 0);
    const outflow = evs.filter((x) => x.amount < 0).reduce((n, x) => n + x.amount, 0);
    return withBorders([
      { label: 'Mouvements', value: String(total), note: 'Toutes natures confondues', labelColor: 'var(--ink-magenta)', color: 'var(--ink-magenta)', bg: 'rgba(162,28,175,0.16)' },
      { label: 'Encaissements', value: inflow.toLocaleString('fr-FR') + ' €', note: 'Dépôts et intérêts', labelColor: 'var(--ink-magenta)', color: 'var(--ink-magenta)', bg: 'rgba(162,28,175,0.16)' },
      { label: 'Décaissements', value: Math.abs(outflow).toLocaleString('fr-FR') + ' €', note: 'Frais et retraits', labelColor: 'var(--ink-warn)', color: 'var(--ink-warn)', bg: 'rgba(143,63,6,0.16)' },
      { label: 'Solde net', value: (inflow + outflow).toLocaleString('fr-FR') + ' €', note: 'Encaissements moins décaissements', labelColor: 'var(--ink-magenta)', color: 'var(--ink-magenta)', bg: 'rgba(162,28,175,0.16)' },
    ]);
  });

  protected readonly stateTabs = computed(() => {
    const sf = this.stateFilter();
    const defs: readonly { readonly key: 'all' | OrderState; readonly label: string }[] = [
      { key: 'all', label: 'Tous' },
      ...(Object.keys(STATE_TONE) as OrderState[]).map((k) => ({ key: k, label: STATE_TONE[k].label })),
    ];
    return defs.map((s) => ({ key: s.key, label: s.label, on: sf === s.key }));
  });

  protected readonly orderColumns = ['date', 'side', 'security', 'qty', 'filled', 'left', 'price', 'tif', 'state'];

  protected readonly transferColumns = ['ref', 'date', 'from', 'to', 'amount', 'state'];

  protected readonly corporateColumns = ['ref', 'date', 'type', 'security', 'account', 'amount', 'deadline', 'state'];

  protected readonly cashflowColumns = ['ref', 'date', 'type', 'account', 'amount', 'state'];

  protected readonly rows = computed(() =>
    this.filteredOrders().map((o, i) => {
      const st = stateOf(o);
      const left = Math.max(0, o.qty - o.filled);
      return {
        date: frDate(o.date),
        side: o.side,
        sideColor: o.side === 'ACHAT' ? 'var(--ink-ok)' : 'var(--ink-warn)',
        security: o.security,
        qty: num(o.qty),
        filled: num(o.filled),
        left: num(left),
        leftColor: left > 0 && st !== 'cancelled' ? 'var(--ink-brand)' : 'var(--color-neutral-600)',
        price: o.price,
        tif: o.tif,
        state: STATE_TONE[st].label,
        stateBg: STATE_TONE[st].bg,
        stateFg: STATE_TONE[st].fg,
        stateHint: STATE_TONE[st].hint,
        bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      };
    }),
  );

  protected readonly transferRows = computed(() =>
    this.transfers().map((x, i) => ({
      id: x.id,
      date: frDate(x.date),
      from: x.from,
      to: x.to,
      amount: x.amount.toLocaleString('fr-FR') + ' ' + x.currency,
      state: x.state,
      stateBg: x.state === 'Exécuté' ? 'rgba(15,118,110,0.14)' : 'rgba(2,132,199,0.14)',
      stateFg: x.state === 'Exécuté' ? 'var(--ink-ok)' : 'var(--ink-info)',
      bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
    })),
  );

  protected readonly corporateUpcoming = computed(() => {
    const evs = this.corporateEvents();
    const up = evs.filter((x) => x.date >= TODAY && x.date <= HORIZON);
    return `${up.length} événement(s) sur les 30 prochains jours · ${up.filter((x) => x.deadline).length} avec échéance de réponse`;
  });

  protected readonly corporateRows = computed(() =>
    this.corporateEvents()
      .slice()
      .sort((a, b) => {
        const fa = a.date >= TODAY ? 0 : 1;
        const fb = b.date >= TODAY ? 0 : 1;
        return fa !== fb ? fa - fb : fa === 0 ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      })
      .map((x, i) => ({
        id: x.id,
        date: frDate(x.date),
        type: x.type,
        security: x.security,
        account: x.account,
        deadline: x.deadline ? frDate(x.deadline) : x.date >= TODAY ? 'Automatique' : '—',
        deadlineColor: !x.deadline ? 'var(--color-neutral-600)' : (() => {
          const d = Math.round((new Date(x.deadline).getTime() - new Date(TODAY).getTime()) / 86400000);
          return d < 0 ? 'var(--ink-magenta)' : d <= 7 ? 'var(--ink-warn)' : 'var(--color-text)';
        })(),
        deadlineWeight: x.deadline ? '600' : '400',
        deadlineHint: x.deadline ? `Réponse attendue avant le ${frDate(x.deadline)}` : x.date >= TODAY ? 'Événement obligatoire : aucune instruction à donner' : 'Événement passé',
        amount: x.amount ? x.amount.toLocaleString('fr-FR') + ' €' : '—',
        state: x.state,
        stateBg: 'rgba(180,83,9,0.14)',
        stateFg: 'var(--ink-warn)',
        bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      })),
  );

  protected readonly cashflowRows = computed(() =>
    this.cashflowEvents().map((x, i) => ({
      id: x.id,
      date: frDate(x.date),
      type: x.type,
      account: x.account,
      amount: x.amount.toLocaleString('fr-FR') + ' ' + x.currency,
      amountColor: x.amount < 0 ? 'var(--ink-warn)' : 'var(--ink-ok-2)',
      state: x.state,
      stateBg: 'rgba(162,28,175,0.14)',
      stateFg: 'var(--ink-magenta)',
      bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
    })),
  );

  protected setTab(key: Tab): void {
    this.tab.set(key);
  }

  protected setStateFilter(key: 'all' | OrderState): void {
    this.stateFilter.set(key);
  }

  /* `mat-accordion` bascule le panneau au clic et autorise le repli complet, là où
     `togglePanel` ne faisait que poser la section sans jamais la refermer. La garde sur la
     section courante évite qu'en ouvrant un panneau, la fermeture automatique du précédent —
     émise juste après — n'efface la valeur qui vient d'être posée. */
  protected setPanel(section: PanelSection, expanded: boolean): void {
    if (expanded) this.openPanel.set(section);
    else if (this.openPanel() === section) this.openPanel.set(null);
  }

  protected openSheet(): void {
    this.bottomSheet
      .open(OperationsActionSheet)
      .afterDismissed()
      .subscribe((kind) => {
        if (kind) this.openForm(kind);
      });
  }

  protected openForm(kind: PanelKind): void {
    this.dialog
      .open<OperationFormDialog, OperationFormData, OperationResult | undefined>(OperationFormDialog, {
        data: { kind },
        panelClass: 'pm-side-panel-overlay',
        position: SIDE_PANEL_LAYOUT.position,
        height: SIDE_PANEL_LAYOUT.height,
        maxWidth: '100vw',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        if (result.kind === 'trade') this.orders.update((o) => [result.order, ...o]);
        else if (result.kind === 'transfer') this.transfers.update((t) => [result.transfer, ...t]);
        else if (result.kind === 'cashflow') this.cashflowEvents.update((c) => [result.event, ...c]);
      });
  }
}
