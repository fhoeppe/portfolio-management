import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ThemeService } from '../../shell/theme.service';
import { LangService, type Lang } from '../../shell/lang.service';
import { Annexes } from '../annexes/annexes';
import { GUIDE_TOPICS } from './guide-data';
import { GUIDE_TOPICS_EN } from './guide-data.en';

/**
 * Porté depuis `Guide.dc.html` (`data-component="GuidePage"` dans la source — une page, pas
 * une boîte de dialogue). Vit dans `app/standalone/` plutôt que `app/pages/` : contrairement
 * aux écrans du menu (Titres, Comptes, Réconciliation…), la route `guide` est déclarée hors du
 * groupe enfant d'`AppShell` dans `app.routes.ts` — elle ne s'affiche jamais dans le menu
 * latéral ni le bandeau de contexte, et s'ouvre dans un nouvel onglet (lien `<a target="_blank">`
 * dans `app-shell.html`, pas `routerLink`) : une page de documentation à part, pas un écran
 * applicatif de plus. `app/standalone/` est le dossier à utiliser pour toute future page du
 * même genre (hors coque) ; `app/pages/` reste réservé aux écrans routés sous `AppShell`.
 *
 * `icon` existait sur chaque thématique dans le prototype mais n'était jamais lu par son
 * rendu (ni dans les onglets, ni dans « Toutes les thématiques ») : champ mort, non repris.
 *
 * « Annexes et légendes » (`Annexes`, ex-écran du menu) est intégré ici comme un onglet de
 * plus dans `gd-tabs`, à côté des thématiques de `guide-data.ts` — matière de référence au
 * même titre que le reste du Guide, plutôt qu'un écran séparé de la coque. `showAnnexes`
 * bascule l'affichage du corps de page entre le contenu thématique habituel et `<app-annexes>`
 * monté tel quel (import direct du composant existant, aucune donnée dupliquée) ; `Annexes`
 * hérite ses jetons `--ink-*`/`--surface`/etc. de ce composant par cascade DOM normale, comme
 * il le faisait avant depuis `app-shell`.
 *
 * N'étant plus un descendant DOM d'`app-shell`, ce composant n'hérite plus des jetons
 * `--ink-*`/`--field-*`/`--surface`/`--color-*` posés sur `:host` d'`app-shell.css` : il les
 * reporte lui-même dans `guide.css`, et porte son propre `[data-theme]` (lu depuis
 * `ThemeService`, qui lit `localStorage` en direct) plutôt que de compter sur celui — absent
 * ici — de la coque.
 *
 * Le Guide existe en deux langues : `GUIDE_TOPICS` (français) et `GUIDE_TOPICS_EN`, de même
 * forme. La langue est celle de `LangService`, partagée avec le sélecteur du menu compte de la
 * coque et persistée dans `localStorage` — comme le thème, c'est le seul lien entre l'onglet de
 * l'application et celui du Guide. Les clés de thématique sont identiques des deux côtés, si
 * bien qu'un changement de langue conserve la thématique ouverte ; seule la FAQ dépliée est
 * refermée, ses libellés ayant changé. Les libellés propres au gabarit (« Points clés »,
 * « Questions fréquentes »…) suivent par `ui()`. « Annexes et légendes », lui, reste en
 * français : `Annexes` est un référentiel de codes qui n'a pas d'édition anglaise.
 */
