import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import {
  FOLLOWED,
  PORTFOLIO_LINKS,
  POSITION_STATUS,
  SECURITIES,
  type PositionStatusKey,
  type Security,
} from '../pages/titres/titres-data';

/**
 * Univers d'investissement : les titres négociables et les titres suivis.
 *
 * Ces deux jeux n'avaient pas de propriétaire. Leur état — les décisions du comité, les titres
 * retirés — vivait dans la page Titres, qui le passait en `WritableSignal` à ses deux modales ;
 * leurs règles étaient réparties entre `titres-data`, `titres-filters` et l'écran lui-même.
 *
 * C'est un `signalStore` NgRx et non un service à signaux écrits à la main : la forme est la même
 * — de l'état, des dérivées, des méthodes — mais elle est déclarée au lieu d'être assemblée.
 * L'état n'est accessible qu'en lecture de l'extérieur, `patchState` est le seul point d'écriture,
 * et les dérivées ne peuvent pas être branchées sur autre chose que l'état du store.
 *
 * ## Ce que le store ne fait pas
 *
 * Il ignore l'affichage : ni couleur, ni libellé de colonne, ni tri. Le filtrage d'écran reste dans
 * `titres-filters`, qui est du tri de tableau, pas du domaine.
 *
 * Il n'emploie pas `withEntities` : la collection de titres est un référentiel figé, livré avec
 * l'application, sans création ni suppression d'entités. `withEntities` sert à tenir une collection
 * dont le store est la source ; ici l'état n'est fait que des décisions prises PAR-DESSUS une liste
 * qui, elle, ne bouge pas. Deux petites structures suffisent, et elles restent sérialisables.
 *
 * ## Les deux jeux, et ce qui les sépare
 *
 * - **Négociables** : les titres que le comité autorise à l'achat. Un titre en sort par une
 *   décision (`decide`) ou une suppression (`remove`).
 * - **Suivis** : les titres qu'on regarde sans les négocier. Le périmètre vient du référentiel
 *   (`FOLLOWED`) et non d'une décision : un titre suivi n'est pas un titre retenu, c'est un titre
 *   qu'on s'interdit d'acheter tout en le gardant sous les yeux.
 */

/** Ce que le comité a décidé d'un titre, quand il en a décidé quelque chose. */
export type Decision = 'ok' | 'none';

