import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  CHECKS,
  CLOSE_TASKS,
  ENTRIES,
  ENTRY_STATE_TINT,
  JOURNALS,
  PERIODS,
  RESULT_ROWS,
  TOTAL_PRODUITS,
  eur,
  num,
  periodLabel,
  type CloseTask,
  type Entry,
} from './comptabilite-data';

type Tab = 'journal' | 'balance' | 'result' | 'close';

/** Rangée du journal : l'écriture, ou le détail de ses lignes quand elle est dépliée. */
interface JournalRow {
  readonly kind: 'entry' | 'detail';
  readonly ref: string;
}

/**
 * Porté depuis `Comptabilite.dc.html`. Quatre onglets : le journal des écritures, la balance,
 * le compte de résultat et les travaux de clôture.
 *
 * La balance et les totaux du journal sont **agrégés depuis les écritures**, jamais saisis :
 * c'est ce qui garantit que l'équilibre affiché reflète bien ce que le journal contient.
 * Le compte de résultat, lui, est posé tel quel — il porte un cumul annuel que les écritures
 * du seul mois ne permettraient pas de reconstituer.
 *
 * Le seul état que l'écran modifie est l'avancement des travaux de clôture et le verrou de
 * période ; les écritures ne sont pas éditables, comme dans le prototype.
 */
