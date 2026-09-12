import { Component, computed, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ATTRIB_CLASS, ATTRIB_GEO, AttribRow, BANDS, BAND_COLOR, BY_FREQ, BandKey, CLASS_TINT,
  CONTRIBUTORS, DRAWDOWNS, FREQUENCIES, FreqKey, HOLDINGS, MEASURES, PERIOD_ORDER, PERIOD_ROWS,
  PeriodKey, RESULT, RESULT_LINES, RESULT_YEARS, RESULT_YEARS_DETAIL, RISK, SCOPES, SERIES,
  SortKey, YEARS, YEAR_PALETTE, bps, darken, eur, fr, keur, kpiTint, pct, tone,
} from './performance-data';

type Tab = 'overview' | 'detail' | 'history' | 'attrib' | 'risk';

/** Boîte du graphique de performance cumulée, en unités du `viewBox` SVG. */
const CHART = { w: 720, h: 240, pad: 16 } as const;

/**
 * Porté depuis `Performance.dc.html` (1414 lignes source), le plus gros écran du portage après
 * Comptes. Cinq onglets sur un même jeu de données : vue d'ensemble, analyse détaillée,
 * historique détaillé, attribution, risque.
 *
 * Les émulations Material du prototype sont remplacées par les composants réels, selon les
 * conventions désormais établies dans l'app :
 * - `data-mat-select` du périmètre → `<mat-select>` nu, habillé par la recette `.pm-sel-*`
 *   partagée de `styles.scss` (voir `tx-select.ts` pour le détail du choix) ;
 * - groupes `role="radio"` (période, fréquence d'observation, tri) → `mat-button-toggle-group`,
 *   l'équivalent retenu pour ce motif partout ailleurs ;
 * - onglets de page → `mat-tab-nav-bar` (voir le bloc `.pm-tabnav` de `styles.scss`) ;
 * - `mat-slider` émulé de l'opacité → vrai `<mat-slider>` ;
 * - `table mat-table` émulé → vrai `MatTable` ;
 * - l'infobulle maison (pseudo-éléments `::after` + placement calculé au survol dans
 *   `componentDidMount`) → `matTooltip`, qui fait le même placement sans code applicatif.
 *
 * `volHeader` existait dans le prototype (« Volatilité » / « Volatilité ann. » selon la
 * fréquence) mais n'était lu par aucun `{{ }}` de son rendu — l'en-tête de colonne était écrit
 * en dur. Champ mort, non repris.
 */
@Component({
  selector: 'app-performance',
  imports: [MatTabsModule, MatIconModule, MatSelectModule, MatButtonToggleModule, MatTableModule, MatSliderModule, MatTooltipModule],
  templateUrl: './performance.html',
  styleUrl: './performance.css',
})
export class Performance {
  /* ---------------------------------------------------------------- État */

  protected readonly tab = signal<Tab>('overview');
  protected readonly period = signal<PeriodKey>('ytd');
  protected readonly scope = signal('all');
  protected readonly sortBy = signal<SortKey>('contrib');
  protected readonly freq = signal<FreqKey>('monthly');
  protected readonly band = signal<BandKey>('pnl');
  protected readonly selYear = signal<string | null>(null);
  /** Opacité du remplissage des barres du graphique annuel, en pourcentage. */
  protected readonly fill = signal(25);

  protected readonly scopeOptions = SCOPES;
  protected readonly measures = MEASURES;
  protected readonly subtitle =
    'Performance nette de frais, au 08/09/2026 · référence composite 60 / 40, dividendes réinvestis';

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  /** Un clic sur l'année déjà retenue la désélectionne : c'est une mise en avant, pas un filtre. */
  protected toggleYear(year: string): void {
    this.selYear.update((y) => (y === year ? null : year));
  }

  /* ---------------------------------------------------------------- En-tête */

  protected readonly pageTabs = computed(() =>
    (
      [
        { key: 'overview', label: "Vue d'ensemble", icon: 'chart-line' },
        { key: 'detail', label: 'Analyse détaillée', icon: 'table-rows' },
        { key: 'history', label: 'Historique détaillé', icon: 'history' },
        { key: 'attrib', label: 'Attribution', icon: 'pie-split' },
        { key: 'risk', label: 'Risque et pertes', icon: 'alert-triangle' },
      ] as const
    ).map((t) => {
      const on = this.tab() === t.key;
      return {
        key: t.key as Tab,
        label: t.label,
        icon: t.icon,
        on,
        height: on ? '40px' : '32px',
        padding: on ? '0 20px' : '0 14px',
        size: on ? '14px' : '12px',
        bg: on ? 'var(--field-brand)' : 'rgba(0,61,165,0.08)',
        fg: on ? '#ffffff' : 'var(--ink-brand)',
        weight: on ? '700' : '400',
      };
    }),
  );

