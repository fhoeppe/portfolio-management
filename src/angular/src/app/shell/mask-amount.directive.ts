import { Directive, inject } from '@angular/core';
import { MaskingService } from './masking.service';

/**
 * À poser sur tout élément qui affiche un montant : `<span appMaskAmount>{{ montant() }}</span>`.
 * Floute la valeur quand `MaskingService.hidden()` est vrai, sur toutes les pages qui
 * l'utilisent — c'est l'équivalent déclaratif du `[data-amount="1"]` du prototype.
 */
@Directive({
  selector: '[appMaskAmount]',
  host: {
    '[class.pm-masked-amount]': 'masking.hidden()',
  },
})
export class MaskAmount {
  protected readonly masking = inject(MaskingService);
}
