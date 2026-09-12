import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule, type MatSelect } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NonWorkingDaysService } from '../../domain/non-working-days.service';
import { CalItemDialog, type CalItemDialogData, type CalItemDialogResult } from './cal-item-dialog';
import {
  CATS,
  CAT_KEYS,
  DAY_RANGES,
  DOW,
  DOW1,
  HOUR_PX,
  KIND_DEFS,
  KIND_KEYS,
  MONTHS,
  MONTH_CHIP_LIMIT,
  addDays,
  blankItem,
  fromMin,
  iso,
  mondayOf,
  parse,
  seedItems,
  toMin,
  type CalItem,
  type ItemKind,
  type RangeKey,
} from './calendrier-data';

type View = 'week' | 'month' | 'year';

/**
 * Porté depuis `Calendrier.dc.html`. Trois vues — semaine, mois, année — sur un même jeu
 * d'éléments, et une boîte de saisie commune.
 *
 * Le curseur est une date ISO, pas un couple (mois, année) : c'est la même valeur qui sert aux
 * trois vues, chacune l'interprétant à sa maille. Passer de l'année au mois puis à la semaine
 * ne perd donc jamais le jour visé.
 */
@Component({
  selector: 'app-calendrier',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatTooltipModule,
  ],
  templateUrl: './calendrier.html',
  styleUrl: './calendrier.css',
})
export class Calendrier {
  private readonly dialog = inject(MatDialog);
  private readonly nonWorking = inject(NonWorkingDaysService);

  protected readonly zoneGroups = this.nonWorking.zonesByArea();
  /** Zone dont on affiche les fins de semaine et les jours fériés. */
  protected readonly zone = signal('FR');

  protected readonly zoneLabel = computed(() => this.nonWorking.zone(this.zone()).label);

  protected setZone(id: string): void {
    this.zone.set(id);
  }

  /**
   * Panneau latéral déployé ou replié. Le bouton qui bascule l'état est posé hors du panneau,
   * à côté du combo « Créer » : s'il vivait à l'intérieur, il disparaîtrait avec lui et rien ne
   * permettrait plus de le rouvrir. Il se décale vers le bord gauche au repli.
   */
  protected readonly panelOpen = signal(true);

  protected togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  protected readonly hourPx = HOUR_PX;
  protected readonly legend = CAT_KEYS.map((k) => ({ label: CATS[k].label, color: CATS[k].color }));
  protected readonly dayRanges = DAY_RANGES;

  private readonly today = iso(new Date());
  /* Le mois est la maille d'ouverture : c'est celle qui donne la charge d'ensemble, la semaine
     répondant à une question plus fine qu'on pose une fois le mois consulté. */
  protected readonly view = signal<View>('month');
  protected readonly cursor = signal(this.today);
  protected readonly items = signal<readonly CalItem[]>(seedItems());
  /** Case du mois dépliée pour montrer tous ses éléments. */
  private readonly expanded = signal<string | null>(null);

  protected readonly views = [
    { key: 'week' as const, label: 'Semaine', icon: 'columns-3' },
    { key: 'month' as const, label: 'Mois', icon: 'calendar-days' },
    { key: 'year' as const, label: 'Année', icon: 'calendar-box' },
  ];

  // -- Navigation ---------------------------------------------------------------------------
  /** Le pas dépend de la vue : une semaine, un mois, une année. */
  protected move(dir: 1 | -1): void {
    const c = parse(this.cursor());
    const v = this.view();
    if (v === 'week') c.setDate(c.getDate() + 7 * dir);
    else if (v === 'month') c.setMonth(c.getMonth() + dir, 1);
    else c.setFullYear(c.getFullYear() + dir, 0, 1);
    this.cursor.set(iso(c));
    this.miniOffset.set(0);
  }

  protected goToday(): void {
    this.cursor.set(this.today);
    this.miniOffset.set(0);
  }

  protected setView(v: View): void {
    this.view.set(v);
  }

  // -- Recherche et paramètres d'affichage ----------------------------------------------------
  protected readonly searchOpen = signal(false);
  protected readonly search = signal('');
  /** Teinte de fin de semaine, réglable depuis le menu des paramètres. */
  protected readonly tintWeekends = signal(true);
  protected readonly dayRange = signal<RangeKey>('work');

  private readonly range = computed(() => DAY_RANGES.find((r) => r.key === this.dayRange()) ?? DAY_RANGES[0]);

  protected toggleSearch(): void {
    const open = !this.searchOpen();
    this.searchOpen.set(open);
    /* Refermer la recherche efface le filtre : laisser un critère actif derrière un champ
       masqué donnerait un calendrier amputé sans rien pour l'expliquer. */
    if (!open) this.search.set('');
  }

  protected setDayRange(key: RangeKey): void {
    this.dayRange.set(key);
  }

