import { Component, HostBinding, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../shell/theme.service';
import { ICON_CALENDAR, ICON_CASHFLOW, ICON_CORPORATE, ICON_TRADE, ICON_TRANSFER } from './operations-icons';
import type { PanelKind } from './operations-forms';

interface SheetAction {
  readonly key: PanelKind;
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly icon: typeof ICON_TRADE;
}

const ACTIONS: readonly SheetAction[] = [
  { key: 'trade', label: 'Créer un ordre', bg: 'rgba(15,118,110,0.14)', fg: 'var(--ink-ok)', icon: ICON_TRADE },
  { key: 'transfer', label: 'Initier un transfert', bg: 'rgba(2,132,199,0.14)', fg: 'var(--ink-info)', icon: ICON_TRANSFER },
  { key: 'corporate', label: 'Notifier une Corporate Action', bg: 'rgba(180,83,9,0.14)', fg: 'var(--ink-warn)', icon: ICON_CORPORATE },
  { key: 'cashflow', label: 'Initier un Cashflow', bg: 'rgba(162,28,175,0.14)', fg: 'var(--ink-magenta)', icon: ICON_CASHFLOW },
  { key: 'calendar', label: 'Initier un événement calendrier', bg: 'rgba(67,56,202,0.14)', fg: 'var(--ink-code)', icon: ICON_CALENDAR },
];

/** Porté depuis la feuille `matBottomSheet` d'`Ordres.dc.html` (« Initier un événement »),
 * ici un vrai `MatBottomSheet`. Comme `MatDialog`, `MatBottomSheet` monte son contenu dans le
 * `cdk-overlay-container`, hors de l'arbre DOM d'app-shell (voir
 * `project_matdialog_token_inheritance_boundary`) : ce composant porte donc son propre
 * `data-theme` et ses propres jetons plutôt que de les hériter par cascade. */
@Component({
  selector: 'app-operations-action-sheet',
  imports: [MatIconModule],
  template: `
    <div class="pm-sheet-grip"><span></span></div>
    <div class="pm-sheet-title">
      Initier un événement
      <mat-icon svgIcon="plus" style="font-size:18px"></mat-icon>
    </div>
    @for (a of actions; track a.key) {
      <button type="button" class="pm-sheet-action" [style.background]="a.bg" [style.color]="a.fg" (click)="pick(a.key)">
        <span class="pm-sheet-icon" [style.color]="a.fg"><mat-icon [svgIcon]="a.icon" [style.font-size.px]="13"></mat-icon></span>
        <span class="pm-sheet-label">{{ a.label }}</span>
        <span class="pm-sheet-plus" [style.color]="a.fg">
          <mat-icon svgIcon="plus" style="font-size:13px"></mat-icon>
        </span>
      </button>
    }
  `,
  styleUrl: './operations-action-sheet.css',
})
export class OperationsActionSheet {
  private readonly ref = inject(MatBottomSheetRef<OperationsActionSheet, PanelKind>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly actions = ACTIONS;

  protected pick(key: PanelKind): void {
    this.ref.dismiss(key);
  }
}
