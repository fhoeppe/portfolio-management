/**
 * Données statiques et fonctions pures portées depuis `Comptes.dc.html` (constantes avant
 * `renderVals()`, lignes ~996-1490 du prototype) : dataset des comptes clients, référentiels
 * (banques, brokers, devises, juridictions), tables de teinte par état, et la vérification
 * MOD-97 de l'IBAN.
 */

export interface AccountRule {
  readonly label: string;
  readonly value: number;
  readonly limit: number;
}

export interface AccountHolder {
  readonly name: string;
  readonly role: string;
  readonly detail: string;
  readonly kyc: string;
}

export interface AccountHistoryEvent {
  readonly date: string;
  readonly label: string;
  readonly detail: string;
  readonly actor: string;
}

export interface AccountFlag {
  readonly title: string;
  readonly detail: string;
  readonly level: 'warn' | 'info';
}

export type AccountState = 'active' | 'onboarding' | 'frozen' | 'closing';

export interface Account {
  readonly id: string;
  readonly client: string;
  readonly state: AccountState;
  readonly profile: string;
  readonly aum: number;
  readonly perf: number;
  readonly opened: string;
  readonly manager: string;
  readonly currency: string;
  readonly type: string;
  readonly domicile: string;
  readonly custodian: string;
  readonly fee: string;
  readonly horizon: string;
  readonly review: string;
  readonly risk: string;
  readonly mifid: string;
  readonly tax: string;
  readonly rules: readonly AccountRule[];
  readonly holders: readonly AccountHolder[];
  readonly history: readonly AccountHistoryEvent[];
  readonly flags: readonly AccountFlag[];
}

export const ACCOUNT_CASH: Record<string, { bank: string; flag: string; iban: string; currency: string; extra: number }> = {
  'BGM-004': { bank: 'Banque de Luxembourg', flag: '🇱🇺', iban: 'LU28 0019 4006 4475 0000', currency: 'EUR', extra: 1 },
  'INP-011': { bank: 'BGL BNP Paribas', flag: '🇱🇺', iban: 'LU12 0010 2345 6789 4471', currency: 'EUR', extra: 0 },
  'GLG-002': { bank: '', flag: '', iban: '', currency: 'USD', extra: 0 },
  'BGM-002': { bank: 'Spuerkeess', flag: '🇱🇺', iban: 'LU45 0021 1188 4416 0000', currency: 'EUR', extra: 0 },
  'INP-008': { bank: 'Banque Raiffeisen', flag: '🇱🇺', iban: 'LU63 0099 7800 1042 0000', currency: 'EUR', extra: 0 },
  'GLG-005': { bank: 'ING Luxembourg', flag: '🇱🇺', iban: 'LU77 0141 9022 3355 0000', currency: 'EUR', extra: 2 },
};

