import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NonWorkingDaysService } from '../../domain/non-working-days.service';
import { settlementRuleFor } from '../../domain/settlement-calendar';
import {
  QUOTES,
  QUOTE_MICS,
  dateInZone,
  jitter,
  micLabel,
  minutesInZone,
  num,
  parseSession,
  placeInfo,
  signed,
  volume,
  type Quote,
} from './cours-data';

type SortKey = 'ticker' | 'change' | 'volume';

/**
 * Cours de marché. Écran sans prototype : construit à partir des référentiels existants —
 * titres négociables de Transactions, places de Paramètres, calendriers du domaine.
 *
 * Le fil conducteur est l'état de la place : un cours ne se lit pas de la même façon selon que
 * la séance est en cours, close pour la journée ou suspendue pour cause de jour chômé. C'est ce
 * que la colonne de droite dit, et ce que la ligne rappelle par son heure de cotation.
 */
@Component({
  selector: 'app-cours',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './cours.html',
  styleUrl: './cours.css',
})
export class Cours {
  private readonly nonWorking = inject(NonWorkingDaysService);

  protected readonly columns = ['security', 'place', 'last', 'change', 'range', 'volume', 'at'];

  // -- État ---------------------------------------------------------------------------------
  protected readonly query = signal('');
  protected readonly micFilter = signal('all');
  protected readonly sort = signal<SortKey>('ticker');
  /** Incrément du bouton « Rafraîchir » : il sert de graine au déplacement des cours. */
  protected readonly tick = signal(0);

  protected readonly micOptions = [
    { value: 'all', label: 'Toutes places' },
    ...QUOTE_MICS.map((mic) => ({ value: mic, label: micLabel(mic) })),
  ];

  protected readonly sorts: readonly { readonly key: SortKey; readonly label: string }[] = [
    { key: 'ticker', label: 'Alphabétique' },
    { key: 'change', label: 'Variation' },
    { key: 'volume', label: 'Volume' },
  ];

  protected setMic(v: string): void {
    this.micFilter.set(v);
  }

  protected setSort(v: SortKey): void {
    this.sort.set(v);
  }

  protected refresh(): void {
    this.tick.update((n) => n + 1);
  }

  // -- Cours ----------------------------------------------------------------------------------
  /**
   * Cours courants. Au premier rendu ce sont exactement ceux du référentiel — c'est ce qui
   * permet au prérendu serveur et au client de s'accorder. Les rafraîchissements suivants, eux,
   * ne partent que d'un geste de l'utilisateur.
   */
  private readonly live = computed(() => {
    const t = this.tick();
    if (t === 0) return QUOTES;
    return QUOTES.map((q, i) => {
      /* Un titre non coté ne bouge pas entre deux valeurs liquidatives : le faire varier serait
         mentir sur la nature de l'instrument. */
      if (q.nav) return q;
      const last = Math.max(0.01, q.last * (1 + jitter(t * 97 + i) * 0.006));
      return {
        ...q,
        last,
        high: Math.max(q.high, last),
        low: Math.min(q.low, last),
        volume: q.volume ? Math.round(q.volume * (1 + Math.abs(jitter(t * 31 + i)) * 0.04)) : 0,
      };
    });
  });

  private changeOf(q: Quote): number {
    return q.prevClose ? (q.last - q.prevClose) / q.prevClose : 0;
  }

  protected readonly rows = computed(() => {
    const s = this.query().trim().toLowerCase();
    const mic = this.micFilter();
    const sort = this.sort();

    const list = this.live()
      .filter((q) => (mic === 'all' || q.mic === mic) && (!s || q.label.toLowerCase().includes(s) || q.place.toLowerCase().includes(s)))
      .map((q) => {
        const pct = this.changeOf(q);
        const state = this.placeStates().get(q.mic);
        return {
          ...q,
          lastLabel: num(q.last, q.last >= 1000 ? 2 : 2),
          changeAbs: signed(q.last - q.prevClose),
          changePct: `${signed(pct * 100)} %`,
          up: pct > 0,
          down: pct < 0,
          rangeLabel: q.nav ? '—' : `${num(q.low)} – ${num(q.high)}`,
          volumeLabel: volume(q.volume),
          /* L'heure de cotation ne veut rien dire seule : on lui adjoint l'état de la place, qui
             dit si ce cours est vivant ou figé depuis la clôture. */
          atLabel: q.nav ? 'VL' : q.at,
          atHint: q.nav ? 'Valeur liquidative — pas de cotation en continu' : (state?.hint ?? ''),
          stale: !q.nav && state?.status !== 'open',
        };
      });

    if (sort === 'change') return list.sort((a, b) => this.changeOf(b) - this.changeOf(a));
    if (sort === 'volume') return list.sort((a, b) => b.volume - a.volume);
    return list.sort((a, b) => a.ticker.localeCompare(b.ticker));
  });

