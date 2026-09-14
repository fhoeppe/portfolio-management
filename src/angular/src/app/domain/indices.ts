/**
 * Référentiel statique des indices de référence et de leur composition.
 *
 * Il vivait dans `pages/titres/titres-data.ts`, mêlé à l'univers d'investissement et aux écrans qui
 * l'affichent. Un indice n'appartient pourtant à aucun écran : `IndexCompositionService` s'en sert,
 * la page Titres aussi, l'Accueil en cite les noms. Le sortir ici met fin à la dépendance d'un
 * service de domaine envers une page, et donne à la composition le même statut que les pays, les
 * places ou les jours fériés — une donnée de référence, figée, sans appel réseau.
 *
 * Les compositions embarquées sont des échantillons, pas des listes exhaustives : le CAC 40 y
 * compte dix valeurs sur quarante, le S&P 500 huit sur cinq cents. C'est assumé et mesurable —
 * `count` porte l'effectif réel de l'indice, la longueur de `members` ce qui est décrit, et
 * `IndexCompositionService.byName()` rend les deux ainsi que le poids couvert. Compléter ces listes
 * suppose une source de données d'indice sous licence ; inventer des ISIN pour faire nombre
 * donnerait une base fausse, ce qui est pire qu'une base partielle et annoncée.
 *
 * D'où la structure du fichier : le socle ci-dessous est un **repli**, pas une vérité. La
 * composition réellement servie vit dans un signal que `IndexFeedService` remplace au démarrage
 * avec ce qu'une vraie source lui donne — fichier déposé ou API du contrat. Tant que rien n'est
 * chargé, ou si le chargement échoue, c'est le socle qui est lu : l'application n'a jamais de
 * référentiel vide.
 *
 * Le MIC de chaque indice est déclaré à part, dans `INDEX_MIC` : le libellé de place porté ici est
 * un nom d'usage — « Deutsche Börse », « Zone euro » — qui ne se convertit pas mécaniquement en
 * code ISO 10383.
 */

import { computed, signal, type Signal } from '@angular/core';

export interface IndexMember {
  readonly name: string;
  readonly ticker: string;
  readonly isin: string;
  readonly sector: string;
  readonly weight: number;
  readonly cap: string;
  readonly ref: 'ok' | 'none';
}

export interface IndexDef {
  readonly key: string;
  readonly region: string;
  readonly name: string;
  readonly place: string;
  readonly currency: string;
  readonly count: number;
  readonly detail: string;
  readonly members: readonly IndexMember[];
  /**
   * MIC ISO 10383 de la place. Absent sur le socle, qui le déclare à part dans `INDEX_MIC` ; porté
   * en propre par une composition chargée, qui tient sa place de sa source.
   */
  readonly mic?: string;
  /** Date d'arrêté de la composition, en ISO `AAAA-MM-JJ`. Absente sur le socle, qui n'est daté que
   *  par la version de l'application. */
  readonly asOf?: string;
}

function synth(
  key: string, region: string, name: string, place: string, currency: string, count: number, detail: string,
  rows: readonly [string, string, string, string, number, string, 'ok' | 'none'][],
): IndexDef {
  return {
    key, region, name, place, currency, count, detail,
    members: rows.map((r) => ({ name: r[0], ticker: r[1], isin: r[2], sector: r[3], weight: r[4], cap: r[5], ref: r[6] })),
  };
}

