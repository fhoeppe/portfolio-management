/**
 * Rôles, permissions et affectation des utilisateurs.
 *
 * Aucun prototype `.dc.html` ne couvre cet écran : le modèle est établi ici, en s'alignant sur
 * ce que l'application expose réellement. Les écrans soumis à permission sont dérivés de
 * `nav-model.ts` plutôt que recopiés — une entrée ajoutée au menu apparaît d'elle-même dans la
 * matrice, au lieu d'y manquer silencieusement.
 */
import { HOME_ITEM, NAV_SECTIONS } from '../../shell/nav-model';

/** Quatre degrés cumulatifs : chacun contient le précédent. */
export type PermissionLevel = 'none' | 'read' | 'write' | 'approve';

export interface PermissionLevelDef {
  readonly label: string;
  /** Libellé court, pour la cellule de matrice où la place manque. */
  readonly short: string;
  readonly bg: string;
  readonly fg: string;
  readonly hint: string;
}

export const PERMISSION_LEVELS: Readonly<Record<PermissionLevel, PermissionLevelDef>> = {
  none: {
    label: 'Aucun accès',
    short: 'Aucun',
    bg: 'var(--color-neutral-200)',
    fg: 'var(--color-neutral-700)',
    hint: "L'écran n'apparaît pas dans le menu",
  },
  read: {
    label: 'Consultation',
    short: 'Lecture',
    bg: 'rgba(2,132,199,0.16)',
    fg: 'var(--ink-info)',
    hint: 'Lecture seule, aucune saisie possible',
  },
  write: {
    label: 'Modification',
    short: 'Écriture',
    bg: 'rgba(0,61,165,0.14)',
    fg: 'var(--ink-brand)',
    hint: 'Saisie et correction, sans mise en production',
  },
  approve: {
    label: 'Validation',
    short: 'Validation',
    bg: 'rgba(15,118,110,0.16)',
    fg: 'var(--ink-ok)',
    hint: 'Valide les saisies des autres et engage le dossier',
  },
};

export const PERMISSION_ORDER: readonly PermissionLevel[] = ['none', 'read', 'write', 'approve'];

export interface Role {
  readonly key: string;
  readonly label: string;
  readonly hint: string;
  readonly bg: string;
  readonly fg: string;
  /** Rôle non modifiable : il porte l'accès complet, le retirer fermerait l'application. */
  readonly locked?: boolean;
}

export const ROLES: readonly Role[] = [
  {
    key: 'admin',
    label: 'Administrateur',
    hint: "Accès complet, y compris les paramètres et les rôles",
    bg: 'rgba(0,61,165,0.16)',
    fg: 'var(--ink-brand)',
    locked: true,
  },
  {
    key: 'manager',
    label: 'Gestionnaire',
    hint: 'Décide et engage les opérations sur les portefeuilles suivis',
    bg: 'rgba(15,118,110,0.16)',
    fg: 'var(--ink-ok)',
  },
  {
    key: 'analyst',
    label: 'Analyste',
    hint: "Prépare les dossiers et l'univers d'investissement, sans engager",
    bg: 'rgba(124,92,191,0.16)',
    fg: 'var(--ink-alt)',
  },
  {
    key: 'accountant',
    label: 'Comptable',
    hint: 'Tient les écritures, rapproche et justifie les suspens',
    bg: 'rgba(180,83,9,0.16)',
    fg: 'var(--ink-warn)',
  },
  {
    key: 'viewer',
    label: 'Lecteur',
    hint: 'Consultation seule, sans aucune saisie',
    bg: 'var(--color-neutral-200)',
    fg: 'var(--color-neutral-700)',
  },
];

export interface PermissionArea {
  readonly id: string;
  readonly label: string;
  readonly section: string;
  readonly icon: string;
}

/** Les écrans soumis à permission, dans l'ordre du menu, Accueil compris. */
export const PERMISSION_AREAS: readonly PermissionArea[] = [
  { id: HOME_ITEM.id, label: HOME_ITEM.label, section: 'Général', icon: HOME_ITEM.icon },
  ...NAV_SECTIONS.flatMap((s) =>
    s.items.map((i) => ({ id: i.id, label: i.label, section: s.label, icon: i.icon })),
  ),
];

