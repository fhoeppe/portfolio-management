import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { CASH, CashLine, LINES, ReconLine, ReconStateKey, SCOPES, STATE, num, signed, toneByColor } from './reconciliation-data';

interface PillTab {
  label: string;
  divider: string;
  bg: string;
  fg: string;
  weight: string;
  onClick: () => void;
}

interface LogEntry {
  time: string;
  label: string;
  detail: string;
  actor: string;
}

type Tab = 'sec' | 'cash';
type Filter = 'all' | 'gap' | 'pending' | 'ok';

/**
 * Porté depuis `Reconciliation.dc.html`. Écran compact (514 lignes source) : construit
 * directement, sans passer par un fork de portage (contrairement à Titres/Comptes).
 */
@Component({
  selector: 'app-reconciliation',
  imports: [MatTabsModule, MatIconModule, MatButtonModule, MatSelectModule, MatTableModule],
  templateUrl: './reconciliation.html',
  styleUrl: './reconciliation.css',
})
export class Reconciliation {
  protected readonly tab = signal<Tab>('sec');
  protected readonly scope = signal('bgm');
  protected readonly filter = signal<Filter>('all');
  protected readonly selected = signal('USLC');
  protected readonly selectedCash = signal('EUR — compte collatéral');
  protected readonly note = signal('');
  protected readonly running = signal(false);
  protected readonly marks = signal<Record<string, ReconStateKey>>({
    USLC: 'pending',
    EUEQ: 'gap',
    INFRA: 'gap',
  });
  protected readonly log = signal<LogEntry[]>([
    {
      time: '07:15',
      label: 'Réconciliation automatique exécutée',
      detail: '9 lignes titres et 4 comptes espèces rapprochés des rapports brokers',
      actor: 'Automatique',
    },
    { time: '07:16', label: '3 écarts détectés', detail: 'USLC, EUEQ, INFRA', actor: 'Automatique' },
    { time: '07:40', label: 'Rapport broker intégré', detail: 'Relevé de positions du 31/08, 09:00 CET', actor: 'Back office' },
    { time: 'Hier', label: 'Écart REIT soldé', detail: 'Saisie alignée sur le rapport broker CUST-77208', actor: 'A. Meyer' },
  ]);

  protected readonly scopeOptions = SCOPES;

  private runTimer?: ReturnType<typeof setTimeout>;

  private stateOf(l: ReconLine): ReconStateKey {
    if (l.internal - l.custody === 0) return 'ok';
    return this.marks()[l.ticker] || 'gap';
  }

  private cashStateOf(c: CashLine): ReconStateKey {
    if (c.internal === c.bank) return 'ok';
    return this.marks()[c.label] || 'gap';
  }

  protected readonly gaps = computed(() => LINES.filter((l) => ['gap', 'escalated'].includes(this.stateOf(l))).length);
  protected readonly pending = computed(() => LINES.filter((l) => this.stateOf(l) === 'pending').length);
  protected readonly matched = computed(() => LINES.length - this.gaps() - this.pending());
  protected readonly cashGap = computed(() => CASH.filter((c) => ['gap', 'escalated'].includes(this.cashStateOf(c))).length);

  protected readonly cur = computed(() => LINES.find((l) => l.ticker === this.selected()) || LINES[0]);
  protected readonly curCash = computed(() => {
    const c = CASH.find((x) => x.label === this.selectedCash()) || CASH[0];
    return { ...c, currency: c.label.split(' ')[0] };
  });

  protected readonly subtitle = computed(() => {
    const scopeLabel = (SCOPES.find((s) => s.value === this.scope()) || SCOPES[0]).label;
    return (
      scopeLabel +
      (this.tab() === 'cash' ? ' · comptes espèces' : ' · lignes titres') +
      " · saisie manuelle de l'application comparée aux rapports brokers reçus · au 31/08/2026"
    );
  });

  protected readonly runLabel = computed(() => (this.running() ? 'Réconciliation lancée' : 'Relancer la réconciliation'));

  protected readonly pageTabs = computed(() => {
    const tab = this.tab();
    return (['sec', 'cash'] as Tab[]).map((key) => {
      const on = tab === key;
      return {
        key,
        label: key === 'sec' ? 'Titres' : 'Liquidité',
        badge: key === 'sec' ? String(this.gaps() + this.pending()) : String(this.cashGap()),
        height: on ? '40px' : '32px',
        padding: on ? '0 20px' : '0 14px',
        size: on ? '14px' : '12px',
        bg: on ? 'var(--ds-brand-fill, var(--field-brand))' : 'rgba(0,61,165,0.08)',
        fg: on ? '#ffffff' : 'var(--ink-brand)',
        badgeBg: on ? 'rgba(255,255,255,0.22)' : 'rgba(0,61,165,0.16)',
        badgeFg: on ? '#ffffff' : 'var(--ink-brand)',
      };
    });
  });

