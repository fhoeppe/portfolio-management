/**
 * Cours de marché — jeu d'essai et ouverture des places.
 *
 * Contrairement aux autres écrans, celui-ci n'a pas de prototype `.dc.html` : le bouton de menu
 * existait sans page derrière. Les titres et les places viennent donc de référentiels déjà en
 * place — `TRADABLE_SECURITIES` pour les instruments, `PLACES` pour la séance, la devise et le
 * fuseau — et seuls les cours eux-mêmes sont inventés, comme les autres jeux d'essai de l'app.
 *
 * Les valeurs sont écrites en dur, jamais tirées au hasard à l'import : un `Math.random()` au
 * chargement du module donnerait des nombres différents au prérendu serveur et au client, et
 * l'hydratation signalerait l'écart.
 */
import { MIC_SHORT, TRADABLE_SECURITIES } from '../transactions/transactions-data';
import { placeOf, type Place } from '../parametres/places-data';

export interface Quote {
  readonly ticker: string;
  readonly label: string;
  readonly mic: string;
  readonly place: string;
  /** Devise de cotation, reprise de la place. */
  readonly currency: string;
  readonly last: number;
  /** Clôture de la veille : c'est d'elle que se compte la variation du jour. */
  readonly prevClose: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly volume: number;
  /** Heure du dernier échange, dans le fuseau de la place. */
  readonly at: string;
  /** Instrument non coté en continu — sa « cotation » est une valeur liquidative. */
  readonly nav: boolean;
}

interface Seed {
  readonly ticker: string;
  readonly last: number;
  readonly prevClose: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly volume: number;
  readonly at: string;
  readonly nav?: boolean;
}

const SEEDS: readonly Seed[] = [
  { ticker: 'AI', last: 168.42, prevClose: 166.9, open: 167.1, high: 169.05, low: 166.72, volume: 412_300, at: '17:35' },
  { ticker: 'MC', last: 611.8, prevClose: 618.4, open: 617.2, high: 618.9, low: 609.4, volume: 286_150, at: '17:35' },
  { ticker: 'OR', last: 382.15, prevClose: 380.05, open: 380.6, high: 383.9, low: 379.8, volume: 198_740, at: '17:35' },
  { ticker: 'GLBEQ', last: 214.36, prevClose: 213.02, open: 213.2, high: 214.8, low: 212.9, volume: 54_820, at: '17:35' },
  { ticker: 'USLC', last: 39.18, prevClose: 38.74, open: 38.8, high: 39.31, low: 38.75, volume: 1_204_600, at: '16:30' },
  { ticker: 'IGCRD', last: 101.62, prevClose: 101.88, open: 101.85, high: 101.9, low: 101.55, volume: 88_410, at: '16:30' },
  { ticker: 'EMEQ', last: 47.93, prevClose: 48.61, open: 48.5, high: 48.62, low: 47.8, volume: 176_900, at: '17:35' },
  { ticker: 'INFRA', last: 1_042.5, prevClose: 1_042.5, open: 1_042.5, high: 1_042.5, low: 1_042.5, volume: 0, at: '—', nav: true },
  { ticker: 'PRVE', last: 2_187.0, prevClose: 2_187.0, open: 2_187.0, high: 2_187.0, low: 2_187.0, volume: 0, at: '—', nav: true },
  { ticker: 'HYBND', last: 96.44, prevClose: 96.2, open: 96.25, high: 96.58, low: 96.12, volume: 63_270, at: '16:30' },
  { ticker: 'CRYPT', last: 58.72, prevClose: 61.35, open: 61.0, high: 61.12, low: 57.94, volume: 742_800, at: '17:30' },
  { ticker: 'SMLCP', last: 132.08, prevClose: 131.44, open: 131.5, high: 132.6, low: 131.2, volume: 41_560, at: '17:35' },
  { ticker: 'TSY10', last: 92.86, prevClose: 93.41, open: 93.3, high: 93.35, low: 92.71, volume: 2_318_400, at: '16:00' },
  { ticker: 'CAC40', last: 8_214.6, prevClose: 8_187.3, open: 8_190.2, high: 8_228.4, low: 8_181.9, volume: 0, at: '17:35' },
  { ticker: 'SX5E', last: 5_468.2, prevClose: 5_451.7, open: 5_453.0, high: 5_474.1, low: 5_447.2, volume: 0, at: '17:30' },
];

/* Eurex et le gré à gré ne sont pas au référentiel des places : leur devise est posée ici, à
   défaut de mieux, plutôt que de laisser la colonne vide. */
const FALLBACK_CURRENCY: Readonly<Record<string, string>> = { XEUR: 'EUR', OTC: 'EUR' };

export const QUOTES: readonly Quote[] = SEEDS.map((s) => {
  const sec = TRADABLE_SECURITIES.find((x) => x.ticker === s.ticker)!;
  const place = placeOf(sec.mic);
  return {
    ...s,
    label: sec.label,
    mic: sec.mic,
    place: sec.place,
    currency: place?.currency ?? FALLBACK_CURRENCY[sec.mic] ?? 'EUR',
    nav: s.nav ?? false,
  };
});

/** Places représentées par au moins un titre, dans l'ordre d'apparition. */
export const QUOTE_MICS: readonly string[] = [...new Set(QUOTES.map((q) => q.mic))];

export function micLabel(mic: string): string {
  return MIC_SHORT[mic] ?? mic;
}

export function placeInfo(mic: string): Place | null {
  return placeOf(mic);
}

// -- Séance ---------------------------------------------------------------------------------

export interface Session {
  readonly open: number;
  readonly close: number;
}

/** « 09:00 – 17:30 » → minutes depuis minuit. */
export function parseSession(hours: string | undefined): Session | null {
  const m = /(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/.exec(hours ?? '');
  if (!m) return null;
  return { open: +m[1] * 60 + +m[2], close: +m[3] * 60 + +m[4] };
}

/**
 * Heure locale d'une place, en minutes depuis minuit. Passe par `Intl` plutôt que par un décalage
 * en dur : c'est le seul moyen d'être juste des deux côtés d'un changement d'heure, et les
 * bascules américaine et européenne ne tombent pas les mêmes jours.
 */
export function minutesInZone(tz: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

/** Date du jour telle qu'elle est vécue sur la place — elle peut différer de la nôtre. */
export function dateInZone(tz: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// -- Mise en forme --------------------------------------------------------------------------

export function num(v: number, digits = 2): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function signed(v: number, digits = 2): string {
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), digits)}`;
}

export function volume(v: number): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `${num(v / 1_000_000, 2)} M`;
  if (v >= 1_000) return `${num(v / 1_000, 1)} k`;
  return String(v);
}

/**
 * Petit déplacement de cours, pour que le bouton de rafraîchissement fasse quelque chose de
 * visible. Générateur à graine plutôt que `Math.random` : la suite est reproductible, donc une
 * anomalie constatée se rejoue à l'identique.
 */
export function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}
