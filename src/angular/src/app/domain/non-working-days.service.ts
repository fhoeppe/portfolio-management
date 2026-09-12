import { Injectable } from '@angular/core';

import {
  ZONES,
  ZONE_AREA_ORDER,
  ruleDate,
  type SubstitutionPolicy,
  type WeekdayIndex,
  type Zone,
} from './holiday-rules';

/** Un jour férié d'une zone, une année donnée. */
export interface Holiday {
  /** Date effectivement chômée, en ISO — celle du report s'il y en a eu un. */
  readonly date: string;
  readonly name: string;
  /** Date de la règle, quand le férié a été reporté. `null` sinon. */
  readonly observedFrom: string | null;
}

export type NonWorkingKind = 'weekend' | 'holiday';

export interface NonWorkingDay {
  readonly date: string;
  readonly kind: NonWorkingKind;
  /** Renseigné pour un férié seulement. */
  readonly holiday: Holiday | null;
}

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parse(value) : value;
}

/**
 * Jours chômés — fins de semaine et jours fériés — par zone géographique.
 *
 * Le service ne stocke aucune donnée : tout est dérivé des règles de `holiday-rules.ts`, ce qui
 * lui permet de répondre pour n'importe quelle année, passée ou future, sans mise à jour. Le
 * calcul d'une année complète est mémorisé par couple (zone, année) : les vues calendaires
 * interrogent le même mois des dizaines de fois par rendu, et recalculer Pâques à chaque case
 * serait du gaspillage pur.
 *
 * Les dates circulent en ISO (`aaaa-mm-jj`) comme partout ailleurs dans l'application ; les
 * `Date` ne servent qu'aux calculs.
 */
@Injectable({ providedIn: 'root' })
export class NonWorkingDaysService {
  readonly zones = ZONES;
  readonly areaOrder = ZONE_AREA_ORDER;

  private readonly byId = new Map<string, Zone>(ZONES.map((z) => [z.id, z]));
  private readonly cache = new Map<string, ReadonlyMap<string, Holiday>>();

  /** Zone par identifiant ; la première du référentiel sert de repli. */
  zone(zoneId: string): Zone {
    return this.byId.get(zoneId) ?? ZONES[0];
  }

  /** Les zones groupées par aire, pour alimenter un sélecteur à intertitres. */
  zonesByArea(): readonly { readonly area: string; readonly zones: readonly Zone[] }[] {
    return this.areaOrder
      .map((area) => ({ area, zones: ZONES.filter((z) => z.area === area) }))
      .filter((g) => g.zones.length > 0);
  }

  // -- Interrogation ---------------------------------------------------------------------------

  isWeekend(date: string | Date, zoneId: string): boolean {
    const day = toDate(date).getDay() as WeekdayIndex;
    return this.zone(zoneId).weekend.includes(day);
  }

  holidayOn(date: string | Date, zoneId: string): Holiday | null {
    const d = toDate(date);
    return this.holidaysOfYear(d.getFullYear(), zoneId).get(iso(d)) ?? null;
  }

  isHoliday(date: string | Date, zoneId: string): boolean {
    return this.holidayOn(date, zoneId) !== null;
  }

  isNonWorking(date: string | Date, zoneId: string): boolean {
    return this.isWeekend(date, zoneId) || this.isHoliday(date, zoneId);
  }

  /** Qualification d'un jour, ou `null` s'il est ouvré. La fin de semaine prime sur le férié. */
  nonWorkingOn(date: string | Date, zoneId: string): NonWorkingDay | null {
    const d = toDate(date);
    const key = iso(d);
    if (this.isWeekend(d, zoneId)) return { date: key, kind: 'weekend', holiday: null };
    const holiday = this.holidayOn(d, zoneId);
    return holiday ? { date: key, kind: 'holiday', holiday } : null;
  }

