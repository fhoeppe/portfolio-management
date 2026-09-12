import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { AcSelectOption } from './comptes-form';

/**
 * Champ « à puces » (multi-sélection avec pastilles retirables) — porté depuis le champ
 * `isChips` du prototype (Origine des fonds) : mêmes règles que `tx-multiselect.ts`/
 * `ti-multiselect.ts`, un vrai `MatMenu` dont le panneau reste ouvert pendant qu'on coche
 * plusieurs options (aucune ligne ne porte `mat-menu-item`, qui fermerait le menu au premier
 * clic). Le déclencheur diffère des filtres de colonne déjà portés : au lieu d'un simple
 * libellé, il affiche les valeurs choisies en pastilles retirables, comme le `data-mat-chip-grid`
 * du prototype.
 */
@Component({
  selector: 'app-ac-chips',
  imports: [MatIconModule, MatMenuModule],
  template: `
    <span class="ac-chips">
      <span class="ac-chips-trigger" [matMenuTriggerFor]="menu" #trigger="matMenuTrigger">
        @for (c of chips(); track c) {
          <span class="ac-chips-pill">
            {{ c }}
            <button type="button" class="ac-chips-remove" (click)="remove($event, c)" title="Retirer" aria-label="Retirer">
              <mat-icon svgIcon="close" style="font-size:11px"></mat-icon>
            </button>
          </span>
        }
        @if (!chips().length) {
          <span class="ac-chips-placeholder">{{ placeholder() }}</span>
        }
        <mat-icon svgIcon="chevron-down" style="font-size:14px" class="ac-chips-chevron" [class.ac-chips-chevron-open]="trigger.menuOpen"></mat-icon>
      </span>
      <mat-menu #menu="matMenu" class="pm-unfold">
        @for (o of options(); track o.value) {
          <button type="button" class="ac-chips-row" [class.ac-chips-row-active]="isOn(o.value)" (click)="onToggleClick($event, o.value)">
            <span class="ac-chips-check" [class.ac-chips-check-on]="isOn(o.value)">
              @if (isOn(o.value)) {
                <mat-icon svgIcon="check" style="font-size:10px"></mat-icon>
              }
            </span>
            {{ o.label }}
          </button>
        }
      </mat-menu>
    </span>
  `,
  styleUrl: './ac-chips.css',
})
export class AcChips {
  readonly options = input.required<readonly AcSelectOption[]>();
  readonly chips = input.required<readonly string[]>();
  readonly placeholder = input('Sélectionner');

  readonly toggle = output<string>();

  protected isOn(value: string): boolean {
    return this.chips().includes(value);
  }

  protected onToggleClick(e: Event, value: string): void {
    e.stopPropagation();
    this.toggle.emit(value);
  }

  protected remove(e: Event, label: string): void {
    e.stopPropagation();
    e.preventDefault();
    this.toggle.emit(label);
  }
}
