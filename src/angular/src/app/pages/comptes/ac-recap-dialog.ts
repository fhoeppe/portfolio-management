import { Component, HostBinding, Signal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import type { Icon } from '../../shell/icon-shapes';
import {
  type CoHolder,
  type FormState,
  type OpKind,
  type TitreEntry,
  buildRecapGroups,
  buildTitresRecapGroups,
  fullName,
  recapVerdict,
  titreIssues,
} from './comptes-form';

export interface AcRecapDialogData {
  readonly form: Signal<FormState>;
  readonly co: Signal<readonly CoHolder[]>;
  readonly titres: Signal<readonly TitreEntry[]>;
  /** Le genre d'opération : le verdict ne réclame pas ce que le parcours verrouille. */
  readonly op?: OpKind;
  /** Intitulé du panneau. */
  readonly title?: string;
  /** `titres` : ne relire que les comptes titre et leurs comptes de liquidité. */
  readonly scope?: 'all' | 'titres';
  /** Intitulé du bouton de validation — « Ajouter » quand la relecture précède un ajout. */
  readonly submitLabel?: string;
}

const ICON_RECAP: Icon = 'checklist';

/**
 * « Vérifier la saisie » (`recapOpen` du prototype, lignes 918-991) : relecture des
 * informations saisies avant création : le titulaire principal champ pour champ, chaque personne
 * rattachée dans la liste des titulaires, et le statut du dossier. Les comptes ne s'y relisent
 * pas : leur étape les montre en entier.
 *
 * Les données viennent des signaux vivants du composant hôte (`Comptes`), passés tels quels
 * via `MAT_DIALOG_DATA` plutôt que figés à l'ouverture, pour rester réactives si l'état
 * change pendant que ce panneau est ouvert.
 */
@Component({
  selector: 'app-ac-recap-dialog',
  imports: [MatIconModule, SidePanel],
  templateUrl: './ac-recap-dialog.html',
  styleUrl: './ac-recap-dialog.css',
})
export class AcRecapDialog {
  private readonly data = inject<AcRecapDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AcRecapDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly icon = ICON_RECAP;
  protected readonly panelTitle = this.data.title || 'Récapitulatif de la saisie Compte';
  protected readonly submitLabel = this.data.submitLabel || 'OK';


  protected readonly groups = computed(() =>
    this.data.scope === 'titres'
      ? buildTitresRecapGroups(this.data.titres())
      : buildRecapGroups(this.data.form(), this.data.co()),
  );
  protected readonly verdict = computed(() => {
    if (this.data.scope !== 'titres') return recapVerdict(this.data.form(), this.data.co(), this.data.op);
    const titres = this.data.titres();
    if (!titres.length) return "Aucun compte titre — « Ajouter » en ouvre un.";
    const inc = titres.filter((t) => titreIssues(t, t.cash).length).length;
    return inc
      ? `${inc} compte${inc > 1 ? 's' : ''} titre à compléter sur ${titres.length}.`
      : `${titres.length} compte${titres.length > 1 ? 's' : ''} titre — tous complets.`;
  });
  protected readonly subtitle = computed(() => {
    const f = this.data.form();
    return (fullName(f.lastName, f.firstName) || '—') + ' · ' + (f.clientRef || 'référence attribuée à la création');
  });


  protected close(): void {
    this.dialogRef.close();
  }
  /* « OK » dit que la relecture est validée ; l'écran en tire ce qu'il veut — passer à l'étape
     suivante quand la vérification est passée. « Annuler » referme sans rien dire. */
  protected confirm(): void {
    this.dialogRef.close('ok');
  }
  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
