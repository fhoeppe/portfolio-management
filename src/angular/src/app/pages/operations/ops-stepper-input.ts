import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { parseFr } from './operations-data';

/**
 * Champ numérique à boutons +/-, repris tel quel dans les 5 formulaires du prototype
 * (`mkFormStep`/`mkStep`/`trfQtyStep`/`trfPriceStep`/`caAmountStep`/`caTaxStep`/`cfAmountStep`
 * — même formule de parse/format `fr-FR`, factorisée ici en un seul composant plutôt que
 * dupliquée neuf fois).
 */
@Component({
  selector: 'app-ops-stepper-input',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <span class="pm-num-field">
      @if (prefix()) {
        <span class="pm-num-prefix">{{ prefix() }}</span>
      }
      <input
        class="pm-num-input"
        [value]="value()"
        (input)="onInput($event)"
        [placeholder]="placeholder()"
      />
      <span class="pm-num-steps">
        <button type="button" class="pm-num-step" (click)="bump(step())" matTooltip="Augmenter">
          <mat-icon svgIcon="chevron-up" style="font-size:10px"></mat-icon>
        </button>
        <button type="button" class="pm-num-step" (click)="bump(-step())" matTooltip="Diminuer">
          <mat-icon svgIcon="chevron-down" style="font-size:10px"></mat-icon>
        </button>
      </span>
    </span>
  `,
  styleUrl: './ops-stepper-input.css',
})
export class OpsStepperInput {
  readonly value = input('');
  readonly placeholder = input('');
  readonly prefix = input('');
  readonly step = input(1);
  readonly integer = input(false);

  readonly valueChange = output<string>();

  private fmt(n: number): string {
    return this.integer() ? String(Math.round(n)) : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  protected onInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    this.valueChange.emit(this.integer() ? raw.replace(/[^0-9]/g, '') : raw.replace(/[^0-9,.\s]/g, ''));
  }

  protected bump(delta: number): void {
    this.valueChange.emit(this.fmt(Math.max(0, parseFr(this.value()) + delta)));
  }
}