  // -- Places ---------------------------------------------------------------------------------
  /**
   * État de chaque place à l'instant présent. Trois causes possibles de fermeture, et elles ne
   * se confondent pas : jour chômé sur la zone, séance pas encore ouverte, séance terminée.
   */
  protected readonly placeStates = computed(() => {
    /* Dépend de `tick` pour que « Rafraîchir » réévalue aussi l'heure : sans cela l'état des
       places resterait figé sur celui du premier rendu. */
    this.tick();
    const now = new Date();
    const out = new Map<string, { status: 'open' | 'closed' | 'holiday' | 'untracked'; hint: string }>();

    for (const mic of QUOTE_MICS) {
      const place = placeInfo(mic);
      const session = parseSession(place?.hours);
      if (!place || !session) {
        out.set(mic, { status: 'untracked', hint: 'Place hors référentiel — horaires inconnus' });
        continue;
      }
      const zoneId = settlementRuleFor(mic).zoneId;
      const localDate = dateInZone(place.tz, now);
      const off = this.nonWorking.nonWorkingOn(localDate, zoneId);
      if (off) {
        out.set(mic, {
          status: 'holiday',
          hint: off.kind === 'weekend' ? 'Fermée — fin de semaine' : `Fermée — ${off.holiday?.name}`,
        });
        continue;
      }
      const minutes = minutesInZone(place.tz, now);
      if (minutes < session.open) {
        out.set(mic, { status: 'closed', hint: `Ouvre à ${place.hours.split('–')[0].trim()} heure locale` });
      } else if (minutes >= session.close) {
        out.set(mic, { status: 'closed', hint: `Séance close depuis ${place.hours.split('–')[1].trim()} heure locale` });
      } else {
        out.set(mic, { status: 'open', hint: `Séance en cours · ${place.hours}` });
      }
    }
    return out;
  });

  protected readonly places = computed(() =>
    QUOTE_MICS.map((mic) => {
      const place = placeInfo(mic);
      const state = this.placeStates().get(mic)!;
      return {
        mic,
        label: place?.place ?? micLabel(mic),
        flag: place?.flag ?? '',
        currency: place?.currency ?? '',
        hours: place?.hours ?? '—',
        count: this.live().filter((q) => q.mic === mic).length,
        ...state,
      };
    }),
  );

  protected readonly openCount = computed(() => this.places().filter((p) => p.status === 'open').length);

  // -- Indicateurs -----------------------------------------------------------------------------
  private readonly quoted = computed(() => this.live().filter((q) => !q.nav));

  protected readonly kpis = computed(() => {
    const quoted = this.quoted();
    const up = quoted.filter((q) => this.changeOf(q) > 0).length;
    const down = quoted.filter((q) => this.changeOf(q) < 0).length;
    const best = [...quoted].sort((a, b) => this.changeOf(b) - this.changeOf(a))[0];
    const worst = [...quoted].sort((a, b) => this.changeOf(a) - this.changeOf(b))[0];
    return [
      { label: 'Places ouvertes', value: `${this.openCount()} / ${this.places().length}`, note: 'Séance en cours à cet instant', tone: 'neutral' as const },
      { label: 'En hausse', value: String(up), note: `${down} en baisse sur ${quoted.length} cotés`, tone: up >= down ? ('ok' as const) : ('warn' as const) },
      { label: 'Plus forte hausse', value: best ? best.ticker : '—', note: best ? `${signed(this.changeOf(best) * 100)} %` : '', tone: 'ok' as const },
      { label: 'Plus forte baisse', value: worst ? worst.ticker : '—', note: worst ? `${signed(this.changeOf(worst) * 100)} %` : '', tone: 'warn' as const },
    ];
  });

  protected readonly subtitle = computed(
    () => `${this.live().length} instruments suivis · ${this.openCount()} place(s) en séance · cours indicatifs`,
  );
}
