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

export interface Security {
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
  readonly cap: number;
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
