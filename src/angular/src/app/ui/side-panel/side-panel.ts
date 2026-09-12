import { Component, HostBinding, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import type { Icon } from '../../shell/icon-shapes';
import { ThemeService } from '../../shell/theme.service';

/**
 * Porté depuis `SidePanel.dc.html` : chrome commun (en-tête, poignée de redimensionnement,
 * épingle, pied de page) aux panneaux latéraux — ici, l'historique d'une position/d'un
 * compte/d'une trésorerie (voir `pages/positions/position-history-dialog.ts`), et à terme
 * les panneaux Ordre/Transfert/Corporate Action/Cashflow quand ils seront portés.
 *
 * N'est PAS lui-même un `MatDialog` : c'est un composant de présentation utilisé à
 * l'intérieur du contenu d'un dialogue (voir `openHistory()` dans `positions.ts`), qui porte
 * l'overlay/le fond/le positionnement plein cadre via `MatDialogConfig`. `SidePanel` fournit
 * uniquement le chrome visuel et projette le corps via `<ng-content>`.
 *
 * Épingler bloque la fermeture par Échap/clic sur le fond — ce composant ne peut pas agir
 * sur `MatDialogRef.disableClose` lui-même (il ne le connaît pas), d'où l'output
 * `pinnedChange` que le composant hôte du dialogue doit relier à `disableClose`.
 *
 * Comme tout contenu de `MatDialog`, ce composant est monté hors de l'arbre DOM d'app-shell
 * (voir `project_matdialog_token_inheritance_boundary`) : il porte donc ses propres jetons de
 * couleur et son propre `data-theme`, qui profitent aussi au contenu projeté (un enfant DOM
 * hérite des jetons CSS de son parent quel que soit le composant qui l'a produit).
 */
@Component({
  selector: 'app-side-panel',
  imports: [MatButtonModule, MatTooltipModule, MatIconModule],
  templateUrl: './side-panel.html',
  styleUrl: './side-panel.css',
})
export class SidePanel {
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly accent = input('var(--ink-brand)');
  readonly icon = input<Icon | null>(null);
  readonly flush = input(false);
  readonly footer = input(false);
  readonly showSubmit = input(false);
  readonly submitLabel = input('Enregistrer');
  readonly cancelLabel = input('Annuler');
  readonly cancelKind = input<'close' | 'ok'>('close');
  readonly note = input('');
  readonly openPct = input(50);
  readonly maxPct = input(75);

  readonly closed = output<void>();
  readonly submitted = output<void>();
  readonly pinnedChange = output<boolean>();

  protected readonly pinned = signal(false);
  protected readonly maximized = signal(false);
  private readonly widthPx = signal<number | null>(null);

  protected readonly width = computed(() =>
    this.widthPx() !== null ? `min(${this.widthPx()}px, ${this.maxPct()}vw)` : `${this.openPct()}vw`,
  );

  protected togglePin(): void {
    const next = !this.pinned();
    this.pinned.set(next);
    this.pinnedChange.emit(next);
  }

  protected toggleMaximize(): void {
    if (this.maximized()) {
      this.widthPx.set(null);
      this.maximized.set(false);
    } else {
      this.widthPx.set(this.maxPx());
      this.maximized.set(true);
    }
  }

  protected close(): void {
    this.closed.emit();
  }

  protected submit(): void {
    this.submitted.emit();
  }

  private maxPx(): number {
    return Math.round((window.innerWidth || 1400) * (this.maxPct() / 100));
  }

  protected grab(e: MouseEvent): void {
    e.preventDefault();
    this.maximized.set(false);
    const startX = e.clientX;
    const startW = this.widthPx() ?? Math.round((window.innerWidth || 1400) * (this.openPct() / 100));
    const max = this.maxPx();
    const move = (ev: MouseEvent) => this.widthPx.set(Math.max(340, Math.min(max, startW + (startX - ev.clientX))));
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }
}
