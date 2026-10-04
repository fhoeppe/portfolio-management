import {
  ACCOUNTS,
  ACCOUNT_TITRES,
  ACCOUNT_TITRES_COUNT,
  BANKS,
  BROKERS,
  ACCOUNT_TYPES,
  ibanCheck,
} from './comptes-data';
import { PORTFOLIOS } from '../positions/positions-data';
import { BROKER_ACCOUNT_STATES, titreIssues, titresOfAccount } from './comptes-form';

/**
 * La graine des comptes titre.
 *
 * Elle n'est lue par aucun calcul : rien ne la contredit si elle est fausse, et quatre des cinq
 * IBAN de la table qui l'a précédée avaient une clé erronée sans que personne ne le voie. Ces cas
 * sont ce qui tient lieu de contradiction.
 */
describe('graine des comptes titre', () => {
  const tous = Object.entries(ACCOUNT_TITRES).flatMap(([id, l]) => l.map((t) => ({ id, t })));

  it('couvre exactement les dossiers du référentiel', () => {
    expect(Object.keys(ACCOUNT_TITRES).sort()).toEqual(ACCOUNTS.map((a) => a.id).sort());
  });

  /* Le formulaire refuse une clé non conforme : une graine approximative serait inutilisable à
     l'instant où un avenant la chargerait. */
  it('ne porte que des IBAN dont la clé est valide', () => {
    const fautifs = tous.flatMap(({ id, t }) =>
      t.cash.filter((c) => ibanCheck(c.iban).state !== 'ok').map((c) => `${id} ${t.ref} ${c.iban}`),
    );
    expect(fautifs).toEqual([]);
  });

  it('adosse au moins un compte de liquidité à chaque compte titre', () => {
    expect(tous.filter(({ t }) => !t.cash.length).map(({ t }) => t.ref)).toEqual([]);
  });

  /* Un libellé hors référentiel ne s'affiche pas : le combo ne sait pas le montrer, et le champ
     reste vide sans rien signaler. */
  it("ne nomme que des brokers, des banques et des types du référentiel", () => {
    const brokers = new Set(BROKERS.map((b) => b.label));
    const banques = new Set(BANKS.map((b) => b.label));
    const types = new Set(ACCOUNT_TYPES.map((t) => t.label));
    const etats = new Set(BROKER_ACCOUNT_STATES.map((e) => e.label));
    expect(tous.filter(({ t }) => !brokers.has(t.broker)).map(({ t }) => t.broker)).toEqual([]);
    expect(tous.flatMap(({ t }) => t.cash.map((c) => c.bank)).filter((b) => !banques.has(b))).toEqual([]);
    expect(tous.filter(({ t }) => !types.has(t.accountType)).map(({ t }) => t.accountType)).toEqual([]);
    expect(tous.filter(({ t }) => !etats.has(t.brokerStatus)).map(({ t }) => t.brokerStatus)).toEqual([]);
  });

  it('attribue une référence unique à chaque compte titre', () => {
    const refs = tous.map(({ t }) => t.ref);
    expect(new Set(refs).size).toBe(refs.length);
    expect(ACCOUNT_TITRES_COUNT).toBe(refs.length);
  });

  /* Le libellé identifie le compte dans toute l'application : deux comptes homonymes chez le même
     client seraient impossibles à départager. */
  it('donne un libellé unique aux comptes d’un même dossier', () => {
    for (const [id, liste] of Object.entries(ACCOUNT_TITRES)) {
      expect(new Set(liste.map((t) => t.alias)).size, id).toBe(liste.length);
    }
  });

  it("n'ouvre aucun compte avant l'ouverture du dossier", () => {
    for (const { id, t } of tous) {
      const dossier = ACCOUNTS.find((a) => a.id === id)!;
      if (dossier.opened === '—') continue;
      const [j, m, an] = dossier.opened.split('/');
      expect(t.opened >= `${an}-${m}-${j}`, `${t.ref} ouvert le ${t.opened}`).toBe(true);
    }
  });

  /* Un PEA suppose une personne physique résidente fiscale française. Les six dossiers sont des
     personnes morales domiciliées au Luxembourg. */
  it("n'ouvre aucun PEA à une personne morale luxembourgeoise", () => {
    expect(tous.filter(({ t }) => t.accountType === 'PEA')).toEqual([]);
  });

  it('gèle les comptes du dossier gelé', () => {
    const gele = ACCOUNTS.filter((a) => a.state === 'frozen').map((a) => a.id);
    for (const id of gele) {
      expect((ACCOUNT_TITRES[id] ?? []).map((t) => t.brokerStatus)).not.toContain('Ouvert');
    }
  });
});

/**
 * Ce que la graine vaut une fois chargée dans le formulaire : c'est la seule mesure qui compte,
 * puisque c'est sous cette forme que l'avenant la manipulera.
 */
describe('chargement de la graine dans le formulaire', () => {
  it('rend des comptes titre que le formulaire juge complets', () => {
    const manques = ACCOUNTS.flatMap((a) =>
      titresOfAccount(a.id).flatMap((t) => titreIssues(t, t.cash).map((m) => `${a.id} ${t.ref} : ${m}`)),
    );
    expect(manques).toEqual([]);
  });

  it('retrouve la juridiction et l’adresse du broker sans que la graine les porte', () => {
    for (const t of titresOfAccount('BGM-004')) {
      const b = BROKERS.find((x) => x.label === t.broker)!;
      expect(t.jurisdiction).toBe(b.country);
      expect(t.url).toBe(b.url);
    }
  });

  it('tient le premier compte de liquidité à part des secondaires', () => {
    const [, , troisieme] = titresOfAccount('BGM-004');
    expect(troisieme.cashLabel).toBe('Spuerkeess');
    expect(troisieme.cash.length).toBe(1);
  });

  it('rend une liste vide pour un dossier en ouverture', () => {
    expect(titresOfAccount('GLG-002')).toEqual([]);
  });
});

/**
 * Le rattachement d'un compte titre à un portefeuille valorisé.
 *
 * C'est ce qui a remplacé le rapprochement par nom du courtier. Ces cas disent ce que le
 * rapprochement ne tenait pas : un portefeuille ne vaut que pour un compte, et il existe.
 */
describe('rattachement aux portefeuilles valorisés', () => {
  const tous = Object.values(ACCOUNT_TITRES).flat();
  const liens = tous.map((t) => t.portfolio).filter((x): x is string => !!x);

  it('ne nomme que des portefeuilles qui existent', () => {
    const connus = new Set(PORTFOLIOS.map((p) => p.id));
    expect(liens.filter((id) => !connus.has(id))).toEqual([]);
  });

  /* C'est la faute que le rapprochement par nom commettait : les trois portefeuilles de Positions
     se retrouvaient comptés dans quatre dossiers à la fois. */
  it("n'attribue jamais le même portefeuille à deux comptes", () => {
    expect(new Set(liens).size).toBe(liens.length);
  });

  /* BD-PEA reste sans preneur, et c'est le bon résultat : aucun dossier ne détient de PEA. Le
     portefeuille appartient au porteur particulier, que cet écran ne montre pas. */
  it('laisse sans rattachement le portefeuille qu’aucun dossier ne détient', () => {
    expect(liens).not.toContain('BD-PEA');
  });
});