export const ACCOUNTS: readonly Account[] = [
  {
    id: 'BGM-004', client: 'Cheval Blanc SCI', state: 'active', profile: 'Équilibré',
    aum: 486.2, perf: 8.94, opened: '11/02/2026', manager: 'F. Hoeppe', currency: 'EUR',
    type: 'Gestion discrétionnaire', domicile: 'Luxembourg', custodian: 'Banque dépositaire LU',
    fee: '0,85 % annuel · palier dégressif', horizon: '8 ans', review: '15/09/2026',
    risk: 'Modéré (4 / 7)', mifid: 'Client professionnel', tax: 'Résident LU',
    rules: [
      { label: 'Actions', value: 57.3, limit: 60 },
      { label: 'Obligations', value: 25.4, limit: 45 },
      { label: 'Alternatifs', value: 13.1, limit: 20 },
      { label: 'Illiquide', value: 9.0, limit: 20 },
      { label: 'Concentration par émetteur', value: 4.1, limit: 5 },
    ],
    holders: [
      { name: 'Cheval Blanc SCI', role: 'Titulaire', detail: 'Personne morale · RCS B221844', kyc: 'KYC à jour' },
      { name: 'Élise Marchand', role: 'Représentante légale', detail: 'Gérante · pouvoir illimité', kyc: 'KYC à jour' },
      { name: 'Paul Marchand', role: 'Mandataire', detail: 'Consultation seule', kyc: 'KYC à jour' },
      { name: 'Cabinet Verrières', role: 'Conseil fiscal', detail: 'Destinataire des reportings', kyc: 'Hors périmètre' },
    ],
    history: [
      { date: '28/08', label: 'Avenant profil de risque signé', detail: 'Passage de prudent à équilibré, allocation cible révisée', actor: 'F. Hoeppe' },
      { date: '14/08', label: 'Annexe frais actualisée', detail: 'Version 3 du document de convention', actor: 'A. Meyer' },
      { date: '03/07', label: 'Relevé trimestriel envoyé', detail: 'T2 2026 — accusé de réception client', actor: 'Automatique' },
      { date: '11/02', label: 'Ouverture du compte', detail: 'Apport initial de 452,0 M€', actor: 'F. Hoeppe' },
    ],
    flags: [
      { title: 'Bande actions dépassée', detail: '57,3 % contre 55 % de cible ; rééquilibrage à instruire avant le 05/09.', level: 'warn' },
      { title: 'Revue annuelle à programmer', detail: 'Entretien de revue prévu le 15/09/2026, convocation non envoyée.', level: 'info' },
      { title: 'Excédent de trésorerie', detail: '8,6 % contre 5 % de cible.', level: 'info' },
    ],
  },
  {
    id: 'INP-011', client: 'Fondation Ravel', state: 'active', profile: 'Prudent',
    aum: 212.7, perf: 4.12, opened: '04/09/2023', manager: 'A. Meyer', currency: 'EUR',
    type: 'Gestion discrétionnaire', domicile: 'Luxembourg', custodian: 'Banque dépositaire LU',
    fee: '0,65 % annuel', horizon: '12 ans', review: '04/09/2026',
    risk: 'Faible (2 / 7)', mifid: 'Client professionnel', tax: 'Exonéré — fondation',
    rules: [
      { label: 'Actions', value: 28.4, limit: 35 },
      { label: 'Obligations', value: 61.2, limit: 75 },
      { label: 'Alternatifs', value: 4.1, limit: 10 },
      { label: 'Illiquide', value: 2.0, limit: 10 },
      { label: 'Concentration par émetteur', value: 3.2, limit: 4 },
    ],
    holders: [
      { name: 'Fondation Ravel', role: 'Titulaire', detail: "Fondation d'utilité publique", kyc: 'KYC à jour' },
      { name: "Conseil d'administration", role: 'Organe décisionnaire', detail: 'Double signature requise', kyc: 'KYC à jour' },
      { name: 'Marc Devaux', role: 'Trésorier', detail: 'Interlocuteur principal', kyc: 'À renouveler' },
    ],
    history: [
      { date: '20/08', label: 'Reporting semestriel validé', detail: 'Présenté au conseil du 20/08', actor: 'A. Meyer' },
      { date: '02/07', label: 'Virement de dotation reçu', detail: '+12,0 M€ affectés au sleeve obligataire', actor: 'Back office' },
      { date: '04/09/23', label: 'Ouverture du compte', detail: 'Apport initial de 180,0 M€', actor: 'A. Meyer' },
    ],
    flags: [
      { title: 'KYC trésorier à renouveler', detail: "Pièce d'identité expirée depuis le 12/08 ; relance envoyée.", level: 'warn' },
      { title: 'Revue annuelle proche', detail: 'Échéance contractuelle le 04/09/2026.', level: 'info' },
    ],
  },
  {
    id: 'GLG-002', client: 'Meridian Family Office', state: 'onboarding', profile: 'Dynamique',
    aum: 0, perf: 0, opened: '—', manager: 'F. Hoeppe', currency: 'USD',
    type: 'Gestion discrétionnaire', domicile: 'Luxembourg', custodian: 'À désigner',
    fee: '0,95 % annuel · à confirmer', horizon: '10 ans', review: '—',
    risk: 'Élevé (6 / 7)', mifid: 'Client professionnel', tax: 'Non-résident',
    rules: [
      { label: 'Actions', value: 0, limit: 85 },
      { label: 'Obligations', value: 0, limit: 30 },
      { label: 'Alternatifs', value: 0, limit: 30 },
      { label: 'Illiquide', value: 0, limit: 25 },
      { label: 'Concentration par émetteur', value: 0, limit: 7 },
    ],
    holders: [
      { name: 'Meridian Holdings Ltd', role: 'Titulaire', detail: 'Structure faîtière', kyc: 'En cours' },
      { name: 'Sarah Meridian', role: 'Bénéficiaire effectif', detail: 'Participation 62 %', kyc: 'En cours' },
      { name: 'Jonathan Meridian', role: 'Bénéficiaire effectif', detail: 'Participation 38 %', kyc: 'En cours' },
    ],
    history: [
      { date: '28/08', label: 'Justificatif de domicile reçu', detail: 'Dossier KYC version 2', actor: 'A. Meyer' },
      { date: '20/08', label: 'Convention envoyée à la signature', detail: 'En attente de retour signé', actor: 'F. Hoeppe' },
      { date: '12/08', label: 'Entrée en relation initiée', detail: 'Réunion de cadrage, profil dynamique retenu', actor: 'F. Hoeppe' },
    ],
    flags: [
      { title: 'Dossier KYC incomplet', detail: 'Vérification des bénéficiaires effectifs en cours ; ouverture bloquée.', level: 'warn' },
      { title: 'Dépositaire à désigner', detail: 'Choix à arbitrer avant le premier apport.', level: 'warn' },
      { title: 'Convention non signée', detail: 'Retour client attendu avant le 05/09.', level: 'info' },
    ],
  },
  {
    id: 'BGM-002', client: 'Hoffmann Patrimoine', state: 'active', profile: 'Équilibré',
    aum: 94.5, perf: 7.61, opened: '19/06/2024', manager: 'A. Meyer', currency: 'EUR',
    type: 'Gestion conseillée', domicile: 'Luxembourg', custodian: 'Banque dépositaire LU',
    fee: '0,55 % annuel + commissions', horizon: '6 ans', review: '19/06/2027',
    risk: 'Modéré (4 / 7)', mifid: 'Client de détail', tax: 'Résident LU',
    rules: [
      { label: 'Actions', value: 52.8, limit: 60 },
      { label: 'Obligations', value: 33.4, limit: 50 },
      { label: 'Alternatifs', value: 8.6, limit: 15 },
      { label: 'Illiquide', value: 1.2, limit: 5 },
      { label: 'Concentration par émetteur', value: 4.8, limit: 5 },
    ],
    holders: [
      { name: 'Klaus Hoffmann', role: 'Titulaire', detail: 'Personne physique', kyc: 'KYC à jour' },
      { name: 'Ingrid Hoffmann', role: 'Co-titulaire', detail: 'Compte joint avec solidarité', kyc: 'KYC à jour' },
    ],
    history: [
      { date: '25/08', label: 'Recommandation transmise', detail: 'Réduction du sleeve immobilier coté', actor: 'A. Meyer' },
      { date: '30/06', label: "Test d'adéquation actualisé", detail: 'Profil confirmé équilibré', actor: 'Conformité' },
    ],
    flags: [
      { title: 'Concentration proche de la limite', detail: '4,8 % contre une limite de 5 % sur un émetteur.', level: 'warn' },
      { title: 'Client de détail', detail: "Obligations d'information renforcées à chaque recommandation.", level: 'info' },
    ],
  },
  {
    id: 'INP-008', client: 'Succession Lentz', state: 'frozen', profile: 'Prudent',
    aum: 38.9, perf: 1.84, opened: '07/03/2021', manager: 'F. Hoeppe', currency: 'EUR',
    type: 'Gestion discrétionnaire', domicile: 'Luxembourg', custodian: 'Banque dépositaire LU',
    fee: '0,60 % annuel', horizon: 'Indéterminé', review: 'Suspendue',
    risk: 'Faible (2 / 7)', mifid: 'Client de détail', tax: 'Succession en cours',
    rules: [
      { label: 'Actions', value: 12.1, limit: 20 },
      { label: 'Obligations', value: 74.6, limit: 90 },
      { label: 'Alternatifs', value: 0, limit: 0 },
      { label: 'Illiquide', value: 0, limit: 0 },
      { label: 'Concentration par émetteur', value: 2.4, limit: 4 },
    ],
    holders: [
      { name: 'Indivision Lentz', role: 'Titulaire', detail: 'Trois héritiers · notaire mandaté', kyc: 'Gelé' },
      { name: 'Me Fabre, notaire', role: 'Mandataire', detail: 'Instructions exclusives', kyc: 'KYC à jour' },
    ],
    history: [
      { date: '12/08', label: 'Gel des mouvements confirmé', detail: 'Sur instruction du notaire, opérations suspendues', actor: 'Conformité' },
      { date: '05/08', label: 'Déclaration de succession reçue', detail: 'Pièce déposée dans le dossier', actor: 'Back office' },
    ],
    flags: [
      { title: 'Compte gelé', detail: "Aucun ordre ni virement possible jusqu'au règlement de la succession.", level: 'warn' },
      { title: 'Frais maintenus', detail: 'La commission de gestion continue de courir sur l\'encours.', level: 'info' },
    ],
  },
  {
    id: 'GLG-005', client: 'Atlas Industries SA', state: 'closing', profile: 'Dynamique',
    aum: 21.4, perf: -1.32, opened: '22/01/2022', manager: 'A. Meyer', currency: 'EUR',
    type: 'Gestion discrétionnaire', domicile: 'Luxembourg', custodian: 'Banque dépositaire LU',
    fee: '0,80 % annuel', horizon: 'Clôture au 30/09/2026', review: '—',
    risk: 'Élevé (6 / 7)', mifid: 'Client professionnel', tax: 'Résident LU',
    rules: [
      { label: 'Actions', value: 18.2, limit: 85 },
      { label: 'Obligations', value: 6.4, limit: 30 },
      { label: 'Alternatifs', value: 0, limit: 30 },
      { label: 'Illiquide', value: 0, limit: 25 },
      { label: 'Concentration par émetteur', value: 1.8, limit: 7 },
    ],
    holders: [
      { name: 'Atlas Industries SA', role: 'Titulaire', detail: 'Personne morale · RCS B118420', kyc: 'KYC à jour' },
      { name: 'Direction financière', role: 'Mandataire', detail: 'Deux signataires habilités', kyc: 'KYC à jour' },
    ],
    history: [
      { date: '26/08', label: 'Programme de liquidation lancé', detail: 'Cession progressive des lignes actions', actor: 'A. Meyer' },
      { date: '18/08', label: 'Résiliation notifiée', detail: 'Préavis contractuel de 30 jours', actor: 'Client' },
    ],
    flags: [
      { title: 'Clôture au 30/09/2026', detail: 'Solde à transférer sur le compte désigné par le client.', level: 'warn' },
      { title: 'Performance négative sur la période', detail: '−1,32 % depuis janvier, liée aux cessions en cours.', level: 'info' },
    ],
  },
];

