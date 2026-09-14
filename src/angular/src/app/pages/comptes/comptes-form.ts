/**
 * Logique de formulaire portée depuis `Comptes.dc.html` — `opDefs()` (lignes ~1688-1762),
 * `mapField`/`renderVals` (construction des champs dynamiques, lignes ~1805-2201), `createIssues()`
 * (lignes ~1623-1650) et la construction des groupes de récapitulatif (lignes ~2334-2450).
 *
 * Suit l'architecture « computeFields » déjà utilisée par `transactions-form.ts` : une fonction
 * pure qui associe une clé de champ + le contexte courant (opération, étape, formulaire) à sa
 * description de rendu (`AcField`), plutôt qu'un grand conditionnel inline dans le template.
 * Contrairement au prototype, aucune géométrie de positionnement n'est calculée ici : un vrai
 * `MatMenu` (voir `ac-select.ts`/`ac-multiselect.ts`) gère l'ancrage, le défilement et la
 * fermeture — `measureAnchor`/`comboGeo`/`measureCombo`/`openCombo` du prototype n'ont pas
 * d'équivalent porté.
 *
 * Champs volontairement non portés : `cashLabel`/`cashIban`/`cashCurrency`/`cashKind` ne
 * figurent dans AUCUNE liste `fields` de `opDefs()` (l'étape « Compte de liquidité » a
 * `fields: []`) — leurs branches dans `mapField` sont mortes, jamais atteintes par la boucle
 * `opFields`. Le compte de liquidité principal se saisit uniquement via le tableau `cashSelected`
 * (ligne 0 = compte principal), construit séparément ci-dessous dans `buildCashRows`.
 */

import {
  ACCOUNT_TYPES,
  ADDRESS_PROOF_TYPES,
  BANKS,
  BROKERS,
  CIVILITIES,
  CURRENCIES,
  FIELD_HINTS,
  FIELD_LABELS,
  FUND_ORIGINS,
  ID_DOC_TYPES,
  JURISDICTIONS,
  STREET_TYPES,
  TODAY_ISO,
  ibanCheck,
  type JurisdictionRef,
} from './comptes-data';

export type OpKind = 'create' | 'modify' | 'close';

export interface FormState {
  broker: string;
  jurisdiction: string;
  url: string;
  accountType: string;
  currency: string;
  number: string;
  alias: string;
  opened: string;
  closed: string;
  civility: string;
  lastName: string;
  firstName: string;
  streetNo: string;
  streetType: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  statusChoice?: string;
  clientRef: string;
  idDocType: string;
  domicile: string;
  taxRegime: string;
  kycId: string;
  idIssuer: string;
  idIssueDate: string;
  kycIdExpiry: string;
  kycAddress: string;
  addrRef: string;
  addrIssuer: string;
  addrIssueDate: string;
  addrExpiry: string;
  kycOrigin: string;
  fundsAmount: string;
  kycPep: string;
  kycLevel: string;
  cashLabel: string;
  cashIban: string;
  cashCurrency: string;
  profile: string;
  horizon: string;
  fee: string;
  dotation: string;
  reason: string;
  target: string;
  effect: string;
}

export function blankForm(): FormState {
  return {
    broker: '', jurisdiction: '', url: '',
    accountType: '', currency: 'EUR', number: '', alias: '',
    opened: TODAY_ISO, closed: '—', civility: '', lastName: '', firstName: '',
    streetNo: '', streetType: '', street: '', postalCode: '', city: '', country: '',
    clientRef: '', idDocType: '—', domicile: '', taxRegime: '',
    kycId: '', idIssuer: '', idIssueDate: '', kycIdExpiry: '',
    kycAddress: '', addrRef: '', addrIssuer: '', addrIssueDate: '', addrExpiry: '',
    kycOrigin: '', fundsAmount: '', kycPep: 'Non', kycLevel: 'Standard',
    cashLabel: '', cashIban: '', cashCurrency: 'EUR',
    profile: 'Équilibré', horizon: '8 ans', fee: '0,85 %',
    dotation: '', reason: '', target: '', effect: '',
  };
}

export interface CashEntry {
  readonly bank: string;
  readonly iban: string;
  readonly currency: string;
}

export interface CoHolder {
  readonly last: string;
  readonly first: string;
  readonly role: string;
}

// ---------------------------------------------------------------------------
// Définition des étapes par opération — opDefs()
// ---------------------------------------------------------------------------

export interface OpCheck {
  readonly label: string;
  readonly level: 'warn' | 'info';
}
export interface OpStepDef {
  readonly title: string;
  readonly hint: string;
  readonly fields: readonly string[];
  readonly checks: readonly OpCheck[];
}
export interface OpDef {
  readonly label: string;
  readonly hint: string;
  readonly next: string;
  readonly steps: readonly OpStepDef[];
}

