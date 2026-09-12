/**
 * Référentiels de la gestion documentaire — portés de `Documents.dc.html`.
 *
 * Deux axes distincts que le vocabulaire courant confond : la **nature** dit ce que le document
 * est (mandat, KYC, facture…), le **type** dit sous quelle forme on le détient (original, copie
 * certifiée, numérisation…). Les deux sont saisis séparément et figurent séparément en
 * métadonnées.
 */

export interface Option {
  readonly value: string;
  readonly label: string;
}

/** Nature du document. */
export const TYPES: readonly Option[] = [
  { value: 'mandat', label: 'Convention de mandat' },
  { value: 'kyc', label: 'Dossier KYC' },
  { value: 'cni', label: "Carte d'identité (CNI)" },
  { value: 'passeport', label: 'Passeport' },
  { value: 'domicile', label: 'Justificatif de domicile' },
  { value: 'facture', label: 'Facture' },
  { value: 'releve', label: 'Relevé bancaire' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'procuration', label: 'Procuration' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'reporting', label: 'Reporting client' },
  { value: 'ordre', label: "Ordre / confirmation d'exécution" },
  { value: 'juridique', label: 'Pièce juridique' },
  { value: 'compta', label: 'Pièce comptable' },
];

/** Forme sous laquelle la pièce est détenue. */
export const FORMS: readonly Option[] = [
  { value: 'original', label: 'Original' },
  { value: 'copie', label: 'Copie simple' },
  { value: 'certifiee', label: 'Copie certifiée conforme' },
  { value: 'duplicata', label: 'Duplicata' },
  { value: 'scan', label: "Numérisation d'original" },
  { value: 'electronique', label: 'Original électronique signé' },
];

export const FOLDERS: readonly Option[] = [
  { value: 'BGM-004', label: 'Balanced Growth — BGM-004' },
  { value: 'INP-011', label: 'Income & Preservation — INP-011' },
  { value: 'GLG-002', label: 'Global Growth — GLG-002' },
  { value: 'GEN', label: 'Dossier général' },
];

export const ACCESS_OPTIONS: readonly Option[] = [
  { value: 'interne', label: 'Interne — équipe de gestion' },
  { value: 'client', label: 'Partagé avec le client' },
  { value: 'restreint', label: 'Restreint — conformité' },
];

export const RETENTION_OPTIONS: readonly Option[] = [
  { value: '5', label: '5 ans' },
  { value: '10', label: '10 ans' },
  { value: 'perm', label: 'Illimitée' },
];

export const SOURCE_OPTIONS: readonly Option[] = [
  { value: 'upload', label: 'Dépôt manuel' },
  { value: 'mail', label: 'Boîte e-mail dédiée' },
  { value: 'scan', label: 'Numérisation' },
  { value: 'flux', label: 'Flux dépositaire' },
];

export type DocState = 'draft' | 'review' | 'valid' | 'archived';

export interface StateDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
}