  protected readonly kpis = computed(() => {
    const gaps = this.gaps();
    const pending = this.pending();
    const matched = this.matched();
    const cashGap = this.cashGap();
    const cashCurrencies = new Set(CASH.map((c) => c.label.split(' ')[0])).size;
    const cashDiffTotal = CASH.reduce((n, c) => n + (c.internal - c.bank), 0);
    const cashDiffLabel = cashDiffTotal === 0 ? '—' : signed(cashDiffTotal) + ' €';

    const raw =
      this.tab() === 'sec'
        ? [
            { label: 'Lignes rapprochées', value: matched + ' / ' + LINES.length, note: 'Saisie conforme au rapport broker', color: 'var(--ink-ok-2)' },
            { label: 'Écarts à traiter', value: String(gaps), note: gaps ? 'Justification requise' : 'Aucun écart ouvert', color: gaps ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
            { label: 'En attente de dénouement', value: String(pending), note: 'Opérations J+2 en cours', color: 'var(--ds-brand-fill, var(--ink-brand-2))' },
            { label: 'Quantités contrôlées', value: String(LINES.length), note: 'Lignes titres au rapport broker', color: 'var(--color-text)' },
          ]
        : [
            { label: 'Comptes rapprochés', value: CASH.length - cashGap + ' / ' + CASH.length, note: 'Saisie conforme au relevé broker', color: 'var(--ink-ok-2)' },
            { label: 'Écarts espèces', value: String(cashGap), note: cashGap ? 'Justification requise' : 'Aucun écart ouvert', color: cashGap ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
            { label: 'Devises suivies', value: String(cashCurrencies), note: 'Comptes courants et collatéral', color: 'var(--color-text)' },
            { label: 'Écart cumulé', value: cashDiffLabel, note: 'Somme des écarts constatés', color: cashGap ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
          ];
    return raw.map(toneByColor);
  });

  private pillTab(label: string, on: boolean, fn: () => void, first = false): PillTab {
    return {
      label,
      onClick: fn,
      divider: first ? '0' : '1px solid rgba(0,61,165,0.30)',
      bg: on ? 'var(--ds-brand-fill, var(--field-brand))' : 'rgba(0,61,165,0.08)',
      fg: on ? '#ffffff' : 'var(--ink-brand)',
      weight: on ? '600' : '400',
    };
  }

  protected readonly filterTabs = computed(() => {
    const f = this.filter();
    return [
      this.pillTab('Toutes', f === 'all', () => this.filter.set('all'), true),
      this.pillTab('Écarts', f === 'gap', () => this.filter.set('gap')),
      this.pillTab('En attente', f === 'pending', () => this.filter.set('pending')),
      this.pillTab('Rapprochées', f === 'ok', () => this.filter.set('ok')),
    ];
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filter();
    return LINES.filter((l) => {
      const st = this.stateOf(l);
      if (f === 'all') return true;
      if (f === 'gap') return st === 'gap' || st === 'escalated';
      if (f === 'pending') return st === 'pending';
      return st === 'ok' || st === 'justified';
    });
  });

  protected readonly rowsNote = computed(() => this.filteredRows().length + ' / ' + LINES.length + ' lignes');

  protected readonly secColumns = ['ligne', 'interne', 'broker', 'ecart', 'etat'];

  /* La cellule « ligne » du pied couvre quatre colonnes : le pied n'en déclare donc que deux. */
  protected readonly secFooterColumns = ['ligne', 'etat'];

  protected readonly cashColumns = ['compte', 'interne', 'releve', 'ecart', 'cause', 'etat'];

  protected readonly rows = computed(() =>
    this.filteredRows().map((l) => {
      const st = this.stateOf(l);
      const diff = l.internal - l.custody;
      const on = l.ticker === this.selected();
      return {
        ticker: l.ticker,
        name: l.name,
        internal: num(l.internal),
        custody: num(l.custody),
        diff: signed(diff),
        diffColor: diff === 0 ? 'var(--color-neutral-600)' : 'var(--ink-warn-2)',
        state: STATE[st].label,
        stateBg: STATE[st].bg,
        stateFg: STATE[st].fg,
        bg: on ? 'var(--color-neutral-100)' : 'var(--surface)',
        mark: on ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'transparent',
        onSelect: () => {
          this.selected.set(l.ticker);
          this.note.set('');
        },
      };
    }),
  );

  protected readonly shownGaps = computed(() => this.filteredRows().filter((l) => l.internal !== l.custody).length);
  protected readonly footNote = computed(() => {
    const n = this.shownGaps();
    return n === 0 ? 'Aucun écart affiché' : n + (n > 1 ? ' écarts affichés' : ' écart affiché');
  });
  protected readonly footColor = computed(() => (this.shownGaps() ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)'));

  protected readonly cashNote = computed(() => {
    const n = this.cashGap();
    return n ? n + ' écart(s) sur ' + CASH.length + ' comptes' : 'Tous les comptes rapprochés';
  });

  protected readonly cashRows = computed(() =>
    CASH.map((c) => {
      const diff = c.internal - c.bank;
      const on = c.label === this.selectedCash();
      const st = this.cashStateOf(c);
      return {
        label: c.label,
        state: STATE[st].label,
        stateBg: STATE[st].bg,
        stateFg: STATE[st].fg,
        bg: on ? 'rgba(0,61,165,0.08)' : 'var(--surface)',
        mark: on ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'transparent',
        onSelect: () => {
          this.selectedCash.set(c.label);
          this.note.set('');
        },
        internal: (c.internal < 0 ? '−' : '') + num(c.internal),
        bank: (c.bank < 0 ? '−' : '') + num(c.bank),
        diff: signed(diff),
        diffColor: diff === 0 ? 'var(--color-neutral-600)' : 'var(--ink-warn-2)',
        cause: c.cause,
      };
    }),
  );

  protected readonly detail = computed(() => {
    if (this.tab() === 'cash') {
      const curCash = this.curCash();
      const st = this.cashStateOf(curCash);
      return {
        title: curCash.label,
        subtitle: "Saisie de l'application comparée au relevé broker, en " + curCash.currency,
        state: STATE[st].label,
        stateBg: STATE[st].bg,
        stateFg: STATE[st].fg,
        rows: [
          { label: 'Saisie interne', value: (curCash.internal < 0 ? '−' : '') + num(curCash.internal) + ' ' + curCash.currency },
          { label: 'Relevé broker', value: (curCash.bank < 0 ? '−' : '') + num(curCash.bank) + ' ' + curCash.currency },
          {
            label: 'Écart',
            value: signed(curCash.internal - curCash.bank) + (curCash.internal === curCash.bank ? '' : ' ' + curCash.currency),
          },
          {
            label: 'Écart en %',
            value: curCash.bank ? (((curCash.internal - curCash.bank) / Math.abs(curCash.bank)) * 100).toFixed(2).replace('.', ',') + ' %' : '—',
          },
          { label: 'Nature du compte', value: curCash.label.indexOf('collatéral') >= 0 ? 'Compte de collatéral' : 'Compte courant' },
          { label: 'Cause probable', value: curCash.cause && curCash.cause !== '—' ? curCash.cause : 'Aucun écart constaté' },
          { label: 'Dernier contrôle', value: '31/08/2026, 07:15' },
        ],
      };
    }
    const cur = this.cur();
    const st = this.stateOf(cur);
    return {
      title: cur.ticker + ' — ' + cur.name,
      subtitle: "Saisie de l'application comparée au rapport broker, en " + cur.unit,
      state: STATE[st].label,
      stateBg: STATE[st].bg,
      stateFg: STATE[st].fg,
      rows: [
        { label: 'Saisie interne', value: num(cur.internal) + ' ' + cur.unit },
        { label: 'Rapport broker', value: num(cur.custody) + ' ' + cur.unit },
        { label: 'Écart', value: signed(cur.internal - cur.custody) + ' ' + cur.unit },
        { label: 'Écart en %', value: cur.custody ? (((cur.internal - cur.custody) / cur.custody) * 100).toFixed(2).replace('.', ',') + ' %' : '—' },
        { label: 'Référence liée', value: cur.ref },
        { label: 'Cause probable', value: cur.cause || 'Aucun écart constaté' },
        { label: 'Dernier contrôle', value: '31/08/2026, 07:15' },
      ],
    };
  });

  private markKey(): string {
    return this.tab() === 'cash' ? this.curCash().label : this.cur().ticker;
  }

  private markCause(): string {
    if (this.tab() === 'cash') {
      const c = this.curCash();
      return c.cause !== '—' ? c.cause : '';
    }
    return this.cur().cause;
  }

  private nowTime(): string {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  private mark(key: string, state: ReconStateKey, label: string, detail: string): void {
    this.marks.update((m) => ({ ...m, [key]: state }));
    this.log.update((l) => [{ time: this.nowTime(), label, detail, actor: 'F. Hoeppe' }, ...l]);
  }

  protected setNote(value: string): void {
    this.note.set(value);
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected runRecon(): void {
    this.running.set(true);
    this.log.update((l) => [
      { time: this.nowTime(), label: 'Réconciliation relancée', detail: LINES.length + ' lignes et ' + CASH.length + ' comptes comparés', actor: 'F. Hoeppe' },
      ...l,
    ]);
    if (this.runTimer) clearTimeout(this.runTimer);
    this.runTimer = setTimeout(() => this.running.set(false), 1400);
  }

  protected justify(): void {
    this.mark(this.markKey(), 'justified', 'Écart ' + this.markKey() + ' marqué justifié', this.note() || this.markCause() || 'Justification saisie');
  }

  protected escalate(): void {
    this.mark(this.markKey(), 'escalated', 'Écart ' + this.markKey() + ' escaladé au broker', this.note() || "Demande d'investigation transmise");
  }

  protected resolve(): void {
    this.mark(this.markKey(), 'ok', 'Écart ' + this.markKey() + ' soldé', this.note() || 'Saisie corrigée, alignée sur le relevé broker');
  }

  ngOnDestroy(): void {
    if (this.runTimer) clearTimeout(this.runTimer);
  }
}
