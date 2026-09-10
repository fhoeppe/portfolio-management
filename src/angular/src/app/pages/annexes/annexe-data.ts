/**
 * Référentiel des codes, indicateurs et mécanismes de marché — extrait mécaniquement de
 * `annexe-data.js` (dossier de conception), sans retranscription manuelle, pour garantir
 * l'exactitude des 56 entrées. Structure normative au sens du README du dossier de
 * conception : ne pas simplifier les champs. Deux catégories de clés mortes présentes dans
 * la source ont été retirées, aucune n'étant jamais lue par `AnnexeBloc.dc.html` : les
 * `blocks`/`fields` vides au niveau section (copier-coller de la forme d'une entrée), et
 * `title` sur 2 des 54 blocs (le renderer du prototype ne lit que kind/text/head/body).
 */

export interface AnnexeField {
  readonly label: string;
  readonly text: string;
}

export type AnnexeBlock =
  | { readonly kind: 'sub'; readonly text: string }
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'code'; readonly text: string }
  | { readonly kind: 'table'; readonly head: readonly string[]; readonly body: readonly (readonly string[])[] };

export interface AnnexeEntry {
  readonly code: string;
  readonly title: string;
  readonly desc: string;
  readonly fields: readonly AnnexeField[];
  readonly blocks: readonly AnnexeBlock[];
}

export interface AnnexeSection {
  readonly title: string;
  readonly intro?: string;
  readonly entries: readonly AnnexeEntry[];
}

