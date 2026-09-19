import { Injectable, computed, inject } from '@angular/core';

import { INDEX_MIC, indicesSource, type IndexDef } from './indices';
import { SecurityCatalogService } from './security-catalog.service';
import { POS, PORTFOLIOS, value } from '../pages/positions/positions-data';
import { micByCode } from '../pages/parametres/mic-registry';
import { NON_COUNTRY_ISIN, countryFlag, countryName } from './countries';
import type { SecurityElement } from './security-reference';

/**
 * Composition des indices de référence — un nom d'indice en entrée, ses composants en sortie.
 *
 * Le service ne stocke rien : il assemble ce que trois référentiels savent déjà et que personne ne
 * rapprochait. `titres-data` porte les membres et leur pondération, `mic-registry` le code ISO 10383
 * de la place, `countries` le pays d'émission et son drapeau. Un appelant qui voulait la fiche
 * complète d'un composant devait interroger les trois et recoller lui-même.
 *
 * Il ajoute aussi ce que les référentiels seuls ne disent pas : le composant est-il connu de notre
 * univers d'investissement, y est-il retenu à l'achat, et dans combien de comptes est-il détenu.
 * C'est la question qu'on se pose en lisant une composition d'indice.
 */

/** Un composant d'indice, tel qu'on veut le lire : identité, cotation, pesée, rattachement. */
export interface IndexComponent {
  readonly name: string;
  readonly ticker: string;
  readonly isin: string;
  /** MIC ISO 10383 de la place de cotation. Vide pour un indice réparti sur plusieurs places. */
  readonly mic: string;
  /** Libellé de la place tel que le référentiel des indices le nomme. */
  readonly place: string;
  readonly currency: string;
  /** Pays d'émission, déduit des deux premières lettres de l'ISIN. */
  readonly countryCode: string;
  readonly country: string;
  readonly flag: string;
  readonly sector: string;
  /** Poids dans l'indice, en pourcentage. */
  readonly weight: number;
  readonly marketCap: string;
  /** Le titre figure à notre univers d'investissement. */
  readonly inUniverse: boolean;
  /** Il y est retenu à l'achat — l'univers peut connaître un titre sans l'autoriser. */
  readonly retained: boolean;
  /** Nombre de comptes qui le détiennent aujourd'hui. */
  readonly heldAccounts: number;
}

export interface IndexComposition {
  readonly key: string;
  readonly name: string;
  readonly region: string;
  readonly place: string;
  /** Vide quand l'indice couvre plusieurs places — un S&P 500 cote à New York et au Nasdaq. */
  readonly mic: string;
  /** Le MIC figure au registre ISO embarqué : 291 entrées, pas les 2 875 du registre complet. */
  readonly micInRegistry: boolean;
  readonly currency: string;
  readonly detail: string;
  /** Nombre de valeurs qui composent l'indice réel — 40 pour le CAC 40. */
  readonly declaredCount: number;
  /** Nombre de composants détaillés par le référentiel : l'échantillon n'est pas exhaustif. */
  readonly detailedCount: number;
  /** Somme des poids détaillés, en pourcentage de l'indice. */
  readonly detailedWeight: number;
  readonly components: readonly IndexComponent[];
}

/** Résumé d'un indice, sans ses composants — pour alimenter un sélecteur. */
export interface IndexSummary {
  readonly key: string;
  readonly name: string;
  readonly region: string;
  readonly place: string;
  readonly mic: string;
  readonly currency: string;
  readonly declaredCount: number;
  readonly detailedCount: number;
}

