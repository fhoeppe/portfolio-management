import type { WritableSignal } from '@angular/core';


import {
  ACCOUNT_OPEN,
  CONSENSUS,
  CONSENSUS_VIEWS,
  DIV_FREQ,
  FUNDAMENTALS,
  IG_GRADES,
  IndexDef,
  IndexMember,
  MANDATES,
  MARKET_INFO,
  POSITION_STATUS,
  PORTFOLIO_LINKS,
  PositionStatusDef,
  PositionStatusKey,
  RATING_ORDER,
  RATING_SCALE,
  REGIONS,
  SECTORS,
  STATUS,
  Security,
  INDICES,
  toneByColor,
} from './titres-data';
import {
  deleteBlockedReason,
  isDeletable,
  isSecurityFollowed,
  positionStatusOf,
  type UniverseCounts,
} from '../../domain/security-universe.store';

export interface MultiOption {
  readonly key: string;
  readonly label: string;
  readonly count?: number;
  readonly badgeBg?: string;
  readonly badgeFg?: string;
  readonly dotColor?: string;
  readonly disabled?: boolean;
  readonly hint?: string;
}

const hit = (val: string | undefined, q: string | undefined): boolean => !q || String(val || '').toLowerCase().indexOf(q.toLowerCase()) >= 0;

/** Comptes ouverts, hors comptes en projet/gel/clôture — seuls sélectionnables dans le filtre Compte. */
export const OPEN_ACCOUNTS: readonly string[] = MANDATES.filter((m) => m.value !== 'all' && ACCOUNT_OPEN[m.value]).map((m) => m.value);

/**
 * Les comptes retenus par le filtre — vide quand rien n'est sélectionné.
 *
 * Vide et non « les comptes ouverts » : ne rien choisir n'est pas choisir les trois, c'est ne pas
 * poser la question. La valeur par défaut retenait les trois comptes ouverts, et le tableau
 * écartait alors sans le dire les titres rattachés à aucun d'eux — un titre jamais négocié, ou
 * rattaché à un compte gelé. La vignette annonçait onze négociables, le tableau en montrait neuf,
 * et le sélecteur affichait « Tous les comptes ».
 *
 * Choisir explicitement les trois comptes ouverts reste possible et reste un filtre : c'est
 * « éligible à l'un de ces trois-là », une autre question que « sans restriction ».
 */
export function pickedAccountKeys(acctPick: ReadonlySet<string> | null): readonly string[] {
  return acctPick === null ? [] : Array.from(acctPick);
}

export function statusOf(decisions: ReadonlyMap<string, 'ok' | 'none'>, s: Security): 'ok' | 'none' {
  return decisions.get(s.ticker) ?? s.status;
}

/* Les règles de l'univers viennent de `SecurityUniverseStore` : ce module les réécrivait, et deux
   définitions d'une même règle divergent tôt ou tard. Il ne garde que la mise en forme du tableau. */
export function posStatusOf(
  decisions: ReadonlyMap<string, 'ok' | 'none'>,
  s: Security,
  followed: ReadonlySet<string>,
): PositionStatusKey {
  return positionStatusOf(decisions, s, followed);
}

export interface SearchState {
  q: string;
  cls: string;
  currency: string;
  liquidity: string;
  rating: string;
  esg: string;
  consensus: string;
  divFreq: string;
  eps: string;
  sector: string;
  place: string;
}

/**
 * Jeu de critères neutre : aucun filtre actif, la liste complète des titres référencés est rendue.
 *
 * Il portait `rating: 'A−'`, et rien ne le signalait. Conséquence : « Réinitialiser les critères »
 * ne réinitialisait pas, il **reposait** une notation minimale — l'utilisateur qui avait élargi à
 * « Sans minimum » voyait le filtre revenir et le compte retomber de quinze à cinq titres. Un
 * bouton qui remet un critère au lieu de l'enlever n'a pas l'air de fonctionner, et c'est exact :
 * il ne fait pas ce que son intitulé promet.
 *
 * Le même défaut valait au premier affichage, où dix des quinze titres étaient masqués par un
 * critère que seul un petit « 1 critère(s) actif(s) » trahissait.
 */
export function blankSearch(): SearchState {
  return { q: '', cls: 'all', currency: 'all', liquidity: 'all', rating: 'all', esg: 'all', consensus: 'all', divFreq: 'all', eps: '', sector: 'all', place: 'all' };
}

/**
 * Critères tels que l'écran s'ouvre : ceux de `blankSearch()`, plus la notation minimale `A−` que
 * le prototype posait d'entrée.
 *
 * Ce défaut est conservé — c'est celui de la source —, mais il est désormais distinct de la
 * réinitialisation. Les deux étaient confondus, si bien que « Réinitialiser les critères »
 * reposait ce filtre au lieu de l'enlever.
 */
