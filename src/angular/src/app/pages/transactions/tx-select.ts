import { Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface TxSelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /* Pastille colorée facultative : les filtres dont les valeurs ont une couleur dans le tableau
     (État) la reprennent dans leur liste, comme le font les filtres à sélection multiple. Les
     autres (Objet, Validité…) restent en texte simple. */
  readonly badgeBg?: string;
  readonly badgeFg?: string;
  /* Icône facultative, affichée devant le libellé dans la liste. Elle ne suit pas la valeur
     retenue dans le déclencheur : `mat-select` y peint le `viewValue` de l'option, c'est-à-dire
     son texte seul. */
  readonly icon?: string;
}

/**
 * Sélecteur simple (une valeur) — remplace les émulations `data-mat-select` du prototype
 * (compte/place/stratégie/validité, filtre Objet, État, Réconciliation…).
 *
 * Bâti sur un vrai `<mat-select>`, sans `<mat-form-field>` : l'habillage Material du champ
 * (étiquette flottante, trait de soulignement, hauteur minimale de 56px) est le contraire de
 * ce que demandent ces maquettes, où le sélecteur est un bouton bordé de 26px de haut posé
 * dans une barre de filtres. `MatSelect` accepte de vivre hors d'un form-field — son injection
 * du parent est optionnelle — et fournit alors exactement ce qu'on veut : le déclencheur, le
 * panneau en overlay et la sémantique `listbox`. L'habillage partagé vit dans `styles.scss`
 * (`.pm-sel-trigger`, `.pm-sel-panel`), paramétré par les jetons `--pm-sel-*` ci-dessous.
 *
 * A remplacé une émulation à base de `matButton` + `MatMenu` : visuellement équivalente, mais
 * un menu n'est pas une liste de choix — pas de `role="listbox"`/`option`, pas d'`aria-selected`
 * ni de valeur annoncée, et pas de saisie prédictive au clavier pour sauter à une option.
 */
@Component({
  selector: 'app-tx-select',
  imports: [MatSelectModule, MatIconModule],
  template: `
    <span class="tx-sel pm-sel" [class.pm-sel-disabled]="disabled()">
      <mat-select
        class="pm-sel-trigger"
        [panelWidth]="null"
        panelClass="pm-sel-panel pm-unfold"
        [value]="value()"
        (valueChange)="valueChange.emit($event)"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
      >
        @for (o of options(); track o.value) {
          <mat-option [value]="o.value" [disabled]="o.disabled" [class.tx-sel-item-with-icon]="o.icon">
            @if (o.icon) {
              <mat-icon class="tx-sel-item-icon" [svgIcon]="o.icon"></mat-icon>
            }
            @if (o.badgeBg) {
              <span class="tx-sel-item-badge" [style.background]="o.badgeBg" [style.color]="o.badgeFg">{{ o.label }}</span>
            } @else {
              {{ o.label }}
            }
          </mat-option>
        }
      </mat-select>
    </span>
  `,
  styleUrl: './tx-select.css',
})
export class TxSelect {
  readonly options = input.required<readonly TxSelectOption[]>();
  readonly value = input('');
  readonly placeholder = input('Aucun');
  readonly disabled = input(false);

  readonly valueChange = output<string>();
}
