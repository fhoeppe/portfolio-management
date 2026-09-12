import { CHART_RANGES, MONTHS_FR, chartSeries, type ChartAccount, type ChartRange } from './positions-data';

export interface ChartGridLine {
  readonly top: string;
  readonly stroke: string;
  readonly dash: string;
  readonly label: string;
}

export interface ChartLine {
  readonly color: string;
  readonly gradId: string;
  readonly fill: string;
  readonly path: string;
  readonly area: string;
  readonly top: string;
  readonly last: string;
}

export interface ChartTick {
  readonly label: string;
}

export interface ChartSeriesInternal {
  readonly label: string;
  readonly color: string;
  readonly data: readonly number[];
}

export interface ChartBuild {
  readonly grid: readonly ChartGridLine[];
  readonly lines: readonly ChartLine[];
  readonly ticks: readonly ChartTick[];
  readonly footnote: string;
  readonly pct: boolean;
  readonly n: number;
  readonly dates: readonly Date[];
  readonly hourly: boolean;
  readonly series: readonly ChartSeriesInternal[];
  readonly H: number;
  readonly y: (v: number) => number;
}

const H = 290;
const W = 1000;
const PAD = 10;

const eurFmt = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const pctFmt = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';

/** Lissage de Catmull-Rom converti en courbes de Bézier, pour un tracé plus net. */
function smooth(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return '';
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k - 1] || pts[k];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[k + 2] || p2;
    const jump = Math.abs(p2[1] - p1[1]) > H * 0.25;
    if (jump) {
      d += ' L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      continue;
    }
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
  }
  return d;
}

export function buildChart(
  accounts: readonly ChartAccount[],
  rangeKey: string,
  metricKey: string,
  off: Readonly<Record<string, boolean>>,
  scope: string,
): ChartBuild {
  const range: ChartRange = CHART_RANGES.find((r) => r.key === rangeKey) || CHART_RANGES[3];
  const pct = metricKey === 'growth';
  const visible = accounts.filter((a) => !off[a.id] && (scope === 'all' || a.id === scope));
  const series = visible.map((a) => {
    const raw = chartSeries(a, range.points, 1);
    const base = raw[0] || 1;
    return { acc: a, data: pct ? raw.map((v) => ((v - base) / base) * 100) : raw };
  });
  const all = series.reduce<number[]>((n, s) => n.concat(s.data), []);
  const maxV = all.length ? Math.max(...all) : 1;
  const minV = all.length ? Math.min(...all) : 0;
  const fmt = pct ? pctFmt : eurFmt;
  const step = pct
    ? maxV - minV > 160
      ? 50
      : maxV - minV > 60
        ? 25
        : maxV - minV > 24
          ? 10
          : 5
    : maxV > 12000
      ? 5000
      : maxV > 4000
        ? 2000
        : maxV > 1200
          ? 500
          : 200;
  const top = Math.ceil(maxV / step) * step;
  const floor = pct ? Math.floor(Math.min(0, minV) / step) * step : 0;
  const y = (v: number) => H - PAD - ((v - floor) / ((top - floor) || 1)) * (H - PAD * 2);

  const grid: ChartGridLine[] = [];
  for (let v = floor; v <= top + 0.001; v += step) {
    const zero = Math.abs(v) < 0.001;
    grid.push({
      top: ((y(v) / H) * 100).toFixed(2) + '%',
      stroke: zero ? 'var(--color-neutral-500)' : 'var(--color-neutral-300)',
      dash: zero ? 'none' : '3 5',
      label: fmt(v),
    });
  }

  const lines: ChartLine[] = series.map((s, si) => {
    const pts = s.data.map((v, i): readonly [number, number] => [(i / (s.data.length - 1 || 1)) * W, y(v)]);
    const path = smooth(pts);
    const gradId = 'pos-grad-' + si;
    return {
      color: s.acc.color,
      gradId,
      fill: 'url(#' + gradId + ')',
      path,
      area: path + ' L' + W + ' ' + y(floor).toFixed(1) + ' L0 ' + y(floor).toFixed(1) + ' Z',
      top: ((y(s.data[s.data.length - 1]) / H) * 100).toFixed(2) + '%',
      last: fmt(s.data[s.data.length - 1]),
    };
  });

  const end = new Date(2026, 8, 4);
  const startD = new Date(end);
  startD.setMonth(startD.getMonth() - (range.months || 0));
  const ticks: ChartTick[] = [];
  const nTicks = range.months >= 6 ? 7 : 5;
  for (let i = 0; i < nTicks; i++) {
    const d = new Date(startD.getTime() + ((end.getTime() - startD.getTime()) / (nTicks - 1)) * i);
    ticks.push({ label: range.months ? MONTHS_FR[d.getMonth()] : String(d.getHours()).padStart(2, '0') + 'h' });
  }

  const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const totalEnd = series.reduce((n, s) => n + s.data[s.data.length - 1], 0);
  const dayMs = 86400000;
  const spanMs = range.months ? end.getTime() - startD.getTime() : dayMs;
  const dates: Date[] = [];
  for (let i = 0; i < range.points; i++) {
    dates.push(new Date(startD.getTime() + (spanMs / (range.points - 1 || 1)) * i));
  }

  return {
    grid,
    lines,
    ticks,
    footnote:
      range.points +
      ' relevé(s) du ' +
      iso(startD) +
      ' au ' +
      iso(end) +
      ' · ' +
      visible.length +
      ' compte(s)' +
      (pct ? '' : ' · total ' + eurFmt(totalEnd)),
    pct,
    n: range.points,
    dates,
    hourly: !range.months,
    series: series.map((s) => ({ label: s.acc.label, color: s.acc.color, data: s.data })),
    H,
    y,
  };
}

