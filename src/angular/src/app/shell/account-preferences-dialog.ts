import { Component, HostBinding, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './theme.service';

/**
 * Porté depuis `AccountPreferencesDialog` de `Navigation Sobre.dc.html`. Le prototype ne
 * peignait que l'apparence des interrupteurs (aucun état réel) ; ici ce sont de vrais
 * `mat-slide-toggle` / `mat-slider`, mais rien n'est encore persisté — à brancher sur un
 * service de préférences quand celui-ci existera.
 *
 * MatDialog monte son contenu dans le `cdk-overlay-container` (sur `<body>`, hors de
 * l'arbre DOM d'`app-shell`) : les jetons `--color-*` de la coque n'y parviennent pas par
 * héritage CSS. Ce composant reporte donc son propre `data-theme` (voir le .css associé).
 */
@Component({
  selector: 'app-account-preferences-dialog',
  imports: [MatIconModule, MatDialogModule, MatButtonModule, MatTooltipModule, MatSlideToggleModule, MatSliderModule, FormsModule],
  templateUrl: './account-preferences-dialog.html',
  styleUrl: './account-preferences-dialog.css',
})
export class AccountPreferencesDialog {
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly dailyDigest = signal(true);
  protected readonly twoFactor = signal(false);
  protected readonly openCollapsed = signal(false);
  protected readonly bannerSearch = signal(true);
  protected readonly expandedWidth = signal(264);

  constructor(private readonly ref: MatDialogRef<AccountPreferencesDialog>) {}

  close(): void {
    this.ref.close();
  }

  save(): void {
    this.ref.close();
  }
}
