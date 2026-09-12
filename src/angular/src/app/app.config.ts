import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, type MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { IconRegistryService } from './shell/icon-registry.service';

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
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: TOOLTIP_OPTIONS },
    // MatDatepicker exige un adaptateur de date ; l'adaptateur natif suffit ici, aucune
    // bibliothèque tierce (Moment, Luxon) n'étant utilisée. La locale force l'affichage en
    // jj/mm/aaaa, comme le faisait le calendrier natif de <input type="date"> en français.
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    // Enregistre le catalogue d'icônes SVG (voir icon-registry.service.ts) avant le premier
    // rendu, y compris côté serveur pour le prérendu — un composant qui monte avant l'injection
    // paresseuse du service se retrouverait avec des <mat-icon svgIcon="..."> vides.
    provideAppInitializer(() => void inject(IconRegistryService)),
  ]
};
