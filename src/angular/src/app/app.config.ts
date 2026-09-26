import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, type MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { IconRegistryService } from './shell/icon-registry.service';
import { SecurityUniverseStore } from './domain/security-universe.store';

/**
 * Délai d'apparition des info-bulles, posé une seule fois ici plutôt que répété en
 * `matTooltipShowDelay` sur chaque élément : l'app en compte plus d'une centaine, et la valeur
 * a vocation à être réglée globalement. `hideDelay`/`touchendHideDelay` reprennent les valeurs
 * par défaut de Material, que l'objet doit fournir en entier puisqu'il les remplace toutes.
 */
const TOOLTIP_OPTIONS: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 0,
  touchendHideDelay: 1500,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(),
    // `withFetch()` plutôt que XHR : c'est le transport que le rendu serveur sait suivre, et il
    // évite l'avertissement d'Angular au prérendu.
    provideHttpClient(withFetch()),
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: TOOLTIP_OPTIONS },
    // MatDatepicker exige un adaptateur de date ; l'adaptateur natif suffit ici, aucune
    // bibliothèque tierce (Moment, Luxon) n'étant utilisée. La locale force l'affichage en
    // jj/mm/aaaa, comme le faisait le calendrier natif de <input type="date"> en français.
    provideNativeDateAdapter(),
    // Les animations Material sont déclarées, plutôt que tacitement absentes.
    //
    // Sans provider ni `@angular/animations`, Angular Material considère les animations actives
    // et emprunte ses chemins animés — ouverture de dialogue, menus, ondes de clic — sans que le
    // moteur soit là pour les jouer. Rien ne casse, mais l'état réel n'était écrit nulle part :
    // il se déduisait d'une dépendance manquante. Le déclarer vaut mieux que le subir.
    //
    // La variante asynchrone, et pas `provideAnimations()` : le moteur part en morceau séparé,
    // chargé après le premier rendu. Il ne pèse donc pas sur le fascicule initial, déjà au-delà
    // de son budget.
    //
    // À MIGRER : cette fonction porte `@deprecated 20.2 — Use animate.enter or animate.leave
    // instead. Intent to remove in v23`. Le projet est en 22.1.6, soit un majeur avant la
    // suppression. La bascule se fera par composant, les deux nouvelles API étant déclaratives.
    provideAnimationsAsync(),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    // Enregistre le catalogue d'icônes SVG (voir icon-registry.service.ts) avant le premier
    // rendu, y compris côté serveur pour le prérendu — un composant qui monte avant l'injection
    // paresseuse du service se retrouverait avec des <mat-icon svgIcon="..."> vides.
    provideAppInitializer(() => void inject(IconRegistryService)),
    // Le référentiel des indices est embarqué mais partiel ; le chargeur va chercher la vraie
    // composition — fichier déposé ou API du contrat — et remplace ce que le socle disait.
    // Les compositions d'indices ne sont plus chargées ici. Elles l'étaient au démarrage, pour
    // tout le monde et quelle que soit la page ouverte, alors qu'un seul panneau d'un seul écran
    // les affiche — Titres › Recherche › Indices de référence. La liste part désormais à
    // l'ouverture de son sélecteur (`TitresPage.loadIndexList`) et chaque composition à la
    // consultation de son indice ; le socle embarqué nomme les vingt-huit indices d'ici là.
    // Même dispositif pour le référentiel des titres, et pour une raison qui n'est pas l'écran
    // Titres — il demande son catalogue lui-même. C'est le menu latéral : sa pastille annonce le
    // nombre de titres référencés, et elle le tient du store. Sans cet amorçage elle n'aurait rien
    // à dire tant que personne n'aurait ouvert l'écran.
    //
    // Cela ne remet pas en cause la paresse de `SecurityCatalogService`, qui visait à garder le
    // catalogue embarqué hors du fascicule initial : la source est désormais l'API, et l'`import()`
    // du catalogue ne part qu'en repli, si elle ne répond pas. Ce qui part au démarrage est une
    // requête, pas un module.
    //
    // `void` est délibéré, comme au-dessus : faire attendre le premier rendu qu'un référentiel
    // réponde échangerait une pastille contre un écran blanc.
    provideAppInitializer(() => void inject(SecurityUniverseStore).load()),
  ]
};