export function opDefs(): Record<OpKind, OpDef> {
  return {
    create: {
      label: 'Création',
      hint: "Ouverture d'un nouveau compte : entrée en relation jusqu'à la première dotation.",
      next: 'Créer le compte',
      steps: [
        {
          title: 'Titulaires', hint: 'Titulaire principal, domiciliation, bénéficiaires',
          /* Deux rangées : la civilité et l'identité du titulaire d'abord, puis ce qui le
             rattache à un régime et à une pièce. Le statut ferme l'étape — « Projet » tant que
             le compte n'est pas créé. */
          fields: [
            'civility', 'lastName', 'firstName',
            'streetNo', 'streetType', 'street',
            'postalCode', 'city', 'country',
            'domicile', 'taxRegime', 'clientRef',
            'status',
          ],
          checks: [
            { label: 'La référence client principale identifie le titulaire dans tout le référentiel : les co-titulaires reçoivent une référence rattachée, dérivée de celle-ci.', level: 'warn' },
            { label: 'La domiciliation et le régime fiscal déterminent la retenue à la source appliquée aux dividendes et coupons.', level: 'info' },
            { label: 'Dossier KYC obligatoire pour chaque titulaire et bénéficiaire effectif.', level: 'warn' },
          ],
        },
        {
          title: 'KYC', hint: 'Pièces justificatives et vigilance',
          /* Une rangée par pièce exigée : à gauche sa nature, à droite ce qui la caractérise.
             L'ordre de déclaration est donc celui de la lecture, rangée par rangée — c'est lui
             qui remplit la grille, les colonnes de `SPAN_KYC` ne font que choisir le côté. */
          fields: [
            'idDocType', 'kycId', 'idIssuer', 'idIssueDate', 'kycIdExpiry',
            'kycAddress', 'addrRef', 'addrIssuer', 'addrIssueDate', 'addrExpiry',
            'kycOrigin', 'fundsAmount',
            'kycPep', 'kycLevel',
            'status',
          ],
          checks: [
            { label: "Aucun compte ne peut passer à l'état Actif sans dossier KYC complet : pièce d'identité en cours de validité, justificatif de domicile de moins de trois mois et origine des fonds documentée.", level: 'warn' },
            { label: 'Le statut de personne politiquement exposée impose une vigilance renforcée et une validation de la conformité.', level: 'warn' },
            { label: 'Le dossier est à renouveler à chaque expiration de pièce et à chaque revue périodique.', level: 'info' },
          ],
        },
        {
          /* Broker et compte titre ne faisaient qu'une décision : on n'ouvre pas un compte sans
             savoir chez qui, et le numéro comme la date d'ouverture sont ceux du broker. Les deux
             étapes se répondaient donc en aller-retour ; elles n'en font plus qu'une, en deux
             rangées — l'établissement, puis le compte ouvert chez lui. */
          title: 'Compte titre', hint: 'Établissement, type, devise, référence',
          fields: [
            'broker', 'jurisdiction', 'url',
            'accountType', 'currency', 'number',
            'alias', 'opened',
            'status',
          ],
          checks: [
            { label: 'La juridiction du broker détermine le régime fiscal et la retenue à la source applicable.', level: 'info' },
            { label: 'Le numéro de compte est purement numérique et doit correspondre exactement à celui ouvert chez le broker : il sert de clé de réconciliation.', level: 'warn' },
            { label: 'Le libellé du compte doit être unique parmi les comptes du même client : c\'est lui qui identifie le compte dans toute l\'application.', level: 'warn' },
            { label: "La date d'ouverture est celle du compte chez le broker, pas celle de la saisie.", level: 'info' },
          ],
        },
        {
          title: 'Compte de liquidité', hint: 'Compte bancaire externe rattaché',
          fields: [],
          checks: [
            { label: 'Tout compte titre est adossé à un compte de liquidité : il porte les mouvements d\'espèces, les dividendes encaissés et les frais.', level: 'info' },
            { label: 'La devise du compte espèces doit correspondre à la devise de tenue du compte titre, sauf compte multidevises.', level: 'warn' },
            { label: "L'IBAN est contrôlé par le MOD-97 algorithm (ISO 7064) : un signal rouge indique une clé erronée avant tout enregistrement.", level: 'info' },
          ],
        },
        {
          title: 'Contrôle', hint: 'Fermeture et statut',
          fields: ['closed', 'status'],
          checks: [
            { label: 'La date de fermeture reste vide (—) tant que le compte est ouvert.', level: 'info' },
            { label: 'La création du compte fixe son statut à Actif ; jusque-là il reste en Projet ou En ouverture.', level: 'info' },
          ],
        },
      ],
    },
    modify: {
      label: 'Modification',
      hint: 'Avenant sur un compte existant : profil, tarification, titulaires ou dépositaire.',
      next: "Enregistrer l'avenant",
      steps: [
        { title: 'Objet', hint: 'Élément modifié', fields: ['target', 'reason'], checks: [{ label: 'Tout changement de profil requiert un avenant signé.', level: 'warn' }] },
        { title: 'Nouvelles valeurs', hint: 'Paramètres révisés', fields: ['alias', 'profile', 'fee', 'horizon'], checks: [{ label: "Les bandes d'allocation sont recalculées à la date d'effet.", level: 'info' }] },
        { title: 'Contrôle', hint: "Date d'effet et traçabilité", fields: ['effect'], checks: [{ label: 'La modification est inscrite à l\'historique de la relation.', level: 'info' }] },
      ],
    },
    close: {
      label: 'Clôture',
      hint: 'Résiliation et sortie de relation : liquidation, transfert du solde, archivage.',
      next: 'Engager la clôture',
      steps: [
        { title: 'Motif', hint: 'Origine de la résiliation', fields: ['reason', 'effect'], checks: [{ label: 'Préavis contractuel de 30 jours à respecter.', level: 'warn' }] },
        {
          title: 'Liquidation', hint: 'Positions et opérations en cours', fields: ['target'],
          checks: [
            { label: 'Les opérations sur titres en cours doivent être dénouées avant la clôture.', level: 'warn' },
            { label: 'Les frais de gestion courent jusqu\'à la date d\'effet.', level: 'info' },
          ],
        },
        { title: 'Transfert', hint: 'Compte de destination', fields: ['dotation'], checks: [{ label: 'Coordonnées du compte de destination à faire confirmer par le client.', level: 'warn' }] },
        { title: 'Contrôle', hint: 'Archivage', fields: ['closed', 'status'], checks: [{ label: 'Le compte passe à l\'état Clôturé, les pièces sont archivées pour la durée légale.', level: 'info' }] },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Champs dynamiques — buildField (mapField du prototype)
// ---------------------------------------------------------------------------

export interface AcSelectOption {
  readonly value: string;
  readonly label: string;
  readonly place?: string;
  readonly flag?: string;
  /** Icône du registre SVG, pour les listes qui n'ont pas de drapeau à montrer. */
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly asBadge?: boolean;
  readonly badgeBg?: string;
  readonly badgeFg?: string;
}
export interface AcSelectGroup {
  readonly heading: string;
  readonly flag: string;
  readonly options: readonly AcSelectOption[];
}

export type AcField =
  | { readonly kind: 'combo'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly leadFlag: string; readonly leadIcon?: string; readonly place: string; readonly asBadge: boolean; readonly badgeBg: string; readonly badgeFg: string; readonly checkOk: boolean; readonly checkBad: boolean; readonly checkMessage: string; readonly groups: readonly AcSelectGroup[] }
  | { readonly kind: 'chips'; readonly key: string; readonly label: string; readonly span: string; readonly chips: readonly string[]; readonly options: readonly AcSelectOption[] }
  | { readonly kind: 'badge'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly badgeBg: string; readonly badgeFg: string; readonly hint: string }
  | { readonly kind: 'url'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly placeholder: string; readonly href: string; readonly valid: boolean }
  | { readonly kind: 'iban'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly ok: boolean; readonly bad: boolean; readonly message: string }
  | { readonly kind: 'dateLocked'; readonly key: string; readonly label: string; readonly span: string; readonly lockedValue: string; readonly hint: string }
  | { readonly kind: 'dateOpen'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly max: string }
  | { readonly kind: 'input'; readonly key: string; readonly label: string; readonly span: string; readonly value: string; readonly placeholder: string };

/* Grille à quatre colonnes. Rangée 1 : civilité étroite, puis nom et prénom. Rangée 2 : les
   quatre champs de rattachement, une colonne chacun. Le statut occupe sa propre rangée — c'est
   une conséquence de la saisie, pas un champ de plus à remplir. */
/* Six colonnes et non quatre : à quatre, un champ ne pouvait valoir qu'un quart ou une moitié de
   rangée, et le prénom se retrouvait deux fois plus étroit que le nom sans qu'on puisse rien
   glisser entre les deux. Le pas d'un sixième donne les proportions voulues. */
const SPAN_TITULAIRES: Record<string, string> = {
  civility: '1 / 2', lastName: '2 / 5', firstName: '5 / 7',
  streetNo: '1 / 2', streetType: '2 / 3', street: '3 / 7',
  postalCode: '1 / 2', city: '2 / 5', country: '5 / 7',
  domicile: '1 / 3', taxRegime: '3 / 5', clientRef: '5 / 7',
  status: '1 / 3',
};

/* Le dossier de vigilance se lit en vis-à-vis : la nature du document exigé occupe les deux
   premières colonnes, ses quatre attributs se partagent les quatre suivantes. Les deux pièces ont
   la même anatomie, elles se lisent donc l'une sous l'autre, attribut au-dessus d'attribut. Sans
   ce gabarit l'étape retombait sur deux colonnes uniformes où des champs de nature différente
   s'alignaient au hasard de leur déclaration. */
const SPAN_KYC: Record<string, string> = {
  idDocType: '1 / 3', kycId: '3 / 4', idIssuer: '4 / 5', idIssueDate: '5 / 6', kycIdExpiry: '6 / 7',
  kycAddress: '1 / 3', addrRef: '3 / 4', addrIssuer: '4 / 5', addrIssueDate: '5 / 6', addrExpiry: '6 / 7',
  kycOrigin: '1 / 3', fundsAmount: '3 / 5',
  kycPep: '1 / 3', kycLevel: '3 / 5',
  status: '1 / 3',
};

export interface FieldCtx {
  readonly form: FormState;
  readonly op: OpKind;
  readonly stepTitle: string;
  readonly stepFields: readonly string[];
  readonly done: boolean;
  readonly last: boolean;
}

export interface StatusTone {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

export function opStateFor(op: OpKind, done: boolean, form: FormState, last: boolean): StatusTone {
  if (op === 'create') {
    if (done) return { label: 'Actif', bg: 'var(--field-ok)', fg: '#ffffff', hint: 'Compte créé, opérations autorisées' };
    if (form.statusChoice === 'En ouverture') {
      return { label: 'En ouverture', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)', hint: last ? 'Passera à Actif à la création' : 'Dossier engagé, dotation attendue' };
    }
    return { label: 'Projet', bg: '#f5d90a', fg: 'var(--ink-5c4700)', hint: last ? 'Passera à Actif à la création' : 'Compte non encore créé' };
  }
  if (op === 'modify') {
    return done
      ? { label: 'Actif', bg: 'var(--field-ok)', fg: '#ffffff', hint: 'Avenant enregistré' }
      : { label: 'Actif', bg: 'var(--field-ok)', fg: '#ffffff', hint: 'Statut inchangé par un avenant' };
  }
  return done
    ? { label: 'Clôturé', bg: '#3f3b39', fg: '#ffffff', hint: 'Pièces archivées' }
    : { label: 'En clôture', bg: 'var(--color-neutral-300)', fg: 'var(--color-neutral-800)', hint: last ? 'Passera à Clôturé à la validation' : 'Liquidation en cours' };
}

// Les couleurs `ok`/`fg` alimentent aussi les options du menu déroulant du champ (voir
// buildField('status')) — un vrai `<mat-menu>`, portalé hors de l'arbre DOM de la page (voir
// memory project_cdk_overlay_dark_mode_body_mirror) : reprises avec un repli hexadécimal
// explicite plutôt qu'un simple var(--jeton), pour rester correctes dans le panneau.
const STATUS_CYCLE: readonly { label: string; bg: string; fg: string; ok: boolean; hint: string }[] = [
  { label: 'Projet', bg: '#f5d90a', fg: 'var(--ink-5c4700, #5c4700)', ok: true, hint: 'Compte non encore créé' },
  { label: 'En ouverture', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2, #0f766e)', ok: true, hint: 'Dossier engagé, dotation attendue' },
  { label: 'Actif', bg: 'var(--field-ok, #0b5f57)', fg: '#ffffff', ok: false, hint: 'Attribué automatiquement à la création du compte' },
  { label: 'Gelé', bg: 'var(--field-warn, #8f3f06)', fg: '#ffffff', ok: false, hint: 'Mouvements suspendus sur instruction ou décision de conformité' },
  { label: 'En clôture', bg: 'var(--color-neutral-300, #d8d5d2)', fg: 'var(--color-neutral-800, #35322f)', ok: false, hint: "Depuis l'onglet Gérer compte, opération Clôture" },
  { label: 'Clôturé', bg: '#3f3b39', fg: '#ffffff', ok: false, hint: 'État final, non atteignable à la création' },
];

/* L'étape fusionnée se lit en deux rangées de sens : l'établissement où le compte est ouvert,
   puis le compte lui-même. Le libellé et la date d'ouverture ferment la saisie sur une rangée
   propre, le statut la conclut. */
const SPAN_ACCOUNT: Record<string, string> = {
  broker: '1 / 3', jurisdiction: '3 / 5', url: '5 / 7',
  accountType: '1 / 3', currency: '3 / 5', number: '5 / 7',
  alias: '1 / 4', opened: '4 / 6',
  status: '1 / 3',
};

function statusSpan(isTitulaires: boolean, isKyc: boolean, isAccount: boolean, hasOpened: boolean): string {
  if (isTitulaires) return SPAN_TITULAIRES['status'];
  if (isKyc) return SPAN_KYC['status'];
  if (isAccount) return SPAN_ACCOUNT['status'];
  /* Une seule colonne, et non la rangée entière : le statut n'affiche qu'une pastille — « Projet »,
     « Actif » — suivie d'une phrase d'aide. L'étaler sur toute la largeur lui donnait le poids d'un
     champ de saisie, qu'il n'est pas. */
  return 'auto';
}

/** Porté de `mapField` — construit la description de rendu d'un champ dynamique pour
 * l'étape courante de l'assistant Gérer compte. */
export function buildField(key: string, ctx: FieldCtx): AcField {
  const label = FIELD_LABELS[key] || key;
  const placeholder = FIELD_HINTS[key] || '';
  const value = (ctx.form as unknown as Record<string, string>)[key] || '';
  /* `lastName` est le marqueur de l'étape Titulaires depuis que `idDocType` est passé au KYC :
     s'y fier reviendrait à appliquer la grille des titulaires au dossier de vigilance. */
  const isTitulaires = ctx.stepFields.includes('lastName');
  const isKyc = ctx.stepFields.includes('kycId');
  const isAccount = ctx.stepFields.includes('broker');
  const span =
    (isTitulaires ? SPAN_TITULAIRES[key] : isKyc ? SPAN_KYC[key] : isAccount ? SPAN_ACCOUNT[key] : undefined) ?? 'auto';

  if (key === 'civility') {
    /* Combo plutôt que segment : la liste est appelée à s'allonger — civilités de personne
       morale, formes étrangères — et un segment ne tient pas au-delà de trois choix. */
    const cur = CIVILITIES.find((c) => c.value === value);
    return {
      kind: 'combo', key, label, span, value,
      leadFlag: '', leadIcon: cur ? cur.icon : '', place: '',
      asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{ heading: '', flag: '', options: CIVILITIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon })) }],
    };
  }
  if (key === 'streetType') {
    return {
      kind: 'combo', key, label, span, value,
      leadFlag: '', place: '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{ heading: '', flag: '', options: STREET_TYPES.map((t) => ({ value: t, label: t })) }],
    };
  }
  if (key === 'country') {
    /* Même référentiel que la juridiction et la domiciliation : un pays reste un pays, et deux
       listes distinctes finiraient par diverger. */
    const curC = JURISDICTIONS.find((j) => j.label === value);
    return {
      kind: 'combo', key, label, span, value,
      leadFlag: curC ? curC.flag : '', place: '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: jurisdictionGroups(),
    };
  }
  if (key === 'accountType' || key === 'idDocType' || key === 'kycAddress') {
    const list =
      key === 'accountType' ? ACCOUNT_TYPES : key === 'idDocType' ? ID_DOC_TYPES : ADDRESS_PROOF_TYPES;
    const cur = list.find((x) => x.label === value) || list[0];
    return {
      kind: 'combo', key, label, span, value: value || cur.label,
      leadFlag: '', place: cur.hint || '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{ heading: '', flag: '', options: list.map((t) => ({ value: t.label, label: t.label, place: t.hint })) }],
    };
  }
  if (key === 'currency') {
    const cur = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];
    return {
      kind: 'combo', key, label, span, value: value || cur.code,
      leadFlag: cur.flag, place: '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: currencyGroups(),
    };
  }
  if (key === 'jurisdiction' || key === 'domicile' || key === 'taxRegime') {
    const curJ = JURISDICTIONS.find((j) => value === j.label || value === 'Résident ' + j.label || (value || '').indexOf(j.label) >= 0);
    return {
      kind: 'combo', key, label, span, value: value || (curJ ? (key === 'taxRegime' ? 'Résident ' + curJ.label : curJ.label) : ''),
      leadFlag: curJ ? curJ.flag : '', place: '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: jurisdictionGroups(),
    };
  }
  if (key === 'kycPep' || key === 'kycLevel') {
    const opts = key === 'kycPep' ? ['Non', 'Oui — vigilance renforcée'] : ['Simplifiée', 'Standard', 'Renforcée'];
    return {
      kind: 'combo', key, label, span, value: value || opts[0],
      leadFlag: '', place: '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{ heading: '', flag: '', options: opts.map((o) => ({ value: o, label: o })) }],
    };
  }
  if (key === 'url') {
    const raw = value.trim();
    const valid = /^https?:\/\/[^\s]+\.[^\s]+/i.test(raw);
    return { kind: 'url', key, label, span, value, placeholder, href: valid ? raw : '', valid };
  }
  if (key === 'closed') {
    const openable = ctx.op === 'close';
    if (openable) return { kind: 'dateOpen', key, label, span, value: value && value !== '—' ? value : '', max: '' };
    return { kind: 'dateLocked', key, label, span, lockedValue: value && value !== '—' ? value : 'Compte ouvert', hint: 'Renseignée uniquement lors de la clôture du compte' };
  }
  if (key === 'kycIdExpiry' || key === 'addrExpiry') {
    return { kind: 'dateOpen', key, label, span, value, max: '' };
  }
  /* Une date d'émission est par construction passée : `max` au jour même évite de dater une
     facture de demain. Les dates de validité, elles, sont à venir et restent libres. */
  if (key === 'idIssueDate' || key === 'addrIssueDate') {
    return { kind: 'dateOpen', key, label, span, value, max: TODAY_ISO };
  }
  if (key === 'opened') {
    return { kind: 'dateOpen', key, label, span, value: value || TODAY_ISO, max: TODAY_ISO };
  }
  if (key === 'number') {
    return { kind: 'input', key, label, span, value, placeholder };
  }
  if (key === 'kycOrigin') {
    const chips = value.split(' · ').filter(Boolean);
    return {
      kind: 'chips', key, label, span, chips,
      options: FUND_ORIGINS.map((o) => ({ value: o, label: o, disabled: false })),
    };
  }
  if (key === 'status') {
    const editable = ctx.op === 'create' && !ctx.done && ['Compte titre', 'Compte de liquidité', 'Contrôle'].includes(ctx.stepTitle);
    if (editable) {
      const chosen = ctx.form.statusChoice || 'Projet';
      const cur = STATUS_CYCLE.find((c) => c.label === chosen) || STATUS_CYCLE[0];
      return {
        kind: 'combo', key, label: 'Statut du compte', span: statusSpan(isTitulaires, isKyc, isAccount, ctx.stepFields.includes('opened')),
        value: cur.label, leadFlag: '', place: cur.hint, asBadge: true, badgeBg: cur.bg, badgeFg: cur.fg,
        checkOk: false, checkBad: false, checkMessage: '',
        groups: [{
          heading: '', flag: '',
          options: STATUS_CYCLE.map((c) => ({
            value: c.label, label: c.label, place: c.hint, disabled: !c.ok,
            title: c.ok ? '' : 'Non sélectionnable à la création — ' + c.hint,
            asBadge: true, badgeBg: c.bg, badgeFg: c.fg,
          })),
        }],
      };
    }
    const opState = opStateFor(ctx.op, ctx.done, ctx.form, ctx.last);
    return {
      kind: 'badge', key, label: 'Statut du compte', span: statusSpan(isTitulaires, isKyc, isAccount, ctx.stepFields.includes('opened')),
      value: opState.label, badgeBg: opState.bg, badgeFg: opState.fg, hint: opState.hint,
    };
  }
  if (key === 'broker') {
    const countries = Array.from(new Set(BROKERS.map((b) => b.country))).sort((a, b) => a.localeCompare(b, 'fr'));
    const cur = BROKERS.find((b) => b.label === value);
    return {
      kind: 'combo', key, label, span, value,
      leadFlag: '', place: cur ? cur.place : '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: countries.map((country) => ({
        heading: country,
        flag: (BROKERS.find((b) => b.country === country) || {}).flag || '',
        options: BROKERS.filter((b) => b.country === country)
          .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
          .map((b) => ({ value: b.label, label: b.label, place: b.place, flag: b.flag })),
      })),
    };
  }
  // Défaut : champ texte simple (lastName, firstName, clientRef, kycId, idIssuer, addrRef,
  // addrIssuer, fundsAmount, alias,
  // profile, fee, horizon, target, reason, effect, dotation).
  return { kind: 'input', key, label, span, value, placeholder };
}