/** Comparaison souple : sans casse, sans accents, sans ponctuation ni espaces. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

@Injectable({ providedIn: 'root' })
export class IndexCompositionService {
  /* L'univers est indexé par ISIN et non par ticker : deux places peuvent servir le même titre sous
     des codes différents, l'ISIN est le seul identifiant stable.

     Le catalogue est injecté et non importé, puisqu'il arrive à la demande. L'index doit donc se
     refaire quand il arrive : une `Map` construite au champ serait restée vide pour toujours. */
  private readonly catalog = inject(SecurityCatalogService);
  private readonly universeIndex = computed(() => new Map(this.catalog.securities().map((s) => [s.isin, s])));

  /**
   * Les indices tels qu'ils sont **en ce moment** : le socle embarqué tant que rien n'est chargé,
   * la composition livrée par la source dès que `IndexFeedService` l'a appliquée.
   *
   * Toutes les méthodes passent par là plutôt que par la constante du module, et c'est ce qui rend
   * le rechargement visible sans qu'aucun appelant ne change : lire un signal depuis un `computed`
   * l'y abonne, donc un écran qui demandait déjà une composition la voit se corriger toute seule.
   */
  private all(): readonly IndexDef[] {
    return indicesSource();
  }

  /** Tous les indices du référentiel, sans leurs composants. */
  indices(): readonly IndexSummary[] {
    return this.all().map((i) => ({
      key: i.key,
      name: i.name,
      region: i.region,
      place: i.place,
      mic: i.mic ?? INDEX_MIC[i.key] ?? '',
      currency: i.currency,
      declaredCount: i.count,
      detailedCount: i.members.length,
    }));
  }

  /**
   * Composition d'un indice désigné par son nom ou sa clé. La recherche est souple — « CAC 40 »,
   * « cac40 » et « Cac-40 » désignent le même indice — et procède du plus strict au plus large :
   * égalité, puis début de nom, puis fragment. `null` si rien ne correspond, ou si plusieurs
   * indices correspondent également : mieux vaut ne rien répondre que de choisir à la place de
   * l'appelant, qui dispose de `search()` pour lever l'ambiguïté.
   */
  byName(query: string): IndexComposition | null {
    const def = this.resolve(query);
    return def ? this.compose(def) : null;
  }

  /** Raccourci : les composants seuls. */
  components(query: string): readonly IndexComponent[] {
    return this.byName(query)?.components ?? [];
  }

  /**
   * Même composition, mais sur une liste de membres fournie par l'appelant plutôt que sur celle du
   * référentiel. C'est ce dont a besoin un écran qui a rechargé l'indice : la liste vient de lui,
   * l'enrichissement — MIC, pays, rattachement à l'univers — reste ici.
   */
  withMembers(query: string, members: readonly SecurityElement[]): IndexComposition | null {
    const def = this.resolve(query);
    return def ? this.compose({ ...def, members }) : null;
  }

  /** Tous les indices dont le nom ou la clé contient la recherche — pour lever une ambiguïté. */
  search(query: string): readonly IndexSummary[] {
    const q = normalize(query);
    if (!q) return this.indices();
    return this.indices().filter((i) => normalize(i.name).includes(q) || normalize(i.key).includes(q));
  }

  /**
   * Indices qui comptent ce titre parmi leurs composants, désigné par ISIN ou par ticker. Répond à
   * la question inverse : « où ce titre pèse-t-il ? »
   */
  indicesOf(isinOrTicker: string): readonly { readonly index: IndexSummary; readonly weight: number }[] {
    const q = normalize(isinOrTicker);
    if (!q) return [];
    const out: { index: IndexSummary; weight: number }[] = [];
    for (const def of this.all()) {
      const hit = def.members.find((m) => normalize(m.isin) === q || normalize(m.ticker) === q);
      if (hit) {
        out.push({
          index: this.indices().find((i) => i.key === def.key)!,
          /* `?? 0` et non une garde : une valeur trouvée DANS une composition porte toujours son
             poids — c'est le type qui l'ignore, `weight` étant facultatif pour les titres du
             catalogue, qui n'appartiennent à aucune liste. */
          weight: hit.weight ?? 0,
        });
      }
    }
    return out.sort((a, b) => b.weight - a.weight);
  }

  /** Indices groupés par région, dans l'ordre du référentiel — pour un sélecteur à intertitres. */
  byRegion(): readonly { readonly region: string; readonly indices: readonly IndexSummary[] }[] {
    const order: string[] = [];
    const rows = new Map<string, IndexSummary[]>();
    for (const i of this.indices()) {
      if (!rows.has(i.region)) {
        rows.set(i.region, []);
        order.push(i.region);
      }
      rows.get(i.region)!.push(i);
    }
    return order.map((region) => ({ region, indices: rows.get(region)! }));
  }

  /** Fiche d'un composant précis, désigné par ISIN ou par ticker. */
  component(query: string, isinOrTicker: string): IndexComponent | null {
    const q = normalize(isinOrTicker);
    return this.components(query).find((c) => normalize(c.isin) === q || normalize(c.ticker) === q) ?? null;
  }

  /** Les composants les plus lourds, du plus au moins pesant. */
  heaviest(query: string, count = 10): readonly IndexComponent[] {
    return [...this.components(query)].sort((a, b) => b.weight - a.weight).slice(0, Math.max(0, count));
  }

  /**
   * Ce que l'indice et notre univers d'investissement ont en commun, en nombre et en poids. La
   * part de poids importe plus que le nombre : connaître trois valeurs sur dix ne dit rien, savoir
   * qu'elles pèsent un tiers de l'indice dit tout.
   */
  universeCoverage(query: string): {
    readonly detailed: number;
    readonly known: number;
    readonly retained: number;
    readonly held: number;
    readonly knownWeight: number;
    readonly heldWeight: number;
  } {
    const rows = this.components(query);
    const known = rows.filter((r) => r.inUniverse);
    const held = known.filter((r) => r.heldAccounts > 0);
    const sum = (list: readonly IndexComponent[]) => Number(list.reduce((s, r) => s + r.weight, 0).toFixed(2));
    return {
      detailed: rows.length,
      known: known.length,
      retained: known.filter((r) => r.retained).length,
      held: held.length,
      knownWeight: sum(known),
      heldWeight: sum(held),
    };
  }

  /**
   * Composants communs à deux indices, avec leur poids de part et d'autre. Deux indices voisins se
   * recouvrent souvent plus qu'on ne le croit — un Nasdaq 100 et un S&P 500 partagent leurs plus
   * grosses lignes —, et c'est ce recouvrement qui concentre le risque quand on détient les deux.
   */
  overlap(
    first: string,
    second: string,
  ): readonly { readonly component: IndexComponent; readonly weightFirst: number; readonly weightSecond: number }[] {
    const a = this.components(first);
    const b = this.components(second);
    const byIsin = new Map(b.map((c) => [c.isin, c]));
    return a
      .filter((c) => byIsin.has(c.isin))
      .map((c) => ({ component: c, weightFirst: c.weight, weightSecond: byIsin.get(c.isin)!.weight }))
      .sort((x, y) => y.weightFirst + y.weightSecond - (x.weightFirst + x.weightSecond));
  }

  /**
   * Filtrage des composants sur les critères qu'on interroge en pratique : un secteur, un pays, un
   * poids plancher, ou ce que l'univers en connaît. Les critères se cumulent.
   */
  filter(
    query: string,
    criteria: {
      readonly sector?: string;
      readonly country?: string;
      readonly minWeight?: number;
      readonly retainedOnly?: boolean;
      readonly inUniverseOnly?: boolean;
    },
  ): readonly IndexComponent[] {
    const sector = criteria.sector ? normalize(criteria.sector) : '';
    const country = criteria.country ? normalize(criteria.country) : '';
    return this.components(query).filter((c) => {
      if (sector && !normalize(c.sector).includes(sector)) return false;
      if (country && normalize(c.country) !== country && normalize(c.countryCode) !== country) return false;
      if (criteria.minWeight !== undefined && c.weight < criteria.minWeight) return false;
      if (criteria.retainedOnly && !c.retained) return false;
      if (criteria.inUniverseOnly && !c.inUniverse) return false;
      return true;
    });
  }

  /**
   * Concentration de l'indice. Le poids des premières lignes se lit d'un coup d'œil ; l'indice de
   * Herfindahl-Hirschman, somme des carrés des poids, dit la même chose en un nombre et sert de
   * seuil réglementaire. Son inverse donne le « nombre effectif de lignes » : un indice de cent
   * valeurs dont trois font la moitié du poids ne se comporte pas comme un indice de cent valeurs.
   *
   * Les poids sont ramenés à la part détaillée et non à 100 : le référentiel ne liste pas tous les
   * composants, rapporter au total déclaré donnerait une concentration artificiellement basse.
   */
  concentration(query: string): {
    readonly top3: number;
    readonly top5: number;
    readonly top10: number;
    readonly hhi: number;
    readonly effectiveCount: number;
  } {
    const rows = this.heaviest(query, Number.MAX_SAFE_INTEGER);
    const total = rows.reduce((n, r) => n + r.weight, 0);
    if (!total) return { top3: 0, top5: 0, top10: 0, hhi: 0, effectiveCount: 0 };
    const share = rows.map((r) => r.weight / total);
    const cut = (n: number) => Number((share.slice(0, n).reduce((a, b) => a + b, 0) * 100).toFixed(2));
    const hhi = share.reduce((a, b) => a + b * b, 0);
    return {
      top3: cut(3),
      top5: cut(5),
      top10: cut(10),
      hhi: Number((hhi * 10000).toFixed(0)),
      effectiveCount: Number((1 / hhi).toFixed(1)),
    };
  }

  /**
   * Écart entre la composition d'un indice et celle d'un compte : ce qui y est surpondéré, ce qui
   * y est sous-pondéré, ce qui n'y figure pas du tout. C'est la lecture qu'on attend d'un indice
   * quand on gère un portefeuille — le reste n'est que documentation.
   *
   * Les poids de l'indice sont ramenés à la part détaillée, ceux du compte à sa valorisation
   * totale ; comparer une part de 8 % d'un échantillon à une part de 8 % d'un portefeuille complet
   * n'aurait aucun sens autrement.
   *
   * L'identifiant accepté est celui d'un compte institutionnel (`BGM-004`) comme celui d'un
   * portefeuille courtier (`DG-CTO`) : l'application tient les deux dans des jeux séparés, et les
   * titres en direct — ceux qui composent un indice — vivent dans le second. Interroger le seul
   * premier renverrait des écarts de 100 % sans que rien ne soit faux.
   */
  versusAccount(
    query: string,
    account: string,
  ): {
    readonly account: string;
    readonly lines: readonly {
      readonly name: string;
      readonly ticker: string;
      readonly isin: string;
      readonly indexWeight: number;
      readonly accountWeight: number;
      readonly gap: number;
    }[];
    readonly heldWeight: number;
  } {
    const rows = this.components(query);
    const indexTotal = rows.reduce((n, r) => n + r.weight, 0) || 1;

    const accountWeightByIsin = new Map<string, number>();
    const institutional = POS.filter((p) => p.account === account);
    const broker = PORTFOLIOS.find((p) => p.id === account);

    if (institutional.length) {
      const total = institutional.reduce((n, p) => n + value(p), 0) || 1;
      for (const p of institutional) {
        accountWeightByIsin.set(p.isin, (accountWeightByIsin.get(p.isin) ?? 0) + (value(p) / total) * 100);
      }
    } else if (broker) {
      /* Un portefeuille courtier valorise ses lignes lui-même — quantité fois cours — et n'a pas
         de conversion de change à appliquer : ses positions sont tenues dans la devise du compte. */
      const lines = broker.positions.map((p) => ({ isin: p.isin, amount: p.qty * p.price }));
      const total = lines.reduce((n, l) => n + l.amount, 0) || 1;
      for (const l of lines) {
        accountWeightByIsin.set(l.isin, (accountWeightByIsin.get(l.isin) ?? 0) + (l.amount / total) * 100);
      }
    }

    const lines = rows
      .map((c) => {
        const indexWeight = Number(((c.weight / indexTotal) * 100).toFixed(2));
        const accountWeight = Number((accountWeightByIsin.get(c.isin) ?? 0).toFixed(2));
        return {
          name: c.name,
          ticker: c.ticker,
          isin: c.isin,
          indexWeight,
          accountWeight,
          gap: Number((accountWeight - indexWeight).toFixed(2)),
        };
      })
      .sort((a, b) => b.gap - a.gap);

    const heldWeight = Number(lines.reduce((n, l) => n + (l.accountWeight > 0 ? l.indexWeight : 0), 0).toFixed(2));
    return { account, lines, heldWeight };
  }

  /** Répartition géographique, par pays d'émission — le pendant de la répartition sectorielle. */
  countries(query: string): readonly { readonly country: string; readonly flag: string; readonly weight: number; readonly count: number }[] {
    const rows = new Map<string, { flag: string; weight: number; count: number }>();
    for (const c of this.components(query)) {
      const key = c.country || 'Non déterminé';
      const cur = rows.get(key) ?? { flag: c.flag, weight: 0, count: 0 };
      rows.set(key, { flag: cur.flag, weight: cur.weight + c.weight, count: cur.count + 1 });
    }
    return [...rows.entries()]
      .map(([country, v]) => ({ country, flag: v.flag, weight: Number(v.weight.toFixed(2)), count: v.count }))
      .sort((a, b) => b.weight - a.weight);
  }

  /** Répartition sectorielle d'un indice, poids cumulés, du plus lourd au plus léger. */
  sectors(query: string): readonly { readonly sector: string; readonly weight: number; readonly count: number }[] {
    const rows = new Map<string, { weight: number; count: number }>();
    for (const c of this.components(query)) {
      const cur = rows.get(c.sector) ?? { weight: 0, count: 0 };
      rows.set(c.sector, { weight: cur.weight + c.weight, count: cur.count + 1 });
    }
    return [...rows.entries()]
      .map(([sector, v]) => ({ sector, weight: Number(v.weight.toFixed(2)), count: v.count }))
      .sort((a, b) => b.weight - a.weight);
  }

  // -- Interne ---------------------------------------------------------------------------------

  private resolve(query: string): IndexDef | null {
    const q = normalize(query);
    if (!q) return null;

    const exact = this.all().filter((i) => normalize(i.key) === q || normalize(i.name) === q);
    if (exact.length === 1) return exact[0];

    const starts = this.all().filter((i) => normalize(i.name).startsWith(q) || normalize(i.key).startsWith(q));
    if (starts.length === 1) return starts[0];

    const contains = this.all().filter((i) => normalize(i.name).includes(q) || normalize(i.key).includes(q));
    return contains.length === 1 ? contains[0] : null;
  }

  private compose(def: IndexDef): IndexComposition {
    /* Le MIC déclaré par l'indice prime sur la table embarquée : une composition chargée tient sa
       place de sa source, qui en sait plus que nous. */
    const mic = def.mic ?? INDEX_MIC[def.key] ?? '';
    /* Le registre ISO sert à attester le code, pas à nommer la place : son `marketName` est une
       raison sociale — « Euronext - Euronext Paris » — là où le référentiel des indices porte le
       nom d'usage, qui est celui qu'on veut lire. */
    const registry = mic ? micByCode(mic) : null;
    const place = def.place;

    const components = def.members.map((m) => {
      const prefix = m.isin.slice(0, 2).toUpperCase();
      const universe = this.universeIndex().get(m.isin);
      return {
        name: m.name,
        ticker: m.ticker,
        isin: m.isin,
        mic,
        place,
        currency: def.currency,
        countryCode: NON_COUNTRY_ISIN[prefix] ? '' : prefix,
        country: NON_COUNTRY_ISIN[prefix] ?? countryName(prefix),
        flag: NON_COUNTRY_ISIN[prefix] ? '' : countryFlag(prefix),
        /* Replis du côté liste : `IndexComponent` les veut fermes, et une valeur issue d'une
           composition les porte toujours. Ils ne servent que si un titre du catalogue passe par
           ici — auquel cas « non classé » et zéro disent la vérité, plutôt que de la taire. */
        sector: m.sector ?? 'Non classé',
        weight: m.weight ?? 0,
        marketCap: m.marketCap ?? '—',
        inUniverse: !!universe,
        /* `ref` porte l'avis du comité sur le titre au sein de l'indice ; `status` celui de notre
           univers. Un titre peut être retenu ici et pas là, d'où les deux lectures. */
        retained: m.ref === 'ok',
        heldAccounts: universe?.held ?? 0,
      };
    });

    const detailedWeight = components.reduce((s, c) => s + c.weight, 0);

    return {
      key: def.key,
      name: def.name,
      region: def.region,
      place,
      mic,
      micInRegistry: !!registry,
      currency: def.currency,
      detail: def.detail,
      declaredCount: def.count,
      detailedCount: components.length,
      detailedWeight: Number(detailedWeight.toFixed(2)),
      components,
    };
  }
}