  /** Jours fériés d'une année, du 1er janvier au 31 décembre, dans l'ordre. */
  holidaysInYear(year: number, zoneId: string): readonly Holiday[] {
    return [...this.holidaysOfYear(year, zoneId).values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  /** Jours chômés d'un intervalle fermé, indexés par date ISO. */
  nonWorkingInRange(fromIso: string, toIso: string, zoneId: string): ReadonlyMap<string, NonWorkingDay> {
    const out = new Map<string, NonWorkingDay>();
    const end = parse(toIso);
    for (const d = parse(fromIso); d <= end; d.setDate(d.getDate() + 1)) {
      const day = this.nonWorkingOn(d, zoneId);
      if (day) out.set(day.date, day);
    }
    return out;
  }

  /**
   * N-ième jour ouvré après une date — le calcul de base d'un dénouement : un règlement T+2
   * compte deux jours ouvrés de la place, pas deux jours calendaires.
   */
  addBusinessDays(fromIso: string, count: number, zoneId: string): string {
    const step = count < 0 ? -1 : 1;
    let left = Math.abs(count);
    const d = parse(fromIso);
    while (left > 0) {
      d.setDate(d.getDate() + step);
      if (!this.isNonWorking(d, zoneId)) left -= 1;
    }
    return iso(d);
  }

  /** Premier jour ouvré à partir de la date donnée, celle-ci comprise. */
  nextBusinessDay(fromIso: string, zoneId: string): string {
    const d = parse(fromIso);
    while (this.isNonWorking(d, zoneId)) d.setDate(d.getDate() + 1);
    return iso(d);
  }

  // -- Calcul ----------------------------------------------------------------------------------

  private holidaysOfYear(year: number, zoneId: string): ReadonlyMap<string, Holiday> {
    const key = `${zoneId}:${year}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const zone = this.zone(zoneId);
    const taken = new Set<string>();
    const out = new Map<string, Holiday>();

    for (const rule of zone.rules) {
      const raw = ruleDate(rule, year);
      /* Une règle peut déborder sur l'année voisine après report — un 26 décembre dimanche
         reporté au 28 reste dans l'année, mais le garde-fou évite qu'un cas limite ne fasse
         entrer une date d'une autre année dans la table de celle-ci. */
      const observed = this.substitute(raw, zone, taken);
      if (observed.getFullYear() !== year) continue;

      const date = iso(observed);
      taken.add(date);
      out.set(date, {
        date,
        name: rule.name,
        observedFrom: date === iso(raw) ? null : iso(raw),
      });
    }

    this.cache.set(key, out);
    return out;
  }

  /**
   * Report d'un férié tombant un jour chômé, selon la politique de la zone. `taken` porte les
   * dates déjà occupées par un report : c'est ce qui pousse le Boxing Day au mardi quand Noël a
   * déjà pris le lundi.
   */
  private substitute(raw: Date, zone: Zone, taken: ReadonlySet<string>): Date {
    const policy: SubstitutionPolicy = zone.substitution;
    if (policy === 'none') return raw;

    const isWeekendDay = (d: Date) => zone.weekend.includes(d.getDay() as WeekdayIndex);
    if (!isWeekendDay(raw) && !taken.has(iso(raw))) return raw;

    const d = new Date(raw);
    if (policy === 'nearest-weekday') {
      /* Samedi vers la veille, dimanche vers le lendemain : le jour chômé reste accolé au férié
         plutôt que d'ouvrir un pont. */
      if (d.getDay() === 6) d.setDate(d.getDate() - 1);
      else if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      return d;
    }
    if (policy === 'sunday-to-monday') {
      if (d.getDay() !== 0) return d;
      d.setDate(d.getDate() + 1);
      return d;
    }

    // next-weekday : on avance jusqu'au premier jour ouvré encore libre.
    while (isWeekendDay(d) || taken.has(iso(d))) d.setDate(d.getDate() + 1);
    return d;
  }
}
