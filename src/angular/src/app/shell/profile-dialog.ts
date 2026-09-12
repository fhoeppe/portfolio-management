import { Component, HostBinding, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from './theme.service';

/**
 * Porté depuis le panneau `ProfileDialog` de `Navigation Sobre.dc.html`. Données figées
 * comme dans le prototype — pas de service `UserProfile` à ce stade du portage.
 *
 * MatDialog monte son contenu dans le `cdk-overlay-container` (sur `<body>`, hors de
 * l'arbre DOM d'`app-shell`) : les jetons `--color-*` de la coque n'y parviennent pas par
 * héritage CSS. Ce composant reporte donc son propre `data-theme` (voir profile-dialog.css).
 */
@Component({
  selector: 'app-profile-dialog',
  imports: [MatIconModule, MatDialogModule, MatButtonModule, MatTooltipModule],
  templateUrl: './profile-dialog.html',
  styleUrl: './profile-dialog.css',
})
export class ProfileDialog {
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  constructor(private readonly ref: MatDialogRef<ProfileDialog>) {}

  close(): void {
    this.ref.close();
  }
}