@Component({
  selector: 'app-comptabilite',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './comptabilite.html',
  styleUrl: './comptabilite.css',
})
export class Comptabilite {
  protected readonly periods = PERIODS;
  protected readonly journals = JOURNALS;
  protected readonly checks = computed(() =>
    CHECKS.map((c) => ({ ...c, color: c.level === 'ok' ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)' })),
  );

  // -- État ---------------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('journal');
  protected readonly period = signal('2026-08');
  protected readonly journalFilter = signal('all');
  protected readonly query = signal('');
  protected readonly openRef = signal<string | null>(null);
  protected readonly tasks = signal<readonly CloseTask[]>(CLOSE_TASKS);
  protected readonly closed = signal(false);

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected readonly pageTabs = [
    { key: 'journal' as const, label: 'Journal des écritures', icon: 'table-rows' },
    { key: 'balance' as const, label: 'Balance', icon: 'allocation-split' },
    { key: 'result' as const, label: 'Compte de résultat', icon: 'chart-bar' },
    { key: 'close' as const, label: 'Clôture', icon: 'check-circle' },
  ];

  // -- En-tête ------------------------------------------------------------------------------
  private readonly pending = computed(() => ENTRIES.filter((e) => e.state === 'À valider').length);

  protected readonly subtitle = computed(
    () => `${periodLabel(this.period())} · compte BGM-004 · ${ENTRIES.length} écritures, ${this.pending()} à valider`,
  );

  /** Un travail bloquant non fait interdit la clôture. */
  private readonly blocking = computed(() => this.tasks().filter((t) => t.blocking && !t.done).length);

  protected readonly canClose = computed(() => this.blocking() === 0 && !this.closed());

  protected readonly closeBadge = computed(() => {
    if (this.closed()) return { label: 'Période clôturée', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' };
    if (this.blocking()) return { label: 'Clôture bloquée', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' };
    return { label: 'Clôture ouverte', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' };
  });

  // -- Journal ------------------------------------------------------------------------------
  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const jf = this.journalFilter();
    return ENTRIES.filter((e) => {
      if (jf !== 'all' && e.journal !== jf) return false;
      if (!q) return true;
      /* La recherche porte aussi sur les lignes : on cherche souvent une écriture par le
         numéro de compte qu'elle mouvemente, pas par son libellé. */
      const hay = `${e.ref} ${e.label} ${e.origin} ${e.lines.map((l) => `${l.account} ${l.name}`).join(' ')}`;
      return hay.toLowerCase().includes(q);
    });
  });

  protected readonly journalNote = computed(
    () => `${this.filtered().length} / ${ENTRIES.length} écritures affichées`,
  );

  /* MatTable n'a qu'un seul corps : l'écriture et son détail sont deux rangées de la même
     liste, distinguées par un `when:` — même montage que le registre des transactions. */
  protected readonly journalRows = computed<readonly JournalRow[]>(() => {
    const open = this.openRef();
    return this.filtered().flatMap((e) =>
      e.ref === open
        ? [{ kind: 'entry' as const, ref: e.ref }, { kind: 'detail' as const, ref: e.ref }]
        : [{ kind: 'entry' as const, ref: e.ref }],
    );
  });

  protected entryOf(ref: string): Entry {
    return ENTRIES.find((e) => e.ref === ref)!;
  }

  protected view(ref: string) {
    const e = this.entryOf(ref);
    const debit = e.lines.reduce((n, l) => n + l.debit, 0);
    const credit = e.lines.reduce((n, l) => n + l.credit, 0);
    const tint = ENTRY_STATE_TINT[e.state];
    const open = this.openRef() === ref;
    return {
      ...e,
      debit: `${num(debit)} €`,
      credit: `${num(credit)} €`,
      stateBg: tint.bg,
      stateFg: tint.fg,
      bg: open ? 'var(--color-neutral-100)' : 'var(--surface)',
      open,
      detailLines: e.lines.map((l) => ({
        account: l.account,
        name: l.name,
        debit: l.debit ? `${num(l.debit)} €` : '—',
        credit: l.credit ? `${num(l.credit)} €` : '—',
      })),
    };
  }

  protected toggle(ref: string): void {
    this.openRef.update((r) => (r === ref ? null : ref));
  }

  /* Les totaux portent sur la période entière et non sur le résultat filtré : c'est l'équilibre
     du journal qu'ils contrôlent, qu'une recherche ne doit pas fausser. */
  private readonly totals = computed(() => {
    const sum = (pick: (l: { debit: number; credit: number }) => number) =>
      ENTRIES.reduce((n, e) => n + e.lines.reduce((m, l) => m + pick(l), 0), 0);
    const debit = sum((l) => l.debit);
    const credit = sum((l) => l.credit);
    return {
      debit: `${num(debit)} €`,
      credit: `${num(credit)} €`,
      balanced: debit === credit,
      label: debit === credit ? 'Équilibré' : `Écart de ${num(debit - credit)} €`,
      color: debit === credit ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)',
    };
  });

  protected readonly totalDebit = computed(() => this.totals().debit);
  protected readonly totalCredit = computed(() => this.totals().credit);
  protected readonly balanceLabel = computed(() => this.totals().label);
  protected readonly balanceColor = computed(() => this.totals().color);

  protected readonly journalColumns = ['ref', 'date', 'journal', 'label', 'debit', 'credit', 'state'];
  protected readonly journalDetailColumns = ['detail'];
  protected isEntryRow = (_: number, row: JournalRow) => row.kind === 'entry';
  protected isDetailRow = (_: number, row: JournalRow) => row.kind === 'detail';

  // -- Balance ------------------------------------------------------------------------------
  protected readonly balanceRows = computed(() => {
    const acc = new Map<string, { account: string; name: string; debit: number; credit: number }>();
    for (const e of ENTRIES) {
      for (const l of e.lines) {
        const cur = acc.get(l.account) ?? { account: l.account, name: l.name, debit: 0, credit: 0 };
        acc.set(l.account, { ...cur, debit: cur.debit + l.debit, credit: cur.credit + l.credit });
      }
    }
    return [...acc.values()]
      .sort((a, b) => a.account.localeCompare(b.account))
      .map((a) => ({
        account: a.account,
        name: a.name,
        debit: a.debit ? `${num(a.debit)} €` : '—',
        credit: a.credit ? `${num(a.credit)} €` : '—',
        balance: eur(a.debit - a.credit),
      }));
  });

  protected readonly balanceNote = computed(
    () => `${this.balanceRows().length} comptes mouvementés sur ${periodLabel(this.period()).toLowerCase()}`,
  );

  protected readonly balanceColumns = ['account', 'debit', 'credit', 'balance'];

  // -- Compte de résultat -------------------------------------------------------------------
  protected readonly resultNote = computed(() => `${periodLabel(this.period())} · cumul depuis le 1er janvier`);

  protected readonly resultRows = computed(() =>
    RESULT_ROWS.map((r) => ({
      label: r.label,
      amount: r.amount === undefined ? '' : eur(r.amount),
      /* Pas de part sur les en-têtes de section : ils n'ont pas de montant à rapporter. */
      share: r.amount === undefined || r.total ? '' : `${Math.round((Math.abs(r.amount) / TOTAL_PRODUITS) * 100)} %`,
      indent: r.indent ? '14px' : '0',
      size: r.result ? '14px' : '12px',
      weight: r.total || r.subtotal || r.result ? '700' : '400',
      color:
        r.amount === undefined
          ? 'var(--color-text)'
          : r.amount < 0
            ? 'var(--ink-warn-2)'
            : r.result || r.subtotal
              ? 'var(--ink-ok-2)'
              : 'var(--color-text)',
      rowBg: r.result || r.total ? 'var(--color-neutral-100)' : 'var(--surface)',
    })),
  );

  // -- Clôture ------------------------------------------------------------------------------
  protected readonly closeProgress = computed(
    () => `${this.tasks().filter((t) => t.done).length} / ${this.tasks().length} travaux terminés`,
  );

  protected readonly closeTasks = computed(() =>
    this.tasks().map((t) => ({
      ...t,
      metaColor: t.blocking && !t.done ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)',
    })),
  );

  protected toggleTask(id: string): void {
    this.tasks.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  protected readonly closeHint = computed(() => {
    if (this.closed()) return 'Période clôturée — les écritures sont verrouillées.';
    const n = this.blocking();
    if (!n) return 'Tous les contrôles bloquants sont levés.';
    return `${n} ${n > 1 ? 'travaux bloquants restants' : 'travail bloquant restant'}`;
  });

  protected closePeriod(): void {
    if (this.canClose()) this.closed.set(true);
  }
}
