import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Écran de repli pour toute route pas encore portée — reproduit le panneau
 * `pageDashboardRef` / `blankTitleRef` de `Navigation Sobre.dc.html` ("Cette page n'est pas
 * encore construite"). À retirer d'une route le jour où l'écran réel la remplace.
 */
@Component({
  selector: 'app-page-placeholder',
  templateUrl: './page-placeholder.html',
})
export class PagePlaceholder {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['crumb'] as string) ?? 'Module')),
    { initialValue: 'Module' },
  );
}
