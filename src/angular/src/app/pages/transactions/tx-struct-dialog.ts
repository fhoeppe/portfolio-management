import { Component, HostBinding, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import { RECO, RECO_STATE } from './transactions-data';
import { buildRecoJson, buildStructJson } from './transactions-struct';
import type { Icon } from '../../shell/icon-shapes';

export interface TxStructDialogData {
  readonly ref: string;
}

const ICON_STRUCT: Icon = 'corners';

/** Porté depuis le panneau `structOpen` de `Transactions.dc.html` — Annexe STRUCT, purement en
 * lecture (deux blocs JSON générés depuis les données statiques, aucune saisie). */
@Component({
  selector: 'app-tx-struct-dialog',
  imports: [SidePanel, MatTooltipModule],
  templateUrl: './tx-struct-dialog.html',
  styleUrl: './tx-struct-dialog.css',
})
export class TxStructDialog {
  private readonly data = inject<TxStructDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TxStructDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly icon = ICON_STRUCT;
  protected readonly ref = this.data.ref;
  protected readonly structJson = buildStructJson(this.ref);
  protected readonly recoJson = buildRecoJson(this.ref);
  protected readonly recoState = RECO_STATE[RECO[this.ref] || 'pending'];

  protected close(): void {
    this.dialogRef.close();
  }

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
