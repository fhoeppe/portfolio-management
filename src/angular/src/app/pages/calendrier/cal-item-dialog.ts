import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThemeService } from '../../shell/theme.service';
import { CATS, CAT_KEYS, KIND_DEFS, KIND_KEYS, fromMin, toMin, type CalItem, type CatKey } from './calendrier-data';

export interface CalItemDialogData {
  /** Élément existant à modifier, ou brouillon vierge à créer. */
  readonly item: Omit<CalItem, 'id'> & { id?: string };
}

export type CalItemDialogResult =
  | { readonly action: 'save'; readonly item: Omit<CalItem, 'id'> & { id?: string } }
  | { readonly action: 'delete'; readonly id: string };

/**
 * Saisie d'un élément du calendrier — événement ou tâche.
 *
 * Le prototype dessinait sa propre modale (voile en `position: fixed`, clic sur le fond pour
 * fermer) ; c'est ici un vrai `MatDialog`, qui apporte le voile, le piège de focus, la
 * fermeture à l'échappement et le retour au déclencheur.
 *
 * Monté dans le `cdk-overlay-container`, donc hors de l'arbre de la coque : il porte lui-même
 * son `[data-theme]` et ses jetons (voir son CSS).
 */
@Component({
  selector: 'app-cal-item-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './cal-item-dialog.html',
  styleUrl: './cal-item-dialog.css',
})
export class CalItemDialog {
  private readonly ref = inject(MatDialogRef<CalItemDialog, CalItemDialogResult>);
  private readonly data = inject<CalItemDialogData>(MAT_DIALOG_DATA);
  protected readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr(): string {
    return this.theme.mode();
  }

  protected readonly catOptions = CAT_KEYS.map((k) => ({ value: k, label: CATS[k].label, color: CATS[k].color }));

  protected readonly draft = signal({ ...this.data.item });

  protected readonly kindOptions = KIND_KEYS.map((value) => ({ value, ...KIND_DEFS[value] }));

  /**
   * La boîte prend la nature de ce qu'elle édite — titre accordé, icône et couleur de l'en-tête.
   * Dérivée du brouillon et non de la donnée d'entrée : basculer le type dans la boîte la
   * requalifie aussitôt, sans quoi on saisirait une tâche sous un en-tête d'événement.
   */
  protected readonly kind = computed(() => KIND_DEFS[this.draft().kind]);

  protected readonly editing = computed(() => !!this.data.item.id);
  protected readonly title = computed(() => (this.editing() ? this.kind().editTitle : this.kind().newTitle));
  protected readonly isTask = computed(() => this.draft().kind === 'task');
  protected readonly showTimes = computed(() => !this.draft().allDay);

  protected patch(p: Partial<CalItem>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  protected save(): void {
    const d = this.draft();
    /* Deux garde-fous repris du prototype : un intitulé vide donne « Sans intitulé » plutôt
       qu'une ligne anonyme, et une fin antérieure au début est repoussée d'une demi-heure
       plutôt que de produire un bloc de hauteur négative dans la grille. */
    const item = {
      ...d,
      title: d.title.trim() || 'Sans intitulé',
      end: !d.allDay && toMin(d.end) <= toMin(d.start) ? fromMin(toMin(d.start) + 30) : d.end,
    };
    this.ref.close({ action: 'save', item });
  }

  protected remove(): void {
    const id = this.data.item.id;
    if (id) this.ref.close({ action: 'delete', id });
  }

  protected close(): void {
    this.ref.close();
  }

  protected catColor(k: CatKey): string {
    return CATS[k].color;
  }
}