export function defaultSearch(): SearchState {
  return { ...blankSearch(), rating: 'A−' };
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

export interface KpiCard {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly color: string;
  readonly bg: string;
  readonly labelColor: string;
}

/** Mise en forme des décomptes rendus par `SecurityUniverseStore` — le comptage, lui, est à lui. */
export function computeKpis(c: UniverseCounts): readonly KpiCard[] {
  return [
    { label: 'En position', value: String(c.held), note: 'Détenus dans au moins un portefeuille', color: 'var(--ink-ok-2)' },
    { label: 'Positions soldées', value: String(c.settled), note: "Présents dans l'historique des mouvements", color: 'var(--color-text)' },
    { label: 'Retenus', value: String(c.watch), note: "Retenus dans l'univers, jamais négociés", color: 'var(--color-text)' },
    /* La quatrième vignette compte les négociables, pas le référentiel entier : c'est la liste que
       la carte du dessous montre, et une vignette qui annonce un autre nombre que le tableau
       qu'elle surplombe se lit comme une erreur. Le total du référentiel reste dit ailleurs —
       sous-titre de l'écran, badge du menu, et la note « n / m » du tableau. */
    { label: 'Négociables', value: String(c.tradable), note: "Autorisés à l'achat, veille exclue", color: 'var(--color-text)' },
  ].map((k) => toneByColor(k));
}

// ---------------------------------------------------------------------------
// Tableau « Titres négociables » / « Titres suivis » — même forme de ligne
// ---------------------------------------------------------------------------

export interface UniRow {
  readonly ticker: string;
  readonly name: string;
  readonly isin: string;
  readonly symbol: string;
  readonly market: string;
  readonly currency: string;
  readonly posKey: PositionStatusKey;
  readonly status: string;
  readonly statusHint: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly dotColor: string;
  readonly lockDelete: boolean;
  readonly deleteTitle: string;
}

function toUniRow(decisions: ReadonlyMap<string, 'ok' | 'none'>, s: Security, followed: ReadonlySet<string>): UniRow {
  const mi = MARKET_INFO[s.ticker];
  const ps = posStatusOf(decisions, s, followed);
  const def = POSITION_STATUS[ps];
  return {
    ticker: s.ticker,
    name: s.name,
    isin: s.isin,
    symbol: mi?.symbol || s.ticker,
    market: mi?.place || s.market,
    currency: s.currency,
    posKey: ps,
    status: def.label,
    statusHint: def.hint,
    tagBg: def.bg,
    tagFg: def.fg,
    dotColor: ps === 'followed' ? '#a37a00' : def.fg,
    lockDelete: !isDeletable(s.ticker),
    deleteTitle: deleteBlockedReason(s.ticker) || 'Supprimer ce titre négociable',
  };
}

/**
 * Quelle moitié de l'univers le tableau montre.
 *
 * Les deux cartes de l'écran sont complémentaires : `tradable` retient ce que le comité autorise,
 * `followed` ce qu'on garde sous les yeux sans l'acheter. C'est la seule chose qui distingue leur
 * calcul de lignes — d'où ce critère plutôt que deux fonctions qui divergeraient.
 */
export type UniScope = 'tradable' | 'followed';

export interface UniFilterInput {
  readonly scope: UniScope;
  readonly securities: readonly Security[];
  readonly decisions: ReadonlyMap<string, 'ok' | 'none'>;
  /**
   * Les titres mis en veille pendant la session, en plus de ceux que le référentiel livre.
   *
   * Il est passé explicitement, et n'a pas de valeur par défaut : c'est précisément parce qu'il
   * en avait une — l'ensemble vide — qu'une mise en suivi restait invisible dans les tableaux
   * alors que les décomptes du store, eux, la voyaient. Un défaut silencieux tant que rien
   * n'appelait `follow()`.
   */
  readonly followed: ReadonlySet<string>;
  readonly deleted: ReadonlySet<string>;
  readonly query: string;
  readonly filter: 'all' | 'ok';
  readonly acctKeys: readonly string[];
  readonly colIsin: string;
  readonly colName: string;
  readonly tickKeys: ReadonlySet<string>;
  readonly placeKeys: ReadonlySet<string>;
  readonly curKeys: ReadonlySet<string>;
  readonly statKeys: ReadonlySet<string>;
}

export function computeUniRows(f: UniFilterInput): readonly UniRow[] {
  const q = f.query.trim().toLowerCase();
  /**
   * La partition des deux tableaux se fait sur le FAIT de veille, pas sur le statut de position.
   *
   * `posStatusOf` est un statut d'affichage à préséance — détenu, soldé, suivi, retenu, jamais
   * négocié — et « détenu » l'emporte sur « suivi ». Un titre à la fois détenu et mis en veille
   * rendait donc `'held'`, `veille(s)` valait faux, et il disparaissait du tableau des suivis
   * alors que le store et l'API l'y mettaient tous les deux. Le badge garde sa préséance, la
   * partition non : ce sont deux questions différentes.
   */
  const veille = (s: Security) => isSecurityFollowed(s, f.followed);

  return f.securities.filter((s) => !f.deleted.has(s.ticker))
    .filter((s) => (f.scope === 'followed' ? veille(s) : !veille(s)))
    .filter((s) => {
      const mi = MARKET_INFO[s.ticker];
      if (!hit(s.isin, f.colIsin)) return false;
      if (f.tickKeys.size && !f.tickKeys.has(mi?.symbol || s.ticker)) return false;
      if (!hit(s.name, f.colName)) return false;
      if (f.placeKeys.size && !f.placeKeys.has(mi?.place || s.market)) return false;
      if (f.curKeys.size && !f.curKeys.has(s.currency)) return false;
      return true;
    })
    .filter((s) => !f.statKeys.size || f.statKeys.has(POSITION_STATUS[posStatusOf(f.decisions, s, f.followed)].label))
    /* Un titre écarté par le comité sort des négociables — mais pas de la veille : on regarde
       précisément ce qu'on n'achète pas. */
    .filter((s) => f.scope === 'followed' || statusOf(f.decisions, s) !== 'none')
    .filter((s) => {
      if (f.filter !== 'all' && statusOf(f.decisions, s) !== f.filter) return false;
      if (f.acctKeys.length && !f.acctKeys.some((k) => s.mandates.indexOf(k) >= 0)) return false;
      if (!q) return true;
      return (s.ticker + ' ' + s.name + ' ' + s.isin + ' ' + s.assetClass).toLowerCase().indexOf(q) >= 0;
    })
    .map((s) => toUniRow(f.decisions, s, f.followed));
}

const UNI_SORT_GET: Record<string, (r: UniRow) => string> = {
  isin: (r) => r.isin,
  ticker: (r) => r.symbol,
  name: (r) => r.name,
  place: (r) => r.market,
  currency: (r) => r.currency,
  status: (r) => r.status,
};

export function sortUniRows(rows: readonly UniRow[], key: string | null, dir: 'asc' | 'desc'): readonly UniRow[] {
  const get = key ? UNI_SORT_GET[key] : null;
  if (!get) return rows;
  const d = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => get(a).localeCompare(get(b), 'fr') * d);
}

