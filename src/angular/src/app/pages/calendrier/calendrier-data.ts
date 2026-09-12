/**
 * Référentiels et arithmétique de dates du calendrier — portés de `Calendrier.dc.html`.
 *
 * Les dates circulent en ISO (`aaaa-mm-jj`) et les heures en `hh:mm` ; les `Date` ne servent
 * qu'aux calculs de calendrier, jamais au stockage. C'est ce qui permet de comparer deux jours
 * par égalité de chaînes, sans se soucier de fuseau ni d'heure.
 */

export type CatKey = 'client' | 'comite' | 'echeance' | 'reporting' | 'interne' | 'indicateur' | 'fiscal';

export interface CatDef {
  readonly label: string;
  readonly color: string;
}

export const CATS: Readonly<Record<CatKey, CatDef>> = {
  client: { label: 'Réunion client', color: 'var(--ink-brand-2)' },
  comite: { label: "Comité d'investissement", color: 'var(--ink-ok-2)' },
  echeance: { label: 'Échéance', color: 'var(--ink-warn-2)' },
  reporting: { label: 'Reporting', color: 'var(--ink-violet)' },
  interne: { label: 'Interne', color: 'var(--ink-stone)' },
  indicateur: { label: 'Indicateur économique', color: 'var(--ink-magenta)' },
  fiscal: { label: 'Échéance fiscale', color: 'var(--ink-warn)' },
};

export const CAT_KEYS = Object.keys(CATS) as CatKey[];

export const DOW: readonly string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const DOW1: readonly string[] = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const MONTHS: readonly string[] = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export type ItemKind = 'event' | 'task';

export interface KindDef {
  readonly label: string;
  /** Ce qui sépare les deux natures, dit en une phrase. */
  readonly hint: string;
  readonly icon: string;
  readonly color: string;
  /** Titres de la boîte de saisie, accordés au genre du mot. */
  readonly newTitle: string;
  readonly editTitle: string;
}

/**
 * Description des deux natures, partagée par le combo « Créer » et la boîte de saisie : c'est
 * la même icône, la même couleur et le même vocabulaire d'un bout à l'autre du geste, faute de
 * quoi on ne saurait pas, une fois la boîte ouverte, ce qu'on est en train de créer.
 */
export const KIND_DEFS: Readonly<Record<ItemKind, KindDef>> = {
  event: {
    label: 'Événement',
    hint: 'Occupe un créneau, de telle heure à telle heure',
    icon: 'calendar-clock',
    color: 'var(--ink-brand-2)',
    newTitle: 'Nouvel événement',
    editTitle: "Modifier l'événement",
  },
  task: {
    label: 'Tâche',
    hint: 'À faire, et qui se coche une fois traitée',
    icon: 'checklist',
    color: 'var(--ink-violet)',
    newTitle: 'Nouvelle tâche',
    editTitle: 'Modifier la tâche',
  },
};

export const KIND_KEYS = Object.keys(KIND_DEFS) as ItemKind[];

export interface CalItem {
  readonly id: string;
  readonly kind: ItemKind;
  readonly title: string;
  readonly date: string;
  readonly start: string;
  readonly end: string;
  readonly allDay: boolean;
  readonly cat: CatKey;
  readonly notes: string;
  /** N'a de sens que pour une tâche. */
  readonly done: boolean;
}

// -- Arithmétique de dates ------------------------------------------------------------------

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Lundi de la semaine d'une date : la semaine commence le lundi, pas le dimanche. */
export function mondayOf(d: Date): Date {
  const c = new Date(d);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
}

