import { Injectable, InjectionToken, PLATFORM_ID, computed, inject, resource, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { isinValid } from './index-feed';
import { FOLLOWED, type SecurityElement } from './security-reference';

/**
 * Catalogue des titres — négociables et à suivre — récupéré à la demande.
 *
 * Il était importé statiquement : `SECURITIES` entrait dans le fascicule initial et se chargeait
 * pour tout visiteur, y compris celui qui ne verra jamais l'écran Titres. Ici rien ne part tant que
 * personne n'a demandé : `load()` déclenche la récupération, et une seule, quel que soit le nombre
 * d'appelants.
 *
 * ## Deux sources, dans cet ordre
 *
 * 1. **La source distante**, `SECURITY_FEED_URL`. Par défaut l'API du contrat, `/v1/securities` ;
 *    un fichier déposé par l'exploitant fait tout aussi bien l'affaire, les deux servent la même
 *    charge. C'est l'URL qui change, rien d'autre.
 * 2. **Le catalogue embarqué**, chargé par `import()` dynamique. C'est le repli, et c'est ce qui
 *    rend la paresse réelle : le module ne traverse pas le fascicule initial, il arrive en morceau
 *    séparé au premier `load()`.
 *
 * Une source muette ne fait pas échouer la récupération : on retombe sur l'embarqué et on le dit.
 * Un référentiel de titres indisponible — API arrêtée, fichier absent — ne doit pas empêcher de
 * consulter un portefeuille.
 *
 * ## Ce qu'il ne fait pas
 *
 * Il ne connaît ni décision du comité, ni suppression : c'est le catalogue, pas l'univers.
 * `SecurityUniverseStore` s'appuie dessus et applique par-dessus ce que le comité en a décidé.
 */

/**
 * Où lire le catalogue. Chaîne vide pour s'en tenir à l'embarqué — ce que fait un test, ou un
 * déploiement sans back-end.
 *
 * Le défaut vise l'API du contrat. `pageSize=200` parce que la lecture veut le référentiel entier
 * et non sa première page : ce service alimente un store, pas un tableau paginé.
 */
export const SECURITY_FEED_URL = new InjectionToken<string>('SECURITY_FEED_URL', {
  providedIn: 'root',
  factory: () => '/v1/securities?pageSize=200',
});

/** D'où vient ce qui est affiché — l'écran doit pouvoir le dire. */
export type CatalogOrigin = 'idle' | 'remote' | 'embedded';

/**
 * Ce qu'une mise en veille a produit.
 *
 * Deux issues et non un booléen : « le référentiel l'a enregistré » et « la session le retient en
 * attendant » ne sont pas le même fait, et l'écran doit pouvoir le dire à l'utilisateur. Taire la
 * seconde ferait croire à un enregistrement qui n'a pas eu lieu — c'est le genre de silence qui se
 * découvre au rechargement suivant, quand la veille a disparu.
 */
export type FollowOutcome =
  | { readonly kind: 'persisted' }
  | { readonly kind: 'local'; readonly reason: string };

/** Repli de session, avec ce qui l'a causé — l'écran en fait une phrase. */
const local = (reason: string): FollowOutcome => ({ kind: 'local', reason });

@Injectable({ providedIn: 'root' })
export class SecurityCatalogService {
  private readonly url = inject(SECURITY_FEED_URL);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /* Le déclencheur de la paresse. Tant qu'il est faux, `params` rend `undefined` et la ressource
     reste au repos : aucun `import()`, aucune requête. */
  private readonly asked = signal(false);

  /**
   * Compteur de révision du référentiel distant.
   *
   * Il est la dépendance commune des trois ressources : le catalogue et les deux listes le lisent
   * dans leur `params`, donc l'incrémenter les fait toutes repartir. C'est ce qui rend la chaîne
   * entièrement réactive — une écriture pousse un signal, et le tableau des suivis se refait de
   * lui-même, sans que personne ait à se souvenir de rappeler `reload()` sur la bonne ressource.
   *
   * Un `reload()` impératif par ressource ferait le même travail, mais il faudrait le placer à
   * chaque point d'écriture, et un oubli y serait invisible : le tableau resterait juste en
   * retard, ce qui ne ressemble pas à un défaut tant qu'on ne compare pas.
   */
  private readonly revision = signal(0);

  private readonly originState = signal<CatalogOrigin>('idle');
  private readonly warningState = signal('');

  /** D'où vient le catalogue chargé, et ce qui a cloché en chemin. */
  readonly origin = this.originState.asReadonly();
  readonly warning = this.warningState.asReadonly();

  private readonly catalog = resource<readonly SecurityElement[], unknown>({
    params: () => (this.asked() ? { revision: this.revision() } : undefined),
    loader: async () => {
      const remote = await this.fromSource();
      if (remote) {
        this.originState.set('remote');
        return remote;
      }
      /* `import()` et non un import de tête : c'est là que se joue la paresse. Le catalogue est
         découpé en morceau séparé, et il n'est téléchargé qu'ici. */
      const { SECURITIES } = await import('../pages/titres/titres-data');
      this.originState.set('embedded');
      return SECURITIES;
    },
  });

  /* ── Les deux listes de l'écran Titres ────────────────────────────────────────────────────
     Elles sont demandées au serveur plutôt que redécoupées ici, parce que la partition est une
     règle de référentiel et non un filtre d'affichage : « négociable » et « suivi » sont deux
     faits que le référentiel porte, et c'est à lui de dire lesquels le sont. Le front les
     redérivait de son côté à partir d'une liste `FOLLOWED` codée en dur — deux définitions d'une
     même règle finissent toujours par diverger.

     Chacune a sa propre ressource : les deux partent en parallèle, chacune rend compte de son
     chargement, et l'échec de l'une ne prive pas l'autre de ses lignes. */
  private readonly tradableRes = this.listResource('tradable=true&followed=false');
  private readonly watchRes = this.listResource('followed=true');

  /** Les titres. Vide tant que personne n'a appelé `load()`, et pendant la récupération. */
  readonly securities = computed<readonly SecurityElement[]>(() => this.catalog.value() ?? []);

  /**
   * Les titres que le référentiel autorise à l'achat, veille exclue.
   *
   * Tant que la liste n'a rien rendu — chargement en cours, ou API muette — la partition est
   * refaite sur le catalogue. L'écran ne se retrouve donc jamais vide parce qu'une seconde requête
   * n'a pas abouti, et il affiche la même chose que ce qu'il affichait avant que ces listes
   * n'existent.
   */
  readonly tradableList = computed<readonly SecurityElement[]>(
    () => this.tradableRes.value() ?? this.securities().filter((s) => !this.followedByReference(s)),
  );

  /** Les titres tenus en veille. Même repli que ci-dessus. */
  readonly watchList = computed<readonly SecurityElement[]>(
    () => this.watchRes.value() ?? this.securities().filter((s) => this.followedByReference(s)),
  );

  /** L'une ou l'autre des deux listes est-elle en cours de récupération ? */
  readonly listsLoading = computed(() => this.tradableRes.isLoading() || this.watchRes.isLoading());

  /** Ce qui a empêché une des deux listes d'aboutir, le cas échéant. */
  readonly listsError = computed(() => this.tradableRes.error() ?? this.watchRes.error());

  readonly loading = computed(() => this.catalog.isLoading());
  readonly ready = computed(() => this.catalog.status() === 'resolved');
  readonly error = computed(() => this.catalog.error());

  /** Phrase de provenance, telle qu'un écran l'afficherait. */
  readonly provenance = computed(() => {
    if (!this.asked()) return 'Catalogue non chargé';
    if (this.catalog.isLoading()) return 'Chargement du catalogue…';
    const n = this.securities().length;
    const source = this.originState() === 'remote' ? 'Référentiel distant' : 'Catalogue embarqué';
    return `${source} · ${n} titre${n > 1 ? 's' : ''}${this.warningState() ? ' · ' + this.warningState() : ''}`;
  });

  /**
   * Fabrique la ressource d'une liste servie par l'API.
   *
   * Rend `undefined` — et non un tableau vide — quand la source ne répond pas : c'est ce qui
   * permet aux dérivées ci-dessus de distinguer « le serveur dit qu'il n'y en a aucun » de
   * « le serveur n'a rien dit », et de retomber sur le catalogue dans le second cas seulement.
   */
  private listResource(query: string) {
    return resource<readonly SecurityElement[] | undefined, unknown>({
      params: () => (this.asked() ? { revision: this.revision() } : undefined),
      loader: async () => {
        if (!this.isBrowser || !this.url) return undefined;
        try {
          const res = await fetch(this.listUrl(query), { headers: { Accept: 'application/json' } });
          if (!res.ok) return undefined;
          const rows = parseSecurities(await res.json());
          return rows.list.length || rows.dropped ? rows.list : undefined;
        } catch {
          return undefined;
        }
      },
    });
  }

  /**
   * L'adresse d'une liste, dérivée de celle du catalogue.
   *
   * `SECURITY_FEED_URL` porte déjà sa propre chaîne de requête — `pageSize=200` — et il n'est pas
   * dit qu'elle en porte une : les deux cas sont traités plutôt qu'un seul, sans quoi pointer le
   * jeton sur un fichier déposé produirait des adresses invalides.
   */
  private listUrl(query: string): string {
    return this.url + (this.url.includes('?') ? '&' : '?') + query;
  }

  /** La veille telle que le référentiel la déclare, sans les mises en suivi de la session. */
  private followedByReference(security: SecurityElement): boolean {
    return security.followed ?? FOLLOWED.indexOf(security.ticker) >= 0;
  }

  /**
   * Demande le catalogue. Idempotent : le second appelant n'en déclenche pas un second
   * téléchargement, il rejoint celui qui est en cours.
   */
  load(): void {
    this.asked.set(true);
  }

  /**
   * Va rechercher le référentiel, dépôt compris.
   *
   * Par la révision plutôt que par `catalog.reload()` : les deux listes partent avec, alors
   * qu'auparavant seul le catalogue était relu et que la partition restait celle d'avant.
   */
  reload(): void {
    this.asked.set(true);
    this.revision.update((n) => n + 1);
  }

  /**
   * Signale que le référentiel distant a changé.
   *
   * Une écriture de signal, et les trois ressources repartent — le catalogue comme les deux
   * listes. Les trois ensemble, et non les deux listes seules : `securities()` alimente les
   * décomptes, les statuts de position et la fiche latérale. Rafraîchir la partition sans
   * rafraîchir le catalogue laisserait un titre passer d'une table à l'autre tout en gardant,
   * ailleurs sur le même écran, l'ancienne valeur de sa veille.
   */
  refresh(): void {
    if (!this.asked()) return;
    this.revision.update((n) => n + 1);
  }

  /**
   * Met un titre en veille, ou l'en retire, dans le référentiel.
   *
   * ## Pourquoi deux échanges et non un seul
   *
   * Le contrat exige un `If-Match` portant une version précise — « un référentiel se corrige à
   * partir de ce qu'on a lu, pas à l'aveugle ». Or la liste ne sert pas d'`ETag` par ligne : seul
   * le détail en porte un. La lecture préalable n'est donc pas une précaution ajoutée, c'est la
   * seule façon d'obtenir la version qu'on s'apprête à remplacer — et elle ferme la fenêtre entre
   * ce que l'écran affiche et ce que le serveur détient.
   *
   * ## Pourquoi un merge patch et non un `PUT`
   *
   * Un `PUT` renverrait la représentation entière, et écraserait au passage tout ce qu'un autre
   * poste aurait modifié entre-temps — notation, revue, commentaire du comité. Le patch ne touche
   * que `followed`, qui est le seul fait dont ce geste décide.
   *
   * ## Pourquoi un échec ne lève pas
   *
   * Un référentiel indisponible ne doit pas empêcher de travailler : l'appelant garde la mise en
   * veille pour la session et reçoit de quoi le dire. C'est la même règle que pour la lecture, où
   * une source muette fait retomber sur le catalogue embarqué plutôt qu'échouer.
   */
  async setFollowed(security: SecurityElement, followed: boolean): Promise<FollowOutcome> {
    if (!this.isBrowser || !this.url) return local('aucun référentiel distant');
    if (!security.id) return local('titre hors référentiel distant');

    const url = this.itemUrl(security.id);
    try {
      /* La version d'abord. Un titre servi par la liste n'en porte pas, et écrire sans elle
         reviendrait à écraser une modification qu'on n'a pas lue. */
      const read = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!read.ok) return local(`lecture refusée (${read.status})`);

      const etag = read.headers.get('ETag');
      if (!etag) return local('version du titre non servie');

      const written = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/merge-patch+json',
          'If-Match': etag,
          Accept: 'application/json',
        },
        body: JSON.stringify({ followed }),
      });

      /* 412 : quelqu'un a écrit entre la lecture et l'écriture. On ne réessaie pas en boucle — la
         reprise appartient à l'utilisateur, qui verra la liste rafraîchie et décidera. */
      if (!written.ok) return local(`écriture refusée (${written.status})`);

      /* Pas de relecture ici : l'appelant en écrit souvent plusieurs d'affilée, et rafraîchir à
         chaque titre ferait repartir trois requêtes par ligne. C'est à lui d'appeler `refresh()`
         quand sa fournée est passée. */
      return { kind: 'persisted' };
    } catch {
      return local('référentiel injoignable');
    }
  }

  /**
   * L'adresse d'un titre, dérivée de celle du catalogue.
   *
   * La chaîne de requête est retirée : `pageSize=200` n'a pas de sens sur un élément, et la
   * traîner produirait une URL que le contrat ne décrit pas.
   */
  private itemUrl(id: string): string {
    const base = this.url.split('?')[0].replace(/\/+$/, '');
    return `${base}/${encodeURIComponent(id)}`;
  }

  // -- Interne -----------------------------------------------------------------------------------

  /**
   * Lit la source distante si elle répond quelque chose d'exploitable, `null` sinon.
   *
   * Rien côté serveur : le prérendu n'a pas de base d'URL pour une adresse relative, et ce qu'il
   * calculerait serait recalculé à l'hydratation. Il rend l'embarqué, ce qui est la bonne réponse
   * pour une page servie avant toute interaction.
   */
  private async fromSource(): Promise<readonly SecurityElement[] | null> {
    if (!this.isBrowser || !this.url) return null;
    try {
      const res = await fetch(this.url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const rows = parseSecurities(await res.json());
      if (!rows.list.length) {
        this.warningState.set('source illisible, catalogue embarqué');
        return null;
      }
      this.warningState.set(rows.dropped ? `${rows.dropped} ligne(s) écartée(s)` : '');
      return rows.list;
    } catch {
      /* API arrêtée, fichier absent, serveur muet, JSON invalide : on ne distingue pas, la conduite
         est la même — revenir à l'embarqué sans faire échouer l'écran. */
      return null;
    }
  }
}

