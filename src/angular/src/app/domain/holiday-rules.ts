/**
 * Règles de jours fériés par zone géographique.
 *
 * Les jours fériés sont **calculés** et non tabulés : une table année par année se périmerait
 * chaque 31 décembre, alors que les règles, elles, sont stables. Quatre familles suffisent à
 * couvrir les calendriers modélisés ici — date fixe, décalage par rapport à Pâques, n-ième jour
 * de la semaine d'un mois, et dernier jour de la semaine avant une date — auxquelles s'ajoutent
 * les deux équinoxes japonais, qui sont astronomiques.
 *
 * Le référentiel décrit les calendriers **nationaux**, plus le calendrier de règlement TARGET2
 * de la zone euro. Une place de marché peut fermer des jours supplémentaires (Euronext Paris ne
 * chôme pas tous les fériés français) ou ouvrir un jour férié : le calendrier de place est un
 * autre objet, qui n'a pas sa place ici.
 */

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HolidayRule =
  /** Date fixe dans l'année. */
  | { readonly kind: 'fixed'; readonly month: number; readonly day: number; readonly name: string }
  /** Décalage en jours par rapport au dimanche de Pâques (négatif avant). */
  | { readonly kind: 'easter'; readonly offset: number; readonly name: string }
  /** N-ième `weekday` du mois ; `nth` négatif compte depuis la fin (-1 = le dernier). */
  | { readonly kind: 'nth'; readonly month: number; readonly weekday: WeekdayIndex; readonly nth: number; readonly name: string }
  /** Dernier `weekday` strictement avant le `month`/`day` donné. */
  | { readonly kind: 'before'; readonly month: number; readonly day: number; readonly weekday: WeekdayIndex; readonly name: string }
  /** Équinoxe de printemps ou d'automne, au sens du calendrier japonais. */
  | { readonly kind: 'equinox'; readonly season: 'spring' | 'autumn'; readonly name: string };

/**
 * Report d'un férié qui tombe un jour non ouvré.
 *
 * - `none` : aucun report, le jour est simplement perdu (usage continental).
 * - `next-weekday` : reporté au premier jour ouvré suivant, en sautant un report déjà pris —
 *   c'est ainsi que le Royaume-Uni décale Noël et le lendemain de Noël au lundi et au mardi.
 * - `nearest-weekday` : samedi vers le vendredi, dimanche vers le lundi (usage américain).
 * - `sunday-to-monday` : seul le dimanche est reporté (usage japonais).
 */
export type SubstitutionPolicy = 'none' | 'next-weekday' | 'nearest-weekday' | 'sunday-to-monday';

export interface Zone {
  readonly id: string;
  readonly label: string;
  /** Regroupement d'affichage, aligné sur `CONTINENT_ORDER` du référentiel des places. */
  readonly area: string;
  /** Code ISO 3166 alpha-2, ou `null` pour un calendrier qui n'est pas celui d'un pays. */
  readonly country: string | null;
  /**
   * Jours de fin de semaine, en index `Date.getDay()` (0 = dimanche). Toutes les zones
   * modélisées ici chôment le samedi et le dimanche ; le champ existe parce que ce n'est pas
   * universel — les places du Golfe chôment le vendredi et le samedi — et qu'un service qui
   * coderait en dur `[6, 0]` devrait être repris de fond en comble le jour où l'une d'elles
   * entrerait au référentiel.
   */
  readonly weekend: readonly WeekdayIndex[];
  readonly substitution: SubstitutionPolicy;
  readonly rules: readonly HolidayRule[];
}

const SAT_SUN: readonly WeekdayIndex[] = [6, 0];

/* Règles communes aux calendriers chrétiens d'Europe occidentale, reprises telles quelles par
   plusieurs zones. */
const GOOD_FRIDAY: HolidayRule = { kind: 'easter', offset: -2, name: 'Vendredi saint' };
const EASTER_MONDAY: HolidayRule = { kind: 'easter', offset: 1, name: 'Lundi de Pâques' };
const ASCENSION: HolidayRule = { kind: 'easter', offset: 39, name: 'Ascension' };
const WHIT_MONDAY: HolidayRule = { kind: 'easter', offset: 50, name: 'Lundi de Pentecôte' };