const BASE_INDICES: readonly IndexDef[] = [
  {
    key: 'cac40', region: 'Europe continentale', name: 'CAC 40', place: 'Euronext Paris', currency: 'EUR', count: 40,
    detail: '40 valeurs · révision trimestrielle · devise EUR',
    members: [
      { name: 'TotalEnergies', ticker: 'TTE', isin: 'FR0000120271', sector: 'Énergie', weight: 8.4, cap: '148 Md€', ref: 'ok' },
      { name: 'LVMH', ticker: 'MC', isin: 'FR0000121014', sector: 'Consommation discrétionnaire', weight: 7.9, cap: '312 Md€', ref: 'ok' },
      { name: 'Sanofi', ticker: 'SAN', isin: 'FR0000120578', sector: 'Santé', weight: 6.1, cap: '124 Md€', ref: 'ok' },
      { name: 'Schneider Electric', ticker: 'SU', isin: 'FR0000121972', sector: 'Industrie', weight: 5.8, cap: '132 Md€', ref: 'ok' },
      { name: 'Air Liquide', ticker: 'AI', isin: 'FR0000120073', sector: 'Matériaux', weight: 5.2, cap: '104 Md€', ref: 'ok' },
      { name: 'BNP Paribas', ticker: 'BNP', isin: 'FR0000131104', sector: 'Finance', weight: 4.6, cap: '78 Md€', ref: 'ok' },
      { name: 'Hermès International', ticker: 'RMS', isin: 'FR0000052292', sector: 'Consommation discrétionnaire', weight: 4.1, cap: '228 Md€', ref: 'none' },
      { name: 'STMicroelectronics', ticker: 'STMPA', isin: 'NL0000226223', sector: 'Technologie', weight: 2.4, cap: '31 Md€', ref: 'none' },
      { name: 'Vinci', ticker: 'DG', isin: 'FR0000125486', sector: 'Industrie', weight: 3.2, cap: '68 Md€', ref: 'ok' },
      { name: 'Renault', ticker: 'RNO', isin: 'FR0000131906', sector: 'Automobile', weight: 0.8, cap: '13 Md€', ref: 'none' },
    ],
  },
  {
    key: 'dax', region: 'Europe continentale', name: 'DAX 40', place: 'Deutsche Börse', currency: 'EUR', count: 40,
    detail: '40 valeurs · révision trimestrielle · devise EUR',
    members: [
      { name: 'SAP', ticker: 'SAP', isin: 'DE0007164600', sector: 'Technologie', weight: 14.2, cap: '242 Md€', ref: 'ok' },
      { name: 'Siemens', ticker: 'SIE', isin: 'DE0007236101', sector: 'Industrie', weight: 9.8, cap: '164 Md€', ref: 'ok' },
      { name: 'Allianz', ticker: 'ALV', isin: 'DE0008404005', sector: 'Assurance', weight: 7.1, cap: '116 Md€', ref: 'ok' },
      { name: 'Deutsche Telekom', ticker: 'DTE', isin: 'DE0005557508', sector: 'Télécommunications', weight: 6.4, cap: '142 Md€', ref: 'ok' },
      { name: 'Airbus', ticker: 'AIR', isin: 'NL0000235190', sector: 'Aéronautique', weight: 5.9, cap: '128 Md€', ref: 'none' },
      { name: 'Munich Re', ticker: 'MUV2', isin: 'DE0008430026', sector: 'Assurance', weight: 4.2, cap: '64 Md€', ref: 'none' },
      { name: 'Mercedes-Benz Group', ticker: 'MBG', isin: 'DE0007100000', sector: 'Automobile', weight: 3.1, cap: '54 Md€', ref: 'ok' },
      { name: 'Rheinmetall', ticker: 'RHM', isin: 'DE0007030009', sector: 'Défense', weight: 2.8, cap: '42 Md€', ref: 'none' },
    ],
  },
  {
    key: 'sx5e', region: 'Europe continentale', name: 'EURO STOXX 50', place: 'Zone euro', currency: 'EUR', count: 50,
    detail: '50 valeurs de la zone euro · révision annuelle',
    members: [
      { name: 'ASML Holding', ticker: 'ASML', isin: 'NL0010273215', sector: 'Technologie', weight: 8.1, cap: '286 Md€', ref: 'ok' },
      { name: 'SAP', ticker: 'SAP', isin: 'DE0007164600', sector: 'Technologie', weight: 6.9, cap: '242 Md€', ref: 'ok' },
      { name: 'LVMH', ticker: 'MC', isin: 'FR0000121014', sector: 'Consommation discrétionnaire', weight: 5.4, cap: '312 Md€', ref: 'ok' },
      { name: 'Siemens', ticker: 'SIE', isin: 'DE0007236101', sector: 'Industrie', weight: 4.6, cap: '164 Md€', ref: 'ok' },
      { name: 'Iberdrola', ticker: 'IBE', isin: 'ES0144580Y14', sector: 'Services aux collectivités', weight: 3.4, cap: '92 Md€', ref: 'none' },
      { name: 'Enel', ticker: 'ENEL', isin: 'IT0003128367', sector: 'Services aux collectivités', weight: 3.1, cap: '74 Md€', ref: 'none' },
      { name: 'Intesa Sanpaolo', ticker: 'ISP', isin: 'IT0000072618', sector: 'Finance', weight: 2.7, cap: '68 Md€', ref: 'ok' },
      { name: 'Banco Santander', ticker: 'SAN', isin: 'ES0113900J37', sector: 'Finance', weight: 2.5, cap: '72 Md€', ref: 'ok' },
    ],
  },
  {
    key: 'spx', region: 'Amérique du Nord', name: 'S&P 500', place: 'NYSE / Nasdaq', currency: 'USD', count: 500,
    detail: '500 valeurs américaines · révision trimestrielle · devise USD',
    members: [
      { name: 'Apple', ticker: 'AAPL', isin: 'US0378331005', sector: 'Technologie', weight: 7.2, cap: '3 420 Md$', ref: 'ok' },
      { name: 'Microsoft', ticker: 'MSFT', isin: 'US5949181045', sector: 'Technologie', weight: 6.8, cap: '3 180 Md$', ref: 'ok' },
      { name: 'Nvidia', ticker: 'NVDA', isin: 'US67066G1040', sector: 'Semi-conducteurs', weight: 6.4, cap: '2 940 Md$', ref: 'ok' },
      { name: 'Amazon', ticker: 'AMZN', isin: 'US0231351067', sector: 'Consommation discrétionnaire', weight: 3.9, cap: '1 980 Md$', ref: 'ok' },
      { name: 'Alphabet', ticker: 'GOOGL', isin: 'US02079K3059', sector: 'Communication', weight: 3.6, cap: '2 140 Md$', ref: 'ok' },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', isin: 'US0846707026', sector: 'Finance', weight: 1.8, cap: '980 Md$', ref: 'none' },
      { name: 'JPMorgan Chase', ticker: 'JPM', isin: 'US46625H1005', sector: 'Finance', weight: 1.5, cap: '712 Md$', ref: 'ok' },
      { name: 'Tesla', ticker: 'TSLA', isin: 'US88160R1014', sector: 'Automobile', weight: 1.4, cap: '798 Md$', ref: 'none' },
    ],
  },
  {
    key: 'ftse', region: 'Royaume-Uni', name: 'FTSE 100', place: 'London Stock Exchange', currency: 'GBP', count: 100,
    detail: '100 valeurs britanniques · révision trimestrielle · devise GBP',
    members: [
      { name: 'AstraZeneca', ticker: 'AZN', isin: 'GB0009895292', sector: 'Santé', weight: 8.6, cap: '198 Md£', ref: 'ok' },
      { name: 'Shell', ticker: 'SHEL', isin: 'GB00BP6MXD84', sector: 'Énergie', weight: 7.9, cap: '164 Md£', ref: 'ok' },
      { name: 'HSBC Holdings', ticker: 'HSBA', isin: 'GB0005405286', sector: 'Finance', weight: 6.2, cap: '142 Md£', ref: 'ok' },
      { name: 'Unilever', ticker: 'ULVR', isin: 'GB00B10RZP78', sector: 'Consommation courante', weight: 5.1, cap: '118 Md£', ref: 'ok' },
      { name: 'RELX', ticker: 'REL', isin: 'GB00B2B0DG97', sector: 'Services professionnels', weight: 3.4, cap: '72 Md£', ref: 'none' },
      { name: 'BP', ticker: 'BP', isin: 'GB0007980591', sector: 'Énergie', weight: 3.1, cap: '64 Md£', ref: 'none' },
      { name: 'Rio Tinto', ticker: 'RIO', isin: 'GB0007188757', sector: 'Matériaux', weight: 2.8, cap: '58 Md£', ref: 'none' },
    ],
  },
  {
    key: 'smi', region: 'Suisse', name: 'SMI', place: 'SIX Swiss Exchange', currency: 'CHF', count: 20,
    detail: '20 valeurs suisses · révision annuelle · devise CHF',
    members: [
      { name: 'Nestlé', ticker: 'NESN', isin: 'CH0038863350', sector: 'Consommation courante', weight: 17.4, cap: '242 MdCHF', ref: 'ok' },
      { name: 'Roche Holding', ticker: 'ROG', isin: 'CH0012032048', sector: 'Santé', weight: 15.8, cap: '218 MdCHF', ref: 'ok' },
      { name: 'Novartis', ticker: 'NOVN', isin: 'CH0012005267', sector: 'Santé', weight: 14.2, cap: '206 MdCHF', ref: 'ok' },
      { name: 'UBS Group', ticker: 'UBSG', isin: 'CH0244767585', sector: 'Finance', weight: 6.1, cap: '92 MdCHF', ref: 'ok' },
      { name: 'Zurich Insurance', ticker: 'ZURN', isin: 'CH0011075394', sector: 'Assurance', weight: 5.4, cap: '78 MdCHF', ref: 'none' },
      { name: 'ABB', ticker: 'ABBN', isin: 'CH0012221716', sector: 'Industrie', weight: 4.8, cap: '96 MdCHF', ref: 'none' },
    ],
  },
];

