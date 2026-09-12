import { Component, computed, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ALERTS, DEADLINES, INDICES, INITIAL_TODOS, MOVERS, NEWS, NEWS_TAGS, type NewsImpact } from './accueil-data';
import { ICON_ALERT, ICON_DEADLINES, ICON_MOVERS, ICON_NEWS, ICON_TODO } from './accueil-icons';

type NewsFilter = 'all' | 'corporate' | 'market';

/** Signe français (− et non un simple tiret) puis valeur, virgule décimale, espace avant %. */
function pct(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return sign + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
}

function color(v: number): string {
  return v > 0 ? 'var(--ink-ok-2)' : v < 0 ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)';
}

interface KpiView {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly noteColor: string;
}

const ALERT_COLOR: Readonly<Record<'high' | 'mid' | 'low', string>> = {
  high: 'var(--ink-warn-2)',
  mid: 'var(--ink-brand-2)',
  low: 'var(--color-neutral-500)',
};

/**
 * Porté depuis `Accueil.dc.html`. Les 4 vignettes KPI du prototype passent par une fonction
 * `toneByColor` censée teinter le fond selon le signe — mais elle cherche des sous-chaînes
 * hexadécimales (`'0f766e'`) dans des valeurs déjà résolues en `var(--ink-ok-2)`, qui ne les
 * contiennent jamais : la fonction ne teinte donc jamais rien en pratique. Fond `--surface`
 * uni et libellé gris pour les quatre vignettes, comme ce qui s'affiche réellement — pas
 * l'effet visiblement recherché mais non atteint par le prototype.
 */
@Component({
  selector: 'app-accueil',
  imports: [MatButtonToggleModule, MatCheckboxModule, MatIconModule, MatTableModule],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
})
export class Accueil {
  protected readonly icons = {
    news: ICON_NEWS,
    movers: ICON_MOVERS,
    todo: ICON_TODO,
    alert: ICON_ALERT,
    deadlines: ICON_DEADLINES,
  };

  protected readonly stamp = (() => {
    const now = new Date();
    const s =
      now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · valorisation au ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  protected readonly kpis: readonly KpiView[] = [
    {
      label: 'Actifs sous gestion',
      value: '486,2 M€',
      note: '+8,4 M€ depuis la dernière valorisation',
      noteColor: 'var(--ink-ok-2)',
    },
    { label: 'Performance du jour', value: '+0,35 %', note: 'Indice de référence +0,21 %', noteColor: 'var(--color-neutral-700)' },
    { label: 'Depuis le 1er janvier', value: '+8,94 %', note: 'Indice de référence +7,20 %', noteColor: 'var(--color-neutral-700)' },
    { label: "Écarts d'allocation", value: '2 lignes', note: 'Hors bande de tolérance', noteColor: 'var(--ink-warn-2)' },
  ];

  protected readonly indices = INDICES.map((i) => ({ name: i.name, value: i.value, change: pct(i.chg), color: color(i.chg) }));

  protected readonly moversNote = 'Contribution à la performance du jour';

  protected readonly movers = MOVERS.map((m) => ({
    ticker: m.ticker,
    name: m.name,
    weight: m.weight,
    day: pct(m.day),
    contrib: pct(m.contrib),
    color: color(m.day),
  }));

  protected readonly moversColumns = ['ligne', 'poids', 'jour', 'contribution'];

  protected readonly alerts = ALERTS.map((a) => ({ title: a.title, detail: a.detail, color: ALERT_COLOR[a.level] }));

  protected readonly deadlines = DEADLINES;

  protected readonly newsFilter = signal<NewsFilter>('all');

  protected readonly news = computed(() => {
    const f = this.newsFilter();
    return NEWS.filter((n) => f === 'all' || (f === 'corporate' ? n.impact === 'corporate' : n.impact !== 'corporate')).map((n) => {
      const tag = NEWS_TAGS[n.impact];
      return {
        time: n.time,
        title: n.title,
        body: n.body,
        ticker: n.ticker,
        exposure: n.exposure,
        source: '· ' + n.source,
        tag: tag.label,
        tagBg: tag.bg,
        tagFg: tag.fg,
        move: n.move,
        moveColor: this.moveColor(n.impact),
      };
    });
  });

  private moveColor(impact: NewsImpact): string {
    switch (impact) {
      case 'positive':
        return 'var(--ink-ok-2)';
      case 'negative':
        return 'var(--ink-warn-2)';
      case 'corporate':
        return 'var(--ink-brand-2)';
      default:
        return 'var(--color-neutral-600)';
    }
  }

  private readonly todos = signal(INITIAL_TODOS);

  protected readonly todoNote = computed(() => {
    const open = this.todos().filter((t) => !t.done).length;
    return open + (open > 1 ? ' points ouverts' : ' point ouvert');
  });

  protected readonly todosView = computed(() =>
    this.todos().map((t) => ({
      id: t.id,
      done: t.done,
      label: t.label,
      meta: t.meta,
      strike: t.done,
      metaColor: t.urgent && !t.done ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)',
    })),
  );

  protected toggleTodo(id: string): void {
    this.todos.update((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  protected setNewsFilter(v: string): void {
    this.newsFilter.set(v as NewsFilter);
  }
}
