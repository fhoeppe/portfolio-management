/**
 * Référentiels de l'écran Rapports — portés de `Rapports.dc.html`.
 *
 * Le catalogue est plat et porte son groupe en propriété plutôt que d'être un arbre : c'est le
 * même jeu de rapports qui alimente la liste groupée du sélecteur et la recherche par
 * identifiant, et un arbre obligerait à le parcourir deux fois pour retrouver un rapport isolé.
 */

export interface ReportDef {
  readonly id: string;
  /** Famille affichée en intertitre du sélecteur. */
  readonly group: string;
  readonly name: string;
  readonly freq: string;
  readonly desc: string;
}

export const CATALOG: readonly ReportDef[] = [
  {
    id: 'valo', group: 'Portefeuille', name: 'Valorisation de portefeuille', freq: 'Mensuel',
    desc: 'Inventaire valorisé des positions à la date de fin, avec prix, quantités et contre-valeur.',
  },
  {
    id: 'perf', group: 'Portefeuille', name: 'Performance et attribution', freq: 'Mensuel',
    desc: "Rendement de la période, contribution par classe d'actifs et écart au benchmark.",
  },
  {
    id: 'alloc', group: 'Portefeuille', name: 'Composition et allocation', freq: 'Trimestriel',
    desc: "Répartition par classe d'actifs, secteur, devise et zone, comparée aux cibles du compte.",
  },
  {
    id: 'client', group: 'Client', name: 'Relevé client', freq: 'Trimestriel',
    desc: 'Relevé destiné au client : synthèse, performance, mouvements et frais de la période.',
  },
  {
    id: 'frais', group: 'Client', name: 'Relevé de frais et commissions', freq: 'Annuel',
    desc: 'Détail des frais de gestion, droits de garde et commissions de transaction.',
  },
  {
    id: 'trx', group: 'Opérations', name: 'Registre des transactions', freq: 'À la demande',
    desc: 'Journal des ordres exécutés sur la période, avec contrepartie et frais associés.',
  },
  {
    id: 'recon', group: 'Opérations', name: 'Rapprochement dépositaire', freq: 'Hebdomadaire',
    desc: 'Écarts entre positions internes et positions dépositaire, ligne par ligne.',
  },
  {
    id: 'limites', group: 'Conformité', name: 'Contrôle des limites', freq: 'Mensuel',
    desc: "Dépassements de bandes d'allocation, limites de concentration et contraintes du compte.",
  },
  {
    id: 'mifid', group: 'Conformité', name: 'Reporting réglementaire MiFID II', freq: 'Trimestriel',
    desc: 'Rapport périodique réglementaire : coûts et charges, adéquation, information sur les pertes.',
  },
];

export interface ScopeDef {
  readonly value: string;
  readonly label: string;
}

export const SCOPES: readonly ScopeDef[] = [
  { value: 'bgm', label: 'Balanced Growth — BGM-004' },
  { value: 'income', label: 'Income & Preservation — INP-011' },
  { value: 'growth', label: 'Global Growth — GLG-002' },
  { value: 'all', label: 'Tous les comptes gérés' },
];

export const CURRENCIES: readonly ScopeDef[] = [
  { value: 'EUR', label: 'EUR — euro' },
  { value: 'USD', label: 'USD — dollar' },
  { value: 'CHF', label: 'CHF — franc suisse' },
];

export type OptionKey = 'charts' | 'bench' | 'lines' | 'annex';

export const OPTIONS: readonly { readonly key: OptionKey; readonly label: string }[] = [
  { key: 'charts', label: 'Inclure les graphiques' },
  { key: 'bench', label: 'Comparer au benchmark' },
  { key: 'lines', label: 'Détail ligne par ligne' },
  { key: 'annex', label: 'Annexes et notes de méthode' },
];

export const FORMATS: readonly string[] = ['PDF', 'XLSX', 'CSV'];

export type PeriodKey = 'month' | 'quarter' | 'year' | 'custom';

export const PERIODS: readonly { readonly key: PeriodKey; readonly label: string }[] = [
  { key: 'month', label: 'Mois en cours' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Année' },
  { key: 'custom', label: 'Personnalisée' },
];

export type JobState = 'running' | 'ready';

export interface Job {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly scope: string;
  readonly period: string;
  readonly at: string;
  readonly state: JobState;
}

export const SEED_JOBS: readonly Job[] = [
  { id: 'j2', name: 'Contrôle des limites', format: 'PDF', scope: 'BGM-004', period: 'Juillet 2026', at: '01/08/2026 07:10', state: 'ready' },
  { id: 'j1', name: 'Relevé client', format: 'PDF', scope: 'Tous les comptes', period: 'T2 2026', at: '03/07/2026 18:22', state: 'ready' },
];

/** Délai avant qu'une génération lancée passe de « en cours » à « prêt ». */
export const GENERATION_MS = 1400;

const MONTHS: readonly string[] = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtDate(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Libellé de la période retenue, dérivé de la seule borne de gauche pour les périodes
 * calendaires : « mois en cours », « trimestre » et « année » sont entièrement déterminés par
 * leur date de début, la borne de droite étant toujours aujourd'hui.
 */
export function periodLabel(period: PeriodKey, from: string, to: string): string {
  const [y, m] = from.split('-');
  const month = MONTHS[+m - 1] ?? '';
  if (period === 'month') return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${y}`;
  if (period === 'quarter') return `T${Math.floor((+m - 1) / 3) + 1} ${y}`;
  if (period === 'year') return `Année ${y}`;
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

/** Bornes d'une période calendaire : du premier jour de la maille à aujourd'hui. */
export function periodRange(period: PeriodKey, now = new Date()): { from: string; to: string } | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'month') return { from: iso(new Date(y, m, 1)), to: iso(now) };
  if (period === 'quarter') return { from: iso(new Date(y, Math.floor(m / 3) * 3, 1)), to: iso(now) };
  if (period === 'year') return { from: iso(new Date(y, 0, 1)), to: iso(now) };
  /* « Personnalisée » ne recalcule rien : les bornes déjà saisies sont conservées. */
  return null;
}
