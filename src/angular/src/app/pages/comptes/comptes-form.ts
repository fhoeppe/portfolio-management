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
  BANKS,
  BROKERS,
  CIVILITIES,
  CURRENCIES,
  FIELD_HINTS,
  FIELD_LABELS,
  JURISDICTIONS,
  STREET_TYPES,
  TODAY_ISO,
  ibanCheck,
  type JurisdictionRef,
} from './comptes-data';

/** Les trois opérations du cycle de vie d'un compte. */
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
  /** État du compte chez le broker — Ouvert, Suspendu, Fermé — distinct du statut du dossier. */
  brokerStatus: string;
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
  domicile: string;
  taxRegime: string;
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
    opened: TODAY_ISO, brokerStatus: 'Ouvert', closed: '—', civility: '', lastName: '', firstName: '',
    streetNo: '', streetType: '', street: '', postalCode: '', city: '', country: '',
    clientRef: '', domicile: '', taxRegime: '',
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
  /**
   * L'étape porte aussi le bloc des comptes de liquidité — tableau des établissements, IBAN,
   * devise — sous ses champs. Marqué ici et non déduit du titre : un intitulé se réécrit.
   */
  readonly withCash?: boolean;
}
export interface OpDef {
  readonly label: string;
  readonly hint: string;
  readonly next: string;
  readonly steps: readonly OpStepDef[];
}

/**
 * L'étape « Comptes titre et liquidité », seconde et dernière du parcours Création. Nommée à part
 * parce qu'elle a été un onglet à elle seule et que sa définition — deux blocs, un statut, le
 * blocage sur les IBAN — se lit mieux hors de la liste des parcours.
 */
function accountsStep(): OpStepDef {
  return {
    /* Une seule étape, en deux blocs. Broker et compte titre ne faisaient qu'une décision —
       on n'ouvre pas un compte sans savoir chez qui — et le compte de liquidité n'existe
       que pour ce compte titre : le séparer en étape obligeait à valider l'un pour voir
       l'autre, alors qu'on les décide ensemble. Les champs ci-dessous forment le bloc
       « Compte titre » ; le bloc « Compte de liquidité » est le tableau des établissements,
       porté par `withCash`. Le statut vient après les deux blocs, il conclut l'ensemble. */
    title: 'Comptes titre et liquidité', hint: 'Compte titre chez le broker, compte de liquidité adossé',
    fields: [
      'broker', 'jurisdiction', 'url',
      'accountType', 'currency', 'number',
      'alias', 'opened', 'brokerStatus',
    ],
    withCash: true,
    checks: [
      { label: 'La juridiction du broker détermine le régime fiscal et la retenue à la source applicable.', level: 'info' },
      { label: 'Le numéro de compte est purement numérique et doit correspondre exactement à celui ouvert chez le broker : il sert de clé de réconciliation.', level: 'warn' },
      { label: 'Le libellé du compte doit être unique parmi les comptes du même client : c\'est lui qui identifie le compte dans toute l\'application.', level: 'warn' },
      { label: "La date d'ouverture est celle du compte chez le broker, pas celle de la saisie.", level: 'info' },
      { label: 'Tout compte titre est adossé à un compte de liquidité : il porte les mouvements d\'espèces, les dividendes encaissés et les frais.', level: 'info' },
      { label: 'La devise du compte espèces doit correspondre à la devise de tenue du compte titre, sauf compte multidevises.', level: 'warn' },
      { label: "L'IBAN est contrôlé par le MOD-97 algorithm (ISO 7064) : un signal rouge indique une clé erronée avant tout enregistrement.", level: 'info' },
    ],
  };
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
             rattache à un régime fiscal et à une référence. Le statut ferme l'étape — « Projet » tant que
             le compte n'est pas créé. */
          fields: [
            'civility', 'lastName', 'firstName',
            'streetNo', 'streetType', 'street',
            'postalCode', 'city', 'country',
            'domicile', 'taxRegime', 'clientRef',
            'status',
          ],
          checks: [
            { label: 'La référence client est attribuée automatiquement à la création du compte ; les co-titulaires reçoivent une référence rattachée, dérivée de celle-ci.', level: 'info' },
            { label: 'La domiciliation et le régime fiscal déterminent la retenue à la source appliquée aux dividendes et coupons.', level: 'info' },
          ],
        },
        /* Les comptes se décident dans le même parcours que le titulaire : l'étape de contrôle
           qui fermait la création ne portait qu'une date de fermeture — vide par construction à
           l'ouverture — et le statut, que l'étape des comptes porte déjà. Le récapitulatif de
           contrôle s'ouvre depuis cette dernière étape. */
        accountsStep(),
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