/**
 * Lecture d'un catalogue distant : tolérante ligne à ligne, stricte sur le fond.
 *
 * Une ligne sans ISIN valide ou sans ticker est écartée et comptée — un catalogue à moitié lu sans
 * que personne ne le sache est le pire des deux mondes. L'ISIN est vérifié jusqu'à sa clé de
 * contrôle par la même fonction que les compositions d'indices : un seul contrôle pour un seul
 * format de code.
 *
 * ## Deux vocabulaires pour une même ligne
 *
 * L'API du contrat ne nomme pas les choses tout à fait comme le modèle d'écran : elle dit `place`
 * là où il dit `market`, `tradable` là où il dit `status`, `reviewedBy` là où il dit `by`, et elle
 * date en ISO quand l'écran affiche en jj/mm/aaaa. Les deux orthographes sont acceptées ici plutôt
 * que traduites ailleurs : c'est le seul point du code qui lit une charge étrangère, et une
 * couche de traduction supplémentaire ne ferait que déplacer la correspondance sans la réduire.
 */
export function parseSecurities(payload: unknown): { readonly list: readonly SecurityElement[]; readonly dropped: number } {
  const rows = Array.isArray(payload) ? payload : (payload as { items?: unknown })?.items;
  if (!Array.isArray(rows)) return { list: [], dropped: 0 };

  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  /* Une date ISO redevient la date française qu'affiche l'écran ; tout autre format passe tel
     quel, l'écran n'ayant jamais fait que l'afficher. */
  const date = (v: unknown) => {
    const raw = text(v);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : raw;
  };
  const list: SecurityElement[] = [];
  let dropped = 0;

  /* L'API dit `tradable`, un fichier déposé dit `status`. Le booléen l'emporte quand il est là :
     c'est la forme du contrat, et la seule des deux qui ne puisse pas être mal orthographiée. */
  const referenceStatus = (r: Record<string, unknown>): 'ok' | 'none' => {
    if (typeof r['tradable'] === 'boolean') return r['tradable'] ? 'ok' : 'none';
    return text(r['status']) === 'ok' ? 'ok' : 'none';
  };

  /* La veille se lit, elle ne se devine pas — et son absence n'est pas un `false`. Un booléen
     absent laisse le champ absent, ce qui renvoie l'arbitrage à la liste `FOLLOWED` ; un `false`
     écrit ici prétendrait au contraire que le référentiel s'est prononcé. La distinction porte :
     c'est elle qui permet au catalogue embarqué et à l'API de cohabiter sans que le premier
     contredise la seconde. */
  const followedFlag = (r: Record<string, unknown>) =>
    typeof r['followed'] === 'boolean' ? { followed: r['followed'] } : {};

  for (const row of rows) {
    if (typeof row !== 'object' || row === null) { dropped++; continue; }
    const r = row as Record<string, unknown>;
    const ticker = text(r['ticker']).toUpperCase();
    const isin = text(r['isin']).toUpperCase();
    if (!ticker || !isinValid(isin)) { dropped++; continue; }
    list.push({
      /* L'identifiant n'est pas une donnée d'écran : il est l'adresse de la ressource, et sans lui
         aucune écriture n'est adressable. Le catalogue embarqué n'en porte pas, d'où l'omission
         pure et simple plutôt qu'une chaîne vide qui construirait des URL invalides. */
      ...(text(r['id']) ? { id: text(r['id']) } : {}),
      ...followedFlag(r),
      ticker,
      isin,
      name: text(r['name']) || ticker,
      market: text(r['market']) || text(r['place']) || '—',
      assetClass: text(r['assetClass']) || 'Action',
      rating: text(r['rating']) || '—',
      cap: num(r['cap']),
      /* Le statut du référentiel, pas une décision du comité : celles-ci vivent dans le store. */
      status: referenceStatus(r),
      liquidity: text(r['liquidity']) || 'Non renseignée',
      esg: text(r['esg']) || 'Non classé',
      domicile: text(r['domicile']) || '—',
      currency: (text(r['currency']) || 'EUR').toUpperCase(),
      complexity: text(r['complexity']) || 'Non complexe',
      held: num(r['held']),
      mandates: Array.isArray(r['mandates']) ? (r['mandates'] as unknown[]).map((m) => String(m)) : [],
      reviewed: date(r['reviewed']) || '—',
      by: text(r['by']) || text(r['reviewedBy']) || '—',
      note: text(r['note']),
    });
  }
  return { list, dropped };
}