function currencyGroups(): AcSelectGroup[] {
  return [
    { zone: 'Europe', flag: '🇪🇺' },
    { zone: 'Amérique du Nord', flag: '🌎' },
  ].map((z) => ({
    heading: z.zone,
    flag: z.flag,
    options: CURRENCIES.filter((c) => c.zone === z.zone)
      .sort((a, b) => (a.code === 'EUR' ? -1 : b.code === 'EUR' ? 1 : a.code.localeCompare(b.code)))
      .map((c) => ({ value: c.code, label: c.label, flag: c.flag })),
  }));
}

/**
 * Pays d'usage courant, proposés en tête de liste. Ce ne sont pas des favoris configurables mais
 * le voisinage immédiat du cabinet : à eux quatre ils couvrent la quasi-totalité des dossiers, et
 * les remonter évite de dérouler trente entrées pour saisir « Luxembourg ».
 */
const QUICK_COUNTRIES: readonly string[] = ['Luxembourg', 'France', 'Belgique', 'Allemagne'];

/**
 * Deux groupes : les pays fréquents, puis tous les pays dans l'ordre alphabétique — les
 * fréquents y figurent une seconde fois, pour que la liste complète reste complète et qu'on ne
 * cherche pas « France » en vain à la lettre F.
 *
 * Le classement par zone qui existait ici ne servait qu'à séparer trois pays d'Amérique du Nord
 * du reste ; l'accès rapide rend ce découpage inutile, et l'ordre alphabétique est celui qu'on
 * parcourt du regard.
 */
