/**
 * Socle du référentiel des titres : le type d'un titre, les statuts de position, et les deux
 * tables qui rattachent un titre aux portefeuilles.
 *
 * Ces déclarations vivaient dans `pages/titres/titres-data.ts`, aux côtés du catalogue lui-même.
 * C'était tenable tant que seul l'écran Titres s'en servait ; ça ne l'est plus depuis que le menu
 * latéral affiche le nombre de titres référencés. `SecurityUniverseStore` en dépend, le menu
 * dépend du store, et le menu est dans le fascicule initial : l'import statique y tirait tout
 * `titres-data`, **catalogue compris**. L'`import()` dynamique de `SecurityCatalogService` ne
 * résolvait alors plus que vers un module déjà embarqué — la paresse était annulée sans que rien
 * ne le signale.
 *
 * Un module de domaine ne doit de toute façon rien devoir à un module de page. `titres-data`
 * réexporte ce qui suit, de sorte que l'écran continue de tout lire au même endroit.
 */

export type PositionStatusKey = 'held' | 'settled' | 'watch' | 'followed' | 'never';

export interface PositionStatusDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

/**
 * Un titre du référentiel — la structure unique, et la seule.
 *
 * ## Une seule structure, à plat
 *
 * Il y en a eu deux un moment : `SecurityElement` et un `SecurityElement` qui l'étendait. L'héritage
 * n'apportait rien qu'une indirection — tout consommateur d'un titre finissait par vouloir les
 * deux moitiés — et obligeait à choisir, à chaque signature, laquelle des deux on attendait.
 * Une seule déclaration supprime la question.
 *
 * ## Ce qui est facultatif, et pourquoi
 *
 * Quatre champs le sont, et jamais par oubli : ils décrivent ce qu'un titre ne peut pas savoir
 * de lui-même.
 *
 * `id` et `followed` dépendent du référentiel distant ; `sector`, `weight`, `marketCap` et `ref`
 * dépendent de la liste d'origine qui cite le titre. Un titre du catalogue n'a pas de poids dans
 * un indice — lui en inventer un à zéro serait affirmer quelque chose de faux plutôt que de
 * n'affirmer rien. Une valeur issue d'une composition, elle, les porte tous.
 *
 * ## `cap` et `marketCap` ne sont pas la même chose
 *
 * `cap` est le **plafond de concentration**, un pourcentage sur lequel on calcule. `marketCap` est
 * la **capitalisation boursière**, et c'est un libellé qu'on lit — « 312 Md€ ». Les deux portaient
 * le nom `cap` dans leurs structures d'origine ; il faut que la distinction tienne.
 */
export interface SecurityElement {
  /**
   * Identifiant stable du référentiel — `SEC-AAPL`. C'est l'adresse de la ressource, et donc la
   * seule chose qui permette d'écrire : sans lui, une mise en suivi ne peut être que locale.
   *
   * Facultatif pour la même raison que `followed` : le catalogue embarqué ne porte pas
   * d'identifiant, n'étant l'image d'aucune ressource. Un titre qui en est dépourvu reste
   * consultable et se met en suivi pour la session ; il ne se persiste pas.
   */
  readonly id?: string;
  readonly ticker: string;
  readonly name: string;
  readonly isin: string;
  readonly market: string;
  readonly assetClass: string;
  readonly rating: string;
  /** Plafond de concentration, en pourcentage de l'actif net par compte. Voir `marketCap`. */
  readonly cap: number;
  /** Statut dans NOTRE univers d'investissement. Voir `ref`, qui porte celui de la liste d'origine. */
  readonly status: 'ok' | 'none';
  readonly liquidity: string;
  readonly esg: string;
  readonly domicile: string;
  readonly currency: string;
  readonly complexity: string;
  /**
   * Le référentiel tient-il ce titre en veille plutôt qu'à l'achat ?
   *
   * Facultatif, et ce n'est pas un oubli : le catalogue embarqué ne porte pas ce champ, et son
   * absence renvoie alors à la liste `FOLLOWED`. L'API, elle, le sert toujours — et c'est elle qui
   * tranche dès qu'elle répond, faute de quoi un titre mis en veille côté serveur serait rendu par
   * la liste des suivis puis rejeté à l'affichage, l'écran jugeant encore sur la constante livrée.
   */
  readonly followed?: boolean;
  readonly held: number;
  readonly mandates: readonly string[];
  readonly reviewed: string;
  readonly by: string;
  readonly note: string;

  // -- Ce que la liste d'origine ajoute -----------------------------------------------------
  /** Secteur d'activité tel que la liste d'origine le classe. */
  readonly sector?: string;
  /** Poids dans la liste d'origine, en pourcentage — `7.9`, et non `0.079`. */
  readonly weight?: number;
  /** Capitalisation boursière, telle qu'on veut la lire. Libellé, pas montant calculable. */
  readonly marketCap?: string;
  /**
   * Avis du comité sur la valeur **au sein de cette liste**.
   *
   * Distinct de `status`, qui porte celui de notre univers : un titre peut être retenu dans un
   * indice et pas chez nous, et les deux lectures doivent rester lisibles séparément.
   */
  readonly ref?: 'ok' | 'none';
}


/**
 * Veille du catalogue embarqué — repli, et non référence.
 *
 * Le périmètre de la veille appartient au référentiel, qui le sert dans `followed`. Cette liste ne
 * vaut plus que pour le catalogue embarqué, qui ne porte pas le champ : elle répond à la question
 * quand personne d'autre ne peut, et se tait dès que l'API répond. Elle n'est donc pas à tenir à
 * jour au fil des mises en veille — ce sont les données du référentiel qui bougent, pas ce code.
 */
export const FOLLOWED: readonly string[] = ['INFRA', 'PRVE', 'SX5E', 'HYBND'];

export const POSITION_STATUS: Record<PositionStatusKey, PositionStatusDef> = {
  held: { label: 'En position', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)', hint: 'Détenu dans au moins un portefeuille' },
  settled: { label: 'Position soldée', bg: 'rgba(124,92,191,0.16)', fg: 'var(--ink-alt)', hint: "Plus détenu, présent dans l'historique des mouvements" },
  watch: { label: 'Retenu', bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)', hint: "Retenu dans l'univers, jamais négocié" },
  followed: { label: 'Suivi', bg: 'rgba(245,217,10,0.30)', fg: 'var(--ink-5c4700)', hint: "Sous surveillance : pas encore négociable, peut être retenu dans l'univers" },
  never: { label: 'Non retenu', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)', hint: "Hors univers d'investissement et jamais négocié" },
};

export const PORTFOLIO_LINKS: Record<string, { readonly held?: boolean; readonly history?: boolean }> = {
  AAPL: { held: true, history: true },
  ASML: { held: true, history: true },
  MSFT: { held: true, history: true },
  AI: { held: true, history: true },
  MC: { held: true, history: true },
  OR: { held: true, history: true },
  GLBEQ: { held: false, history: true },
  USLC: { held: false, history: true },
  TSY10: { held: false, history: true },
};
