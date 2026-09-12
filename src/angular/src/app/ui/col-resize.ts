import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Rend une colonne de tableau redimensionnable à la souris : une poignée apparaît sur le bord
 * droit de l'en-tête au survol, et le glissement fixe la largeur de la colonne. Un double-clic
 * rend la main à la largeur définie en CSS.
 *
 * Écrit ici plutôt que repris d'Angular : le redimensionnement de colonnes n'existe que dans
 * `@angular/cdk-experimental` / `@angular/material-experimental`, absents du projet — deux
 * dépendances de plus, en API expérimentale, et qui apportent leur propre habillage à défaire
 * pour retrouver le dessin des maquettes. La cinquantaine de lignes ci-dessous suffit.
 *
 * À poser sur les `<th>` de la **première** rangée du tableau : sous `table-layout: fixed`,
 * c'est elle qui fixe la largeur des colonnes — les rangées suivantes (ligne de filtres,
 * corps) suivent sans rien à faire.
 *
 * La poignée est créée en TypeScript, donc sans l'attribut `_ngcontent` d'un composant : sa
 * mise en forme vit dans `styles.scss` (`.pm-col-resize`), pas dans une feuille de composant,
 * qui ne l'atteindrait jamais (voir project_matmenu_panel_ancestor_selector_trap).
 */
@Directive({
  selector: '[pmColResize]',
  host: { class: 'pm-col-resizable' },
})
export class ColResize {
  private readonly host = inject<ElementRef<HTMLTableCellElement>>(ElementRef);

  /** Largeur minimale : en deçà, l'en-tête devient illisible et la poignée inatteignable. */
  readonly min = input(44, { alias: 'pmColResizeMin' });

  constructor() {
    /* `afterNextRender` et non `ngOnInit` : le rendu côté serveur (20 routes prérendues) n'a
       pas de DOM à manipuler, et la poignée n'aurait aucun sens dans du HTML statique. */
    afterNextRender(() => this.attach());
  }

  private attach(): void {
    const th = this.host.nativeElement;
    const handle = document.createElement('span');
    handle.className = 'pm-col-resize';
    handle.setAttribute('aria-hidden', 'true');
    th.appendChild(handle);

    let startX = 0;
    let startWidth = 0;

    const onMove = (e: PointerEvent) => {
      th.style.width = `${Math.max(this.min(), startWidth + e.clientX - startX)}px`;
    };

    const onUp = (e: PointerEvent) => {
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      document.body.classList.remove('pm-col-resizing');
    };

    handle.addEventListener('pointerdown', (e: PointerEvent) => {
      /* Le `<th>` porte aussi le tri et les filtres selon les écrans : la poignée garde
         l'événement pour elle. */
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startWidth = th.getBoundingClientRect().width;
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      /* Curseur de redimensionnement maintenu sur toute la page pendant le glissement, même
         quand le pointeur sort de la poignée. */
      document.body.classList.add('pm-col-resizing');
    });

    handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      th.style.removeProperty('width');
    });
  }
}