export const STATES: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: 'Actif', bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  onboarding: { label: 'En ouverture', bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  frozen: { label: 'Gelé', bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  closing: { label: 'En clôture', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

export const KYC: Record<string, { bg: string; fg: string }> = {
  'KYC à jour': { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  'À renouveler': { bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  'En cours': { bg: 'rgba(0,61,165,0.10)', fg: 'var(--ink-brand-2)' },
  'Gelé': { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  'Hors périmètre': { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

export interface LifeStageDef {
  readonly label: string;
  readonly detail: string;
  readonly actor: string;
  readonly docs: string;
}

export const STAGES: readonly LifeStageDef[] = [
  { label: 'Prise de contact', detail: 'Origine de la relation, besoins et patrimoine à financer', actor: 'Gérant', docs: 'Fiche de premier contact' },
  { label: 'Cadrage et proposition', detail: "Objectifs, horizon, contraintes et proposition de gestion", actor: 'Gérant', docs: "Proposition d'investissement" },
  { label: 'Identification KYC', detail: 'Titulaires, mandataires et bénéficiaires effectifs identifiés', actor: 'Conformité', docs: "Pièces d'identité, justificatif de domicile, RCS" },
  { label: 'Origine des fonds et sanctions', detail: 'Provenance du patrimoine, criblage listes et PPE', actor: 'Conformité', docs: "Attestation d'origine des fonds" },
  { label: 'Profil de risque et adéquation', detail: "Questionnaire, classification MiFID et test d'adéquation", actor: 'Gérant et conformité', docs: "Questionnaire signé, rapport d'adéquation" },
  { label: 'Convention et tarification', detail: 'Mandat, annexe frais, allocation cible et limites', actor: 'Direction', docs: 'Convention de gestion, annexe frais' },
  { label: 'Ouverture des comptes', detail: 'Comptes espèces et titres ouverts chez le dépositaire', actor: 'Back office', docs: 'Ouverture dépositaire, mandat de conservation' },
  { label: 'Apport initial et investissement', detail: "Réception des avoirs et mise en place de l'allocation", actor: 'Gérant et back office', docs: "Avis d'apport, ordres initiaux" },
  { label: 'Vie courante', detail: 'Gestion, exécution, contrôle des limites et reporting périodique', actor: 'Gérant', docs: 'Relevés, reportings trimestriels' },
  { label: 'Revue périodique et actualisation', detail: 'Revue annuelle du profil, du KYC et de l\'adéquation', actor: 'Gérant et conformité', docs: 'Compte rendu de revue, KYC actualisé' },
  { label: 'Événements de vie', detail: 'Avenants, changement de profil, gel, succession ou transfert', actor: 'Conformité', docs: 'Avenants, instructions notariales' },
  { label: 'Résiliation et liquidation', detail: 'Préavis, cession des lignes et arrêté des frais', actor: 'Gérant', docs: 'Lettre de résiliation, arrêté de compte' },
  { label: 'Clôture et archivage', detail: 'Transfert du solde, clôture dépositaire et archivage légal', actor: 'Back office', docs: 'Attestation de clôture, dossier archivé' },
];

export interface LifePhaseDef {
  readonly label: string;
  readonly from: number;
  readonly upTo: number;
}

export const PHASES: readonly LifePhaseDef[] = [
  { label: 'Entrée en relation', from: 0, upTo: 1 },
  { label: 'Conformité', from: 2, upTo: 4 },
  { label: 'Contractualisation', from: 5, upTo: 5 },
  { label: 'Ouverture', from: 6, upTo: 7 },
  { label: 'Vie courante', from: 8, upTo: 10 },
  { label: 'Sortie', from: 11, upTo: 12 },
];

/** Étapes franchies hors de la progression principale (événements de vie déjà survenus). */
export const LIFE_EXTRA_DONE: Record<string, readonly number[]> = {
  'BGM-004': [10],
  'INP-011': [10],
  'BGM-002': [10],
  'INP-008': [10],
  'GLG-005': [10],
};

export const REACHED: Record<string, number> = { onboarding: 2, active: 9, frozen: 10, closing: 11 };

export const LIFE_DATES: Record<string, readonly string[]> = {
  'BGM-004': ['02/12/2025', '18/12/2025', '15/01/2026', '22/01/2026', '28/01/2026', '09/02/2026', '10/02/2026', '11/02/2026', 'Depuis le 11/02/2026', '15/09/2026', "28/08/2026 · avenant profil", '—', '—'],
  'INP-011': ['12/06/2023', '04/07/2023', '02/08/2023', '10/08/2023', '22/08/2023', '30/08/2023', '01/09/2023', '04/09/2023', 'Depuis le 04/09/2023', '04/09/2026', '02/07/2026 · dotation reçue', '—', '—'],
  'GLG-002': ['22/07/2026', '05/08/2026', 'En cours depuis le 12/08/2026', 'En attente', '—', 'Envoyée le 20/08/2026', '—', '—', '—', '—', '—', '—', '—'],
  'BGM-002': ['14/03/2024', '02/04/2024', '02/05/2024', '10/05/2024', '28/05/2024', '12/06/2024', '17/06/2024', '19/06/2024', 'Depuis le 19/06/2024', '19/06/2027', "30/06/2026 · test d'adéquation", '—', '—'],
  'INP-008': ['02/11/2020', '20/11/2020', '15/01/2021', '25/01/2021', '02/02/2021', '25/02/2021', '02/03/2021', '07/03/2021', "Jusqu'au 12/08/2026", 'Suspendue', '12/08/2026 · gel sur instruction notariale', '—', '—'],
  'GLG-005': ['02/10/2021', '20/10/2021', '02/12/2021', '10/12/2021', '20/12/2021', '10/01/2022', '17/01/2022', '22/01/2022', "Jusqu'au 18/08/2026", '—', '18/08/2026 · résiliation notifiée', 'En cours depuis le 26/08/2026', 'Prévue le 30/09/2026'],
};

export function fr(v: number, d = 1): string {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function pct(v: number): string {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' %';
}
export function initials(name: string): string {
  return name.split(/[\s'’]+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

export const TODAY_ISO = (() => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
})();

export interface Broker {
  readonly label: string;
  readonly country: string;
  readonly flag: string;
  readonly place: string;
  readonly url: string;
}

export const BROKERS: readonly Broker[] = [
  { label: 'Degiro', country: 'Pays-Bas', flag: '🇳🇱', place: 'Amsterdam, Pays-Bas', url: 'https://www.degiro.fr' },
  { label: 'Saxo Bank', country: 'Danemark', flag: '🇩🇰', place: 'Copenhague, Danemark', url: 'https://www.home.saxo' },
  { label: 'Trade Republic', country: 'Allemagne', flag: '🇩🇪', place: 'Berlin, Allemagne', url: 'https://traderepublic.com' },
  { label: 'Scalable Capital', country: 'Allemagne', flag: '🇩🇪', place: 'Munich, Allemagne', url: 'https://de.scalable.capital' },
  { label: 'Comdirect', country: 'Allemagne', flag: '🇩🇪', place: 'Quickborn, Allemagne', url: 'https://www.comdirect.de' },
  { label: 'Consorsbank', country: 'Allemagne', flag: '🇩🇪', place: 'Nuremberg, Allemagne', url: 'https://www.consorsbank.de' },
  { label: 'Flatex', country: 'Allemagne', flag: '🇩🇪', place: 'Francfort-sur-le-Main, Allemagne', url: 'https://www.flatex.de' },
  { label: 'Baader Bank', country: 'Allemagne', flag: '🇩🇪', place: 'Unterschleißheim, Allemagne', url: 'https://www.baaderbank.de' },
  { label: 'DKB Broker', country: 'Allemagne', flag: '🇩🇪', place: 'Berlin, Allemagne', url: 'https://www.dkb.de' },
  { label: 'ING Deutschland', country: 'Allemagne', flag: '🇩🇪', place: 'Francfort-sur-le-Main, Allemagne', url: 'https://www.ing.de' },
  { label: 'Smartbroker+', country: 'Allemagne', flag: '🇩🇪', place: 'Berlin, Allemagne', url: 'https://www.smartbroker.de' },
  { label: 'Onvista Bank', country: 'Allemagne', flag: '🇩🇪', place: 'Francfort-sur-le-Main, Allemagne', url: 'https://www.onvista.de' },
  { label: 'Bourse Direct', country: 'France', flag: '🇫🇷', place: 'Paris, France', url: 'https://www.boursedirect.fr' },
  { label: 'Swissquote', country: 'Suisse', flag: '🇨🇭', place: 'Gland, Suisse', url: 'https://www.swissquote.com' },
  { label: 'Keytrade Bank', country: 'Belgique', flag: '🇧🇪', place: 'Bruxelles, Belgique', url: 'https://www.keytradebank.com' },
  { label: 'Banque de Luxembourg', country: 'Luxembourg', flag: '🇱🇺', place: 'Luxembourg-Ville, Luxembourg', url: 'https://www.banquedeluxembourg.com' },
  { label: 'Interactive Brokers Ireland', country: 'Irlande', flag: '🇮🇪', place: 'Dublin, Irlande', url: 'https://www.interactivebrokers.ie' },
  { label: 'Fineco Bank', country: 'Italie', flag: '🇮🇹', place: 'Milan, Italie', url: 'https://www.finecobank.com' },
  { label: 'Renta 4 Banco', country: 'Espagne', flag: '🇪🇸', place: 'Madrid, Espagne', url: 'https://www.r4.com' },
  { label: 'Nordnet', country: 'Suède', flag: '🇸🇪', place: 'Stockholm, Suède', url: 'https://www.nordnet.se' },
  { label: 'Hargreaves Lansdown', country: 'Royaume-Uni', flag: '🇬🇧', place: 'Bristol, Royaume-Uni', url: 'https://www.hl.co.uk' },
];

/** Contrôle IBAN — MOD-97 algorithm (ISO 7064, mod 97-10) : les quatre premiers caractères
 * sont reportés en fin, les lettres converties en chiffres, et le reste de la division par
 * 97 doit valoir 1. */
export function ibanCheck(raw: string | undefined): { state: 'empty' | 'ok' | 'bad'; message: string } {
  const v = String(raw || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (!v) return { state: 'empty', message: '' };
  if (!/^[A-Z]{2}[0-9]{2}[0-9A-Z]{6,30}$/.test(v)) {
    return { state: 'bad', message: 'Format invalide : deux lettres de pays, deux chiffres de clé, puis le numéro national.' };
  }
  const rearranged = v.slice(4) + v.slice(0, 4);
  let rest = 0;
  for (let i = 0; i < rearranged.length; i++) {
    const c = rearranged.charAt(i);
    const num = c >= '0' && c <= '9' ? c : String(c.charCodeAt(0) - 55);
    for (let k = 0; k < num.length; k++) rest = (rest * 10 + +num.charAt(k)) % 97;
  }
  if (rest !== 1) {
    const probe = v.slice(4) + v.slice(0, 2) + '00';
    let r2 = 0;
    for (let i = 0; i < probe.length; i++) {
      const c = probe.charAt(i);
      const num = c >= '0' && c <= '9' ? c : String(c.charCodeAt(0) - 55);
      for (let k = 0; k < num.length; k++) r2 = (r2 * 10 + +num.charAt(k)) % 97;
    }
    const expected = String(98 - r2).padStart(2, '0');
    return { state: 'bad', message: 'Clé de contrôle erronée : ' + v.slice(2, 4) + ' saisi, ' + expected + ' attendu.' };
  }
  return { state: 'ok', message: 'Clé de contrôle valide — MOD-97 algorithm (ISO 7064).' };
}

export interface BankRef {
  readonly label: string;
  readonly country: string;
  readonly flag: string;
}

export const BANKS: readonly BankRef[] = [
  { label: 'ABN AMRO', country: 'Pays-Bas', flag: '🇳🇱' },
  { label: 'Banca Intesa Sanpaolo', country: 'Italie', flag: '🇮🇹' },
  { label: 'Banco Santander', country: 'Espagne', flag: '🇪🇸' },
  { label: 'Bank of Ireland', country: 'Irlande', flag: '🇮🇪' },
  { label: "Banque et Caisse d'Épargne de l'État", country: 'Luxembourg', flag: '🇱🇺' },
  { label: 'Banque Internationale à Luxembourg', country: 'Luxembourg', flag: '🇱🇺' },
  { label: 'Belfius', country: 'Belgique', flag: '🇧🇪' },
  { label: 'BNP Paribas', country: 'France', flag: '🇫🇷' },
  { label: 'BNP Paribas Fortis', country: 'Belgique', flag: '🇧🇪' },
  { label: 'CaixaBank', country: 'Espagne', flag: '🇪🇸' },
  { label: 'Commerzbank', country: 'Allemagne', flag: '🇩🇪' },
  { label: 'Crédit Agricole', country: 'France', flag: '🇫🇷' },
  { label: 'Danske Bank', country: 'Danemark', flag: '🇩🇰' },
  { label: 'Deutsche Bank', country: 'Allemagne', flag: '🇩🇪' },
  { label: 'DNB Bank', country: 'Norvège', flag: '🇳🇴' },
  { label: 'Erste Group Bank', country: 'Autriche', flag: '🇦🇹' },
  { label: 'HSBC Continental Europe', country: 'France', flag: '🇫🇷' },
  { label: 'ING Bank', country: 'Pays-Bas', flag: '🇳🇱' },
  { label: 'KBC Bank', country: 'Belgique', flag: '🇧🇪' },
  { label: 'Millennium BCP', country: 'Portugal', flag: '🇵🇹' },
  { label: 'Nordea Bank', country: 'Finlande', flag: '🇫🇮' },
  { label: 'PKO Bank Polski', country: 'Pologne', flag: '🇵🇱' },
  { label: 'Rabobank', country: 'Pays-Bas', flag: '🇳🇱' },
  { label: 'Raiffeisen Bank International', country: 'Autriche', flag: '🇦🇹' },
  { label: 'Société Générale', country: 'France', flag: '🇫🇷' },
  { label: 'Spuerkeess', country: 'Luxembourg', flag: '🇱🇺' },
  { label: 'Swedbank', country: 'Suède', flag: '🇸🇪' },
  { label: 'UBS', country: 'Suisse', flag: '🇨🇭' },
  { label: 'UniCredit', country: 'Italie', flag: '🇮🇹' },
  { label: 'Zürcher Kantonalbank', country: 'Suisse', flag: '🇨🇭' },
].slice().sort((a, b) => a.label.localeCompare(b.label, 'fr'));

export const QUALITIES: readonly string[] = [
  'Co-titulaire',
  'Bénéficiaire effectif',
  'Mandataire',
  'Représentant légal',
  'Usufruitier',
  'Nu-propriétaire',
  'Tuteur ou curateur',
  'Personne de confiance',
];

export const FUND_ORIGINS: readonly string[] = [
  'Salaires et revenus professionnels',
  'Revenus locatifs',
  'Épargne constituée',
  "Cession d'actifs mobiliers",
  'Cession immobilière',
  "Cession d'entreprise",
  'Succession ou donation',
  'Dividendes et revenus de placement',
  'Indemnités et prestations',
  'Gains exceptionnels',
];

export interface HintedOption {
  readonly label: string;
  readonly hint: string;
}

export const ID_DOC_TYPES: readonly HintedOption[] = [
  { label: '—', hint: 'Aucun document renseigné' },
  { label: 'Passeport', hint: 'Document de voyage en cours de validité' },
  { label: "Carte nationale d'identité", hint: 'CNI en cours de validité' },
  { label: 'Titre de séjour', hint: 'Carte de résident ou permis de séjour' },
  { label: 'Permis de conduire', hint: 'Accepté en complément, non seul' },
  { label: 'Extrait RCS', hint: 'Personne morale : immatriculation' },
];

export const ACCOUNT_TYPES: readonly HintedOption[] = [
  { label: 'CTO', hint: 'Compte-titres ordinaire' },
  { label: 'PEA', hint: "Plan d'épargne en actions" },
];

export interface CurrencyRef {
  readonly code: string;
  readonly label: string;
  readonly flag: string;
  readonly zone: string;
}

export const CURRENCIES: readonly CurrencyRef[] = [
  { code: 'EUR', label: 'EUR — euro', flag: '🇪🇺', zone: 'Europe' },
  { code: 'CHF', label: 'CHF — franc suisse', flag: '🇨🇭', zone: 'Europe' },
  { code: 'CZK', label: 'CZK — couronne tchèque', flag: '🇨🇿', zone: 'Europe' },
  { code: 'DKK', label: 'DKK — couronne danoise', flag: '🇩🇰', zone: 'Europe' },
  { code: 'GBP', label: 'GBP — livre sterling', flag: '🇬🇧', zone: 'Europe' },
  { code: 'HUF', label: 'HUF — forint hongrois', flag: '🇭🇺', zone: 'Europe' },
  { code: 'ISK', label: 'ISK — couronne islandaise', flag: '🇮🇸', zone: 'Europe' },
  { code: 'NOK', label: 'NOK — couronne norvégienne', flag: '🇳🇴', zone: 'Europe' },
  { code: 'PLN', label: 'PLN — zloty polonais', flag: '🇵🇱', zone: 'Europe' },
  { code: 'RON', label: 'RON — leu roumain', flag: '🇷🇴', zone: 'Europe' },
  { code: 'SEK', label: 'SEK — couronne suédoise', flag: '🇸🇪', zone: 'Europe' },
  { code: 'CAD', label: 'CAD — dollar canadien', flag: '🇨🇦', zone: 'Amérique du Nord' },
  { code: 'USD', label: 'USD — dollar américain', flag: '🇺🇸', zone: 'Amérique du Nord' },
];

export interface JurisdictionRef {
  readonly label: string;
  readonly flag: string;
  readonly zone?: string;
}

export const JURISDICTIONS: readonly JurisdictionRef[] = [
  { label: 'Allemagne', flag: '🇩🇪' }, { label: 'Autriche', flag: '🇦🇹' }, { label: 'Belgique', flag: '🇧🇪' },
  { label: 'Bulgarie', flag: '🇧🇬' }, { label: 'Canada', flag: '🇨🇦', zone: 'Amérique du Nord' }, { label: 'Chypre', flag: '🇨🇾' },
  { label: 'Croatie', flag: '🇭🇷' }, { label: 'Danemark', flag: '🇩🇰' }, { label: 'Espagne', flag: '🇪🇸' },
  { label: 'Estonie', flag: '🇪🇪' }, { label: 'États-Unis', flag: '🇺🇸', zone: 'Amérique du Nord' }, { label: 'Finlande', flag: '🇫🇮' },
  { label: 'France', flag: '🇫🇷' }, { label: 'Grèce', flag: '🇬🇷' }, { label: 'Hongrie', flag: '🇭🇺' },
  { label: 'Irlande', flag: '🇮🇪' }, { label: 'Islande', flag: '🇮🇸' }, { label: 'Italie', flag: '🇮🇹' },
  { label: 'Lettonie', flag: '🇱🇻' }, { label: 'Liechtenstein', flag: '🇱🇮' }, { label: 'Lituanie', flag: '🇱🇹' },
  { label: 'Luxembourg', flag: '🇱🇺' }, { label: 'Malte', flag: '🇲🇹' }, { label: 'Norvège', flag: '🇳🇴' },
  { label: 'Pays-Bas', flag: '🇳🇱' }, { label: 'Pologne', flag: '🇵🇱' }, { label: 'Portugal', flag: '🇵🇹' },
  { label: 'République tchèque', flag: '🇨🇿' }, { label: 'Roumanie', flag: '🇷🇴' }, { label: 'Royaume-Uni', flag: '🇬🇧' },
  { label: 'Slovaquie', flag: '🇸🇰' }, { label: 'Slovénie', flag: '🇸🇮' }, { label: 'Suède', flag: '🇸🇪' },
  { label: 'Suisse', flag: '🇨🇭' },
];

export const FIELD_LABELS: Record<string, string> = {
  broker: 'Broker', jurisdiction: 'Juridiction', url: 'URL',
  accountType: 'Type de compte', currency: 'Devise de tenue', number: 'Numéro de compte',
  alias: 'Libellé du compte', opened: "Date d'ouverture",
  lastName: 'Nom du titulaire', firstName: 'Prénom du titulaire',
  idDocType: "Pièce d'identité",
  clientRef: "Numéro d'identité", domicile: 'Domiciliation', taxRegime: 'Régime fiscal',
  kycId: "Pièce d'identité", kycIdExpiry: 'Validité de la pièce', kycAddress: 'Justificatif de domicile',
  kycOrigin: 'Origine des fonds', kycPep: 'Personne politiquement exposée', kycLevel: 'Niveau de vigilance',
  closed: 'Date de fermeture', status: 'Statut',
  profile: 'Profil de risque', horizon: 'Horizon', fee: 'Tarification',
  dotation: 'Compte de dotation ou de destination', reason: 'Motif',
  target: 'Élément concerné', effect: "Date d'effet",
};

export const FIELD_HINTS: Record<string, string> = {
  broker: 'Degiro, Interactive Brokers…', jurisdiction: 'Pays du broker', url: 'https://…',
  accountType: 'CTO, PEA, assurance-vie…', currency: 'EUR, USD, CHF',
  number: "Chiffres uniquement, tel qu'ouvert chez le broker", alias: 'Unique pour le client',
  opened: 'Date du jour par défaut, pas de date future', closed: 'Vide tant que le compte est ouvert',
  lastName: 'Nom de famille', firstName: 'Prénom',
  idDocType: 'Type de document',
  clientRef: "Numéro d'identité", domicile: 'Luxembourg', taxRegime: 'Résident Luxembourg',
  kycId: 'Passeport LU-2019-448210', kycIdExpiry: 'AAAA-MM-JJ', kycAddress: 'Facture de moins de 3 mois',
  kycOrigin: "Salaires, cession d'actifs, succession…", kycPep: 'Non', kycLevel: 'Standard',
  dotation: 'IBAN ou référence du compte', reason: 'Motif invoqué',
  target: 'Profil, tarification, titulaires, broker…', effect: 'JJ/MM/AAAA',
};
