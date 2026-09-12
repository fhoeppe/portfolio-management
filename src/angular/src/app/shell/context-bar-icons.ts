import type { Icon } from './icon-shapes';

/** Pictogrammes de la barre de contexte — noms du registre Material (voir `icon-registry.service.ts`). */
export const ICON_REFRESH: Icon = 'refresh';

export const ICON_EXPORT: Icon = 'export';

export const ICON_EYE: Icon = 'eye';

export const ICON_EYE_OFF: Icon = 'eye-off';

/**
 * Remplace l'ancien pictogramme plein (viewBox 200×200, fill: currentColor) par l'icône
 * « power » standard en contour — même famille visuelle que le reste de l'application
 * (traits, viewBox 24×24) au lieu d'un style solitaire.
 */
export const ICON_LOGOUT: Icon = 'power';
