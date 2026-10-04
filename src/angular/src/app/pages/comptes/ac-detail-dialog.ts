import { Component, HostBinding, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import type { Icon } from '../../shell/icon-shapes';
import { ACCOUNTS, KYC, STATES, initials } from './comptes-data';

export interface AcDetailDialogData {
  readonly accountId: string;
}

const ICON_DETAIL: Icon = 'id-card';

/**
 * Fiche du dossier client, ouverte par « Voir la fiche » : l'identité du compte et les personnes
 * qui y sont rattachées. Un `MatDialog` enveloppant `<app-side-panel>`.
 *
 * **Deux blocs, et deux seulement.** La fiche en portait cinq — vignettes chiffrées, cycle de vie
 * en douze étapes, bandes d'allocation, historique, points d'attention. L'encart de l'onglet
 * « Gérer compte portefeuille » dit désormais le dossier qu'on travaille : client, référence,
 * statut, domiciliation, encours, comptes titre, gestionnaire, date d'ouverture. Ce que la fiche
 * répétait de lui n'apprenait plus rien, et ce qu'elle ajoutait appartient aux écrans qui en
 * décident — l'encours et la performance à Positions, les limites à Gestion du risque, les
 * échéances à Échéances. Restent l'identité, qu'on vient vérifier champ par champ, et les
 * titulaires, que la fiche est le seul endroit à nommer.
 */
@Component({
  selector: 'app-ac-detail-dialog',
  imports: [MatIconModule, SidePanel],
  templateUrl: './ac-detail-dialog.html',
  styleUrl: './ac-detail-dialog.css',
})
export class AcDetailDialog {
  private readonly data = inject<AcDetailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AcDetailDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly icon = ICON_DETAIL;
  protected readonly account = ACCOUNTS.find((a) => a.id === this.data.accountId) || ACCOUNTS[0];
  protected readonly state = STATES[this.account.state] || STATES['active'];

  protected readonly identity = [
    { label: 'Référence', value: this.account.id },
    { label: 'Type de gestion', value: this.account.type },
    { label: 'Profil de risque', value: this.account.risk },
    { label: 'Devise de référence', value: this.account.currency },
    { label: "Date d'ouverture", value: this.account.opened },
    { label: 'Horizon', value: this.account.horizon },
    { label: 'Gérant', value: this.account.manager },
    { label: 'Dépositaire', value: this.account.custodian },
    { label: 'Domiciliation', value: this.account.domicile },
    { label: 'Classification MiFID', value: this.account.mifid },
    { label: 'Régime fiscal', value: this.account.tax },
    { label: 'Tarification', value: this.account.fee },
    { label: 'Prochaine revue', value: this.account.review },
  ];

  protected readonly holders = this.account.holders.map((h) => ({
    name: h.name, role: h.role, detail: h.detail, kyc: h.kyc,
    initials: initials(h.name),
    kycBg: (KYC[h.kyc] || KYC['Hors périmètre']).bg,
    kycFg: (KYC[h.kyc] || KYC['Hors périmètre']).fg,
  }));

  /* Le décompte remplace la ligne « Titulaires : 3 personne(s) rattachée(s) » de la grille
     d'identité : la liste est juste en dessous, annoncer son nombre à deux endroits laissait
     croire à deux comptes différents. */
  protected readonly holdersNote = this.holders.length
    ? this.holders.length + (this.holders.length > 1 ? ' personnes rattachées' : ' personne rattachée')
    : 'Aucune personne rattachée';

  protected close(): void {
    this.dialogRef.close();
  }

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