/* Les statuts du dossier tels que l'étape des comptes les propose. `ok` dit s'il se choisit là ;
   `why` explique pourquoi non. Les teintes ont un repli hexadécimal : elles sont aussi rendues
   dans le panneau du menu, portalé hors de l'arbre de l'écran. */
const STATUS_CYCLE: readonly { label: string; bg: string; fg: string; ok: boolean; hint: string; why: string }[] = [
  { label: 'Projet', bg: '#f5d90a', fg: 'var(--ink-5c4700, #5c4700)', ok: false, hint: 'Compte non encore créé', why: 'Le dossier a dépassé le stade du projet : ses comptes sont en cours d\'ouverture' },
  { label: 'En ouverture', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2, #0f766e)', ok: true, hint: 'Dossier engagé, passera à Actif à la création', why: '' },
  { label: 'Actif', bg: 'var(--field-ok, #0b5f57)', fg: '#ffffff', ok: false, hint: 'Compte créé, opérations autorisées', why: 'Attribué automatiquement à la création du compte' },
  { label: 'Gelé', bg: 'var(--field-warn, #8f3f06)', fg: '#ffffff', ok: false, hint: 'Mouvements suspendus', why: 'Sur instruction ou décision de conformité, après création' },
  { label: 'En clôture', bg: 'var(--color-neutral-300, #d8d5d2)', fg: 'var(--color-neutral-800, #35322f)', ok: false, hint: 'Résiliation engagée', why: 'Depuis l\'onglet Gérer compte portefeuille, opération Clôture' },
  { label: 'Clôturé', bg: '#3f3b39', fg: '#ffffff', ok: false, hint: 'État final', why: 'État final, non atteignable à la création' },
];

/* État du compte titre chez le broker. Ce n'est pas le statut du dossier (Projet → Actif) :
   un dossier actif peut porter un compte titre suspendu par l'établissement, ou fermé quand le
   client a changé de broker. Les trois teintes reprennent celles des états de la liste — vert
   pour ce qui fonctionne, ambre pour ce qui est suspendu, sombre pour ce qui est fermé. */
export const BROKER_ACCOUNT_STATES: readonly { label: string; bg: string; fg: string; hint: string }[] = [
  { label: 'Ouvert', bg: 'var(--field-ok, #0b5f57)', fg: '#ffffff', hint: 'Compte opérationnel chez le broker' },
  { label: 'Suspendu', bg: 'var(--field-warn, #8f3f06)', fg: '#ffffff', hint: "Mouvements suspendus par l'établissement ou sur instruction" },
  { label: 'Fermé', bg: '#3f3b39', fg: '#ffffff', hint: 'Compte clos chez le broker' },
];
/* L'étape fusionnée se lit en deux rangées de sens : l'établissement où le compte est ouvert,
   puis le compte lui-même. Le libellé et la date d'ouverture ferment la saisie sur une rangée
   propre, le statut la conclut. */
const SPAN_ACCOUNT: Record<string, string> = {
  broker: '1 / 3', jurisdiction: '3 / 5', url: '5 / 7',
  accountType: '1 / 3', currency: '3 / 5', number: '5 / 7',
  /* Trois champs à parts égales : le statut porte une pastille et une précision d'une ligne
     (« Compte opérationnel chez le broker ») qu'une seule colonne tronquait au bord du bloc. */
  alias: '1 / 3', opened: '3 / 5', brokerStatus: '5 / 7',
  status: '1 / 3',
};

function statusSpan(isTitulaires: boolean, isAccount: boolean): string {
  if (isTitulaires) return SPAN_TITULAIRES['status'];
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
  /* Chaque étape est reconnue à un champ qui n'appartient qu'à elle, et non à son titre : un
     intitulé se réécrit, la composition d'une étape non. */
  const isTitulaires = ctx.stepFields.includes('lastName');
  const isAccount = ctx.stepFields.includes('broker');
  const span = (isTitulaires ? SPAN_TITULAIRES[key] : isAccount ? SPAN_ACCOUNT[key] : undefined) ?? 'auto';

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
  if (key === 'accountType') {
    const cur = ACCOUNT_TYPES.find((x) => x.label === value) || ACCOUNT_TYPES[0];
    return {
      kind: 'combo', key, label, span, value: value || cur.label,
      leadFlag: '', place: cur.hint || '', asBadge: false, badgeBg: '', badgeFg: '',
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{ heading: '', flag: '', options: ACCOUNT_TYPES.map((t) => ({ value: t.label, label: t.label, place: t.hint })) }],
    };
  }
  if (key === 'clientRef') {
    /* Lecture seule : la référence est attribuée par le référentiel à la création, et non saisie.
       Un champ libre invitait à en inventer une, que le référentiel aurait ensuite contredite. Le
       même rendu verrouillé que la date de fermeture — cadenas, valeur, explication. */
    return { kind: 'dateLocked', key, label, span, lockedValue: value || 'Attribuée à la création', hint: 'Attribuée automatiquement par le référentiel' };
  }
  if (key === 'brokerStatus') {
    const cur = BROKER_ACCOUNT_STATES.find((s) => s.label === value) || BROKER_ACCOUNT_STATES[0];
    return {
      kind: 'combo', key, label, span, value: cur.label,
      leadFlag: '', place: cur.hint, asBadge: true, badgeBg: cur.bg, badgeFg: cur.fg,
      checkOk: false, checkBad: false, checkMessage: '',
      groups: [{
        heading: '', flag: '',
        options: BROKER_ACCOUNT_STATES.map((s) => ({ value: s.label, label: s.label, place: s.hint, asBadge: true, badgeBg: s.bg, badgeFg: s.fg })),
      }],
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
  if (key === 'opened') {
    return { kind: 'dateOpen', key, label, span, value: value || TODAY_ISO, max: TODAY_ISO };
  }
  if (key === 'number') {
    return { kind: 'input', key, label, span, value, placeholder };
  }
  if (key === 'status') {
    /* Sur l'étape des comptes, le statut se choisit — entre ce que le dossier peut valoir à ce
       stade : « En ouverture », les états ultérieurs restant hors de portée. « Projet » n'y est
       plus sélectionnable : un dossier dont on ouvre les comptes a dépassé le stade du projet.
       Sur l'étape Titulaires il reste une simple pastille « Projet », et après création « Actif ». */
    const choosable = ctx.op === 'create' && !ctx.done && ctx.stepTitle === 'Comptes titre et liquidité';
    if (choosable) {
      const chosen = STATUS_CYCLE.find((c) => c.label === ctx.form.statusChoice && c.ok) || STATUS_CYCLE.find((c) => c.ok)!;
      return {
        kind: 'combo', key, label: 'Statut du compte', span: statusSpan(isTitulaires, isAccount),
        value: chosen.label, leadFlag: '', place: chosen.hint, asBadge: true, badgeBg: chosen.bg, badgeFg: chosen.fg,
        checkOk: false, checkBad: false, checkMessage: '',
        groups: [{
          heading: '', flag: '',
          options: STATUS_CYCLE.map((c) => ({
            value: c.label, label: c.label, place: c.hint, disabled: !c.ok,
            title: c.ok ? '' : c.why,
            asBadge: true, badgeBg: c.bg, badgeFg: c.fg,
          })),
        }],
      };
    }
    const opState = opStateFor(ctx.op, ctx.done, ctx.form, ctx.last);
    return {
      kind: 'badge', key, label: 'Statut du compte', span: statusSpan(isTitulaires, isAccount),
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
  // Défaut : champ texte simple (lastName, firstName, alias,
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

export function opCols(stepFields: readonly string[]): string {
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
  /** IBAN encore vide : ni conforme ni erroné, mais pas vérifié pour autant — et c'est ce qui compte. */
  readonly ibanTodo: boolean;
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
      ibanTodo: chk.state === 'empty',
      /* Un IBAN vide a lui aussi un message : la ligne dit ce qu'elle attend, et non rien. */
      ibanMessage: chk.state === 'empty' ? 'IBAN à renseigner — contrôlé dès la saisie (MOD-97, ISO 7064).' : chk.message,
    };
  });
}

/* Un groupe par pays, les pays en ordre alphabétique et les établissements de même — comme le
   sélecteur de broker. La liste à plat mêlait BIL et Belfius, Santander et Société Générale :
   on cherche une banque en sachant d'abord où elle est. Le drapeau monte sur l'en-tête du
   groupe, il n'a plus à se répéter sur chaque ligne. */
export function bankGroups(): AcSelectGroup[] {
  const byLabel = (a: string, b: string) => a.localeCompare(b, 'fr');
  const countries = Array.from(new Set(BANKS.map((b) => b.country))).sort(byLabel);
  return countries.map((country) => ({
    heading: country,
    flag: (BANKS.find((b) => b.country === country) || { flag: '' }).flag,
    options: BANKS.filter((b) => b.country === country)
      .sort((a, b) => byLabel(a.label, b.label))
      .map((b) => ({ value: b.label, label: b.label })),
  }));
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

/**
 * Contrôle de l'étape Titulaires, demandé par le bouton « Vérifier la saisie » de cette étape.
 *
 * Ce qui manque, dans l'ordre de la grille : identité du titulaire, rattachement fiscal, puis
 * chaque personne rattachée dont l'identité ou la qualité est vide. Le contrôle ne juge que
 * cette étape — les comptes ont le leur, sur leur propre étape.
 */
export function holderIssues(f: FormState, co: readonly CoHolder[]): string[] {
  const out: string[] = [];
  if (!f.civility) out.push('civilité');
  if (!f.lastName.trim()) out.push('nom de famille');
  if (!f.firstName.trim()) out.push('prénom');
  if (!f.domicile) out.push('domiciliation');
  if (!f.taxRegime) out.push('régime fiscal');
  co.forEach((h, i) => {
    const who = [h.last, h.first].filter((x) => x.trim()).join(' ') || `personne rattachée ${i + 1}`;
    if (!h.last.trim() || !h.first.trim()) out.push(`identité de ${who}`);
    if (!h.role) out.push(`qualité de ${who}`);
  });
  return out;
}

/** Empreinte de ce que le contrôle des titulaires regarde : la vérification vaut pour cet état-là. */
export function holderKey(f: FormState, co: readonly CoHolder[]): string {
  return JSON.stringify([f.civility, f.lastName, f.firstName, f.domicile, f.taxRegime, co.map((h) => [h.last, h.first, h.role])]);
}

export interface CreateIssue {
  readonly title: string;
  readonly detail: string;
  readonly step: string;
}

/**
 * Référence client attribuée à la création : millésime et rang, à la suite des comptes connus.
 * Le rang avance à chaque attribution — deux créations dans la même session ne partagent pas la
 * même référence.
 */
let clientRefSeq = 0;
export function nextClientRef(known: number): string {
  clientRefSeq += 1;
  return `CLI-${new Date().getFullYear()}-${String(known + clientRefSeq).padStart(4, '0')}`;
}

/**
 * Un compte titre du dossier, avec son compte de liquidité. « Ajouter » en ouvre un nouveau, vide ;
 * chacun se déplie pour être renseigné — un dossier porte autant de comptes titre qu'on en ouvre,
 * chez autant de brokers, et n'en porte aucun tant qu'on n'en a pas ajouté.
 */
export interface TitreEntry {
  readonly broker: string;
  readonly jurisdiction: string;
  readonly url: string;
  readonly accountType: string;
  readonly currency: string;
  readonly number: string;
  readonly alias: string;
  readonly opened: string;
  readonly brokerStatus: string;
  readonly cashLabel: string;
  readonly cashIban: string;
  readonly cashCurrency: string;
  readonly cash: readonly CashEntry[];
}

export function titreFromForm(f: FormState, cash: readonly CashEntry[]): TitreEntry {
  return {
    broker: f.broker, jurisdiction: f.jurisdiction, url: f.url,
    accountType: f.accountType, currency: f.currency, number: f.number, alias: f.alias,
    opened: f.opened, brokerStatus: f.brokerStatus || 'Ouvert',
    cashLabel: f.cashLabel, cashIban: f.cashIban, cashCurrency: f.cashCurrency, cash: [...cash],
  };
}

/** Un compte titre vierge, tel qu'« Ajouter » l'ouvre. */
export function blankTitre(): TitreEntry {
  return titreFromForm(blankForm(), []);
}

/** Les champs du compte titre, pour charger un compte dans le tampon de saisie ou le vider. */
export function titreFields(t: TitreEntry): Partial<FormState> {
  return {
    broker: t.broker, jurisdiction: t.jurisdiction, url: t.url,
    accountType: t.accountType, currency: t.currency, number: t.number, alias: t.alias,
    opened: t.opened, brokerStatus: t.brokerStatus,
    cashLabel: t.cashLabel, cashIban: t.cashIban, cashCurrency: t.cashCurrency,
  };
}

export function blankTitreFields(): Partial<FormState> {
  const b = blankForm();
  return {
    broker: b.broker, jurisdiction: b.jurisdiction, url: b.url,
    accountType: b.accountType, currency: b.currency, number: b.number, alias: b.alias,
    opened: b.opened, brokerStatus: b.brokerStatus,
    cashLabel: b.cashLabel, cashIban: b.cashIban, cashCurrency: b.cashCurrency,
  };
}

/**
 * Ce qui manque au bloc pour être ajouté, dans l'ordre de lecture : le compte titre, puis son
 * compte de liquidité. Chaque IBAN est vérifié — principal et secondaires, vides compris.
 */
export type TitreFields = Pick<FormState, 'broker' | 'accountType' | 'number' | 'alias' | 'cashLabel' | 'cashIban'>;
export function titreIssues(f: TitreFields, cash: readonly CashEntry[]): string[] {
  const out: string[] = [];
  if (!f.broker) out.push('broker');
  if (!f.accountType) out.push('type de compte');
  if (!f.number.trim()) out.push('numéro de compte');
  if (!f.alias.trim()) out.push('libellé du compte');
  if (!f.cashLabel) out.push('établissement bancaire');
  const main = ibanCheck(f.cashIban);
  if (main.state !== 'ok') out.push(main.state === 'empty' ? 'IBAN du compte principal' : 'IBAN du compte principal (clé non conforme)');
  cash.forEach((c, i) => {
    const chk = ibanCheck(c.iban);
    if (chk.state === 'ok') return;
    out.push('IBAN ' + (c.bank || 'du compte secondaire ' + (i + 1)) + (chk.state === 'bad' ? ' (clé non conforme)' : ''));
  });
  return out;
}

export function createIssues(f: FormState, titres: readonly TitreEntry[]): CreateIssue[] {
  const out: CreateIssue[] = [];
  if (!f.lastName.trim() || !f.firstName.trim()) {
    out.push({ title: 'Titulaire principal incomplet', detail: 'Le nom et le prénom du titulaire sont obligatoires pour ouvrir le compte.', step: 'Titulaires' });
  }
  /* Le dossier se crée avec ses comptes titre, tous complets : un compte à moitié renseigné
     n'est pas un compte, et un dossier sans aucun compte titre n'a rien à ouvrir. */
  if (!titres.length) {
    out.push({ title: 'Aucun compte titre', detail: "« Ajouter » ouvre un compte titre à renseigner, avec son compte de liquidité.", step: 'Comptes titre et liquidité' });
  }
  titres.forEach((t, i) => {
    const missing = titreIssues(t, t.cash);
    if (!missing.length) return;
    out.push({
      title: (t.alias || 'Compte titre ' + (i + 1)) + ' incomplet',
      detail: 'À renseigner : ' + missing.join(', ') + '.',
      step: 'Comptes titre et liquidité',
    });
  });
  return out;
}

export interface CreateSummaryRow {
  readonly label: string;
  readonly value: string;
}

export function createSummaryRows(f: FormState, titres: readonly TitreEntry[]): CreateSummaryRow[] {
  const flagB = (label: string) => (BROKERS.find((b) => b.label === label) || { flag: '' }).flag || '';
  const flagC = (code: string) => (CURRENCIES.find((c) => c.code === code) || { flag: '' }).flag || '';
  const flagK = (label: string) => (BANKS.find((b) => b.label === label) || { flag: '' }).flag || '';
  return [
    { label: 'Titulaire principal', value: fullName(f.lastName, f.firstName) || '—' },
    { label: 'Référence client', value: f.clientRef || 'Attribuée à la création' },
    { label: 'Comptes titre', value: titres.length ? String(titres.length) : 'Aucun' },
    ...titres.map((t) => ({
      label: t.alias || 'Compte titre',
      value: `${flagB(t.broker)} ${t.broker || '—'} · ${t.accountType || '—'} · ${flagC(t.currency)} ${t.currency} · n° ${t.number || '—'} · ${flagK(t.cashLabel)} ${t.cashLabel || '—'}`
        + (t.cash.length ? ' + ' + t.cash.length + ' secondaire(s)' : ''),
    })),
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
// Récapitulatif — recapGroups / recapPeople / recapVerdict
// ---------------------------------------------------------------------------

export function fullName(last: string, first: string): string {
  const l = (last || '').trim();
  const f = (first || '').trim();
  return l && f ? l + ', ' + f : l || f;
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
}

function flagInText(text: string): string {
  if (!text) return '';
  const hit = JURISDICTIONS.filter((x) => text.indexOf(x.label) >= 0).sort((a, b) => b.label.length - a.label.length)[0];
  return hit ? hit.flag : '';
}

/* Fabriques communes aux deux récapitulatifs : une valeur absente se lit « À renseigner » quand
   elle est exigée, « — » sinon, et l'état d'un groupe compte ses manques. */
const v = (x: string | undefined) => (x && x !== '—' ? x : '');
const row = (label: string, value: string | undefined, need = false): RecapRow => ({
  label, value: v(value) || (need ? 'À renseigner' : '—'),
  color: v(value) ? 'var(--color-text)' : need ? 'var(--ink-warn-2)' : 'var(--color-neutral-600)',
});
const grp = (title: string, rows: readonly RecapRow[]): RecapGroup => {
  const gaps = rows.filter((r) => r.value === 'À renseigner').length;
  return { title, rows, state: gaps ? gaps + ' à compléter' : 'Complet', stateColor: gaps ? 'var(--ink-warn-2)' : 'var(--ink-ok)' };
};
const withFlag = (r: RecapRow, flag: string): RecapRow => (flag ? { ...r, value: flag + '  ' + r.value } : r);

/**
 * Récapitulatif des comptes titre : rien d'autre qu'eux. Un groupe par compte titre — le compte
 * chez le broker — suivi de ses comptes de liquidité, principal puis secondaires. C'est la
 * relecture de l'étape des comptes, à laquelle les titulaires n'ont rien à faire.
 */
export function buildTitresRecapGroups(titres: readonly TitreEntry[]): RecapGroup[] {
  if (!titres.length) {
    return [{
      title: 'Comptes titre',
      rows: [{ label: 'Comptes titre', value: 'Aucun — « Ajouter » en ouvre un', color: 'var(--ink-warn-2)' }],
      state: 'À ajouter', stateColor: 'var(--ink-warn-2)',
    }];
  }
  const curOf = (code: string) => CURRENCIES.find((x) => x.code === code) || null;
  const cashRow = (label: string, bank: string, iban: string, currency: string): RecapRow => {
    const chk = ibanCheck(iban);
    const c = curOf(currency);
    const flag = (BANKS.find((b) => b.label === bank) || { flag: '' }).flag;
    const text = [
      bank || 'établissement à choisir',
      iban ? iban + (chk.state === 'ok' ? ' — clé conforme' : ' — clé non conforme') : 'IBAN à renseigner',
      c ? c.flag + ' ' + c.label : currency,
    ].join(' · ');
    return {
      label,
      value: (flag ? flag + '  ' : '') + text,
      color: bank && chk.state === 'ok' ? 'var(--color-text)' : 'var(--ink-warn-2)',
    };
  };
  return titres.flatMap((t, i) => {
    const name = t.alias || 'Compte titre ' + (i + 1);
    const brokerGroup = grp(name, [
      withFlag(row('Broker', t.broker, true), (BROKERS.find((b) => b.label === t.broker) || { flag: '' }).flag),
      withFlag(row('Juridiction', t.jurisdiction), flagInText(t.jurisdiction)),
      { ...row('Site du broker', t.url), href: /^https?:\/\//i.test(t.url || '') ? t.url : '' },
      row('Type de compte', t.accountType, true),
      (() => {
        const c = curOf(t.currency);
        const r = row('Devise de tenue', c ? c.label : t.currency, true);
        return withFlag(c ? { ...r, value: r.value + ' · ' + c.zone } : r, c ? c.flag : '');
      })(),
      row('Numéro de compte', t.number, true),
      row('Libellé du compte', t.alias, true),
      row("Date d'ouverture", t.opened),
      row('Statut chez le broker', t.brokerStatus || 'Ouvert'),
    ]);
    const cashRows = [
      cashRow('Compte principal', t.cashLabel, t.cashIban, t.cashCurrency),
      ...t.cash.map((c, j) => cashRow('Compte secondaire ' + (j + 1), c.bank, c.iban, c.currency)),
    ];
    const gaps = cashRows.filter((r) => r.color === 'var(--ink-warn-2)').length;
    const cashGroup: RecapGroup = {
      title: 'Comptes de liquidité — ' + name,
      rows: cashRows,
      state: gaps ? gaps + ' à compléter' : 'Complet',
      stateColor: gaps ? 'var(--ink-warn-2)' : 'var(--ink-ok)',
    };
    return [brokerGroup, cashGroup];
  });
}

export function buildRecapGroups(f: FormState, co: readonly CoHolder[], titres: readonly TitreEntry[] = []): RecapGroup[] {

  /* Le titulaire principal, champ pour champ dans l'ordre de l'étape Titulaires — civilité,
     identité, adresse, rattachement fiscal — puis chaque personne rattachée dans son propre
     groupe : le récapitulatif montre l'ensemble des titulaires d'un seul tenant, sans qu'on ait à
     les faire défiler un par un. */
  const address = [f.streetNo, f.streetType, f.street].map((x) => v(x)).filter(Boolean).join(' ');
  const titulaireGroup = grp('Titulaire principal', [
    row('Civilité', f.civility, true),
    row('Nom', f.lastName, true),
    row('Prénom', f.firstName, true),
    row('Adresse', address),
    row('Code postal', f.postalCode),
    row('Ville', f.city),
    withFlag(row('Pays', f.country), flagInText(f.country)),
    withFlag(row('Domiciliation', f.domicile, true), flagInText(f.domicile)),
    withFlag(row('Régime fiscal', f.taxRegime, true), flagInText(f.taxRegime)),
    row('Référence client', f.clientRef || 'Attribuée à la création'),
    row('Personnes rattachées', (() => {
      if (!co.length) return 'Aucune';
      const isBenef = (r: string) => (r || '').toLowerCase().indexOf('bénéficiaire') >= 0;
      const nb = co.filter((h) => isBenef(h.role)).length;
      const nc = co.length - nb;
      const parts: string[] = [];
      if (nc) parts.push(nc + (nc > 1 ? ' co-titulaires' : ' co-titulaire'));
      if (nb) parts.push(nb + (nb > 1 ? ' bénéficiaires' : ' bénéficiaire'));
      return parts.join(' · ');
    })()),
  ]);
  /* La liste des titulaires, une ligne par personne : qui, en quelle qualité, sous quelle
     référence. Le titulaire principal ouvre la liste, ses rattachés suivent dans l'ordre de
     saisie. */
  const person = (last: string, first: string) => [v(last), v(first)].filter(Boolean).join(', ');
  const holdersGroup = grp('Titulaires', [
    row('Titulaire principal', person(f.lastName, f.firstName) ? person(f.lastName, f.firstName) + ' · ' + (f.clientRef || 'référence à la création') : '', true),
    ...co.map((h, i) =>
      row(v(h.role) || 'Personne rattachée ' + (i + 1), person(h.last, h.first) ? person(h.last, h.first) + ' · ' + (f.clientRef || 'CLI-…') + '-' + String(i + 1).padStart(2, '0') : '', true),
    ),
  ]);

  const statusValue = f.statusChoice || 'Projet';
  const statusTone = statusValue === 'Actif' ? { bg: 'var(--field-ok)', fg: '#ffffff' }
    : statusValue === 'En ouverture' ? { bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok-2)' }
    : { bg: '#f5d90a', fg: 'var(--ink-5c4700)' };
  const statusHint = statusValue === 'Projet' ? 'Compte non encore créé'
    : statusValue === 'En ouverture' ? 'Dossier engagé, dotation attendue'
    : 'Compte créé, opérations autorisées';

  /* Ni compte titre ni compte de liquidité : le récapitulatif relit les titulaires — c'est de
     leur étape qu'il s'ouvre — et le statut du dossier. Les comptes se relisent sur leur étape,
     où chaque champ est sous les yeux. */
  /* Les comptes titre du dossier, une ligne chacun — ce que l'étape des comptes a ajouté, tel
     qu'on le relit avant de créer : établissement, type, numéro, compte de liquidité, et ce qui
     manque encore le cas échéant. Aucune ligne tant qu'aucun compte n'a été ajouté. */
  const titresIncomplete = titres.filter((t) => titreIssues(t, t.cash).length).length;
  const titresGroup: RecapGroup = titres.length
    ? {
        ...grp('Comptes titre', titres.map((t, i) => {
        const missing = titreIssues(t, t.cash);
        const flagB = (BROKERS.find((b) => b.label === t.broker) || { flag: '' }).flag;
        const flagK = (BANKS.find((b) => b.label === t.cashLabel) || { flag: '' }).flag;
        const summary = [
          t.broker ? (flagB ? flagB + ' ' : '') + t.broker : '',
          t.accountType ? t.accountType + ' · ' + t.currency : '',
          t.number ? 'n° ' + t.number : '',
          t.cashLabel ? (flagK ? flagK + ' ' : '') + t.cashLabel + (t.cash.length ? ' + ' + t.cash.length + ' secondaire(s)' : '') : '',
        ].filter(Boolean).join(' · ');
        return missing.length
          ? { label: t.alias || 'Compte titre ' + (i + 1), value: (summary ? summary + ' — ' : '') + 'à compléter : ' + missing.join(', '), color: 'var(--ink-warn-2)' }
          : { label: t.alias || 'Compte titre ' + (i + 1), value: summary, color: 'var(--color-text)' };
      })),
        /* L'état du groupe compte les comptes incomplets, et non les lignes vides : une ligne
           « à compléter » porte déjà un résumé. */
        state: titresIncomplete ? titresIncomplete + ' à compléter' : 'Complet',
        stateColor: titresIncomplete ? 'var(--ink-warn-2)' : 'var(--ink-ok)',
      }
    : { title: 'Comptes titre', rows: [{ label: 'Comptes titre', value: 'Aucun — « Ajouter » en ouvre un sur l\'étape des comptes', color: 'var(--ink-warn-2)' }], state: 'À ajouter', stateColor: 'var(--ink-warn-2)' };

  const groups: RecapGroup[] = [
    titulaireGroup,
    holdersGroup,
    titresGroup,
    grp('Statut du compte', [
      { label: 'Statut', value: statusHint, color: 'var(--color-text)', badge: statusValue, badgeBg: statusTone.bg, badgeFg: statusTone.fg },
      row('Date de fermeture', f.closed === '—' ? 'Compte ouvert' : f.closed, false),
    ]),
  ];
  return groups;
}

export function recapVerdict(f: FormState, co: readonly CoHolder[]): string {
  /* Un dossier déjà créé n'a plus rien « à compléter » : il est relu, pas jugé. */
  if (f.statusChoice === 'Actif' && f.clientRef) return `Compte créé — référence client ${f.clientRef}. Dossier verrouillé en lecture seule.`;
  /* Le verdict porte sur ce que le récapitulatif montre — les titulaires — et sur eux seuls :
     annoncer un IBAN manquant sous une liste qui n'en parle pas laissait chercher la ligne. */
  const missing = holderIssues(f, co);
  return missing.length ? 'À compléter : ' + missing.join(', ') + '.' : 'Titulaires complets — vous pouvez passer aux comptes.';
}
