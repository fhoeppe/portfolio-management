import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';

import { SecurityCatalogService } from './security-catalog.service';
import {
  FOLLOWED,
  PORTFOLIO_LINKS,
  POSITION_STATUS,
  type PositionStatusKey,
  type Security,
} from './security-reference';

/**
 * Univers d'investissement : les titres négociables et les titres suivis.
 *
 * Ces deux jeux n'avaient pas de propriétaire. Leur état — les décisions du comité, les titres
 * retirés — vivait dans la page Titres, qui le passait en `WritableSignal` à ses deux modales ;
 * leurs règles étaient réparties entre `titres-data`, `titres-filters` et l'écran lui-même.
 *
 * C'est un `signalStore` NgRx et non un service à signaux écrits à la main : la forme est la même
 * — de l'état, des dérivées, des méthodes — mais elle est déclarée au lieu d'être assemblée.
 * L'état n'est accessible qu'en lecture de l'extérieur, `patchState` est le seul point d'écriture —
 * y compris depuis l'extérieur, qui se le voit refuser au type —, et les dérivées ne peuvent pas
 * être branchées sur autre chose que l'état du store.
 *
 * ## Conventions suivies
 *
 * Interface d'état explicite, ordre `withState` → `withProps` → `withComputed` → `withMethods`,
 * `patchState` toujours avec décomposition, et des méthodes nommées par le geste métier —
 * `follow`, `retain`, `unretain` — plutôt qu'un `update` générique qui ne dirait pas ce qu'il fait.
 *
 * Un écart assumé : l'asynchrone ne passe pas par `rxMethod` mais par le `resource()` d'Angular,
 * dans `SecurityCatalogService`. `rxMethod` sert à déclencher un flux depuis un signal ; ici il
 * s'agit d'une lecture paresseuse, et `resource()` porte déjà `isLoading`/`error`/`reload` sans
 * qu'on ait à les tenir à la main. Le store republie ces trois états, de sorte qu'un consommateur
 * n'ait qu'un seul interlocuteur.
 *
 * ## La partition vient du serveur
 *
 * `tradable` et `watchlist` ne sont plus redécoupées ici : elles s'appuient sur deux listes que
 * l'API sert — `?tradable=true&followed=false` et `?followed=true`. « Négociable » et « suivi »
 * sont des faits que le référentiel porte, pas des filtres d'affichage, et le front en tenait sa
 * propre définition à partir d'une liste `FOLLOWED` codée en dur. Deux définitions d'une même
 * règle finissent toujours par diverger.
 *
 * Les décisions de la session — retenir, écarter, supprimer — restent appliquées par-dessus : le
 * serveur ne les connaît pas encore. Le jour où elles lui seront écrites, cette surcouche
 * disparaîtra et les deux listes seront servies telles quelles.
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
 * - **Suivis** : les titres qu'on regarde sans les négocier. Le périmètre vient du référentiel —
 *   qui le sert et l'enregistre — et non d'une décision : un titre suivi n'est pas un titre retenu, c'est un titre
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

/**
 * Ce qu'une mise en suivi a produit.
 *
 * `added` compte ce qui a changé d'état, `persisted` ce que le référentiel a accepté d'enregistrer.
 * Les confondre reviendrait à promettre à l'utilisateur une veille qui ne survivra pas au
 * rechargement ; `reason` porte de quoi le lui expliquer quand les deux nombres diffèrent.
 */
