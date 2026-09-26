import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';

export interface AcMultiOption {
  readonly key: string;
  readonly label: string;
  readonly count?: number;
  readonly badgeBg?: string;
  readonly badgeFg?: string;
  readonly dotColor?: string;
  readonly disabled?: boolean;
  readonly hint?: string;
}

/**
 * Filtre de colonne à sélection multiple — troisième exemplaire de la même recette, après
 * `TiMultiSelect` (Titres) et `TxMultiSelect` (Transactions) : bouton bordé + `MatMenu` réel avec
 * une `mat-checkbox` par ligne, aucune ligne ne portant `mat-menu-item` (elle fermerait le menu
 * au premier clic).
 *
 * Copié plutôt que partagé, comme les deux autres : chaque écran garde son filtre et ses classes,
 * et l'habillage ne se déplace pas d'un écran à l'autre par accident. Le jour où un quatrième
 * écran en demandera un, la question du composant commun se posera pour de bon.
 */
@Component({
  selector: 'app-ac-multiselect',
  imports: [MatIconModule, MatCheckboxModule, MatMenuModule],
  template: `
    <span class="ac-msel">
      <!-- Bouton nu et non matButton : la directive enveloppe tout contenu non-icône dans un
           mdc-button__label, qui devenait le seul élément flexible du bouton — la pastille ne
           pouvait plus rétrécir et poussait le « +N » et le chevron au-dehors. Sans elle chaque
           enfant est direct, et l'habillage du déclencheur, entièrement redéfini ici, ne perd
           rien. -->
      <button type="button" class="ac-msel-trigger" [matMenuTriggerFor]="menu" #trigger="matMenuTrigger">
        <span class="ac-msel-label" [style.color]="triggerColor()">{{ triggerLabel() }}</span>
        @if (triggerMore()) {
          <span class="ac-msel-more">{{ triggerMore() }}</span>
        }
        <mat-icon iconPositionEnd svgIcon="chevron-down" style="font-size:12px" class="ac-msel-chevron" [class.ac-msel-chevron-open]="trigger.menuOpen"></mat-icon>
      </button>
      <mat-menu #menu="matMenu" [class]="panelClass()">
        @if (showToggleAll()) {
          <button type="button" class="ac-msel-row ac-msel-all" (click)="onToggleAllClick($event)">
            <mat-checkbox [checked]="allSelected()" (click)="$event.stopPropagation()" (change)="toggleAll.emit()">{{ allSelected() ? 'Tout désélectionner' : 'Tout sélectionner' }}</mat-checkbox>
          </button>
        }
        @for (o of options(); track o.key) {
          <button type="button" class="ac-msel-row ac-msel-item" [class.ac-msel-item-active]="isOn(o.key)" [class.ac-msel-item-disabled]="o.disabled" [title]="o.hint || ''" (click)="onToggleClick($event, o.key, !!o.disabled)">
            <mat-checkbox [checked]="isOn(o.key)" [disabled]="!!o.disabled" (click)="$event.stopPropagation()" (change)="toggle.emit(o.key)">
              @if (o.badgeBg) {
                <span class="ac-msel-item-badge" [style.background]="o.badgeBg" [style.color]="o.badgeFg">
                  @if (o.dotColor) {
                    <span class="ac-msel-item-dot" [style.background]="o.dotColor"></span>
                  }
                  {{ o.label }}
                </span>
              } @else {
                <span class="ac-msel-item-label">{{ o.label }}</span>
              }
            </mat-checkbox>
            @if (o.count !== undefined) {
              <span class="ac-msel-item-count">{{ o.count }}</span>
            }
          </button>
        }
      </mat-menu>
    </span>
  `,
  styleUrl: './ac-multiselect.css',
})
export class AcMultiSelect {
  readonly options = input.required<readonly AcMultiOption[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly allSelected = input(false);
  readonly showToggleAll = input(true);
  readonly triggerLabel = input('Tous');
  readonly triggerColor = input('var(--color-neutral-700)');
  readonly triggerMore = input('');
  /* `pm-unfold` par defaut : le menu se deroule comme les autres panneaux de la page. */
  readonly panelClass = input('pm-unfold');

  readonly toggle = output<string>();
  readonly toggleAll = output<void>();

  protected isOn(key: string): boolean {
    return this.selected().has(key);
  }

  protected onToggleClick(e: Event, key: string, disabled: boolean): void {
    e.stopPropagation();
    if (disabled) return;
    this.toggle.emit(key);
  }

  protected onToggleAllClick(e: Event): void {
    e.stopPropagation();
    this.toggleAll.emit();
  }
}
