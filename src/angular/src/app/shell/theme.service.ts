import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'pm-theme';

/**
 * Remplace la bascule manuelle `select()` de `Navigation Sobre.dc.html` (qui réécrivait
 * l'attribut `data-theme` et le contenu de l'icône à la main). Le shell lit `mode()` via un
 * `[attr.data-theme]` sur son hôte ; chaque composant garde son propre bloc CSS
 * `[data-theme="dark"]` comme le décrit le README du design system.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    } catch {
      return null;
    }
  })();

  readonly mode = signal<ThemeMode>(this.stored === 'dark' ? 'dark' : 'light');

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
