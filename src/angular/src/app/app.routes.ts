import { Routes } from '@angular/router';
import { HOME_ITEM, NAV_SECTIONS } from './shell/nav-model';
import { PagePlaceholder } from './shell/page-placeholder';

/**
 * Routes dérivées du menu (`nav-model.ts`) plutôt que dupliquées à la main : chaque item
 * pointe vers l'écran de repli tant que la page réelle n'est pas portée. Remplacer
 * `loadComponent` par le composant de l'écran au fur et à mesure des portages, sans
 * toucher au menu.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: HOME_ITEM.route.slice(1) },
  {
    path: HOME_ITEM.route.slice(1),
    loadComponent: () => import('./shell/page-placeholder').then((m) => m.PagePlaceholder),
    data: { section: 'Accueil', crumb: HOME_ITEM.label },
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () => import('./pages/tableau-de-bord/tableau-de-bord').then((m) => m.TableauDeBord),
    data: { section: 'Gestion', crumb: 'Tableau de bord' },
  },
  {
    path: 'annexes',
    loadComponent: () => import('./pages/annexes/annexes').then((m) => m.Annexes),
    data: { section: 'Administration', crumb: 'Annexes et légendes' },
  },
  ...NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => item.id !== 'dash' && item.id !== 'legend')
      .map((item) => ({
        path: item.route.slice(1),
        loadComponent: () => import('./shell/page-placeholder').then((m) => m.PagePlaceholder),
        data: { section: section.label, crumb: item.label },
      })),
  ),
  { path: '**', component: PagePlaceholder, data: { section: '', crumb: 'Page introuvable' } },
];