export interface FollowReport {
  readonly added: number;
  readonly persisted: number;
  readonly reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Règles, hors du store
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Elles sont ici en fonctions pures pour que le filtrage d'écran — qui n'est pas injectable et
//  reçoit les décisions en argument — les partage avec le store au lieu de les réécrire. Il les
//  réécrivait, et deux définitions d'une même règle finissent toujours par diverger.

/**
 * Le titre est-il tenu en veille plutôt qu'à l'achat ?
 *
 * `FOLLOWED` est le repli du catalogue embarqué ; `extra` ce que la séance a mis en suivi sans que
 * le référentiel ait pu l'enregistrer. Les deux s'additionnent. À préférer `isSecurityFollowed`
 * partout où l'on tient le titre : cette forme-ci ne voit que le mnémonique, donc jamais ce que le
 * serveur a répondu.
 */
export function isFollowed(ticker: string, extra: ReadonlySet<string> = EMPTY): boolean {
  return FOLLOWED.indexOf(ticker) >= 0 || extra.has(ticker);
}

/**
 * Même question, posée au titre plutôt qu'à son seul mnémonique.
 *
 * C'est la forme à préférer : elle interroge d'abord le champ que sert le référentiel, et ne
 * retombe sur la liste livrée que lorsqu'il est absent — c'est-à-dire sur le catalogue embarqué.
 * `isFollowed(ticker)` reste pour les appelants qui n'ont qu'un mnémonique en main.
 */
export function isSecurityFollowed(security: Security, extra: ReadonlySet<string> = EMPTY): boolean {
  const fromReference = security.followed ?? FOLLOWED.indexOf(security.ticker) >= 0;
  return fromReference || extra.has(security.ticker);
}

const EMPTY: ReadonlySet<string> = new Set();

/** Décision courante : celle du comité si elle existe, sinon celle du référentiel. */
export function decisionOf(decisions: ReadonlyMap<string, Decision>, security: Security): Decision {
  return decisions.get(security.ticker) ?? security.status;
}

/**
 * Statut de position, du plus engageant au moins engageant : détenu, soldé, suivi, retenu, jamais
 * négocié. L'ordre compte — un titre détenu ET suivi est d'abord détenu.
 */
export function positionStatusOf(
  decisions: ReadonlyMap<string, Decision>,
  security: Security,
  followed: ReadonlySet<string> = EMPTY,
): PositionStatusKey {
  const link = PORTFOLIO_LINKS[security.ticker];
  if (link?.held) return 'held';
  if (link?.history) return 'settled';
  if (isSecurityFollowed(security, followed)) return 'followed';
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
  /**
   * Mises en veille que le référentiel n'a pas pu enregistrer — API muette, ou titre issu du
   * catalogue embarqué, qui n'est l'image d'aucune ressource.
   *
   * Ce n'est plus le lieu normal de la veille, c'est son filet : le geste part d'abord ici pour
   * que le tableau bouge au clic, et le référentiel prend le relais quand il répond. Ce qui reste
   * dans ce tableau est exactement ce qui ne survivra pas au rechargement.
   */
  readonly followed: readonly string[];
}

const initialState: UniverseState = { decisions: {}, deleted: [], followed: [] };

export const SecurityUniverseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  /* Le catalogue n'est plus importé : il est demandé. Le store applique les décisions du comité
     par-dessus une liste qu'il ne détient pas — et qui reste vide tant que personne n'a appelé
     `load()`. Voir `SecurityCatalogService`. */
  withProps(() => ({ catalog: inject(SecurityCatalogService) })),

