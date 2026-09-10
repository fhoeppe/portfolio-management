export interface GuideSection {
  readonly heading: string;
  readonly body: string;
  readonly steps?: readonly string[];
}

export interface GuideFaqEntry {
  readonly q: string;
  readonly a: string;
}

export interface GuideTopic {
  readonly key: string;
  readonly label: string;
  readonly title: string;
  readonly intro: string;
  readonly keys: readonly string[];
  readonly links: readonly string[];
  readonly sections: readonly GuideSection[];
  readonly faq: readonly GuideFaqEntry[];
}

const ACCOUNTING_TOPIC: GuideTopic = {
  key: 'accounting',
  label: 'Comptabilité',
  title: 'Traduction comptable des opérations titres',
  intro:
    "Ce que les normes imposent — IFRS 9 pour la comptabilisation, IAS 21 pour la devise, IAS 12 pour la retenue à la source — et les écritures correspondantes, confrontées à ce que fait le projecteur de l'application.",
  keys: [
    "Le classement IFRS 9 commande l'évaluation : toute action est en juste valeur par résultat par défaut.",
    "Un transfert entre comptes suivis n'est pas une cession : aucun résultat, le coût de base traverse intact.",
    'Le suspens de règlement vit entre négociation et règlement, aux comptes PCG 464 et 465.',
    'Un dividende est acquis au détachement, encaissé à la mise en paiement.',
  ],
  links: ['Transactions', 'Comptabilité', 'Réconciliation', 'Annexes et légendes'],
  sections: [
    {
      heading: 'IFRS 9 — le classement commande tout',
      body:
        "Le classement découle de deux tests posés dans l'ordre : le modèle de gestion, puis la nature des flux. Faute de passer le test des flux, une action est en juste valeur par résultat, sauf option irrévocable pour les capitaux propres, ouverte instrument par instrument à la seule entrée.",
      steps: [
        'Coût amorti : détenu pour encaisser des flux limités au principal et aux intérêts.',
        'Juste valeur par capitaux propres : détenu pour encaisser et céder — résultat de cession jamais recyclé.',
        'Juste valeur par résultat : catégorie par défaut, variation portée au résultat à chaque arrêté.',
      ],
    },
    {
      heading: 'Les deux doctrines de comptabilisation',
      body:
        "IFRS 9 §3.1.2 laisse le choix du moment d'entrée au bilan, mais impose la constance par catégorie. En date de négociation, l'actif et sa contrepartie entrent le jour de la transaction ; en date de règlement, rien n'entre avant le dénouement, mais la variation de juste valeur doit être reconnue sur l'intervalle. Le modèle de l'application est hybride : position à la négociation, espèces au règlement — d'où l'obligation de tenir un suspens.",
    },
    {
      heading: 'Le suspens de règlement',
      body:
        "Ce sont des comptes de bilan : le patrimoine total ne bouge pas entre la négociation et le règlement. Le suspens ne se stocke pas, il se déduit du couple de dates de l'opération — une opération est en suspens à une date d'arrêté si elle est négociée et pas encore réglée.",
      steps: [
        'PCG 464 — dettes sur acquisitions de valeurs mobilières : achat négocié, non réglé.',
        'PCG 465 — créances sur cessions : vente négociée, non réglée.',
        'Solde projeté = solde réglé + à recevoir − à régler (512 + 465 − 464).',
      ],
    },
    {
      heading: 'Le dividende',
      body:
        "Le produit est comptabilisé lorsque le droit de percevoir est établi, donc au détachement et non à la mise en paiement (IFRS 9 §5.7.1A). La retenue à la source est un impôt sur le résultat au sens d'IAS 12, non une réduction du produit : sur 100 titres à 2,20 €, le résultat est de 220,00 € au détachement, l'encaissement net de 154,00 € six jours plus tard. Pour un dividende optionnel, le choix du porteur ne porte que sur l'extinction de la créance ; la fraction non convertible est réglée en soulte.",
    },
    {
      heading: "Frais de transaction et coût d'entrée",
      body:
        "Les frais suivent le classement de l'actif, pas la nature de l'opération : en charges immédiates en juste valeur par résultat, incorporés au coût d'entrée dans les deux autres catégories. Le PCG laisse une option globale et permanente, à mentionner en annexe. Deux PRU différents pour un même achat, selon la doctrine retenue.",
    },
    {
      heading: 'Opérations en devise',
      body:
        "IAS 21 sépare le monétaire du non monétaire. Une dette de règlement se réévalue au cours de clôture, écart de change au résultat ; une ligne de titres à la juste valeur suit le cours du jour de cette juste valeur. Un achat de 2 200 USD négocié à 1,0850 et réglé à 1,0820 laisse la ligne à 2 027,65 € et porte 5,62 € de perte de change.",
    },
    {
      heading: 'Le délai réglementaire',
      body:
        "Le règlement (UE) 909/2014 fixe le règlement au deuxième jour ouvré et assortit les défauts de pénalités quotidiennes. Le délai se déduit du code MIC de la place, en jours ouvrés de cette place.",
      steps: [
        'États-Unis et Canada (XNAS, XNYS, XTSE) : T+1 depuis le 27 mai 2024.',
        'Zone euro, Royaume-Uni, Suisse : T+2, passage à T+1 le 11 octobre 2027.',
      ],
    },
  ],
  faq: [
    {
      q: 'Un transfert de titres entre deux de mes comptes crée-t-il un résultat ?',
      a:
        "Non. IFRS 9 §3.2.3 ne décomptabilise un actif que si les droits s'éteignent ou passent à un tiers : le détenteur ne change pas, seul le teneur de compte change. Les deux jambes portent la même quantité et le même prix — un coût de base, jamais un cours. Un prix au marché produirait un résultat interdit et fausserait le PRU du compte destinataire.",
    },
    {
      q: 'Pourquoi le patrimoine total semble-t-il surévalué entre deux dates ?',
      a:
        "Parce que la position bouge à la date de négociation et les espèces à la date de règlement, sans jambe de contrepartie. Le suspens comble cet écart : sur un achat de 752,00 €, le total ne varie que de −2,00 € — les frais, seule richesse consommée.",
    },
    {
      q: "Les pertes attendues s'appliquent-elles à mes actions ?",
      a:
        "Non : le modèle de dépréciation d'IFRS 9 ne vise que les instruments de dette au coût amorti ou en juste valeur par capitaux propres. Une baisse de cours est déjà constatée par la réévaluation à la juste valeur — la déprécier serait compter la perte deux fois.",
    },
    {
      q: "Puis-je changer la catégorie IFRS 9 d'un titre ?",
      a:
        "Presque jamais. Un reclassement suppose un changement de modèle de gestion, décidé au niveau d'un portefeuille entier et appliqué de façon prospective. L'option capitaux propres sur actions n'est, elle, jamais reclassable.",
    },
  ],
};

