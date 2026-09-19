import { parseSecurities } from './security-catalog.service';
import { isSecurityFollowed, positionStatusOf } from './security-universe.store';
import { FOLLOWED } from './security-reference';
import { OPEN_ACCOUNTS, accountNote, accountTriggerLabel, pickedAccountKeys } from '../pages/titres/titres-filters';

/**
 * La partition « négociable / suivi » appartient au référentiel, pas à l'écran.
 *
 * Ces cas pincent le point exact où elle se perdait : la charge de l'API porte `followed`, mais
 * la lecture ne le retenait pas, et le front retombait sur `FOLLOWED` — une liste figée dans le
 * code. Tant que le serveur servait précisément ces quatre mnémoniques, rien ne se voyait ; le
 * cinquième aurait été servi par `?followed=true` puis rejeté à l'affichage.
 */
describe('veille du référentiel', () => {
  const row = (extra: Record<string, unknown>) => ({
    id: 'SEC-XX',
    ticker: 'XX',
    name: 'Titre',
    isin: 'FR0000120271',
    mic: 'XPAR',
    currency: 'EUR',
    tradable: true,
    ...extra,
  });

  it("retient le drapeau followed servi par l'API", () => {
    const { list } = parseSecurities({ items: [row({ ticker: 'NEW', followed: true })] });
    expect(list[0].followed).toBe(true);
  });

  it("retient l'identifiant, sans lequel aucune écriture n'est adressable", () => {
    const { list } = parseSecurities({ items: [row({ id: 'SEC-NEW', ticker: 'NEW' })] });
    expect(list[0].id).toBe('SEC-NEW');
  });

  it('tient pour suivi un titre que le référentiel déclare tel, hors liste livrée', () => {
    const { list } = parseSecurities({ items: [row({ ticker: 'NEW', followed: true })] });
    expect(FOLLOWED).not.toContain('NEW');
    expect(isSecurityFollowed(list[0])).toBe(true);
  });

  it("tient pour négociable un titre de la liste livrée que le référentiel a sorti de veille", () => {
    const { list } = parseSecurities({ items: [row({ ticker: 'INFRA', followed: false })] });
    expect(FOLLOWED).toContain('INFRA');
    expect(isSecurityFollowed(list[0])).toBe(false);
  });

  it("laisse la liste livrée trancher quand la charge ne porte pas le champ", () => {
    const { list } = parseSecurities({ items: [row({ ticker: 'INFRA' })] });
    expect(list[0].followed).toBeUndefined();
    expect(isSecurityFollowed(list[0])).toBe(true);
  });
});

/**
 * Un titre peut être détenu ET tenu en veille : ce sont deux faits indépendants.
 *
 * Le tableau des suivis partitionnait sur `positionStatusOf`, un statut d'affichage à préséance où
 * « détenu » l'emporte sur « suivi ». Un titre en position mis en veille rendait donc `'held'` et
 * disparaissait du tableau, alors que le store et l'API l'y plaçaient tous les deux — la liste
 * disait cinq, l'écran en montrait quatre.
 */
describe('veille et position sont deux faits distincts', () => {
  const titre = (extra: Record<string, unknown>) => ({
    ticker: 'MC',
    name: 'LVMH',
    isin: 'FR0000121014',
    market: 'Euronext Paris',
    assetClass: 'Action',
    rating: '—',
    cap: 5,
    status: 'ok' as const,
    liquidity: '—',
    esg: '—',
    domicile: 'France',
    currency: 'EUR',
    complexity: 'Non complexe',
    held: 120,
    mandates: ['DG-CTO-4521'],
    reviewed: '—',
    by: '—',
    note: '',
    ...extra,
  });

  it('tient pour suivi un titre détenu que le référentiel met en veille', () => {
    expect(isSecurityFollowed(titre({ followed: true }))).toBe(true);
  });

  it('tient pour suivi un titre détenu mis en veille pour la séance', () => {
    expect(isSecurityFollowed(titre({}), new Set(['MC']))).toBe(true);
  });

  it("affiche « détenu » comme statut, la préséance du badge étant une autre question", () => {
    expect(positionStatusOf(new Map(), titre({ followed: true }), new Set())).toBe('held');
  });
});

/**
 * Ne rien sélectionner dans le filtre Compte n'est pas sélectionner les comptes ouverts.
 *
 * Le défaut retenait les trois comptes ouverts, si bien que le tableau écartait sans le dire les
 * titres rattachés à aucun d'eux — la vignette annonçait onze négociables, le tableau en montrait
 * neuf, et le sélecteur affichait « Tous les comptes ».
 */
describe('filtre Compte — le défaut ne filtre pas', () => {
  it('ne retient aucun compte quand rien n’est sélectionné', () => {
    expect(pickedAccountKeys(null)).toHaveLength(0);
  });

  it('nomme cet état « Tous les comptes »', () => {
    expect(accountTriggerLabel(null)).toBe('Tous les comptes');
  });

  it('dit explicitement qu’aucun filtre ne s’applique', () => {
    expect(accountNote(0)).toContain('Aucun filtre');
  });

  it('distingue « sans restriction » de « les comptes ouverts », qui reste un filtre', () => {
    const tous = new Set(OPEN_ACCOUNTS);
    expect(pickedAccountKeys(tous)).toHaveLength(OPEN_ACCOUNTS.length);
    expect(accountTriggerLabel(tous)).not.toBe('Tous les comptes');
  });
});