function jurisdictionGroups(): AcSelectGroup[] {
  const byLabel = (a: JurisdictionRef, b: JurisdictionRef) => a.label.localeCompare(b.label, 'fr');
  const toOption = (j: JurisdictionRef) => ({ value: j.label, label: j.label, flag: j.flag });
  const quick = QUICK_COUNTRIES.map((label) => JURISDICTIONS.find((j) => j.label === label)).filter(
    (j): j is JurisdictionRef => !!j,
  );
  return [
    { heading: '', flag: '', options: quick.map(toOption) },
    { heading: 'Tous les pays', flag: '', options: [...JURISDICTIONS].sort(byLabel).map(toOption) },
  ];
}

/* Les rangées du dossier de vigilance sont des blocs — une pièce et ses attributs — et non des
   champs isolés : elles respirent plus que les 10px du reste du formulaire, assez pour se lire
   comme des ensembles distincts sans étirer l'étape sur deux écrans. */
export function opRowGap(stepFields: readonly string[]): string {
  return stepFields.includes('kycId') ? '20px' : '10px';
}

export function opCols(stepFields: readonly string[]): string {
  /* KYC : les deux premières colonnes portent la nature du document — un libellé court, « Pièce
     d'identité », « Origine des fonds » — là où les quatre suivantes portent numéro, émetteur et
     dates. Les rendre plus étroites que les autres donne aux attributs la place qui leur manquait,
     sans quoi la colonne de gauche occupait le tiers de la rangée pour deux mots. */
  if (stepFields.includes('kycId')) {
    return 'repeat(2, minmax(0,0.72fr)) repeat(4, minmax(0,1fr))';
  }
  if (stepFields.includes('lastName') || stepFields.includes('broker')) {
    return 'repeat(6, minmax(0,1fr))';
  }
  if (stepFields.length === 3) return 'repeat(3, minmax(0,1fr))';
  return 'repeat(2, minmax(0,1fr))';
}

