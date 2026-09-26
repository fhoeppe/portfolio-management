import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { SEED_INDICES, applyIndexIdentities, applyIndices, resetIndices } from './indices';
import { parseIndexFeed, parseIndexSummaries, type IndexFeedDto, type IndexSummaryFeedDto } from './index-feed';

/**
 * Chargement des compositions d'indices depuis une source réelle.
 *
 * Le référentiel embarqué ne décrit qu'un échantillon de chaque indice, et ce n'est pas un défaut
 * qu'on corrige en tapant des lignes : une composition se révise chaque trimestre et n'a de valeur
 * que datée. Ce service va la chercher — un fichier déposé par l'exploitant, ou l'API du contrat —
 * et remplace ce que le socle disait.
 *
 * ## Ce qu'il ne fait pas
 *
 * Il ne bloque pas le démarrage. L'application sait déjà tout afficher avec son socle ; faire
 * attendre le premier rendu qu'un fichier réponde échangerait une donnée partielle contre un écran
 * blanc. Le chargement part en parallèle du bootstrap et la composition se corrige quand elle
 * arrive — les écrans lisent l'indice depuis des `computed`, ils se recalculent seuls.
 *
 * Il n'échoue pas non plus bruyamment. Fichier absent, serveur muet, charge illisible : l'état
 * passe à `error`, le socle reste en place, et l'écran continue de fonctionner. Une source de
 * référentiel indisponible ne doit pas empêcher de consulter un portefeuille.
 *
 * ## Deux temps
 *
 * Le chargement est en deux temps depuis que l'API sépare les deux questions :
 *
 * 1. **La liste** — `GET /v1/market/indices2` : quels indices existent, comment ils s'appellent, où
 *    ils cotent, combien de valeurs ils comptent. Sept kilo-octets, demandés à l'ouverture du
 *    sélecteur d'indices et non au démarrage : tant que personne ne cherche un indice, aucun
 *    écran n'a besoin de cette liste, et le socle embarqué suffit à nommer les vingt-huit connus.
 * 2. **Une composition**, à la demande — `GET /v1/market/indices/{clé}`, appelé par l'écran qui
 *    affiche l'indice, et une seule fois par clé et par session.
 *
 * Tout charger d'un coup coûtait 640 ko pour peupler un sélecteur de vingt-huit lignes, alors que
 * personne ne consulte vingt-huit compositions dans une session. La liste seule ne vide rien : un
 * indice déjà connu garde ses valeurs — celles du socle, ou celles d'une composition déjà reçue —
 * jusqu'à ce que la sienne arrive.
 *
 * ## API ou fichier
 *
 * Le fichier déposé, lui, porte tout : c'est le format complet (voir `index-feed.ts`), lu par la
 * même fonction que la composition unitaire. Il sert de repli quand l'API se tait.
 *
 * Pointer `INDEX_FEED_URL` sur `/data/indices.json` revient au fichier déposé sur le serveur
 * statique — l'exploitant y dépose l'extraction de son fournisseur d'indices, sans livraison
 * applicative ni back-end. Les deux restent interchangeables, et c'est vérifié : les compositions
 * servies par l'une et par l'autre sont les mêmes, au `mic` vide près, que le contrat décrit comme
 * absent et que la lecture traite déjà pareil.
 */

/** Provenance de la composition actuellement servie. */
export type IndexFeedStatus =
  /** Socle embarqué : rien n'a encore été chargé, ou le chargement est désactivé. */
  | 'seed'
  /** Requête en cours. */
  | 'loading'
  /** Composition chargée depuis la source. */
  | 'loaded'
  /** La source n'a rien donné d'exploitable ; le socle reste affiché. */
  | 'error';

/**
 * Où lire les compositions. Chaîne vide pour ne rien charger du tout — ce que fait un test, ou un
 * déploiement qui assume le socle.
 */
export const INDEX_FEED_URL = new InjectionToken<string>('INDEX_FEED_URL', {
  providedIn: 'root',
  factory: () => '/v1/market/indices2',
});

/**
 * Où lire la composition d'un seul indice : la clé est ajoutée à cette base.
 *
 * Le chargement se fait en deux temps — la liste au démarrage, la composition quand un écran
 * demande un indice. Tout charger d'un coup transportait 640 ko pour afficher un sélecteur de
 * vingt-huit lignes, alors que la liste seule en pèse 7,6 et qu'une composition en pèse quelques
 * dizaines. Personne ne regarde vingt-huit compositions dans une session.
 *
 * Chaîne vide pour n'en pas avoir : les compositions restent alors celles du socle ou celles que
 * la source de repli a livrées.
 */