export interface UniRowGroup {
  readonly hasHeader: boolean;
  readonly label: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly count: string;
  readonly rows: readonly UniRow[];
}

const GROUP_ORDER: readonly PositionStatusKey[] = ['held', 'settled', 'watch', 'never'];

export function groupUniRows(rows: readonly UniRow[], grouped: boolean): readonly UniRowGroup[] {
  if (!grouped) return [{ hasHeader: false, label: '', tagBg: '', tagFg: '', count: '', rows }];
  return GROUP_ORDER.map((k) => {
    const def = POSITION_STATUS[k];
    const grows = rows.filter((r) => r.posKey === k).slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return { hasHeader: true, label: def.label, tagBg: def.bg, tagFg: def.fg, count: grows.length + (grows.length > 1 ? ' titres' : ' titre'), rows: grows };
  }).filter((g) => g.rows.length > 0);
}

export const STATUS_LABELS: readonly string[] = ['En position', 'Retenu', 'Position soldée', 'Non retenu'];
const STATUS_LABEL_KEY: Record<string, PositionStatusKey> = { 'En position': 'held', Retenu: 'watch', 'Position soldée': 'settled', 'Non retenu': 'never' };

export function buildTickerOptions(securities: readonly Security[], deleted: ReadonlySet<string>): readonly MultiOption[] {
  const alive = securities.filter((x) => !deleted.has(x.ticker));
  const values = Array.from(new Set(alive.map((x) => MARKET_INFO[x.ticker]?.symbol || x.ticker))).sort((a, b) => a.localeCompare(b, 'fr'));
  return values.map((v) => ({ key: v, label: v, count: alive.filter((x) => (MARKET_INFO[x.ticker]?.symbol || x.ticker) === v).length }));
}

export function buildPlaceOptions(securities: readonly Security[], deleted: ReadonlySet<string>): readonly MultiOption[] {
  const alive = securities.filter((x) => !deleted.has(x.ticker));
  const values = Array.from(new Set(alive.map((x) => MARKET_INFO[x.ticker]?.place || x.market))).sort((a, b) => a.localeCompare(b, 'fr'));
  return values.map((v) => ({ key: v, label: v, count: alive.filter((x) => (MARKET_INFO[x.ticker]?.place || x.market) === v).length }));
}

export function buildCurrencyOptions(securities: readonly Security[], deleted: ReadonlySet<string>): readonly MultiOption[] {
  const alive = securities.filter((x) => !deleted.has(x.ticker));
  const values = Array.from(new Set(alive.map((x) => x.currency))).sort((a, b) => a.localeCompare(b, 'fr'));
  return values.map((v) => ({ key: v, label: v, count: alive.filter((x) => x.currency === v).length }));
}

export function buildStatusOptions(securities: readonly Security[], deleted: ReadonlySet<string>, decisions: ReadonlyMap<string, 'ok' | 'none'>, followed: ReadonlySet<string>): readonly MultiOption[] {
  const alive = securities.filter((x) => !deleted.has(x.ticker));
  return STATUS_LABELS.map((label) => {
    const key = STATUS_LABEL_KEY[label];
    const def = POSITION_STATUS[key];
    return { key: label, label, count: alive.filter((x) => posStatusOf(decisions, x, followed) === key).length, badgeBg: def.bg, badgeFg: def.fg, dotColor: key === 'followed' ? '#a37a00' : def.fg };
  });
}