// ---------------------------------------------------------------------------
// Comptes de liquidité — cashRows / cashSelected
// ---------------------------------------------------------------------------

export interface CashRowView {
  readonly index: number; // -1 = compte principal (form.cashLabel/cashIban/cashCurrency), sinon index dans cash[]
  readonly bank: string;
  readonly country: string;
  readonly iban: string;
  readonly currency: string;
  readonly currencyFlag: string;
  readonly main: boolean;
  readonly canRemove: boolean;
  readonly rank: string;
  readonly rankCode: 'P' | 'S';
  readonly bankFlag: string;
  readonly bankOk: boolean;
  readonly ibanOk: boolean;
  readonly ibanBad: boolean;
  readonly ibanMessage: string;
}

export function buildCashRows(form: FormState, cash: readonly CashEntry[]): CashRowView[] {
  const rows: { bank: string; iban: string; currency: string }[] = [
    { bank: form.cashLabel, iban: form.cashIban, currency: form.cashCurrency },
    ...cash,
  ];
  return rows.map((c, row) => {
    const main = row === 0;
    const chk = ibanCheck(c.iban);
    const bk = BANKS.find((b) => b.label === c.bank);
    const cu = CURRENCIES.find((x) => x.code === c.currency) || CURRENCIES[0];
    return {
      index: main ? -1 : row - 1,
      bank: c.bank || 'Établissement à choisir',
      country: bk ? bk.country : '—',
      iban: c.iban || '',
      currency: c.currency || 'EUR',
      currencyFlag: cu.flag,
      main,
      canRemove: !main,
      rank: main ? 'Principal' : 'Secondaire',
      rankCode: main ? 'P' : 'S',
      bankFlag: bk ? bk.flag : '',
      bankOk: !!bk,
      ibanOk: chk.state === 'ok',
      ibanBad: chk.state === 'bad',
      ibanMessage: chk.message,
    };
  });
}