export const ZONES: readonly Zone[] = [
  {
    id: 'TARGET',
    label: 'Zone euro — TARGET2',
    area: 'Europe',
    country: null,
    weekend: SAT_SUN,
    substitution: 'none',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      GOOD_FRIDAY,
      EASTER_MONDAY,
      { kind: 'fixed', month: 5, day: 1, name: 'Fête du travail' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Lendemain de Noël' },
    ],
  },
  {
    id: 'FR',
    label: 'France',
    area: 'Europe',
    country: 'FR',
    weekend: SAT_SUN,
    substitution: 'none',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      EASTER_MONDAY,
      { kind: 'fixed', month: 5, day: 1, name: 'Fête du travail' },
      { kind: 'fixed', month: 5, day: 8, name: 'Victoire 1945' },
      ASCENSION,
      WHIT_MONDAY,
      { kind: 'fixed', month: 7, day: 14, name: 'Fête nationale' },
      { kind: 'fixed', month: 8, day: 15, name: 'Assomption' },
      { kind: 'fixed', month: 11, day: 1, name: 'Toussaint' },
      { kind: 'fixed', month: 11, day: 11, name: 'Armistice 1918' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
    ],
  },
  {
    id: 'DE',
    label: 'Allemagne',
    area: 'Europe',
    country: 'DE',
    weekend: SAT_SUN,
    substitution: 'none',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      GOOD_FRIDAY,
      EASTER_MONDAY,
      { kind: 'fixed', month: 5, day: 1, name: 'Fête du travail' },
      ASCENSION,
      WHIT_MONDAY,
      { kind: 'fixed', month: 10, day: 3, name: "Unité allemande" },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Lendemain de Noël' },
    ],
  },
  {
    id: 'GB',
    label: 'Royaume-Uni',
    area: 'Europe',
    country: 'GB',
    weekend: SAT_SUN,
    substitution: 'next-weekday',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      GOOD_FRIDAY,
      EASTER_MONDAY,
      { kind: 'nth', month: 5, weekday: 1, nth: 1, name: 'Early May bank holiday' },
      { kind: 'nth', month: 5, weekday: 1, nth: -1, name: 'Spring bank holiday' },
      { kind: 'nth', month: 8, weekday: 1, nth: -1, name: 'Summer bank holiday' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Boxing Day' },
    ],
  },
  {
    id: 'CH',
    label: 'Suisse',
    area: 'Europe',
    country: 'CH',
    weekend: SAT_SUN,
    substitution: 'none',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      { kind: 'fixed', month: 1, day: 2, name: 'Saint-Berchtold' },
      GOOD_FRIDAY,
      EASTER_MONDAY,
      { kind: 'fixed', month: 5, day: 1, name: 'Fête du travail' },
      ASCENSION,
      WHIT_MONDAY,
      { kind: 'fixed', month: 8, day: 1, name: 'Fête nationale' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Saint-Étienne' },
    ],
  },
  {
    id: 'US',
    label: 'États-Unis',
    area: 'Amérique du Nord',
    country: 'US',
    weekend: SAT_SUN,
    substitution: 'nearest-weekday',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      { kind: 'nth', month: 1, weekday: 1, nth: 3, name: 'Martin Luther King Jr. Day' },
      { kind: 'nth', month: 2, weekday: 1, nth: 3, name: "Presidents' Day" },
      GOOD_FRIDAY,
      { kind: 'nth', month: 5, weekday: 1, nth: -1, name: 'Memorial Day' },
      { kind: 'fixed', month: 6, day: 19, name: 'Juneteenth' },
      { kind: 'fixed', month: 7, day: 4, name: 'Independence Day' },
      { kind: 'nth', month: 9, weekday: 1, nth: 1, name: 'Labor Day' },
      { kind: 'nth', month: 11, weekday: 4, nth: 4, name: 'Thanksgiving' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
    ],
  },
  {
    id: 'CA',
    label: 'Canada',
    area: 'Amérique du Nord',
    country: 'CA',
    weekend: SAT_SUN,
    substitution: 'next-weekday',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      { kind: 'nth', month: 2, weekday: 1, nth: 3, name: 'Family Day' },
      GOOD_FRIDAY,
      { kind: 'before', month: 5, day: 25, weekday: 1, name: 'Fête de la Reine' },
      { kind: 'fixed', month: 7, day: 1, name: 'Fête du Canada' },
      { kind: 'nth', month: 8, weekday: 1, nth: 1, name: 'Congé civique' },
      { kind: 'nth', month: 9, weekday: 1, nth: 1, name: 'Fête du Travail' },
      { kind: 'nth', month: 10, weekday: 1, nth: 2, name: 'Action de grâce' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Lendemain de Noël' },
    ],
  },
  {
    id: 'JP',
    label: 'Japon',
    area: 'Asie-Pacifique',
    country: 'JP',
    weekend: SAT_SUN,
    substitution: 'sunday-to-monday',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      { kind: 'nth', month: 1, weekday: 1, nth: 2, name: 'Majorité' },
      { kind: 'fixed', month: 2, day: 11, name: 'Fondation nationale' },
      { kind: 'fixed', month: 2, day: 23, name: "Anniversaire de l'Empereur" },
      { kind: 'equinox', season: 'spring', name: 'Équinoxe de printemps' },
      { kind: 'fixed', month: 4, day: 29, name: 'Journée Shōwa' },
      { kind: 'fixed', month: 5, day: 3, name: 'Constitution' },
      { kind: 'fixed', month: 5, day: 4, name: 'Fête de la nature' },
      { kind: 'fixed', month: 5, day: 5, name: 'Fête des enfants' },
      { kind: 'nth', month: 7, weekday: 1, nth: 3, name: 'Fête de la mer' },
      { kind: 'fixed', month: 8, day: 11, name: 'Fête de la montagne' },
      { kind: 'nth', month: 9, weekday: 1, nth: 3, name: 'Respect des aînés' },
      { kind: 'equinox', season: 'autumn', name: "Équinoxe d'automne" },
      { kind: 'nth', month: 10, weekday: 1, nth: 2, name: 'Fête du sport' },
      { kind: 'fixed', month: 11, day: 3, name: 'Fête de la culture' },
      { kind: 'fixed', month: 11, day: 23, name: 'Action de grâce du travail' },
    ],
  },
  {
    id: 'AU',
    label: 'Australie',
    area: 'Asie-Pacifique',
    country: 'AU',
    weekend: SAT_SUN,
    substitution: 'next-weekday',
    rules: [
      { kind: 'fixed', month: 1, day: 1, name: "Jour de l'An" },
      { kind: 'fixed', month: 1, day: 26, name: "Fête de l'Australie" },
      GOOD_FRIDAY,
      EASTER_MONDAY,
      { kind: 'fixed', month: 4, day: 25, name: 'Anzac Day' },
      { kind: 'nth', month: 6, weekday: 1, nth: 2, name: 'Anniversaire du souverain' },
      { kind: 'fixed', month: 12, day: 25, name: 'Noël' },
      { kind: 'fixed', month: 12, day: 26, name: 'Boxing Day' },
    ],
  },
];

