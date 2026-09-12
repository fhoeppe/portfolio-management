import { Component, HostBinding, WritableSignal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../shell/theme.service';
import { IndexDef, IndexMember } from './titres-data';
import { computePreview } from './titres-filters';

export interface TiPreviewDialogData {
  readonly idx: IndexDef;
  readonly indexMembers: WritableSignal<Readonly<Record<string, readonly IndexMember[]>>>;
  readonly refs: WritableSignal<ReadonlyMap<string, 'ok' | 'none'>>;
  readonly decisions: WritableSignal<ReadonlyMap<string, 'ok' | 'none'>>;
}

/**
 * Modale d'aperçu d'un indice (`previewOpen` de la source) — un `MatDialog` standard, centré et
 * fermable, plutôt que la boîte `position:fixed` + glisser-déposer (`startDrag`/`mousemove`) du
 * prototype : ce chrome de déplacement manuel n'apporte rien qu'un dialogue Material ne fasse
 * déjà (recentrage, fermeture au clic extérieur/Échap).
 */
@Component({
  selector: 'app-ti-preview-dialog',
  imports: [MatIconModule, MatDialogModule, MatButtonModule, MatSlideToggleModule, MatTableModule, MatTooltipModule],
  templateUrl: './ti-preview-dialog.html',
  styleUrl: './ti-preview-dialog.css',
})
export class TiPreviewDialog {
  private readonly data = inject<TiPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TiPreviewDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly idx = this.data.idx;

  protected readonly previewColumns = ['composant', 'secteur', 'poids', 'bascule', 'statut'];

  protected readonly preview = computed(() => {
    const members = this.data.indexMembers()[this.idx.key] || this.idx.members;
    return computePreview(this.idx, members, this.data.refs(), this.data.decisions());
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected toggleRow(ticker: string, on: boolean): void {
    this.data.refs.update((m) => {
      const next = new Map(m);
      next.set(this.idx.key + '/' + ticker, on ? 'none' : 'ok');
      return next;
    });
  }

  protected toggleAll(): void {
    const p = this.preview();
    const on = !p.allOn;
    this.data.refs.update((m) => {
      const next = new Map(m);
      const members = this.data.indexMembers()[this.idx.key] || this.idx.members;
      members.forEach((mem) => next.set(this.idx.key + '/' + mem.ticker, on ? 'ok' : 'none'));
      return next;
    });
  }
}
