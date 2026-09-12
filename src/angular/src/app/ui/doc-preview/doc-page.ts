import { Component, input } from '@angular/core';

/**
 * Feuille de papier simulée : le prototype ne rend aucun document réel, il en dessine la
 * silhouette — un en-tête, un titre, des lignes de texte grisées et un pied.
 *
 * Partagée entre l'aperçu encastré de la saisie et la visionneuse plein écran ; les deux ne
 * diffèrent que par les cotes, passées en jetons par l'hôte.
 */
@Component({
  selector: 'app-doc-page',
  template: `
    <div class="dp-sheet">
      <span class="dp-kicker">{{ kicker() }}</span>
      <span class="dp-title">{{ title() }}</span>
      <span class="dp-rule"></span>
      @for (w of lines(); track $index) {
        <span class="dp-line" [style.width.%]="w"></span>
      }
      <span class="dp-footer">{{ footer() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Le rapport 1 / 1.414 est celui du format A4 : la feuille garde ses proportions quelle
       que soit la largeur que l'hôte lui donne. */
    .dp-sheet {
      display: flex;
      flex-direction: column;
      gap: var(--dp-gap, 8px);
      aspect-ratio: 1 / 1.414;
      height: var(--dp-height, auto);
      padding: var(--dp-pad, 20px 18px);
      border: 1px solid var(--color-neutral-300);
      background: var(--surface);
      box-shadow: var(--dp-shadow, var(--shadow-sm));
      user-select: none;
      box-sizing: border-box;
    }

    .dp-kicker {
      font-size: var(--dp-kicker-fs, 9px);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-neutral-600);
    }

    .dp-title {
      font-size: var(--dp-title-fs, 12px);
      font-weight: 700;
      line-height: 1.3;
    }

    .dp-rule {
      height: 1px;
      background: var(--color-neutral-300);
    }

    .dp-line {
      height: var(--dp-line-h, 6px);
      border-radius: 2px;
      background: var(--color-neutral-200);
    }

    .dp-footer {
      margin-top: auto;
      font-size: var(--dp-footer-fs, 9px);
      color: var(--color-neutral-600);
    }
  `,
})
export class DocPage {
  readonly kicker = input('');
  readonly title = input('');
  readonly footer = input('');
  /** Largeurs des fausses lignes, en pourcentage de la feuille. */
  readonly lines = input.required<readonly number[]>();
}