/** Décompte des titres par statut de position — ce dont vivent les vignettes de l'écran. */
export interface UniverseCounts {
  readonly held: number;
  readonly settled: number;
  readonly watch: number;
  readonly followed: number;
  readonly never: number;
  readonly referenced: number;
  readonly tradable: number;
  readonly deleted: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Règles, hors du store
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Elles sont ici en fonctions pures pour que le filtrage d'écran — qui n'est pas injectable et
//  reçoit les décisions en argument — les partage avec le store au lieu de les réécrire. Il les
//  réécrivait, et deux définitions d'une même règle finissent toujours par diverger.

/** Le titre est-il tenu en veille plutôt qu'à l'achat ? */
export function isFollowed(ticker: string): boolean {
  return FOLLOWED.indexOf(ticker) >= 0;
}

/** Décision courante : celle du comité si elle existe, sinon celle du référentiel. */
export function decisionOf(decisions: ReadonlyMap<string, Decision>, security: Security): Decision {
  return decisions.get(security.ticker) ?? security.status;
}

/**
 * Statut de position, du plus engageant au moins engageant : détenu, soldé, suivi, retenu, jamais
 * négocié. L'ordre compte — un titre détenu ET suivi est d'abord détenu.
 */
export function positionStatusOf(decisions: ReadonlyMap<string, Decision>, security: Security): PositionStatusKey {
  const link = PORTFOLIO_LINKS[security.ticker];
  if (link?.held) return 'held';
  if (link?.history) return 'settled';
  if (isFollowed(security.ticker)) return 'followed';
  return decisionOf(decisions, security) === 'ok' ? 'watch' : 'never';
}

/**
 * Un titre détenu ou passé en portefeuille ne se supprime pas : sa suppression laisserait des
 * positions et un historique sans titre de référence.
 */
export function isDeletable(ticker: string): boolean {
  const link = PORTFOLIO_LINKS[ticker];
  return !link?.held && !link?.history;
}

/** Pourquoi la suppression est refusée, en clair. Vide si elle est permise. */
export function deleteBlockedReason(ticker: string): string {
  const link = PORTFOLIO_LINKS[ticker];
  if (link?.held) return 'Suppression impossible : titre en position dans un portefeuille';
  if (link?.history) return "Suppression impossible : titre présent dans l'historique des portefeuilles";
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Store
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * L'état, en structures simples.
 *
 * `Record` et tableau plutôt que `Map` et `Set` : `patchState` remplace la valeur entière, et une
 * structure sérialisable se lit dans les outils de développement, se transporte et s'écrit dans un
 * test en une accolade. Les `Map`/`Set` sont reconstruits en dérivée, là où on en a l'usage.
 */
interface UniverseState {
  readonly decisions: Readonly<Record<string, Decision>>;
  readonly deleted: readonly string[];
}

const initialState: UniverseState = { decisions: {}, deleted: [] };

export const SecurityUniverseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ decisions, deleted }) => {
    /* Reconstruits une fois par changement d'état, pas à chaque lecture : `positionStatusOf` est
       appelé une fois par titre et par décompte, et `titres-filters` attend une `Map`. */
    const decisionMap = computed<ReadonlyMap<string, Decision>>(() => new Map(Object.entries(decisions())));
    const deletedSet = computed<ReadonlySet<string>>(() => new Set(deleted()));

    /* Le référentiel tel qu'il est aujourd'hui : sans les titres retirés. C'est lui que tout
       décompte interroge — les vignettes comptaient sur `SECURITIES` et restaient donc figées
       quand un titre était supprimé. */
    const live = computed(() => SECURITIES.filter((s) => !deletedSet().has(s.ticker)));

    return {
      decisionMap,
      deletedSet,
      live,

      /** Ce que le comité autorise à l'achat. Les suivis en sont exclus : ils ont leur tableau. */
      tradable: computed(() =>
        live()
          .filter((s) => !isFollowed(s.ticker))
          .filter((s) => decisionOf(decisionMap(), s) === 'ok'),
      ),

      /* Le périmètre des suivis ne dépend ni des décisions ni des suppressions : un titre suivi
         l'est par nature, et le retirer des négociables ne le fait pas disparaître de la veille. */
      watchlist: computed(() => SECURITIES.filter((s) => isFollowed(s.ticker))),

      counts: computed<UniverseCounts>(() => {
        const map = decisionMap();
        const rows = live();
        const by = (k: PositionStatusKey) => rows.filter((s) => positionStatusOf(map, s) === k).length;
        return {
          held: by('held'),
          settled: by('settled'),
          watch: by('watch'),
          followed: by('followed'),
          never: by('never'),
          referenced: rows.length,
          tradable: rows.filter((s) => !isFollowed(s.ticker) && decisionOf(map, s) === 'ok').length,
          deleted: deleted().length,
        };
      }),
    };
  }),

  withMethods((store) => ({
    // -- Lectures ------------------------------------------------------------------------------

    /** Le référentiel complet, tel qu'il est livré — suppressions comprises. */
    all(): readonly Security[] {
      return SECURITIES;
    },

    find(ticker: string): Security | null {
      return SECURITIES.find((s) => s.ticker === ticker) ?? null;
    },

    statusOf(security: Security): PositionStatusKey {
      return positionStatusOf(store.decisionMap(), security);
    },

    /** Libellé, couleurs et infobulle du statut — référentiel de présentation, pas une décision. */
    statusDef(security: Security) {
      return POSITION_STATUS[positionStatusOf(store.decisionMap(), security)];
    },

    isFollowed(ticker: string): boolean {
      return isFollowed(ticker);
    },

    isDeletable(ticker: string): boolean {
      return isDeletable(ticker);
    },

    deleteBlockedReason(ticker: string): string {
      return deleteBlockedReason(ticker);
    },

    // -- Écritures -----------------------------------------------------------------------------

    /** Tranche sur un titre. */
    decide(ticker: string, decision: Decision): void {
      patchState(store, (s) => ({ decisions: { ...s.decisions, [ticker]: decision } }));
    },

    /** Verse des titres à l'univers en une fois — ce que fait l'écran de recherche. */
    retain(tickers: Iterable<string>): number {
      const list = [...tickers];
      if (!list.length) return 0;
      patchState(store, (s) => ({
        decisions: { ...s.decisions, ...Object.fromEntries(list.map((t) => [t, 'ok' as Decision])) },
      }));
      return list.length;
    },

    /**
     * Retire un titre des négociables. Rend `false` si la règle s'y oppose, plutôt que de laisser
     * l'appelant deviner : c'est au domaine de refuser, pas à la vue de désactiver un bouton et
     * d'espérer que personne ne passe outre.
     */
    remove(ticker: string): boolean {
      if (!isDeletable(ticker)) return false;
      patchState(store, (s) => (s.deleted.includes(ticker) ? s : { deleted: [...s.deleted, ticker] }));
      return true;
    },

    /** Remet un titre supprimé à la liste. */
    restore(ticker: string): void {
      patchState(store, (s) => ({ deleted: s.deleted.filter((t) => t !== ticker) }));
    },

    /** Efface les décisions de la session ; les suppressions ne sont pas concernées. */
    resetDecisions(): void {
      patchState(store, { decisions: {} });
    },
  })),
);
