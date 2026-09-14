/**
 * Contrat d'alimentation des compositions d'indices, et sa lecture.
 *
 * Le référentiel embarqué (`indices.ts`) ne décrit qu'un échantillon de chaque indice : dix valeurs
 * sur quarante au CAC 40, huit sur cinq cents au S&P 500. Compléter ces listes ne se fait pas à la
 * main dans le code — les compositions changent à chaque révision trimestrielle, et une composition
 * inventée serait pire qu'une composition partielle et annoncée. Elles doivent venir d'une source :
 * un fichier déposé par l'exploitant, ou l'API du contrat (`GET /market/indices`).
 *
 * Ce module ne sait rien du transport. Il pose **le format attendu** et la fonction qui le
 * transforme en référentiel utilisable. Les deux sources partagent le même format, donc la même
 * lecture : passer du fichier à l'API ne change qu'une URL.
 *
 * ## Ce que la lecture garantit
 *
 * Une charge externe n'est pas de la donnée de confiance : elle est écrite ailleurs, par quelqu'un
 * d'autre, et une seule ligne mal formée ne doit pas casser un écran. La lecture est donc
 * **tolérante ligne à ligne et stricte sur le fond** — une valeur invalide est écartée et signalée,
 * le reste de l'indice passe. C'est ce qui permet de déposer un fichier partiel sans risque.
 *
 * - L'ISIN est vérifié jusqu'à sa clé de contrôle (module 10 après conversion des lettres) ;
 *   un ISIN faux désigne un autre titre ou aucun, l'écarter vaut mieux que le croire.
 * - Un poids doit être un nombre positif ; il n'est pas renormalisé à 100, puisque la somme des
 *   poids décrits est précisément l'information que l'application affiche.
 * - Un indice absent de la charge **garde sa composition embarquée**. C'est ce qui autorise un
 *   dépôt index par index : livrer le seul CAC 40 complet ne vide pas les vingt-sept autres.
 */

import type { IndexDef, IndexMember } from './indices';

// ═══════════════════════════════════════════════════════════════════════════════
//  Format d'échange
// ═══════════════════════════════════════════════════════════════════════════════

/** Une valeur de l'indice, telle qu'elle circule. */
export interface IndexMemberDto {
  readonly name?: string;
  readonly ticker?: string;
  readonly isin?: string;
  readonly sector?: string;
  /** Poids dans l'indice, en pourcentage — `7.9`, pas `0.079`. */
  readonly weight?: number;
  /** Capitalisation, telle qu'on veut la lire : « 312 Md€ ». Libellé, pas montant calculable. */
  readonly cap?: string;
  /** Avis du comité sur la valeur au sein de l'indice. Absent vaut « non retenue ». */
  readonly ref?: 'ok' | 'none' | string;
}

/**
 * Un indice. Seuls `key` et `members` sont requis : pour un indice déjà connu du référentiel
 * embarqué, la charge n'a besoin de porter que la composition, l'identité venant du socle.
 */
export interface IndexDto {
  readonly key?: string;
  readonly name?: string;
  readonly region?: string;
  readonly place?: string;
  /** MIC ISO 10383 de la place. Vide ou absent pour un indice réparti sur plusieurs places. */
  readonly mic?: string;
  readonly currency?: string;
  /** Effectif réel de l'indice — 40 pour le CAC 40 — même si la charge en décrit moins. */
  readonly count?: number;
  readonly detail?: string;
  /** Date d'arrêté de la composition, en ISO `AAAA-MM-JJ`. */
  readonly asOf?: string;
  readonly members?: readonly IndexMemberDto[];
}

/** La charge complète. `indices` est le seul champ nécessaire ; le reste documente la provenance. */
export interface IndexFeedDto {
  /** Version du format, pour qu'un changement futur soit détectable. */
  readonly version?: string;
  /** D'où vient la donnée, en clair : c'est ce que l'application affichera comme provenance. */
  readonly source?: string;
  /** Date d'arrêté générale, reprise par les indices qui n'en portent pas. */
  readonly asOf?: string;
  readonly indices?: readonly IndexDto[];
}

