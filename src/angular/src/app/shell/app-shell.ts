import { afterNextRender, Component, computed, HostBinding, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { HOME_ITEM, NAV_SECTIONS, type NavBadge, type NavItem } from './nav-model';
import { SecurityUniverseStore } from '../domain/security-universe.store';
import { ThemeService } from './theme.service';
import { MaskingService } from './masking.service';
import { ProfileDialog } from './profile-dialog';
import { AccountPreferencesDialog } from './account-preferences-dialog';
import { MatIconModule } from '@angular/material/icon';
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
 * - le sélecteur FR/EN du menu compte (repris pour coller au style du prototype) ne fait que
 *   mémoriser le choix visuel dans `lang` : le mécanisme du prototype (réécriture de tous les
 *   nœuds texte du DOM à la volée) n'est pas repris, et aucun écran du domaine n'est
 *   aujourd'hui traduit. À brancher sur une vraie i18n Angular (ou pipe de traduction) si le
 *   besoin redevient réel — voir `setLang()`.
 */
@Component({
  selector: 'app-shell',
  imports: [
    MatIconModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonToggleModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly theme = inject(ThemeService);
  protected readonly masking = inject(MaskingService);

  private readonly universe = inject(SecurityUniverseStore);

  protected readonly homeItem = HOME_ITEM;

  /**
   * Compteurs que le menu tient d'un store, et non de son modèle.
   *
   * `nav-model.ts` décrit le menu ; il ne compte rien, et n'a aucun moyen de le faire — ce n'est
   * pas un injectable. Les nombres qu'il portait étaient donc des littéraux, avec ce que cela
   * suppose : celui des titres annonçait 15 sous le libellé « Titres suivis », alors que 15 est
   * le nombre de titres *référencés* et que les suivis sont quatre.
   *
   * La pastille compte les **négociables**, comme la vignette de l'écran et le dénominateur de
   * son tableau : le menu annonce ce que la page va montrer. Elle tient ce nombre de la longueur
   * de la liste, jamais d'un second calcul — c'est la même règle partout, une seule définition.
   *
   * Elle disparaît tant que le catalogue n'est pas chargé, plutôt que d'afficher zéro ou un
   * nombre de façade. La fenêtre est brève : un `provideAppInitializer` réclame le référentiel au
   * démarrage — c'est ce qui permet au menu d'annoncer un nombre sans que personne n'ait ouvert
   * l'écran — et il le fait sans attendre la réponse, pour ne pas échanger une pastille contre un
   * écran blanc. Le menu ne déclenche donc rien lui-même ; il lit ce qui arrive.
   *
   * La condition porte sur `ready()` et non sur le compte : un univers réellement vide de
   * négociables est un fait à montrer, pas un chargement en cours.
   */
  private readonly liveBadges = computed<Readonly<Record<string, readonly NavBadge[]>>>(() => {
    const tradable = this.universe.tradableCount();
    return {
      universe: this.universe.ready() ? [{ count: tradable, tone: 'default', label: 'Titres négociables' }] : [],
    };
  });

  protected readonly sections = computed(() =>
    NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const live = this.liveBadges()[item.id];
        return live ? { ...item, badges: live } : item;
      }),
    })),
  );
  protected readonly icons = {
    refresh: ICON_REFRESH,
    export: ICON_EXPORT,
    eye: ICON_EYE,
    eyeOff: ICON_EYE_OFF,
    logout: ICON_LOGOUT,
  };

  /**
   * Délai d'apparition des info-bulles du menu latéral, plus long que le délai global de
   * `app.config.ts` : le menu se parcourt au survol, et une bulle qui sort au bout d'une seconde
   * se déclencherait à chaque entrée simplement traversée pour en atteindre une autre.
   */
  protected readonly navTooltipDelay = 3000;

  /**
   * Faux tant que le client n'a pas rendu une première fois — voir `.pm-content` dans la feuille
   * de la coque. L'application est prérendue (`ng-server-context="ssg"`) : le serveur ne peut pas
   * mesurer le panneau, donc MatSidenavContainer ne pose la marge du contenu qu'après
   * l'hydratation. Sans ce drapeau, ce recalage était joué par la transition destinée au repli du
   * menu, et la page semblait glisser depuis sous le menu jusqu'à sa place.
   */
  protected readonly booted = signal(false);

  constructor() {
    afterNextRender(() => this.booted.set(true));
  }

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

  /* `afterNextRender` ne s'exécute que dans le navigateur : la classe n'est donc jamais dans le
     HTML prérendu, et la transition reste éteinte pour le premier rendu. */
  @HostBinding('class.pm-booted') get bootedClass() {
    return this.booted();
  }

  /* Une seule source pour la largeur du panneau, exposée en propriété CSS sur la coque : le
     panneau la lit pour se dimensionner, le bouton de repli pour se poser sur son bord. Elle
     remplace deux styles en ligne (`[style.width.px]` sur le mat-sidenav, `[style.left.px]` sur
     le bouton) qui obligeaient à recopier la même valeur à deux endroits, et dispensait le
     bouton d'un ancrage CSS Anchor Positioning réservé aux navigateurs récents. */
  @HostBinding('style.--pm-nav-w') get navWidthVar() {
    return this.navWidth() + 'px';
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
    this.dialog.open(ProfileDialog, { panelClass: 'pm-compact-dialog-overlay' });
  }

  protected openPreferences(): void {
    this.dialog.open(AccountPreferencesDialog, { panelClass: 'pm-compact-dialog-overlay' });
  }

  protected readonly lang = signal<'fr' | 'en'>('fr');

  protected setLang(value: 'fr' | 'en'): void {
    this.lang.set(value);
  }

  protected readonly logout = () => {
    // À brancher sur le service d'authentification une fois qu'il existe.
  };

  protected readonly refresh = () => {
    // À brancher sur un rechargement des données de la page active (resource().reload()),
    // plutôt que window.location.reload() comme le faisait le prototype.
  };

  protected trackItem = (_: number, item: NavItem) => item.id;
}