export function bankGroups(): AcSelectGroup[] {
  return [{ heading: '', flag: '', options: BANKS.map((b) => ({ value: b.label, label: b.label, place: b.country, flag: b.flag })) }];
}

export function cashCurrencyGroups(): AcSelectGroup[] {
  return currencyGroups();
}

// ---------------------------------------------------------------------------
// Co-titulaires — coSelected / holderTabs
// ---------------------------------------------------------------------------

export interface CoHolderRowView {
  readonly index: number;
  readonly last: string;
  readonly first: string;
  readonly role: string;
  readonly ref: string;
}

export function buildCoRow(index: number, h: CoHolder, clientRef: string): CoHolderRowView {
  return { index, last: h.last, first: h.first, role: h.role, ref: (clientRef || 'CLI-…') + '-' + String(index + 1).padStart(2, '0') };
}

// ---------------------------------------------------------------------------
// Validation à la création — createIssues()
// ---------------------------------------------------------------------------

export interface CreateIssue {
  readonly title: string;
  readonly detail: string;
  readonly step: string;
}

export function createIssues(f: FormState, cash: readonly CashEntry[]): CreateIssue[] {
  const out: CreateIssue[] = [];
  if (!f.lastName.trim() || !f.firstName.trim()) {
    out.push({ title: 'Titulaire principal incomplet', detail: 'Le nom et le prénom du titulaire sont obligatoires pour ouvrir le compte.', step: 'Titulaires' });
  }
  if (!f.clientRef.trim()) {
    out.push({ title: 'Référence client absente', detail: 'La référence principale identifie le client au référentiel : elle doit être renseignée.', step: 'Titulaires' });
  }
  if (!f.alias.trim()) {
    out.push({ title: 'Libellé du compte absent', detail: "Le libellé identifie le compte dans l'application et doit être unique pour le titulaire.", step: 'Compte titre' });
  }
  if (!f.number.trim()) {
    out.push({ title: 'Numéro de compte absent', detail: 'Le numéro chez le broker sert de clé de réconciliation.', step: 'Compte titre' });
  }
  if (!f.cashLabel) {
    out.push({ title: 'Aucun établissement bancaire', detail: "Un compte de liquidité doit être rattaché pour permettre les mouvements d'espèces.", step: 'Compte de liquidité' });
  } else if (ibanCheck(f.cashIban).state !== 'ok') {
    out.push({ title: 'IBAN non conforme', detail: "La clé de contrôle MOD-97 de l'IBAN du compte principal est invalide.", step: 'Compte de liquidité' });
  }
  cash.forEach((c, i) => {
    if (c.bank && ibanCheck(c.iban).state !== 'ok') {
      out.push({ title: 'IBAN non conforme — ' + c.bank, detail: 'Compte secondaire ' + (i + 1) + " : la clé de contrôle de l'IBAN est invalide.", step: 'Compte de liquidité' });
    }
  });
  return out;
}