  protected readonly periodOptions = computed(() =>
    PERIOD_ORDER.map((k) => ({ key: k, label: k === 'ytd' ? 'YTD' : SERIES[k].label })),
  );

  /** L'onglet « Historique détaillé » raisonne en euros encaissés, pas en performance : pas de cartouches. */
  protected readonly showKpis = computed(() => this.tab() !== 'history');

  private readonly serie = computed(() => SERIES[this.period()]);
  private readonly last = computed(() => this.serie().port[this.serie().port.length - 1]);
  private readonly lastBench = computed(() => this.serie().bench[this.serie().bench.length - 1]);
  private readonly delta = computed(() => this.last() - this.lastBench());

  protected readonly kpis = computed(() => {
    const mk = (label: string, value: string, note: string, v: number, invert = false) => {
      const t = kpiTint(v, invert);
      return { label, value, note, bg: t.bg, labelColor: t.ink, color: t.value };
    };
    return [
      mk(`Performance ${this.serie().label.toLowerCase()}`, pct(this.last()), 'Nette de frais de gestion', this.last()),
      mk('Écart avec la référence', bps(this.delta()), 'Composite 60 actions / 40 obligations', this.delta()),
      mk('Ratio de Sharpe', fr(0.82, 2), 'Référence 0,63 · taux sans risque 2,4 %', 0.82 - 0.63),
      mk('Perte maximale', pct(-12.6, 1), 'Octobre 2025 · récupérée en 63 jours', -12.6, true),
    ];
  });

  /* ---------------------------------------------------------------- Vue d'ensemble */

  /** Trace une série en pourcentage sur la boîte du graphique, et rend aussi son aire fermée. */
  private geometry(values: readonly number[], min: number, max: number) {
    const span = max - min || 1;
    const y = (v: number) => CHART.pad + (CHART.h - CHART.pad * 2) * (1 - (v - min) / span);
    const x = (i: number) => (values.length <= 1 ? 0 : (CHART.w * i) / (values.length - 1));
    const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    return { path, area: `${path} L${CHART.w} ${y(min).toFixed(1)} L0 ${y(min).toFixed(1)} Z`, y };
  }

  private readonly bounds = computed(() => {
    const s = this.serie();
    const all = [...s.port, ...s.bench];
    return { min: Math.min(...all, 0), max: Math.max(...all) };
  });

  protected readonly chart = computed(() => {
    const s = this.serie();
    const { min, max } = this.bounds();
    const port = this.geometry(s.port, min, max);
    const bench = this.geometry(s.bench, min, max);
    return {
      portPath: port.path,
      portArea: port.area,
      benchPath: bench.path,
      benchArea: bench.area,
      zeroY: port.y(0).toFixed(1),
      note: `base 100 au ${s.ticks[0]} · ${s.port.length} points`,
      footnote: 'Séries reconstituées nettes de frais, dividendes réinvestis.',
    };
  });