export const INDEX_COMPOSITION_URL = new InjectionToken<string>('INDEX_COMPOSITION_URL', {
  providedIn: 'root',
  factory: () => '/v1/market/indices',
});

/**
 * Où lire les compositions quand la première source ne répond pas. Chaîne vide pour n'en pas avoir.
 *
 * Le fichier déposé sur le serveur statique tient ce rôle, et ce n'est pas un luxe : `npm start`
 * lance `ng serve` sans proxy, donc sans API, et la source principale y répond 502. Sans ce
 * repli, l'application retombait sur son socle embarqué — dix valeurs pour le CAC 40 au lieu de
 * quarante — et se présentait comme incomplète à qui la démarre simplement.
 *
 * L'ordre a son sens : l'API sait ne livrer que ce qu'on lui demande et date sa réponse, le
 * fichier ne demande aucun back-end. On prend la première qui répond, et le socle ne sert plus
 * que si les deux se taisent.
 */
export const INDEX_FEED_FALLBACK_URL = new InjectionToken<string>('INDEX_FEED_FALLBACK_URL', {
  providedIn: 'root',
  factory: () => '/data/indices.json',
});

@Injectable({ providedIn: 'root' })
export class IndexFeedService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(INDEX_FEED_URL);
  private readonly compositionUrl = inject(INDEX_COMPOSITION_URL);
  private readonly fallbackUrl = inject(INDEX_FEED_FALLBACK_URL);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<IndexFeedStatus>('seed');
  private readonly detail = signal({ source: '', asOf: '', version: '', indexCount: 0, memberCount: 0, compositions: 0, whole: false });
  private readonly issues = signal<readonly string[]>([]);
  private readonly failure = signal('');

  /* Une composition n'est demandée qu'une fois par session : la promesse en cours est gardée, et
     un second appelant s'y raccroche au lieu de relancer la même requête. Les échecs sont gardés
     aussi — retenter à chaque ouverture de panneau ne ferait qu'empiler les erreurs. */
  private readonly compositions = new Map<string, Promise<boolean>>();

  /* La liste n'est pas rechargée à chaque demande : le sélecteur qui l'affiche peut être ouvert et
     refermé dix fois de suite, l'onglet quitté et rouvert, la source n'a pas à être réinterrogée
     pour autant. Elle l'est en revanche quand la dernière réponse date — voir `ListMaxAge`. */
  private listing: Promise<IndexFeedStatus> | null = null;
  private listedAt = 0;

  readonly status = this.state.asReadonly();
  /** Ce que la source a livré : sa provenance déclarée, sa date d'arrêté, son volume. */
  readonly loaded = this.detail.asReadonly();
  /** Lignes écartées à la lecture — ISIN faux, doublon, poids illisible. */
  readonly warnings = this.issues.asReadonly();
  readonly error = this.failure.asReadonly();

  /**
   * Phrase de provenance, telle qu'un écran l'afficherait. Elle dit toujours d'où vient ce qu'on
   * regarde : une composition d'indice sans provenance ni date ne se vérifie pas.
   */
  readonly origin = computed(() => {
    const d = this.detail();
    switch (this.state()) {
      case 'loading':
        return 'Chargement de la composition…';
      case 'loaded': {
        const parts = [d.source || 'Source externe'];
        if (d.asOf) parts.push(`arrêté au ${frDate(d.asOf)}`);
        parts.push(`${d.indexCount} indice${d.indexCount > 1 ? 's' : ''}`);
        /* La liste seule ne porte aucune valeur : annoncer « 0 valeurs » ferait croire à une
           source vide, alors que les compositions arrivent à la demande. On dit donc ce qui est
           vraiment chargé — rien encore, ou ce que les indices consultés ont rapporté. */
        if (d.whole) parts.push(`${d.memberCount} valeurs`);
        else if (d.compositions) parts.push(`${d.compositions} composition${d.compositions > 1 ? 's' : ''} chargée${d.compositions > 1 ? 's' : ''} · ${d.memberCount} valeurs`);
        else parts.push('composition à la demande');
        return parts.join(' · ');
      }
      case 'error':
        return `Référentiel embarqué — source indisponible (${this.failure()})`;
      default:
        /* La liste n'est demandée qu'à l'ouverture du sélecteur, mais une composition peut être
           arrivée avant elle : annoncer « référentiel embarqué » tout court ferait alors passer
           pour du socle ce qui vient de la source. */
        return d.compositions
          ? `Référentiel embarqué · ${SEED_INDICES.length} indices · ${d.compositions} composition${d.compositions > 1 ? 's' : ''} chargée${d.compositions > 1 ? 's' : ''} · ${d.memberCount} valeurs`
          : `Référentiel embarqué · ${SEED_INDICES.length} indices`;
    }
  });

  /**
   * Va chercher la composition et l'applique.
   *
   * Rien côté serveur : le prérendu n'a pas de base d'URL pour une adresse relative, et ce qu'il
   * calculerait serait de toute façon recalculé à l'hydratation. Il rend le socle, ce qui est la
   * bonne réponse pour une page servie avant toute interaction.
   */
  /**
   * Âge au-delà duquel la liste est redemandée.
   *
   * Même durée que la fraîcheur annoncée par l'API sur `/market/indices2`, et ce n'est pas une
   * coïncidence : au-delà, l'appel repart ; en deçà, il serait de toute façon servi par le cache
   * du navigateur. Les deux réglages disent la même chose de part et d'autre du réseau.
   */
  static readonly ListMaxAge = 5 * 60_000;

  /**
   * Charge la liste des indices si elle manque ou si elle date.
   *
   * Appelée par ce qui donne envie de la voir : l'activation de l'onglet qui la contient, et
   * l'ouverture du sélecteur qui l'affiche. Aucune des deux n'a à savoir si l'autre est déjà
   * passée — une liste fraîche rend la promesse précédente sans rien redemander.
   *
   * @param maxAge Âge maximal accepté, en millisecondes. Zéro force le rechargement.
   */
  load(maxAge: number = IndexFeedService.ListMaxAge): Promise<IndexFeedStatus> {
    /* Un chargement en cours n'est jamais doublé, quel que soit l'âge demandé : deux requêtes
       concurrentes sur la même liste ne peuvent que se contredire. */
    const running = this.listing !== null && this.state() === 'loading';
    const fresh = this.listedAt > 0 && Date.now() - this.listedAt < maxAge;

    if (!running && !fresh) this.listing = this.runLoad();
    return this.listing ?? Promise.resolve(this.state());
  }

  /** Âge de la liste en millisecondes ; `null` si rien n'a encore été chargé. */
  listAge(): number | null {
    return this.listedAt ? Date.now() - this.listedAt : null;
  }

  private async runLoad(): Promise<IndexFeedStatus> {
    const sources = [this.url, this.fallbackUrl].filter((u) => !!u);
    if (!this.isBrowser || !sources.length) return this.state();

    this.state.set('loading');
    this.failure.set('');

    /* Deux sources, deux formes, et l'ordre a son sens. La liste abrégée de l'API répond en
       quelques kilo-octets et suffit à nommer les indices ; le fichier déposé, lui, porte tout —
       compositions comprises — et sert de repli quand l'API se tait, ce qui est le cas d'un
       `ng serve` sans proxy. Le motif d'échec retenu est celui de la DERNIÈRE tentative : c'est la
       seule que l'exploitant puisse corriger une fois la chaîne épuisée. */
    if (this.url) {
      const issue = await this.trySummaries(this.url);
      if (!issue) return 'loaded';
      this.failure.set(issue);
    }

    if (this.fallbackUrl) {
      const issue = await this.tryLoad(this.fallbackUrl);
      if (!issue) return 'loaded';
      this.failure.set(issue);
    }

    this.state.set('error');
    return 'error';
  }

  /**
   * Va chercher la composition d'un seul indice et l'applique.
   *
   * Appelée par l'écran qui affiche un indice, au moment où il l'affiche. Le résultat dit si la
   * composition a été remplacée ; un échec laisse en place ce qu'on avait — socle ou composition
   * précédente — sans faire basculer l'état global, puisque la liste, elle, est bien chargée.
   */
  async loadIndex(key: string): Promise<boolean> {
    if (!this.isBrowser || !this.compositionUrl || !key) return false;

    /* Rien à demander quand la source de repli a livré le format complet : les compositions sont
       déjà toutes là. Sans ce test, l'écran lançait une requête par indice consulté vers une API
       dont on vient d'établir qu'elle ne répond pas, et consignait un avertissement par échec. */
    if (this.detail().whole) return true;

    const pending = this.compositions.get(key);
    if (pending) return pending;

    const run = this.fetchComposition(key);
    this.compositions.set(key, run);
    return run;
  }

  /** Une composition est-elle déjà chargée (ou en cours) pour cette clé ? */
  hasComposition(key: string): boolean {
    return this.compositions.has(key);
  }

  /**
   * Lit la liste abrégée : les indices, sans leur composition.
   *
   * Rend la chaîne vide en cas de succès, le motif d'échec sinon — même convention que
   * <see cref="tryLoad"/>.
   */
  private async trySummaries(url: string): Promise<string> {
    try {
      const payload = await firstValueFrom(this.http.get<IndexSummaryFeedDto>(url));
      const parse = parseIndexSummaries(payload, new Map(SEED_INDICES.map((i) => [i.key, i])));

      if (!parse.identities.length) return parse.warnings[0] ?? 'charge vide';

      this.issues.set(parse.warnings);
      this.listedAt = Date.now();
      applyIndexIdentities(parse.identities);
      this.detail.set({
        source: parse.source,
        asOf: parse.asOf,
        version: parse.version,
        indexCount: parse.identities.length,
        memberCount: 0,
        compositions: 0,
        whole: false,
      });
      this.state.set('loaded');
      return '';
    } catch (err: unknown) {
      return message(err);
    }
  }

  /** Va chercher une composition, la lit et l'applique. */
  private async fetchComposition(key: string): Promise<boolean> {
    const url = `${this.compositionUrl.replace(/\/$/, '')}/${encodeURIComponent(key)}`;

    try {
      const payload = await firstValueFrom(this.http.get<unknown>(url));
      /* La même lecture que la collection, sur une enveloppe d'un seul indice : un second chemin
         de lecture aurait fini par remplir les titres autrement, et l'écart ne se serait vu qu'au
         moment de verser une valeur dans l'univers. */
      const parse = parseIndexFeed({ indices: [payload] }, new Map(SEED_INDICES.map((i) => [i.key, i])));

      if (!parse.indices.length) {
        this.issues.update((w) => [...w, ...parse.warnings]);
        return false;
      }

      applyIndices(parse.indices);
      this.issues.update((w) => [...w, ...parse.warnings]);
      this.detail.update((d) => ({
        ...d,
        memberCount: d.memberCount + parse.memberCount,
        compositions: d.compositions + 1,
      }));
      return true;
    } catch (err: unknown) {
      /* L'état global ne bascule pas : la liste est chargée, c'est une composition qui manque. La
         promesse reste en cache, échec compris — retenter à chaque ouverture de panneau
         n'empilerait que des erreurs identiques. */
      this.issues.update((w) => [...w, `« ${key} » : composition indisponible (${message(err)}).`]);
      return false;
    }
  }

  /**
   * Essaie une source. Rend la chaîne vide en cas de succès, le motif d'échec sinon.
   */
  private async tryLoad(url: string): Promise<string> {
    try {
      const payload = await firstValueFrom(this.http.get<IndexFeedDto>(url));
      const parse = parseIndexFeed(payload, new Map(SEED_INDICES.map((i) => [i.key, i])));

      if (!parse.indices.length) {
        /* Une charge lisible mais vide n'est pas une panne de réseau : c'est une source qui n'a
           rien à dire. On le distingue, parce que le geste correctif n'est pas le même. */
        return parse.warnings[0] ?? 'charge vide';
      }

      this.issues.set(parse.warnings);
      this.listedAt = Date.now();
      applyIndices(parse.indices);
      this.detail.set({
        source: parse.source,
        asOf: parse.asOf,
        version: parse.version,
        indexCount: parse.indices.length,
        memberCount: parse.memberCount,
        compositions: parse.indices.length,
        whole: true,
      });
      this.state.set('loaded');
      return '';
    } catch (err: unknown) {
      return message(err);
    }
  }

  /** Repasse au socle embarqué et oublie ce qui a été chargé. */
  reset(): void {
    this.listing = null;
    this.listedAt = 0;
    resetIndices();
    this.issues.set([]);
    this.failure.set('');
    this.detail.set({ source: '', asOf: '', version: '', indexCount: 0, memberCount: 0, compositions: 0, whole: false });
    this.compositions.clear();
    this.state.set('seed');
  }
}

function frDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function message(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: number }).status;
    /* `0` n'est pas un code HTTP : c'est ce que rend le navigateur quand la requête n'a jamais
       abouti — hors ligne, DNS, CORS. Le dire autrement enverrait chercher un bug côté serveur. */
    return status === 0 ? 'source injoignable' : `HTTP ${status}`;
  }
  return err instanceof Error ? err.message : 'erreur inconnue';
}
