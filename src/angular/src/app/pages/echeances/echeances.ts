import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  BUCKETS,
  DUE_ITEMS,
  HORIZONS,
  POSTPONE_DAYS,
  WEEK_BUCKETS,
  daysUntil,
  fullDate,
  iso,
  parse,
  remainingTag,
  shortDate,
  startOfToday,
  type BucketKey,
  type DueItem,
  type HorizonKey,
} from './echeances-data';

/**
 * Porté depuis `Echeances.dc.html`. Les échéances ouvertes, groupées par urgence, avec le détail
 * de celle qui est retenue et deux vues de synthèse — charge par nature et charge par semaine.
 *
 * Deux actions modifient l'état sans toucher au référentiel : marquer traitée (l'échéance sort
 * des listes) et reporter de sept jours. Les reports s'accumulent dans un décalage par
 * identifiant plutôt que de réécrire la date d'origine, qui reste ainsi lisible.
 */
@Component({
  selector: 'app-echeances',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './echeances.html',
  styleUrl: './echeances.css',
})
export class Echeances {
  protected readonly horizons = HORIZONS;
  protected readonly columns = ['date', 'title', 'kind', 'account', 'owner', 'remaining'];

  private readonly today = startOfToday();

  // -- État ---------------------------------------------------------------------------------
  protected readonly query = signal('');
  protected readonly horizon = signal<HorizonKey>('30');
  protected readonly selectedId = signal('e2');
  protected readonly done = signal<ReadonlySet<string>>(new Set());
  /** Décalages cumulés, en jours, par identifiant d'échéance. */
  protected readonly shift = signal<Readonly<Record<string, number>>>({});
  protected readonly status = signal('');

  /** Date effective d'une échéance : sa date d'origine, décalée des reports appliqués. */
  private dueOf(item: DueItem): string {
    const s = this.shift()[item.id] ?? 0;
    if (!s) return item.due;
    const d = parse(item.due);
    d.setDate(d.getDate() + s);
    return iso(d);
  }

  private daysOf(item: DueItem): number {
    return daysUntil(this.dueOf(item), this.today);
  }

  /** Échéances non traitées — le socle de tous les comptages de l'écran. */
  private readonly openItems = computed(() => DUE_ITEMS.filter((it) => !this.done().has(it.id)));

