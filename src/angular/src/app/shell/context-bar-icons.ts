import { iconCircle, iconLine, iconPath, type Icon } from './icon-shapes';

/**
 * Pictogrammes de la barre de contexte, passés par `app-icon` comme ceux du panneau de
 * menu (voir `nav-model.ts`) plutôt qu'en `<svg>` brut, pour rester cohérent et éviter
 * `[innerHTML]` (voir `icon-shapes.ts`).
 */
export const ICON_REFRESH: Icon = [
  iconPath('M3 12a9 9 0 0 1 15-6.7L21 8'),
  iconPath('M21 3v5h-5'),
  iconPath('M21 12a9 9 0 0 1-15 6.7L3 16'),
  iconPath('M3 21v-5h5'),
];

export const ICON_EXPORT: Icon = [
  iconPath('M12 15V3'),
  iconPath('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),
  iconPath('m7 10 5 5 5-5'),
];

export const ICON_EYE: Icon = [
  iconPath('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7'),
  iconCircle(12, 12, 3),
];

export const ICON_EYE_OFF: Icon = [
  iconPath('M10.7 5.1A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1'),
  iconPath('M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6'),
  iconPath('m2 2 20 20'),
  iconPath('M9.9 9.9a3 3 0 0 0 4.2 4.2'),
];

/**
 * Remplace l'ancien pictogramme plein (viewBox 200×200, fill: currentColor) par l'icône
 * « power » standard en contour — même famille visuelle que le reste de l'application
 * (traits, viewBox 24×24) au lieu d'un style solitaire.
 */
export const ICON_LOGOUT: Icon = [
  iconPath('M18.36 6.64a9 9 0 1 1-12.73 0'),
  iconLine(12, 2, 12, 12),
];