/** Compte : options avec un état désactivé (compte hors période d'activité) — pas de badge, juste une bulle grisée. */
export function buildAccountOptions(): readonly MultiOption[] {
  return MANDATES.filter((m) => m.value !== 'all').map((m) => {
    const usable = !!ACCOUNT_OPEN[m.value];
    return { key: m.value, label: m.label, disabled: !usable, hint: usable ? 'Filtrer sur ce compte' : "Compte non sélectionnable — hors période d'activité" };
  });
}

export function accountTriggerLabel(acctPick: ReadonlySet<string> | null): string {
  const keys = pickedAccountKeys(acctPick);
  /* Aucune sélection = aucune restriction, et c'est bien « tous les comptes » qu'il faut lire.
     Retenir les trois comptes ouverts est autre chose, et se nomme autrement. */
  if (!keys.length) return 'Tous les comptes';
  if (keys.length === OPEN_ACCOUNTS.length) return 'Les ' + keys.length + ' comptes ouverts';
  if (keys.length === 1) return MANDATES.find((m) => m.value === keys[0])?.label || keys[0];
  return keys.length + ' comptes sélectionnés';
}

export function accountNote(n: number): string {
  if (!n) return 'Aucun filtre de compte — tous les titres négociables';
  return n === 1 ? 'Titres éligibles au compte retenu' : 'Titres éligibles à l\'un des ' + n + ' comptes retenus';
}

// ---------------------------------------------------------------------------
// Titres suivis (watchlist) — même Security, autre périmètre de filtrage
// ---------------------------------------------------------------------------








// ---------------------------------------------------------------------------
// Recherche de titres — options de filtres statiques
// ---------------------------------------------------------------------------

export const CLASS_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Action', icon: '📈', label: 'Action — titre de capital' },
  { value: 'ETF', icon: '🧺', label: 'ETF — fonds indiciel coté' },
  { value: 'Fonds', icon: '🏛️', label: 'Fonds — OPC non coté' },
  { value: 'Index', icon: '🧭', label: 'Index — indice de référence' },
].map((c) => ({ value: c.value, label: c.icon + '  ' + c.label }));

