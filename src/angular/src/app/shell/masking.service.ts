import { Injectable, signal } from '@angular/core';

/**
 * Remplace le mécanisme du prototype : celui-ci scrutait tout le DOM avec un
 * `MutationObserver` et une regex `/€|\$|£|CHF/` pour deviner quels éléments affichaient un
 * montant (piège documenté : fragile, coûteux, et faux positifs sur tout texte contenant un
 * symbole monétaire). Ici, c'est l'écran qui marque explicitement ses montants avec la
 * directive `MaskAmount` ; ce service ne porte que l'état partagé « montants masqués ».
 */
@Injectable({ providedIn: 'root' })
export class MaskingService {
  readonly hidden = signal(false);

  toggle(): void {
    this.hidden.update((v) => !v);
  }
}