export const REGIONS: readonly string[] = ['Europe continentale', 'Royaume-Uni', 'Suisse', 'Amérique du Nord', 'Asie-Pacifique', 'Marchés émergents', 'Mondial'];

const MORE_INDICES: readonly IndexDef[] = [
  synth('bel20', 'Europe continentale', 'BEL 20', 'Euronext Bruxelles', 'EUR', 20, '20 valeurs belges · révision annuelle · devise EUR', [
    ['KBC Groupe', 'KBC', 'BE0003565737', 'Finance', 12.4, '32 Md€', 'ok'],
    ['UCB', 'UCB', 'BE0003739530', 'Santé', 11.8, '38 Md€', 'ok'],
    ['Ageas', 'AGS', 'BE0974264930', 'Assurance', 8.1, '11 Md€', 'none'],
    ['Solvay', 'SOLB', 'BE0003470755', 'Matériaux', 6.4, '9 Md€', 'none'],
    ['Umicore', 'UMI', 'BE0974320526', 'Matériaux', 4.2, '4 Md€', 'none'],
  ]),
  synth('aex', 'Europe continentale', 'AEX', 'Euronext Amsterdam', 'EUR', 25, '25 valeurs néerlandaises · révision trimestrielle · devise EUR', [
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 18.2, '286 Md€', 'ok'],
    ['Shell', 'SHELL', 'GB00BP6MXD84', 'Énergie', 12.6, '164 Md€', 'ok'],
    ['ING Groep', 'INGA', 'NL0011821202', 'Finance', 7.4, '54 Md€', 'ok'],
    ['Wolters Kluwer', 'WKL', 'NL0000395903', 'Services professionnels', 5.8, '38 Md€', 'ok'],
    ['Adyen', 'ADYEN', 'NL0012969182', 'Paiements', 4.9, '46 Md€', 'none'],
  ]),
  synth('ibex', 'Europe continentale', 'IBEX 35', 'Bolsa de Madrid', 'EUR', 35, '35 valeurs espagnoles · révision semestrielle · devise EUR', [
    ['Inditex', 'ITX', 'ES0148396007', 'Consommation discrétionnaire', 15.1, '148 Md€', 'ok'],
    ['Iberdrola', 'IBE', 'ES0144580Y14', 'Services aux collectivités', 14.2, '92 Md€', 'none'],
    ['Banco Santander', 'SAN', 'ES0113900J37', 'Finance', 11.8, '72 Md€', 'ok'],
    ['BBVA', 'BBVA', 'ES0113211835', 'Finance', 9.6, '58 Md€', 'ok'],
    ['Amadeus IT', 'AMS', 'ES0109067019', 'Technologie', 5.2, '28 Md€', 'none'],
  ]),
  synth('ftsemib', 'Europe continentale', 'FTSE MIB', 'Borsa Italiana', 'EUR', 40, '40 valeurs italiennes · révision trimestrielle · devise EUR', [
    ['Enel', 'ENEL', 'IT0003128367', 'Services aux collectivités', 11.4, '74 Md€', 'none'],
    ['Intesa Sanpaolo', 'ISP', 'IT0000072618', 'Finance', 10.8, '68 Md€', 'ok'],
    ['UniCredit', 'UCG', 'IT0005239360', 'Finance', 9.7, '62 Md€', 'ok'],
    ['Ferrari', 'RACE', 'NL0011585146', 'Automobile', 8.2, '78 Md€', 'ok'],
    ['Eni', 'ENI', 'IT0003132476', 'Énergie', 6.4, '46 Md€', 'none'],
  ]),
  synth('omx', 'Europe continentale', 'OMX Stockholm 30', 'Nasdaq Stockholm', 'SEK', 30, '30 valeurs suédoises · révision semestrielle · devise SEK', [
    ['Atlas Copco', 'ATCO A', 'SE0017486889', 'Industrie', 11.2, '780 MdSEK', 'ok'],
    ['Investor AB', 'INVE B', 'SE0015811963', 'Holding', 9.4, '620 MdSEK', 'none'],
    ['Volvo', 'VOLV B', 'SE0000115446', 'Industrie', 8.1, '540 MdSEK', 'ok'],
    ['Ericsson', 'ERIC B', 'SE0000108656', 'Télécommunications', 5.6, '260 MdSEK', 'none'],
    ['Hexagon', 'HEXA B', 'SE0015961909', 'Technologie', 4.8, '290 MdSEK', 'none'],
  ]),
  synth('stoxx600', 'Europe continentale', 'STOXX Europe 600', 'Europe', 'EUR', 600, '600 valeurs européennes · révision trimestrielle · devise EUR', [
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 2.8, '286 Md€', 'ok'],
    ['Novo Nordisk', 'NOVO B', 'DK0062498333', 'Santé', 2.6, '294 Md€', 'ok'],
    ['Nestlé', 'NESN', 'CH0038863350', 'Consommation courante', 2.4, '242 MdCHF', 'ok'],
    ['SAP', 'SAP', 'DE0007164600', 'Technologie', 2.2, '242 Md€', 'ok'],
    ['AstraZeneca', 'AZN', 'GB0009895292', 'Santé', 2.1, '198 Md£', 'ok'],
    ['LVMH', 'MC', 'FR0000121014', 'Consommation discrétionnaire', 1.9, '312 Md€', 'ok'],
  ]),
  synth('ftse250', 'Royaume-Uni', 'FTSE 250', 'London Stock Exchange', 'GBP', 250, '250 valeurs britanniques de moyenne capitalisation · devise GBP', [
    ['Games Workshop', 'GAW', 'GB0003718474', 'Consommation discrétionnaire', 2.1, '5 Md£', 'none'],
    ['Bellway', 'BWY', 'GB0000904986', 'Construction', 1.4, '3 Md£', 'none'],
    ['Greggs', 'GRG', 'GB00B63QSB39', 'Consommation courante', 1.2, '3 Md£', 'none'],
    ['Britvic', 'BVIC', 'GB00B0N8QD54', 'Consommation courante', 1.1, '3 Md£', 'none'],
  ]),
  synth('nikkei', 'Asie-Pacifique', 'Nikkei 225', 'Tokyo Stock Exchange', 'JPY', 225, '225 valeurs japonaises · pondération par les prix · devise JPY', [
    ['Fast Retailing', '9983', 'JP3802300008', 'Consommation discrétionnaire', 10.4, '14 000 MdJPY', 'none'],
    ['Tokyo Electron', '8035', 'JP3571400005', 'Semi-conducteurs', 7.8, '11 000 MdJPY', 'ok'],
    ['Advantest', '6857', 'JP3122400009', 'Semi-conducteurs', 5.2, '6 800 MdJPY', 'none'],
    ['Sony Group', '6758', 'JP3435000009', 'Technologie', 3.4, '18 000 MdJPY', 'ok'],
    ['Toyota Motor', '7203', 'JP3633400001', 'Automobile', 2.1, '42 000 MdJPY', 'ok'],
  ]),
  synth('topix', 'Asie-Pacifique', 'TOPIX', 'Tokyo Stock Exchange', 'JPY', 2100, 'Ensemble du premier marché japonais · devise JPY', [
    ['Toyota Motor', '7203', 'JP3633400001', 'Automobile', 4.2, '42 000 MdJPY', 'ok'],
    ['Sony Group', '6758', 'JP3435000009', 'Technologie', 2.8, '18 000 MdJPY', 'ok'],
    ['Mitsubishi UFJ', '8306', 'JP3902900004', 'Finance', 2.4, '22 000 MdJPY', 'ok'],
    ['Keyence', '6861', 'JP3236200006', 'Industrie', 1.9, '15 000 MdJPY', 'none'],
  ]),
  synth('hsi', 'Asie-Pacifique', 'Hang Seng Index', 'Hong Kong', 'HKD', 82, '82 valeurs cotées à Hong Kong · devise HKD', [
    ['Tencent Holdings', '0700', 'KYG875721634', 'Technologie', 9.8, '4 200 MdHKD', 'ok'],
    ['Alibaba Group', '9988', 'KYG017191142', 'Consommation discrétionnaire', 8.4, '1 900 MdHKD', 'ok'],
    ['HSBC Holdings', '0005', 'GB0005405286', 'Finance', 7.6, '1 400 MdHKD', 'ok'],
    ['AIA Group', '1299', 'HK0000069689', 'Assurance', 6.2, '780 MdHKD', 'none'],
    ['Meituan', '3690', 'KYG596691041', 'Consommation discrétionnaire', 4.1, '760 MdHKD', 'none'],
  ]),
  synth('asx200', 'Asie-Pacifique', 'S&P/ASX 200', 'Australian Securities Exchange', 'AUD', 200, '200 valeurs australiennes · révision trimestrielle · devise AUD', [
    ['BHP Group', 'BHP', 'AU000000BHP4', 'Matériaux', 9.4, '210 MdAUD', 'ok'],
    ['Commonwealth Bank', 'CBA', 'AU000000CBA7', 'Finance', 8.8, '190 MdAUD', 'ok'],
    ['CSL', 'CSL', 'AU000000CSL8', 'Santé', 6.1, '140 MdAUD', 'ok'],
    ['Macquarie Group', 'MQG', 'AU000000MQG1', 'Finance', 4.2, '78 MdAUD', 'none'],
  ]),
  synth('kospi', 'Asie-Pacifique', 'KOSPI 200', 'Korea Exchange', 'KRW', 200, '200 valeurs coréennes · devise KRW', [
    ['Samsung Electronics', '005930', 'KR7005930003', 'Technologie', 22.4, '480 000 MdKRW', 'ok'],
    ['SK hynix', '000660', 'KR7000660001', 'Semi-conducteurs', 9.8, '160 000 MdKRW', 'ok'],
    ['Hyundai Motor', '005380', 'KR7005380001', 'Automobile', 4.1, '52 000 MdKRW', 'none'],
    ['Samsung Biologics', '207940', 'KR7207940008', 'Santé', 3.6, '68 000 MdKRW', 'none'],
  ]),
  synth('nasdaq100', 'Amérique du Nord', 'Nasdaq 100', 'Nasdaq', 'USD', 100, '100 valeurs non financières du Nasdaq · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 8.9, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 8.4, '3 180 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 7.8, '2 940 Md$', 'ok'],
    ['Broadcom', 'AVGO', 'US11135F1012', 'Semi-conducteurs', 4.6, '1 120 Md$', 'none'],
    ['Meta Platforms', 'META', 'US30303M1027', 'Communication', 4.2, '1 480 Md$', 'ok'],
  ]),
  synth('djia', 'Amérique du Nord', 'Dow Jones Industrial Average', 'NYSE', 'USD', 30, '30 valeurs américaines · pondération par les prix · devise USD', [
    ['UnitedHealth Group', 'UNH', 'US91324P1021', 'Santé', 8.2, '520 Md$', 'ok'],
    ['Goldman Sachs', 'GS', 'US38141G1040', 'Finance', 7.4, '168 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 6.8, '3 180 Md$', 'ok'],
    ['Home Depot', 'HD', 'US4370761029', 'Consommation discrétionnaire', 5.9, '380 Md$', 'ok'],
    ['Caterpillar', 'CAT', 'US1491231015', 'Industrie', 5.1, '176 Md$', 'none'],
  ]),
  synth('russell2000', 'Amérique du Nord', 'Russell 2000', 'NYSE / Nasdaq', 'USD', 2000, '2 000 petites capitalisations américaines · révision annuelle', [
    ['Super Micro Computer', 'SMCI', 'US86800U1043', 'Technologie', 0.8, '24 Md$', 'none'],
    /* ISIN corrigé : celui que portait le prototype — US1998051019 — ne passait pas sa clé de
       contrôle, défaut relevé par `isinValid()` en branchant le chargeur. */
    ['Comfort Systems', 'FIX', 'US1999081045', 'Industrie', 0.4, '14 Md$', 'none'],
    ['Fabrinet', 'FN', 'KYG3323L1005', 'Technologie', 0.3, '9 Md$', 'none'],
  ]),
  synth('tsx', 'Amérique du Nord', 'S&P/TSX 60', 'Toronto Stock Exchange', 'CAD', 60, '60 grandes valeurs canadiennes · devise CAD', [
    ['Royal Bank of Canada', 'RY', 'CA7800871021', 'Finance', 9.2, '240 MdCAD', 'ok'],
    ['Shopify', 'SHOP', 'CA82509L1076', 'Technologie', 7.4, '180 MdCAD', 'none'],
    ['Enbridge', 'ENB', 'CA29250N1050', 'Énergie', 5.8, '128 MdCAD', 'none'],
    ['Canadian National Railway', 'CNR', 'CA1363751027', 'Industrie', 4.6, '96 MdCAD', 'ok'],
  ]),
  synth('msciem', 'Marchés émergents', 'MSCI Emerging Markets', 'Mondial', 'USD', 1400, 'Environ 1 400 valeurs de 24 pays émergents · devise USD', [
    ['TSMC', '2330', 'TW0002330008', 'Semi-conducteurs', 10.2, '980 Md$', 'ok'],
    ['Tencent Holdings', '0700', 'KYG875721634', 'Technologie', 4.4, '540 Md$', 'ok'],
    ['Samsung Electronics', '005930', 'KR7005930003', 'Technologie', 3.6, '360 Md$', 'ok'],
    ['Alibaba Group', '9988', 'KYG017191142', 'Consommation discrétionnaire', 2.8, '240 Md$', 'ok'],
    ['Reliance Industries', 'RELIANCE', 'INE002A01018', 'Énergie', 1.4, '210 Md$', 'none'],
  ]),
  synth('sensex', 'Marchés émergents', 'BSE SENSEX', 'Bombay Stock Exchange', 'INR', 30, '30 valeurs indiennes · devise INR', [
    ['HDFC Bank', 'HDFCBANK', 'INE040A01034', 'Finance', 13.8, '15 000 MdINR', 'ok'],
    ['Reliance Industries', 'RELIANCE', 'INE002A01018', 'Énergie', 11.2, '18 000 MdINR', 'none'],
    ['ICICI Bank', 'ICICIBANK', 'INE090A01021', 'Finance', 9.4, '9 000 MdINR', 'ok'],
    ['Infosys', 'INFY', 'INE009A01021', 'Technologie', 6.1, '7 000 MdINR', 'ok'],
  ]),
  synth('bovespa', 'Marchés émergents', 'Ibovespa', 'B3 São Paulo', 'BRL', 87, '87 valeurs brésiliennes · révision trimestrielle · devise BRL', [
    ['Vale', 'VALE3', 'BRVALEACNOR0', 'Matériaux', 11.4, '280 MdBRL', 'ok'],
    ['Petrobras', 'PETR4', 'BRPETRACNPR6', 'Énergie', 9.8, '480 MdBRL', 'none'],
    ['Itaú Unibanco', 'ITUB4', 'BRITUBACNPR1', 'Finance', 8.2, '320 MdBRL', 'ok'],
    ['Ambev', 'ABEV3', 'BRABEVACNOR1', 'Consommation courante', 4.6, '190 MdBRL', 'none'],
  ]),
  synth('msciworld', 'Mondial', 'MSCI World', 'Mondial', 'USD', 1500, 'Environ 1 500 valeurs de 23 pays développés · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 5.1, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 4.8, '3 180 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 4.4, '2 940 Md$', 'ok'],
    ['Amazon', 'AMZN', 'US0231351067', 'Consommation discrétionnaire', 2.6, '1 980 Md$', 'ok'],
    ['Novo Nordisk', 'NOVO B', 'DK0062498333', 'Santé', 0.9, '294 Md€', 'ok'],
  ]),
  synth('msciacwi', 'Mondial', 'MSCI ACWI', 'Mondial', 'USD', 2900, 'Marchés développés et émergents réunis · devise USD', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 4.5, '3 420 Md$', 'ok'],
    ['Microsoft', 'MSFT', 'US5949181045', 'Technologie', 4.2, '3 180 Md$', 'ok'],
    ['TSMC', '2330', 'TW0002330008', 'Semi-conducteurs', 1.2, '980 Md$', 'ok'],
    ['Nestlé', 'NESN', 'CH0038863350', 'Consommation courante', 0.4, '242 MdCHF', 'ok'],
  ]),
  synth('ftseallworld', 'Mondial', 'FTSE All-World', 'Mondial', 'USD', 4200, 'Environ 4 200 valeurs, grandes et moyennes capitalisations mondiales', [
    ['Apple', 'AAPL', 'US0378331005', 'Technologie', 4.3, '3 420 Md$', 'ok'],
    ['Nvidia', 'NVDA', 'US67066G1040', 'Semi-conducteurs', 3.9, '2 940 Md$', 'ok'],
    ['Alphabet', 'GOOGL', 'US02079K3059', 'Communication', 2.2, '2 140 Md$', 'ok'],
    ['ASML Holding', 'ASML', 'NL0010273215', 'Technologie', 0.6, '286 Md€', 'ok'],
  ]),
];

