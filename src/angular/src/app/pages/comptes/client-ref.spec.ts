import { mod97Key } from './comptes-data';
import { clientRefCheck, nextClientRef } from './comptes-form';

/**
 * La référence client : CLI-année-moisjour-rang-clé.
 *
 * La clé n'est utile que si elle se vérifie. Ces cas tiennent les deux bouts — ce que la
 * fabrication produit, et ce que le contrôle accepte — pour qu'aucun des deux ne dérive seul.
 */
describe('référence client', () => {
  const LE_30_SEPTEMBRE = new Date(2026, 8, 30);

  it('assemble les quatre groupes après le préfixe', () => {
    expect(nextClientRef(6, LE_30_SEPTEMBRE)).toMatch(/^CLI-2026-0930-\d{4}-\d{2}$/);
  });

  it("place le rang à la suite des dossiers connus", () => {
    const rang = (ref: string) => ref.split('-')[3];
    expect(rang(nextClientRef(6, LE_30_SEPTEMBRE))).toBe('0008');
  });

  /* Deux créations dans la même session ne partagent pas la même référence : le rang avance à
     chaque attribution, et non au seul nombre de dossiers connus — qui, lui, n'a pas bougé. */
  it('avance à chaque attribution', () => {
    const a = nextClientRef(6, LE_30_SEPTEMBRE);
    const b = nextClientRef(6, LE_30_SEPTEMBRE);
    expect(a).not.toBe(b);
  });

  it('se fabrique avec une clé que le contrôle accepte', () => {
    expect(clientRefCheck(nextClientRef(6, LE_30_SEPTEMBRE)).state).toBe('ok');
  });

  /* L'invariant de l'ISO 7064 : les douze chiffres suivis de leur clé valent 1 modulo 97. C'est
     lui qui fait le travail, la vérification par recalcul n'en est qu'une lecture. */
  it('satisfait l’invariant MOD 97-10', () => {
    const digits = nextClientRef(6, LE_30_SEPTEMBRE).slice(4).replace(/-/g, '');
    let reste = 0;
    for (const c of digits) reste = (reste * 10 + +c) % 97;
    expect(reste).toBe(1);
  });

  it('refuse un chiffre changé dans le rang', () => {
    expect(clientRefCheck('CLI-2026-0930-0007-47').state).toBe('ok');
    expect(clientRefCheck('CLI-2026-0930-0070-47').state).toBe('bad');
  });

  it('refuse deux chiffres intervertis dans la date', () => {
    expect(clientRefCheck('CLI-2026-0390-0007-47').state).toBe('bad');
  });

  it('dit quelle clé était attendue', () => {
    expect(clientRefCheck('CLI-2026-0930-0007-00').message).toContain(mod97Key('202609300007'));
  });

  it('refuse une référence mal formée', () => {
    expect(clientRefCheck('CLI-2026-0007').state).toBe('bad');
  });

  /* Vide n'est pas faux : le champ non encore attribué ne doit pas s'afficher en rouge. */
  it('ne juge pas une référence absente', () => {
    expect(clientRefCheck('').state).toBe('empty');
    expect(clientRefCheck(undefined).state).toBe('empty');
  });
});
