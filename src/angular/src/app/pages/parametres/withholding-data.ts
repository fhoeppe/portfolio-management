/**
 * Barème de retenue à la source sur dividendes et coupons — porté de `withholding-rates.js`.
 *
 * Deux taux par pays de source : le taux légal interne, appliqué à défaut, et le taux
 * conventionnel maximal issu des conventions fiscales bilatérales, qui ne s'obtient que sur
 * présentation d'un certificat de résidence en cours de validité.
 */
import { CONTINENT_ORDER } from './places-data';

export interface WithholdingRate {
  readonly code: string;
  readonly flag: string;
  readonly country: string;
  readonly continent: string;
  readonly legal: number;
  readonly treaty: number;
  /** Voie de récupération du trop-perçu quand le taux légal a été retenu. */
  readonly recovery: string;
}

interface RateBase {
  readonly flag: string;
  readonly country: string;
  readonly legal: number;
  readonly treaty: number;
  readonly recovery: string;
}

const BASE: Readonly<Record<string, RateBase>> = {
  FR: { flag: '🇫🇷', country: 'France', legal: 12.8, treaty: 12.8, recovery: 'Sans objet' },
  US: { flag: '🇺🇸', country: 'États-Unis', legal: 30, treaty: 15, recovery: 'Formulaire W-8BEN' },
  DE: { flag: '🇩🇪', country: 'Allemagne', legal: 26.375, treaty: 15, recovery: 'Réclamation annuelle' },
  CH: { flag: '🇨🇭', country: 'Suisse', legal: 35, treaty: 15, recovery: 'Réclamation annuelle' },
  NL: { flag: '🇳🇱', country: 'Pays-Bas', legal: 15, treaty: 15, recovery: 'Sans objet' },
  IT: { flag: '🇮🇹', country: 'Italie', legal: 26, treaty: 15, recovery: 'Réclamation annuelle' },
  ES: { flag: '🇪🇸', country: 'Espagne', legal: 19, treaty: 15, recovery: 'Réclamation annuelle' },
  GB: { flag: '🇬🇧', country: 'Royaume-Uni', legal: 0, treaty: 0, recovery: 'Sans objet' },
  LU: { flag: '🇱🇺', country: 'Luxembourg', legal: 15, treaty: 15, recovery: 'Sans objet' },
  IE: { flag: '🇮🇪', country: 'Irlande', legal: 25, treaty: 15, recovery: 'Exonération à la source' },
  CA: { flag: '🇨🇦', country: 'Canada', legal: 25, treaty: 15, recovery: 'Formulaire NR301' },
  BE: { flag: '🇧🇪', country: 'Belgique', legal: 30, treaty: 15, recovery: 'Réclamation annuelle' },
  SE: { flag: '🇸🇪', country: 'Suède', legal: 30, treaty: 15, recovery: 'Réclamation annuelle' },
  DK: { flag: '🇩🇰', country: 'Danemark', legal: 27, treaty: 15, recovery: 'Réclamation annuelle' },
  NO: { flag: '🇳🇴', country: 'Norvège', legal: 25, treaty: 15, recovery: 'Réclamation annuelle' },
  FI: { flag: '🇫🇮', country: 'Finlande', legal: 30, treaty: 15, recovery: 'Réclamation annuelle' },
  AT: { flag: '🇦🇹', country: 'Autriche', legal: 27.5, treaty: 15, recovery: 'Réclamation annuelle' },
  PT: { flag: '🇵🇹', country: 'Portugal', legal: 28, treaty: 15, recovery: 'Réclamation annuelle' },
  JP: { flag: '🇯🇵', country: 'Japon', legal: 20.42, treaty: 10, recovery: 'Formulaire 17' },
  AU: { flag: '🇦🇺', country: 'Australie', legal: 30, treaty: 15, recovery: 'Réclamation annuelle' },
};

const CONTINENT: Readonly<Record<string, string>> = {
  FR: 'Europe', DE: 'Europe', CH: 'Europe', NL: 'Europe', IT: 'Europe', ES: 'Europe',
  GB: 'Europe', LU: 'Europe', IE: 'Europe', BE: 'Europe', SE: 'Europe', DK: 'Europe',
  NO: 'Europe', FI: 'Europe', AT: 'Europe', PT: 'Europe',
  US: 'Amérique du Nord', CA: 'Amérique du Nord',
  JP: 'Asie-Pacifique', AU: 'Asie-Pacifique',
};

/* Le taux conventionnel dépend du couple (résidence du bénéficiaire, pays de source) : ces
   trois résidences bénéficient d'une convention plus favorable que le barème par défaut. */