  /* Les filtres de recherche et d'horizon ne s'appliquent qu'aux listes : les indicateurs et les
     deux vues de synthèse portent sur l'ensemble des échéances ouvertes, sans quoi restreindre
     l'horizon donnerait l'illusion d'avoir moins de travail. */
  private readonly visibleItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    const h = this.horizon();
    return this.openItems()
      .filter((it) => {
        if (h !== 'all' && this.daysOf(it) > +h) return false;
        if (!q) return true;
        return `${it.title} ${it.detail} ${it.account} ${it.owner} ${it.kind}`.toLowerCase().includes(q);
      })
      .sort((a, b) => parse(this.dueOf(a)).getTime() - parse(this.dueOf(b)).getTime());
  });

  // -- En-tête et indicateurs ------------------------------------------------------------------
  private readonly lateCount = computed(() => this.openItems().filter((it) => this.daysOf(it) < 0).length);

  private readonly weekCount = computed(
    () => this.openItems().filter((it) => { const n = this.daysOf(it); return n >= 0 && n <= 7; }).length,
  );

  private readonly monthCount = computed(
    () => this.openItems().filter((it) => { const n = this.daysOf(it); return n >= 0 && n <= 30; }).length,
  );

  protected readonly subtitle = computed(() => {
    const open = this.openItems().length;
    const label = (HORIZONS.find((h) => h.key === this.horizon()) ?? HORIZONS[0]).label.toLowerCase();
    return `${open} échéance(s) ouverte(s) · ${this.lateCount()} en retard · horizon ${label} · au ${fullDate(iso(this.today))}`;
  });

  protected readonly kpis = computed(() => {
    const late = this.lateCount();
    const week = this.weekCount();
    const treated = this.done().size;
    /* La vignette prend le fond et l'encre de son état : vert quand il n'y a rien à signaler,
       orange dès qu'il y a du retard ou de la charge à court terme, neutre sinon. */
    const warn = { bg: 'var(--band-warn)', ink: 'var(--ink-warn-2)' };
    const ok = { bg: 'var(--band-ok)', ink: 'var(--ink-ok)' };
    const flat = { bg: 'var(--surface)', ink: 'var(--color-neutral-700)' };
    return [
      { label: 'En retard', value: String(late), note: late ? 'Traitement immédiat requis' : 'Aucun retard', tone: late ? warn : ok },
      { label: 'Cette semaine', value: String(week), note: 'Dans les 7 prochains jours', tone: week ? warn : ok },
      { label: 'Sous 30 jours', value: String(this.monthCount()), note: 'Charge du mois à venir', tone: flat },
      { label: 'Traitées', value: String(treated), note: "Depuis l'ouverture de la session", tone: treated ? ok : flat },
    ].map((k) => ({ ...k, bg: k.tone.bg, labelColor: k.tone.ink, color: k.tone === flat ? 'var(--color-text)' : k.tone.ink }));
  });

  // -- Listes groupées --------------------------------------------------------------------------
  private bucketOf(item: DueItem): BucketKey {
    const n = this.daysOf(item);
    return n < 0 ? 'late' : n <= 7 ? 'week' : 'later';
  }

  protected readonly groups = computed(() => {
    const selected = this.selectedId();
    return BUCKETS.map((def) => {
      const rows = this.visibleItems()
        .filter((it) => this.bucketOf(it) === def.key)
        .map((it) => {
          const tag = remainingTag(this.daysOf(it));
          return {
            id: it.id,
            date: shortDate(this.dueOf(it)),
            title: it.title,
            detail: it.detail,
            kind: it.kind,
            account: it.account,
            owner: it.owner,
            remaining: tag.text,
            tagBg: tag.bg,
            tagFg: tag.fg,
            selected: it.id === selected,
          };
        });
      return { ...def, count: rows.length, rows };
    }).filter((g) => g.rows.length > 0);
  });

  protected readonly noRows = computed(() => this.visibleItems().length === 0);

  protected select(id: string): void {
    this.selectedId.set(id);
    this.status.set('');
  }

  // -- Détail ------------------------------------------------------------------------------------
  private readonly current = computed(
    () => DUE_ITEMS.find((it) => it.id === this.selectedId()) ?? DUE_ITEMS[0],
  );

  protected readonly detail = computed(() => {
    const cur = this.current();
    const dueIso = this.dueOf(cur);
    const n = daysUntil(dueIso, this.today);
    const tag = remainingTag(n);
    const shifted = this.shift()[cur.id] ?? 0;
    return {
      title: cur.title,
      detail: cur.detail,
      remaining: tag.text,
      tagBg: tag.bg,
      tagFg: tag.fg,
      rows: [
        { label: 'Échéance', value: fullDate(dueIso) + (shifted ? ` (reportée de ${shifted} j)` : '') },
        { label: 'Nature', value: cur.kind },
        { label: 'Compte', value: cur.account },
        { label: 'Responsable', value: cur.owner },
        { label: 'Origine', value: cur.source },
        { label: 'Action attendue', value: cur.action },
        { label: 'État', value: this.done().has(cur.id) ? 'Traitée' : n < 0 ? 'En retard' : 'Ouverte' },
      ],
    };
  });

  protected markDone(): void {
    const cur = this.current();
    this.done.update((set) => new Set(set).add(cur.id));
    this.status.set(`${cur.title} — marquée traitée.`);
  }

  protected postpone(): void {
    const cur = this.current();
    this.shift.update((s) => ({ ...s, [cur.id]: (s[cur.id] ?? 0) + POSTPONE_DAYS }));
    this.status.set(`${cur.title} — reportée de ${POSTPONE_DAYS} jours.`);
  }

  // -- Synthèses ---------------------------------------------------------------------------------
  protected readonly byKind = computed(() => {
    const counts = new Map<string, number>();
    for (const it of this.openItems()) counts.set(it.kind, (counts.get(it.kind) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([label, count]) => ({ label, count, width: `${Math.round((count / max) * 100)}%` }));
  });

  protected readonly weeks = computed(() => {
    /* Le premier créneau réunit le retard et la semaine en cours : une échéance dépassée reste
       une charge de la semaine, elle n'a pas de case à elle plus à gauche. */
    const buckets = Array.from({ length: WEEK_BUCKETS }, () => 0);
    for (const it of this.openItems()) {
      const n = this.daysOf(it);
      const idx = n < 0 ? 0 : Math.floor(n / 7);
      if (idx < WEEK_BUCKETS) buckets[idx] += 1;
    }
    const max = Math.max(...buckets, 1);
    const late = this.lateCount();
    return buckets.map((count, i) => ({
      label: i === 0 ? 'Retard + S' : `S+${i}`,
      count,
      /* Hauteur plancher de 4px : une semaine vide doit rester visible comme une barre à zéro,
         pas disparaître de l'histogramme. */
      height: `${Math.max(4, Math.round((count / max) * 84))}px`,
      color: i === 0 && late ? 'var(--ink-warn-2)' : 'var(--ds-brand-fill, var(--ink-brand-2))',
    }));
  });
}
