import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ACCOUNTS,
  ALERTS,
  CURRENCIES,
  FLOWS,
  FLOW_FILTERS,
  FLOW_STATE_TINT,
  HORIZONS,
  INSTRUCTION_KINDS,
  MANDATES,
  MIN_CASH,
  PLACEMENTS,
  TONE_TINT,
  num,
  parseAmount,
  signed,
  toEur,
  type Flow,
  type HorizonKey,
  type Tone,
} from './tresorerie-data';

type Tab = 'overview' | 'entry';

/**
 * Porté depuis `Tresorerie.dc.html`. Deux onglets : la vue d'ensemble — soldes par compte,
 * prévisionnel, mouvements, vigilance et placements — et la saisie d'une instruction.
 *
 * Tous les agrégats sont dérivés des soldes et des flux : contre-valeur en euro, disponible,
 * flux nets à venir. Seules les instructions saisies s'ajoutent à l'état ; les comptes et le
 * prévisionnel ne sont pas modifiables, comme dans le prototype.
 */
@Component({
  selector: 'app-tresorerie',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './tresorerie.html',
  styleUrl: './tresorerie.css',
})
export class Tresorerie {
  protected readonly mandates = MANDATES;
  protected readonly horizons = HORIZONS;
  protected readonly flowFilters = FLOW_FILTERS;
  protected readonly instructionKinds = INSTRUCTION_KINDS;
  protected readonly currencies = CURRENCIES;
  protected readonly alerts = ALERTS;
  protected readonly placements = PLACEMENTS;
  protected readonly minCash = MIN_CASH;

  // -- État ---------------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('overview');
  protected readonly mandate = signal('bgm');
  protected readonly horizon = signal<HorizonKey>('30j');
  protected readonly flowFilter = signal('all');
  protected readonly flows = signal<readonly Flow[]>(FLOWS);

  protected readonly draft = signal({ kind: 'virement', amount: '', currency: 'EUR', date: '', label: '' });

  /** Nature retenue, pour que le declencheur replie affiche aussi son icone. */
  protected readonly kindOption = computed(
    () => INSTRUCTION_KINDS.find((o) => o.value === this.draft().kind) ?? INSTRUCTION_KINDS[0],
  );

  protected readonly pageTabs = [
    { key: 'overview' as const, label: "Vue d'ensemble" },
    { key: 'entry' as const, label: 'Nouvelle opération' },
  ];

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected patch(p: Partial<{ kind: string; amount: string; currency: string; date: string; label: string }>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  // -- Agrégats -----------------------------------------------------------------------------
  private readonly totalEur = computed(() => ACCOUNTS.reduce((n, a) => n + toEur(a.balance, a.currency), 0));
  private readonly blockedEur = computed(() => ACCOUNTS.reduce((n, a) => n + toEur(a.blocked, a.currency), 0));
  private readonly availableEur = computed(() => this.totalEur() - this.blockedEur());

  /* Les flux à venir sont ceux qui ne sont pas encore réglés : un mouvement passé ne pèse plus
     sur la trésorerie disponible. */
  private readonly pendingFlows = computed(() =>
    this.flows().reduce((n, f) => n + (f.state === 'Réglé' ? 0 : f.amount), 0),
  );

  protected readonly kpis = computed(() => {
    const pending = this.pendingFlows();
    const tint = (t: Tone) => TONE_TINT[t];
    const cards: { label: string; value: string; note: string; tone: Tone }[] = [
      { label: 'Trésorerie totale', value: `${num(this.totalEur() / 1_000_000, 1)} M€`, note: '5 comptes · 4 devises', tone: 'neutral' },
      { label: 'Disponible', value: `${num(this.availableEur() / 1_000_000, 1)} M€`, note: `${num(this.blockedEur() / 1000)} k€ bloqués en collatéral`, tone: 'neutral' },
      { label: 'Flux nets à venir', value: signed(pending / 1000, ' k€'), note: 'Sur les 30 prochains jours', tone: pending < 0 ? 'warn' : 'ok' },
      { label: 'Poids en portefeuille', value: '8,6 %', note: 'Cible 5 % — excédent de 3,6 pts', tone: 'warn' },
    ];
    return cards.map((k) => ({ ...k, bg: tint(k.tone).bg, ink: tint(k.tone).ink }));
  });

  // -- Soldes par compte --------------------------------------------------------------------
  protected readonly accountsNote = computed(() => `Contre-valeur totale ${num(this.totalEur())} €`);

  protected readonly accountRows = computed(() =>
    ACCOUNTS.map((a) => ({
      currency: a.currency,
      bank: a.bank,
      iban: a.iban,
      balance: `${num(a.balance)} ${a.currency}`,
      balColor: a.balance < 0 ? 'var(--ink-warn-2)' : 'var(--color-text)',
      blocked: a.blocked ? num(a.blocked) : '—',
      available: `${num(a.balance - a.blocked)} ${a.currency}`,
      eur: num(toEur(a.balance, a.currency)),
    })),
  );

  protected readonly accountColumns = ['account', 'balance', 'blocked', 'available', 'eur'];

  // -- Prévisionnel -------------------------------------------------------------------------
  protected readonly forecast = computed(() => {
    const h = HORIZONS.find((x) => x.key === this.horizon()) ?? HORIZONS[0];
    /* L'échelle intègre le seuil plus une marge : sans cela, un prévisionnel entièrement sous
       le seuil donnerait des barres pleine hauteur et masquerait l'alerte. */
    const max = Math.max(...h.series, MIN_CASH + 4);
    return h.series.map((v, i) => ({
      label: h.buckets[i],
      value: num(v, 1),
      below: v < MIN_CASH,
      height: `${Math.round((v / max) * 110)}px`,
      color: v < MIN_CASH ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
      valueColor: v < MIN_CASH ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)',
    }));
  });

