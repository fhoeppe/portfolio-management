import { signal } from '@angular/core';

import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../../pages/documents/documents-data';

/**
 * Zoom et déplacement d'un aperçu de document : molette, glisser, boutons.
 *
 * Une classe à signaux plutôt qu'une directive : la logique est identique dans l'aperçu
 * encastré de la saisie et dans la visionneuse plein écran, mais les deux hôtes l'exposent
 * différemment dans leur gabarit. Une classe se laisse instancier par les deux sans imposer
 * de contrat de template.
 */
export class ZoomPan {
  readonly zoom = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly dragging = signal(false);

  /* Point de départ du glisser : la position du pointeur et le décalage déjà appliqué. Un
     champ ordinaire et non un signal — il ne sert qu'au calcul, rien ne l'affiche. */
  private origin: { x: number; y: number; px: number; py: number } | null = null;

  private clamp(z: number): number {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(z.toFixed(2))));
  }

  zoomIn(): void {
    this.zoom.update((z) => this.clamp(z + ZOOM_STEP));
  }

  zoomOut(): void {
    this.zoom.update((z) => this.clamp(z - ZOOM_STEP));
  }

  reset(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  /** La molette zoome au lieu de faire défiler la page qui porte l'aperçu. */
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoom.update((z) => this.clamp(z + (e.deltaY > 0 ? -0.1 : 0.1)));
  }

  onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.origin = { x: e.clientX, y: e.clientY, px: this.panX(), py: this.panY() };
    this.dragging.set(true);
    /* Capture du pointeur : le glisser se poursuit même si le curseur sort de l'aperçu, là où
       le prototype perdait le geste dès que la souris quittait le cadre (`onMouseLeave`). */
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging() || !this.origin) return;
    this.panX.set(this.origin.px + (e.clientX - this.origin.x));
    this.panY.set(this.origin.py + (e.clientY - this.origin.y));
  }

  onPointerUp(): void {
    if (this.dragging()) this.dragging.set(false);
    this.origin = null;
  }

  get transform(): string {
    return `translate(-50%, -50%) translate(${Math.round(this.panX())}px, ${Math.round(this.panY())}px) scale(${this.zoom().toFixed(2)})`;
  }

  get zoomLabel(): string {
    return `${Math.round(this.zoom() * 100)} %`;
  }

  get cursor(): string {
    return this.dragging() ? 'grabbing' : 'grab';
  }
}
