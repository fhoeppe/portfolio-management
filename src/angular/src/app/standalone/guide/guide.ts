import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ThemeService } from '../../shell/theme.service';
import { Annexes } from '../annexes/annexes';
import { GUIDE_TOPICS } from './guide-data';

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
     l'onglet de l'application (localStorage), et inversement. */
  protected readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  /* Onglet distinct du navigateur (pas seulement une route dans l'onglet de l'appli) : mérite
     son propre titre plutôt que le <title>Angular</title> statique d'index.html, jamais
     changé ailleurs dans ce projet puisque toutes les autres routes restent dans l'onglet
     unique de la coque. */
  constructor() {
    inject(Title).setTitle('Guide — Portfolio Management');
  }

  protected readonly topics = GUIDE_TOPICS;

  protected readonly activeKey = signal(GUIDE_TOPICS[0].key);
  protected readonly query = signal('');
  protected readonly openFaq = signal<number | null>(null);
  protected readonly showAnnexes = signal(false);

  /* Purement visuel, comme le sélecteur FR/EN du menu compte (voir `setLang` dans
     app-shell.ts) : aucun écran n'est traduit aujourd'hui, le choix n'est donc pas propagé.
     À brancher sur une vraie i18n Angular le jour où le besoin est réel. */
  protected readonly lang = signal<'fr' | 'en'>('fr');

  protected setLang(value: 'fr' | 'en'): void {
    this.lang.set(value);
  }

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