export const STATES: Readonly<Record<DocState, StateDef>> = {
  draft: { label: 'Brouillon', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
  review: { label: 'À revoir', bg: 'rgba(180,83,9,0.10)', fg: 'var(--ink-warn-2)' },
  valid: { label: 'Validé', bg: 'rgba(15,118,110,0.10)', fg: 'var(--ink-ok-2)' },
  archived: { label: 'Archivé', bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-600)' },
};

export const STATE_FILTER_OPTIONS: readonly Option[] = [
  { value: 'all', label: 'Tous les états' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'review', label: 'À revoir' },
  { value: 'valid', label: 'Validé' },
  { value: 'archived', label: 'Archivé' },
];

export interface DocVersion {
  readonly n: number;
  readonly date: string;
  readonly author: string;
  readonly note: string;
  readonly size: string;
}

export interface Doc {
  readonly id: string;
  readonly name: string;
  readonly file: string;
  readonly ext: string;
  readonly type: string;
  readonly form?: string;
  readonly folder: string;
  readonly state: DocState;
  readonly access: string;
  readonly tags: string;
  readonly issuer: string;
  readonly versions: readonly DocVersion[];
}

export const SEED_DOCS: readonly Doc[] = [
  {
    id: 'd1', name: 'Convention de mandat BGM-004', file: 'convention-mandat-bgm-004.pdf', ext: 'PDF',
    type: 'mandat', folder: 'BGM-004', state: 'valid', access: 'client', tags: 'mandat, signature, 2026', issuer: 'Client',
    versions: [
      { n: 1, date: '2026-02-11', author: 'F. Hoeppe', note: 'Version initiale', size: '1,2 Mo' },
      { n: 2, date: '2026-06-03', author: 'F. Hoeppe', note: 'Avenant profil de risque', size: '1,3 Mo' },
      { n: 3, date: '2026-08-14', author: 'A. Meyer', note: 'Annexe frais actualisée', size: '1,4 Mo' },
    ],
  },
  {
    id: 'd2', name: 'Dossier KYC — Meridian Family', file: 'kyc-meridian-family.pdf', ext: 'PDF',
    type: 'kyc', folder: 'GEN', state: 'review', access: 'restreint', tags: 'kyc, onboarding', issuer: 'Conformité',
    versions: [
      { n: 1, date: '2026-08-20', author: 'A. Meyer', note: 'Pièces collectées', size: '4,1 Mo' },
      { n: 2, date: '2026-08-28', author: 'A. Meyer', note: 'Justificatif de domicile ajouté', size: '4,6 Mo' },
    ],
  },
  {
    id: 'd3', name: 'Reporting trimestriel T2 2026', file: 'reporting-t2-2026.pdf', ext: 'PDF',
    type: 'reporting', folder: 'BGM-004', state: 'valid', access: 'client', tags: 'reporting, t2', issuer: 'Interne',
    versions: [{ n: 1, date: '2026-07-03', author: 'Interne', note: 'Édition automatique', size: '2,8 Mo' }],
  },
  {
    id: 'd4', name: 'Confirmations dépositaire — août', file: 'confirmations-aout-2026.xlsx', ext: 'XLSX',
    type: 'ordre', folder: 'GEN', state: 'review', access: 'interne', tags: 'ordres, dépositaire', issuer: 'Dépositaire',
    versions: [{ n: 1, date: '2026-08-29', author: 'Flux', note: 'Import automatique', size: '640 Ko' }],
  },
  {
    id: 'd5', name: 'Statuts Infrastructure Fund II', file: 'statuts-infra-ii.pdf', ext: 'PDF',
    type: 'juridique', folder: 'GLG-002', state: 'valid', access: 'interne', tags: 'juridique, fonds', issuer: 'Cranmore',
    versions: [
      { n: 1, date: '2025-11-04', author: 'Cranmore', note: 'Version initiale', size: '3,3 Mo' },
      { n: 2, date: '2026-05-19', author: 'Cranmore', note: 'Modification du règlement', size: '3,5 Mo' },
    ],
  },
  {
    id: 'd6', name: 'Grille tarifaire 2026', file: 'grille-tarifaire-2026.docx', ext: 'DOCX',
    type: 'compta', folder: 'GEN', state: 'draft', access: 'interne', tags: 'frais, tarifs', issuer: 'Interne',
    versions: [{ n: 1, date: '2026-08-25', author: 'F. Hoeppe', note: 'Brouillon de travail', size: '210 Ko' }],
  },
  {
    id: 'd7', name: 'Relevé client INP-011 — juillet', file: 'releve-inp-011-juillet.pdf', ext: 'PDF',
    type: 'reporting', folder: 'INP-011', state: 'archived', access: 'client', tags: 'relevé, juillet', issuer: 'Interne',
    versions: [{ n: 1, date: '2026-08-02', author: 'Interne', note: 'Édition automatique', size: '1,9 Mo' }],
  },
];

export type StepKey = 'file' | 'ocr' | 'ia' | 'class' | 'diff' | 'check';

export interface StepDef {
  readonly key: StepKey;
  readonly title: string;
  readonly hint: string;
}

export const STEPS: readonly StepDef[] = [
  { key: 'file', title: 'Fichier', hint: 'Dépôt et source' },
  { key: 'ocr', title: 'Analyse OCR', hint: 'Reconnaissance du texte' },
  { key: 'ia', title: 'Analyse IA', hint: 'Métadonnées proposées' },
  { key: 'class', title: 'Classement', hint: 'Type, dossier, mots-clés' },
  { key: 'diff', title: 'Diffusion', hint: 'Accès et conservation' },
  { key: 'check', title: 'Contrôle', hint: 'Récapitulatif' },
];

/** Résultats simulés de la reconnaissance de texte. */
export const OCR_STATS: readonly { label: string; value: string }[] = [
  { label: 'Pages traitées', value: '9 / 9' },
  { label: 'Qualité moyenne', value: '98,2 %' },
  { label: 'Langue détectée', value: 'Français' },
  { label: 'Caractères extraits', value: '18 402' },
  { label: 'Signatures détectées', value: '2' },
  { label: 'Tableaux détectés', value: '3' },
];

export const OCR_TEXT =
  'CONVENTION DE GESTION DISCRÉTIONNAIRE — Compte BGM-004\n' +
  'Entre les soussignés : le Client, ci-après dénommé « le Mandant », et la Société de gestion…\n' +
  'Article 3 — Profil de risque : équilibré. Allocation cible : actions 55 %, obligations 26 %…';

export type Confidence = 'high' | 'mid' | 'low';

export interface IaField {
  readonly label: string;
  readonly value: string;
  readonly conf: string;
  readonly level: Confidence;
}

/** Propositions simulées de l'analyse, avec leur niveau de confiance. */
export const IA_FIELDS: readonly IaField[] = [
  { label: 'Type de document', value: 'Convention de mandat', conf: '96 %', level: 'high' },
  { label: 'Dossier', value: 'Balanced Growth — BGM-004', conf: '92 %', level: 'high' },
  { label: "Date d'émission", value: '11/02/2026', conf: '88 %', level: 'high' },
  { label: 'Émetteur', value: 'Client — Cheval Blanc SCI', conf: '74 %', level: 'mid' },
  { label: 'Mots-clés', value: 'mandat, profil équilibré, signature', conf: '69 %', level: 'mid' },
  { label: 'Échéance', value: '11/02/2029', conf: '52 %', level: 'low' },
];

export const CONFIDENCE_TINT: Readonly<Record<Confidence, { bg: string; fg: string }>> = {
  high: { bg: 'rgba(15,118,110,0.12)', fg: 'var(--ink-ok-2)' },
  mid: { bg: 'rgba(180,83,9,0.12)', fg: 'var(--ink-warn-2)' },
  low: { bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' },
};

/** Largeurs des fausses lignes de texte de l'aperçu, en pourcentage. */
export const PREVIEW_LINES: readonly number[] = [96, 88, 92, 70, 84, 90, 62, 88, 46, 78, 84, 58];
export const VIEWER_LINES: readonly number[] = [96, 88, 92, 70, 84, 90, 62, 88, 46, 78, 84, 58, 74, 90];

/** Bornes du zoom, communes à l'aperçu encastré et à la visionneuse. */
export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.2;

export function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO vers jj/mm/aaaa. */
export function fr(s: string): string {
  const p = String(s).split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function typeLabel(v: string): string {
  return TYPES.find((x) => x.value === v)?.label ?? v;
}

export function formLabel(v: string): string {
  return FORMS.find((x) => x.value === v)?.label ?? v;
}

export function folderLabel(v: string): string {
  return FOLDERS.find((x) => x.value === v)?.label ?? v;
}

export function accessLabel(v: string): string {
  return ACCESS_OPTIONS.find((x) => x.value === v)?.label ?? v;
}

export function lastVersion(doc: Doc): DocVersion {
  return doc.versions[doc.versions.length - 1];
}

/** Brouillon vierge de l'assistant de saisie. */
export interface Draft {
  mode: 'file' | 'manual';
  file: string;
  title: string;
  reference: string;
  received: string;
  due: string;
  pages: string;
  source: string;
  type: string;
  form: string;
  folder: string;
  date: string;
  issuer: string;
  tags: string;
  access: string;
  retention: string;
  needsReview: boolean;
  notes: string;
  isNewVersion: boolean;
  parentId: string;
  versionNote: string;
}

export function blankDraft(): Draft {
  const today = isoToday();
  return {
    mode: 'file', file: '', title: '', reference: '', received: today, due: '', pages: '',
    source: 'upload', type: 'mandat', form: 'original', folder: 'BGM-004', date: today,
    issuer: '', tags: '', access: 'interne', retention: '10', needsReview: true, notes: '',
    isNewVersion: false, parentId: 'd1', versionNote: '',
  };
}
