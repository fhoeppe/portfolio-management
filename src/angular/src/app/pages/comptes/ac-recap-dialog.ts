import { Component, HostBinding, Signal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import type { Icon } from '../../shell/icon-shapes';
import {
  type CashEntry,
  type CoHolder,
  type FormState,
  buildRecapBanks,
  buildRecapGroups,
  buildRecapPeople,
  fullName,
  recapVerdict,
} from './comptes-form';

export interface AcRecapDialogData {
  readonly form: Signal<FormState>;
  readonly co: Signal<readonly CoHolder[]>;
  readonly cash: Signal<readonly CashEntry[]>;
}

const ICON_RECAP: Icon = 'checklist';

/**
 * « Vérifier la saisie » (`recapOpen` du prototype, lignes 918-991) : relecture des
 * informations saisies avant création, avec un sélecteur de titulaire affiché et, pour le
 * groupe Compte de liquidité, un sélecteur de compte bancaire affiché.
 *
 * Les données viennent des signaux vivants du composant hôte (`Comptes`), passés tels quels
 * via `MAT_DIALOG_DATA` plutôt que figés à l'ouverture, pour rester réactives si l'état
 * change pendant que ce panneau est ouvert.
 */
@Component({
  selector: 'app-ac-recap-dialog',
  imports: [MatIconModule, SidePanel, MatMenuModule],
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

  protected readonly recapHolder = signal('main');
  protected readonly recapBank = signal('main');

  protected readonly people = computed(() => buildRecapPeople(this.data.form(), this.data.co()));
  protected readonly who = computed(() => this.people().find((p) => p.key === this.recapHolder()) || this.people()[0]);
  protected readonly banks = computed(() => buildRecapBanks(this.data.form(), this.data.cash()));
  protected readonly bank = computed(() => this.banks().find((b) => b.key === this.recapBank()) || this.banks()[0]);
  protected readonly groups = computed(() => buildRecapGroups(this.data.form(), this.data.co(), this.who(), this.bank(), this.data.cash()));
  protected readonly verdict = computed(() => recapVerdict(this.data.form()));
  protected readonly subtitle = computed(() => {
    const f = this.data.form();
    return (fullName(f.lastName, f.firstName) || '—') + ' · ' + (f.clientRef || 'référence à saisir');
  });

  protected pickHolder(key: string): void {
    this.recapHolder.set(key);
  }
  protected pickBank(key: string): void {
    this.recapBank.set(key);
  }

  protected close(): void {
    this.dialogRef.close();
  }
  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
