import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'pm-theme';

/**
 * Remplace la bascule manuelle `select()` de `Navigation Sobre.dc.html` (qui réécrivait
 * l'attribut `data-theme` et le contenu de l'icône à la main). Le shell lit `mode()` via un
 * `[attr.data-theme]` sur son hôte ; chaque composant garde son propre bloc CSS
 * `[data-theme="dark"]` comme le décrit le README du design system.
 *
 * `document.body` reçoit le même attribut, en plus de celui du shell : c'est le seul ancêtre
 * commun aux overlays CDK (`MatMenu`, tooltips…) qui ne descendent pas de `<app-shell>` et dont
 * on ne contrôle pas le template pour y reporter un `data-theme` local — contrairement aux
 * dialogues (`MatDialog`/`MatBottomSheet`), dont le contenu nous appartient et porte son propre
 * `data-theme` (voir `project_matdialog_token_inheritance_boundary`). `styles.scss` s'appuie
 * sur ce `data-theme` de `<body>` pour republier les jetons M3 (`--mat-menu-*`…) qu'un panneau
 * de menu ne peut pas hériter de la coque.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    } catch {
      return null;
    }
  })();

  readonly mode = signal<ThemeMode>(this.stored === 'dark' ? 'dark' : 'light');

  private readonly syncBody = effect(() => {
    this.document.body.setAttribute('data-theme', this.mode());
  });

  toggle(): void {
    this.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* stockage indisponible (navigation privée) — le thème reste en mémoire pour la session */
    }
  }
}