export interface CreateSummaryRow {
  readonly label: string;
  readonly value: string;
}

export function createSummaryRows(f: FormState, cash: readonly CashEntry[]): CreateSummaryRow[] {
  return [
    { label: 'Libellé du compte', value: f.alias || '—' },
    { label: 'Broker', value: ((BROKERS.find((b) => b.label === f.broker) || { flag: '' }).flag || '') + ' ' + (f.broker || '—') + ' · ' + (f.jurisdiction || '—') },
    { label: 'Type et devise', value: (f.accountType || '—') + ' · ' + ((CURRENCIES.find((c) => c.code === f.currency) || { flag: '' }).flag || '') + ' ' + (f.currency || '—') },
    { label: 'Numéro de compte', value: f.number || '—' },
    { label: 'Titulaire principal', value: fullName(f.lastName, f.firstName) || '—' },
    { label: 'Référence client', value: f.clientRef || '—' },
    { label: 'Compte de liquidité', value: ((BANKS.find((b) => b.label === f.cashLabel) || { flag: '' }).flag || '') + ' ' + (f.cashLabel || '—') + (cash.length ? ' + ' + cash.length + ' secondaire(s)' : '') },
    { label: "Date d'ouverture", value: f.opened || '—' },
  ];
}

export const CREATE_STAGES: readonly string[] = [
  'Contrôle des données saisies…',
  'Vérification des clés IBAN et des rattachements…',
  'Enregistrement au référentiel des comptes…',
  'Activation du compte et ouverture des accès…',
];
export const CREATE_STAGE_DELAY_MS = 520;
export const CREATE_FINAL_DELAY_MS = 2200;

// ---------------------------------------------------------------------------
// Récapitulatif — recapGroups / recapPeople / recapBanks / recapVerdict
// ---------------------------------------------------------------------------

export interface RecapPerson {
  readonly key: string;
  readonly main: boolean;
  readonly chip: string;
  readonly label: string;
  readonly role: string;
}

function initials2(last: string, first: string): string {
  return (((last || '').charAt(0) + (first || '').charAt(0)).toUpperCase()) || '—';
}
export function fullName(last: string, first: string): string {
  const l = (last || '').trim();
  const f = (first || '').trim();
  return l && f ? l + ', ' + f : l || f;
}

export function buildRecapPeople(f: FormState, co: readonly CoHolder[]): RecapPerson[] {
  return [
    { key: 'main', main: true, chip: initials2(f.lastName, f.firstName), label: fullName(f.lastName, f.firstName) || 'Titulaire principal', role: 'Titulaire principal' },
    ...co.map((h, i) => ({ key: String(i), main: false, chip: initials2(h.last, h.first), label: fullName(h.last, h.first) || 'Personne ' + (i + 2), role: h.role || 'Co-titulaire' })),
  ];
}

export interface RecapBankOpt {
  readonly key: string;
  readonly main: boolean;
  readonly chip: string;
  readonly label: string;
  readonly role: string;
  readonly iban: string;
  readonly currency: string;
}

export function buildRecapBanks(f: FormState, cash: readonly CashEntry[]): RecapBankOpt[] {
  return [
    { key: 'main', main: true, chip: 'P', label: f.cashLabel || 'Établissement à choisir', role: 'Compte principal', iban: f.cashIban, currency: f.cashCurrency },
    ...cash.map((c, i) => ({ key: String(i), main: false, chip: 'S', label: c.bank || 'Établissement ' + (i + 2), role: 'Compte secondaire', iban: c.iban, currency: c.currency })),
  ];
}

export interface RecapRow {
  readonly label: string;
  readonly value: string;
  readonly color: string;
  readonly badge?: string;
  readonly badgeBg?: string;
  readonly badgeFg?: string;
  readonly href?: string;
}
export interface RecapGroup {
  readonly title: string;
  readonly rows: readonly RecapRow[];
  readonly state: string;
  readonly stateColor: string;
  readonly isCash: boolean;
}

function flagOf<T extends { flag: string }>(list: readonly T[], pred: (x: T) => boolean): string {
  const hit = list.find(pred);
  return hit ? hit.flag : '';
}
function flagInText(text: string): string {
  if (!text) return '';
  const hit = JURISDICTIONS.filter((x) => text.indexOf(x.label) >= 0).sort((a, b) => b.label.length - a.label.length)[0];
  return hit ? hit.flag : '';
}

