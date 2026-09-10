import { Component, computed, HostBinding, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../shell/theme.service';
import { GUIDE_TOPICS } from './guide-data';

/**
 * Porté depuis `Guide.dc.html`. Hors menu : ouvert par le bouton « Guide » du bandeau
 * (`AppShell.openGuide()`), en boîte de dialogue plutôt qu'en route — ce panneau n'est
 * jamais une destination directe, contrairement aux écrans du menu latéral.
 *
 * `icon` existait sur chaque thématique dans le prototype mais n'était jamais lu par son
 * rendu (ni dans les onglets, ni dans « Toutes les thématiques ») : champ mort, non repris.
 *
 * Les jetons `--ink-*`/`--field-*`/`--surface`/`--color-*` de la coque (`app-shell.css`)
 * ne parviennent pas jusqu'ici : MatDialog monte son contenu dans le `cdk-overlay-container`,
 * attaché à `<body>` en dehors de l'arbre DOM d'`app-shell`, donc hors de portée de l'héritage
 * CSS. Ce composant reporte donc son propre `data-theme` et ses propres jetons plutôt que de
 * compter sur une cascade qui n'existe pas.
 */
@Component({
  selector: 'app-guide-dialog',
  imports: [FormsModule, MatDialogModule, MatIconButton, MatTooltipModule],
  templateUrl: './guide-dialog.html',
  styleUrl: './guide-dialog.css',
})
export class GuideDialog {
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly topics = GUIDE_TOPICS;

  protected readonly activeKey = signal(GUIDE_TOPICS[0].key);
  protected readonly query = signal('');
  protected readonly openFaq = signal<number | null>(null);

  protected readonly activeTopic = computed(() => this.topics.find((t) => t.key === this.activeKey()) ?? this.topics[0]);

  private readonly normalizedQuery = computed(() => this.query().trim().toLowerCase());

  protected readonly subtitle = computed(() => `${this.activeTopic().label} · ${this.topics.length} thématiques`);

  protected readonly sections = computed(() => {
    const q = this.normalizedQuery();
    if (!q) return this.activeTopic().sections;
    return this.activeTopic().sections.filter((s) =>
      `${s.heading} ${s.body} ${(s.steps ?? []).join(' ')}`.toLowerCase().includes(q),
    );
  });

  protected readonly faqRows = computed(() => this.activeTopic().faq.map((f, i) => ({ ...f, open: this.openFaq() === i })));

  protected readonly topicList = computed(() =>
    this.topics.map((t) => ({
      key: t.key,
      label: t.label,
      count: `${t.sections.length} sections`,
      active: t.key === this.activeKey(),
    })),
  );

  constructor(private readonly ref: MatDialogRef<GuideDialog>) {}

  protected selectTopic(key: string): void {
    this.activeKey.set(key);
    this.openFaq.set(null);
  }

  protected toggleFaq(i: number): void {
    this.openFaq.update((v) => (v === i ? null : i));
  }

  protected close(): void {
    this.ref.close();
  }
}