/* Barème par défaut, écran par écran. Les entrées absentes valent `read` pour les rôles
   métier et `none` pour le lecteur — voir `defaultLevel` : écrire les 85 cases à la main les
   désynchroniserait du menu au premier écran ajouté. */
const EXCEPTIONS: Readonly<Record<string, Partial<Record<string, PermissionLevel>>>> = {
  // Écrans d'engagement : le gestionnaire valide, l'analyste prépare sans engager.
  orders: { manager: 'approve', analyst: 'write', accountant: 'read' },
  transactions: { manager: 'approve', analyst: 'read', accountant: 'write' },
  cash: { manager: 'approve', analyst: 'read', accountant: 'write' },
  // Écrans comptables : le comptable valide, le gestionnaire consulte.
  recon: { manager: 'read', analyst: 'read', accountant: 'approve' },
  accounting: { manager: 'read', analyst: 'none', accountant: 'approve' },
  documents: { manager: 'write', analyst: 'write', accountant: 'write' },
  // Univers d'investissement : l'analyste en est responsable.
  universe: { manager: 'write', analyst: 'approve', accountant: 'none' },
  accounts: { manager: 'write', analyst: 'read', accountant: 'read' },
  risk: { manager: 'read', analyst: 'write', accountant: 'none' },
  reports: { manager: 'write', analyst: 'write', accountant: 'write' },
  // Administration : réservée au seul administrateur.
  settings: { manager: 'none', analyst: 'none', accountant: 'none', viewer: 'none' },
};

export function defaultLevel(areaId: string, roleKey: string): PermissionLevel {
  if (roleKey === 'admin') return 'approve';
  return EXCEPTIONS[areaId]?.[roleKey] ?? 'read';
}

export type UserStatus = 'active' | 'invited' | 'suspended';

export interface UserStatusDef {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
}

export const USER_STATUS: Readonly<Record<UserStatus, UserStatusDef>> = {
  active: { label: 'Actif', bg: 'rgba(15,118,110,0.16)', fg: 'var(--ink-ok)' },
  invited: { label: 'Invité', bg: 'rgba(0,61,165,0.14)', fg: 'var(--ink-brand)' },
  suspended: { label: 'Suspendu', bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' },
};

export interface AppUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: UserStatus;
  /** Dernière connexion, ou la date d'invitation pour un compte jamais ouvert. */
  readonly lastSeen: string;
}

export const USERS: readonly AppUser[] = [
  { id: 'u1', name: 'HOEPPE, Fabrice', email: 'f.hoeppe@exemple.lu', role: 'admin', status: 'active', lastSeen: '12/09/2026 08:41' },
  { id: 'u2', name: 'BERGER, Claire', email: 'c.berger@exemple.lu', role: 'manager', status: 'active', lastSeen: '12/09/2026 07:55' },
  { id: 'u3', name: 'NOVAK, Étienne', email: 'e.novak@exemple.lu', role: 'manager', status: 'active', lastSeen: '11/09/2026 18:02' },
  { id: 'u4', name: 'RIVIÈRE, Salomé', email: 's.riviere@exemple.lu', role: 'analyst', status: 'active', lastSeen: '12/09/2026 09:10' },
  { id: 'u5', name: 'ALMEIDA, Théo', email: 't.almeida@exemple.lu', role: 'analyst', status: 'invited', lastSeen: 'Invité le 09/09/2026' },
  { id: 'u6', name: 'LEFÈVRE, Maud', email: 'm.lefevre@exemple.lu', role: 'accountant', status: 'active', lastSeen: '11/09/2026 16:47' },
  { id: 'u7', name: 'OKONKWO, Ada', email: 'a.okonkwo@exemple.lu', role: 'accountant', status: 'suspended', lastSeen: '28/08/2026 11:20' },
  { id: 'u8', name: 'VASSEUR, Jonas', email: 'j.vasseur@exemple.lu', role: 'viewer', status: 'active', lastSeen: '10/09/2026 14:33' },
];

/** Initiales pour la pastille d'un utilisateur : « HOEPPE, Fabrice » → « HF ». */
export function initials(name: string): string {
  const [last = '', first = ''] = name.split(',').map((p) => p.trim());
  return (last.charAt(0) + first.charAt(0)).toUpperCase();
}