@Component({
  selector: 'app-guide',
  imports: [MatTabsModule, MatIconModule, MatButtonToggleModule, MatTooltipModule, MatExpansionModule, FormsModule, Annexes],
  templateUrl: './guide.html',
  styleUrl: './guide.css',
})
export class Guide {
  /* `protected` et non `private` : la page s'ouvrant hors de la coque, elle porte sa propre
     bascule Jour/Nuit dans son en-tête — le menu latéral, qui porte celle de l'application,
     n'est pas là. Le service est partagé, donc le choix fait ici suit l'utilisateur dans
     l'onglet de l'application (localStorage), et inversement. Même chose pour la langue. */
  protected readonly theme = inject(ThemeService);
  private readonly langService = inject(LangService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  @HostBinding('attr.lang') protected get langAttr() {
    return this.lang();
  }

  /* Onglet distinct du navigateur (pas seulement une route dans l'onglet de l'appli) : mérite
     son propre titre plutôt que le <title>Angular</title> statique d'index.html, jamais
     changé ailleurs dans ce projet puisque toutes les autres routes restent dans l'onglet
     unique de la coque. */
  constructor() {
    inject(Title).setTitle('Guide — Portfolio Management');
  }

  protected readonly lang = this.langService.lang;

  protected setLang(value: Lang): void {
    this.langService.set(value);
    this.openFaq.set(null);
  }

  protected readonly topics = computed(() => (this.lang() === 'en' ? GUIDE_TOPICS_EN : GUIDE_TOPICS));

  /* Libellés du gabarit lui-même, hors contenu des thématiques. */
  protected readonly ui = computed(() =>
    this.lang() === 'en'
      ? {
          search: 'Search the guide',
          langLabel: 'Guide language',
          themeLabel: 'Guide theme',
          light: 'Light',
          dark: 'Dark',
          annexes: 'Appendices and legends',
          annexesSubtitle: 'Reference of the codes, indicators and legends used by the application',
          topicsWord: 'topics',
          sectionsWord: 'sections',
          faq: 'Frequently asked questions',
          keys: 'Key points',
          links: 'Useful shortcuts',
          allTopics: 'All topics',
          empty: 'No section in this topic matches the search.',
        }
      : {
          search: 'Rechercher dans le guide',
          langLabel: 'Langue du guide',
          themeLabel: 'Thème du guide',
          light: 'Jour',
          dark: 'Nuit',
          annexes: 'Annexes et légendes',
          annexesSubtitle: "Référentiel des codes, indicateurs et légendes employés par l'application",
          topicsWord: 'thématiques',
          sectionsWord: 'sections',
          faq: 'Questions fréquentes',
          keys: 'Points clés',
          links: 'Raccourcis utiles',
          allTopics: 'Toutes les thématiques',
          empty: 'Aucune section ne correspond à la recherche dans cette thématique.',
        },
  );

  protected readonly activeKey = signal(GUIDE_TOPICS[0].key);
  protected readonly query = signal('');
  protected readonly openFaq = signal<number | null>(null);
  protected readonly showAnnexes = signal(false);

  protected readonly activeTopic = computed(() => {
    const topics = this.topics();
    return topics.find((t) => t.key === this.activeKey()) ?? topics[0];
  });

  private readonly normalizedQuery = computed(() => this.query().trim().toLowerCase());

  protected readonly subtitle = computed(() => `${this.activeTopic().label} · ${this.topics().length} ${this.ui().topicsWord}`);

  protected readonly sections = computed(() => {
    const q = this.normalizedQuery();
    if (!q) return this.activeTopic().sections;
    return this.activeTopic().sections.filter((s) =>
      `${s.heading} ${s.body} ${(s.steps ?? []).join(' ')}`.toLowerCase().includes(q),
    );
  });

  protected readonly faqRows = computed(() => this.activeTopic().faq.map((f, i) => ({ ...f, open: this.openFaq() === i })));

  protected readonly topicList = computed(() =>
    this.topics().map((t) => ({
      key: t.key,
      label: t.label,
      count: `${t.sections.length} ${this.ui().sectionsWord}`,
      active: t.key === this.activeKey(),
    })),
  );

  protected selectTopic(key: string): void {
    this.activeKey.set(key);
    this.openFaq.set(null);
    this.showAnnexes.set(false);
  }

  /* `mat-accordion` n'ouvre qu'un panneau à la fois et émet un booléen, là où l'ancien bouton
     basculait lui-même l'index : on reçoit désormais l'état voulu plutôt que de l'inverser.
     La garde sur `openFaq() === i` est indispensable — en ouvrant un panneau, l'accordéon
     referme le précédent, dont l'événement de fermeture arrive après celui d'ouverture et
     remettrait sinon l'index à null, juste après qu'il vient d'être posé. */
  protected setFaq(i: number, expanded: boolean): void {
    if (expanded) this.openFaq.set(i);
    else if (this.openFaq() === i) this.openFaq.set(null);
  }

  protected openAnnexes(): void {
    this.showAnnexes.set(true);
  }
}
