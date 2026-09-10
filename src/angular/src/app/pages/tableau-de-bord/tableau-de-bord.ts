import { Component, computed, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PanelCard } from '../../ui/panel-card/panel-card';
import { IconGlyph } from '../../shell/icon-glyph';
import {
  ACTIVITY,
  ALLOCATION,
  ANOMALIES,
  EXPOSURES,
  MANDATES,
  PERIOD_LABEL,
  PERIOD_LONG,
  POSITIONS,
  RISK_INDICATORS,
  SERIES,
  SEVERITY_LABEL,
  type PeriodKey,
  type Severity,
} from './tableau-de-bord.data';
import {
  ICON_ACTIVITY,
  ICON_ALLOCATION,
  ICON_ANOMALY,
  ICON_EXPOSURES,
  ICON_PERFORMANCE,
  ICON_POSITIONS,
  ICON_RISK,
} from './tableau-de-bord-icons';

type SortKey = 'weight' | 'day' | 'ytd';
type ExpoKey = keyof typeof EXPOSURES;

/** Signe français (− et non un simple tiret) puis valeur, virgule décimale, espace avant %. */
function pct(v: number, decimals = 2): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return sign + Math.abs(v).toFixed(decimals).replace('.', ',') + ' %';
}

function fmt1(v: number): string {
  return v.toFixed(1).replace('.', ',');
}

/** Chemin SVG d'une série, normalisée dans une boîte 320×110 (voir `path()` du prototype). */
function buildPath(series: readonly number[], min: number, max: number): string {
  const w = 320;
  const h = 110;
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 7 - ((v - min) / (max - min || 1)) * (h - 20);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    })
    .join(' ');
}

/** Fond dégradé + encre d'une vignette KPI, teinté selon le signe et l'ampleur de `v`. */
function perfTone(v: number, cap = 10): { bg: string; fg: string } {
  const mag = Math.min(Math.abs(v) / cap, 1);
  const up = v >= 0;
  const hue = up ? 168 : 32;
  const alpha = (0.1 + mag * 0.06).toFixed(3);
  return {
    bg: `linear-gradient(oklch(0.62 ${alpha} ${hue} / ${alpha}), oklch(0.62 ${alpha} ${hue} / ${alpha})), var(--surface)`,
    fg: up ? 'var(--ink-ok)' : 'var(--ink-warn)',
  };
}

interface KpiView {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly bg: string;
  readonly valueColor: string;
  readonly labelColor: string;
  readonly noteColor: string;
}

interface ToggleOption {
  readonly value: string;
  readonly label: string;
}

const PERIOD_OPTIONS: readonly ToggleOption[] = Object.keys(PERIOD_LABEL).map((k) => ({
  value: k,
  label: PERIOD_LABEL[k as PeriodKey],
}));

const SORT_OPTIONS: readonly ToggleOption[] = [
  { value: 'weight', label: 'Poids' },
  { value: 'day', label: 'Jour' },
  { value: 'ytd', label: 'YTD' },
];

const EXPO_OPTIONS: readonly ToggleOption[] = [
  { value: 'currency', label: 'Devises' },
  { value: 'region', label: 'Zones' },
];

const ANO_FILTER_OPTIONS: readonly ToggleOption[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'high', label: 'Bloquantes' },
  { value: 'medium', label: 'À traiter' },
];

/** Porté depuis `TableauDeBord.dc.html` — voir ce fichier pour le détail des écarts. */
@Component({
  selector: 'app-tableau-de-bord',
  imports: [MatMenuModule, MatButtonModule, MatButtonToggleModule, PanelCard, IconGlyph],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.css',
})
export class TableauDeBord {
  protected readonly icons = {
    performance: ICON_PERFORMANCE,
    allocation: ICON_ALLOCATION,
    positions: ICON_POSITIONS,
    risk: ICON_RISK,
    exposures: ICON_EXPOSURES,
    activity: ICON_ACTIVITY,
    anomaly: ICON_ANOMALY,
  };