export const ZONE_AREA_ORDER: readonly string[] = ['Europe', 'Amérique du Nord', 'Asie-Pacifique'];

// -- Calcul ---------------------------------------------------------------------------------

/**
 * Dimanche de Pâques grégorien — algorithme dit de Meeus/Jones/Butcher. Valable pour toute année
 * du calendrier grégorien, sans table.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return new Date(year, Math.floor(n / 31) - 1, (n % 31) + 1);
}

/**
 * Équinoxes du calendrier japonais. Le jour férié n'est pas posé par une règle mais constaté
 * astronomiquement puis publié ; cette approximation, d'usage courant, est exacte de 1980 à 2099
 * — au-delà, il faudrait un vrai calcul d'éphéméride.
 */
export function equinoxDay(year: number, season: 'spring' | 'autumn'): number {
  const base = season === 'spring' ? 20.8431 : 23.2488;
  return Math.floor(base + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** N-ième `weekday` du mois ; `nth` négatif compte depuis la fin. */
function nthWeekdayOf(year: number, month: number, weekday: number, nth: number): Date {
  if (nth > 0) {
    const first = new Date(year, month - 1, 1);
    const shift = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month - 1, 1 + shift + (nth - 1) * 7);
  }
  const last = new Date(year, month, 0);
  const shift = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, -shift + (nth + 1) * 7);
}

/** Dernier `weekday` strictement avant `month`/`day`. */
function weekdayBefore(year: number, month: number, day: number, weekday: number): Date {
  const target = new Date(year, month - 1, day);
  const back = (target.getDay() - weekday + 6) % 7 + 1;
  return new Date(year, month - 1, day - back);
}

/** Date brute d'une règle, avant tout report. */
export function ruleDate(rule: HolidayRule, year: number): Date {
  switch (rule.kind) {
    case 'fixed':
      return new Date(year, rule.month - 1, rule.day);
    case 'easter': {
      const d = easterSunday(year);
      d.setDate(d.getDate() + rule.offset);
      return d;
    }
    case 'nth':
      return nthWeekdayOf(year, rule.month, rule.weekday, rule.nth);
    case 'before':
      return weekdayBefore(year, rule.month, rule.day, rule.weekday);
    case 'equinox':
      return new Date(year, rule.season === 'spring' ? 2 : 8, equinoxDay(year, rule.season));
  }
}
