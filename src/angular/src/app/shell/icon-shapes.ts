/**
 * Modèle de données générique pour un pictogramme (voir `icon-glyph.ts` pour le rendu) :
 * un tableau de formes SVG typées plutôt qu'une chaîne de markup, pour rester compatible
 * avec le rendu serveur d'Angular (qui n'implémente pas `[innerHTML]` sur un `<svg>`).
 */

export interface IconPath {
  readonly kind: 'path';
  readonly d: string;
  readonly fill?: string;
}
export interface IconRect {
  readonly kind: 'rect';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx?: number;
}
export interface IconCircle {
  readonly kind: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill?: string;
}
export interface IconLine {
  readonly kind: 'line';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}
export type IconShape = IconPath | IconRect | IconCircle | IconLine;
export type Icon = readonly IconShape[];

export const iconPath = (d: string, fill?: string): IconPath => ({ kind: 'path', d, fill });
export const iconRect = (x: number, y: number, width: number, height: number, rx?: number): IconRect => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});
export const iconCircle = (cx: number, cy: number, r: number, fill?: string): IconCircle => ({
  kind: 'circle',
  cx,
  cy,
  r,
  fill,
});
export const iconLine = (x1: number, y1: number, x2: number, y2: number): IconLine => ({ kind: 'line', x1, y1, x2, y2 });
