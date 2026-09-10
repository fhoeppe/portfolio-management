import { Component, input } from '@angular/core';
import type { Icon } from './icon-shapes';

/**
 * Rend un pictogramme à partir de son tableau de formes (voir `icon-shapes.ts`).
 * Existe en composant séparé, et non en fragment `ng-template` réutilisé dans `AppShell`,
 * parce qu'Angular ne reconnaît `<path>`/`<rect>`/`<circle>`/`<line>` comme éléments SVG
 * que lorsqu'ils sont lexicalement à l'intérieur d'un `<svg>` du même template — un
 * `ng-template` hors d'un `<svg>` les fait échouer à la compilation (NG8001).
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (shape of shapes(); track $index) {
        @switch (shape.kind) {
          @case ('path') {
            <path [attr.d]="shape.d" [attr.fill]="shape.fill ?? null"></path>
          }
          @case ('rect') {
            <rect
              [attr.x]="shape.x"
              [attr.y]="shape.y"
              [attr.width]="shape.width"
              [attr.height]="shape.height"
              [attr.rx]="shape.rx ?? null"
            ></rect>
          }
          @case ('circle') {
            <circle [attr.cx]="shape.cx" [attr.cy]="shape.cy" [attr.r]="shape.r" [attr.fill]="shape.fill ?? null"></circle>
          }
          @case ('line') {
            <line [attr.x1]="shape.x1" [attr.y1]="shape.y1" [attr.x2]="shape.x2" [attr.y2]="shape.y2"></line>
          }
        }
      }
    </svg>
  `,
})
export class IconGlyph {
  readonly shapes = input.required<Icon>();
  readonly size = input(21);
  readonly strokeWidth = input(1.75);
}
