import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { dateToIso, isoToDate } from '../../shell/date-bridge';
import {
  CATALOG,
  CURRENCIES,
  FORMATS,
  GENERATION_MS,
  OPTIONS,
  PERIODS,
  SCOPES,
  SEED_JOBS,
  fmtDate,
  iso,
  periodLabel,
  periodRange,
  type Job,
  type OptionKey,
  type PeriodKey,
} from './rapports-data';

/**
 * Porté depuis `Rapports.dc.html`. Un catalogue de rapports, les paramètres de génération du
 * rapport retenu, et la liste des générations récentes.
 *
 * Les paramètres sont communs à tous les rapports : changer de rapport dans le sélecteur ne
 * remet à zéro ni le périmètre, ni la période, ni les options — c'est le comportement du
 * prototype, et il évite de resaisir les mêmes bornes pour éditer deux rapports de suite.
 */
@Component({
  selector: 'app-rapports',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './rapports.html',
  styleUrl: './rapports.css',
})
export class Rapports {
  protected readonly scopes = SCOPES;
  protected readonly currencies = CURRENCIES;
  protected readonly options = OPTIONS;
  protected readonly formats = FORMATS;
  protected readonly periods = PERIODS;

  protected readonly isoToDate = isoToDate;
  protected readonly dateToIso = dateToIso;

  /** Le sélecteur est groupé par famille, dans l'ordre d'apparition au catalogue. */
  protected readonly groups = [...new Set(CATALOG.map((r) => r.group))].map((label) => ({
    label,
    reports: CATALOG.filter((r) => r.group === label),
  }));

  // -- État ---------------------------------------------------------------------------------
  private readonly now = new Date();

  protected readonly selectedId = signal('valo');
  protected readonly period = signal<PeriodKey>('month');
  protected readonly scope = signal('bgm');
  protected readonly currency = signal('EUR');
  protected readonly format = signal('PDF');
  protected readonly from = signal(iso(new Date(this.now.getFullYear(), this.now.getMonth(), 1)));
  protected readonly to = signal(iso(this.now));
  protected readonly opts = signal<Record<OptionKey, boolean>>({
    charts: true,
    bench: true,
    lines: false,
    annex: false,
  });
  protected readonly jobs = signal<readonly Job[]>(SEED_JOBS);

  protected readonly selected = computed(
    () => CATALOG.find((r) => r.id === this.selectedId()) ?? CATALOG[0],
  );

  protected readonly isCustom = computed(() => this.period() === 'custom');

  /* Les bornes des périodes calendaires se déduisent de la maille : seule « Personnalisée »
     laisse les deux dates à la main de l'utilisateur. */
  protected setPeriod(p: PeriodKey): void {
    this.period.set(p);
    const range = periodRange(p, this.now);
    if (!range) return;
    this.from.set(range.from);
    this.to.set(range.to);
  }

  protected toggleOption(key: OptionKey, checked: boolean): void {
    this.opts.update((o) => ({ ...o, [key]: checked }));
  }

  protected readonly periodText = computed(() => periodLabel(this.period(), this.from(), this.to()));

  protected readonly recap = computed(() => {
    const scopeLabel = (SCOPES.find((s) => s.value === this.scope()) ?? SCOPES[0]).label;
    const active = OPTIONS.filter((o) => this.opts()[o.key]).length;
    return `${scopeLabel} · ${this.periodText()} · ${this.currency()} · ${active} ${active > 1 ? 'options' : 'option'}`;
  });

  // -- Générations --------------------------------------------------------------------------
  protected readonly jobColumns = ['name', 'scope', 'period', 'at', 'state', 'actions'];

  protected readonly jobCount = computed(() => {
    const n = this.jobs().length;
    return `${n} ${n > 1 ? 'rapports' : 'rapport'}`;
  });

  protected readonly jobRows = computed(() =>
    this.jobs().map((j) => ({
      ...j,
      ready: j.state === 'ready',
      stateLabel: j.state === 'ready' ? 'Prêt' : 'En cours',
      stateBg: j.state === 'ready' ? 'var(--band-ok)' : 'var(--color-neutral-200)',
      stateFg: j.state === 'ready' ? 'var(--ink-ok-2)' : 'var(--color-neutral-700)',
    })),
  );

  /* Les minuteries en vol sont annulées à la destruction du composant : sans cela, un
     `signal.update` se déclencherait sur un composant démonté après un changement d'écran. */
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    });
  }

  protected generate(): void {
    const report = this.selected();
    const scope = SCOPES.find((s) => s.value === this.scope()) ?? SCOPES[0];
    const now = new Date();
    const id = `g${Date.now()}`;
    const p = (n: number) => String(n).padStart(2, '0');

    this.jobs.update((list) => [
      {
        id,
        name: report.name,
        format: this.format(),
        /* Le périmètre est réduit au code du compte — la partie après le tiret cadratin du
           libellé — sauf « Tous les comptes gérés », qui n'en porte pas. */
        scope: this.scope() === 'all' ? 'Tous les comptes' : (scope.label.split('—')[1] ?? scope.label).trim(),
        period: this.periodText(),
        at: `${fmtDate(iso(now))} ${p(now.getHours())}:${p(now.getMinutes())}`,
        state: 'running',
      },
      ...list,
    ]);

    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.jobs.update((list) => list.map((j) => (j.id === id ? { ...j, state: 'ready' as const } : j)));
    }, GENERATION_MS);
    this.timers.add(timer);
  }

  /** Le prototype produit un fichier texte de substitution : la génération réelle est hors sujet. */
  protected download(job: Job): void {
    const body = `Rapport : ${job.name}\nPérimètre : ${job.scope}\nPériode : ${job.period}\nGénéré : ${job.at}\n`;
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${job.format.toLowerCase()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  protected remove(id: string): void {
    this.jobs.update((list) => list.filter((j) => j.id !== id));
  }
}
