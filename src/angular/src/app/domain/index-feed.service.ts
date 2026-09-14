import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { SEED_INDICES, applyIndices, resetIndices } from './indices';
import { parseIndexFeed, type IndexFeedDto } from './index-feed';

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
 * ## Fichier ou API
 *
 * Les deux sources servent le même format (voir `index-feed.ts`), donc seule l'URL change. Par
 * défaut c'est le fichier `/data/indices.json`, servi tel quel par le serveur statique : l'exploitant
 * dépose l'extraction de son fournisseur d'indices, sans livraison applicative. Pointer
 * `INDEX_FEED_URL` sur `…/v1/market/indices` bascule sur l'API du contrat sans autre changement.
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
 *
 * Le défaut vise le fichier déposé plutôt que l'API : c'est la source qu'on peut mettre en place
 * sans back-end, et celle qui rend le dispositif vérifiable tout de suite.
 */
export const INDEX_FEED_URL = new InjectionToken<string>('INDEX_FEED_URL', {
  providedIn: 'root',
  factory: () => '/data/indices.json',
});

@Injectable({ providedIn: 'root' })
export class IndexFeedService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(INDEX_FEED_URL);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<IndexFeedStatus>('seed');
  private readonly detail = signal({ source: '', asOf: '', version: '', indexCount: 0, memberCount: 0 });
  private readonly issues = signal<readonly string[]>([]);
  private readonly failure = signal('');

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
        parts.push(`${d.indexCount} indice${d.indexCount > 1 ? 's' : ''} · ${d.memberCount} valeurs`);
        return parts.join(' · ');
      }
      case 'error':
        return `Référentiel embarqué — source indisponible (${this.failure()})`;
      default:
        return `Référentiel embarqué · ${SEED_INDICES.length} indices`;
    }
  });

  /**
   * Va chercher la composition et l'applique.
   *
   * Rien côté serveur : le prérendu n'a pas de base d'URL pour une adresse relative, et ce qu'il
   * calculerait serait de toute façon recalculé à l'hydratation. Il rend le socle, ce qui est la
   * bonne réponse pour une page servie avant toute interaction.
   */
  async load(): Promise<IndexFeedStatus> {
    if (!this.isBrowser || !this.url) return this.state();

    this.state.set('loading');
    this.failure.set('');

    try {
      const payload = await firstValueFrom(this.http.get<IndexFeedDto>(this.url));
      const parse = parseIndexFeed(payload, new Map(SEED_INDICES.map((i) => [i.key, i])));
      this.issues.set(parse.warnings);

      if (!parse.indices.length) {
        /* Une charge lisible mais vide n'est pas une panne de réseau : c'est une source qui n'a
           rien à dire. On le distingue, parce que le geste correctif n'est pas le même. */
        this.failure.set(parse.warnings[0] ?? 'charge vide');
        this.state.set('error');
        return 'error';
      }

      applyIndices(parse.indices);
      this.detail.set({
        source: parse.source,
        asOf: parse.asOf,
        version: parse.version,
        indexCount: parse.indices.length,
        memberCount: parse.memberCount,
      });
      this.state.set('loaded');
      return 'loaded';
    } catch (err: unknown) {
      this.failure.set(message(err));
      this.state.set('error');
      return 'error';
    }
  }

  /** Repasse au socle embarqué et oublie ce qui a été chargé. */
  reset(): void {
    resetIndices();
    this.issues.set([]);
    this.failure.set('');
    this.detail.set({ source: '', asOf: '', version: '', indexCount: 0, memberCount: 0 });
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