/**
 * Le référentiel embarqué : ce que l'application sait sans rien demander à personne.
 *
 * C'est le socle et le repli. Il rend l'application entière fonctionnelle hors ligne, sert de
 * base d'identité aux compositions chargées — un dépôt peut ne porter que des valeurs, la région
 * et la devise venant d'ici — et reste affiché si le chargement échoue.
 */
export const SEED_INDICES: readonly IndexDef[] = [...BASE_INDICES, ...MORE_INDICES];

/**
 * Place de cotation de chaque indice, en MIC ISO 10383.
 *
 * La valeur vide n'est pas un oubli : elle dit que l'indice est réparti sur plusieurs places et
 * qu'aucun MIC ne vaut pour l'ensemble. Un S&P 500 cote à New York et au Nasdaq, un STOXX Europe
 * 600 sur seize marchés. Attribuer un MIC unique à ces indices serait faux, et le composant qui en
 * hériterait le serait aussi.
 */
export const INDEX_MIC: Readonly<Record<string, string>> = {
  cac40: 'XPAR',
  dax: 'XETR',
  sx5e: '',
  spx: '',
  ftse: 'XLON',
  smi: 'XSWX',
  bel20: 'XBRU',
  aex: 'XAMS',
  ibex: 'XMAD',
  ftsemib: 'XMIL',
  omx: 'XSTO',
  stoxx600: '',
  ftse250: 'XLON',
  nikkei: 'XTKS',
  topix: 'XTKS',
  hsi: 'XHKG',
  asx200: 'XASX',
  kospi: 'XKRX',
  nasdaq100: 'XNAS',
  djia: '',
  russell2000: '',
  tsx: 'XTSE',
  msciem: '',
  sensex: 'XBOM',
  bovespa: 'BVMF',
  msciworld: '',
  msciacwi: '',
  ftseallworld: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Source courante
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Le référentiel effectivement servi : le socle au démarrage, la composition chargée ensuite.
 *
 * C'est un signal parce que le chargement arrive **après** le premier rendu : l'écran s'affiche
 * avec le socle, puis se corrige tout seul quand la source répond. Tout ce qui lit l'indice depuis
 * un `computed` se recalcule alors sans qu'aucun écran n'ait à s'abonner à quoi que ce soit.
 */
const source = signal<readonly IndexDef[]>(SEED_INDICES);

/** Lecture réactive de la source. Le service de composition passe par là. */
export const indicesSource: Signal<readonly IndexDef[]> = source.asReadonly();

/**
 * Les indices, tels que tout le code les lit depuis toujours — `INDICES.find(…)`, `INDICES.length`.
 *
 * C'est une **vue** sur le signal, pas une copie : chaque accès lit la source courante. Le détour
 * par un `Proxy` n'est pas une coquetterie, c'est le seul moyen de tenir les deux exigences à la
 * fois. Une constante de module ne peut pas changer ; une simple variable réassignée changerait
 * mais ne préviendrait personne, et un écran resterait sur l'ancienne composition jusqu'à un
 * rafraîchissement fortuit. Ici, la lecture traverse le signal : faite dans un `computed`, elle s'y
 * abonne. Une page écrite avant l'existence du chargeur devient réactive sans qu'on y touche.
 *
 * Les méthodes de tableau sont génériques — elles n'utilisent que `length` et l'accès indexé, tous
 * deux interceptés —, donc `find`, `filter`, `map` et la décomposition fonctionnent inchangés, et
 * `Array.isArray` reste vrai puisqu'il traverse le proxy jusqu'à la cible.
 */
export const INDICES: readonly IndexDef[] = new Proxy([] as readonly IndexDef[], {
  get: (_target, prop, receiver) => Reflect.get(source(), prop, receiver),
  has: (_target, prop) => Reflect.has(source(), prop),
  ownKeys: () => Reflect.ownKeys(source()),
  getOwnPropertyDescriptor: (target, prop) => {
    /* `length` se décrit depuis la cible et non depuis la source : c'est la seule propriété non
       configurable d'un tableau, et en annoncer une autre fait échouer `Object.keys`. La valeur
       qu'elle porte n'engage à rien, `length` étant modifiable — c'est le piège `get` qui répond. */
    if (prop === 'length') return Reflect.getOwnPropertyDescriptor(target, prop);
    const descriptor = Reflect.getOwnPropertyDescriptor(source(), prop);
    /* `ownKeys` énumère les clés de la source alors que la cible, elle, reste vide : sans
       `configurable`, le moteur refuse de décrire une clé que la cible n'a pas. */
    return descriptor ? { ...descriptor, configurable: true } : undefined;
  },
});

/* L'index par clé se refait à chaque changement de source plutôt qu'à chaque appel : `indexOf` est
   appelé en boucle par les écrans, reconstruire une Map de vingt-huit entrées à chaque fois serait
   du gâchis, et la garder figée donnerait des réponses périmées. */
const byKey = computed(() => new Map(source().map((i) => [i.key, i])));

/** Indice par clé, `null` si la clé est inconnue. */
export function indexOf(key: string): IndexDef | null {
  return byKey().get(key) ?? null;
}

/**
 * MIC de l'indice ; chaîne vide pour un indice réparti sur plusieurs places ou une clé inconnue.
 * Le MIC porté par l'indice lui-même prime : une composition chargée déclare sa place, et elle en
 * sait plus que la table embarquée.
 */
export function indexMic(key: string): string {
  return indexOf(key)?.mic ?? INDEX_MIC[key] ?? '';
}

/**
 * Remplace la composition des indices cités, laisse les autres en place.
 *
 * Réservé au chargeur (`IndexFeedService`). Le remplacement est **par clé et non global** : une
 * source qui ne livre que le CAC 40 complet ne doit pas effacer les vingt-sept autres indices, sans
 * quoi il faudrait tout avoir avant de pouvoir améliorer quoi que ce soit. L'ordre du socle est
 * conservé — c'est celui des sélecteurs, groupés par région — et les indices inédits ferment la
 * marche.
 */
export function applyIndices(loaded: readonly IndexDef[]): void {
  if (!loaded.length) return;
  const incoming = new Map(loaded.map((i) => [i.key, i]));
  const merged = SEED_INDICES.map((seed) => incoming.get(seed.key) ?? seed);
  const known = new Set(SEED_INDICES.map((i) => i.key));
  source.set([...merged, ...loaded.filter((i) => !known.has(i.key))]);
}

/** Revient au référentiel embarqué — pour annuler un chargement ou repartir propre en test. */
export function resetIndices(): void {
  source.set(SEED_INDICES);
}
