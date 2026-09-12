/**
 * Référentiel applicatif des places de négociation — porté de `places-service.js`.
 *
 * Complète le registre ISO 10383 (`mic-registry.ts`) des données propres à l'application :
 * devise de règlement, fuseau, séance, indice de référence et cycle de dénouement. Le MIC est
 * la clé de rattachement entre les deux.
 */
export interface Settlement {
  readonly cycle: string;
  /** Date de bascule vers le cycle courant, ou la mention de son entrée en vigueur. */
  readonly shift: string;
  /** Dépositaire central. */
  readonly csd: string;
  readonly penalty: string;
}

export interface Place {
  readonly mic: string;
  readonly place: string;
  readonly code: string;
  readonly flag: string;
  readonly country: string;
  readonly currency: string;
  readonly tz: string;
  readonly hours: string;
  readonly index: string;
  /** Renseigné pour les seules places dont le cycle est suivi. */
  readonly settlement: Settlement | null;
}

export const PLACES: readonly Place[] = [
  {"mic":"XPAR","place":"Euronext Paris","code":"FR","flag":"🇫🇷","country":"France","currency":"EUR","tz":"Europe/Paris","hours":"09:00 – 17:30","index":"CAC 40","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear France","penalty":"CSDR — pénalités quotidiennes"}},
  {"mic":"XAMS","place":"Euronext Amsterdam","code":"NL","flag":"🇳🇱","country":"Pays-Bas","currency":"EUR","tz":"Europe/Amsterdam","hours":"09:00 – 17:40","index":"AEX","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear Nederland","penalty":"CSDR — pénalités quotidiennes"}},
  {"mic":"XBRU","place":"Euronext Brussels","code":"BE","flag":"🇧🇪","country":"Belgique","currency":"EUR","tz":"Europe/Brussels","hours":"09:00 – 17:30","index":"BEL 20","settlement":null},
  {"mic":"XLIS","place":"Euronext Lisbon","code":"PT","flag":"🇵🇹","country":"Portugal","currency":"EUR","tz":"Europe/Lisbon","hours":"08:00 – 16:30","index":"PSI 20","settlement":null},
  {"mic":"XDUB","place":"Euronext Dublin","code":"IE","flag":"🇮🇪","country":"Irlande","currency":"EUR","tz":"Europe/Dublin","hours":"08:00 – 16:30","index":"ISEQ 20","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear Bank","penalty":"CSDR — pénalités quotidiennes"}},
  {"mic":"XETR","place":"Xetra Francfort","code":"DE","flag":"🇩🇪","country":"Allemagne","currency":"EUR","tz":"Europe/Berlin","hours":"09:00 – 17:30","index":"DAX 40","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Clearstream","penalty":"CSDR — pénalités quotidiennes"}},
  {"mic":"XMIL","place":"Borsa Italiana","code":"IT","flag":"🇮🇹","country":"Italie","currency":"EUR","tz":"Europe/Rome","hours":"09:00 – 17:30","index":"FTSE MIB","settlement":null},
  {"mic":"XMAD","place":"Bolsa de Madrid","code":"ES","flag":"🇪🇸","country":"Espagne","currency":"EUR","tz":"Europe/Madrid","hours":"09:00 – 17:30","index":"IBEX 35","settlement":null},
  {"mic":"XLUX","place":"Bourse de Luxembourg","code":"LU","flag":"🇱🇺","country":"Luxembourg","currency":"EUR","tz":"Europe/Luxembourg","hours":"09:00 – 17:35","index":"LuxX","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Clearstream","penalty":"CSDR — pénalités quotidiennes"}},
  {"mic":"XWBO","place":"Wiener Börse","code":"AT","flag":"🇦🇹","country":"Autriche","currency":"EUR","tz":"Europe/Vienna","hours":"09:00 – 17:35","index":"ATX","settlement":null},
  {"mic":"XLON","place":"London Stock Exchange","code":"GB","flag":"🇬🇧","country":"Royaume-Uni","currency":"GBP","tz":"Europe/London","hours":"08:00 – 16:30","index":"FTSE 100","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"CREST","penalty":"Régime britannique"}},
  {"mic":"XSWX","place":"SIX Swiss Exchange","code":"CH","flag":"🇨🇭","country":"Suisse","currency":"CHF","tz":"Europe/Zurich","hours":"09:00 – 17:20","index":"SMI","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"SIX SIS","penalty":"Régime suisse"}},
  {"mic":"XSTO","place":"Nasdaq Stockholm","code":"SE","flag":"🇸🇪","country":"Suède","currency":"SEK","tz":"Europe/Stockholm","hours":"09:00 – 17:25","index":"OMXS30","settlement":null},
  {"mic":"XCSE","place":"Nasdaq Copenhague","code":"DK","flag":"🇩🇰","country":"Danemark","currency":"DKK","tz":"Europe/Copenhagen","hours":"09:00 – 16:55","index":"OMXC25","settlement":null},
  {"mic":"XOSL","place":"Oslo Børs","code":"NO","flag":"🇳🇴","country":"Norvège","currency":"NOK","tz":"Europe/Oslo","hours":"09:00 – 16:20","index":"OBX","settlement":null},
  {"mic":"XHEL","place":"Nasdaq Helsinki","code":"FI","flag":"🇫🇮","country":"Finlande","currency":"EUR","tz":"Europe/Helsinki","hours":"10:00 – 18:25","index":"OMXH25","settlement":null},
  {"mic":"XNAS","place":"Nasdaq","code":"US","flag":"🇺🇸","country":"États-Unis","currency":"USD","tz":"America/New_York","hours":"09:30 – 16:00","index":"Nasdaq 100","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"DTCC","penalty":"SEC 15c6-1"}},
  {"mic":"XNYS","place":"New York Stock Exchange","code":"US","flag":"🇺🇸","country":"États-Unis","currency":"USD","tz":"America/New_York","hours":"09:30 – 16:00","index":"S&P 500","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"DTCC","penalty":"SEC 15c6-1"}},
  {"mic":"XTSE","place":"Toronto Stock Exchange","code":"CA","flag":"🇨🇦","country":"Canada","currency":"CAD","tz":"America/Toronto","hours":"09:30 – 16:00","index":"S&P/TSX 60","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"CDS","penalty":"Régime canadien"}},
  {"mic":"XTKS","place":"Tokyo Stock Exchange","code":"JP","flag":"🇯🇵","country":"Japon","currency":"JPY","tz":"Asia/Tokyo","hours":"09:00 – 15:00","index":"Nikkei 225","settlement":null},
  {"mic":"XASX","place":"Australian Securities Exchange","code":"AU","flag":"🇦🇺","country":"Australie","currency":"AUD","tz":"Australia/Sydney","hours":"10:00 – 16:00","index":"S&P/ASX 200","settlement":null},
];

const BY_MIC = new Map<string, Place>(PLACES.map((p) => [p.mic, p]));

/* Tout ce qui n'est pas nommé ici est européen : le référentiel ne couvre que trois zones, et
   une table exhaustive se désynchroniserait du tableau des places au premier ajout. */
const CONTINENT: Readonly<Record<string, string>> = {
  US: 'Amérique du Nord',
  CA: 'Amérique du Nord',
  JP: 'Asie-Pacifique',
  AU: 'Asie-Pacifique',
};

export const CONTINENT_ORDER: readonly string[] = ['Amérique du Nord', 'Asie-Pacifique', 'Europe'];

export function continentOf(code: string): string {
  return CONTINENT[code] ?? 'Europe';
}

export function placeOf(mic: string): Place | null {
  return BY_MIC.get(String(mic).toUpperCase()) ?? null;
}

export function placesOfCountry(code: string): readonly Place[] {
  const c = String(code).toUpperCase();
  return PLACES.filter((p) => p.code === c);
}

export function allMicCodes(): readonly string[] {
  return PLACES.map((p) => p.mic).sort();
}

/** Les places dont le cycle de dénouement est renseigné. */
export function settlementPlaces(): readonly Place[] {
  return PLACES.filter((p) => p.settlement !== null);
}

/** Un pays par code, dans l'ordre d'apparition du référentiel. */
export function placeCountries(): readonly { code: string; flag: string; country: string; continent: string }[] {
  const seen = new Set<string>();
  const out: { code: string; flag: string; country: string; continent: string }[] = [];
  for (const p of PLACES) {
    if (seen.has(p.code)) continue;
    seen.add(p.code);
    out.push({ code: p.code, flag: p.flag, country: p.country, continent: continentOf(p.code) });
  }
  return out;
}

/** Drapeau émoji depuis un code pays ISO 3166 alpha-2. */
export function flagOf(code: string): string {
  const c = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return '';
  return String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65, 0x1f1e6 + c.charCodeAt(1) - 65);
}