const SIMULATION_TOPIC: GuideTopic = {
  key: 'simulation',
  label: 'Gestion du risque',
  title: 'Modèles de choc et stress tests',
  intro:
    "Treize scénarios applicables à un compte précis ou à l'ensemble du portefeuille. Chaque modèle combine un choc de valorisation, un multiplicateur par classe d'actifs et une trajectoire de dividendes.",
  keys: [
    'Le périmètre se choisit avant le modèle : un compte, ou tous les comptes agrégés.',
    "Le choc s'applique par classe d'actifs, pas uniformément : chaque modèle porte ses multiplicateurs.",
    'Les dividendes font partie de la simulation : chaque scénario projette son effet sur les revenus.',
    'Le choc personnalisé permet de saisir librement une variation par classe.',
  ],
  links: ['Gestion du risque', 'Positions', 'Tableau de bord'],
  sections: [
    {
      heading: 'Chocs de marché',
      body: 'Scénarios de baisse brutale des valorisations, calibrés sur des épisodes réels.',
      steps: [
        'Krach actions — -20 % mondial et immédiat. Sur 486 M€ dont 55 % en actions : perte simulée de 62 M€, les actions absorbent 1,15 fois le choc.',
        'Rejeu historique — reproduit le 1er trimestre 2020, soit -24 %. Applique la trajectoire réelle jour par jour au portefeuille actuel.',
        "Choc géopolitique — énergie +40 %, émergents -25 %. Pénalise les poches émergentes et les chaînes d'approvisionnement.",
      ],
    },
    {
      heading: "Chocs de taux et d'inflation",
      body: "Effets d'une remontée des taux ou d'une inflation durable sur les actifs de duration.",
      steps: [
        'Choc de taux — +150 points de base. Les obligations absorbent 1,3 fois le choc ; une duration de 5,4 ans se traduit par environ -8 %.',
        "Choc inflationniste — inflation à 6 %, taux réels négatifs. Les coupons fixes s'érodent (multiplicateur 1,4), les actifs réels résistent (0,5).",
      ],
    },
    {
      heading: 'Chocs de structure',
      body: 'Scénarios qui testent la construction du portefeuille plutôt que le niveau des marchés.',
      steps: [
        'Rotation sectorielle — technologie -15 %, défensives +5 %, par secteur GICS. Sanctionne la concentration sur la croissance.',
        "Rupture de corrélation — actions et obligations baissent ensemble, comme en 2022 : la diversification cesse de protéger, aucune classe n'est épargnée.",
        "Défaut d'un émetteur — perte totale sur la première ligne détenue. Mesure la concentration : sur une ligne à 19,8 % du portefeuille, l'impact dépasse 19 %.",
        "Crise de liquidité — écartement des spreads et décote sur l'illiquide (multiplicateur 1,6 sur les alternatifs), faute d'acheteurs.",
      ],
    },
    {
      heading: 'Chocs de change',
      body: "Effet d'une variation de parité sur les positions non couvertes.",
      steps: [
        "Choc de change — EUR/USD +10 %. Seules les lignes libellées en devise étrangère sont touchées ; l'impact reste limité (-3 %) si la couverture est en place.",
      ],
    },
    {
      heading: 'Trajectoires de dividendes',
      body:
        'Deux scénarios portent d\'abord sur les revenus, avant tout effet sur les cours. Le rendement de référence retenu est de 2,8 %.',
      steps: [
        'Croissance des dividendes — +5 % par an, aucun choc de valorisation. Sur 486 M€, le revenu passe de 13,6 M€ à 14,3 M€.',
        'Coupe des dividendes — -40 % sur les montants annoncés, avec un léger effet cours (-4 %). Le revenu tombe à 8,2 M€.',
      ],
    },
    {
      heading: 'Choc personnalisé',
      body:
        "Quatre champs libres — actions, obligations, alternatifs, trésorerie — exprimés en pourcentage. Le moteur applique la variation saisie sans multiplicateur, ce qui permet de reproduire un scénario réglementaire ou une hypothèse maison.",
    },
  ],
  faq: [
    {
      q: 'Pourquoi la trésorerie ne baisse-t-elle presque jamais ?',
      a: "Son multiplicateur est nul dans la plupart des scénarios : un krach ou un défaut d'émetteur ne touche pas les espèces. Seuls l'inflation (0,6) et le change (0,2) l'affectent.",
    },
    {
      q: 'Les résultats servent-ils à un reporting réglementaire ?',
      a: "Non. Les hypothèses sont simplifiées et à usage de sensibilisation : elles ne remplacent pas un modèle de risque validé, ni un calcul de VaR réglementaire.",
    },
    {
      q: 'Puis-je stresser un seul compte ?',
      a: "Oui : le sélecteur de périmètre en haut de page limite la simulation à un compte, avec sa quote-part de valorisation, ou l'applique à tous les comptes agrégés.",
    },
  ],
};