export const ANNEXE_SECTIONS: readonly AnnexeSection[] = [
  {
    "title": "Principes de saisie",
    "intro": "Ce qui gouverne la structure du journal, avant toute règle particulière à un type d'opération.",
    "entries": [
      {
        "code": "TXN",
        "title": "Une transaction = un fait économique",
        "desc": "Une transaction est un fait de gestion daté ; une opération est l'un de ses effets sur une ligne (compte, titre). Une transaction porte au moins une opération, souvent plusieurs. Le nombre d'opérations découle du fait : il ne se choisit pas, et on ne regroupe jamais plusieurs faits distincts dans une même transaction pour la commodité de la saisie.",
        "fields": [
          {
            "label": "Effet",
            "text": "Les opérations d'une transaction se créent, se modifient et se suppriment ensemble : aucune ne survit seule à sa transaction."
          },
          {
            "label": "Exemple",
            "text": "Un transfert entre comptes est une transaction à deux opérations — une sortie du compte source, une entrée sur le compte destinataire — et non deux transactions qu'il faudrait recoudre."
          }
        ],
        "blocks": []
      },
      {
        "code": "STRUCT",
        "title": "Structure d'une transaction",
        "desc": "Une transaction porte un en-tête — identifiant, titulaire, nature, date du fait, heure, date de dernière modification et commentaire — et un tableau d'opérations numérotées. L'en-tête ne porte aucune donnée chiffrée : quantité, prix, frais et taxe appartiennent à l'opération, seule à savoir quelle ligne (compte, titre) elle touche.",
        "fields": [
          {
            "label": "Effet",
            "text": "L'ordre de rejeu suit (date d'opération, transaction, séquence). La séquence est stockée et non déduite du rang : elle seule départage deux opérations de même date."
          },
          {
            "label": "Titulaire",
            "text": "Le titulaire (owner) rattache la transaction à la personne qui la détient, indépendamment des comptes touchés par ses opérations : un transfert entre deux comptes du même titulaire n'en porte qu'un. Il ne se déduit pas du compte, qui peut être joint ou détenu par une personne morale."
          },
          {
            "label": "Dernière modification",
            "text": "La date de dernière modification horodate la dernière écriture sur la transaction ou l'une de ses opérations — création comprise. Elle ne remplace pas la date du fait, qui reste celle de l'événement dans le monde réel : deux transactions du même jour peuvent avoir été corrigées à des semaines d'intervalle. Seul un administrateur peut provoquer sa mise à jour depuis le registre."
          },
          {
            "label": "Lecture",
            "text": "Combien d'opérations pour un fait ? Autant que d'effets dont le montant ne se déduit pas des autres. Un achat touche la ligne de titres et la poche d'espèces, et n'en porte pourtant qu'une : son décaissement vaut quantité × prix + frais, il se recalcule au rejeu. La soulte d'un dividende optionnel ne se déduit de rien, elle exige donc sa jambe propre — de même que les deux comptes d'un transfert, dont aucun ne se déduit de l'autre."
          },
          {
            "label": "Exemple",
            "text": "Ci-dessous un transfert entre comptes : un seul fait, deux opérations, dénouées à cinq jours d'intervalle."
          }
        ],
        "blocks": [
          {
            "kind": "table",
            "head": [
              "montant",
              "se déduit de",
              "jambe propre ?"
            ],
            "body": [
              [
                "décaissement d'un achat",
                "quantité × prix + frais + taxe",
                "non"
              ],
              [
                "encaissement d'une vente",
                "quantité × prix − frais − taxe",
                "non"
              ],
              [
                "frais d'un transfert TOUT / TIN",
                "frais + taxe",
                "non"
              ],
              [
                "soulte d'un dividende optionnel",
                "rien : c'est une saisie",
                "OUI"
              ],
              [
                "chaque compte d'un virement",
                "rien : deux poches distinctes",
                "OUI, une par compte"
              ]
            ]
          },
          {
            "kind": "code",
            "text": "{\n  \"id\": 16,                            // identifiant de la transaction\n  \"owner\": \"Fabrice HOEPPE\",             // titulaire auquel la transaction se rattache\n  \"nature\": \"TRANSFER\",                // la cause : pourquoi le fait existe\n  \"date\": \"2026-07-15\",                // date du fait : celle de sa premiere jambe\n  \"time\": \"14:35\",                     // heure d execution, facultative\n  \"lastModified\": \"2026-07-18\",             // derniere ecriture sur la transaction ou une de ses operations\n  \"comment\": \"Consolidation des comptes\",\n  \"operations\": [\n    {\n      \"id\": 16,                        // identifiant de l operation\n      \"sequence\": 1,                   // rang dans la transaction : fixe l ordre de rejeu\n      \"date\": \"2026-07-15\",            // date d effet propre a la jambe\n      \"type\": \"TOUT\",                  // code d operation, referentiel de l Annexe\n      \"platform\": 1,                   // compte concerne\n      \"isin\": \"US0378331005\",\n      \"quantity\": 40,\n      \"price\": 88.24,                  // cout de base emporte par les titres\n      \"fee\": 0,\n      \"tax\": 0,\n      \"toPlatform\": 2                  // destinataire annonce, facultatif\n    },\n    {\n      \"id\": 17,\n      \"sequence\": 2,\n      \"date\": \"2026-07-20\",            // reglement-livraison : cinq jours plus tard\n      \"type\": \"TIN\",\n      \"platform\": 2,\n      \"isin\": \"US0378331005\",\n      \"quantity\": 40,                  // identiques a la jambe sortante :\n      \"price\": 88.24,                  // c est ce qui garantit un P/L nul\n      \"fee\": 0,\n      \"tax\": 0\n    }\n  ]\n}"
          }
        ]
      },
      {
        "code": "RECO",
        "title": "La réconciliation : ce que confirme le broker",
        "desc": "Le registre est une déclaration interne ; le relevé du broker en est la preuve externe. La réconciliation rapproche les deux et ne modifie jamais la transaction : elle vit dans une structure distincte, qui la référence par son identifiant et descend au niveau de chaque opération. Une transaction peut donc être corrigée sans perdre son historique de rapprochement, et rapprochée plusieurs fois si le broker émet un relevé rectificatif.",
        "fields": [
          {
            "label": "Référence",
            "text": "transactionId et transactionRef pointent la transaction rapprochée. La réconciliation ne duplique aucun champ de la transaction : ni nature, ni date, ni titulaire — ils se lisent en suivant la référence."
          },
          {
            "label": "Granularité",
            "text": "Le relevé du broker décrit des opérations, pas des transactions : un transfert y apparaît en deux lignes, un dividende optionnel en une ligne de titres et une de soulte. Chaque entrée du tableau operations porte donc sa propre ligne de relevé, ses montants et son écart. L'écart de la transaction est la somme de ceux de ses opérations — il n'est jamais saisi à part."
          },
          {
            "label": "Écart",
            "text": "delta est la somme algébrique des divergences de montant, de frais et de taxes entre internal et statementAmounts. Un delta nul est la condition de l'état Rapprochée ; un delta non nul impose Écart, ou Forcée si un opérateur l'a validé en connaissance de cause."
          },
          {
            "label": "Absence de relevé",
            "text": "statement, statementLine et statementAmounts valent null tant que le relevé n'est pas reçu (En attente) ou lorsque aucune ligne ne correspond (Sans contrepartie) : delta est alors null, jamais zéro — l'absence de preuve n'est pas une preuve de concordance."
          },
          {
            "label": "Traçabilité",
            "text": "reconciledAt et reconciledBy datent et signent le rapprochement. Un forçage porte le nom de l'opérateur ; un rapprochement automatique porte celui du traitement."
          }
        ],
        "blocks": [
          {
            "kind": "text",
            "text": "Rapprochée — montant, quantité et date concordent.\nEn attente — relevé non encore reçu pour la période.\nÉcart — divergence à instruire avant clôture comptable.\nSans contrepartie — aucune ligne correspondante dans le relevé.\nForcée — rapprochement validé manuellement malgré un écart résiduel.\n\nUne opération peut être rapprochée quand la transaction ne l'est pas : c'est le cas courant d'un transfert dont une seule jambe figure au relevé — la jambe sortante est Rapprochée, l'entrante Sans contrepartie, la transaction en Écart."
          },
          {
            "kind": "code",
            "text": "{\n  \"transactionId\": 38,                     // reference la transaction, sans la dupliquer\n  \"transactionRef\": \"TXN000038\",\n  \"status\": \"gap\",                         // matched | pending | gap | unmatched | manual\n  \"statement\": \"DG-2026-08-STMT\",          // releve du broker, null si non recu\n  \"statementLine\": \"DIV-77120\",            // ligne d'en-tete du releve\n  \"reconciledAt\": \"2026-08-31T07:15:00Z\",\n  \"reconciledBy\": \"Rapprochement automatique\",\n  \"internal\": { \"gross\": 192.4, \"fee\": 0, \"tax\": 0 },         // agregat des operations\n  \"statementAmounts\": { \"gross\": 194.2, \"fee\": 0, \"tax\": 0 },\n  \"delta\": -2.1,                           // somme des ecarts des operations\n  \"operations\": [\n    {\n      \"operationId\": 38,\n      \"sequence\": 1,                       // meme rang que dans la transaction\n      \"type\": \"DIVOPT\",\n      \"status\": \"gap\",\n      \"statementLine\": \"DIV-77120-T\",      // la ligne du releve qui decrit cette jambe\n      \"internal\": { \"gross\": 166.4, \"fee\": 0, \"tax\": 0 },\n      \"statementAmounts\": { \"gross\": 168.2, \"fee\": 0, \"tax\": 0 },\n      \"delta\": 1.8\n    },\n    {\n      \"operationId\": 39,\n      \"sequence\": 2,\n      \"type\": \"DIVOPT\",\n      \"status\": \"gap\",\n      \"statementLine\": \"DIV-77120-C\",\n      \"internal\": { \"gross\": 29.9, \"fee\": 0, \"tax\": 0 },\n      \"statementAmounts\": { \"gross\": 26, \"fee\": 0, \"tax\": 0 },\n      \"delta\": -3.9\n    }\n  ]\n}"
          }
        ]
      },
      {
        "code": "NATURE",
        "title": "La nature : pourquoi le fait existe",
        "desc": "Le type d'une opération dit un effet — ce qui bouge, sur quel objet, dans quel sens. La nature de la transaction dit une cause — pourquoi le fait a eu lieu. Les deux coïncident dans la plupart des cas, mais pas toujours : un virement porte deux opérations de types opposés pour un seul déplacement, et une fusion produit une sortie et une entrée sans qu'aucun des deux types ne dise qu'elle est subie.",
        "fields": [
          {
            "label": "Effet",
            "text": "Champ d'en-tête, dans les deux journaux · colonne nature du CSV, répétée sur chaque ligne du fait · déduite des types quand elle manque"
          },
          {
            "label": "Lecture",
            "text": "La nature est stockée plutôt que recalculée à l'affichage, contre le principe général de l'application. Deux raisons : elle porte de l'information que les types ne portent pas sur les faits à plusieurs jambes, et elle fige l'intention au jour de la saisie — la table de correspondance peut évoluer, un fait enregistré ne doit pas changer de nature rétroactivement."
          },
          {
            "label": "Exemple",
            "text": "Une nature qui ne couvre pas les types portés est refusée à l'import et signalée en anomalie sur l'existant : « nature TRADE incompatible avec le type SPLIT »."
          }
        ],
        "blocks": [
          {
            "kind": "table",
            "head": [
              "nature",
              "ce qu'elle dit",
              "types couverts"
            ],
            "body": [
              [
                "TRADE",
                "Achat ou vente décidé par le détenteur.",
                "BUY (titres), SELL (titres)"
              ],
              [
                "CORPORATE",
                "Exercice d'un droit déjà détenu.",
                "BUYOPT (titres)"
              ],
              [
                "TRANSFER",
                "Déplacement entre deux comptes suivis ; le patrimoine total ne change pas.",
                "TOUT (titres), TIN (titres), TRANSFER (espèces)"
              ],
              [
                "CORPORATE",
                "Subi, décidé par l'émetteur et non par le détenteur.",
                "SPLIT (titres), SPINOFF (titres), MERGER (titres), DIV (titres), DIVOPT (titres)"
              ],
              [
                "CASHFLOW",
                "Espèces sans contrepartie en titres.",
                "DEPOSIT (espèces), WITHDRAW (espèces), FEE (les deux), INTEREST (espèces), LENDING (les deux), REFUND (espèces)"
              ]
            ]
          }
        ]
      },
      {
        "code": "PREV",
        "title": "Le troisième journal : les actions de société",
        "desc": "Les opérations décidées par l'émetteur — dividende, scission, fusion, souscription — vivent dans corporateActions, troisième journal à côté des titres et de la trésorerie. C'est bien un journal, et non un registre prévisionnel : ce qui y est saisi produit ses effets, que la date soit passée, présente ou future.",
        "fields": [
          {
            "label": "Effet",
            "text": "Un dividende crédite le compte à sa mise en paiement · une scission ou une fusion transfère le coût de revient · rien n'est à ressaisir le jour de l'effet"
          },
          {
            "label": "Lecture",
            "text": "Une action annoncée pour une date future peut être saisie dès l'annonce : elle ne produira ses effets qu'à sa date. Un dividende payable dans trois mois n'entre pas dans le solde d'aujourd'hui — les écrans de solde arrêtent la projection à la date du jour, et ne comptent que ce qui est effectivement arrivé."
          },
          {
            "label": "Exemple",
            "text": "Un dividende détaché le 20 août et payé le 3 septembre se saisit une seule fois, avec ses deux dates. Le 25 août la position ouvre droit au dividende mais le compte n'est pas crédité ; le 3 septembre il l'est. Aucune reprise, aucune conversion."
          }
        ],
        "blocks": []
      },
      {
        "code": "ANOMALIE",
        "title": "Anomalie",
        "desc": "Constat porté sur un journal rejoué, non un refus de saisie. L'application enregistre ce qui a eu lieu, y compris ce qui n'aurait pas dû : vente supérieure à la position détenue, parité de division invalide, solde espèces négatif sur un compte qui ne l'autorise pas, découvert au-delà de la limite consentie.",
        "fields": [
          {
            "label": "Effet",
            "text": "Les anomalies se recalculent à chaque rejeu, ne sont jamais stockées, et s'affichent sur la page d'Accueil. Elles ne bloquent ni la saisie ni le calcul : une position fausse reste visible plutôt que d'être silencieusement corrigée."
          },
          {
            "label": "Exemple",
            "text": "Un compte à −7 563,34 € au 11 février sans découvert déclaré ne signale pas un vrai découvert : le plus souvent une écriture manque, un versement n'a pas été saisi."
          }
        ],
        "blocks": []
      }
    ]
  },
  {
    "title": "Achat et vente",
    "intro": "Les deux opérations de base, saisies dans l'onglet Transactions.",
    "entries": [
      {
        "code": "BUY",
        "title": "Achat",
        "desc": "Acquisition de titres. La quantité augmente et le prix de revient unitaire (PRU) est recalculé en moyenne pondérée, frais et taxes inclus.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↑ · PRU recalculé · solde espèces ↓ de (quantité × prix + frais + taxe) · aucun P/L réalisé"
          },
          {
            "label": "Exemple",
            "text": "Achat de 20 Air Liquide à 168,50 € avec 2,50 € de frais → coût total 3 372,50 €, soit un PRU de 168,63 €."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 7,\n  \"date\": \"2024-06-18\",\n  \"comment\": \"\",\n  \"operations\": [\n    {\n      \"id\": 7,\n      \"sequence\": 1,                   // opération unique : un achat est un fait simple\n      \"date\": \"2024-06-18\",\n      \"type\": \"BUY\",\n      \"platform\": 3,                   // compte PEA Bourse Direct\n      \"isin\": \"FR0000120073\",          // Air Liquide\n      \"quantity\": 10,\n      \"price\": 168.50,                 // prix unitaire payé au marché\n      \"fee\": 2.50,                     // entrent dans le coût de revient,\n      \"tax\": 0                         // donc dans le PRU\n    }\n  ]\n}\n\n// Effet : quantité + 10, coût de revient de la ligne + 1 687,50 EUR\n//         (10 x 168,50 + 2,50), PRU recalculé en moyenne pondérée.\n//         Solde espèces : -1 687,50 EUR.\n//\n// Ce dernier effet n apparait dans aucun champ, et n ouvre aucune seconde\n// operation. Il se deduit de quantity x price + fee + tax, et se recalcule\n// a chaque rejeu — c est le critere applique : un effet deductible des\n// autres champs ne merite pas d operation propre. Comparer avec le\n// dividende optionnel a soulte, dont le montant ne se deduit de rien et\n// exige donc sa jambe."
          }
        ]
      },
      {
        "code": "SELL",
        "title": "Vente",
        "desc": "Cession de titres. La quantité diminue, le PRU reste inchangé, et la plus ou moins-value réalisée est enregistrée.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↓ · PRU inchangé · solde espèces ↑ de (quantité × prix − frais − taxe) · P/L réalisé = produit net − (PRU × quantité vendue)"
          },
          {
            "label": "Exemple",
            "text": "Vente de 5 Apple à 245 $ (3 $ de frais) avec un PRU de 224,75 $ → P/L réalisé = 1 222 − 1 123,75 = +98,25 $."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 12,\n  \"date\": \"2025-10-08\",\n  \"comment\": \"\",\n  \"operations\": [\n    {\n      \"id\": 12,\n      \"sequence\": 1,\n      \"date\": \"2025-10-08\",\n      \"type\": \"SELL\",\n      \"platform\": 2,                   // compte CTO Degiro\n      \"isin\": \"US5949181045\",          // Microsoft\n      \"quantity\": 2,\n      \"price\": 512.00,                 // prix unitaire encaissé\n      \"fee\": 2.00,                     // viennent en deduction du produit,\n      \"tax\": 0                         // ils ne touchent pas au PRU\n    }\n  ]\n}\n\n// Effet : quantité - 2, PRU inchangé, et un P/L réalisé de\n//         (2 x 512,00 - 2,00) - (PRU x 2).\n//         Solde espèces : +1 022,00 EUR.\n//\n// Comme a l achat, l encaissement n a pas de champ et n ouvre pas de\n// seconde operation : il se deduit de quantity x price - fee - tax.\n// Noter le signe des frais, inverse de celui de l achat — ils s ajoutent\n// au decaissement, ils se retranchent du produit.\n// Le P/L realise, lui, ne se deduit pas des seuls champs de la ligne :\n// il exige le PRU, donc le rejeu de tout l historique du titre. C est\n// une valeur projetee, jamais stockee."
          }
        ]
      }
    ]
  },
  {
    "title": "Indicateurs du portefeuille",
    "intro": "Les mesures calculées par l'application. Toutes sont dérivées des transactions : rien n'est stocké, tout est recalculé à la demande.",
    "entries": [
      {
        "code": "PRU",
        "title": "Prix de revient unitaire",
        "desc": "Coût moyen d'acquisition d'un titre en portefeuille, frais et taxes inclus. C'est la référence à partir de laquelle toute plus ou moins-value est mesurée. Méthode retenue ici : moyenne pondérée (et non FIFO).",
        "fields": [
          {
            "label": "Lecture",
            "text": "Une vente au-dessus du PRU dégage une plus-value, en dessous une moins-value. Le PRU ne change jamais lors d'une vente : seule la quantité diminue."
          },
          {
            "label": "Exemple",
            "text": "10 titres à 100 € (2 € de frais) puis 10 à 120 € (2 € de frais) → (1 002 + 1 202) ÷ 20 = 110,20 € de PRU."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "PRU = cout total engage / quantite detenue Point de depart commun : 10 titres a 100 EUR, 2 EUR de frais → PRU 100,20 operation quantite PRU effet sur le cout achat 10 a 120 (+2) 10 → 20 100,20 → 110,20 moyenne ponderee vente de 4 10 → 6 100,20 inchange le PRU ne bouge jamais DPS 5 a 80 (+1) 10 → 15 100,20 → 93,53 souscription = achat split 1 → 4 10 → 40 100,20 → 25,05 qty x4, PRU divise par 4 fusion MERGER 10 → 0 100,20 → 0,00 tout le cout part sur la cible scission SPINOFF 15 % 10 → 10 100,20 → 85,17 15 % du cout s en va"
          }
        ]
      },
      {
        "code": "METHODE",
        "title": "FIFO, LIFO, moyenne pondérée",
        "desc": "Trois façons d'attribuer un coût aux titres vendus, quand ils ont été achetés à des prix différents. FIFO sort les plus anciens, LIFO les plus récents, la moyenne pondérée — MID, ou CUMP — ignore l'ordre et applique un coût unique. La quantité vendue et le produit encaissé sont identiques dans les trois cas : seule la plus-value change.",
        "fields": [
          {
            "label": "Effet",
            "text": "Méthode retenue par l'application : moyenne pondérée (MID) · aucune option de bascule"
          },
          {
            "label": "Lecture",
            "text": "Le choix n'est pas libre : il est imposé par la fiscalité du pays de résidence, et non par le broker. Un même portefeuille déclaré en France et en Italie ne dégage pas la même plus-value imposable."
          },
          {
            "label": "Exemple",
            "text": "Dans l'exemple ci-dessus, l'écart entre FIFO et LIFO atteint 200 EUR sur une seule vente — soit deux fois la plus-value calculée en moyenne pondérée."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Achat 10 a 100 EUR, puis 10 a 120 EUR. Vente de 10 a 130 EUR. methode cout retenu P/L realise reste en portefeuille FIFO 100 300 10 titres a 120 LIFO 120 100 10 titres a 100 MID 110 200 10 titres a 110"
          }
        ]
      },
      {
        "code": "MV",
        "title": "Valeur de marché",
        "desc": "Ce que vaut la position au dernier cours connu. Convertie en euros au taux de change courant lorsque le titre cote dans une autre devise.",
        "fields": [
          {
            "label": "Lecture",
            "text": "C'est la valeur théorique de revente immédiate, hors frais et fiscalité."
          },
          {
            "label": "Exemple",
            "text": "15 Apple à 256 $ avec 1 USD = 0,92 EUR → 15 × 256 × 0,92 = 3 532,80 €."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Valeur de marché = quantité × dernier cours × taux de change"
          }
        ]
      },
      {
        "code": "UPL",
        "title": "P/L latent (non réalisé)",
        "desc": "Gain ou perte sur les positions encore détenues. Il varie à chaque variation de cours et ne devient définitif qu'à la vente.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un P/L latent positif n'est pas un gain encaissé : il peut disparaître. Il n'est pas imposable tant que la position n'est pas soldée."
          },
          {
            "label": "Exemple",
            "text": "20 titres au PRU de 110 € cotant 130 € → (2 600 − 2 200) = +400 €, soit +18,2 %."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "P/L latent = valeur de marché − (PRU × quantité) % = P/L latent ÷ (PRU × quantité)"
          }
        ]
      },
      {
        "code": "RPL",
        "title": "P/L réalisé",
        "desc": "Gain ou perte définitivement acquis lors d'une vente. C'est la base de l'imposition des plus-values sur un compte-titres ordinaire.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un transfert entre comptes ne génère jamais de P/L réalisé : le coût suit les titres. Seule une vente en produit."
          },
          {
            "label": "Exemple",
            "text": "Vente de 5 Apple à 245 $ (3 $ de frais) au PRU de 224,75 $ → 1 222 − 1 123,75 = +98,25 $."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "P/L réalisé = (quantité × prix de vente − frais − taxes) − (PRU × quantité vendue)"
          }
        ]
      },
      {
        "code": "DAY",
        "title": "Variation du jour (Day Change)",
        "desc": "Évolution de la valeur du portefeuille depuis la clôture précédente. Mesure l'agitation quotidienne, pas la performance de fond.",
        "fields": [
          {
            "label": "Lecture",
            "text": "À ne pas confondre avec le P/L latent : le Day Change se mesure depuis hier, le P/L latent depuis votre achat."
          },
          {
            "label": "Exemple",
            "text": "40 titres passant de 26,50 € à 27,20 € → 40 × 0,70 = +28 €."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Day Change = quantité × (dernier cours − cours de clôture précédent) % = Day Change ÷ valeur de marché précédente"
          }
        ]
      },
      {
        "code": "EXP",
        "title": "Exposition (poids)",
        "desc": "Part qu'occupe une ligne dans le portefeuille. C'est l'indicateur de concentration : il révèle la dépendance à une seule valeur.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Une ligne pesant plus de 20 à 25 % fait porter au portefeuille un risque spécifique élevé, indépendant du marché."
          },
          {
            "label": "Exemple",
            "text": "Une ligne de 5 000 € dans un portefeuille de 25 000 € pèse 20 %."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Exposition = valeur de marché de la ligne ÷ valeur de marché totale"
          }
        ]
      }
    ]
  },
  {
    "title": "Opérations sur titres à impact sur la position",
    "intro": "Décidées par l'émetteur, elles modifient la quantité détenue ou le PRU. Elles se saisissent comme des transactions car le projecteur doit les prendre en compte.",
    "entries": [
      {
        "code": "DIVOPT",
        "title": "Dividende optionnel",
        "desc": "Titres reçus gratuitement (attribution d'actions gratuites ou dividende payé en actions). Le coût total de la ligne ne change pas : le PRU se dilue mécaniquement. Une soulte en espèces peut compléter les rompus.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↑ · coût total inchangé → PRU ↓ · aucun P/L"
          },
          {
            "label": "Lecture",
            "text": "La parité ne se saisit pas, elle se déduit : le dividende brut par action rapporté au prix d'émission de l'action nouvelle donne combien de titres il faut détenir pour en recevoir un. Les deux montants viennent de l'avis de l'émetteur ; leur quotient est calculé et affiché en lecture seule, jamais stocké — un chiffre qui se recalcule ne se conserve pas."
          },
          {
            "label": "Exemple",
            "text": "Attribution 1 pour 10 sur 20 Air Liquide → 2 actions reçues. Le coût de 3 372,50 € se répartit sur 22 titres, le PRU passe de 168,63 € à 153,30 €."
          }
        ],
        "blocks": [
          {
            "kind": "table",
            "head": [
              "paramètre",
              "porté par",
              "rôle"
            ],
            "body": [
              [
                "cashBalance",
                "l'opération",
                "soulte versée en complément des titres attribués"
              ],
              [
                "issuePrice",
                "l'opération et l'action de société",
                "prix d'émission de l'action nouvelle, décote comprise"
              ],
              [
                "grossPerShare",
                "l'opération",
                "dividende brut par action, avant conversion en titres"
              ],
              [
                "paritePart",
                "déduit",
                "issuePrice ÷ grossPerShare : combien de titres détenus pour une action nouvelle. Ni saisi, ni stocké."
              ],
              [
                "optionStart",
                "l'action de société",
                "ouverture de la fenêtre d'option laissée au porteur"
              ],
              [
                "optionEnd",
                "l'action de société",
                "clôture de la fenêtre. Trois contrôles la tiennent : après l'ouverture, l'ouverture après le détachement, le paiement après la clôture."
              ],
              [
                "choice",
                "l'action de société",
                "ce que le porteur a retenu — titres ou espèces — ou rien tant qu'il n'a pas répondu"
              ]
            ]
          },
          {
            "kind": "sub",
            "text": "Attribution sans rompu — une seule opération"
          },
          {
            "kind": "text",
            "text": "La parité tombe juste : le porteur reçoit un nombre entier de titres et rien d'autre."
          },
          {
            "kind": "code",
            "text": "{\n  \"id\": 11,\n  \"date\": \"2025-03-10\",\n  \"comment\": \"\",\n  \"operations\": [\n    {\n      \"id\": 11,\n      \"sequence\": 1,\n      \"date\": \"2025-03-10\",\n      \"type\": \"DIVOPT\",\n      \"platform\": 3,\n      \"isin\": \"FR0000120073\",\n      \"quantity\": 3,                   // titres attribues gratuitement\n      \"price\": 140.00,                 // valeur unitaire d attribution : elle\n      \"fee\": 0,                        // valorise la ligne, elle n entre PAS\n      \"tax\": 0,                        // dans le cout, sinon ce serait un achat\n      \"cashBalance\": 0                 // aucun rompu : l attribution tombe juste\n    }\n  ]\n}\n\n// Effet : quantité + 3, coût total inchangé, donc PRU dilué mécaniquement.\n// Aucun P/L réalisé."
          },
          {
            "kind": "sub",
            "text": "Attribution avec soulte — deux opérations"
          },
          {
            "kind": "text",
            "text": "La parité ne tombe pas juste. La fraction de titre non attribuée est réglée en espèces : c'est la soulte. Le fait porte alors deux effets — des titres et des espèces — et se traduit donc par deux opérations, comme un virement."
          },
          {
            "kind": "code",
            "text": "{\n  \"id\": 18,\n  \"date\": \"2026-05-12\",\n  \"comment\": \"Attribution 1 pour 8, rompu payé en espèces\",\n  \"operations\": [\n    {\n      \"id\": 19,\n      \"sequence\": 1,                   // premier effet : les titres\n      \"date\": \"2026-05-12\",\n      \"type\": \"DIVOPT\",\n      \"platform\": 3,\n      \"isin\": \"FR0000120073\",\n      \"quantity\": 4,                   // 37 titres detenus, parite 1 pour 8 :\n      \"price\": 152.30,                 // 4 titres entiers et 5/8 de rompu\n      \"fee\": 0,\n      \"tax\": 0\n    },\n    {\n      \"id\": 20,\n      \"sequence\": 2,                   // second effet : les especes\n      \"date\": \"2026-05-12\",\n      \"type\": \"DIVOPT\",\n      \"sense\": \"soulte\",              // marque la jambe de tresorerie\n      \"platform\": 3,\n      \"isin\": \"FR0000120073\",\n      \"quantity\": 0,                   // aucun titre : le rompu est en especes\n      \"cashBalance\": 95.19             // soulte : 5/8 x 152,30 EUR\n    }\n  ]\n}\n\n// Effet sur la position : quantité + 4, coût total inchangé, PRU dilué.\n// Effet sur la tresorerie : + 95,19 EUR encaisses.\n// Un fait unique portant deux effets donne deux operations, comme le\n// virement : chacune a une seule nature, l une deplace des titres,\n// l autre des especes. La soulte est nette de toute retenue.\n//\n// Compatibilite : un journal anterieur porte la soulte dans le champ\n// cashBalance de l operation de titres, sans seconde jambe. Cette forme\n// reste lue telle quelle et donne le meme solde."
          }
        ]
      },
      {
        "code": "BUYOPT",
        "title": "Droit préférentiel de souscription",
        "desc": "Souscription à une augmentation de capital via un droit préférentiel de souscription, à un prix généralement décoté. Comptabilisée exactement comme un achat.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↑ · PRU recalculé en moyenne pondérée · solde espèces ↓ de (quantité × prix + frais + taxe), comme un achat"
          },
          {
            "label": "Exemple",
            "text": "Souscription de 100 Air France-KLM à 7,20 € alors que le cours est à 9,85 € : le PRU de la ligne baisse."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 13,\n  \"date\": \"2026-01-20\",\n  \"comment\": \"Augmentation de capital\",\n  \"operations\": [\n    {\n      \"id\": 13,\n      \"sequence\": 1,\n      \"date\": \"2026-01-20\",\n      \"type\": \"BUYOPT\",\n      \"platform\": 3,\n      \"isin\": \"FR0000120073\",\n      \"quantity\": 4,\n      \"price\": 140.00,                 // prix de souscription reellement paye\n      \"fee\": 1.50,                     // entrent dans le cout, comme un achat\n      \"tax\": 0\n    }\n  ]\n}\n\n// Effet : quantité + 4, coût de revient augmenté de 561,50 EUR,\n//         PRU recalculé en moyenne pondérée — meme formule qu un achat.\n// C est ce qui distingue BUYOPT de DIVOPT : ici on paie, la on recoit."
          }
        ]
      },
      {
        "code": "SPLIT",
        "title": "Division / regroupement d'actions",
        "desc": "Modification du nominal : une division multiplie le nombre de titres (1 ancienne → 4 nouvelles), un regroupement le réduit (10 anciennes → 1 nouvelle). La valeur détenue est identique avant et après.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité × parité · PRU ÷ parité · coût total et P/L strictement inchangés"
          },
          {
            "label": "Exemple",
            "text": "Division 1 → 4 sur 10 Microsoft à 443,20 $ : la ligne devient 40 titres à 110,80 $. Dans les deux cas le coût total reste 4 432 $."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 14,\n  \"date\": \"2026-02-16\",\n  \"comment\": \"Division par deux\",\n  \"operations\": [\n    {\n      \"id\": 14,\n      \"sequence\": 1,\n      \"date\": \"2026-02-16\",\n      \"type\": \"SPLIT\",\n      \"platform\": 1,                   // une opération par compte détenteur\n      \"isin\": \"US0378331005\",\n      \"quantity\": 0,                   // sans objet : la parite fait tout\n      \"price\": 0,\n      \"fee\": 0,\n      \"tax\": 0,\n      \"ratioFrom\": 1,                  // 1 ancienne action\n      \"ratioTo\": 2                     // donne 2 nouvelles\n    }\n  ]\n}\n\n// Effet : quantité x 2, PRU / 2, coût total strictement conservé,\n//         aucun P/L réalisé.\n// Une division decidee par l emetteur touche TOUS les comptes portant le\n// titre : chacun recoit son opération, sous la meme transaction."
          }
        ]
      }
    ]
  },
  {
    "title": "Trésorerie",
    "intro": "Mouvements d'espèces du compte. Ils ne modifient ni la quantité de titres détenue ni le PRU, mais alimentent le solde en liquidités et le rendement du portefeuille.",
    "entries": [
      {
        "code": "TRANSFER",
        "title": "Cash transfer",
        "desc": "Déplacement d'espèces entre deux comptes tenus par le même établissement et partageant au moins un titulaire. C'est le seul mouvement de trésorerie à porter deux opérations : un débit à la source, un crédit à l'arrivée. Le patrimoine total ne change pas.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde du compte source ↓ · solde du compte destinataire ↑ · somme nulle sur le portefeuille"
          },
          {
            "label": "Lecture",
            "text": "Deux conditions, toutes deux nécessaires. Même teneur : les espèces ne franchissent pas la frontière d'un établissement — d'un broker à l'autre, l'argent repasse par le compte bancaire, c'est un retrait puis un versement. Au moins un titulaire commun : un virement déplace des espèces au sein d'un même patrimoine ; entre deux patrimoines, c'est une donation ou un règlement, pas un virement. Le type d'enveloppe, lui, n'entre pas dans la règle : deux CTO du même teneur remplissent les conditions aussi bien que deux comptes de natures différentes. Le cas d'un compte titres vers son propre compte de liquidité s'écrit en versement ou en retrait, la banque n'étant pas un compte du journal."
          },
          {
            "label": "Exemple",
            "text": "Virement de 750 € entre deux CTO tenus par Bourse Direct : même teneur, même titulaire, donc deux opérations sous une même transaction. Depuis un compte Degiro, refusé — autre teneur. Vers le compte d'un tiers chez Bourse Direct, refusé aussi — aucun titulaire commun."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 2,\n  \"date\": \"2026-08-03\",\n  \"comment\": \"Reequilibrage entre comptes Bourse Direct\",\n  \"operations\": [\n    {\n      \"id\": 3,\n      \"sequence\": 1,\n      \"date\": \"2026-08-03\",\n      \"type\": \"TRANSFER\",\n      \"platform\": 1,                   // CTO Bourse Direct : compte debite\n      \"sense\": \"debit\",                // les deux jambes portent le meme code :\n      \"amount\": 750.00,                // c est `sense` qui les distingue\n      \"currency\": \"EUR\",\n      \"rate\": 1,\n      \"amountEUR\": 750.00\n    },\n    {\n      \"id\": 4,\n      \"sequence\": 2,\n      \"date\": \"2026-08-03\",\n      \"type\": \"TRANSFER\",\n      \"platform\": 3,                   // PEA Bourse Direct : compte credite\n      \"sense\": \"credit\",               // meme teneur que la jambe opposee,\n      \"amount\": 750.00,                // sans quoi l ecriture est refusee\n      \"currency\": \"EUR\",\n      \"rate\": 1,\n      \"amountEUR\": 750.00\n    }\n  ]\n}\n\n// Effet : compte 1 debite de 750,00 EUR, compte 3 credite d autant,\n//         somme nulle. Le compte destinataire n est plus un champ :\n//         il est la seconde jambe.\n// Les deux `platform` designent des comptes du meme etablissement : c est\n// la condition d existence du virement, verifiee a la saisie."
          }
        ]
      },
      {
        "code": "DEPOSIT",
        "title": "Versement d'espèces",
        "desc": "Approvisionnement du compte depuis un compte bancaire externe. C'est l'apport de l'investisseur, à ne jamais confondre avec une performance.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↑ · aucun effet sur les positions ni sur le P/L"
          },
          {
            "label": "Exemple",
            "text": "Virement de 5 000 € vers le PEA avant une série d'achats."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 1,\n  \"date\": \"2026-08-04\",\n  \"comment\": \"Alimentation du compte\",\n  \"operations\": [\n    {\n      \"id\": 2,\n      \"sequence\": 1,                   // fait simple : une seule opération\n      \"date\": \"2026-08-04\",\n      \"type\": \"DEPOSIT\",\n      \"platform\": 2,                   // compte crédité\n      \"amount\": 100.00,                // toujours positif : le code donne le sens\n      \"currency\": \"USD\",               // devise de saisie du mouvement\n      \"rate\": 0.92,                    // cours applique vers l euro\n      \"amountEUR\": 92.00               // contre-valeur, seule grandeur additionnable\n    }\n  ]\n}\n\n// Effet : solde du compte 2 augmenté de 92,00 EUR.\n// Un retrait (WITHDRAW) s ecrit a l identique : seul le code change,\n// et le solde diminue d autant."
          }
        ]
      },
      {
        "code": "WITHDRAW",
        "title": "Retrait d'espèces",
        "desc": "Sortie de liquidités du compte vers un compte bancaire externe. Sur un PEA, un retrait avant 5 ans entraîne en principe la clôture du plan.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↓ · aucun effet sur les positions ni sur le P/L"
          },
          {
            "label": "Exemple",
            "text": "Retrait de 2 000 € du CTO après une vente."
          }
        ],
        "blocks": []
      },
      {
        "code": "DIV",
        "title": "Dividende en numéraire",
        "desc": "Distribution de trésorerie versée par l'émetteur, éventuellement diminuée d'une retenue à la source. Sans effet sur la quantité détenue ni sur le PRU.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↑ du montant net · position et PRU inchangés"
          },
          {
            "label": "Lecture",
            "text": "Un dividende classique ne vit ni dans transactions ni dans cashOperations mais dans corporateActions : il n'a pas d'operations, ses champs sont à plat. C'est le seul revenu à porter un ISIN — il naît d'une ligne de titres, pas d'une poche d'espèces. Il porte deux dates : le détachement ouvre le droit, la mise en paiement crédite le compte."
          },
          {
            "label": "Exemple",
            "text": "Dividende Apple de 1,75 $ brut par action avec 30 % de retenue à la source américaine → 1,22 $ net par action."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 4,\n  \"exDate\": \"2026-02-13\",       // detachement : qui detient ce jour-la touche\n  \"paymentDate\": \"2026-02-27\",  // mise en paiement : le cash arrive ici\n  \"platform\": 2,                 // compte credite\n  \"isin\": \"US0378331005\",        // Apple : la ligne qui produit le revenu\n  \"type\": \"DIV\",\n  \"amount\": 140.00,              // BRUT TOTAL, pas le montant par action :\n                                 // 80 titres x 1,75 USD\n  \"tax\": 42.00,                  // retenue a la source, 30 %\n  \"comment\": \"Dividende trimestriel\"\n}\n\n// Pas d operations : un dividende ne touche qu un objet, la poche d especes.\n// Le net se deduit, il n est pas stocke : amount - tax = 98,00 USD.\n// La devise est celle du titre, pas celle du compte — la conversion se fait\n// a la lecture, au cours de FxRate.csv : 98,00 x 0,92 = 90,16 EUR.\n// Le solde bouge le 27, pas le 13 : entre les deux le droit est acquis mais\n// l argent n est pas la. Une projection au 20 fevrier ne le montre donc pas.\n// La frequence — trimestrielle ici — est portee par le titre, pas par ce\n// versement : elle decrit l emetteur, qui distribue plusieurs fois par an.\n// Effet : solde du compte 2 augmente de 90,16 EUR, quantite et PRU intacts."
          }
        ]
      },
      {
        "code": "INTEREST",
        "title": "Intérêts sur liquidités",
        "desc": "Rémunération des espèces non investies laissées sur le compte.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↑ · position et PRU inchangés"
          },
          {
            "label": "Exemple",
            "text": "12,40 € d'intérêts crédités sur le solde du CTO."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 5,\n  \"date\": \"2026-06-30\",\n  \"comment\": \"Intérêts du 2e trimestre\",\n  \"operations\": [\n    {\n      \"id\": 6,\n      \"sequence\": 1,\n      \"date\": \"2026-06-30\",            // date de crédit en compte\n      \"type\": \"INTEREST\",\n      \"platform\": 2,\n      \"amount\": 12.40,                 // montant net crédité\n      \"currency\": \"EUR\",               // devise du compte : aucun cours a appliquer\n      \"rate\": 1,\n      \"amountEUR\": 12.40\n    }\n  ]\n}\n\n// Effet : solde du compte 2 augmenté de 12,40 EUR.\n// Ni quantité ni PRU ne bougent : aucun titre n est en jeu.\n// Une retenue a la source eventuelle se saisit nette, le brut n etant\n// pas suivi ici."
          }
        ]
      },
      {
        "code": "LENDING",
        "title": "Revenus de prêt de titres",
        "desc": "Mise à disposition temporaire de titres détenus à un emprunteur (souvent un vendeur à découvert), contre une commission. Les titres restent inscrits au portefeuille et continuent d'être valorisés, mais leur propriété est transférée pendant la durée du prêt : le droit de vote est perdu et les dividendes sont remplacés par une indemnité compensatoire, généralement moins bien traitée fiscalement.",
        "fields": [
          {
            "label": "Effet",
            "text": "Seule la commission perçue est enregistrée : solde espèces ↑ · quantité et PRU inchangés · le prêt lui-même n'est pas suivi"
          },
          {
            "label": "Exemple",
            "text": "Prêt de 500 titres rémunéré 1,2 % par an pendant 3 mois sur une valeur de 20 000 € → environ 60 € de commission encaissés."
          }
        ],
        "blocks": []
      },
      {
        "code": "FEE",
        "title": "Frais et droits de garde",
        "desc": "Frais prélevés par le teneur de compte indépendamment des ordres : droits de garde, frais de tenue de compte, abonnement.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↓ · position et PRU inchangés"
          },
          {
            "label": "Exemple",
            "text": "Droits de garde annuels de 24 € prélevés sur le CTO."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 6,\n  \"date\": \"2026-07-01\",\n  \"comment\": \"Droits de garde annuels\",\n  \"operations\": [\n    {\n      \"id\": 7,\n      \"sequence\": 1,\n      \"date\": \"2026-07-01\",\n      \"type\": \"FEE\",\n      \"platform\": 3,\n      \"amount\": 24.00,                 // positif, comme tout montant saisi :\n      \"currency\": \"EUR\",               // c est le code FEE qui en fait une sortie\n      \"rate\": 1,\n      \"amountEUR\": 24.00\n    }\n  ]\n}\n\n// Effet : solde du compte 3 diminué de 24,00 EUR.\n// A ne pas confondre avec les frais d une transaction sur titres :\n// ceux-la sont portes par l operation d achat ou de vente et entrent\n// dans le prix de revient. Ces frais-ci ne touchent que la tresorerie."
          }
        ]
      },
      {
        "code": "REFUND",
        "title": "Remboursement",
        "desc": "Restitution par l'établissement d'un montant précédemment prélevé : frais de transfert pris en charge à l'ouverture d'un compte, geste commercial sur des frais de courtage, correction d'un prélèvement indu. C'est un fait économique à part entière, distinct de la charge qu'il compense.",
        "fields": [
          {
            "label": "Effet",
            "text": "Solde espèces ↑ · position et PRU inchangés · la charge remboursée reste inscrite"
          },
          {
            "label": "Exemple",
            "text": "Le broker rembourse 150 € de frais de transfert facturés par l'établissement d'origine."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "{\n  \"id\": 7,\n  \"date\": \"2026-07-15\",\n  \"comment\": \"Frais de transfert PEA pris en charge par le broker\",\n  \"operations\": [\n    {\n      \"id\": 8,\n      \"sequence\": 1,\n      \"date\": \"2026-07-15\",           // date de credit, pas celle du prelevement\n      \"type\": \"REFUND\",\n      \"platform\": 3,\n      \"amount\": 150.00,                // positif : le code REFUND en fait une entree\n      \"currency\": \"EUR\",\n      \"rate\": 1,\n      \"amountEUR\": 150.00\n    }\n  ]\n}\n\n// Effet : solde du compte 3 augmente de 150,00 EUR.\n// Le prelevement d origine reste ecrit tel quel : on ne le corrige pas,\n// on ne le supprime pas. Les deux faits ont eu lieu a deux dates\n// differentes, et le journal doit pouvoir les restituer separement.\n// Un remboursement partiel se saisit pour son seul montant recu ; la\n// charge nette se lit alors par difference, elle ne se stocke pas."
          }
        ]
      }
    ]
  },
  {
    "title": "Découvert autorisé",
    "intro": "Un solde espèces négatif n'est pas une règle de l'application mais une clause du contrat passé avec l'établissement. Elle se déclare compte par compte, sur la fiche du compte, et c'est elle qui décide si un solde négatif est licite ou anormal.",
    "entries": [
      {
        "code": "OVERDRAFT",
        "title": "Solde négatif autorisé",
        "desc": "Propriété du compte, issue de la convention de tenue de compte. Elle ne modifie aucun calcul : elle change seulement la lecture d'un solde négatif. Autorisé, c'est une position réelle ; refusé, c'est une anomalie — le plus souvent une écriture manquante plutôt qu'un vrai découvert.",
        "fields": [
          {
            "label": "Effet",
            "text": "Aucun effet sur les positions, le PRU ni le P/L. Le contrôle porte sur le chemin, pas sur le solde final : un compte revenu à l'équilibre a tout de même été à découvert, et la date où cela s'est produit est ce qui permet de retrouver l'écriture en cause."
          },
          {
            "label": "Exemple",
            "text": "Un CTO avec découvert autorisé peut rester négatif entre l'achat et le versement qui le couvre. Un PEA, non : la réglementation interdit le découvert, tout solde négatif y est une erreur de saisie."
          }
        ],
        "blocks": []
      },
      {
        "code": "LIMIT",
        "title": "Limite de découvert",
        "desc": "Plafond consenti par l'établissement au titulaire, exprimé dans la devise de tenue du compte. Il n'a de sens que si le découvert est lui-même autorisé : plafonner un solde qui ne peut pas devenir négatif ne veut rien dire. La valeur par défaut est zéro — un établissement n'accorde un découvert que s'il l'a chiffré, et autoriser sans dire jusqu'où ne se contrôlerait pas.",
        "fields": [
          {
            "label": "Effet",
            "text": "Un solde plus négatif que la limite remonte en anomalie, avec le montant du dépassement. Une limite laissée à zéro sur un compte autorisé signale donc tout solde négatif, comme si le découvert était refusé — seul le libellé de l'anomalie diffère. Décocher l'autorisation ramène la limite à zéro plutôt que de la conserver en sourdine : une valeur qui ne s'applique plus induirait en erreur à la relecture."
          },
          {
            "label": "Exemple",
            "text": "Limite de 5 000 € et solde à −7 563,34 € : dépassement de 2 563,34 € signalé, à la date où il s'est produit."
          }
        ],
        "blocks": []
      }
    ]
  },
  {
    "title": "Transfert entre comptes titres",
    "intro": "Un transfert déplace des titres d'un compte à l'autre sans les vendre : le prix de revient suit les titres, donc l'opération ne génère jamais de plus-value.",
    "entries": [
      {
        "code": "TOUT",
        "title": "Transfert sortant",
        "desc": "Sortie de titres du compte source. Enregistré au PRU courant — jamais à 0 ni au cours de marché. Reste « en attente » tant que le transfert entrant correspondant n'a pas été saisi.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↓ sur le compte source · PRU inchangé · aucun P/L"
          },
          {
            "label": "Exemple",
            "text": "7 Apple quittent le CTO Bourse Direct au PRU de 224,75 $."
          }
        ],
        "blocks": [
          {
            "kind": "sub",
            "text": "Sortie hors périmètre — une seule opération"
          },
          {
            "kind": "text",
            "text": "Les titres quittent le portefeuille suivi. Le compte d'arrivée n'a pas à être connu : rien ne sera réceptionné de notre côté, la transaction se limite donc à sa jambe sortante."
          },
          {
            "kind": "code",
            "text": "{\n  \"id\": 21,\n  \"date\": \"2026-09-10\",\n  \"comment\": \"Transfert vers un compte non suivi\",\n  \"operations\": [\n    {\n      \"id\": 22,\n      \"sequence\": 1,                   // jambe unique : rien a apparier\n      \"date\": \"2026-09-10\",\n      \"type\": \"TOUT\",\n      \"platform\": 3,                   // compte d ou sortent les titres\n      \"isin\": \"FR0000120073\",\n      \"quantity\": 15,\n      \"price\": 143.18,                 // PRU du compte source : le cout suit les\n      \"fee\": 0,                        // titres, il ne s agit pas d un prix de marche\n      \"tax\": 0\n      // ni `toPlatform` ni seconde jambe : la contrepartie est hors perimetre\n    }\n  ]\n}\n\n// Effet : quantité du compte 3 diminuée de 15, PRU inchangé sur le reste,\n//         aucun P/L réalisé — un transfert n est pas une cession.\n// A comparer avec le cas apparie ci-dessous, ou la contrepartie est un\n// compte suivi et ou le transfert porte deux operations."
          },
          {
            "kind": "sub",
            "text": "Transfert entre deux comptes suivis — deux opérations"
          },
          {
            "kind": "text",
            "text": "Les deux comptes sont suivis. Le transfert reste un fait unique, mais il produit deux effets — un départ et une arrivée — donc deux opérations sous la même transaction, dénouées ici à cinq jours d'intervalle."
          },
          {
            "kind": "code",
            "text": "{\n  \"id\": 16,\n  \"date\": \"2026-07-15\",                // date du fait : celle de la premiere jambe\n  \"comment\": \"Consolidation des comptes\",\n  \"operations\": [\n    {\n      \"id\": 16,\n      \"sequence\": 1,\n      \"date\": \"2026-07-15\",\n      \"type\": \"TOUT\",\n      \"platform\": 1,                   // compte d origine\n      \"isin\": \"US0378331005\",\n      \"quantity\": 40,\n      \"price\": 88.24,                  // PRU du compte d origine\n      \"fee\": 0,\n      \"tax\": 0,\n      \"toPlatform\": 2                  // destinataire annonce : engage la reception\n    },\n    {\n      \"id\": 17,\n      \"sequence\": 2,\n      \"date\": \"2026-07-20\",            // reglement-livraison : cinq jours plus tard\n      \"type\": \"TIN\",\n      \"platform\": 2,                   // compte destinataire\n      \"isin\": \"US0378331005\",\n      \"quantity\": 40,                  // identiques a la jambe sortante :\n      \"price\": 88.24,                  // c est ce qui garantit un P/L nul\n      \"fee\": 0,\n      \"tax\": 0\n    }\n  ]\n}\n\n// Effet : 40 titres passent du compte 1 au compte 2 au meme cout de base.\n// La position globale et le P/L du portefeuille sont strictement inchanges.\n// Supprimer l une des jambes supprime l autre : elles n existent pas\n// separement."
          }
        ]
      },
      {
        "code": "TIN",
        "title": "Transfert entrant",
        "desc": "Réception des titres sur le compte destination. Doit obligatoirement référencer un transfert sortant en attente, dont il reprend la quantité et le coût à l'identique.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ↑ sur le compte destination · coût repris à l'identique · ΔP/L = 0 sur la paire"
          },
          {
            "label": "Exemple",
            "text": "Les 7 Apple arrivent chez Degiro toujours au PRU de 224,75 $ : le P/L réalisé du portefeuille est strictement inchangé."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "// Entrée depuis l extérieur : aucune jambe sortante de notre côté, la saisie\n// fournit donc elle-même le titre, la quantité et le coût de base.\n{\n  \"id\": 23,\n  \"date\": \"2026-09-15\",\n  \"comment\": \"Apport depuis un établissement non suivi\",\n  \"operations\": [\n    {\n      \"id\": 24,\n      \"sequence\": 1,\n      \"date\": \"2026-09-15\",\n      \"type\": \"TIN\",\n      \"platform\": 2,                   // compte qui reçoit les titres\n      \"isin\": \"US0378331005\",\n      \"quantity\": 30,\n      \"price\": 91.50,                  // cout de base declare, qui devient le PRU\n      \"fee\": 0,                        // d entree : sans lui, la position\n      \"tax\": 0                         // entrerait a zero et fausserait tout P/L\n    }\n  ]\n}\n\n// Effet : quantité du compte 2 augmentée de 30, PRU recalculé en moyenne\n//         pondérée avec le coût déclaré, aucun P/L réalisé.\n// Le cout doit etre celui de l etablissement d origine, faute de quoi la\n// plus-value latente serait attribuee a la mauvaise periode."
          }
        ]
      }
    ]
  },
  {
    "title": "Réorganisations de capital",
    "intro": "L'émetteur remanie le titre lui-même. Le coût de revient se déplace : la ligne d'origine cède une part de son PRU à la ligne reçue, et la projection l'applique.",
    "entries": [
      {
        "code": "SPINOFF",
        "title": "Scission",
        "desc": "Une société se sépare d'une activité et en distribue les titres aux actionnaires. En toute rigueur, le prix de revient d'origine doit être réparti entre la ligne mère et la ligne créée.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité inchangée · le PRU baisse de la part cédée · cette part alimente le PRU de la ligne reçue"
          },
          {
            "label": "Exemple",
            "text": "1 action XYZ reçue pour 10 ABC détenues — le détail de la parité se note en commentaire."
          }
        ],
        "blocks": []
      },
      {
        "code": "MERGER",
        "title": "Fusion",
        "desc": "Absorption d'une société par une autre : les titres détenus sont échangés contre ceux de l'absorbante selon une parité définie.",
        "fields": [
          {
            "label": "Effet",
            "text": "Quantité ramenée à zéro · la totalité du coût de revient passe sur la ligne reçue"
          },
          {
            "label": "Exemple",
            "text": "3 actions de l'absorbante reçues pour 5 actions détenues."
          }
        ],
        "blocks": []
      }
    ]
  },
  {
    "title": "Catalogue des actions de société",
    "intro": "Toutes les opérations qu'un émetteur peut décider sur ses propres titres, classées par la nomenclature ISO 15022 — le code CAEV est celui qu'emploient les dépositaires et les avis d'opéré. Trois familles seulement : ce qui s'impose au porteur, ce qui lui laisse un choix, et ce à quoi il doit adhérer pour que ça le concerne. La dernière colonne dit ce que l'application traite aujourd'hui : c'est une lecture du code, pas une déclaration d'intention.",
    "entries": [
      {
        "code": "OBLIGATOIRE",
        "title": "Opération obligatoire",
        "desc": "L'émetteur décide, le porteur subit. Aucune instruction n'est attendue de lui : l'opération s'applique à tous les titres détenus à la date de détachement, qu'il l'ait vue ou non. C'est la famille la plus nombreuse et la seule qu'un système de tenue de position doit impérativement traiter — l'ignorer fausse la position sans qu'aucune saisie ne manque.",
        "fields": [
          {
            "label": "Effet",
            "text": "S'applique de plein droit · aucune instruction · aucune date limite de réponse"
          },
          {
            "label": "Exemple",
            "text": "Une division du nominal par deux double la quantité et divise le prix de revient unitaire par deux, le jour du détachement."
          }
        ],
        "blocks": []
      },
      {
        "code": "AVEC CHOIX",
        "title": "Opération obligatoire avec options",
        "desc": "L'opération aura lieu quoi qu'il arrive, mais le porteur choisit sous quelle forme il la reçoit. Une option par défaut s'applique s'il ne répond pas avant la date limite — c'est presque toujours l'espèces, la forme qui n'exige aucune décision ultérieure.",
        "fields": [
          {
            "label": "Effet",
            "text": "S'applique de plein droit · la forme dépend de l'instruction · une option par défaut couvre le silence"
          },
          {
            "label": "Lecture",
            "text": "C'est la seule famille où l'absence de réponse est elle-même une réponse. Un journal qui n'enregistre que les instructions données perd donc les cas les plus fréquents."
          }
        ],
        "blocks": []
      },
      {
        "code": "VOLONTAIRE",
        "title": "Opération volontaire",
        "desc": "Rien ne se passe sans instruction du porteur. S'il ne fait rien, sa position reste inchangée — sauf pour les droits, qui expirent sans valeur à la clôture de la période de souscription.",
        "fields": [
          {
            "label": "Effet",
            "text": "Sans instruction, aucun effet · le droit non exercé se perd"
          },
          {
            "label": "Lecture",
            "text": "L'exception des droits est le piège classique : ne rien faire y a un coût, contrairement au reste de la famille."
          }
        ],
        "blocks": []
      },
      {
        "code": "COUVERTURE",
        "title": "Ce que l'application traite",
        "desc": "Six codes sur les vingt-trois du catalogue. La sélection n'est pas arbitraire : ce sont ceux qui déplacent une quantité ou un prix de revient — le reste ne touche que la trésorerie, le référentiel, ou rien du tout.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un changement de dénomination ou de code ISIN ne touche ni la quantité ni le prix de revient, mais il casse le rapprochement avec le référentiel des titres. C'est le manque le plus gênant de la liste de droite."
          }
        ],
        "blocks": [
          {
            "kind": "table",
            "head": [
              "ce qui est traité",
              "ce qui ne l'est pas encore"
            ],
            "body": [
              [
                "dividende en numéraire, dividende optionnel",
                "réinvestissement automatique, intérêts, remboursement"
              ],
              [
                "division, regroupement",
                "attribution gratuite, rompus"
              ],
              [
                "scission, fusion",
                "offre d'échange, conversion, assimilation"
              ],
              [
                "souscription par exercice de droits",
                "distribution de droits en ligne distincte"
              ],
              [
                "—",
                "offre publique d'achat, rachat par l'émetteur, liquidation"
              ],
              [
                "—",
                "changement de dénomination ou de code, consultation des porteurs"
              ]
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Indicateurs de valorisation",
    "intro": "Ratios qui rapportent le cours de bourse aux fondamentaux de l'entreprise. Ils servent à comparer des sociétés d'un même secteur — jamais d'un secteur à l'autre, où les normes diffèrent radicalement.",
    "entries": [
      {
        "code": "CAPI",
        "title": "Capitalisation boursière",
        "desc": "Valeur totale attribuée par le marché aux capitaux propres de la société. Elle définit la taille de la valeur (grande, moyenne ou petite capitalisation).",
        "fields": [
          {
            "label": "Lecture",
            "text": "C'est le prix théorique de rachat de la totalité de la société, hors prime de contrôle et hors dette."
          },
          {
            "label": "Exemple",
            "text": "250 millions d'actions à 180 € → 45 milliards d'euros de capitalisation."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Capitalisation = cours × nombre d'actions en circulation"
          }
        ]
      },
      {
        "code": "BPA",
        "title": "Bénéfice par action (BPA / EPS)",
        "desc": "Part du résultat net revenant à chaque action. C'est la brique de base de la plupart des ratios de valorisation.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un BPA en croissance régulière est le principal moteur de long terme d'un cours de bourse."
          },
          {
            "label": "Exemple",
            "text": "900 M€ de résultat net et 250 M d'actions → BPA de 3,60 €."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "BPA = résultat net ÷ nombre d'actions"
          }
        ]
      },
      {
        "code": "PER",
        "title": "Price Earning Ratio (PER)",
        "desc": "Nombre d'années de bénéfice actuel qu'il faudrait pour rembourser le prix payé. Le ratio de valorisation le plus utilisé.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un PER élevé traduit soit une forte croissance attendue, soit une valeur chère. Un PER faible signale une décote… ou une entreprise en difficulté. Le comparer aux concurrents et à son historique."
          },
          {
            "label": "Exemple",
            "text": "Cours de 180 € et BPA de 3,60 € → PER de 50, très élevé pour une valeur mature."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "PER = cours ÷ BPA"
          }
        ]
      },
      {
        "code": "YIELD",
        "title": "Rendement du dividende",
        "desc": "Revenu annuel distribué rapporté au prix payé. C'est le rendement « courant » de l'action, avant toute plus-value.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un rendement anormalement élevé est un signal d'alerte : il résulte souvent d'une chute du cours qui anticipe une baisse du dividende."
          },
          {
            "label": "Exemple",
            "text": "Dividende de 3,20 € pour un cours de 80 € → 4 % de rendement."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Rendement = dividende annuel par action ÷ cours"
          }
        ]
      },
      {
        "code": "PAYOUT",
        "title": "Taux de distribution (payout)",
        "desc": "Part du bénéfice reversée aux actionnaires plutôt que réinvestie dans l'entreprise.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Au-delà de 100 %, la société distribue plus qu'elle ne gagne : la situation n'est pas tenable durablement. Un payout faible laisse de la marge pour investir ou augmenter le dividende."
          },
          {
            "label": "Exemple",
            "text": "Dividende de 2,40 € et BPA de 3,60 € → 67 % de taux de distribution."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Payout = dividende par action ÷ BPA"
          }
        ]
      },
      {
        "code": "PBR",
        "title": "Price to Book (PBR)",
        "desc": "Rapport entre le prix payé et la valeur comptable des capitaux propres.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un PBR inférieur à 1 signifie que le marché valorise l'entreprise moins que ses fonds propres comptables. Pertinent surtout pour les banques et les foncières, peu pour les sociétés riches en actifs immatériels."
          },
          {
            "label": "Exemple",
            "text": "Cours de 45 € pour un actif net par action de 60 € → PBR de 0,75."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "PBR = cours ÷ actif net comptable par action"
          }
        ]
      },
      {
        "code": "EVEBITDA",
        "title": "VE / EBITDA",
        "desc": "Valeur d'entreprise rapportée à l'excédent brut d'exploitation. Contrairement au PER, ce ratio intègre la dette et neutralise les politiques d'amortissement et de financement.",
        "fields": [
          {
            "label": "Lecture",
            "text": "C'est le ratio de référence pour comparer des sociétés au niveau d'endettement très différent, et celui qu'utilisent les acquéreurs industriels."
          },
          {
            "label": "Exemple",
            "text": "45 Md€ de capitalisation, 5 Md€ de dette nette, 8 Md€ d'EBITDA → VE/EBITDA de 6,25."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "VE = capitalisation + dette nette Ratio = VE ÷ EBITDA"
          }
        ]
      }
    ]
  },
  {
    "title": "Indicateurs de risque et de performance",
    "intro": "Mesures de la régularité d'un portefeuille et de la rémunération du risque pris. Elles se calculent sur une série de rendements, généralement quotidiens.",
    "entries": [
      {
        "code": "VOL",
        "title": "Volatilité",
        "desc": "Ampleur des variations d'un actif autour de sa tendance, mesurée par l'écart-type de ses rendements. C'est la définition statistique usuelle du risque.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Une volatilité annualisée de 20 % signifie qu'environ deux années sur trois, la performance restera dans une bande de ± 20 % autour de la moyenne. Elle mesure l'irrégularité, pas la probabilité de perte définitive."
          },
          {
            "label": "Exemple",
            "text": "Un écart-type quotidien de 1,25 % → 1,25 × √252 ≈ 19,8 % de volatilité annualisée."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "σ = écart-type des rendements périodiques σ annualisée = σ quotidienne × √252"
          }
        ]
      },
      {
        "code": "BETA",
        "title": "Bêta",
        "desc": "Sensibilité d'un actif aux mouvements de son marché de référence.",
        "fields": [
          {
            "label": "Lecture",
            "text": "β = 1 : l'actif suit l'indice. β > 1 : il amplifie les mouvements, à la hausse comme à la baisse. β < 1 : il amortit. Un β négatif traduit une évolution inverse du marché, rare et recherchée pour diversifier."
          },
          {
            "label": "Exemple",
            "text": "Un bêta de 1,3 implique une baisse attendue d'environ 13 % quand l'indice cède 10 %."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "β = covariance(actif, marché) ÷ variance(marché)"
          }
        ]
      },
      {
        "code": "SHARPE",
        "title": "Ratio de Sharpe",
        "desc": "Rendement obtenu au-delà du taux sans risque, rapporté à la volatilité subie. Il répond à la question : ce rendement valait-il le risque ?",
        "fields": [
          {
            "label": "Lecture",
            "text": "En dessous de 1, la rémunération du risque est faible ; au-delà de 1, elle est correcte ; au-delà de 2, excellente. Comparer deux portefeuilles par leur seule performance sans regarder le Sharpe est trompeur."
          },
          {
            "label": "Exemple",
            "text": "9 % de performance, 3 % de taux sans risque, 12 % de volatilité → (9 − 3) ÷ 12 = 0,5."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Sharpe = (rendement du portefeuille − taux sans risque) ÷ volatilité"
          }
        ]
      },
      {
        "code": "MDD",
        "title": "Perte maximale (max drawdown)",
        "desc": "Pire recul enregistré entre un sommet et le creux qui l'a suivi. C'est la mesure la plus concrète de la douleur endurée.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un recul de 50 % exige ensuite une hausse de 100 % pour revenir à l'équilibre : les pertes profondes sont asymétriques. Bon test de la stratégie réellement supportable."
          },
          {
            "label": "Exemple",
            "text": "Un portefeuille passé de 100 000 € à 62 000 € avant de remonter a subi un drawdown de −38 %."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Drawdown max = (plus bas suivant − plus haut atteint) ÷ plus haut atteint"
          }
        ]
      },
      {
        "code": "TWR",
        "title": "Rendement pondéré par le temps (TWR)",
        "desc": "Performance de la stratégie, neutralisée des versements et retraits. C'est la mesure utilisée pour comparer un portefeuille à un indice ou à un fonds.",
        "fields": [
          {
            "label": "Effet",
            "text": "C'est cette mesure que trace la série « Holdings Growth » du graphique des Positions. Les flux y sont valorisés au cours de clôture du jour, jamais au prix de la transaction : valorisés au prix de revient d'un transfert, ils faisaient apparaître un gain de 6,19 % qui n'avait pas eu lieu et une variation quotidienne de 23,75 %. Une tranche dont la veille vaut zéro est neutralisée plutôt que divisée, et un rendement de tranche supérieur à 90 % en valeur absolue est écarté : il trahit un flux mal daté, non une performance."
          },
          {
            "label": "Lecture",
            "text": "Le TWR ne dépend pas du moment où vous versez de l'argent : il juge les décisions d'investissement, pas le calendrier des apports."
          },
          {
            "label": "Exemple",
            "text": "Deux semestres à +10 % puis −5 % → (1,10 × 0,95) − 1 = +4,5 %."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "TWR = [(1 + r₁) × (1 + r₂) × … × (1 + rₙ)] − 1 où rᵢ est le rendement de chaque sous-période entre deux mouvements d'espèces"
          }
        ]
      },
      {
        "code": "MWR",
        "title": "Rendement pondéré par les flux (TRI / MWR)",
        "desc": "Taux de rentabilité réellement obtenu sur les capitaux engagés, en tenant compte des dates et des montants des versements. C'est le taux qui annule la valeur actuelle nette des flux.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Le MWR répond à « combien ai-je gagné ? », le TWR à « la stratégie était-elle bonne ? ». Les deux divergent dès que l'on renforce ou allège fortement : verser juste avant une hausse améliore le MWR sans rien changer au TWR."
          },
          {
            "label": "Exemple",
            "text": "Un gros versement effectué juste avant une forte baisse dégrade nettement le MWR alors que le TWR reste inchangé."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Trouver r tel que : Σ [ flux à la date t ÷ (1 + r)^t ] = 0"
          }
        ]
      }
    ]
  },
  {
    "title": "Fonctionnement des marchés",
    "intro": "Mécanismes d'exécution des ordres et construction des indices : le contexte dans lequel les prix se forment.",
    "entries": [
      {
        "code": "BOOK",
        "title": "Carnet d'ordres et spread",
        "desc": "Le carnet recense en permanence les intentions d'achat et de vente. La meilleure offre d'achat et la meilleure offre de vente encadrent le prix ; leur écart est le spread.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un spread étroit signale une valeur liquide où l'on entre et sort à faible coût. Un spread large est un coût de transaction caché, souvent sous-estimé sur les petites valeurs."
          },
          {
            "label": "Exemple",
            "text": "Achat proposé à 19,98 €, vente à 20,02 € → 4 centimes de spread, soit 0,2 % du cours."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Spread = meilleure offre de vente − meilleure offre d'achat Spread relatif = spread ÷ cours moyen"
          }
        ]
      },
      {
        "code": "ORDER",
        "title": "Types d'ordres",
        "desc": "L'ordre au marché s'exécute immédiatement au meilleur prix disponible, sans garantie de prix. L'ordre à cours limité fixe un prix maximum à l'achat ou minimum à la vente, sans garantie d'exécution. L'ordre à seuil de déclenchement ne s'active qu'une fois un cours franchi.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Sur une valeur peu liquide, un ordre au marché peut être exécuté très loin du dernier cours affiché : l'ordre à cours limité est la protection de base."
          },
          {
            "label": "Exemple",
            "text": "Ordre limité d'achat à 19,50 € : il n'est exécuté que si le cours redescend à ce niveau ou en dessous."
          }
        ],
        "blocks": []
      },
      {
        "code": "INDEX",
        "title": "Indice boursier",
        "desc": "Panier de valeurs représentatif d'un marché, servant de référence de performance. La plupart des grands indices sont pondérés par la capitalisation flottante.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un indice « nu » (CAC 40) exclut les dividendes ; sa version « dividendes réinvestis » (CAC 40 GR) est la seule comparaison honnête pour un portefeuille qui les encaisse."
          },
          {
            "label": "Exemple",
            "text": "Sur longue période, l'écart entre un indice nu et sa version dividendes réinvestis atteint plusieurs points par an."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Poids d'une valeur = capitalisation flottante ÷ somme des capitalisations flottantes de l'indice"
          }
        ]
      },
      {
        "code": "FLOAT",
        "title": "Flottant et liquidité",
        "desc": "Le flottant est la part du capital réellement disponible à la négociation, hors participations de contrôle, familiales ou étatiques. Il conditionne la liquidité du titre.",
        "fields": [
          {
            "label": "Lecture",
            "text": "Un flottant réduit amplifie la volatilité et élargit le spread : les mêmes volumes déplacent bien davantage le cours."
          },
          {
            "label": "Exemple",
            "text": "Une société détenue à 70 % par son fondateur n'offre que 30 % de son capital au marché."
          }
        ],
        "blocks": [
          {
            "kind": "code",
            "text": "Flottant = capitalisation × part du capital librement négociable"
          }
        ]
      }
    ]
  },
  {
    "title": "Place de marché",
    "intro": "Le lieu de cotation d'un titre conditionne sa devise, son calendrier de négociation et la fiscalité appliquée à ses revenus. Chaque titre porte donc une place et son code MIC (norme ISO 10383).",
    "entries": [
      {
        "code": "MIC",
        "title": "Code place (MIC)",
        "desc": "Identifiant international à 4 caractères désignant une place de négociation. Il lève l'ambiguïté d'un même titre coté sur plusieurs places, où les cours et les devises diffèrent.",
        "fields": [
          {
            "label": "Effet",
            "text": "Détermine la devise de cotation et le calendrier de bourse"
          },
          {
            "label": "Exemple",
            "text": "XPAR = Euronext Paris · XAMS = Euronext Amsterdam · XETR = Deutsche Börse Xetra · XLON = London Stock Exchange · XNYS = NYSE · XNAS = Nasdaq."
          }
        ],
        "blocks": []
      },
      {
        "code": "DUAL",
        "title": "Cotation multiple",
        "desc": "Un même émetteur peut être coté sur plusieurs places, dans des devises différentes. Les lignes doivent alors être suivies séparément, car le cours de référence et le change ne sont pas les mêmes.",
        "fields": [
          {
            "label": "Effet",
            "text": "Une ligne par couple ISIN + place · conversion en EUR au taux courant"
          },
          {
            "label": "Exemple",
            "text": "Une action américaine achetée à Paris en EUR ne se valorise pas comme la même action achetée au Nasdaq en USD."
          }
        ],
        "blocks": []
      }
    ]
  },
  {
    "title": "Fiscalité des dividendes",
    "intro": "",
    "entries": [
      {
        "code": "TAX",
        "title": "Fiscalité des dividendes",
        "desc": "Retenue à la source prélevée par le pays de l'émetteur, puis taux réduit généralement applicable grâce à la convention fiscale bilatérale, selon que l'investisseur est résident fiscal français ou luxembourgeois. La différence entre la retenue appliquée et le taux conventionnel est en principe récupérable via un crédit d'impôt ou une demande de remboursement. Le plafond de 15 % sur les dividendes de portefeuille est le standard du modèle OCDE, repris par la quasi-totalité des conventions — mais c'est un plafond, pas un taux : lorsque le droit interne du pays de source prélève moins, c'est le taux le plus bas qui s'applique. Ainsi un résident luxembourgeois percevant un dividende français supporte 12,8 %, taux du droit interne français sur les dividendes versés aux personnes physiques non résidentes, et non les 15 % que la convention franco-luxembourgeoise autoriserait.",
        "fields": [
          {
            "label": "Note",
            "text": "Ordres de grandeur indicatifs à vocation pédagogique, pas un conseil fiscal : les taux évoluent et dépendent de votre situation et des formulaires déposés (W-8BEN, formulaire 5000, etc.). Vérifiez auprès de votre teneur de compte ou d'un conseil."
          }
        ],
        "blocks": [
          {
            "kind": "table",
            "head": [
              "Pays de l'émetteur",
              "Retenue à la source",
              "Taux conventionnel — résident FR",
              "Taux conventionnel — résident LU"
            ],
            "body": [
              [
                "France",
                "30 % (PFU : 12,8 % IR + 17,2 % prélèvements sociaux)",
                "— (résidence)",
                "12,8 %"
              ],
              [
                "Allemagne",
                "26,375 %",
                "15 %",
                "15 %"
              ],
              [
                "Autriche",
                "27,5 %",
                "15 %",
                "15 %"
              ],
              [
                "Belgique",
                "30 %",
                "15 %",
                "15 %"
              ],
              [
                "Danemark",
                "27 %",
                "15 %",
                "15 %"
              ],
              [
                "Espagne",
                "19 %",
                "15 %",
                "15 %"
              ],
              [
                "Finlande",
                "35 %",
                "15 %",
                "15 %"
              ],
              [
                "Irlande",
                "25 %",
                "15 %",
                "15 %"
              ],
              [
                "Italie",
                "26 %",
                "15 %",
                "15 %"
              ],
              [
                "Luxembourg",
                "15 %",
                "15 %",
                "— (résidence)"
              ],
              [
                "Norvège",
                "25 %",
                "15 %",
                "15 %"
              ],
              [
                "Pays-Bas",
                "15 %",
                "15 %",
                "15 %"
              ],
              [
                "Portugal",
                "28 %",
                "15 %",
                "15 %"
              ],
              [
                "Royaume-Uni",
                "0 %",
                "0 %",
                "0 %"
              ],
              [
                "Suède",
                "30 %",
                "15 %",
                "15 %"
              ],
              [
                "Suisse",
                "35 %",
                "15 %",
                "15 %"
              ],
              [
                "États-Unis",
                "30 %",
                "15 % (formulaire W-8BEN)",
                "15 % (formulaire W-8BEN)"
              ]
            ]
          }
        ]
      }
    ]
  }
];