/** Résultat de la lecture : ce qui est exploitable, et tout ce qui ne l'était pas. */
export interface IndexFeedParse {
  /** Indices retenus, prêts à remplacer leur homologue du socle. Vide si la charge est inutilisable. */
  readonly indices: readonly IndexDef[];
  readonly source: string;
  readonly asOf: string;
  readonly version: string;
  /** Nombre de valeurs retenues, toutes charges confondues. */
  readonly memberCount: number;
  /**
   * Ce qui a été écarté, en clair. Rien n'est passé sous silence : une charge à moitié lue sans que
   * personne ne le sache est le pire des deux mondes — l'écran a l'air juste et ne l'est pas.
   */
  readonly warnings: readonly string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Lecture
// ═══════════════════════════════════════════════════════════════════════════════

const ISIN_SHAPE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/**
 * Validité d'un ISIN, clé de contrôle comprise (ISO 6166). Les lettres valent leur rang décalé —
 * `A` = 10 … `Z` = 35 — puis on applique le module 10 à doublement alterné depuis la droite, comme
 * pour une carte bancaire. Deux chiffres transposés dans une saisie tombent presque toujours.
 */
export function isinValid(isin: string): boolean {
  const code = (isin || '').trim().toUpperCase();
  if (!ISIN_SHAPE.test(code)) return false;
  /* Un identifiant national tout à zéro — `XX0000000000` — a une clé de contrôle arithmétiquement
     juste, la somme valant zéro. Il ne désigne pourtant aucun titre : c'est le remplissage type
     d'une extraction bâclée, et il passerait sans cette ligne. */
  if (/^0+$/.test(code.slice(2))) return false;

  let digits = '';
  for (const char of code) {
    digits += char >= '0' && char <= '9' ? char : String(char.charCodeAt(0) - 55);
  }

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Transforme une charge en indices exploitables.
 *
 * `known` est le référentiel embarqué, indexé par clé : il sert de socle d'identité — région,
 * place, devise, effectif — pour une charge qui ne porterait que des compositions. Un indice
 * inconnu du socle est accepté s'il se décrit lui-même, refusé sinon : un indice sans nom ni région
 * n'est affichable nulle part.
 */
export function parseIndexFeed(payload: unknown, known: ReadonlyMap<string, IndexDef>): IndexFeedParse {
  const warnings: string[] = [];
  const empty: IndexFeedParse = { indices: [], source: '', asOf: '', version: '', memberCount: 0, warnings };

  if (!isRecord(payload)) {
    warnings.push('La charge n’est pas un objet JSON.');
    return empty;
  }

  const rows = payload['indices'];
  if (!Array.isArray(rows)) {
    warnings.push('Champ « indices » absent ou non tableau.');
    return empty;
  }

  const feedAsOf = text(payload['asOf']);
  const indices: IndexDef[] = [];
  let memberCount = 0;

  for (const [position, row] of rows.entries()) {
    if (!isRecord(row)) {
      warnings.push(`Indice n° ${position + 1} : entrée ignorée, ce n’est pas un objet.`);
      continue;
    }

    const key = text(row['key']);
    if (!key) {
      warnings.push(`Indice n° ${position + 1} : clé absente, entrée ignorée.`);
      continue;
    }

    const base = known.get(key) ?? null;
    const name = text(row['name']) || base?.name || '';
    const region = text(row['region']) || base?.region || '';
    const place = text(row['place']) || base?.place || '';
    const currency = (text(row['currency']) || base?.currency || '').toUpperCase();

    if (!name || !region) {
      warnings.push(`« ${key} » : indice inconnu du socle et incomplet (nom ou région manquant), ignoré.`);
      continue;
    }

    const members = readMembers(key, row['members'], warnings);
    if (!members.length) {
      warnings.push(`« ${key} » : aucune valeur exploitable, la composition embarquée est conservée.`);
      continue;
    }

    /* L'effectif déclaré ne peut pas être inférieur au nombre de valeurs décrites : une charge qui
       dirait « 40 composants » en en listant 43 rendrait un taux de couverture supérieur à 100 %. */
    const declared = Number(row['count']);
    const count = Math.max(Number.isFinite(declared) && declared > 0 ? Math.trunc(declared) : 0, members.length);

    indices.push({
      key,
      name,
      region,
      place,
      mic: text(row['mic']).toUpperCase() || base?.mic,
      currency: currency || 'EUR',
      count,
      detail: text(row['detail']) || base?.detail || `${count} valeurs · devise ${currency || 'EUR'}`,
      asOf: text(row['asOf']) || feedAsOf || undefined,
      members,
    });
    memberCount += members.length;
  }

  return {
    indices,
    source: text(payload['source']),
    asOf: feedAsOf,
    version: text(payload['version']),
    memberCount,
    warnings,
  };
}

function readMembers(key: string, raw: unknown, warnings: string[]): readonly IndexMember[] {
  if (!Array.isArray(raw)) {
    warnings.push(`« ${key} » : champ « members » absent ou non tableau.`);
    return [];
  }

  const out: IndexMember[] = [];
  const seen = new Set<string>();

  for (const row of raw) {
    if (!isRecord(row)) continue;

    const isin = text(row['isin']).toUpperCase();
    const name = text(row['name']);
    const ticker = text(row['ticker']).toUpperCase();

    if (!isinValid(isin)) {
      warnings.push(`« ${key} » : ISIN invalide « ${isin || '—'} »${name ? ` (${name})` : ''}, valeur écartée.`);
      continue;
    }
    if (!name) {
      warnings.push(`« ${key} » : valeur ${isin} sans intitulé, écartée.`);
      continue;
    }
    /* Un ISIN en double fausserait le poids cumulé et le rattachement à l'univers, qui s'indexent
       tous deux par ISIN. On garde la première occurrence, qui est celle de la source. */
    if (seen.has(isin)) {
      warnings.push(`« ${key} » : ${isin} figure deux fois, doublon écarté.`);
      continue;
    }

    const weight = Number(row['weight']);
    if (!Number.isFinite(weight) || weight < 0) {
      warnings.push(`« ${key} » : poids illisible pour ${isin}, valeur écartée.`);
      continue;
    }

    seen.add(isin);
    out.push({
      name,
      ticker: ticker || isin,
      isin,
      sector: text(row['sector']) || 'Non classé',
      weight: Number(weight.toFixed(4)),
      cap: text(row['cap']) || '—',
      ref: text(row['ref']) === 'ok' ? 'ok' : 'none',
    });
  }

  return out;
}
