import { ACCOUNTS_LIST, TRANSFER_POSSIBLE, accountBroker, siblingAccounts } from './operations-data';
import { cfAccountLabel, cfHasFee, cfHasNet, cfHasTarget, cfHasTax } from './operations-forms';

/**
 * Un virement d'espèces reste chez un même teneur de compte.
 *
 * D'un établissement à un autre il n'y a pas de virement : il y a un retrait puis un dépôt, qui
 * passent par un compte bancaire externe et ont leurs propres natures. La règle décide donc à la
 * fois des destinataires proposés et de la possibilité même de saisir un virement.
 */
describe('virement d\'espèces — périmètre du même établissement', () => {
  it('ne propose que les comptes du même établissement, le compte source excepté', () => {
    for (const a of ACCOUNTS_LIST) {
      const freres = siblingAccounts(a.value);
      expect(freres.every((f) => f.label === a.label)).toBe(true);
      expect(freres.some((f) => f.value === a.value)).toBe(false);
    }
  });

  it("ne propose rien quand l'établissement ne tient qu'un compte", () => {
    const solitaires = ACCOUNTS_LIST.filter((a) => ACCOUNTS_LIST.filter((b) => b.label === a.label).length === 1);
    for (const a of solitaires) expect(siblingAccounts(a.value)).toHaveLength(0);
  });

  it('rend un établissement inconnu sans frère plutôt que de lever', () => {
    expect(accountBroker('Compte qui n’existe pas')).toBe('');
    expect(siblingAccounts('Compte qui n’existe pas')).toHaveLength(0);
  });

  /* Le référentiel livré tient trois comptes chez trois établissements distincts : aucun virement
     n'y est possible, et c'est ce que la constante doit dire. Si un jour un établissement en tient
     deux, ce cas basculera — et c'est exactement ce qu'on veut savoir. */
  it('déclare le virement possible seulement si un établissement tient deux comptes', () => {
    const attendu = ACCOUNTS_LIST.some((a) => ACCOUNTS_LIST.filter((b) => b.label === a.label).length > 1);
    expect(TRANSFER_POSSIBLE).toBe(attendu);
  });
});

describe('le virement est la seule nature de cashflow à deux comptes', () => {
  it('lui seul demande un destinataire', () => {
    expect(cfHasTarget('TRANSFER')).toBe(true);
    for (const t of ['DEPOSIT', 'WITHDRAW', 'FEE', 'INTEREST', 'LENDING', 'REFUND']) {
      expect(cfHasTarget(t)).toBe(false);
    }
  });

  it('nomme alors le premier compte « source »', () => {
    expect(cfAccountLabel('TRANSFER')).toBe('Compte source');
    expect(cfAccountLabel('DEPOSIT')).toBe('Compte');
  });

  it('ne porte ni frais, ni taxes, ni montant net : il déplace, il ne produit rien', () => {
    expect(cfHasFee('TRANSFER')).toBe(false);
    expect(cfHasTax('TRANSFER')).toBe(false);
    expect(cfHasNet('TRANSFER')).toBe(false);
  });
});
