import { Component, input, model } from '@angular/core';
import { IconGlyph } from '../../shell/icon-glyph';
import type { Icon } from '../../shell/icon-shapes';

/**
 * Carte dépliable réutilisée pour les sections « Performance cumulée », « Allocation »,
 * « Principales positions », etc. Le pictogramme colorimétrique + chevron à gauche + titre
 * cliquable est le même patron sur tous les écrans du prototype (Positions, Ordres,
 * Accueil…), d'où un composant partagé plutôt qu'un `mat-expansion-panel` : le rendu
 * Material par défaut (chevron à droite, ombre, ripple) ne correspond pas à ce patron.
 */
@Component({
  selector: 'app-panel-card',
  imports: [IconGlyph],
  templateUrl: './panel-card.html',
  styleUrl: './panel-card.css',
})
export class PanelCard {
  readonly title = input.required<string>();
  readonly icon = input<Icon>();
  readonly note = input<string>();
  readonly open = model(true);

  toggle(): void {
    this.open.update((v) => !v);
  }
}