export function buildRecapGroups(f: FormState, co: readonly CoHolder[], who: RecapPerson, bank: RecapBankOpt, cash: readonly CashEntry[]): RecapGroup[] {
  const v = (x: string | undefined) => (x && x !== '—' ? x : '');
  const row = (label: string, value: string | undefined, need = false): RecapRow => ({
    label, value: v(value) || (need ? 'À renseigner' : '—'),
    color: v(value) ? 'var(--color-text)' : need ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
  });
  const grp = (title: string, rows: readonly RecapRow[]): RecapGroup => {
    const gaps = rows.filter((r) => r.value === 'À renseigner').length;
    return { title, rows, state: gaps ? gaps + ' à compléter' : 'Complet', stateColor: gaps ? 'var(--ink-warn-2)' : 'var(--ink-ok)', isCash: false };
  };
  const withFlag = (r: RecapRow, flag: string): RecapRow => (flag ? { ...r, value: flag + '  ' + r.value } : r);
  const curOf = (code: string) => CURRENCIES.find((x) => x.code === code) || null;

  const titulaireGroup = who.main
    ? grp('Titulaire principal', [
        row('Nom', f.lastName, true),
        row('Prénom', f.firstName, true),
        row('Référence client', f.clientRef, true),
        withFlag(row('Domiciliation', f.domicile, true), flagInText(f.domicile)),
        withFlag(row('Régime fiscal', f.taxRegime, true), flagInText(f.taxRegime)),
        row('Personnes rattachées', (() => {
          if (!co.length) return '';
          const isBenef = (r: string) => (r || '').toLowerCase().indexOf('bénéficiaire') >= 0;
          const nb = co.filter((h) => isBenef(h.role)).length;
          const nc = co.length - nb;
          const parts: string[] = [];
          if (nc) parts.push(nc + (nc > 1 ? ' co-titulaires' : ' co-titulaire'));
          if (nb) parts.push(nb + (nb > 1 ? ' bénéficiaires' : ' bénéficiaire'));
          return parts.join(' · ');
        })()),
      ])
    : (() => {
        const h = co[Number(who.key)] || { last: '', first: '', role: '' };
        return grp(who.role, [
          row('Nom', h.last, true),
          row('Prénom', h.first, true),
          row('Qualité', h.role, true),
          row('Référence rattachée', (f.clientRef || 'CLI-…') + '-' + String(Number(who.key) + 1).padStart(2, '0'), true),
          row('Titulaire principal', (f.lastName + ' ' + f.firstName).trim()),
          row('Référence principale', f.clientRef, true),
        ]);
      })();

  const bankChk = ibanCheck(bank.iban);
  const bankGroup: RecapGroup = {
    ...grp(bank.role, [
      withFlag(row('Établissement bancaire', bank.label, true), flagOf(BANKS, (b) => b.label === bank.label)),
      withFlag(row('Pays de rattachement', (BANKS.find((b) => b.label === bank.label) || { country: '' }).country), flagOf(BANKS, (b) => b.label === bank.label)),
      { label: 'IBAN', value: bank.iban ? bank.iban + (bankChk.state === 'ok' ? ' — clé conforme' : ' — clé non conforme') : 'À renseigner', color: bankChk.state === 'ok' ? 'var(--color-text)' : 'var(--ink-warn-2)' },
      (() => {
        const c = curOf(bank.currency);
        const r = row('Devise du compte', c ? c.label : bank.currency, true);
        return withFlag(c ? { ...r, value: r.value + ' · ' + c.zone } : r, c ? c.flag : '');
      })(),
      row('Comptes rattachés', (cash.length + 1) + (cash.length ? ' comptes · 1 principal · ' + cash.length + (cash.length > 1 ? ' secondaires' : ' secondaire') : ' compte principal')),
    ]),
    isCash: true,
  };

  const statusValue = f.statusChoice || 'Projet';
  const statusTone = statusValue === 'Actif' ? { bg: 'var(--field-ok)', fg: '#ffffff' }
    : statusValue === 'En ouverture' ? { bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)' }
    : { bg: '#f5d90a', fg: 'var(--ink-5c4700)' };
  const statusHint = statusValue === 'Projet' ? 'Compte non encore créé'
    : statusValue === 'En ouverture' ? 'Dossier engagé, dotation attendue'
    : 'Compte créé, opérations autorisées';

  const groups: RecapGroup[] = [
    titulaireGroup,
    grp('KYC', [
      row('Pièce d\'identité', f.idDocType && f.idDocType !== '—' ? f.idDocType : '', true),
      row('Numéro de la pièce', f.kycId, true),
      row('Émetteur de la pièce', f.idIssuer),
      row('Validité de la pièce', f.kycIdExpiry, true),
      row('Justificatif de domicile', f.kycAddress && f.kycAddress !== '—' ? f.kycAddress : '', true),
      row('Numéro du justificatif', f.addrRef),
      row('Émetteur du justificatif', f.addrIssuer),
      row('Validité du justificatif', f.addrExpiry),
      row('Origine des fonds', f.kycOrigin, true),
      row('Montant approximatif', f.fundsAmount),
      row('Personne exposée', f.kycPep),
      row('Niveau de vigilance', f.kycLevel),
    ]),
    grp('Broker', [
      withFlag(row('Broker', f.broker, true), flagOf(BROKERS, (b) => b.label === f.broker)),
      withFlag(row('Juridiction', f.jurisdiction, true), flagOf(JURISDICTIONS, (j) => j.label === f.jurisdiction)),
      row('Localisation', (BROKERS.find((b) => b.label === f.broker) || { place: '' }).place),
      { ...row('URL', f.url), href: /^https?:\/\//i.test(f.url || '') ? f.url : '' },
      row("Date d'ouverture", f.opened, true),
    ]),
    grp('Compte titre', [
      row('Type de compte', f.accountType, true),
      (() => {
        const c = curOf(f.currency);
        const r = row('Devise de tenue', c ? c.label : f.currency, true);
        return withFlag(c ? { ...r, value: r.value + ' · ' + c.zone } : r, c ? c.flag : '');
      })(),
      row('Numéro de compte', f.number, true),
      row('Libellé du compte', f.alias, true),
    ]),
    bankGroup,
    grp('Statut du compte', [
      { label: 'Statut', value: statusHint, color: 'var(--color-text)', badge: statusValue, badgeBg: statusTone.bg, badgeFg: statusTone.fg },
      row('Date de fermeture', f.closed === '—' ? 'Compte ouvert' : f.closed, false),
    ]),
  ];
  return groups;
}

export function recapVerdict(f: FormState): string {
  const missing: string[] = [];
  if (!f.lastName || !f.firstName) missing.push('titulaire');
  if (!f.clientRef) missing.push('référence client');
  if (!f.kycId || !f.kycIdExpiry) missing.push('KYC');
  if (!f.number) missing.push('numéro de compte');
  if (!f.alias) missing.push('libellé du compte');
  if (ibanCheck(f.cashIban).state !== 'ok') missing.push('IBAN');
  return missing.length ? 'À compléter avant création : ' + missing.join(', ') + '.' : 'Dossier complet — le compte peut être créé.';
}
