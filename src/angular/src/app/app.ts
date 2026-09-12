import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Racine de l'appli : un simple point d'ancrage pour le routeur. `AppShell` (menu, bandeau,
 * fil d'Ariane) n'est plus posé ici en dur — c'est désormais le composant de la route `''`
 * dans `app.routes.ts`, au même titre que `Guide` pour la route `guide` : les deux se
 * disputent cet unique `router-outlet` selon l'URL, ce qui permet à `guide` de s'afficher sans
 * jamais monter `AppShell` (donc sans menu latéral ni bandeau — une page à part, voir
 * `app/standalone/guide/guide.ts`).
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
