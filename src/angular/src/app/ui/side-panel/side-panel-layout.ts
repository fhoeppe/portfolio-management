/**
 * Géométrie commune aux panneaux latéraux (`pm-side-panel-overlay`) : historique de position,
 * fiche titre, structure de transaction, formulaire d'opération, récapitulatif de compte.
 *
 * Centralisée ici parce qu'elle était recopiée à l'identique dans les six appels à
 * `MatDialog.open` — la moindre retouche demandait six modifications cohérentes.
 *
 * Le panneau tient toute la hauteur de la fenêtre, bandeau supérieur compris : il recouvre donc
 * l'application entière sur sa largeur, et non plus seulement la zone sous le bandeau.
 *
 * `100dvh` et non `100vh` : sur mobile, la barre d'adresse escamotable fait que `100vh` dépasse
 * la hauteur réellement visible, et le pied du panneau — ses boutons — passe sous le pli.
 */
export const SIDE_PANEL_TOP = '0';

export const SIDE_PANEL_LAYOUT = {
  panelClass: 'pm-side-panel-overlay',
  position: { top: SIDE_PANEL_TOP, right: '0' },
  height: '100dvh',
  maxWidth: '100vw',
} as const;