  protected readonly mandates = MANDATES;
  protected readonly periodOptions = PERIOD_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly expoOptions = EXPO_OPTIONS;
  protected readonly anoFilterOptions = ANO_FILTER_OPTIONS;
  protected readonly risk = RISK_INDICATORS;
  protected readonly severityLabel = SEVERITY_LABEL;

  protected readonly mandate = signal(MANDATES[0].value);
  protected readonly period = signal<PeriodKey>('ytd');
  protected readonly sort = signal<SortKey>('weight');
  protected readonly expo = signal<ExpoKey>('currency');
  protected readonly anoFilter = signal<'all' | Severity>('all');

  protected setPeriod(v: string): void {
    this.period.set(v as PeriodKey);
  }

  protected setSort(v: string): void {
    this.sort.set(v as SortKey);
  }

  protected setExpo(v: string): void {
    this.expo.set(v as ExpoKey);
  }

  protected setAnoFilter(v: string): void {
    this.anoFilter.set(v as 'all' | Severity);
  }

  protected readonly anoOpen = signal(true);
  protected readonly perfOpen = signal(true);
  protected readonly allocOpen = signal(true);
  protected readonly posOpen = signal(true);
  protected readonly riskOpen = signal(true);
  protected readonly expoOpen = signal(true);
  protected readonly actOpen = signal(true);

  protected readonly activity = ACTIVITY;

  protected readonly mandateLabel = computed(
    () => (this.mandates.find((m) => m.value === this.mandate()) ?? this.mandates[0]).label,
  );

  protected readonly subtitle = computed(() => `${this.mandateLabel()} · valorisation au 31 août 2026, 17:30`);

  private readonly chart = computed(() => {
    const s = SERIES[this.period()];
    const all = [...s.perf, ...s.bench];
    const min = Math.min(...all);
    const max = Math.max(...all);
    return {
      ticks: s.ticks,
      perfPath: buildPath(s.perf, min, max),
      benchPath: buildPath(s.bench, min, max),
      perfLast: s.perf.at(-1)!,
      benchLast: s.bench.at(-1)!,
    };
  });

  protected readonly perfTicks = computed(() => this.chart().ticks);
  protected readonly perfPath = computed(() => this.chart().perfPath);
  protected readonly benchPath = computed(() => this.chart().benchPath);
  protected readonly perfValue = computed(() => pct(this.chart().perfLast));
  protected readonly benchValue = computed(() => pct(this.chart().benchLast));
  protected readonly alpha = computed(() => this.chart().perfLast - this.chart().benchLast);
  protected readonly alphaLabel = computed(() => pct(this.alpha()));
  protected readonly alphaColor = computed(() => (this.alpha() >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)'));

  protected readonly drifts = computed(() => ALLOCATION.filter((a) => Math.abs(a.actual - a.target) > 2).length);

  protected readonly allocationRows = computed(() =>
    ALLOCATION.map((a) => {
      const drift = a.actual - a.target;
      const out = Math.abs(drift) > 2;
      return {
        label: a.label,
        actual: `${fmt1(a.actual)} %`,
        drift:
          (Math.abs(drift) < 0.05 ? 'Sur la cible' : (drift > 0 ? 'Surpondéré ' : 'Sous-pondéré ') + fmt1(Math.abs(drift)) + ' pt') +
          ` · cible ${a.target} %`,
        driftColor: out ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)',
        width: Math.min(100, (a.actual / 70) * 100).toFixed(1) + '%',
        target: ((a.target / 70) * 100).toFixed(1) + '%',
        barColor: out ? 'var(--ink-warn-2)' : 'var(--ink-brand-2)',
      };
    }),
  );

  protected readonly allocNote = computed(() =>
    this.drifts() ? `${this.drifts()} classe(s) hors bande de 2 pts` : 'Toutes les classes dans la bande',
  );

  protected readonly blocking = computed(() => ANOMALIES.filter((a) => a.severity === 'high').length);

