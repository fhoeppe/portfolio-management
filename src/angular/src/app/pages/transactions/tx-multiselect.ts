import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TxMultiOption {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly badgeBg?: string;
  readonly badgeFg?: string;
}

/**
 * Filtre de colonne à sélection multiple (Nature/Type/Compte/Titre du registre) : bouton bordé
 * + `MatMenu` réel contenant une ligne « Tout sélectionner » et une `mat-checkbox` par valeur —
 * remplace l'émulation `data-mat-select[aria-multiselectable]` + cases `data-mat-checkbox` du
 * prototype. Le menu ne se ferme pas au clic (`(click)` avec `$event.stopPropagation()`),
 * comme le panneau `aria-multiselectable` d'origine.
 */
@Component({
  selector: 'app-tx-multiselect',
  imports: [MatIconModule, MatCheckboxModule, MatMenuModule, MatTooltipModule],
  template: `
    <span class="tx-msel">
      <!-- Bouton nu et non matButton : la directive enveloppe tout contenu non-icône dans un
           mdc-button__label, qui devenait le seul élément flexible du bouton — la pastille ne
           pouvait plus rétrécir et poussait le « +N » et le chevron au-dehors. Sans elle chaque
           enfant est direct, et l'habillage du déclencheur, entièrement redéfini ici, ne perd
           rien. -->
      <button type="button" class="tx-msel-trigger" [matMenuTriggerFor]="menu" #trigger="matMenuTrigger"
        [matTooltip]="triggerHint()">
        @if (triggerBadge(); as b) {
          <span class="tx-msel-badge" [style.background]="b.bg" [style.color]="b.fg">{{ triggerLabel() }}</span>
        } @else {
          <span class="tx-msel-label" [style.color]="triggerColor()">{{ triggerLabel() }}</span>
        }
        @if (triggerMore()) {
          <span class="tx-msel-more">{{ triggerMore() }}</span>
        }
        <mat-icon iconPositionEnd svgIcon="chevron-down" style="font-size:12px" class="tx-msel-chevron" [class.tx-msel-chevron-open]="trigger.menuOpen"></mat-icon>
      </button>
      <mat-menu #menu="matMenu" [class]="panelClass()">
        <!-- Ni l'un ni l'autre ne porte la directive mat-menu-item : elle ferme le menu au clic,
             ce qui casserait la sélection multiple (le menu doit rester ouvert le temps de
             cocher plusieurs valeurs, comme le panneau aria-multiselectable du prototype). -->
        <button type="button" class="tx-msel-row tx-msel-all" (click)="onToggleAllClick($event)">
          <mat-checkbox [checked]="allSelected()" (click)="$event.stopPropagation()" (change)="toggleAll.emit()">{{ allSelected() ? 'Tout désélectionner' : 'Tout sélectionner' }}</mat-checkbox>
        </button>
        @for (o of options(); track o.key) {
          <button type="button" class="tx-msel-row tx-msel-item" [class.tx-msel-item-active]="isOn(o.key)" (click)="onToggleClick($event, o.key)">
            <mat-checkbox [checked]="isOn(o.key)" (click)="$event.stopPropagation()" (change)="toggle.emit(o.key)"></mat-checkbox>
            @if (o.badgeBg) {
              <span class="tx-msel-item-badge" [style.background]="o.badgeBg" [style.color]="o.badgeFg">{{ o.label }}</span>
            } @else {
              <span class="tx-msel-item-label">{{ o.label }}</span>
            }
            <span class="tx-msel-item-count">{{ o.count }}</span>
          </button>
        }
      </mat-menu>
    </span>
  `,
  styleUrl: './tx-multiselect.css',
})
export class TxMultiSelect {
  readonly options = input.required<readonly TxMultiOption[]>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly allSelected = input(false);
  readonly triggerLabel = input('Tous');
  readonly triggerColor = input('var(--color-neutral-700)');
  readonly triggerBadge = input<{ readonly bg: string; readonly fg: string } | null>(null);
  readonly triggerMore = input('');
  /* `pm-unfold` par defaut : les cinq filtres a selection multiple du registre se deroulent
     comme les autres panneaux de la page. Un appelant peut toujours passer sa propre liste. */
  readonly panelClass = input('pm-unfold');
  /* Liste complète des valeurs cochées : le déclencheur n'en montre qu'une, suivie de « +N ».
     L'infobulle est le seul endroit où l'on peut lire la sélection entière sans rouvrir. */
  readonly triggerHint = input('');

  readonly toggle = output<string>();
  readonly toggleAll = output<void>();

  protected isOn(key: string): boolean {
    return this.selected().has(key);
  }

  protected onToggleClick(e: Event, key: string): void {
    e.stopPropagation();
    this.toggle.emit(key);
  }

  protected onToggleAllClick(e: Event): void {
    e.stopPropagation();
    this.toggleAll.emit();
  }
}