  protected readonly gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: (CHART.pad + (CHART.h - CHART.pad * 2) * f).toFixed(1),
  }));

  protected readonly ticks = computed(() =>
    this.serie().ticks.map((label, i, arr) => ({
      label,
      align: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
    })),
  );

  protected readonly chartLegend = computed(() => [
    { label: 'Portefeuille', color: 'var(--ink-brand-2)', value: pct(this.last()), valueColor: tone(this.last()) },
    { label: 'Référence', color: 'var(--ink-alt)', value: pct(this.lastBench()), valueColor: tone(this.lastBench()) },
  ]);

  protected readonly periodRows = computed(() => {
    const maxContrib = Math.max(...PERIOD_ROWS.map((r) => Math.abs(r.contrib)));
    return PERIOD_ROWS.map((r, i) => ({
      label: r.label,
      port: pct(r.port, 1),
      portColor: tone(r.port),
      bench: pct(r.bench, 1),
      delta: bps(r.port - r.bench),
      deltaColor: tone(r.port - r.bench),
      contrib: bps(r.contrib),
      barWidth: `${((Math.abs(r.contrib) / maxContrib) * 100).toFixed(1)}%`,
      barColor: tone(r.contrib),
      bg: this.stripe(i),
    }));
  });

  protected readonly periodColumns = ['period', 'port', 'bench', 'delta', 'contrib'];

  /** Lignes alternées : le prototype peint une ligne sur deux plutôt qu'un filet. */
  private stripe(i: number): string {
    return i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)';
  }

  /* ---------------------------------------------------------------- Analyse détaillée */

  private readonly frequency = computed(() => FREQUENCIES.find((f) => f.key === this.freq()) ?? FREQUENCIES[2]);
  protected readonly freqModes = FREQUENCIES;

  protected readonly freqTitle = computed(() => `Rendement ${this.frequency().title}`);

  protected readonly monthlyNote = computed(() => {
    const rows = BY_FREQ[this.freq()];
    const f = this.frequency();
    return `${rows.length} ${f.unit} · ${rows.filter((r) => r.port > 0).length} positifs · ${f.points} obs./an`;
  });

  protected readonly monthlyFootnote = computed(() => {
    const f = this.frequency();
    return `Rendements nets, non annualisés · ${f.hint} · volatilité annualisée par √${f.points}.`;
  });

  protected readonly monthly = computed(() => {
    const rows = BY_FREQ[this.freq()];
    const max = Math.max(...rows.map((m) => Math.max(Math.abs(m.port), Math.abs(m.bench))));
    return rows.map((m) => ({
      label: m.label,
      value: pct(m.port, 1),
      color: tone(m.port),
      barColor: tone(m.port),
      height: `${((Math.abs(m.port) / max) * 100).toFixed(1)}%`,
      /* Hauteur relative à la barre du portefeuille, pas à l'échelle : c'est un rapport, et
         il faut se garder d'une division par zéro sur un mois plat. */
      benchHeight: `${((Math.abs(m.bench) / Math.abs(m.port || 1)) * 100).toFixed(1)}%`,
      justify: m.port >= 0 ? 'flex-end' : 'flex-start',
      align: m.port >= 0 ? 'flex-end' : 'flex-start',
    }));
  });

  protected readonly sortModes = [
    { key: 'contrib' as SortKey, label: 'Par contribution' },
    { key: 'weight' as SortKey, label: 'Par poids' },
    { key: 'perf' as SortKey, label: 'Par performance' },
  ];

  protected readonly holdingsNote = `${HOLDINGS.length} lignes · ${HOLDINGS.filter((h) => h.contrib > 0).length} contributrices`;

  protected readonly holdings = computed(() => {
    const by = this.sortBy();
    const maxC = Math.max(...HOLDINGS.map((h) => Math.abs(h.contrib)));
    return [...HOLDINGS]
      .sort((a, b) => Math.abs(b[by]) - Math.abs(a[by]))
      .map((h, i) => {
        const c = CLASS_TINT[h.cls] ?? CLASS_TINT['Trésorerie'];
        return {
          ticker: h.ticker,
          name: h.name,
          cls: h.cls,
          clsBg: c.bg,
          clsFg: c.fg,
          weight: `${fr(h.weight, 1)} %`,
          perf: pct(h.perf, 1),
          perfColor: tone(h.perf),
          contrib: bps(h.contrib),
          contribColor: tone(h.contrib),
          barWidth: `${((Math.abs(h.contrib) / maxC) * 100).toFixed(1)}%`,
          barColor: tone(h.contrib),
          justify: h.contrib >= 0 ? 'flex-start' : 'flex-end',
          vol: `${fr(h.vol, 1)} %`,
          beta: fr(h.beta, 2),
          bg: this.stripe(i),
        };
      });
  });

  protected readonly holdingsColumns = ['ticker', 'name', 'cls', 'weight', 'perf', 'contrib', 'vol', 'beta'];

  /** Totaux du pied de tableau : performance, volatilité et bêta pondérés par le poids. */
  protected readonly holdingsTotals = (() => {
    const w = HOLDINGS.reduce((n, h) => n + h.weight, 0);
    const wavg = (k: 'perf' | 'vol' | 'beta') => HOLDINGS.reduce((n, h) => n + h[k] * h.weight, 0) / w;
    const contrib = HOLDINGS.reduce((n, h) => n + h.contrib, 0);
    const perfSum = HOLDINGS.reduce((n, h) => n + h.perf * h.weight, 0);
    return {
      weight: `${fr(w, 1)} %`,
      perf: pct(wavg('perf'), 1),
      perfColor: tone(perfSum),
      contrib: bps(contrib),
      contribColor: tone(contrib),
      vol: `${fr(wavg('vol'), 1)} %`,
      beta: fr(wavg('beta'), 2),
    };
  })();

  /* ---------------------------------------------------------------- Attribution */

  private attribBlock(title: string, dimension: string, rows: readonly AttribRow[], note: string) {
    const sum = (k: keyof AttribRow) => rows.reduce((n, r) => n + (r[k] as number), 0);
    const tAlloc = sum('alloc');
    const tSel = sum('sel');
    return {
      title,
      dimension,
      note,
      rows: rows.map((r, i) => ({
        label: r.label,
        weight: `${fr(r.weight, 1)} %`,
        benchWeight: `${fr(r.benchWeight, 1)} %`,
        alloc: bps(r.alloc),
        allocColor: tone(r.alloc),
        sel: bps(r.sel),
        selColor: tone(r.sel),
        total: bps(r.alloc + r.sel),
        totalColor: tone(r.alloc + r.sel),
        bg: this.stripe(i),
      })),
      totalWeight: `${fr(sum('weight'), 1)} %`,
      totalBench: `${fr(sum('benchWeight'), 1)} %`,
      totalAlloc: bps(tAlloc),
      allocColor: tone(tAlloc),
      totalSel: bps(tSel),
      selColor: tone(tSel),
      total: bps(tAlloc + tSel),
      totalColor: tone(tAlloc + tSel),
    };
  }

  protected readonly attribBlocks = [
    this.attribBlock("Attribution par classe d'actifs", "Classe d'actifs", ATTRIB_CLASS, 'Modèle Brinson-Fachler'),
    this.attribBlock('Attribution par zone géographique', 'Zone', ATTRIB_GEO, 'Modèle Brinson-Fachler'),
  ];

  protected readonly attribColumns = ['label', 'weight', 'benchWeight', 'alloc', 'sel', 'total'];

  protected readonly contribNote = 'Contribution à la performance de la période';

  protected readonly contributors = (() => {
    const max = Math.max(...CONTRIBUTORS.map((c) => Math.abs(c.value)));
    return CONTRIBUTORS.map((c) => ({
      ticker: c.ticker,
      name: c.name,
      value: bps(c.value),
      color: tone(c.value),
      barWidth: `${((Math.abs(c.value) / max) * 100).toFixed(1)}%`,
      barColor: tone(c.value),
      justify: c.value >= 0 ? 'flex-start' : 'flex-end',
    }));
  })();

  /* ---------------------------------------------------------------- Risque et pertes */

  protected readonly riskRows = RISK.map((r) => ({
    label: r.label,
    hint: r.hint,
    value: r.unit === '%' ? pct(r.value, 1) : fr(r.value, 2),
    /* Une référence à 0 signifie « sans objet » (ratio d'information, erreur de suivi se
       mesurent contre la référence elle-même) : ni chiffre de comparaison, ni verdict couleur. */
    bench: r.bench === 0 ? '—' : r.unit === '%' ? pct(r.bench, 1) : fr(r.bench, 2),
    color:
      r.bench === 0
        ? 'var(--color-text)'
        : (r.good === 'high' ? r.value > r.bench : r.value < r.bench)
          ? 'var(--ink-ok)'
          : 'var(--ink-warn-2)',
  }));

  protected readonly drawdownNote = `${DRAWDOWNS.length} épisodes sur 3 ans`;

  protected readonly drawdowns = (() => {
    const max = Math.max(...DRAWDOWNS.map((d) => Math.abs(d.depth)));
    return DRAWDOWNS.map((d) => ({
      label: d.label,
      depth: pct(d.depth, 1),
      detail: d.detail,
      barWidth: `${((Math.abs(d.depth) / max) * 100).toFixed(1)}%`,
    }));
  })();

  protected readonly years = (() => {
    const max = Math.max(...YEARS.map((y) => Math.abs(y.port)));
    return YEARS.map((y) => ({
      label: y.label,
      value: pct(y.port, 1),
      bench: pct(y.bench, 1),
      color: tone(y.port),
      barColor: tone(y.port),
      height: `${((Math.abs(y.port) / max) * 100).toFixed(1)}%`,
      justify: y.port >= 0 ? 'flex-end' : 'flex-start',
    }));
  })();

  /* ---------------------------------------------------------------- Historique détaillé */

  private readonly netTotalValue = RESULT.pnl + RESULT.div + RESULT.fees + RESULT.tax;
  protected readonly netTotal = keur(this.netTotalValue);
  protected readonly netColor = tone(this.netTotalValue);

  protected readonly bands = computed(() => {
    const total = BANDS.reduce((n, b) => n + Math.abs(RESULT[b.key]), 0);
    const sel = this.band();
    return BANDS.map((b) => {
      const v = RESULT[b.key];
      const on = sel === b.key;
      return {
        key: b.key,
        label: b.label,
        color: b.color,
        on,
        hint: `${b.hint} — ${keur(v)}`,
        width: `${((Math.abs(v) / total) * 100).toFixed(2)}%`,
        share: `${fr((Math.abs(v) / total) * 100, 1)} %`,
        value: keur(v),
        valueColor: tone(v),
        opacity: on ? '1' : '0.62',
        border: on ? 'var(--ink-brand-2)' : 'var(--color-neutral-300)',
        rowBg: on ? 'rgba(0,61,165,0.10)' : 'var(--surface)',
        weight: on ? '700' : '400',
      };
    });
  });

  private readonly detailBlock = computed(() => RESULT_LINES[this.band()]);

  protected readonly detail = computed(() => {
    const b = this.detailBlock();
    const total = b.rows.reduce((n, r) => n + r.f, 0);
    return {
      title: b.title,
      color: BAND_COLOR[this.band()],
      note: `${b.rows.length} ligne(s)`,
      totalLabel: `Total ${b.title.toLowerCase()}`,
      total: eur(total),
      totalColor: tone(total),
      cols: b.cols.map((label, i, arr) => ({
        label,
        align: i <= 1 ? 'left' : 'right',
        width: i === 0 ? 'auto' : i === 1 ? '108px' : i === arr.length - 1 ? '110px' : '96px',
        pad: i === 0 ? '0 16px' : i === arr.length - 1 ? '0 16px 0 12px' : '0 12px',
      })),
      rows: b.rows.map((r, i) => ({
        a: r.a, b: r.b, c: r.c, d: r.d, e: r.e,
        f: eur(r.f),
        color: tone(r.f),
        bg: this.stripe(i),
      })),
    };
  });

  protected readonly detailColumns = ['a', 'b', 'c', 'd', 'e', 'f'];

  protected readonly yearsNote = `${RESULT_YEARS.length} années · montants en milliers d'euros`;

  /**
   * Échelle commune aux deux moitiés du graphique : le plus grand empilement observé, vers le
   * haut (P/L positif + dividendes) ou vers le bas (P/L négatif + frais + taxes).
   */
  private readonly yearScale = Math.max(
    ...RESULT_YEARS.map((y) =>
      Math.max(Math.max(y.pnl, 0) + y.div, Math.abs(Math.min(y.pnl, 0)) + Math.abs(y.fees) + Math.abs(y.tax)),
    ),
  );

  protected readonly resultYears = computed(() => {
    const fillPct = this.fill();
    const sel = this.selYear();
    const px = (v: number) => `${((v / this.yearScale) * 100).toFixed(1)}%`;
    const seg = (v: number, color: string, label: string, year: string, on: boolean, dim: boolean, signFlip = false) => ({
      height: px(v),
      color: `color-mix(in srgb, ${color} ${fillPct}%, transparent)`,
      border: darken(color),
      weight: on ? '2px' : '1px',
      opacity: dim ? '0.26' : '1',
      hint: `${year} · ${label} ${keur(signFlip ? -v : v)}`,
    });

    return RESULT_YEARS.map((y) => {
      const on = sel === y.year;
      const dim = sel !== null && !on;
      const net = y.pnl + y.div + y.fees + y.tax;
      const up = [
        ...(y.pnl > 0 ? [seg(y.pnl, YEAR_PALETTE.gain, 'P/L réalisé', y.year, on, dim)] : []),
        seg(y.div, YEAR_PALETTE.div, 'Dividendes', y.year, on, dim),
      ];
      const down = [
        ...(y.pnl < 0 ? [seg(-y.pnl, YEAR_PALETTE.loss, 'P/L réalisé', y.year, on, dim, true)] : []),
        seg(-y.fees, YEAR_PALETTE.fees, 'Frais', y.year, on, dim, true),
        seg(-y.tax, YEAR_PALETTE.tax, 'Taxes', y.year, on, dim, true),
      ];
      return {
        year: y.year,
        net: keur(net),
        netColor: tone(net),
        on,
        labelBg: on ? 'rgba(0,61,165,0.12)' : 'transparent',
        labelWeight: on ? '700' : '400',
        labelOpacity: dim ? '0.45' : '1',
        up,
        down,
      };
    });
  });

  /** Graduations : la moitié haute couvre toute l'échelle, la basse au prorata de sa hauteur. */
  protected readonly chartLevels = [1, 0.75, 0.5, 0.25, 0].map((f) => ({
    label: f ? keur(this.yearScale * f) : '',
  }));

  protected readonly chartLevelsDown = [0, 0.5, 1].map((f) => ({
    label: f ? keur(-this.yearScale * (150 / 240) * f) : '',
  }));

  protected readonly yearRows = computed(() => {
    const sel = this.selYear();
    return RESULT_YEARS_DETAIL.map((y, i) => {
      const net = y.gain + y.loss + y.div + y.fees + y.tax;
      const on = sel === y.year;
      return {
        year: y.year,
        on,
        weight: on ? '700' : '600',
        mark: on ? 'var(--ink-brand-2)' : 'transparent',
        hint: on ? `Cliquer pour désélectionner ${y.year}` : `Mettre en avant ${y.year} dans le graphique`,
        gain: keur(y.gain), gainColor: tone(y.gain),
        loss: keur(y.loss), lossColor: tone(y.loss),
        div: keur(y.div), divColor: tone(y.div),
        fees: keur(y.fees), feesColor: tone(y.fees),
        tax: keur(y.tax), taxColor: tone(y.tax),
        net: keur(net), netColor: tone(net),
        bg: on ? 'rgba(0,61,165,0.12)' : this.stripe(i),
      };
    });
  });

  protected readonly yearColumns = ['year', 'gain', 'loss', 'div', 'fees', 'tax', 'net'];

  private sumDetail(k: keyof Omit<(typeof RESULT_YEARS_DETAIL)[number], 'year'>): number {
    return RESULT_YEARS_DETAIL.reduce((n, y) => n + y[k], 0);
  }

  /* Les couleurs du cumul sont figées par nature, pas déduites du signe : les frais et taxes
     restent en teinte d'alerte même si leur somme est négative par construction. */
  protected readonly sums = (() => {
    const net = RESULT_YEARS_DETAIL.reduce((n, y) => n + y.gain + y.loss + y.div + y.fees + y.tax, 0);
    return {
      gain: keur(this.sumDetail('gain')), gainColor: 'var(--ink-ok)',
      loss: keur(this.sumDetail('loss')), lossColor: 'var(--ink-warn-2)',
      div: keur(this.sumDetail('div')), divColor: 'var(--ink-ok)',
      fees: keur(this.sumDetail('fees')), feesColor: 'var(--ink-warn-2)',
      tax: keur(this.sumDetail('tax')), taxColor: 'var(--ink-warn-2)',
      net: keur(net), netColor: tone(net),
    };
  })();

  protected readonly yearsLegend = (
    [
      { key: 'pnl', label: 'P/L réalisé' },
      { key: 'div', label: 'Dividendes' },
      { key: 'fees', label: 'Frais' },
      { key: 'tax', label: 'Taxes' },
    ] as const
  ).map((l) => {
    const sum = RESULT_YEARS.reduce((n, y) => n + y[l.key], 0);
    /* Le P/L cumulé peut être négatif : la pastille prend alors la teinte des moins-values,
       celle que portent effectivement ses barres sous l'axe. */
    const color =
      l.key === 'pnl' ? (sum >= 0 ? YEAR_PALETTE.gain : YEAR_PALETTE.loss) : YEAR_PALETTE[l.key];
    return { label: l.label, color, value: keur(sum), valueColor: tone(sum) };
  });

  protected readonly fillLabel = computed(() => `${this.fill()} %`);
}
