import { PORTFOLIO_LINKS } from '../../domain/security-reference';
import { isLockedInUniverse } from './titres-filters';

/**
 * Un titre détenu ne peut pas sortir de l'univers.
 *
 * L'appartenance à l'univers est une décision, la détention est un fait. Décocher un titre qu'on
 * possède ne le vendrait pas : cela prétendrait seulement qu'on ne l'a pas retenu, et l'écran
 * afficherait « Non retenu » sur une ligne détenue.
 */
describe('verrou des titres détenus', () => {
  const detenu = Object.keys(PORTFOLIO_LINKS).find((t) => PORTFOLIO_LINKS[t]?.held)!;
  const soldé = Object.keys(PORTFOLIO_LINKS).find((t) => !PORTFOLIO_LINKS[t]?.held && PORTFOLIO_LINKS[t]?.history)!;

  it('verrouille un titre détenu et retenu', () => {
    expect(isLockedInUniverse(detenu, true)).toBe(true);
  });

  /* Le verrou porte sur la sortie, pas sur l'entrée : un titre détenu mais pas encore retenu doit
     pouvoir le devenir, sans quoi on l'enfermerait hors de l'univers. */
  it("laisse entrer un titre détenu qui n'est pas encore retenu", () => {
    expect(isLockedInUniverse(detenu, false)).toBe(false);
  });

  it('ne verrouille pas un titre seulement présent dans l’historique', () => {
    expect(isLockedInUniverse(soldé, true)).toBe(false);
  });

  it('ne verrouille pas un titre inconnu du portefeuille', () => {
    expect(isLockedInUniverse('TITRE-QUI-N-EXISTE-PAS', true)).toBe(false);
  });
});