export const GUIDE_TOPICS: readonly GuideTopic[] = [
  {
    key: 'start',
    label: 'Prise en main',
    title: 'Prise en main de la plateforme',
    intro:
      "Ce guide décrit l'organisation de l'application, la navigation entre les modules et les réglages personnels à effectuer lors de la première connexion.",
    keys: [
      'Le menu latéral regroupe les modules par section : Gestion, Marché, Administration.',
      "Le fil d'Ariane rappelle toujours la section et la page actives.",
      "La page d'accueil par défaut se choisit dans Paramètres.",
      'La langue de l\'interface se change depuis le menu du compte.',
    ],
    links: ['Accueil', "Paramètres de l'utilisateur", 'Tableau de bord'],
    sections: [
      {
        heading: "Structure de l'écran",
        body:
          "Le bandeau supérieur porte la recherche globale, l'aide, ce guide, les notifications et le menu du compte. Le menu latéral se replie pour libérer de la largeur ; les libellés laissent alors place aux pictogrammes.",
      },
      {
        heading: 'Premiers réglages',
        body: 'Trois réglages conditionnent le confort quotidien.',
        steps: [
          "Choisir la densité d'affichage (compacte pour les tableaux longs).",
          "Définir la page d'accueil selon votre rôle.",
          'Activer les notifications par e-mail pour les alertes de limites.',
        ],
      },
      {
        heading: 'Recherche globale',
        body:
          "La recherche interroge simultanément les comptes, les positions, les documents et les pièces comptables. Un préfixe restreint le périmètre : ord: pour les ordres, doc: pour les documents, cpt: pour les comptes.",
      },
    ],
    faq: [
      {
        q: 'Comment revenir rapidement au tableau de bord ?',
        a: "Le fil d'Ariane et l'item Accueil du menu ramènent en un clic ; le raccourci clavier est disponible depuis n'importe quelle page.",
      },
      {
        q: 'Puis-je travailler en anglais ?',
        a: "Oui, le sélecteur FR / EN du menu du compte bascule l'ensemble de l'interface, y compris les libellés des tableaux.",
      },
    ],
  },
  {
    key: 'portfolio',
    label: 'Portefeuilles',
    title: 'Suivi des portefeuilles et des positions',
    intro:
      "Le module Positions présente l'inventaire valorisé, les poids par classe d'actifs et les écarts par rapport aux cibles du compte.",
    keys: [
      'La valorisation est rafraîchie à chaque cours de clôture.',
      'Les bandes de tolérance sont définies par compte, généralement 2 points.',
      'La vue de rééquilibrage calcule les ordres nécessaires par sleeve.',
      "Le poids d'une ligne se lit toujours par rapport à l'actif total.",
    ],
    links: ['Positions', 'Comptes', 'Cours marché'],
    sections: [
      {
        heading: "Lecture de l'inventaire",
        body:
          "Chaque ligne indique la quantité, le cours retenu, la contre-valeur et le poids. Les lignes illiquides portent une mention explicite : leur valorisation provient de la dernière valeur liquidative communiquée.",
      },
      {
        heading: "Écarts d'allocation",
        body:
          "Un écart supérieur à la bande de tolérance déclenche une alerte sur la page d'accueil et dans le rapport de contrôle des limites. L'écart se lit en points de pourcentage, non en pourcentage relatif.",
      },
      {
        heading: 'Rééquilibrage',
        body: 'Le calcul répartit le montant à corriger au prorata des lignes du sleeve.',
        steps: [
          'Activer la vue de rééquilibrage sur la page Positions.',
          'Vérifier les montants proposés par ligne.',
          'Générer les ordres, qui arrivent en état Brouillon dans le registre.',
        ],
      },
    ],
    faq: [
      {
        q: 'Pourquoi un écart persiste-t-il après un rééquilibrage ?',
        a: "Les ordres ne sont pris en compte qu'une fois exécutés : entre la transmission et l'exécution, la position reste inchangée.",
      },
      {
        q: 'Comment sont traitées les lignes en devises ?',
        a: 'Le poids est calculé sur la contre-valeur dans la devise de référence du compte, au cours de change de la valorisation.',
      },
    ],
  },
  {
    key: 'orders',
    label: 'Ordres et transactions',
    title: 'Cycle de vie des ordres et des transactions',
    intro:
      "Le registre des transactions est un journal d'événements en ajout seul : l'état d'un ordre est toujours reconstruit par rejeu de ses événements.",
    keys: [
      "Aucun événement n'est modifié ni supprimé ; une erreur se corrige par un rectificatif.",
      "Le rejeu permet de retrouver l'état exact à n'importe quelle étape.",
      'Cinq familles sont gérées : ordre, transfert, dividende, division, fusion.',
      'La comptabilisation clôt le cycle et verrouille l\'écriture.',
    ],
    links: ['Transactions', 'Opérations titres', 'Réconciliation'],
    sections: [
      {
        heading: "Séquence type d'un ordre",
        body: 'La séquence normale enchaîne six événements.',
        steps: [
          'OrdreCréé — quantité et limite saisies.',
          'OrdreValidé — contrôle des limites et double validation.',
          "OrdreTransmis — envoi à la place d'exécution.",
          'ExécutionPartielle ou ExécutionComplète — quantités et prix reçus du marché.',
          'ConfirmationDépositaire — dénouement confirmé.',
          'Comptabilisé — écriture générée dans le journal.',
        ],
      },
      {
        heading: 'Corrections',
        body:
          "Un OrdreRectifié consigne la nouvelle valeur sans effacer l'ancienne ; la projection applique la dernière valeur connue et le compteur de rectificatifs augmente. C'est cette trace qui rend le registre auditable.",
      },
      {
        heading: 'Règles du registre — une transaction = un fait économique',
        body:
          "Une transaction est un fait de gestion daté ; une opération est l'un de ses effets sur une ligne (compte, titre).",
        steps: [
          'Une transaction porte au moins une opération, souvent plusieurs — un transfert en compte deux, une scission aussi.',
          "Le nombre d'opérations découle du fait, il ne se choisit pas : on ne regroupe jamais plusieurs faits distincts dans une même transaction pour la commodité de la saisie.",
          "Les opérations d'une transaction se créent, se modifient et se suppriment ensemble : aucune ne survit seule à sa transaction.",
        ],
      },
      {
        heading: 'Ce que le registre garantit',
        body: 'Les garanties tenues par la numérotation et les contrôles au démarrage.',
        steps: [
          "Un identifiant unique par transaction et par opération, sur l'ensemble des journaux : un code affiché désigne une seule chose.",
          'Une numérotation continue : le prochain identifiant se tire au-delà du plus grand attribué, tous journaux confondus.',
          "Un contrôle d'intégrité au démarrage : toute collision est signalée, et les journaux annexes renumérotés le cas échéant.",
        ],
      },
      {
        heading: "Ce qu'il ne garantit pas encore",
        body: 'Deux limites connues, à traiter côté saisie.',
        steps: [
          "L'unicité du fait : DIV, LENDING et FEE existent dans les deux référentiels. Rien n'empêche de saisir un dividende des deux côtés et de le compter deux fois.",
          "La contrepartie espèces d'un achat n'est pas une opération saisie : elle reste déduite par le projecteur de trésorerie.",
        ],
      },
      {
        heading: 'Opérations sur titres',
        body:
          'Dividendes, divisions du nominal et fusions suivent la même logique, avec leurs propres événements : détachement, encaissement, retenue à la source, application de la parité, échange de titres.',
      },
      {
        heading: "Stratégies d'ordre",
        body: "Le mode d'exécution choisi à la saisie détermine comment l'ordre est présenté au marché.",
        steps: [
          'MKT — au marché : exécution immédiate au meilleur prix disponible, sans garantie de cours.',
          "LMT — à cours limité : n'accepte pas un prix moins favorable que la limite fixée.",
          "STP — stop : devient un ordre au marché dès que le seuil est franchi.",
          'STP LMT — stop limité : devient un ordre à cours limité dès le franchissement du seuil.',
          'TS — stop suiveur : le seuil suit le cours à une distance fixe, en valeur ou en pourcentage.',
          "MOO / MOC — au marché à l'ouverture ou à la clôture, exécuté au fixing.",
          "LOO / LOC — limité à l'ouverture ou à la clôture, avec une limite de prix.",
          'PEG — attaché : prix rattaché à une référence (meilleure offre, milieu de fourchette) et réajusté en continu.',
          'ICE — iceberg : seule une fraction de la quantité est visible au carnet.',
          'TWAP / VWAP — découpage automatique de l\'ordre dans le temps ou sur le volume.',
        ],
      },
      {
        heading: "Stratégies d'ordre — exemples chiffrés",
        body:
          "Un même titre à 100,00 €, un même ordre d'achat de 100 titres : le choix de la stratégie change ce qui est exécuté, à quel prix, et ce qui reste au carnet.",
        steps: [
          "MKT — vous achetez sans condition de prix. Le carnet offre 40 titres à 100,05 € puis 60 à 100,12 € : les 100 titres passent, à 100,09 € en moyenne. Vous êtes servi en totalité, mais vous découvrez le prix après coup.",
          "LMT à 100,00 € — vous refusez de payer plus. Le carnet n'offre rien sous 100,05 € : rien ne passe, l'ordre reste au carnet. Le cours retombe à 99,98 € dans l'après-midi, vos 100 titres sont servis à 100,00 € au plus. Vous maîtrisez le prix, jamais l'exécution.",
          "STP à 105,00 € (sur une position détenue, en vente) — protection à la baisse inversée : tant que le cours reste sous 105,00 €, rien ne se passe. Au franchissement, l'ordre devient un MKT et part au meilleur prix disponible — 104,80 € si le carnet s'est creusé. Le seuil déclenche, il ne garantit pas.",
          "STP LMT — seuil 95,00 €, limite 94,50 € : au franchissement des 95,00 €, un ordre limité à 94,50 € est déposé. Si le cours chute d'un coup à 92,00 €, rien n'est exécuté — vous avez évité de vendre à 92,00 €, mais vous restez porteur.",
          "TS à 3 % — le titre monte de 100,00 € à 120,00 € : le seuil de vente suit à 116,40 €. Le cours redescend à 116,00 € : l'ordre se déclenche. Le gain est verrouillé sans avoir fixé de cible à l'avance.",
          "MOO / MOC — vous ne voulez que le prix du fixing : 100 titres au fixing d'ouverture à 100,40 €, ou à celui de clôture. Utile pour s'aligner sur un indice calculé sur le cours de clôture.",
          "LOC à 99,50 € — au fixing de clôture uniquement, et pas au-delà de 99,50 € : le fixing sort à 99,20 €, vous êtes servi ; il sort à 99,80 €, rien ne passe.",
          "PEG au milieu de fourchette — le carnet affiche 99,90 € / 100,10 € : votre prix s'ajuste à 100,00 € et suit chaque mouvement du carnet. On cherche à passer sans écraser le cours, sur un titre peu liquide.",
        ],
      },
      {
        heading: 'Réconciliation du registre',
        body:
          "Le registre interne est rapproché du relevé du broker : chaque transaction porte un état de réconciliation, affiché dans le bandeau d'indicateurs en tête du registre.",
        steps: [
          'Rapprochée — montant, quantité et date concordent avec le relevé du broker.',
          "En attente — relevé du broker non encore reçu pour la période : l'absence de rapprochement ne vaut pas anomalie.",
          'Écart — divergence de montant, de quantité ou de frais ; à instruire avant clôture comptable.',
          "Sans contrepartie — aucune ligne correspondante dans le relevé : opération saisie à tort, ou omise par le broker.",
          "Forcée — rapprochement validé manuellement malgré un écart résiduel, avec sa justification.",
          "Taux — part des transactions rapprochées sur le total du registre ; il ne compte que l'état Rapprochée, jamais les forçages.",
          "Granularité — le relevé du broker décrit des opérations : chaque jambe porte sa propre ligne de relevé et son propre écart. L'écart de la transaction est la somme de ceux de ses opérations, et une jambe peut être rapprochée quand l'autre reste sans contrepartie.",
        ],
      },
      {
        heading: "Durée de validité d'un ordre",
        body:
          "Le donneur d'ordre fixe jusqu'à quand et comment l'ordre reste actif sur le marché ; ce choix conditionne le nombre d'exécutions partielles possibles.",
        steps: [
          "DAY — valable jusqu'à la clôture de la séance en cours, annulé automatiquement sinon.",
          "GTC (Good Till Cancelled) — reste actif jusqu'à exécution ou annulation manuelle, sans limite de date.",
          "GTD (Good Till Date) — valable jusqu'à une date précise fixée par le donneur d'ordre.",
          "IOC (Immediate or Cancel) — exécuté immédiatement, en tout ou partie ; le reliquat non exécuté est annulé sur-le-champ.",
          "FOK (Fill or Kill) — exécuté immédiatement et intégralement, ou annulé en totalité.",
          "AON (All or None) — n'accepte qu'une exécution complète, mais peut rester en carnet en attendant.",
          "OPG (At the Opening) — exécuté uniquement à l'ouverture de la séance.",
          "MOC / CLS (Market/At the Close) — exécuté uniquement à la clôture.",
        ],
      },
    ],
    faq: [
      {
        q: 'Comment annuler un ordre déjà transmis ?',
        a: "Ajouter un événement OrdreAnnulé : l'ordre passe en état Annulé, les exécutions déjà reçues restent visibles dans le journal.",
      },
      {
        q: 'Que signifie « Rejeu actif » ?',
        a: 'La projection affichée correspond à un état historique, en lecture seule. Le bouton « Revenir à l\'état courant » réapplique tous les événements.',
      },
    ],
  },
  {
    key: 'cash',
    label: 'Trésorerie',
    title: 'Gestion de la trésorerie',
    intro: 'Le module Trésorerie donne les soldes par compte et par devise, le prévisionnel de liquidité et les instructions de mouvement.',
    keys: [
      'Le disponible exclut les montants bloqués en collatéral.',
      'Le seuil minimum de liquidité est fixé par le compte.',
      'Toute instruction saisie apparaît en état « À valider ».',
      'Les contre-valeurs utilisent le cours de change du jour.',
    ],
    links: ['Trésorerie', 'Comptabilité', 'Échéances'],
    sections: [
      {
        heading: 'Prévisionnel',
        body:
          "Le prévisionnel agrège les flux connus : coupons, dividendes, règlements d'ordres, appels de fonds, frais. Une barre ambre signale un solde projeté sous le seuil minimum du compte.",
      },
      {
        heading: 'Instructions',
        body: "Quatre natures d'instruction sont possibles.",
        steps: [
          'Virement sortant — vers un compte client ou tiers référencé.',
          'Appel de fonds — engagement sur un fonds fermé.',
          'Opération de change — conversion entre comptes devises.',
          "Placement à terme — réemploi de l'excédent de liquidité.",
        ],
      },
      {
        heading: 'Excédent de liquidité',
        body:
          "Un excédent durable au-dessus de la cible pèse sur la performance. La grille de placement affiche les taux disponibles selon l'horizon ; le choix reste soumis aux contraintes de liquidité du compte.",
      },
    ],
    faq: [
      {
        q: 'Pourquoi un compte peut-il être débiteur ?',
        a: 'Le compte de collatéral supporte les appels de marge : un solde négatif temporaire est normal et doit être couvert avant la date de valeur indiquée.',
      },
      {
        q: 'Le prévisionnel intègre-t-il les ordres non exécutés ?',
        a: "Oui, dès qu'un ordre est transmis, son règlement estimé est intégré au prévisionnel.",
      },
    ],
  },
  ACCOUNTING_TOPIC,
  SIMULATION_TOPIC,
  {
    key: 'docs',
    label: 'Documents',
    title: 'Gestion documentaire',
    intro: 'La gestion documentaire couvre le dépôt, le classement, la revue et le versionnement des pièces rattachées aux comptes.',
    keys: [
      'Chaque document porte une nature (CNI, facture, contrat…) et un type (original, copie, copie certifiée…).',
      'Le dépôt de fichier déclenche OCR puis analyse IA ; la saisie manuelle les désactive.',
      'Toute nouvelle version incrémente le numéro sans effacer les précédentes.',
      'La confidentialité et la durée de conservation sont obligatoires.',
    ],
    links: ['Documents', 'Visionneuse de document', 'Revue et métadonnées'],
    sections: [
      {
        heading: 'Dépôt guidé',
        body:
          "Le stepper enchaîne six étapes : fichier, analyse OCR, analyse IA, classement, diffusion, contrôle. L'analyse IA propose des métadonnées avec un indice de confiance ; elles restent modifiables avant enregistrement.",
      },
      {
        heading: 'Saisie manuelle',
        body:
          "En saisie manuelle, l'aperçu du document occupe la partie gauche de l'écran et le formulaire de métadonnées la partie droite. L'aperçu se zoome à la molette et se déplace à la souris ; il peut s'ouvrir dans une fenêtre indépendante.",
      },
      {
        heading: 'Versions',
        body: "L'historique conserve chaque dépôt avec son auteur et son motif.",
        steps: [
          'Déposer une version depuis la fiche ou la bibliothèque.',
          'Indiquer le motif de la révision.',
          "Restaurer si besoin : la restauration crée une nouvelle version, elle n'écrase rien.",
        ],
      },
    ],
    faq: [
      {
        q: 'Puis-je corriger les métadonnées après validation ?',
        a: "Oui, depuis l'onglet Revue et métadonnées ; la modification est tracée dans la dernière version du document.",
      },
      {
        q: "L'OCR est-il obligatoire ?",
        a: "Non. Il est requis pour les dépôts de fichiers destinés à l'indexation plein texte, mais la saisie manuelle permet de s'en passer.",
      },
    ],
  },
  {
    key: 'reports',
    label: 'Rapports',
      title: 'Production des rapports',
    intro: 'Le catalogue regroupe les rapports de portefeuille, client, opérations et conformité, avec leurs paramètres de génération.',
    keys: [
      'Chaque rapport porte une fréquence de référence.',
      'La période « Personnalisée » ouvre les champs Du et Au.',
      'Trois formats de sortie : PDF, XLSX, CSV.',
      "Les générations restent disponibles dans l'historique.",
    ],
    links: ['Rapports', 'Reporting client', 'Contrôle des limites'],
    sections: [
      {
        heading: 'Choisir un rapport',
        body:
          "La liste déroulante regroupe les rapports par famille. La description rappelle le contenu et la fréquence attendue ; le récapitulatif en bas du panneau résume les paramètres retenus avant génération.",
      },
      {
        heading: 'Paramètres',
        body:
          "Portefeuille, devise de présentation, période et options déterminent le contenu produit. Les options les plus utilisées sont l'inclusion des graphiques et la comparaison au benchmark.",
      },
      {
        heading: 'Diffusion',
        body: 'Une génération passe par deux états.',
        steps: ['En cours — le rapport est en file de production.', "Prêt — le fichier est téléchargeable depuis l'historique."],
      },
    ],
    faq: [
      {
        q: 'Pourquoi un rapport apparaît-il vide ?',
        a: "La période sélectionnée ne contient probablement aucun mouvement pour le périmètre choisi ; vérifier le portefeuille et les dates.",
      },
      {
        q: 'Les rapports réglementaires sont-ils archivés ?',
        a: 'Oui, chaque édition est déposée automatiquement dans la gestion documentaire avec sa référence.',
      },
    ],
  },
  {
    key: 'compliance',
    label: 'Conformité',
    title: 'Conformité et contrôle des limites',
    intro:
      "Les contrôles portent sur les bandes d'allocation, les limites de concentration, les contraintes du compte et les obligations réglementaires.",
    keys: [
      "Un dépassement est signalé le jour même sur la page d'accueil.",
      'La double validation est requise pour les ordres et les virements.',
      'Les dépassements doivent être justifiés et documentés.',
      'Les rapports MiFID II sont produits trimestriellement.',
    ],
    links: ['Contrôle des limites', 'Reporting réglementaire MiFID II', 'Dossier KYC'],
    sections: [
      {
        heading: 'Types de limites',
        body:
          "Trois familles coexistent : les bandes d'allocation par classe d'actifs, les limites de concentration par émetteur ou par ligne, et les contraintes spécifiques inscrites dans la convention de mandat.",
      },
      {
        heading: "Traitement d'un dépassement",
        body: 'La procédure est en trois temps.',
        steps: [
          'Constater et qualifier le dépassement (passif ou actif).',
          'Documenter la cause et le plan de retour dans la limite.',
          "Suivre le retour effectif et clôturer l'alerte.",
        ],
      },
      {
        heading: "Pistes d'audit",
        body:
          "Le journal d'événements des transactions, l'historique des versions documentaires et le journal comptable constituent ensemble la piste d'audit exigée par le régulateur.",
      },
    ],
    faq: [
      {
        q: 'Un dépassement passif doit-il être corrigé immédiatement ?',
        a: 'Non, mais il doit être documenté et corrigé dans le délai prévu par la convention, généralement dix jours ouvrés.',
      },
      {
        q: 'Qui valide les ordres au-delà d\'un certain montant ?',
        a: "Au-delà du seuil défini par compte, la validation d'un second responsable habilité est requise avant transmission.",
      },
    ],
  },
  {
    key: 'support',
    label: 'Assistance',
    title: 'Assistance et contacts',
    intro: "Cette page rassemble les canaux d'assistance, les délais de réponse et les informations à fournir lors d'une demande.",
    keys: [
      'Assistance fonctionnelle : du lundi au vendredi, 8 h – 18 h 30.',
      'Incident bloquant : réponse sous une heure ouvrée.',
      'Toute demande doit préciser la page et la référence concernées.',
      'Les évolutions sont recensées dans la note de version mensuelle.',
    ],
    links: ['Aide et support', 'Note de version', "Contacter l'équipe"],
    sections: [
      {
        heading: 'Signaler un incident',
        body: 'Quatre informations accélèrent le traitement.',
        steps: [
          "La page concernée et l'action tentée.",
          "La référence de l'objet (ordre, document, écriture).",
          "L'horodatage de l'incident.",
          'Une capture d\'écran si le comportement est visuel.',
        ],
      },
      {
        heading: "Demandes d'évolution",
        body:
          "Les demandes sont qualifiées avec la maîtrise d'ouvrage puis arbitrées mensuellement. Le demandeur est informé de la décision et du trimestre de livraison envisagé.",
      },
      {
        heading: 'Continuité de service',
        body:
          "Les interventions planifiées ont lieu le samedi matin et sont annoncées cinq jours ouvrés à l'avance dans les notifications.",
      },
    ],
    faq: [
      {
        q: 'Où trouver la note de version ?',
        a: 'Dans ce guide, thématique Assistance, ainsi que dans les notifications le jour de la mise en production.',
      },
      {
        q: 'Comment demander un accès supplémentaire ?',
        a: "La demande passe par le responsable de l'équipe de gestion, qui la transmet à l'administration des habilitations.",
      },
    ],
  },
];
