import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { CASH_KINDS, HIST_KINDS, HIST_RANGES, PORTFOLIOS, type CashKindKey, type HistKindKey } from './positions-data';
import { buildAccountJournal, buildCashJournal, buildPositionJournal, buildPositionRef } from './position-history-model';
import { nextSort, sortHeaderView } from './positions-sort';
import { ICON_HISTORY } from './positions-icons';

/** Identifie la cible du panneau : `__account`/`__cash` (bandeau bleu du compte / ligne
 * Trésorerie), ou le ticker d'une position — mêmes trois cas que `parts[1]` dans le
 * prototype (`histKey = pf.id + '|' + cible`). */
export interface HistoryDialogData {
  readonly portfolioId: string;
  readonly target: string;
}

const HIST_KIND_OPTIONS: readonly { readonly key: HistKindKey; readonly label: string }[] = [
  { key: 'buy', label: 'Achats' },
  { key: 'sell', label: 'Ventes' },
  { key: 'div', label: 'Dividendes' },
  { key: 'split', label: 'Divisions' },
];

/** Porté depuis les branches `__account`/`__cash`/position du panneau `histInfo` de
 * `Positions.dc.html`, monté ici dans le chrome partagé `SidePanel`. */
@Component({
  selector: 'app-position-history-dialog',
  imports: [MatTabsModule, MatIconModule, MatButtonToggleModule, MatTableModule, MatTooltipModule, SidePanel],
  templateUrl: './position-history-dialog.html',
  styleUrl: './position-history-dialog.css',
})
export class PositionHistoryDialog {
  private readonly data = inject<HistoryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PositionHistoryDialog>);

  protected readonly icon = ICON_HISTORY;
  protected readonly pf = PORTFOLIOS.find((p) => p.id === this.data.portfolioId)!;
  protected readonly isAccount = this.data.target === '__account';
  protected readonly isCash = this.data.target === '__cash';
  protected readonly pos = this.isAccount || this.isCash ? undefined : this.pf.positions.find((p) => p.ticker === this.data.target);

  protected readonly rangeOptions = HIST_RANGES;
  protected readonly kindOptions: readonly { readonly key: string; readonly label: string; readonly bg: string; readonly fg: string }[] = this.isCash
    ? (Object.keys(CASH_KINDS) as CashKindKey[]).map((key) => ({ key, label: CASH_KINDS[key].label, bg: CASH_KINDS[key].bg, fg: CASH_KINDS[key].fg }))
    : HIST_KIND_OPTIONS.map((k) => ({ ...k, bg: HIST_KINDS[k.key].bg, fg: HIST_KINDS[k.key].fg }));

  protected readonly tabs = this.isAccount
    ? [{ key: 'journal' as const, label: 'Historique du compte' }]
    : this.isCash
      ? [{ key: 'journal' as const, label: 'Mouvements de trésorerie' }]
      : [{ key: 'journal' as const, label: 'Historique des transactions' }, { key: 'ref' as const, label: 'Fiche du titre' }];

  protected readonly range = signal('5a');
  protected readonly kinds = signal<Record<string, boolean>>(Object.fromEntries(this.kindOptions.map((k) => [k.key, true])));
  protected readonly tab = signal<'journal' | 'ref'>('journal');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly rangeInfo = computed(() => this.rangeOptions.find((r) => r.key === this.range()) ?? this.rangeOptions[1]);

  protected readonly journal = computed(() => {
    const months = this.rangeInfo().months;
    const label = this.rangeInfo().label;
    if (this.isAccount) {
      return buildAccountJournal(this.pf, months, label, this.kinds() as Record<HistKindKey, boolean>, this.sortKey(), this.sortDir());
    }
    if (this.isCash) {
      return buildCashJournal(this.pf, months, label, this.kinds() as Record<CashKindKey, boolean>, this.sortKey(), this.sortDir());
    }
    return buildPositionJournal(this.pf, this.pos!, months, label, this.kinds() as Record<HistKindKey, boolean>, this.sortKey(), this.sortDir());
  });

  /* La colonne « Titre » n'existe que pour un journal couvrant plusieurs lignes : elle est
     retirée de la liste des colonnes plutôt que masquée, seule façon propre avec MatTable. */
  protected readonly histColumns = computed(() =>
    this.journal().showTicker
      ? ['date', 'security', 'lot', 'operation', 'quantity', 'price', 'amount', 'position']
      : ['date', 'lot', 'operation', 'quantity', 'price', 'amount', 'position'],
  );

  protected readonly ref = computed(() => (this.pos ? buildPositionRef(this.pos) : null));

  protected readonly allOn = computed(() => this.kindOptions.every((k) => this.kinds()[k.key] !== false));

  protected setRange(key: string): void {
    this.range.set(key);
  }

  protected toggleKind(key: string): void {
    this.kinds.update((k) => ({ ...k, [key]: k[key] === false }));
  }

  protected toggleAll(): void {
    const on = this.allOn();
    this.kinds.set(Object.fromEntries(this.kindOptions.map((k) => [k.key, !on])));
  }

  protected setTab(key: 'journal' | 'ref'): void {
    this.tab.set(key);
  }

  protected sortHeader(key: string) {
    return sortHeaderView(this.sortKey(), this.sortDir(), key);
  }

  protected onSort(key: string): void {
    const next = nextSort(this.sortKey(), this.sortDir(), key);
    this.sortKey.set(next.key);
    this.sortDir.set(next.dir);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
