import { Injectable, WritableSignal, signal } from '@angular/core';

/**
 * Mémoire d'affichage des pages, le temps d'une session de navigation.
 *
 * Le routeur détruit le composant d'une page dès qu'on la quitte : tout ce qu'il gardait dans ses
 * propres signaux — panneau replié, zone choisie, filtre actif — repart à sa valeur initiale au
 * retour. Ce service tient ces valeurs à l'écart du cycle de vie du composant : la page les lui
 * emprunte au lieu de les déclarer, et les retrouve intactes en revenant.
 *
 * Portée volontairement limitée à la session : un rechargement complet remet tout à zéro. Une
 * persistance dans `localStorage` (comme `ThemeService`) est possible mais demande de différer la
 * lecture après l'hydratation — le serveur rend forcément la valeur par défaut, et une structure
 * différente au moment où le client reprend la main casse l'hydratation. À réserver donc aux
 * vraies préférences, pas à l'état d'affichage courant.
 *
 * Nommer les clés `page.propriété` (`calendrier.panelOpen`) : elles vivent dans un espace unique.
 */
@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private readonly cells = new Map<string, WritableSignal<unknown>>();

  /**
   * Signal partagé pour cette clé, créé à la valeur donnée au premier appel et retrouvé tel quel
   * aux suivants. S'utilise exactement comme un `signal()` déclaré dans le composant.
   */
  remember<T>(key: string, initial: T): WritableSignal<T> {
    const existing = this.cells.get(key);
    if (existing) return existing as WritableSignal<T>;
    const cell = signal<T>(initial);
    this.cells.set(key, cell as WritableSignal<unknown>);
    return cell;
  }

  /** Oublie une clé — la page repartira de sa valeur initiale au prochain affichage. */
  forget(key: string): void {
    this.cells.delete(key);
  }
}