const TREATY_OVERRIDES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  LU: { CH: 15, DE: 15, US: 15 },
  BE: { FR: 12.8, NL: 15 },
  CH: { US: 15, DE: 15 },
};

export interface ResidenceOption {
  readonly value: string;
  readonly label: string;
  /** Icône du registre Material, employée par le seul statut du titulaire — le pays, lui,
      porte déjà son drapeau dans son libellé. */
  readonly icon?: string;
}

export const RESIDENCES: readonly ResidenceOption[] = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'BE', label: '🇧🇪 Belgique' },
  { value: 'LU', label: '🇱🇺 Luxembourg' },
  { value: 'CH', label: '🇨🇭 Suisse' },
];

/* Les trois statuts se distinguent sur deux axes : la résidence et la nature du titulaire.
   Les icônes suivent cette lecture — le foyer pour le résident, le globe pour celui qui est
   imposé ailleurs, la carte d'identification pour la personne morale. */
export const HOLDER_STATUS: readonly ResidenceOption[] = [
  { value: 'resident', label: 'Résident fiscal — personne physique', icon: 'home' },
  { value: 'nonres', label: 'Non-résident', icon: 'globe' },
  { value: 'company', label: 'Personne morale', icon: 'id-card' },
];

/** Le barème officiel vu depuis un pays de résidence, groupé par continent puis par nom. */
export function ratesForResidence(residence: string): readonly WithholdingRate[] {
  const over = TREATY_OVERRIDES[residence] ?? {};
  return Object.keys(BASE)
    .map((code) => {
      const b = BASE[code];
      return {
        code,
        flag: b.flag,
        country: b.country,
        continent: CONTINENT[code] ?? 'Autres',
        legal: b.legal,
        treaty: over[code] ?? b.treaty,
        recovery: b.recovery,
      };
    })
    .sort((a, b) => {
      const ia = CONTINENT_ORDER.indexOf(a.continent);
      const ib = CONTINENT_ORDER.indexOf(b.continent);
      if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return a.country.localeCompare(b.country, 'fr');
    });
}

/** Règles de suspens : affichées telles quelles, l'écran ne les rend pas modifiables. */
export const SUSPENSE_RULES: readonly { label: string; value: string; hint: string }[] = [
  { label: 'Comptabilisation de la position', value: 'Date de négociation', hint: "L'actif entre au bilan le jour de la transaction" },
  { label: 'Comptabilisation des espèces', value: 'Date de règlement', hint: 'Le décaissement suit le dénouement effectif' },
  { label: "Compte de suspens à l'achat", value: 'PCG 464', hint: 'Dettes sur acquisitions de valeurs mobilières' },
  { label: 'Compte de suspens à la vente', value: 'PCG 465', hint: 'Créances sur cessions de valeurs mobilières' },
  { label: 'Alerte de retard de dénouement', value: 'J+1 après la date prévue', hint: 'Remonte dans les anomalies du tableau de bord' },
  { label: 'Jours ouvrés de référence', value: 'Calendrier de la place', hint: 'Le délai se compte sur les jours ouvrés du MIC' },
];

/** Codes de repli exigés à la saisie, hors marché réglementé. */
export const ISO_RULES: readonly { code: string; label: string; hint: string }[] = [
  { code: 'XOFF', label: 'Hors marché réglementé', hint: 'Transactions négociées de gré à gré, sans place de cotation' },
  { code: 'XXXX', label: 'Place inconnue', hint: "Valeur de repli quand la place n'est pas renseignée à la saisie" },
];

/** Groupes proposés pour la page d'accueil, calqués sur les sections du menu. */
export const HOME_GROUPS: readonly { label: string; items: readonly string[] }[] = [
  { label: 'Général', items: ['Accueil'] },
  { label: 'Gestion', items: ['Tableau de bord', 'Comptes', 'Positions', 'Titres', 'Opérations', 'Trésorerie', 'Transactions', 'Comptabilité', 'Documents'] },
  { label: 'Marché', items: ['Cours marché', 'Échéances', 'Calendrier'] },
  { label: 'Administration', items: ['Rapports', 'Paramètres'] },
];

/** Pourcentage à la française : trois décimales seulement quand le taux en a. */
export function pct(v: number): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: v % 1 ? 3 : 2, maximumFractionDigits: 3 }) + ' %';
}

/** Saisie à la française (virgule, espaces) vers nombre. */
export function parseRate(raw: string | number): number {
  return Number(String(raw).replace(/\s/g, '').replace(',', '.'));
}