  withComputed(({ decisions, deleted, followed, catalog }) => {
    /* Reconstruits une fois par changement d'état, pas à chaque lecture : `positionStatusOf` est
       appelé une fois par titre et par décompte, et `titres-filters` attend une `Map`. */
    const decisionMap = computed<ReadonlyMap<string, Decision>>(() => new Map(Object.entries(decisions())));
    const deletedSet = computed<ReadonlySet<string>>(() => new Set(deleted()));
    /* Le périmètre de veille complet : le livré plus l'ajouté. C'est lui que traversent les règles,
       pour qu'un titre mis en suivi le soit partout du même coup. */
    const followedSet = computed<ReadonlySet<string>>(() => new Set(followed()));

    /* Le référentiel tel qu'il est aujourd'hui : sans les titres retirés. C'est lui que tout
       décompte interroge — les vignettes comptaient sur `SECURITIES` et restaient donc figées
       quand un titre était supprimé. */
    const live = computed(() => catalog.securities().filter((s) => !deletedSet().has(s.ticker)));

    /**
     * Ce que le comité autorise à l'achat. Les suivis en sont exclus : ils ont leur tableau.
     *
     * La liste servie par l'API fait foi — la partition est une règle de référentiel, pas un
     * filtre d'affichage. S'y ajoutent les titres que le comité a retenus depuis, et s'en
     * retirent ceux qu'il a écartés, supprimés ou mis en veille : ces décisions-là sont celles
     * de la session, le serveur ne les connaît pas encore.
     */
    const tradableList = computed(() => {
      const decisions = decisionMap();
      const veille = followedSet();
      const served = catalog.tradableList();
      const known = new Set(served.map((s) => s.ticker));
      const retained = catalog.securities().filter((s) => !known.has(s.ticker) && decisions.get(s.ticker) === 'ok');

      return [...served, ...retained]
        .filter((s) => !deletedSet().has(s.ticker))
        .filter((s) => !isSecurityFollowed(s, veille))
        .filter((s) => decisionOf(decisions, s) === 'ok');
    });

    /**
     * Combien de titres la carte des négociables va montrer.
     *
     * Un signal à part, et non une lecture de `counts()` : ce dernier reconstruit les cinq
     * décomptes de statut à chaque changement, alors qu'une pastille de menu ne veut qu'un
     * nombre. Ses lecteurs ne dépendent ainsi que de la longueur de la liste, et ne se
     * recalculent pas parce qu'un titre a changé de statut de position sans quitter la liste.
     *
     * Et c'est bien `tradableList` qu'il mesure, pas un second filtrage du catalogue : le menu,
     * la vignette et le tableau annoncent le même nombre parce qu'ils comptent le même objet.
     */
    const tradableCount = computed(() => tradableList().length);

    return {
      decisionMap,
      deletedSet,
      followedSet,
      live,
      tradableCount,

      /* `loading` et `error` sont republiés ici : le catalogue arrive de façon asynchrone, et un
         écran qui parle au store ne doit pas avoir à injecter aussi le service pour savoir si la
         liste est vide parce qu'elle charge ou parce qu'elle a échoué. */
      loading: computed(() => catalog.loading()),
      error: computed(() => catalog.error()),
      ready: computed(() => catalog.ready()),
      provenance: computed(() => catalog.provenance()),

      /* `listsLoading` et `listsError` valent pour les deux listes ci-dessous, et sont distincts
         de `loading`/`error`, qui portent sur le catalogue. Un écran peut ainsi dire « je charge
         les négociables » sans prétendre que tout le référentiel est en route. */
      listsLoading: computed(() => catalog.listsLoading()),
      listsError: computed(() => catalog.listsError()),

      tradable: tradableList,

      /* Le périmètre des suivis ne dépend ni des décisions ni des suppressions : un titre suivi
         l'est par nature, et le retirer des négociables ne le fait pas disparaître de la veille.
         Même construction que ci-dessus : la liste servie, plus ce que la session y a ajouté. */
      watchlist: computed(() => {
        const veille = followedSet();
        const served = catalog.watchList();
        const known = new Set(served.map((s) => s.ticker));
        const added = catalog.securities().filter((s) => !known.has(s.ticker) && veille.has(s.ticker));

        return [...served, ...added].filter((s) => isSecurityFollowed(s, veille));
      }),

      counts: computed<UniverseCounts>(() => {
        const map = decisionMap();
        const rows = live();
        const set = followedSet();
        const by = (k: PositionStatusKey) => rows.filter((s) => positionStatusOf(map, s, set) === k).length;
        return {
          held: by('held'),
          settled: by('settled'),
          watch: by('watch'),
          followed: by('followed'),
          never: by('never'),
          referenced: rows.length,
          /* La LONGUEUR DE LA LISTE, et non un second calcul.
             Ce décompte redérivait les négociables de son côté — à partir du catalogue, quand la
             liste part de ce que sert l'API. Deux définitions d'une même chose, et la garantie
             qu'un jour la vignette annoncerait un nombre que le tableau ne montrerait pas. */
          tradable: tradableCount(),
          deleted: deleted().length,
        };
      }),
    };
  }),