export function toMin(t: string): number {
  const [h, m] = (t || '09:00').split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(m: number): string {
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// -- Réglages de la grille ------------------------------------------------------------------

/** Première et dernière heure affichées dans la vue semaine. */
export const DAY_START = 7;
export const DAY_END = 21;

export type RangeKey = 'work' | 'full';

/**
 * Plages horaires proposées par les paramètres d'affichage. « Heures ouvrées » est la plage du
 * prototype ; « journée entière » existe pour les éléments qui tombent hors de ces bornes et
 * seraient sinon invisibles dans la grille.
 */
export const DAY_RANGES: readonly { readonly key: RangeKey; readonly label: string; readonly start: number; readonly end: number }[] = [
  { key: 'work', label: 'Heures ouvrées (7 h – 21 h)', start: DAY_START, end: DAY_END },
  { key: 'full', label: 'Journée entière (0 h – 24 h)', start: 0, end: 24 },
];
/** Hauteur d'une heure dans la grille, en pixels. */
export const HOUR_PX = 48;
/** Nombre d'éléments montrés dans une case de mois avant le repli « + n de plus ». */
export const MONTH_CHIP_LIMIT = 3;

// -- Jeu d'essai ----------------------------------------------------------------------------

let seq = 0;

function mk(o: Partial<CalItem> & { title: string; date: string; cat: CatKey }): CalItem {
  return {
    id: `i${++seq}`,
    kind: 'event',
    allDay: false,
    done: false,
    notes: '',
    start: '09:00',
    end: '10:00',
    ...o,
  };
}

/**
 * Le jeu d'essai est bâti autour de la semaine courante : les rendez-vous du cabinet s'y
 * accrochent par décalage depuis le lundi, tandis que les publications macroéconomiques et les
 * échéances fiscales portent leur date réelle, qui ne dépend pas de la semaine consultée.
 */
export function seedItems(today = new Date()): readonly CalItem[] {
  seq = 0;
  const mon = mondayOf(today);
  const D = (n: number) => iso(addDays(mon, n));
  const M = (day: number) => iso(new Date(today.getFullYear(), today.getMonth(), day));

  return [
    mk({ title: "Comité d'investissement", date: D(0), start: '09:00', end: '10:30', cat: 'comite', notes: 'Revue des comptes discrétionnaires.' }),
    mk({ title: 'Revue compte — Cheval Blanc SCI', date: D(0), start: '14:00', end: '15:00', cat: 'client' }),
    mk({ title: 'Valorisation mensuelle', date: D(1), start: '11:00', end: '12:00', cat: 'reporting' }),
    mk({ title: 'Appel Ashfield — sleeve EM', date: D(1), start: '16:30', end: '17:00', cat: 'client' }),
    mk({ kind: 'task', title: 'Valider les ordres de rééquilibrage', date: D(2), start: '08:30', end: '09:00', cat: 'interne' }),
    mk({ title: 'Échéance coupon TSY10', date: D(2), allDay: true, cat: 'echeance' }),
    mk({ title: 'Point hebdomadaire équipe', date: D(3), start: '09:30', end: '10:00', cat: 'interne' }),
    mk({ title: 'Onboarding client — Meridian Family', date: D(3), start: '15:00', end: '16:30', cat: 'client', notes: 'Documents KYC à finaliser.' }),
    mk({ kind: 'task', title: 'Envoyer le reporting trimestriel', date: D(4), start: '17:00', end: '17:30', cat: 'reporting', done: true }),
    mk({ title: 'Revue de risque', date: D(4), start: '10:00', end: '11:30', cat: 'comite' }),
    mk({ title: 'Clôture comptable', date: M(28), allDay: true, cat: 'echeance' }),
    mk({ kind: 'task', title: 'Contrôle des limites de concentration', date: M(12), start: '09:00', end: '10:00', cat: 'interne' }),
    mk({ title: 'Assemblée générale — Infrastructure Fund II', date: M(19), start: '14:00', end: '17:00', cat: 'echeance' }),

    // Publications macroéconomiques d'ici la fin de l'année.
    mk({ title: 'BCE — décision de taux', date: '2026-09-10', start: '14:15', end: '15:00', cat: 'indicateur', notes: 'Conseil des gouverneurs, conférence de presse à 14:45.' }),
    mk({ title: 'Inflation zone euro — estimation rapide', date: '2026-09-16', start: '11:00', end: '11:15', cat: 'indicateur', notes: 'Eurostat, IPCH de septembre.' }),
    mk({ title: 'Fed — décision de taux (FOMC)', date: '2026-09-16', start: '20:00', end: '20:45', cat: 'indicateur', notes: 'Communiqué et projections trimestrielles.' }),
    mk({ title: 'Emploi américain — rapport mensuel', date: '2026-10-02', start: '14:30', end: '14:45', cat: 'indicateur', notes: "Créations d'emplois non agricoles et taux de chômage." }),
    mk({ title: 'PMI composite zone euro', date: '2026-10-05', start: '10:00', end: '10:15', cat: 'indicateur' }),
    mk({ title: 'Inflation américaine — CPI', date: '2026-10-13', start: '14:30', end: '14:45', cat: 'indicateur', notes: 'Indice des prix à la consommation de septembre.' }),
    mk({ title: 'BCE — décision de taux', date: '2026-10-29', start: '14:15', end: '15:00', cat: 'indicateur' }),
    mk({ title: 'Fed — décision de taux (FOMC)', date: '2026-10-28', start: '20:00', end: '20:45', cat: 'indicateur' }),
    mk({ title: 'PIB zone euro — première estimation', date: '2026-10-30', start: '11:00', end: '11:15', cat: 'indicateur', notes: 'Croissance du troisième trimestre.' }),
    mk({ title: 'Emploi américain — rapport mensuel', date: '2026-11-06', start: '14:30', end: '14:45', cat: 'indicateur' }),
    mk({ title: 'Inflation américaine — CPI', date: '2026-11-12', start: '14:30', end: '14:45', cat: 'indicateur' }),
    mk({ title: 'Inflation zone euro — chiffre définitif', date: '2026-11-18', start: '11:00', end: '11:15', cat: 'indicateur' }),
    mk({ title: 'PMI composite zone euro', date: '2026-11-23', start: '10:00', end: '10:15', cat: 'indicateur' }),
    mk({ title: 'Fed — décision de taux (FOMC)', date: '2026-12-09', start: '20:00', end: '20:45', cat: 'indicateur', notes: "Dernière réunion de l'année, projections révisées." }),
    mk({ title: 'Emploi américain — rapport mensuel', date: '2026-12-04', start: '14:30', end: '14:45', cat: 'indicateur' }),
    mk({ title: 'BCE — décision de taux', date: '2026-12-17', start: '14:15', end: '15:00', cat: 'indicateur', notes: "Projections macroéconomiques de l'Eurosystème." }),
    mk({ title: 'Inflation américaine — CPI', date: '2026-12-10', start: '14:30', end: '14:45', cat: 'indicateur' }),
    mk({ title: 'PIB zone euro — estimation définitive', date: '2026-12-08', start: '11:00', end: '11:15', cat: 'indicateur' }),

    // Échéances déclaratives et de paiement.
    mk({ title: 'Retenue à la source — déclaration T3', date: '2026-10-15', allDay: true, cat: 'fiscal', notes: 'Reversement des retenues sur dividendes du troisième trimestre.' }),
    mk({ kind: 'task', title: "Acompte d'impôt sur les sociétés — 4e échéance", date: '2026-12-15', allDay: true, cat: 'fiscal', notes: "Solde de l'exercice à verser avant le 15." }),
    mk({ title: 'Déclaration des revenus de capitaux mobiliers (IFU)', date: '2026-11-30', allDay: true, cat: 'fiscal', notes: 'Imprimé fiscal unique à transmettre aux titulaires.' }),
    mk({ title: 'Retenue à la source — déclaration T4', date: '2027-01-15', allDay: true, cat: 'fiscal', notes: 'Quatrième trimestre : dépôt au plus tard le 15 janvier.' }),
    mk({ kind: 'task', title: 'Attestation fiscale annuelle aux clients', date: '2026-12-31', allDay: true, cat: 'fiscal', notes: 'Récapitulatif des plus-values et revenus par compte.' }),
    mk({ title: 'Déclaration de TVA — décembre', date: '2027-01-20', allDay: true, cat: 'fiscal' }),
  ];
}

export function blankItem(date: string, start = '09:00'): Omit<CalItem, 'id'> {
  return {
    kind: 'event',
    title: '',
    date,
    start,
    end: fromMin(toMin(start) + 60),
    allDay: false,
    cat: 'client',
    notes: '',
    done: false,
  };
}
