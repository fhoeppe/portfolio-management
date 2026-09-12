import { Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { AcSelectGroup } from './comptes-form';

/**
 * Sélecteur simple à groupes optionnels (pays/zone), avec en-tête de groupe illustré d'un
 * drapeau — remplace l'émulation `data-mat-select` + `role="listbox"` positionnée à la main
 * (`measureAnchor`/`comboGeo`/`openCombo`) du prototype par un vrai `<mat-select>`, comme
 * `tx-select.ts`/`ti-select.ts`/`ops-select.ts` (voir `tx-select.ts` pour les choix communs
 * aux quatre : pas de `<mat-form-field>`, habillage partagé dans `styles.scss`).
 *
 * Trois détails propres à Comptes, absents des trois autres sélecteurs :
 * - la valeur s'affiche en texte simple ou en pastille colorée (`asBadge`), et peut porter une
 *   icône de validation (`checkOk`/`checkBad`, champ Établissement bancaire) — d'où le recours
 *   à `<mat-select-trigger>`, seul point d'extension du déclencheur de `MatSelect` ;
 * - `place` est un sous-libellé rendu *sous* le champ, donc hors du `<mat-select>` ;
 * - `<mat-optgroup>` ne prend qu'une étiquette texte : le drapeau du groupe y est concaténé
 *   plutôt que projeté.
 */
@Component({
  selector: 'app-ac-select',
  imports: [NgTemplateOutlet, MatIconModule, MatSelectModule, MatTooltipModule],
  template: `
    <span class="ac-sel pm-sel" [class.pm-sel-disabled]="disabled()">
      <mat-select
        class="pm-sel-trigger"
        [panelWidth]="null"
        panelClass="pm-sel-panel ac-sel-panel pm-unfold"
        [value]="value()"
        (valueChange)="valueChange.emit($event)"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
      >
        <mat-select-trigger>
          <span class="ac-sel-value">
            @if (leadFlag()) {
              <span class="ac-sel-flag">{{ leadFlag() }}</span>
            }
            @if (asBadge()) {
              <span class="ac-sel-badge" [style.background]="badgeBg()" [style.color]="badgeFg()">
                <span class="ac-sel-dot" [style.background]="badgeFg()"></span>{{ triggerLabel() }}
              </span>
              <span class="ac-sel-spacer"></span>
            } @else {
              <span class="ac-sel-label">{{ triggerLabel() }}</span>
            }
            @if (checkOk()) {
              <span class="ac-sel-check ac-sel-check-ok" [matTooltip]="checkMessage()">
                <mat-icon svgIcon="check" style="font-size:12px;color:#ffffff"></mat-icon>
              </span>
            }
            @if (checkBad()) {
              <span class="ac-sel-check ac-sel-check-bad" [matTooltip]="checkMessage()">
                <mat-icon svgIcon="exclamation" style="font-size:12px;color:#ffffff"></mat-icon>
              </span>
            }
          </span>
        </mat-select-trigger>

        @for (g of groups(); track g.heading) {
          @if (g.heading) {
            <mat-optgroup [label]="g.flag ? g.flag + ' ' + g.heading : g.heading">
              @for (o of g.options; track o.value) {
                <mat-option [value]="o.value" [disabled]="o.disabled" [matTooltip]="o.title || ''">
                  <ng-container *ngTemplateOutlet="optionBody; context: { $implicit: o }" />
                </mat-option>
              }
            </mat-optgroup>
          } @else {
            @for (o of g.options; track o.value) {
              <mat-option [value]="o.value" [disabled]="o.disabled" [matTooltip]="o.title || ''">
                <ng-container *ngTemplateOutlet="optionBody; context: { $implicit: o }" />
              </mat-option>
            }
          }
        }
      </mat-select>

      @if (place()) {
        <span class="ac-sel-sub">{{ place() }}</span>
      }
    </span>

    <ng-template #optionBody let-o>
      <span class="ac-sel-item">
        @if (o.flag) {
          <span class="ac-sel-item-flag">{{ o.flag }}</span>
        }
        @if (o.asBadge) {
          <span class="ac-sel-item-badge" [style.background]="o.badgeBg" [style.color]="o.badgeFg">{{ o.label }}</span>
        } @else {
          <span class="ac-sel-item-col">
            <span>{{ o.label }}</span>
            @if (o.place) {
              <span class="ac-sel-item-place">{{ o.place }}</span>
            }
          </span>
        }
      </span>
    </ng-template>
  `,
  styleUrl: './ac-select.css',
})
export class AcSelect {
  readonly groups = input.required<readonly AcSelectGroup[]>();
  readonly value = input('');
  readonly placeholder = input('Aucun');
  readonly disabled = input(false);
  readonly leadFlag = input('');
  readonly place = input('');
  readonly asBadge = input(false);
  readonly badgeBg = input('');
  readonly badgeFg = input('');
  readonly checkOk = input(false);
  readonly checkBad = input(false);
  readonly checkMessage = input('');

  readonly valueChange = output<string>();

  protected readonly triggerOption = computed(() => this.groups().flatMap((g) => g.options).find((o) => o.value === this.value()));
  protected readonly triggerLabel = computed(() => this.triggerOption()?.label ?? (this.value() || this.placeholder()));
}