export const CURRENCY_GROUPS: readonly { readonly label: string; readonly items: readonly { readonly value: string; readonly label: string }[] }[] = [
  {
    label: 'Zone euro et Europe',
    items: [
      { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
      { code: 'GBP', flag: '🇬🇧', name: 'Livre sterling' },
      { code: 'CHF', flag: '🇨🇭', name: 'Franc suisse' },
      { code: 'SEK', flag: '🇸🇪', name: 'Couronne suédoise' },
      { code: 'NOK', flag: '🇳🇴', name: 'Couronne norvégienne' },
      { code: 'DKK', flag: '🇩🇰', name: 'Couronne danoise' },
      { code: 'PLN', flag: '🇵🇱', name: 'Zloty polonais' },
      { code: 'CZK', flag: '🇨🇿', name: 'Couronne tchèque' },
      { code: 'HUF', flag: '🇭🇺', name: 'Forint hongrois' },
      { code: 'RON', flag: '🇷🇴', name: 'Leu roumain' },
      { code: 'ISK', flag: '🇮🇸', name: 'Couronne islandaise' },
    ],
  },
  {
    label: 'Amérique du Nord',
    items: [
      { code: 'USD', flag: '🇺🇸', name: 'Dollar américain' },
      { code: 'CAD', flag: '🇨🇦', name: 'Dollar canadien' },
      { code: 'MXN', flag: '🇲🇽', name: 'Peso mexicain' },
    ],
  },
  {
    label: 'Asie-Pacifique',
    items: [
      { code: 'JPY', flag: '🇯🇵', name: 'Yen japonais' },
      { code: 'CNY', flag: '🇨🇳', name: 'Yuan renminbi' },
      { code: 'HKD', flag: '🇭🇰', name: 'Dollar de Hong Kong' },
      { code: 'SGD', flag: '🇸🇬', name: 'Dollar de Singapour' },
      { code: 'KRW', flag: '🇰🇷', name: 'Won sud-coréen' },
      { code: 'TWD', flag: '🇹🇼', name: 'Dollar de Taïwan' },
      { code: 'INR', flag: '🇮🇳', name: 'Roupie indienne' },
      { code: 'AUD', flag: '🇦🇺', name: 'Dollar australien' },
      { code: 'NZD', flag: '🇳🇿', name: 'Dollar néo-zélandais' },
    ],
  },
].map((g) => ({ label: g.label, items: g.items.map((c) => ({ value: c.code, label: c.flag + '  ' + c.code + ' — ' + c.name })) }));

export const RATING_GROUPS: readonly { readonly label: string; readonly items: readonly { readonly value: string; readonly label: string }[] }[] = [
  { label: 'Catégorie investissement', items: RATING_SCALE.slice(0, 10) },
  { label: 'Catégorie spéculative', items: RATING_SCALE.slice(10) },
].map((g) => ({ label: g.label, items: g.items.map((r) => ({ value: r.code, label: r.code + ' et mieux — ' + r.label })) }));

export const DIV_FREQ_OPTIONS: readonly { readonly value: string; readonly label: string }[] = DIV_FREQ.map((f) => ({ value: f, label: f }));
export const CONSENSUS_OPTIONS = CONSENSUS_VIEWS;
export const SECTOR_OPTIONS: readonly { readonly value: string; readonly label: string }[] = SECTORS.slice()
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  .map((x) => ({ value: x.name, label: x.icon + '  ' + x.name }));
/* Fonction et non constante : la liste des places se déduit du catalogue, qui n'est plus connu au
   chargement du module. Une constante l'aurait figée à vide. */
export function placeOptions(securities: readonly Security[]): readonly { readonly value: string; readonly label: string }[] {
  return Array.from(new Set(securities.map((x) => MARKET_INFO[x.ticker]?.place || x.market)))
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((p) => ({ value: p, label: p }));
}

/** Groupes prêts pour `app-ti-select`, option « Tous/Toutes » en tête (fidèle au `<option value="all">` statique de la source). */
export const CLASS_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Toutes les classes' }, ...CLASS_OPTIONS] }];
export const CURRENCY_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Toutes les devises' }] }, ...CURRENCY_GROUPS];
export const LIQUIDITY_SELECT_GROUPS = [
  { label: '', items: [{ value: 'all', label: 'Sans minimum' }, { value: 'high', label: 'Élevée uniquement' }, { value: 'mid', label: 'Moyenne ou mieux' }] },
];
export const RATING_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Sans minimum' }, { value: 'ig', label: 'Investment grade — BBB− et mieux' }] }, ...RATING_GROUPS];
export const ESG_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Toutes' }, { value: '8', label: 'Article 8 SFDR' }, { value: '9', label: 'Article 9 SFDR' }] }];
export const CONSENSUS_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Tous les consensus' }, ...CONSENSUS_OPTIONS] }];
export const DIV_FREQ_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Toutes les fréquences' }, ...DIV_FREQ_OPTIONS] }];
export const SECTOR_SELECT_GROUPS = [{ label: '', items: [{ value: 'all', label: 'Tous les secteurs' }, ...SECTOR_OPTIONS] }];
export function placeSelectGroups(securities: readonly Security[]) {
  return [{ label: '', items: [{ value: 'all', label: 'Toutes les places' }, ...placeOptions(securities)] }];
}

// ---------------------------------------------------------------------------
// Résultats de recherche
// ---------------------------------------------------------------------------

/**
 * Le vivier interrogé par les résultats.
 *
 * `keep` restreint la composition aux mnémoniques cités — ce que verse « Charger dans la liste »,
 * qui ne remonte que les titres retenus pendant l'ouverture de l'aperçu. Absent, toute la
 * composition est servie : c'est ce que fait un simple changement d'indice, où l'on veut voir
 * l'indice entier.
 */
export function buildSearchPool(
  securities: readonly Security[],
  fromIndex: boolean,
  idx: IndexDef,
  keep?: readonly string[],
): readonly Security[] {
  if (!fromIndex) return securities;
  const retenus = keep && keep.length ? new Set(keep) : null;
  const members = retenus ? idx.members.filter((m) => retenus.has(m.ticker)) : idx.members;
  return members.map(
    (m) =>
      securities.find((x) => x.ticker === m.ticker) || {
        ticker: m.ticker, name: m.name, isin: '—', market: idx.place, assetClass: 'Action', currency: idx.currency,
        rating: '—', liquidity: 'Composant ' + idx.name, esg: 'Non renseigné', domicile: '—', complexity: 'Non complexe', cap: 0, held: 0,
        mandates: [], reviewed: '—', by: idx.name, status: 'none' as const, note: 'Composant de ' + idx.name + ' non encore évalué.',
      },
  );
}

export interface SearchColFilters {
  name?: string;
  cls?: string;
  currency?: string;
  rating?: string;
  liquidity?: string;
}

export interface SearchRow {
  readonly ticker: string;
  readonly name: string;
  readonly isin: string;
  readonly market: string;
  readonly assetClass: string;
  readonly currency: string;
  readonly rating: string;
  readonly liquidity: string;
  readonly picked: boolean;
  readonly status: string;
  readonly statusHint: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly dotColor: string;
}

export interface SearchFilterInput {
  readonly pool: readonly Security[];
  readonly fromIndex: boolean;
  readonly search: SearchState;
  readonly resCol: SearchColFilters;
  readonly resStatusKeys: ReadonlySet<PositionStatusKey>;
  readonly decisions: ReadonlyMap<string, 'ok' | 'none'>;
  /** Les titres mis en veille pendant la session — voir `UniFilterInput.followed`. */
  readonly followed: ReadonlySet<string>;
  readonly picked: ReadonlySet<string>;
  readonly sortKey: string | null;
  readonly sortDir: 'asc' | 'desc';
}

const grade = (r: string) => (r || '').split(' ')[0];

export function computeSearchRows(f: SearchFilterInput): readonly SearchRow[] {
  const q = f.search.q.trim().toLowerCase();
  const raw = f.pool.filter((s) => {
    if (!hit(s.name, f.resCol.name)) return false;
    if (!hit(s.assetClass, f.resCol.cls)) return false;
    if (!hit(s.currency, f.resCol.currency)) return false;
    if (!hit(s.rating, f.resCol.rating)) return false;
    if (!hit(String(s.liquidity).split(' · ')[0], f.resCol.liquidity)) return false;
    if (f.resStatusKeys.size && !f.resStatusKeys.has(posStatusOf(f.decisions, s, f.followed))) return false;
    if (f.fromIndex) return true;
    if (q && (s.ticker + ' ' + s.name + ' ' + s.isin + ' ' + s.assetClass).toLowerCase().indexOf(q) < 0) return false;
    if (f.search.cls !== 'all' && s.assetClass !== f.search.cls) return false;
    if (f.search.currency !== 'all' && s.currency !== f.search.currency) return false;
    if (f.search.liquidity === 'high' && s.liquidity.indexOf('Élevée') < 0 && s.liquidity.indexOf('Très élevée') < 0) return false;
    if (f.search.liquidity === 'mid' && (s.liquidity.indexOf('Faible') >= 0 || s.liquidity.indexOf('Illiquide') >= 0)) return false;
    if (f.search.rating === 'ig' && IG_GRADES.indexOf(grade(s.rating)) < 0) return false;
    if (f.search.rating !== 'all' && f.search.rating !== 'ig') {
      const want = RATING_ORDER.indexOf(f.search.rating);
      const has = RATING_ORDER.indexOf(grade(s.rating));
      if (want >= 0 && (has < 0 || has > want)) return false;
    }
    if (f.search.esg === '8' && s.esg.indexOf('Article 8') < 0) return false;
    if (f.search.esg === '9' && s.esg.indexOf('Article 9') < 0) return false;
    if (f.search.consensus !== 'all' && (CONSENSUS[s.ticker]?.view || '') !== f.search.consensus) return false;
    const fd = FUNDAMENTALS[s.ticker];
    if (f.search.divFreq !== 'all' && (fd?.divFreq || '') !== f.search.divFreq) return false;
    if (f.search.sector !== 'all' && (fd?.sector || '') !== f.search.sector) return false;
    if (f.search.place !== 'all' && (MARKET_INFO[s.ticker]?.place || s.market) !== f.search.place) return false;
    if (f.search.eps) {
      const min = parseFloat(String(f.search.eps).replace(',', '.'));
      if (!isNaN(min) && (fd?.eps || 0) < min) return false;
    }
    return true;
  });

  const getters: Record<string, (x: Security) => string> = {
    security: (x) => x.name,
    cls: (x) => x.assetClass,
    currency: (x) => x.currency,
    rating: (x) => x.rating,
    liquidity: (x) => String(x.liquidity).split(' · ')[0],
    status: (x) => POSITION_STATUS[posStatusOf(f.decisions, x, f.followed)].label,
  };
  const get = f.sortKey ? getters[f.sortKey] : null;
  const sorted = get ? raw.slice().sort((a, b) => get(a).localeCompare(get(b), 'fr') * (f.sortDir === 'desc' ? -1 : 1)) : raw;

  return sorted.map((s) => {
    const ps = posStatusOf(f.decisions, s, f.followed);
    const def = POSITION_STATUS[ps];
    return {
      ticker: s.ticker, name: s.name, isin: s.isin, market: s.market, assetClass: s.assetClass, currency: s.currency,
      rating: s.rating, liquidity: s.liquidity.split(' · ')[0], picked: f.picked.has(s.ticker),
      status: def.label, statusHint: def.hint, tagBg: def.bg, tagFg: def.fg, dotColor: ps === 'followed' ? '#a37a00' : def.fg,
    };
  });
}

const RES_STATUS_ORDER: readonly PositionStatusKey[] = ['held', 'settled', 'watch', 'followed', 'never'];

export function buildResStatusOptions(pool: readonly Security[], decisions: ReadonlyMap<string, 'ok' | 'none'>, followed: ReadonlySet<string>): readonly MultiOption[] {
  return RES_STATUS_ORDER.map((k) => {
    const def = POSITION_STATUS[k];
    return { key: k, label: def.label, count: pool.filter((x) => posStatusOf(decisions, x, followed) === k).length, badgeBg: def.bg, badgeFg: def.fg, dotColor: k === 'followed' ? '#a37a00' : def.fg };
  });
}

// ---------------------------------------------------------------------------
// Panneau « Indices de référence » + modale d'aperçu
// ---------------------------------------------------------------------------

export function refOf(securities: readonly Security[], refs: ReadonlyMap<string, 'ok' | 'none'>, idxKey: string, m: IndexMember, decisions: ReadonlyMap<string, 'ok' | 'none'>): 'ok' | 'none' {
  const override = refs.get(idxKey + '/' + m.ticker);
  if (override) return override;
  const known = securities.find((x) => x.ticker === m.ticker);
  if (known && statusOf(decisions, known) !== 'none') return 'ok';
  return m.ref;
}

export function inCount(securities: readonly Security[], idx: IndexDef, members: readonly IndexMember[], refs: ReadonlyMap<string, 'ok' | 'none'>, decisions: ReadonlyMap<string, 'ok' | 'none'>): number {
  return members.filter((m) => refOf(securities, refs, idx.key, m, decisions) === 'ok').length;
}

export function buildIndexGroups(
  securities: readonly Security[],
  refs: ReadonlyMap<string, 'ok' | 'none'>,
  decisions: ReadonlyMap<string, 'ok' | 'none'>,
): readonly { readonly label: string; readonly items: readonly { readonly value: string; readonly label: string }[] }[] {
  return REGIONS.map((r) => ({
    label: r,
    items: INDICES.filter((i) => i.region === r)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((i) => {
        const members = i.members;
        return { value: i.key, label: i.name + ' — ' + i.place + ' (' + inCount(securities, i, members, refs, decisions) + '/' + members.length + ' retenus)' };
      }),
  }));
}

/**
 * Un titre détenu ne peut pas sortir de l'univers.
 *
 * L'appartenance à l'univers est une décision ; la détention est un fait. Décocher un titre qu'on
 * possède ne le vendrait pas — cela prétendrait seulement qu'on ne l'a pas retenu, alors qu'il est
 * en portefeuille. L'écran afficherait « Non retenu » sur une ligne détenue, et le décompte des
 * retenus cesserait de couvrir ce qui est réellement détenu.
 *
 * La condition porte sur `retained` et pas seulement sur la détention : un titre détenu qui ne
 * serait pas encore retenu doit pouvoir l'être. C'est le passage de retenu à non retenu qui est
 * interdit, pas l'inverse — verrouiller les deux sens l'enfermerait hors de l'univers.
 */
export function isLockedInUniverse(ticker: string, retained: boolean): boolean {
  return retained && !!PORTFOLIO_LINKS[ticker]?.held;
}

export interface PreviewRow {
  readonly name: string;
  readonly ticker: string;
  readonly isin: string;
  readonly sector: string;
  readonly weight: string;
  readonly eligible: string;
  readonly posHint: string;
  readonly switchTitle: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly on: boolean;
  /** La bascule est-elle inerte ? Vrai pour un titre détenu, qui ne peut pas être décoché. */
  readonly locked: boolean;
}

export interface PreviewData {
  readonly title: string;
  readonly detail: string;
  readonly kpis: readonly { readonly label: string; readonly value: string; readonly color: string }[];
  readonly rows: readonly PreviewRow[];
  readonly allOn: boolean;
  readonly footer: string;
}

export function computePreview(securities: readonly Security[], idx: IndexDef, members: readonly IndexMember[], refs: ReadonlyMap<string, 'ok' | 'none'>, decisions: ReadonlyMap<string, 'ok' | 'none'>): PreviewData {
  const ref = (m: IndexMember) => refOf(securities, refs, idx.key, m, decisions);
  const elig = members.filter((m) => ref(m) === 'ok');
  const posOf = (m: IndexMember, retained: boolean): PositionStatusDef => {
    const link = PORTFOLIO_LINKS[m.ticker];
    if (link?.held) return POSITION_STATUS.held;
    if (link?.history) return POSITION_STATUS.settled;
    return retained ? POSITION_STATUS.watch : POSITION_STATUS.never;
  };
  const weight = elig.reduce((n, m) => n + m.weight, 0);
  return {
    title: idx.name + ' — ' + idx.place,
    detail: idx.name + ' compte ' + idx.count + ' composant(s) · ' + members.length + ' chargé(s) dans le référentiel · ' + idx.region,
    kpis: [
      { label: 'Composants affichés', value: String(members.length), color: 'var(--color-text)' },
      { label: 'Retenus', value: elig.length + ' / ' + members.length, color: 'var(--ink-ok-2)' },
      { label: 'Poids retenu', value: weight ? weight.toFixed(1).replace('.', ',') + ' %' : 'Non communiqué', color: 'var(--ds-brand-fill, var(--ink-brand-2))' },
    ],
    /* Toujours par nom, et jamais par poids : la source livre ses composants du plus lourd au plus
       léger, ce qui est l'ordre d'un gérant mais pas celui d'un lecteur. Sur un indice de cinq cents
       lignes on vient chercher une valeur précise, et seul l'ordre alphabétique permet de la
       trouver. `localeCompare` en français pour que les accents se rangent où on les attend —
       « Élis » avec les E — et `numeric` pour que « 3i Group » ne passe pas après « 30 ». */
    rows: [...members]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' }))
      .map((m) => {
        const r = ref(m);
        const on = r === 'ok';
        const st = posOf(m, on);
        const locked = isLockedInUniverse(m.ticker, on);
        return {
          name: m.name, ticker: m.ticker, isin: m.isin, sector: m.sector,
          weight: m.weight ? m.weight.toFixed(1).replace('.', ',') + ' %' : '—',
          eligible: st.label, posHint: st.hint,
          switchTitle: locked
            ? "Titre détenu en portefeuille : il ne peut pas sortir de l'univers"
            : on ? "Retirer de l'univers" : "Retenir dans l'univers",
          tagBg: st.bg, tagFg: st.fg, on, locked,
        };
      }),
    allOn: elig.length === members.length,
    footer: 'Indice de ' + idx.count + ' valeurs · ' + members.length + ' composants listés · devise ' + idx.currency,
  };
}

/* La simulation de rafraîchissement d'indice a été retirée d'ici. Elle complétait la composition
   par lots de douze lignes fabriquées — « CAC 40 · composant 11 », ISIN `XX…` calculé — puis faisait
   dériver les pondérations au hasard de l'heure. L'écran avait alors l'air complet sans l'être, et
   un ISIN inventé désigne un autre titre ou aucun. Le bouton relit désormais la composition à la
   source, via `IndexFeedService.reload()`. */

// ---------------------------------------------------------------------------
// Panneau latéral titre (Fiche / Évaluation)
// ---------------------------------------------------------------------------

export interface SecurityCard {
  readonly fields: readonly { readonly label: string; readonly value: string }[];
}

export interface SecuritySheet {
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly tagBg: string;
  readonly tagFg: string;
  readonly name: string;
  readonly isin: string;
  readonly currency: string;
  readonly symbol: string;
  readonly index: string;
  readonly market: string;
  readonly activity: string;
  readonly activityNote: string;
  readonly cards: readonly SecurityCard[];
  readonly rows: readonly { readonly label: string; readonly value: string }[];
}

export function buildSecuritySheet(cur: Security, decisions: ReadonlyMap<string, 'ok' | 'none'>): SecuritySheet {
  const info = MARKET_INFO[cur.ticker];
  const st = STATUS[statusOf(decisions, cur)];
  return {
    title: cur.ticker + ' — ' + cur.name,
    subtitle: cur.isin + ' · ' + (info?.place || cur.market) + ' · ' + cur.assetClass,
    status: st.label, tagBg: st.bg, tagFg: st.fg,
    name: cur.name, isin: cur.isin, currency: cur.currency,
    symbol: info?.symbol || cur.ticker, index: info?.index || '—', market: info?.place || cur.market,
    activity: info?.activity || 'Activité non renseignée.',
    activityNote: (info?.sector || cur.assetClass) + ' · ' + (info?.country || '—'),
    cards: [
      { fields: [{ label: 'Nom', value: cur.name }, { label: "Classe d'actifs", value: cur.assetClass }] },
      { fields: [{ label: 'ISIN', value: cur.isin }, { label: 'Symbole', value: info?.symbol || cur.ticker }, { label: 'Place boursière', value: info?.place || cur.market }] },
      { fields: [{ label: 'Situation géographique', value: info?.country || '—' }, { label: "Secteur d'activité", value: info?.sector || '—' }, { label: 'Devise', value: cur.currency }] },
    ],
    rows: [
      { label: "Classe d'actifs", value: cur.assetClass },
      { label: 'Notation', value: cur.rating },
      { label: 'Devise', value: cur.currency },
      { label: 'Liquidité', value: cur.liquidity },
      { label: 'Classification', value: cur.esg },
      { label: 'Complexité', value: cur.complexity },
      { label: 'Plafond par compte', value: cur.cap ? cur.cap + ' %' : 'Aucun' },
      { label: 'Comptes éligibles', value: cur.mandates.length ? cur.mandates.join(', ') : 'Aucun' },
      { label: 'Dernière revue', value: cur.reviewed + ' · ' + cur.by },
    ],
  };
}

export interface CriterionRow {
  readonly label: string;
  readonly detail: string;
  readonly verdict: string;
  readonly color: string;
}

export function computeCriteria(cur: Security): readonly CriterionRow[] {
  const list = [
    { label: 'Notation minimale', detail: cur.rating === '—' ? 'Non applicable aux fonds actions' : 'Exigence contractuelle BBB− · titre noté ' + cur.rating, ok: cur.ticker !== 'HYBND' },
    { label: 'Liquidité', detail: cur.liquidity, ok: cur.liquidity.indexOf('Faible') < 0 && cur.liquidity.indexOf('Illiquide') < 0 },
    { label: 'Complexité', detail: cur.complexity + (cur.complexity === 'Complexe' ? ' · client professionnel requis' : ''), ok: cur.complexity !== 'Complexe' },
    { label: 'Classification durable', detail: cur.esg, ok: cur.esg.indexOf('Non classé') < 0 },
    { label: 'Domiciliation', detail: cur.domicile + ' · ' + cur.currency, ok: true },
    { label: 'Plafond de concentration', detail: cur.cap ? cur.cap + " % de l'actif net par compte" : 'Aucun plafond attribué', ok: cur.cap > 0 },
  ];
  return list.map((c) => ({ label: c.label, detail: c.detail, verdict: c.ok ? 'Conforme' : 'Restriction', color: c.ok ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)' }));
}

// ---------------------------------------------------------------------------
// Sélections multiples — outils partagés par les tableaux
// ---------------------------------------------------------------------------

/** Sens d'un tri de colonne. */
export type SortDir = 'asc' | 'desc';

/**
 * Bascule une clé dans un ensemble persisté.
 *
 * Ces deux fonctions vivaient dans `titres.ts`, qui était le seul à en avoir l'usage. Le tableau
 * des titres en est sorti dans son propre composant, et deux fichiers ne peuvent pas partager une
 * fonction privée de module — elles sont donc ici, auprès des filtres qu'elles servent.
 */
export function toggleInSet<T>(sig: WritableSignal<ReadonlySet<T>>, key: T): void {
  sig.update((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}

/** Tout sélectionner, ou tout désélectionner si tout l'était déjà. */
export function toggleAllInSet<T>(sig: WritableSignal<ReadonlySet<T>>, all: readonly T[]): void {
  sig.update((s) => (all.length > 0 && all.every((v) => s.has(v)) ? new Set<T>() : new Set(all)));
}
