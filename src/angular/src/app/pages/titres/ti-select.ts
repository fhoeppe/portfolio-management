import { Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';

export interface TiSelectOption {
  readonly value: string;
  readonly label: string;
}

export interface TiSelectGroup {
  readonly label: string;
  readonly items: readonly TiSelectOption[];
}

/**
 * Sélecteur simple (une valeur), avec regroupement optionnel — remplace les `<select>` à
 * `<optgroup>` du prototype (Indice, Devise, Notation…). Un groupe au libellé vide rend ses
 * options à plat, sans en-tête : c'est le cas des « Toutes/Tous » placées en tête, hors
 * regroupement — `<mat-optgroup>` affichant toujours son étiquette, ces options-là sont
 * sorties du groupe plutôt que dotées d'une étiquette vide.
 *
 * Pas de `<mat-form-field>` autour, et habillage partagé dans `styles.scss` : voir le
 * commentaire de `tx-select.ts`, qui détaille les deux choix pour les quatre sélecteurs.
 */
@Component({
  selector: 'app-ti-select',
  imports: [MatSelectModule],
  template: `
    <span class="ti-sel pm-sel">
      <mat-select
        class="pm-sel-trigger"
        [panelWidth]="null"
        [panelClass]="panelClass()"
        [value]="value()"
        (valueChange)="valueChange.emit($event)"
        [placeholder]="placeholder()"
      >
        @for (g of groups(); track g.label) {
          @if (g.label) {
            <mat-optgroup [label]="g.label">
              @for (o of g.items; track o.value) {
                <mat-option [value]="o.value">{{ o.label }}</mat-option>
              }
            </mat-optgroup>
          } @else {
            @for (o of g.items; track o.value) {
              <mat-option [value]="o.value">{{ o.label }}</mat-option>
            }
          }
        }
      </mat-select>
    </span>
  `,
  styleUrl: './ti-select.css',
})
export class TiSelect {
  readonly groups = input.required<readonly TiSelectGroup[]>();
  readonly value = input('');
  readonly placeholder = input('—');
  /* Le panneau vit dans le cdk-overlay-container : une règle scopée au composant ne l'atteint
     jamais, et `panelClass` est le seul moyen de lui adjoindre un habillage particulier. */
  readonly panelClass = input('pm-sel-panel pm-unfold');

  readonly valueChange = output<string>();
}
