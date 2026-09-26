import { Component, HostBinding, Signal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import { SecurityUniverseStore } from '../../domain/security-universe.store';
import type { Icon } from '../../shell/icon-shapes';
import { PRICE_LAST, PRICE_PERIODS, SecurityElement, priceGeometry, priceSeries } from './titres-data';
import { buildSecuritySheet, computeCriteria } from './titres-filters';

export interface TiSecurityDialogData {
  readonly security: SecurityElement;
  readonly onAuthorize: (ticker: string) => void;
  readonly status: Signal<string>;
}

const ICON_SECURITY: Icon = 'id-badge';

type SecTab = 'sheet' | 'eval' | 'json';

/**
 * Panneau `secOpen` de la source : trois sous-onglets (Fiche / Évaluation / Structure)
 * projetés dans `<app-side-panel>`, qui n'expose pas d'onglets internes lui-même — la bande
 * d'onglets est donc construite ici, comme le fait déjà `pageTabs` au niveau de la page.
 */
@Component({
  selector: 'app-ti-security-dialog',
  imports: [MatTabsModule, MatButtonToggleModule, MatIconModule, SidePanel, MatButtonModule, MatTooltipModule],
  templateUrl: './ti-security-dialog.html',
  styleUrl: './ti-security-dialog.css',
})
export class TiSecurityDialog {
  private readonly data = inject<TiSecurityDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TiSecurityDialog>);
  private readonly theme = inject(ThemeService);
  private readonly universe = inject(SecurityUniverseStore);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly icon = ICON_SECURITY;
  protected readonly cur = this.data.security;
  protected readonly secTab = signal<SecTab>('sheet');
  protected readonly pricePeriod = signal('ytd');

  protected readonly sheet = computed(() => buildSecuritySheet(this.cur, this.universe.decisionMap()));
  protected readonly criteria = computed(() => computeCriteria(this.cur));

  protected readonly priceTabs = PRICE_PERIODS;
  protected readonly priceGeo = computed(() => {
    const def = PRICE_PERIODS.find((p) => p.key === this.pricePeriod()) || PRICE_PERIODS[0];
    return priceGeometry(priceSeries(this.cur.ticker, def.months), this.cur.currency);
  });
  protected readonly priceLast = computed(() => (PRICE_LAST[this.cur.ticker] || 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + this.cur.currency);
  protected readonly priceNote = computed(() => {
    const def = PRICE_PERIODS.find((p) => p.key === this.pricePeriod()) || PRICE_PERIODS[0];
    return 'sur ' + (def.key === 'ytd' ? 'YTD' : def.label.toLowerCase()) + ' · clôtures mensuelles simulées';
  });

  /**
   * Le titre tel qu'il est réellement en mémoire, sérialisé.
   *
   * Les deux premiers onglets sont une lecture : ils mettent en forme, complètent, traduisent des
   * codes en libellés. Celui-ci ne fait rien de tout cela — c'est l'objet brut, champs absents
   * compris, et c'est ce qui en fait l'intérêt : il montre ce que le référentiel sait vraiment
   * d'un titre, par opposition à ce que la fiche parvient à en dire.
   *
   * L'ordre des clés est celui de `SecurityElement`, et non l'ordre d'insertion : deux titres de
   * provenances différentes se lisent ainsi ligne à ligne. Les champs facultatifs absents sont
   * rendus explicitement plutôt qu'omis — leur absence EST l'information.
   */
  protected readonly json = computed(() => {
    const s = this.cur as unknown as Record<string, unknown>;
    const ordre = [
      'id', 'ticker', 'name', 'isin', 'market', 'assetClass', 'rating', 'cap', 'status',
      'liquidity', 'esg', 'domicile', 'currency', 'complexity', 'followed', 'held', 'mandates',
      'reviewed', 'by', 'note', 'sector', 'weight', 'marketCap', 'ref',
    ];
    const range: Record<string, unknown> = {};
    ordre.forEach((k) => (range[k] = k in s ? s[k] : null));
    /* Toute clé qu'on n'aurait pas prévue reste visible : un champ ajouté à la structure sans que
       cette liste soit reprise doit se voir ici, pas disparaître en silence. */
    Object.keys(s)
      .filter((k) => !ordre.includes(k))
      .forEach((k) => (range[k] = s[k]));
    return JSON.stringify(range, null, 2);
  });

  protected setSecTab(t: SecTab): void {
    this.secTab.set(t);
  }

  protected setPricePeriod(k: string): void {
    this.pricePeriod.set(k);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected authorize(): void {
    this.data.onAuthorize(this.cur.ticker);
  }

  protected readonly status = this.data.status;

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
