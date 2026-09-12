/**
 * Dossiers d'entrée en relation.
 *
 * Un dossier suit le même parcours en treize étapes que la vie d'un compte (`STAGES` dans
 * `comptes-data.ts`) : l'entrée en relation n'en est que la première moitié, des premiers
 * contacts à l'apport initial. Le modèle réutilise donc `STAGES` et `PHASES` plutôt que
 * d'ouvrir un parcours parallèle qui divergerait au premier changement.
 *
 * Un dossier n'est pas encore un compte : il n'en devient un qu'à l'ouverture chez le
 * dépositaire (étape 6). Ceux qui ont déjà franchi ce cap portent l'identifiant du compte créé,
 * les autres n'en ont pas.
 */
import { PHASES, STAGES } from './comptes-data';

/** Dernière étape du parcours qui relève encore de l'entrée en relation. */
export const ENTRY_LAST_STAGE = 7;

export type HolderKind = 'physique' | 'morale';

export interface OnboardingCase {
  readonly id: string;
  readonly name: string;
  readonly kind: HolderKind;
  /** Comment la relation est née : apporteur, recommandation, démarche directe. */
  readonly origin: string;
  /** Index dans `STAGES` : l'étape en cours, celles d'avant étant acquises. */
  readonly stage: number;
  readonly owner: string;
  readonly since: string;
  readonly lastUpdate: string;
  readonly aumTarget: number;
  readonly profile: string;
  /** Motif de blocage, ou `null` si le dossier avance. */
  readonly blocked: string | null;
  /** Pièces attendues pour franchir l'étape en cours. */
  readonly missingDocs: readonly string[];
  /** Compte ouvert chez le dépositaire, une fois l'étape 6 franchie. */
  readonly accountId?: string;
}

export const ONBOARDING_CASES: readonly OnboardingCase[] = [
  {
    id: 'EER-2026-014', name: 'Meridian Family Office', kind: 'morale',
    origin: 'Recommandation — Fondation Ravel', stage: 2, owner: 'F. Hoeppe',
    since: '22/07/2026', lastUpdate: '12/08/2026', aumTarget: 42000000, profile: 'Croissance',
    blocked: null,
    missingDocs: ['Registre des bénéficiaires effectifs', "Pièce d'identité du second mandataire"],
    accountId: 'GLG-002',
  },
  {
    id: 'EER-2026-019', name: 'Vasseur, Jonas', kind: 'physique',
    origin: 'Démarche directe — site institutionnel', stage: 0, owner: 'C. Berger',
    since: '02/09/2026', lastUpdate: '05/09/2026', aumTarget: 1800000, profile: 'À définir',
    blocked: null,
    missingDocs: ['Fiche de premier contact'],
  },
  {
    id: 'EER-2026-017', name: 'Brandt Immobilier SARL', kind: 'morale',
    origin: 'Apporteur — étude notariale Weber', stage: 1, owner: 'É. Novak',
    since: '18/08/2026', lastUpdate: '04/09/2026', aumTarget: 9500000, profile: 'Équilibré',
    blocked: null,
    missingDocs: ["Proposition d'investissement à contresigner"],
  },
  {
    id: 'EER-2026-011', name: 'Succession Aubert', kind: 'physique',
    origin: 'Apporteur — étude notariale Weber', stage: 3, owner: 'A. Meyer',
    since: '04/07/2026', lastUpdate: '28/08/2026', aumTarget: 6200000, profile: 'Prudent',
    blocked: "Origine des fonds non justifiée : attestation notariale attendue depuis le 12/08",
    missingDocs: ["Attestation d'origine des fonds", 'Acte de notoriété'],
  },
  {
    id: 'EER-2026-008', name: 'Kessler Holding SA', kind: 'morale',
    origin: 'Recommandation — Hoffmann Patrimoine', stage: 5, owner: 'F. Hoeppe',
    since: '11/06/2026', lastUpdate: '09/09/2026', aumTarget: 24000000, profile: 'Équilibré',
    blocked: null,
    missingDocs: ['Convention de gestion signée'],
  },
  {
    id: 'EER-2026-006', name: 'Fonds de dotation Lumen', kind: 'morale',
    origin: 'Appel d\'offres', stage: 6, owner: 'C. Berger',
    since: '20/05/2026', lastUpdate: '10/09/2026', aumTarget: 15000000, profile: 'Revenu',
    blocked: null,
    missingDocs: [],
    accountId: 'INP-014',
  },
];

/** Les quatre phases qui composent l'entrée en relation, hors vie courante et sortie. */
export const ENTRY_PHASES = PHASES.filter((p) => p.from <= ENTRY_LAST_STAGE);

export function phaseOfStage(stage: number): string {
  return ENTRY_PHASES.find((p) => stage >= p.from && stage <= p.upTo)?.label ?? PHASES[0].label;
}

export function stageLabel(stage: number): string {
  return STAGES[stage]?.label ?? '—';
}

/** Avancement du dossier, en part des étapes d'entrée franchies. */
export function progress(stage: number): number {
  return Math.round((stage / (ENTRY_LAST_STAGE + 1)) * 100);
}

export const KIND_LABEL: Readonly<Record<HolderKind, string>> = {
  physique: 'Personne physique',
  morale: 'Personne morale',
};