  protected readonly anomalies = computed(() => {
    const f = this.anoFilter();
    return ANOMALIES.filter((a) => f === 'all' || a.severity === f).map((a) => ({
      ...a,
      severityLabel: SEVERITY_LABEL[a.severity],
      tagBg: a.severity === 'high' ? 'rgba(180,83,9,0.12)' : a.severity === 'medium' ? 'rgba(0,61,165,0.10)' : 'var(--color-neutral-200)',
      tagFg: a.severity === 'high' ? 'var(--ink-warn-2)' : a.severity === 'medium' ? 'var(--ink-brand-2)' : 'var(--color-neutral-700)',
    }));
  });

  protected readonly anoSummary = computed(() => `${this.blocking()} bloquante(s), ${ANOMALIES.length - this.blocking()} à suivre`);

  protected readonly positionsSorted = computed(() => {
    const total = POSITIONS.reduce((n, p) => n + p.value, 0);
    const key = this.sort();
    return [...POSITIONS]
      .sort((a, b) => (key === 'weight' ? b.weight - a.weight : key === 'day' ? b.day - a.day : b.ytd - a.ytd))
      .slice(0, 7)
      .map((p) => ({
        ticker: p.ticker,
        name: p.name,
        value: `${fmt1(p.value)} M€`,
        weight: `${fmt1((p.value / total) * 100)} %`,
        day: pct(p.day),
        ytd: pct(p.ytd, 1),
        dayColor: p.day > 0 ? 'var(--ink-ok-2)' : p.day < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
        ytdColor: p.ytd > 0 ? 'var(--ink-ok-2)' : p.ytd < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
      }));
  });

  protected readonly exposureRows = computed(() => {
    const list = EXPOSURES[this.expo()];
    const maxV = Math.max(...list.map((e) => e.value));
    return list.map((e) => ({ label: e.label, value: `${fmt1(e.value)} %`, width: ((e.value / maxV) * 100).toFixed(1) + '%' }));
  });

  /** Les 4 vignettes : AUM et Anomalies sont toujours teintées (vert/rouge), pas seulement en cas d'écart. */
  protected readonly kpis = computed((): readonly KpiView[] => {
    const perf = this.chart().perfLast;
    const bench = this.chart().benchLast;
    const alpha = perf - bench;
    const blocking = this.blocking();
    const drifts = this.drifts();

    const aumTone = perfTone((8.4 / 486.2) * 100, 4);
    const perfToneV = perfTone(perf);
    const alphaTone = perfTone(alpha);
    const alertMag = Math.min(ANOMALIES.length / 8, 1);
    const alertAlpha = (0.1 + alertMag * 0.06).toFixed(3);

    return [
      {
        label: 'Actifs sous gestion',
        value: '486,2 M€',
        note: '+8,4 M€ sur la période',
        bg: aumTone.bg,
        valueColor: aumTone.fg,
        labelColor: 'var(--ink-ok)',
        noteColor: 'var(--ink-ok)',
      },
      {
        label: `Performance ${PERIOD_LONG[this.period()]}`,
        value: pct(perf),
        note: `Référence ${pct(bench)}`,
        bg: perfToneV.bg,
        valueColor: perfToneV.fg,
        labelColor: perf >= 0 ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
        noteColor: perf >= 0 ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
      },
      {
        label: 'Écart à la référence',
        value: pct(alpha),
        note: 'Contribution actions +0,9 pt',
        bg: alphaTone.bg,
        valueColor: alphaTone.fg,
        labelColor: alpha >= 0 ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
        noteColor: alpha >= 0 ? 'var(--ink-ok)' : 'var(--ink-warn-2)',
      },
      {
        label: 'Anomalies ouvertes',
        value: String(ANOMALIES.length),
        note: `${blocking} bloquante(s) · ${drifts} bande(s) dépassée(s)`,
        bg: `linear-gradient(oklch(0.62 ${alertAlpha} 32 / ${alertAlpha}), oklch(0.62 ${alertAlpha} 32 / ${alertAlpha})), var(--surface)`,
        valueColor: 'var(--ink-warn)',
        labelColor: 'var(--ink-warn-2)',
        noteColor: 'var(--ink-warn-2)',
      },
    ];
  });
}