  protected readonly forecastNote = `Solde projeté en M€ · seuil minimum de ${MIN_CASH} M€ fixé par le compte`;

  // -- Mouvements ---------------------------------------------------------------------------
  protected readonly flowRows = computed(() => {
    const f = this.flowFilter();
    return this.flows()
      .filter((x) => f === 'all' || (f === 'in' && x.amount > 0) || (f === 'out' && x.amount < 0))
      .map((x) => {
        const tint = FLOW_STATE_TINT[x.state];
        return {
          ...x,
          amountLabel: signed(x.amount),
          color: x.amount > 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
          stateBg: tint.bg,
          stateFg: tint.fg,
        };
      });
  });

  protected readonly flowColumns = ['date', 'label', 'kind', 'amount', 'state'];

  // -- Instruction --------------------------------------------------------------------------
  private readonly draftAmountEur = computed(() =>
    toEur(parseAmount(this.draft().amount), this.draft().currency),
  );

  /** Disponible après passage de l'instruction, tous comptes confondus. */
  private readonly afterEur = computed(() => this.availableEur() - this.draftAmountEur());

  protected readonly impact = computed(() => {
    if (!parseAmount(this.draft().amount)) {
      return "Renseignez un montant pour voir l'impact sur le disponible.";
    }
    const under = this.afterEur() / 1_000_000 < MIN_CASH;
    return `Disponible après opération : ${num(this.afterEur())} €${under ? ' — sous le seuil minimum' : ''}`;
  });

  protected readonly impactColor = computed(() =>
    parseAmount(this.draft().amount) && this.afterEur() / 1_000_000 < MIN_CASH
      ? 'var(--ink-warn-2)'
      : 'var(--color-neutral-700)',
  );

  protected openInstruction(): void {
    this.tab.set('entry');
  }

  protected closeInstruction(): void {
    this.tab.set('overview');
  }

  /* Une opération de change entre à l'actif, toutes les autres en sortent : c'est le seul
     endroit où la nature de l'instruction change le signe du montant. */
  protected submitInstruction(): void {
    const d = this.draft();
    const sign = d.kind === 'fx' ? 1 : -1;
    const date = d.date ? `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` : '—';
    this.flows.update((list) => [
      {
        date,
        label: d.label || 'Instruction de trésorerie',
        detail: `Saisie manuelle · ${d.currency}`,
        kind: sign < 0 ? 'Décaissement' : 'Encaissement',
        amount: sign * Math.abs(toEur(parseAmount(d.amount), d.currency)),
        state: 'À valider' as const,
      },
      ...list,
    ]);
    this.draft.set({ kind: 'virement', amount: '', currency: 'EUR', date: '', label: '' });
    this.tab.set('overview');
  }
}
