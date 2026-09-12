/**
 * `Icon` était un tableau de formes SVG typées (voir l'historique du fichier) pour contourner
 * l'absence d'`[innerHTML]` sur `<svg>` en rendu serveur ; depuis la bascule vers le registre
 * SVG de Material (`icon-registry.service.ts`), une icône n'est plus qu'un nom enregistré via
 * `addSvgIconLiteral` et consommé par `<mat-icon [svgIcon]="...">`. L'alias est conservé pour
 * éviter de retoucher chaque champ/`input()` qui type un champ icône à travers l'app.
 */
export type Icon = string;