  withMethods((store) => ({
    // -- Lectures ------------------------------------------------------------------------------

    /** Le catalogue complet, tel qu'il a été récupéré — suppressions comprises. */
    all(): readonly Security[] {
      return store.catalog.securities();
    },

    find(ticker: string): Security | null {
      return store.catalog.securities().find((s) => s.ticker === ticker) ?? null;
    },

    /** Demande le catalogue. À appeler par le premier écran qui en a besoin. */
    load(): void {
      store.catalog.load();
    },

    statusOf(security: Security): PositionStatusKey {
      return positionStatusOf(store.decisionMap(), security, store.followedSet());
    },

    /** Libellé, couleurs et infobulle du statut — référentiel de présentation, pas une décision. */
    statusDef(security: Security) {
      return POSITION_STATUS[positionStatusOf(store.decisionMap(), security, store.followedSet())];
    },

    isFollowed(ticker: string): boolean {
      return isFollowed(ticker, store.followedSet());
    },

    /**
     * Le suivi vient-il du référentiel plutôt que de la session ?
     *
     * La question se pose au titre et non à son mnémonique : c'est le référentiel qui tranche dès
     * qu'il répond, et la constante `FOLLOWED` n'est plus qu'un repli pour le catalogue embarqué,
     * qui ne porte pas le champ. Interroger la constante seule revenait à ignorer le serveur.
     */
    isFollowedByReference(ticker: string): boolean {
      const security = store.catalog.securities().find((s) => s.ticker === ticker);
      return security ? isSecurityFollowed(security) : isFollowed(ticker);
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

    /**
     * Rend un ou plusieurs titres négociables.
     *
     * Symétrique de `follow`, et pour les mêmes raisons : un ticker inconnu du catalogue est refusé
     * plutôt qu'inscrit à vide, un titre déjà négociable ne compte pas, et le nombre rendu est celui
     * qui a effectivement changé d'état. L'écran de recherche verse ainsi une sélection entière
     * sans avoir à recompter derrière.
     *
     * Un titre en suivi peut être rendu négociable : c'est le geste qui le fait passer de la veille
     * à l'univers. Il reste alors dans les deux listes, le statut de position tranchant l'affichage.
     */
    retain(...tickers: readonly string[]): number {
      const decisions = store.decisionMap();
      const byTicker = new Map(store.catalog.securities().map((s) => [s.ticker, s]));
      /* Comparer à la décision EFFECTIVE, pas à la carte des décisions : un titre déjà `ok` par son
         statut de référentiel n'a pas de décision enregistrée, et se serait compté comme ajouté. */
      const add = [...new Set(tickers)]
        .map((t) => byTicker.get(t))
        .filter((s): s is Security => !!s && decisionOf(decisions, s) !== 'ok')
        .map((s) => s.ticker);
      if (!add.length) return 0;
      patchState(store, (s) => ({
        decisions: { ...s.decisions, ...Object.fromEntries(add.map((t) => [t, 'ok' as Decision])) },
      }));
      return add.length;
    },

    /**
     * Retire un ou plusieurs titres des négociables, sans les supprimer du catalogue.
     *
     * `remove()` retire le titre de la liste ; `unretain()` lui retire seulement l'autorisation
     * d'achat. Les deux sont distincts : le premier est un geste de référentiel, le second une
     * décision de comité, et on revient d'un `unretain` par un `retain`.
     */
    unretain(...tickers: readonly string[]): number {
      const decisions = store.decisionMap();
      const byTicker = new Map(store.catalog.securities().map((s) => [s.ticker, s]));
      const off = [...new Set(tickers)]
        .map((t) => byTicker.get(t))
        .filter((s): s is Security => !!s && decisionOf(decisions, s) === 'ok')
        .map((s) => s.ticker);
      if (!off.length) return 0;
      patchState(store, (s) => ({
        decisions: { ...s.decisions, ...Object.fromEntries(off.map((t) => [t, 'none' as Decision])) },
      }));
      return off.length;
    },

    /**
     * Retire un titre des négociables. Rend `false` si la règle s'y oppose, plutôt que de laisser
     * l'appelant deviner : c'est au domaine de refuser, pas à la vue de désactiver un bouton et
     * d'espérer que personne ne passe outre.
     */
    remove(ticker: string): boolean {
      if (!isDeletable(ticker)) return false;
      if (store.deletedSet().has(ticker)) return true;
      patchState(store, (s) => ({ deleted: [...s.deleted, ticker] }));
      return true;
    },

    /**
     * Met un ou plusieurs titres en suivi.
     *
     * ## Deux temps, et c'est voulu
     *
     * L'état de session est écrit **avant** l'appel au référentiel, puis la révision est poussée
     * quand la fournée est passée. Le tableau bouge donc au clic — `followedSet` est un signal
     * dont `watchlist` dérive — et se refait une seconde fois sur ce que le serveur a retenu. Un
     * geste qui n'afficherait son effet qu'au retour du réseau donnerait l'impression d'un bouton
     * mort ; un geste qui ne se relirait jamais laisserait croire à un enregistrement.
     *
     * ## Ce que le compte-rendu distingue
     *
     * `added` est ce qui a changé d'état, `persisted` ce que le référentiel a accepté. Les deux
     * diffèrent dès que l'API est muette ou que le titre vient du catalogue embarqué, qui n'a pas
     * d'identifiant et n'est donc l'image d'aucune ressource. L'écran doit pouvoir dire laquelle
     * des deux situations il vient de produire.
     *
     * Un titre déjà suivi — livré par le référentiel ou mis en suivi plus tôt — ne compte pas, et
     * un ticker inconnu du catalogue est refusé plutôt qu'inscrit à vide.
     */
    async follow(...tickers: readonly string[]): Promise<FollowReport> {
      const byTicker = new Map(store.catalog.securities().map((s) => [s.ticker, s]));
      const already = store.followedSet();
      const add = [...new Set(tickers)]
        .map((t) => byTicker.get(t))
        .filter((s): s is Security => !!s && !isSecurityFollowed(s, already));
      if (!add.length) return { added: 0, persisted: 0, reason: '' };

      patchState(store, (s) => ({ followed: [...s.followed, ...add.map((x) => x.ticker)] }));

      const outcomes = await Promise.all(add.map((s) => store.catalog.setFollowed(s, true)));
      const persisted = outcomes.filter((o) => o.kind === 'persisted').length;
      /* Une seule poussée de révision pour toute la fournée, et non une par titre : les trois
         ressources repartent ensemble, et le tableau se refait sur ce que le serveur retient. */
      if (persisted) store.catalog.refresh();
      const reasons = outcomes.flatMap((o) => (o.kind === 'local' ? [o.reason] : []));
      return { added: add.length, persisted, reason: reasons[0] ?? '' };
    },

    /**
     * Retire un titre du suivi.
     *
     * Le retrait porte là où la mise en veille a porté : sur le référentiel si c'est lui qui la
     * déclare, sur la session sinon. Un titre suivi côté serveur se dé-suit donc vraiment — il
     * suffit de le lui dire —, là où l'ancienne règle refusait tout net au motif qu'on ne pouvait
     * qu'empiler par-dessus une constante figée dans le code.
     *
     * Reste un cas où le refus demeure : un titre que seul le catalogue embarqué déclare en
     * veille. Il n'est l'image d'aucune ressource, rien ne peut l'enregistrer, et le retirer en
     * séance le ferait réapparaître au rechargement suivant — un retrait qui ne tient pas est
     * pire qu'un retrait refusé.
     */
    async unfollow(ticker: string): Promise<boolean> {
      const security = store.catalog.securities().find((s) => s.ticker === ticker);
      const inSession = store.followedSet().has(ticker);
      const byReference = security ? isSecurityFollowed(security) : isFollowed(ticker);

      if (!security) return false;
      if (!inSession && !byReference) return false;

      if (byReference) {
        const outcome = await store.catalog.setFollowed(security, false);
        if (outcome.kind !== 'persisted') return false;
      }

      if (inSession) {
        patchState(store, (s) => ({ followed: s.followed.filter((t) => t !== ticker) }));
      }
      if (byReference) store.catalog.refresh();
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
