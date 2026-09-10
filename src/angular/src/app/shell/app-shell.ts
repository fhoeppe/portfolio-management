import { Component, computed, HostBinding, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { HOME_ITEM, NAV_SECTIONS, type NavItem } from './nav-model';
import { ThemeService } from './theme.service';
import { MaskingService } from './masking.service';
import { ProfileDialog } from './profile-dialog';
import { AccountPreferencesDialog } from './account-preferences-dialog';
import { GuideDialog } from '../pages/guide/guide-dialog';
import { IconGlyph } from './icon-glyph';
import { ICON_EXPORT, ICON_EYE, ICON_EYE_OFF, ICON_LOGOUT, ICON_REFRESH } from './context-bar-icons';

/**
 * Porté depuis `Navigation Sobre.dc.html` (coque : bandeau, menu latéral, fil d'Ariane,
 * panneau de contenu). Différences volontaires par rapport au prototype :
 *
 * - le routage remplace `showPage()`/`data-page-panel` : les 19 panneaux n'étaient que des
 *   `<div style="display:none">` toujours montés ; ici chaque écran est une route avec son
 *   propre composant, chargée à la demande ;
 * - l'état actif/le fil d'Ariane ne sont plus reconstruits à la main dans un handler de
 *   clic délégué : `routerLinkActive` et les données de route (`data.section`/`data.crumb`)
 *   portent cette information nativement ;
 * - le survol des items de menu redevient du CSS (`:hover`), plus un handler JS ;
 * - le bilinguisme FR/EN du prototype (réécriture de tous les nœuds texte du DOM à la
 *   volée) n'est pas repris : aucun écran du domaine n'est aujourd'hui traduit, et ce
 *   mécanisme était l'un des points fragiles identifiés. À réintroduire proprement (i18n
 *   Angular ou pipe de traduction) si le besoin redevient réel.
 */
@Component({
  selector: 'app-shell',
  imports: [
    IconGlyph,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly theme = inject(ThemeService);
  protected readonly masking = inject(MaskingService);

  protected readonly homeItem = HOME_ITEM;
  protected readonly sections = NAV_SECTIONS;
  protected readonly icons = {
    refresh: ICON_REFRESH,
    export: ICON_EXPORT,
    eye: ICON_EYE,
    eyeOff: ICON_EYE_OFF,
    logout: ICON_LOGOUT,
  };

  protected readonly collapsed = signal(false);
  protected readonly expandedWidth = signal(269);
  protected readonly navWidth = computed(() => (this.collapsed() ? 72 : this.expandedWidth()));

  private readonly collapsedSections = signal(new Set<string>());

  protected readonly today = computed(() =>
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.deepestRouteData()),
      startWith(this.deepestRouteData()),
    ),
    { initialValue: { section: 'Gestion', crumb: 'Tableau de bord' } },
  );

  protected readonly breadcrumb = computed(() => this.navigationEnd());

  @HostBinding('attr.data-theme') get themeAttr() {
    return this.theme.mode();
  }

  private deepestRouteData(): { section: string; crumb: string } {
    let snap = this.router.routerState.snapshot.root;
    while (snap.firstChild) snap = snap.firstChild;
    const data = snap.data as { section?: string; crumb?: string };
    return { section: data['section'] ?? 'Gestion', crumb: data['crumb'] ?? 'Tableau de bord' };
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  protected isSectionCollapsed(sectionId: string): boolean {
    return this.collapsedSections().has(sectionId);
  }

  protected toggleSection(sectionId: string): void {
    this.collapsedSections.update((set) => {
      const next = new Set(set);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  }

  protected openProfile(): void {
    this.dialog.open(ProfileDialog);
  }

  protected openPreferences(): void {
    this.dialog.open(AccountPreferencesDialog);
  }

  protected readonly logout = () => {
    // À brancher sur le service d'authentification une fois qu'il existe.
  };

  protected readonly refresh = () => {
    // À brancher sur un rechargement des données de la page active (resource().reload()),
    // plutôt que window.location.reload() comme le faisait le prototype.
  };

  protected openGuide(): void {
    // maxWidth par défaut de MatDialog : 80vw, ce qui rognerait le panneau (min(1180px, 94vw)).
    this.dialog.open(GuideDialog, { maxWidth: '96vw', maxHeight: '96vh' });
  }

  protected trackItem = (_: number, item: NavItem) => item.id;
}
