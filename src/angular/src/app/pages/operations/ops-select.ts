import { Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import type { SelectGroup, SelectOption } from './operations-data';

/**
 * Remplace les émulations `data-mat-select` (bouton + `role="listbox"` positionné à la main
 * via `measureAnchor`/`placeFor`) du prototype par un vrai `<mat-select>` : le panneau et son
 * positionnement viennent du CDK overlay de Material plutôt que d'un calcul de géométrie
 * applicatif, et la sémantique `listbox` est celle du composant plutôt qu'un `role` posé à la
 * main sur des `<div>`.
 *
 * Pas de `<mat-form-field>` autour, et habillage partagé dans `styles.scss` : voir le
 * commentaire de `tx-select.ts`, qui détaille les deux choix pour les quatre sélecteurs.
 */
@Component({
  selector: 'app-ops-select',
  imports: [MatSelectModule],
  template: `
    <span class="pm-osel pm-sel" [class.pm-sel-disabled]="disabled()">
      <mat-select
        class="pm-sel-trigger"
        [panelWidth]="null"
        [panelClass]="panelClass()"
        [value]="value()"
        (valueChange)="valueChange.emit($event)"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
      >
        @for (o of options(); track o.value) {
          <mat-option [value]="o.value" [disabled]="o.disabled">{{ o.label }}</mat-option>
        }
        @for (g of groups(); track g.label) {
          <mat-optgroup [label]="g.label">
            @for (o of g.options; track o.value) {
              <mat-option [value]="o.value" [disabled]="o.disabled">{{ o.label }}</mat-option>
            }
          </mat-optgroup>
        }
      </mat-select>
    </span>
  `,
  styleUrl: './ops-select.css',
})
export class OpsSelect {
  /**
   * Options hors groupe. Rendues avant les groupes : c'est là que se place un « Aucun », qui
   * n'appartient à aucune rubrique et doit rester atteignable en tête de liste.
   */
  readonly options = input<readonly (SelectOption & { disabled?: boolean })[]>([]);
  /** Options groupées, rendues en `mat-optgroup` après les options libres. */
  readonly groups = input<readonly SelectGroup[]>([]);
  readonly value = input('');
  readonly placeholder = input('Aucun');
  readonly disabled = input(false);
  readonly panelClass = input('pm-sel-panel');

  readonly valueChange = output<string>();
}
