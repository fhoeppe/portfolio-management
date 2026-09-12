import { Component, HostBinding, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';

import { DocPage } from '../../ui/doc-preview/doc-page';
import { ZoomPan } from '../../ui/doc-preview/zoom-pan';
import { VIEWER_LINES } from '../../pages/documents/documents-data';
import { ThemeService } from '../../shell/theme.service';

/**
 * Porté depuis `Visionneuse Document.dc.html`. Ouverte dans une fenêtre séparée par l'aperçu
 * de la gestion documentaire, elle reçoit le document à afficher par la chaîne de requête.
 *
 * Hors de la coque applicative, comme le guide : c'est une fenêtre de consultation, sans menu
 * ni bandeau. Elle reporte donc elle-même les jetons dont elle a besoin (voir son CSS).
 */
@Component({
  selector: 'app-visionneuse',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DocPage],
  templateUrl: './visionneuse.html',
  styleUrl: './visionneuse.css',
})
export class Visionneuse {
  private readonly route = inject(ActivatedRoute);
  protected readonly theme = inject(ThemeService);

  /* La fenetre s'ouvre hors de la coque : elle porte elle-meme son [data-theme], lu depuis
     ThemeService (qui lit localStorage en direct), comme le guide. */
  @HostBinding('attr.data-theme') protected get themeAttr(): string {
    return this.theme.mode();
  }

  private readonly titleService = inject(Title);

  protected readonly lines = VIEWER_LINES;
  protected readonly view = new ZoomPan();

  protected readonly name = signal('document.pdf');
  protected readonly docTitle = signal('');
  protected readonly reference = signal('');
  protected readonly pages = signal(9);
  protected readonly page = signal(1);

  constructor() {
    const p = this.route.snapshot.queryParamMap;
    this.name.set(p.get('name') || 'document.pdf');
    this.docTitle.set(p.get('title') || '');
    this.reference.set(p.get('ref') || '');
    this.pages.set(Math.max(1, parseInt(p.get('pages') ?? '', 10) || 9));
    /* Le nom du document devient celui de l'onglet : la fenêtre s'ouvre à côté de
       l'application, il faut pouvoir la retrouver dans la barre d'onglets. */
    this.titleService.setTitle(`${this.name()} — Visionneuse`);
  }

  protected get meta(): string {
    return `${this.pages()} pages${this.reference() ? ` · ${this.reference()}` : ''}`;
  }

  protected get kicker(): string {
    return `Page ${this.page()}`;
  }

  /** À défaut d'intitulé, le nom du fichier débarrassé de son extension et de ses tirets. */
  protected get sheetTitle(): string {
    return this.docTitle() || this.name().replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
  }

  protected get footer(): string {
    return this.reference() ? `Référence ${this.reference()}` : 'Aperçu du document';
  }

  protected get pageLabel(): string {
    return `${this.page()} / ${this.pages()}`;
  }

  protected prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.page.update((p) => Math.min(this.pages(), p + 1));
  }
}
