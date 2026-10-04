import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'pm-lang';

/**
 * Langue choisie par l'utilisateur, partagée entre le sélecteur FR/EN du menu compte
 * (`app-shell`) et celui du Guide, construit sur le même modèle que `ThemeService` : un signal,
 * persisté dans `localStorage` pour que le choix survive au rechargement et suive l'utilisateur
 * d'un onglet à l'autre — le Guide s'ouvre dans un onglet séparé, sans parent `AppShell`, et
 * n'a donc que le stockage pour connaître ce qui a été choisi dans l'application.
 *
 * Aujourd'hui seul le Guide est traduit (`guide-data.ts` / `guide-data.en.ts`) : les écrans du
 * domaine restent en français, et ce service ne prétend pas le contraire. Le jour où ils le
 * seront, c'est ce signal qu'un pipe de traduction ou l'i18n Angular devra lire.
 */
@Injectable({ providedIn: 'root' })
export class LangService {
  private readonly document = inject(DOCUMENT);

  private readonly stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) as Lang | null;
    } catch {
      return null;
    }
  })();

  readonly lang = signal<Lang>(this.stored === 'en' ? 'en' : 'fr');

  constructor() {
    /* `<html lang>` suit le choix : lecteurs d'écran et césure du navigateur s'y fient. */
    effect(() => {
      this.document.documentElement.setAttribute('lang', this.lang());
    });
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* stockage indisponible (navigation privée) — la langue reste en mémoire pour la session */
    }
  }
}