export interface AccountStat {
  readonly value: string;
  readonly growth: string;
  readonly up: number;
}

export function computeAccountStats(accounts: readonly ChartAccount[], rangeKey: string): Readonly<Record<string, AccountStat>> {
  const range = CHART_RANGES.find((r) => r.key === rangeKey) || CHART_RANGES[3];
  const out: Record<string, AccountStat> = {};
  accounts.forEach((a) => {
    const d = chartSeries(a, range.points, 1);
    const first = d[0] || 0;
    const last = d[d.length - 1] || 0;
    const g = first ? ((last - first) / first) * 100 : 0;
    out[a.id] = { value: eurFmt(last), growth: pctFmt(g), up: last - first };
  });
  return out;
}

export interface HoverPoint {
  readonly color: string;
  readonly left: string;
  readonly top: string;
}

export interface HoverRow {
  readonly label: string;
  readonly color: string;
  readonly value: string;
}

export interface HoverInfo {
  readonly on: boolean;
  readonly left: string;
  readonly tipLeft: string;
  readonly tipShift: string;
  readonly date: string;
  readonly rows: readonly HoverRow[];
  readonly total: string;
  readonly points: readonly HoverPoint[];
}

const NO_HOVER: HoverInfo = { on: false, left: '0%', tipLeft: '0%', tipShift: '0%', date: '', rows: [], total: '', points: [] };

export function computeHover(d: ChartBuild | null, idx: number | null): HoverInfo {
  if (idx === null || idx === undefined || !d || !d.n) return NO_HOVER;
  const i = Math.max(0, Math.min(d.n - 1, idx));
  const pctX = (i / (d.n - 1 || 1)) * 100;
  const money = (v: number) => (d.pct ? pctFmt(v) : eurFmt(v));
  const dt = d.dates[i];
  const rows = d.series.map((s) => ({ label: s.label, color: s.color, value: money(s.data[i]) }));
  const total = d.pct
    ? d.series.reduce((n, s) => n + s.data[i], 0) / (d.series.length || 1)
    : d.series.reduce((n, s) => n + s.data[i], 0);
  return {
    on: true,
    left: pctX.toFixed(2) + '%',
    tipLeft: pctX.toFixed(2) + '%',
    tipShift: pctX > 62 ? '-104%' : '12px',
    date: d.hourly
      ? String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0')
      : String(dt.getDate()).padStart(2, '0') + ' ' + MONTHS_FR[dt.getMonth()] + ' ' + dt.getFullYear(),
    rows,
    total: money(total),
    points: d.series.map((s) => ({
      color: s.color,
      left: pctX.toFixed(2) + '%',
      top: ((d.y(s.data[i]) / d.H) * 100).toFixed(2) + '%',
    })),
  };
}
