/**
 * Contenu du menu latéral, porté depuis `Navigation Sobre.dc.html`.
 *
 * `icon` est un nom du registre Material (voir `icon-registry.service.ts`), pas un tracé SVG
 * inline : `Icon` n'est plus qu'un alias de `string` (voir `icon-shapes.ts`).
 */

import type { Icon } from './icon-shapes';
export type { Icon } from './icon-shapes';

export interface NavBadge {
  readonly count: number;
  readonly tone: 'default' | 'warn';
  readonly label: string;
}

export interface NavItem {
  readonly id: string;
  readonly label: string;
  /**
   * Info-bulle de l'entrée, formulée en question : elle dit à quoi sert l'écran plutôt que de
   * répéter son libellé, qui est déjà lisible juste à côté (et, menu replié, se devine à
   * l'icône). Obligatoire pour qu'aucune entrée ajoutée plus tard ne reste sans explication.
   */
  readonly hint: string;
  readonly route: string;
  readonly icon: Icon;
  readonly badges?: readonly NavBadge[];
}

export interface NavSection {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavItem[];
}

/** Item pinglé hors section, toujours visible dans le bandeau de contexte. */
export const HOME_ITEM: NavItem = {
  id: 'home',
  label: 'Accueil',
  hint: 'Que dois-je traiter en priorité aujourd\'hui ?',
  route: '/accueil',
  icon: 'home',
};

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'gestion',
    label: 'Gestion',
    items: [
      {
        id: 'dash',
        label: 'Tableau de bord',
        hint: 'Comment se portent les portefeuilles dans leur ensemble ?',
        route: '/tableau-de-bord',
        icon: 'dashboard',
      },
      {
        id: 'accounts',
        label: 'Comptes',
        hint: 'Quels comptes sont ouverts, et où en est leur cycle de vie ?',
        route: '/comptes',
        icon: 'ledger-book',
        badges: [{ count: 6, tone: 'default', label: 'Comptes' }],
      },
      {
        id: 'positions',
        label: 'Positions',
        hint: 'Que détient chaque portefeuille, et combien cela vaut-il ?',
        route: '/positions',
        icon: 'pie-chart',
        badges: [{ count: 6, tone: 'default', label: 'Comptes en position' }],
      },
      {
        id: 'universe',
        label: 'Titres',
        hint: 'Quels titres ai-je le droit d\'acheter ?',
        route: '/titres',
        icon: 'library',
        badges: [{ count: 15, tone: 'default', label: 'Titres suivis' }],
      },
      {
        id: 'orders',
        label: 'Opérations',
        hint: 'Où en sont les ordres et instructions que j\'ai passés ?',
        route: '/operations',
        icon: 'edit',
      },
      {
        id: 'cash',
        label: 'Trésorerie',
        hint: 'De combien de liquidités puis-je disposer, et sur quels comptes ?',
        route: '/tresorerie',
        icon: 'banknote',
      },
      {
        id: 'recon',
        label: 'Réconciliation',
        hint: 'Ma saisie correspond-elle bien aux relevés du broker ?',
        route: '/reconciliation',
        icon: 'shuffle',
      },
      {
        id: 'transactions',
        label: 'Transactions',
        hint: 'Qu\'est-il exactement arrivé sur un portefeuille, et quand ?',
        route: '/transactions',
        icon: 'receipt',
      },
      {
        id: 'sim',
        label: 'Gestion du risque',
        hint: 'Les portefeuilles respectent-ils leurs limites de risque ?',
        route: '/simulation',
        icon: 'shield',
      },
      {
        id: 'perf',
        label: 'Performance',
        hint: 'Combien les portefeuilles ont-ils rapporté, et grâce à quoi ?',
        route: '/performance',
        icon: 'chart-performance',
      },
      {
        id: 'accounting',
        label: 'Comptabilité',
        hint: 'Quelles écritures comptables découlent de ces mouvements ?',
        route: '/comptabilite',
        icon: 'ledger',
      },
      {
        id: 'documents',
        label: 'Documents',
        hint: 'Où retrouver les pièces justificatives d\'un dossier ?',
        route: '/documents',
        icon: 'file-lines',
      },
    ],
  },
  {
    id: 'marche',
    label: 'Marché',
    items: [
      {
        id: 'quotes',
        label: 'Cours marché',
        hint: 'À quel cours les titres se traitent-ils en ce moment ?',
        // Non routé dans le prototype (aucun data-page sur ce bouton) — route provisoire.
        route: '/cours',
        icon: 'trending-up',
      },
      {
        id: 'due',
        label: 'Échéances',
        hint: 'Quelles échéances arrivent à terme, et lesquelles sont en retard ?',
        route: '/echeances',
        icon: 'calendar',
        badges: [
          { count: 2, tone: 'warn', label: 'Échéances en retard' },
          { count: 14, tone: 'default', label: 'Échéances à venir' },
        ],
      },
      {
        id: 'calendar',
        label: 'Calendrier',
        hint: 'Quels événements attendent les portefeuilles dans les jours à venir ?',
        route: '/calendrier',
        icon: 'calendar-days',
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    // « Annexes et légendes » n'est plus ici : c'est un onglet de la page Guide
    // (app/standalone/guide/), pas un écran d'usage courant — voir app.routes.ts.
    items: [
      {
        id: 'reports',
        label: 'Rapports',
        hint: 'Quel document de reporting éditer pour un client ?',
        route: '/rapports',
        icon: 'chart-bar',
      },
      {
        id: 'settings',
        label: 'Paramètres',
        hint: 'Comment adapter l\'application à ma façon de travailler ?',
        route: '/parametres',
        icon: 'settings',
      },
    ],
  },
];

export const ALL_NAV_ITEMS: readonly NavItem[] = [HOME_ITEM, ...NAV_SECTIONS.flatMap((s) => s.items)];
