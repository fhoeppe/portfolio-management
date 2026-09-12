import { Routes } from '@angular/router';
import { AppShell } from './shell/app-shell';
import { HOME_ITEM, NAV_SECTIONS } from './shell/nav-model';
import { PagePlaceholder } from './shell/page-placeholder';

/**
 * Routes dérivées du menu (`nav-model.ts`) plutôt que dupliquées à la main : chaque item
 * pointe vers l'écran de repli tant que la page réelle n'est pas portée. Remplacer
 * `loadComponent` par le composant de l'écran au fur et à mesure des portages, sans
 * toucher au menu.
 *
 * `guide` est en dehors du groupe enfant d'`AppShell` : le bouton « Guide » du bandeau l'ouvre
 * dans un nouvel onglet (lien `<a>` classique, pas `routerLink`) pour que la documentation
 * reste une page à part — sans menu latéral ni bandeau — plutôt qu'un écran de plus dans la
 * coque applicative. Sans parent `AppShell`, `guide.ts` ne peut pas hériter les jetons
 * `--ink-*`/`--field-*`/`--surface`/`--color-*` de `app-shell.css` : il les reporte lui-même
 * (voir `guide.css`), comme le faisait l'ancienne version en boîte de dialogue.
 *
 * `Annexes` (référentiel des codes/légendes) n'a plus sa propre route : c'est désormais un
 * onglet de `guide` (voir `standalone/guide/guide.ts`), au même titre — matière de référence,
 * pas un écran d'usage courant du menu. Retirée aussi de `nav-model.ts`.
 */
export const routes: Routes = [
  {
    path: 'guide',
    loadComponent: () => import('./standalone/guide/guide').then((m) => m.Guide),
  },
  {
    path: 'visionneuse',
    loadComponent: () => import('./standalone/visionneuse/visionneuse').then((m) => m.Visionneuse),
  },
  {
    path: '',
    component: AppShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: HOME_ITEM.route.slice(1) },
      {
        path: HOME_ITEM.route.slice(1),
        loadComponent: () => import('./pages/accueil/accueil').then((m) => m.Accueil),
        data: { section: 'Accueil', crumb: HOME_ITEM.label },
      },
      {
        path: 'tableau-de-bord',
        loadComponent: () => import('./pages/tableau-de-bord/tableau-de-bord').then((m) => m.TableauDeBord),
        data: { section: 'Gestion', crumb: 'Tableau de bord' },
      },
      {
        path: 'positions',
        loadComponent: () => import('./pages/positions/positions').then((m) => m.Positions),
        data: { section: 'Gestion', crumb: 'Positions' },
      },
      {
        path: 'operations',
        loadComponent: () => import('./pages/operations/operations').then((m) => m.Operations),
        data: { section: 'Gestion', crumb: 'Opérations' },
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/transactions/transactions').then((m) => m.Transactions),
        data: { section: 'Gestion', crumb: 'Transactions' },
      },
      {
        path: 'titres',
        loadComponent: () => import('./pages/titres/titres').then((m) => m.Titres),
        data: { section: 'Gestion', crumb: 'Titres' },
      },
      {
        path: 'comptes',
        loadComponent: () => import('./pages/comptes/comptes').then((m) => m.Comptes),
        data: { section: 'Gestion', crumb: 'Comptes' },
      },
      {
        path: 'reconciliation',
        loadComponent: () => import('./pages/reconciliation/reconciliation').then((m) => m.Reconciliation),
        data: { section: 'Gestion', crumb: 'Réconciliation' },
      },
      {
        path: 'performance',
        loadComponent: () => import('./pages/performance/performance').then((m) => m.Performance),
        data: { section: 'Gestion', crumb: 'Performance' },
      },
      {
        path: 'cours',
        loadComponent: () => import('./pages/cours/cours').then((m) => m.Cours),
        data: { section: 'Marché', crumb: 'Cours marché' },
      },
      {
        path: 'echeances',
        loadComponent: () => import('./pages/echeances/echeances').then((m) => m.Echeances),
        data: { section: 'Marché', crumb: 'Échéances' },
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./pages/calendrier/calendrier').then((m) => m.Calendrier),
        data: { section: 'Marché', crumb: 'Calendrier' },
      },
      {
        path: 'tresorerie',
        loadComponent: () => import('./pages/tresorerie/tresorerie').then((m) => m.Tresorerie),
        data: { section: 'Gestion', crumb: 'Trésorerie' },
      },
      {
        path: 'comptabilite',
        loadComponent: () => import('./pages/comptabilite/comptabilite').then((m) => m.Comptabilite),
        data: { section: 'Gestion', crumb: 'Comptabilité' },
      },
      {
        path: 'documents',
        loadComponent: () => import('./pages/documents/documents').then((m) => m.Documents),
        data: { section: 'Gestion', crumb: 'Documents' },
      },
      {
        path: 'simulation',
        loadComponent: () => import('./pages/simulation/simulation').then((m) => m.Simulation),
        data: { section: 'Gestion', crumb: 'Gestion du risque' },
      },
      {
        path: 'rapports',
        loadComponent: () => import('./pages/rapports/rapports').then((m) => m.Rapports),
        data: { section: 'Administration', crumb: 'Rapports' },
      },
      {
        path: 'parametres',
        loadComponent: () => import('./pages/parametres/parametres').then((m) => m.Parametres),
        data: { section: 'Administration', crumb: 'Paramètres' },
      },
      ...NAV_SECTIONS.flatMap((section) =>
        section.items
          .filter((item) => item.id !== 'dash' && item.id !== 'positions' && item.id !== 'orders' && item.id !== 'transactions' && item.id !== 'universe' && item.id !== 'accounts' && item.id !== 'recon' && item.id !== 'perf' && item.id !== 'settings' && item.id !== 'sim' && item.id !== 'documents' && item.id !== 'accounting' && item.id !== 'cash' && item.id !== 'calendar' && item.id !== 'reports' && item.id !== 'due' && item.id !== 'quotes')
          .map((item) => ({
            path: item.route.slice(1),
            loadComponent: () => import('./shell/page-placeholder').then((m) => m.PagePlaceholder),
            data: { section: section.label, crumb: item.label },
          })),
      ),
      { path: '**', component: PagePlaceholder, data: { section: '', crumb: 'Page introuvable' } },
    ],
  },
];