  /**
   * Marques chômées d'un jour dans la zone retenue. Fin de semaine et jour férié sont lus
   * séparément — et non par `nonWorkingOn`, qui donne la priorité à la première — pour qu'un
   * férié tombant un samedi garde son nom au lieu d'être noyé dans la fin de semaine.
   */
  private dayMarks(d: Date): { weekend: boolean; holiday: string | null } {
    const zone = this.zone();
    return {
      weekend: this.tintWeekends() && this.nonWorking.isWeekend(d, zone),
      holiday: this.nonWorking.holidayOn(d, zone)?.name ?? null,
    };
  }

  // -- Éléments -----------------------------------------------------------------------------
  /**
   * Jeu d'éléments effectivement affiché. Toutes les vues et tous les compteurs en dérivent, de
   * sorte qu'une recherche active se répercute partout d'un coup — y compris sur les totaux, qui
   * mentiraient s'ils continuaient de compter les éléments masqués.
   */
  private readonly visibleItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      (i) => i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q) || CATS[i.cat].label.toLowerCase().includes(q),
    );
  });

  private itemsOn(date: string): readonly CalItem[] {
    return this.visibleItems()
      .filter((i) => i.date === date)
      /* Les éléments sans heure passent en tête : ils valent pour la journée entière, il serait
         arbitraire de les intercaler entre deux rendez-vous. */
      .sort((a, b) => (a.allDay ? -1 : b.allDay ? 1 : toMin(a.start) - toMin(b.start)));
  }

  private chip(item: CalItem) {
    const c = CATS[item.cat];
    const timeLabel = item.allDay ? 'Toute la journée' : `${item.start} – ${item.end}`;
    return {
      item,
      title: (item.kind === 'task' ? '☐ ' : '') + item.title,
      color: c.color,
      /* Le fond reprend la couleur de la catégorie à 8 % : `color-mix` plutôt qu'un suffixe
         hexadécimal, les couleurs arrivant sous forme de `var(--ink-*)`. */
      tint: `color-mix(in srgb, ${c.color} 8%, transparent)`,
      struck: item.kind === 'task' && item.done,
      shortTime: item.allDay ? 'jour' : item.start,
      timeLabel,
      /* L'info-bulle reprend l'intitulé — tronqué sur les vignettes étroites —, le créneau puis
         la note. Les lignes sont jointes par `\n`, que `white-space: pre-line` rend visibles
         (voir `.cl-tooltip` dans le CSS) ; sans ce réglage Material les replierait en une seule
         ligne. Les segments vides sont écartés pour ne pas laisser de ligne blanche. */
      tooltip: [item.title, timeLabel, item.notes].filter(Boolean).join('\n'),
    };
  }

  // -- Vue semaine --------------------------------------------------------------------------
  protected readonly hours = computed(() => {
    const { start, end } = this.range();
    return Array.from({ length: end - start }, (_, i) => `${String(start + i).padStart(2, '0')}:00`);
  });

  protected readonly gridHeight = computed(() => (this.range().end - this.range().start) * HOUR_PX);

  protected readonly weekDays = computed(() => {
    const mon = mondayOf(parse(this.cursor()));
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const pxPerMin = HOUR_PX / 60;
    const { start: dayStart, end: dayEnd } = this.range();

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(mon, i);
      const key = iso(d);
      const isToday = key === this.today;
      const list = this.itemsOn(key);
      return {
        key,
        dow: DOW[i],
        dayNum: d.getDate(),
        isToday,
        ...this.dayMarks(d),
        allDay: list.filter((x) => x.allDay).map((x) => this.chip(x)),
        timed: list
          .filter((x) => !x.allDay)
          .map((x) => {
            const top = Math.max(0, (toMin(x.start) - dayStart * 60) * pxPerMin);
            /* Hauteur plancher de 22px : en dessous, le libellé d'un rendez-vous de quinze
               minutes ne tiendrait pas, et deux éléments voisins deviendraient indistincts. */
            const h = Math.max(22, (toMin(x.end) - toMin(x.start)) * pxPerMin - 2);
            const compact = h < 34;
            return { ...this.chip(x), top: Math.round(top), height: Math.round(h), compact };
          }),
        /* Le trait de l'heure courante n'apparaît que sur aujourd'hui, et seulement si l'heure
           tombe dans la plage affichée. */
        showNow: isToday && nowMin >= dayStart * 60 && nowMin <= dayEnd * 60,
        nowTop: Math.round((nowMin - dayStart * 60) * pxPerMin),
      };
    });
  });

  // -- Vue mois -----------------------------------------------------------------------------
  /* Les grilles démarrent au lundi : samedi et dimanche sont donc les deux dernières colonnes,
     et l'en-tête peut se teinter par l'index sans reconstruire de date. */
  /* Les grilles démarrent au lundi : la colonne d'index `i` porte donc le jour `(i + 1) % 7` au
     sens de `Date.getDay()`. On interroge la zone plutôt que de supposer samedi et dimanche —
     toutes les zones du référentiel chôment ces deux jours, mais ce n'est pas une constante. */
  protected readonly dowNames = computed(() => {
    const weekend = this.nonWorking.zone(this.zone()).weekend;
    const tint = this.tintWeekends();
    return DOW.map((label, i) => ({ label, weekend: tint && weekend.includes(((i + 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6) }));
  });

  protected readonly monthCells = computed(() => {
    const cursor = parse(this.cursor());
    const gridStart = mondayOf(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    const expanded = this.expanded();

    /* Six semaines toujours affichées : la hauteur de la grille ne doit pas sauter d'un mois à
       l'autre selon qu'il en compte cinq ou six. */
    return Array.from({ length: 42 }, (_, n) => {
      const d = addDays(gridStart, n);
      const key = iso(d);
      const other = d.getMonth() !== cursor.getMonth();
      const list = this.itemsOn(key);
      const limit = expanded === key ? list.length : MONTH_CHIP_LIMIT;
      const marks = this.dayMarks(d);
      return {
        key,
        dayNum: d.getDate(),
        other,
        weekend: marks.weekend && !other,
        holiday: other ? null : marks.holiday,
        isToday: key === this.today,
        chips: list.slice(0, limit).map((x) => this.chip(x)),
        hidden: Math.max(0, list.length - limit),
      };
    });
  });

  protected expand(key: string): void {
    this.expanded.set(key);
  }

  // -- Vue année ----------------------------------------------------------------------------
  protected readonly dow1 = computed(() => {
    const weekend = this.nonWorking.zone(this.zone()).weekend;
    const tint = this.tintWeekends();
    return DOW1.map((label, i) => ({ label, weekend: tint && weekend.includes(((i + 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6) }));
  });

  protected readonly yearMonths = computed(() => {
    const year = parse(this.cursor()).getFullYear();
    const perMonth = new Map<number, number>();
    for (const i of this.visibleItems()) {
      const d = parse(i.date);
      if (d.getFullYear() === year) perMonth.set(d.getMonth(), (perMonth.get(d.getMonth()) ?? 0) + 1);
    }

    return MONTHS.map((name, mi) => {
      const gs = mondayOf(new Date(year, mi, 1));
      return {
        index: mi,
        name,
        count: `${perMonth.get(mi) ?? 0} élém.`,
        cells: Array.from({ length: 42 }, (_, n) => {
          const d = addDays(gs, n);
          const key = iso(d);
          const other = d.getMonth() !== mi;
          const marks = this.dayMarks(d);
          return {
            key,
            other,
            weekend: marks.weekend && !other,
            holiday: other ? null : marks.holiday,
            dayNum: other ? '' : String(d.getDate()),
            isToday: key === this.today && !other,
            hasItems: !other && this.itemsOn(key).length > 0,
          };
        }),
      };
    });
  });

  protected openMonth(index: number): void {
    const year = parse(this.cursor()).getFullYear();
    this.cursor.set(iso(new Date(year, index, 1)));
    this.view.set('month');
    this.miniOffset.set(0);
  }

  protected openDay(key: string): void {
    this.cursor.set(key);
    this.view.set('week');
    this.miniOffset.set(0);
  }

  // -- En-tête ------------------------------------------------------------------------------
  protected readonly periodLabel = computed(() => {
    const cursor = parse(this.cursor());
    const year = cursor.getFullYear();
    if (this.view() === 'year') return String(year);
    if (this.view() === 'month') return `${MONTHS[cursor.getMonth()]} ${year}`;
    const mon = mondayOf(cursor);
    const end = addDays(mon, 6);
    /* Le mois n'est répété sur la borne de gauche que si la semaine chevauche deux mois. */
    const left = mon.getMonth() === end.getMonth() ? `${mon.getDate()}` : `${mon.getDate()} ${MONTHS[mon.getMonth()].toLowerCase()}`;
    return `${left} – ${end.getDate()} ${MONTHS[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
  });

  protected readonly subtitle = computed(() => {
    const v = this.view();
    const view = v === 'week' ? 'vue semaine' : v === 'month' ? 'vue mois' : 'vue année';
    return `Événements et tâches du compte — ${view} · jours chômés ${this.zoneLabel()}`;
  });

  protected readonly countLabel = computed(() => {
    const cursor = parse(this.cursor());
    const year = cursor.getFullYear();
    const n =
      this.view() === 'year'
        ? this.visibleItems().filter((i) => parse(i.date).getFullYear() === year).length
        : this.view() === 'month'
          ? this.visibleItems().filter((i) => {
              const d = parse(i.date);
              return d.getFullYear() === year && d.getMonth() === cursor.getMonth();
            }).length
          : this.weekDays().reduce((s, d) => s + d.allDay.length + d.timed.length, 0);
    return `${n} ${n > 1 ? 'éléments' : 'élément'} sur la période`;
  });

  // -- Panneau latéral ------------------------------------------------------------------------
  /**
   * Mois affiché par le navigateur du panneau. Il suit le curseur — changer de période dans la
   * vue principale le déplace — mais peut aussi s'en écarter : feuilleter les mois dans le
   * panneau ne doit pas faire bouger la grille tant qu'aucun jour n'est choisi.
   */
  private readonly miniOffset = signal(0);

  private readonly miniAnchor = computed(() => {
    const c = parse(this.cursor());
    return new Date(c.getFullYear(), c.getMonth() + this.miniOffset(), 1);
  });

  protected readonly miniLabel = computed(() => {
    const d = this.miniAnchor();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  /** Jours couverts par la vue principale, surlignés en bloc dans le mini-mois. */
  private readonly periodKeys = computed(() => {
    if (this.view() !== 'week') return new Set<string>();
    return new Set(this.weekDays().map((d) => d.key));
  });

  protected readonly miniCells = computed(() => {
    const anchor = this.miniAnchor();
    const gridStart = mondayOf(anchor);
    const period = this.periodKeys();

    return Array.from({ length: 42 }, (_, n) => {
      const d = addDays(gridStart, n);
      const key = iso(d);
      const other = d.getMonth() !== anchor.getMonth();
      const marks = this.dayMarks(d);
      return {
        key,
        dayNum: d.getDate(),
        other,
        weekend: marks.weekend && !other,
        holiday: other ? null : marks.holiday,
        isToday: key === this.today,
        inPeriod: period.has(key),
        hasItems: !other && this.itemsOn(key).length > 0,
      };
    });
  });

  protected miniMove(dir: 1 | -1): void {
    this.miniOffset.update((n) => n + dir);
  }

  /** Choisir un jour recale la vue principale dessus, sans changer de maille. */
  protected pickDay(key: string): void {
    this.cursor.set(key);
    this.miniOffset.set(0);
  }

  // -- Saisie -------------------------------------------------------------------------------
  private readonly createSelect = viewChild<MatSelect>('createSelect');

  /* Icône, couleur et phrase viennent du référentiel des natures, celui-là même dont la boîte
     de saisie tire son en-tête. */
  protected readonly createOptions = KIND_KEYS.map((value) => ({ value, ...KIND_DEFS[value] }));

  /**
   * Le combo « Créer » choisit une action, pas un état : sa valeur est remise à zéro juste
   * après, sinon rechoisir la même entrée ne réémettrait rien — `selectionChange` ne part que
   * lorsque la sélection change réellement — et le déclencheur afficherait « Tâche » en place
   * de son libellé.
   */
  protected create(kind: ItemKind): void {
    const select = this.createSelect();
    if (select) select.value = null;
    this.openNew(undefined, '09:00', kind);
  }

  /**
   * Les grilles n'agissent qu'au double-clic — créer ici, ouvrir sur une vignette. Le clic
   * simple ne fait rien : sur une surface entièrement cliquable, il partait au moindre geste de
   * survol ou de sélection et ouvrait une boîte de saisie non voulue.
   */
  protected openNew(date?: string, start = '09:00', kind: ItemKind = 'event'): void {
    this.openDialog({ ...blankItem(date ?? this.cursor(), start), kind });
  }

  protected openEdit(item: CalItem, e: Event): void {
    e.stopPropagation();
    this.openDialog({ ...item });
  }

  /** Double-clic dans la grille horaire : l'heure se déduit de l'ordonnée, arrondie à la demi-heure. */
  protected openAt(key: string, e: MouseEvent): void {
    const { start, end } = this.range();
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const raw = start * 60 + Math.round((e.clientY - box.top) / (HOUR_PX / 60) / 30) * 30;
    const min = Math.max(start * 60, Math.min(end * 60 - 30, raw));
    this.openNew(key, fromMin(min));
  }

  private openDialog(item: Omit<CalItem, 'id'> & { id?: string }): void {
    this.dialog
      .open<CalItemDialog, CalItemDialogData, CalItemDialogResult>(CalItemDialog, {
        data: { item },
        panelClass: 'pm-compact-dialog-overlay',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        if (res.action === 'delete') {
          this.items.update((list) => list.filter((i) => i.id !== res.id));
          return;
        }
        const saved = res.item;
        this.items.update((list) =>
          saved.id
            ? list.map((i) => (i.id === saved.id ? { ...i, ...saved, id: i.id } : i))
            : [...list, { ...saved, id: `n${Date.now()}` } as CalItem],
        );
      });
  }
}
