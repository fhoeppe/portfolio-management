/**
 * Contenu du menu latéral, porté depuis `Navigation Sobre.dc.html`.
 *
 * Les icônes utilisent le modèle de formes typées de `icon-shapes.ts` (path/rect/circle/
 * line), pas une chaîne de markup SVG : la liaison `[innerHTML]` sur un `<svg>` n'est pas
 * prise en charge par le rendu serveur d'Angular (elle échoue avec « NotYetImplemented » et
 * interrompt le rendu du reste du composant). Les tracés sont recopiés à l'identique du
 * prototype.
 */

import { iconCircle as circle, iconLine as line, iconPath as p, iconRect as rect, type Icon } from './icon-shapes';
export type { Icon } from './icon-shapes';

export interface NavBadge {
  readonly count: number;
  readonly tone: 'default' | 'warn';
  readonly label: string;
}

export interface NavItem {
  readonly id: string;
  readonly label: string;
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
  route: '/accueil',
  icon: [
    p('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'),
    p('M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
  ],
};

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'gestion',
    label: 'Gestion',
    items: [
      {
        id: 'dash',
        label: 'Tableau de bord',
        route: '/tableau-de-bord',
        icon: [rect(3, 3, 7, 9, 1), rect(14, 3, 7, 5, 1), rect(14, 12, 7, 9, 1), rect(3, 16, 7, 5, 1)],
      },
      {
        id: 'accounts',
        label: 'Comptes',
        route: '/comptes',
        icon: [
          p('M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z'),
          p('M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2'),
          p('M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2'),
          p('M10 6h4'),
          p('M10 10h4'),
          p('M10 14h4'),
          p('M10 18h4'),
        ],
        badges: [{ count: 6, tone: 'default', label: 'Comptes' }],
      },
      {
        id: 'positions',
        label: 'Positions',
        route: '/positions',
        icon: [
          p('M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z'),
          p('M21.21 15.89A10 10 0 1 1 8 2.83'),
        ],
        badges: [{ count: 6, tone: 'default', label: 'Comptes en position' }],
      },
      {
        id: 'universe',
        label: 'Titres',
        route: '/titres',
        icon: [
          p('M9 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12'),
          p('M3 21V13a2 2 0 0 1 2-2h4'),
          p('M15 11h4a2 2 0 0 1 2 2v8'),
          p('M2 21h20'),
          p('M12 7V3'),
          p('m10 5 2-2 2 2'),
        ],
        badges: [{ count: 15, tone: 'default', label: 'Titres suivis' }],
      },
      {
        id: 'orders',
        label: 'Opérations',
        route: '/operations',
        icon: [p('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'), p('m15 5 4 4')],
      },
      {
        id: 'cash',
        label: 'Trésorerie',
        route: '/tresorerie',
        icon: [rect(2, 6, 20, 12, 2), circle(12, 12, 2), p('M6 12h.01'), p('M18 12h.01')],
      },
      {
        id: 'recon',
        label: 'Réconciliation',
        route: '/reconciliation',
        icon: [
          p('m16 3 4 4-4 4'),
          p('M20 7H4'),
          p('m8 21-4-4 4-4'),
          p('M4 17h16'),
          circle(12, 12, 0.5, 'currentColor'),
        ],
      },
      {
        id: 'transactions',
        label: 'Transactions',
        route: '/transactions',
        icon: [
          p('M15 12h-5'),
          p('M15 8h-5'),
          p('M19 17V5a2 2 0 0 0-2-2H4'),
          p(
            'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
          ),
        ],
      },
      {
        id: 'sim',
        label: 'Gestion du risque',
        route: '/simulation',
        icon: [p('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'), p('M12 8v4'), p('M12 16h.01')],
      },
      {
        id: 'perf',
        label: 'Performance',
        route: '/performance',
        icon: [p('M3 3v18h18'), p('m7 14 4-4 3 3 5-6'), circle(11, 10, 1.4), circle(19, 7, 1.4)],
      },
      {
        id: 'accounting',
        label: 'Comptabilité',
        route: '/comptabilite',
        icon: [
          rect(4, 2, 16, 20, 2),
          line(8, 6, 16, 6),
          line(16, 14, 16, 18),
          p('M16 10h.01'),
          p('M12 10h.01'),
          p('M8 10h.01'),
          p('M12 14h.01'),
          p('M8 14h.01'),
          p('M12 18h.01'),
          p('M8 18h.01'),
        ],
      },
      {
        id: 'documents',
        label: 'Documents',
        route: '/documents',
        icon: [
          p('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'),
          p('M14 2v4a2 2 0 0 0 2 2h4'),
          p('M10 9H8'),
          p('M16 13H8'),
          p('M16 17H8'),
        ],
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
        // Non routé dans le prototype (aucun data-page sur ce bouton) — route provisoire.
        route: '/cours',
        icon: [p('M16 7h6v6'), p('m22 7-8.5 8.5-5-5L2 17')],
      },
      {
        id: 'due',
        label: 'Échéances',
        route: '/echeances',
        icon: [p('M8 2v4'), p('M16 2v4'), rect(3, 4, 18, 18, 2), p('M3 10h18')],
        badges: [
          { count: 2, tone: 'warn', label: 'Échéances en retard' },
          { count: 14, tone: 'default', label: 'Échéances à venir' },
        ],
      },
      {
        id: 'calendar',
        label: 'Calendrier',
        route: '/calendrier',
        icon: [
          p('M8 2v4'),
          p('M16 2v4'),
          rect(3, 4, 18, 18, 2),
          p('M3 10h18'),
          p('M8 14h.01'),
          p('M12 14h.01'),
          p('M16 14h.01'),
          p('M8 18h.01'),
          p('M12 18h.01'),
          p('M16 18h.01'),
        ],
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      {
        id: 'reports',
        label: 'Rapports',
        route: '/rapports',
        icon: [p('M3 3v16a2 2 0 0 0 2 2h16'), p('M18 17V9'), p('M13 17V5'), p('M8 17v-3')],
      },
      {
        id: 'settings',
        label: 'Paramètres',
        route: '/parametres',
        icon: [
          p(
            'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
          ),
          circle(12, 12, 3),
        ],
      },
      {
        id: 'legend',
        label: 'Annexes et légendes',
        route: '/annexes',
        icon: [p('M3 6h4'), p('M3 12h4'), p('M3 18h4'), p('M11 6h10'), p('M11 12h10'), p('M11 18h10')],
      },
    ],
  },
];

export const ALL_NAV_ITEMS: readonly NavItem[] = [HOME_ITEM, ...NAV_SECTIONS.flatMap((s) => s.items)];
