import type { GuideTopic } from './guide-data';

/**
 * English edition of the Guide. Same keys, same order, same number of sections, steps, FAQ
 * entries, key points and links as `guide-data.ts` — `guide-parity.spec.ts` checks that shape
 * on both sides, the way the accounting sections are fingerprinted FR/EN. Figures, account
 * codes, transaction identifiers and dates are the ones of the French text: this is a
 * translation, not a second guide.
 */

const ACCOUNTING_TOPIC_EN: GuideTopic = {
  key: 'accounting',
  label: 'Accounting',
  title: 'Accounting translation of securities operations',
  intro:
    'What the standards require — IFRS 9 for recognition, IAS 21 for currency, IAS 12 for withholding tax — and the corresponding entries, set against what the application’s projector does.',
  keys: [
    'IFRS 9 classification drives measurement: by default, every share is at fair value through profit or loss.',
    'A transfer between two accounts you keep is not a disposal: no result, the cost basis carries over intact.',
    'The settlement suspense lives between trade and settlement, in PCG accounts 464 and 465.',
    'A dividend is earned at the ex-date, collected at the payment date.',
  ],
  links: ['Transactions', 'Accounting', 'Reconciliation', 'Appendices and legends'],
  sections: [
    {
      heading: 'IFRS 9 — classification drives everything',
      body:
        'Classification follows two tests, taken in order: the business model, then the nature of the cash flows. Failing the cash-flow test, a share is at fair value through profit or loss, unless the irrevocable equity option is taken, instrument by instrument, at initial recognition only.',
      steps: [
        'Amortised cost: held to collect flows limited to principal and interest.',
        'Fair value through other comprehensive income: held to collect and sell — the gain on disposal is never recycled.',
        'Fair value through profit or loss: the default category, with changes taken to profit or loss at each reporting date.',
      ],
    },
    {
      heading: 'The two recognition doctrines',
      body:
        'IFRS 9 §3.1.2 leaves the choice of when to bring the asset onto the balance sheet, but requires consistency within a category. Under trade-date accounting, the asset and its counterpart enter on the day of the transaction; under settlement-date accounting nothing enters before settlement, but the change in fair value over the interval must still be recognised. The application’s model is hybrid: position at trade date, cash at settlement — hence the need to keep a suspense.',
    },
    {
      heading: 'The settlement suspense',
      body:
        'These are balance-sheet accounts: total wealth does not move between trade and settlement. The suspense is not stored, it is derived from the pair of dates on the operation — an operation is in suspense at a reporting date if it has been traded and not yet settled.',
      steps: [
        'PCG 464 — payables on purchases of securities: purchase traded, not settled.',
        'PCG 465 — receivables on disposals: sale traded, not settled.',
        'Projected balance = settled balance + receivable − payable (512 + 465 − 464).',
      ],
    },
    {
      heading: 'The dividend',
      body:
        'Income is recognised when the right to receive it is established, hence at the ex-date and not at payment (IFRS 9 §5.7.1A). Withholding tax is an income tax within the meaning of IAS 12, not a reduction of the income: on 100 shares at €2.20, the result is €220.00 at the ex-date and the net receipt €154.00 six days later. For an optional dividend, the holder’s choice only concerns how the receivable is extinguished; the non-convertible fraction is settled in cash.',
    },
    {
      heading: 'Transaction costs and entry cost',
      body:
        'Costs follow the classification of the asset, not the nature of the operation: expensed immediately at fair value through profit or loss, added to the entry cost in the two other categories. The PCG leaves a global and permanent option, to be disclosed in the notes. Two different unit costs for the same purchase, depending on the doctrine chosen.',
    },
    {
      heading: 'Foreign-currency operations',
      body:
        'IAS 21 separates monetary from non-monetary items. A settlement payable is remeasured at the closing rate, with the exchange difference in profit or loss; a line of securities at fair value follows the rate on the day of that fair value. A purchase of USD 2,200 traded at 1.0850 and settled at 1.0820 leaves the line at €2,027.65 and books a €5.62 exchange loss.',
    },
    {
      heading: 'The regulatory settlement cycle',
      body:
        'Regulation (EU) 909/2014 sets settlement on the second business day and attaches daily penalties to fails. The cycle is derived from the venue’s MIC code, in that venue’s business days.',
      steps: [
        'United States and Canada (XNAS, XNYS, XTSE): T+1 since 27 May 2024.',
        'Euro area, United Kingdom, Switzerland: T+2, moving to T+1 on 11 October 2027.',
      ],
    },
    {
      heading: 'Three events on one client — what you enter, what gets written',
      body:
        'You are the administrator: the client is the beneficiary of the operations, you keep the account. You enter the event; the application derives the entries, the suspense and the settlement date; you check, then you reconcile the custodian’s statement. The three examples below take operations from the register — a sale, a purchase, a dividend — with the amounts recorded there. Each event reads in two steps: what is earned at trade, what is collected at settlement.',
      steps: [
        'Enter the operation in Operations, or directly in the Transactions register.',
        'Check the suspense: the operation is traded, not yet settled — accounts 464 and 465.',
        'Reconcile the statement line, then post the settlement entry.',
      ],
    },
    {
      heading: '1. SELL — disposal of 10 LVMH on behalf of the client',
      body:
        'Transaction TXN000040, account Bourse Direct — PEA: 10 MC shares sold at €152.30, i.e. €1,523.00 gross, €2.50 fees and €0.46 taxes. Traded on 02/09, settled on 08/09. The disposal clears the line at its cost — €138.00 per unit in this example — and releases the result; the fees do not reduce the proceeds, they are an expense of the period. The client is credited with nothing until the custodian settles: between the two dates, the client holds a receivable.',
      table: {
        caption: 'Entries for the disposal',
        columns: ['Date', 'Account', 'Description', 'Debit', 'Credit'],
        align: ['left', 'left', 'left', 'right', 'right'],
        rows: [
          ['02/09 — trade', '4650', 'Receivable on disposal, net of fees', '1,520.04', '—'],
          ['', '6270', 'Transaction fees and taxes', '2.96', '—'],
          ['', '3010', 'Removal of the 10 shares at cost', '—', '1,380.00'],
          ['', '7620', 'Gain on disposal', '—', '143.00'],
          ['08/09 — settlement', '5120', 'Receipt on the cash account', '1,520.04', '—'],
          ['', '4650', 'Extinction of the receivable', '—', '1,520.04'],
        ],
        note: 'The result is earned on 02/09, the cash on 08/09: that gap is exactly what account 465 carries.',
      },
    },
    {
      heading: '2. BUY — acquisition of 20 Apple for the same client',
      body:
        'Transaction TXN000041, account Degiro — CTO: 20 AAPL shares at €150.00, i.e. €3,000.00, €12.00 fees and €1.80 taxes. Traded on 03/09, settled on 07/09 — the venue is American, settlement there is T+1 business day, pushed back by the weekend. The line enters the balance sheet at trade, and the settlement payable with it. The fees are expensed because the line is measured at fair value through profit or loss; at fair value through other comprehensive income or at amortised cost they would be added to the entry cost, and the unit cost would go from €150.00 to €150.69.',
      table: {
        caption: 'Entries for the acquisition',
        columns: ['Date', 'Account', 'Description', 'Debit', 'Credit'],
        align: ['left', 'left', 'left', 'right', 'right'],
        rows: [
          ['03/09 — trade', '3010', 'Entry of the 20 shares at acquisition price', '3,000.00', '—'],
          ['', '6270', 'Transaction fees and taxes', '13.80', '—'],
          ['', '4640', 'Settlement payable to the custodian', '—', '3,013.80'],
          ['07/09 — settlement', '4640', 'Extinction of the payable', '3,013.80', '—'],
          ['', '5120', 'Payment from the cash account', '—', '3,013.80'],
        ],
        note: 'Until 07/09 has passed, the client holds the shares without having paid for them: account 464 carries the debt.',
      },
    },
    {
      heading: '3. DIV — L’Oréal dividend collected by the client',
      body:
        'Transaction TXN000037, account Bourse Direct — PEA: 100 shares, €2.20 per share, ex-date 20/08, payment 26/08. The income is earned at the ex-date, when the right to receive is established — not at collection. The 30% withholding tax is a tax, not a reduction of the income: the client’s result carries €220.00, the cash €154.00. The withholding is booked as a receivable because it is recoverable under treaty; otherwise it would go to tax expense and the net result would fall to €154.00.',
      table: {
        caption: 'Entries for the dividend',
        columns: ['Date', 'Account', 'Description', 'Debit', 'Credit'],
        align: ['left', 'left', 'left', 'right', 'right'],
        rows: [
          ['20/08 — ex-date', '4670', 'Dividend receivable, net of withholding', '154.00', '—'],
          ['', '4487', 'Recoverable withholding tax (30%)', '66.00', '—'],
          ['', '7630', 'Income from investments, gross amount', '—', '220.00'],
          ['26/08 — payment', '5120', 'Receipt on the cash account', '154.00', '—'],
          ['', '4670', 'Extinction of the receivable', '—', '154.00'],
        ],
        note: 'The withholding assumes the shares are held in an ordinary securities account: inside a PEA, the same dividend is exempt as long as it stays in the wrapper, line 4487 disappears and the net received equals the gross. An optional dividend changes nothing in these entries: the holder’s choice only concerns how the receivable is extinguished, in shares or in cash.',
      },
    },
    {
      heading: 'What the three events leave the client with',
      body:
        'Result and cash do not form on the same dates, and the suspense holds the gap. The projected balance you read in Transactions — 512 + 465 − 464 — is the only measure that reconciles the two columns: it says what the cash account will be worth once everything has settled.',
      table: {
        caption: 'Result earned, cash collected',
        columns: ['Event', 'Result', 'At trade', 'At settlement'],
        align: ['left', 'right', 'left', 'right'],
        rows: [
          ['SELL — 10 LVMH', '+140.04', 'Receivable 465 of 1,520.04', '+1,520.04 on 08/09'],
          ['BUY — 20 AAPL', '−13.80', 'Payable 464 of 3,013.80', '−3,013.80 on 07/09'],
          ['DIV — L’Oréal', '+220.00', 'Receivable of 154.00', '+154.00 on 26/08'],
          ['Total', '+346.24', '—', '−1,339.76'],
        ],
        totalRow: true,
        note: 'The result of the disposal is net of fees (143.00 − 2.96); that of the purchase carries only its fees, the line staying on the balance sheet.',
      },
    },
    {
      heading: 'The accounts moved, one by one',
      body:
        'Nine accounts are enough to write the three events. Four are balance-sheet accounts that merely carry a position or a receivable pending settlement; three are profit-and-loss accounts, which decide what the period gains or loses; the cash account records the actual movement. The direction given here is that of an increase: an asset account increases on the debit side, a liability or income account on the credit side.',
      table: {
        caption: 'Chart of accounts used',
        columns: ['Account', 'Title', 'Nature', 'What it carries here', 'Increases'],
        align: ['left', 'left', 'left', 'left', 'left'],
        rows: [
          ['3010', 'Securities — shares', 'Asset', 'The line of shares, at cost', 'Debit'],
          ['4487', 'Recoverable withholding tax', 'Asset', 'The tax withheld abroad, to be reclaimed', 'Debit'],
          ['4640', 'Payables on purchases of securities', 'Liability', 'A purchase traded, not yet settled', 'Credit'],
          ['4650', 'Receivables on disposals of securities', 'Asset', 'A sale traded, not yet settled', 'Debit'],
          ['4670', 'Custodian clearing account', 'Asset', 'What the custodian owes — here the dividend', 'Debit'],
          ['5120', 'Bank — cash account', 'Asset', 'The cash actually available', 'Debit'],
          ['6270', 'Transaction fees', 'Expense', 'Commissions and venue taxes', 'Debit'],
          ['7620', 'Gain on disposal', 'Income', 'The difference between sale price and cost', 'Credit'],
          ['7630', 'Income from investments', 'Income', 'The gross dividend, before tax', 'Credit'],
        ],
        note: 'Accounts 464, 465 and 467 are transitory: they are born at trade and die at settlement. If one of them survives past the settlement date, it is a suspense item to resolve, not an entry to keep.',
      },
    },
    {
      heading: 'What the client sees on the account',
      body:
        'The client does not read a journal: the client reads two statements — cash and portfolio. Debit and credit give way to a direction of movement and, above all, to a date: the one on which the money is actually there. The three events concern two of the client’s accounts, the PEA kept at Bourse Direct and the ordinary securities account kept at Degiro; no amount moves between the two.',
      table: {
        caption: 'Cash statement — what moves, and when',
        columns: ['Date', 'Client account', 'Statement description', 'Movement'],
        align: ['left', 'left', 'left', 'right'],
        rows: [
          ['20/08', 'PEA — Bourse Direct', 'L’Oréal dividend ex — pending payment', '—'],
          ['26/08', 'PEA — Bourse Direct', 'L’Oréal dividend, net of withholding', '+154.00'],
          ['02/09', 'PEA — Bourse Direct', 'Sale 10 LVMH — traded, settles 08/09', '—'],
          ['03/09', 'CTO — Degiro', 'Purchase 20 Apple — traded, settles 07/09', '—'],
          ['07/09', 'CTO — Degiro', 'Purchase 20 Apple, fees and taxes included', '−3,013.80'],
          ['08/09', 'PEA — Bourse Direct', 'Sale 10 LVMH, net of fees', '+1,520.04'],
        ],
        note: 'The three lines without an amount are the ones the client sees arrive before seeing their effect: the operation is done, the money is not there yet. That is what the application calls the projected balance — the account balance plus what is receivable, minus what is payable.',
      },
    },
    {
      heading: 'And on the portfolio',
      body:
        'The line of shares, for its part, moves as of the trade: the client owns the shares on the day the order is executed, even if settlement follows two days later. That is the reason for the suspense — without it, wealth would look truncated between the two dates.',
      table: {
        caption: 'Positions before and after',
        columns: ['Security', 'Account', 'Before', 'Movement', 'After', 'Cost'],
        align: ['left', 'left', 'right', 'right', 'right', 'right'],
        rows: [
          ['MC — LVMH', 'PEA — Bourse Direct', '25', '−10 on 02/09', '15', '138.00'],
          ['AAPL — Apple', 'CTO — Degiro', '0', '+20 on 03/09', '20', '150.00'],
          ['OR — L’Oréal', 'PEA — Bourse Direct', '100', 'unchanged', '100', 'unchanged'],
        ],
        note: 'The dividend does not touch the line: it rewards holding, it does not change it. Only an optional dividend paid in shares would increase the quantity.',
      },
    },
    {
      heading: 'Does the client see these accounts? No — the client sees their effects',
      body:
        'No accounting account number appears in a client area. The chart of accounts is the account keeper’s tool; the client receives documents — portfolio statement, cash statement, contract note, fee statement, tax form — every figure of which nonetheless comes out of these accounts. The table below maps them in that direction: what is written on one side, what is read on the other.',
      table: {
        caption: 'From the accounting account to the client document',
        columns: ['Account', 'What is written there', 'What the client reads', 'On which document'],
        align: ['left', 'left', 'left', 'left'],
        rows: [
          ['3010', 'Line of shares at cost', '“15 LVMH · cost 138.00 €”', 'Portfolio statement'],
          ['4650', 'Receivable on disposal, 1,520.04', '“Sale 10 LVMH — settles 08/09”', 'Pending operations, projected balance'],
          ['4640', 'Acquisition payable, 3,013.80', '“Purchase 20 Apple — settles 07/09”', 'Pending operations, projected balance'],
          ['4670', 'Dividend receivable, 154.00', '“Dividend ex, payment 26/08”', 'Upcoming operations'],
          ['5120', 'Receipts and payments', 'The balance and the dated movements', 'Cash statement'],
          ['6270', 'Fees and taxes, 2.96 then 13.80', '“Brokerage 12.00 € · taxes 1.80 €”', 'Contract note, fee statement'],
          ['7620', 'Gain on disposal, 143.00', '“Realised gain +143.00 €”', 'Performance statement, tax form'],
          ['7630', 'Gross dividend, 220.00', '“Gross dividend 220.00 €”', 'Contract note, tax form'],
          ['4487', 'Recoverable withholding, 66.00', '“Withholding tax 66.00 €”', 'Contract note, tax form'],
        ],
        note: 'The same amount bears two names depending on the reader: what accounting calls 4650 is, for the client, “a sale settling on 08/09”. It is the same information, named by what it produces rather than by where it is filed.',
      },
    },
    {
      heading: 'Where the administrator finds each step',
      body:
        'Nothing above is entered twice: the operation is entered once, and the screens show different faces of it. The administrator role opens all four for validation; a manager enters and reconciles without validating the entries.',
      table: {
        columns: ['Step', 'Screen', 'What is done there'],
        align: ['left', 'left', 'left'],
        rows: [
          ['Entry', 'Operations', 'Create the order, transfer, corporate action or cash flow'],
          ['Monitoring', 'Transactions', 'Read the register, its legs, the suspense and the projected balance'],
          ['Entries', 'Accounting', 'Check the journal, the accounts moved and the trial balance'],
          ['Control', 'Reconciliation', 'Match the line of the custodian’s statement'],
        ],
      },
    },
  ],
  faq: [
    {
      q: 'Does a transfer of securities between two of my accounts create a result?',
      a:
        'No. IFRS 9 §3.2.3 derecognises an asset only if the rights expire or pass to a third party: the holder does not change, only the account keeper does. Both legs carry the same quantity and the same price — a cost basis, never a market price. A market price would produce a prohibited result and distort the unit cost of the receiving account.',
    },
    {
      q: 'Why does total wealth look overstated between two dates?',
      a:
        'Because the position moves at the trade date and the cash at the settlement date, with no counterpart leg. The suspense fills that gap: on a purchase of €752.00, the total only changes by −€2.00 — the fees, the only wealth consumed.',
    },
    {
      q: 'Do expected credit losses apply to my shares?',
      a:
        'No: the IFRS 9 impairment model only covers debt instruments at amortised cost or at fair value through other comprehensive income. A fall in price is already recognised by the remeasurement at fair value — impairing it would count the loss twice.',
    },
    {
      q: 'Can I change the IFRS 9 category of a security?',
      a:
        'Almost never. A reclassification requires a change of business model, decided for an entire portfolio and applied prospectively. The equity option on shares, for its part, can never be reclassified.',
    },
  ],
};

const SIMULATION_TOPIC_EN: GuideTopic = {
  key: 'simulation',
  label: 'Risk management',
  title: 'Shock models and stress tests',
  intro:
    'Thirteen scenarios that apply to a specific account or to the whole portfolio. Each model combines a valuation shock, a multiplier per asset class and a dividend trajectory.',
  keys: [
    'The scope is chosen before the model: one account, or all accounts aggregated.',
    'The shock applies per asset class, not uniformly: each model carries its own multipliers.',
    'Dividends are part of the simulation: each scenario projects its effect on income.',
    'The custom shock lets you enter a change per class freely.',
  ],
  links: ['Risk management', 'Positions', 'Dashboard'],
  sections: [
    {
      heading: 'Market shocks',
      body: 'Scenarios of sharp falls in valuations, calibrated on real episodes.',
      steps: [
        'Equity crash — −20% worldwide and immediate. On €486M of which 55% in equities: simulated loss of €62M, equities absorb 1.15 times the shock.',
        'Historical replay — reproduces the first quarter of 2020, i.e. −24%. Applies the actual day-by-day path to the current portfolio.',
        'Geopolitical shock — energy +40%, emerging markets −25%. Penalises emerging-market pockets and supply chains.',
      ],
    },
    {
      heading: 'Rate and inflation shocks',
      body: 'Effects of a rise in rates or of lasting inflation on duration assets.',
      steps: [
        'Rate shock — +150 basis points. Bonds absorb 1.3 times the shock; a duration of 5.4 years translates into about −8%.',
        'Inflation shock — inflation at 6%, negative real rates. Fixed coupons erode (multiplier 1.4), real assets hold up (0.5).',
      ],
    },
    {
      heading: 'Structural shocks',
      body: 'Scenarios that test the construction of the portfolio rather than the level of the markets.',
      steps: [
        'Sector rotation — technology −15%, defensives +5%, by GICS sector. Penalises concentration in growth.',
        'Correlation breakdown — equities and bonds fall together, as in 2022: diversification stops protecting, no class is spared.',
        'Issuer default — total loss on the largest line held. Measures concentration: on a line at 19.8% of the portfolio, the impact exceeds 19%.',
        'Liquidity crisis — spreads widen and the illiquid is discounted (multiplier 1.6 on alternatives), for lack of buyers.',
      ],
    },
    {
      heading: 'Currency shocks',
      body: 'Effect of a change in parity on unhedged positions.',
      steps: [
        'Currency shock — EUR/USD +10%. Only lines denominated in foreign currency are affected; the impact stays limited (−3%) if the hedge is in place.',
      ],
    },
    {
      heading: 'Dividend trajectories',
      body: 'Two scenarios bear first on income, before any effect on prices. The reference yield retained is 2.8%.',
      steps: [
        'Dividend growth — +5% per year, no valuation shock. On €486M, income goes from €13.6M to €14.3M.',
        'Dividend cut — −40% on announced amounts, with a slight price effect (−4%). Income falls to €8.2M.',
      ],
    },
    {
      heading: 'Custom shock',
      body:
        'Four free fields — equities, bonds, alternatives, cash — expressed as percentages. The engine applies the change entered without multiplier, which makes it possible to reproduce a regulatory scenario or an in-house assumption.',
    },
  ],
  faq: [
    {
      q: 'Why does cash almost never fall?',
      a: 'Its multiplier is zero in most scenarios: a crash or an issuer default does not touch cash. Only inflation (0.6) and currency (0.2) affect it.',
    },
    {
      q: 'Can the results be used for regulatory reporting?',
      a: 'No. The assumptions are simplified and meant for awareness: they replace neither a validated risk model nor a regulatory VaR calculation.',
    },
    {
      q: 'Can I stress a single account?',
      a: 'Yes: the scope selector at the top of the page limits the simulation to one account, with its share of the valuation, or applies it to all accounts aggregated.',
    },
  ],
};

export const GUIDE_TOPICS_EN: readonly GuideTopic[] = [
  {
    key: 'start',
    label: 'Getting started',
    title: 'Getting started with the platform',
    intro:
      'This guide describes how the application is organised, how to move between modules, and the personal settings to make on first login.',
    keys: [
      'The side menu groups modules by section: Management, Market, Administration.',
      'The breadcrumb always shows the active section and page.',
      'The default home page is chosen in Settings.',
      'The interface language is changed from the account menu.',
    ],
    links: ['Home', 'User settings', 'Dashboard'],
    sections: [
      {
        heading: 'Screen layout',
        body:
          'The top bar carries the global search, help, this guide, notifications and the account menu. The side menu collapses to free up width; labels then give way to icons.',
      },
      {
        heading: 'First settings',
        body: 'Three settings shape everyday comfort.',
        steps: [
          'Choose the display density (compact for long tables).',
          'Set the home page according to your role.',
          'Enable e-mail notifications for limit alerts.',
        ],
      },
      {
        heading: 'Global search',
        body:
          'The search queries accounts, positions, documents and accounting entries at once. A prefix narrows the scope: ord: for orders, doc: for documents, cpt: for accounts.',
      },
    ],
    faq: [
      {
        q: 'How do I get back to the dashboard quickly?',
        a: 'The breadcrumb and the Home item of the menu take you back in one click; the keyboard shortcut is available from any page.',
      },
      {
        q: 'Can I work in English?',
        a: 'The FR / EN selector in the account menu and the one in this guide are linked: the guide is available in both languages. The application screens themselves remain in French.',
      },
    ],
  },
  {
    key: 'portfolio',
    label: 'Portfolios',
    title: 'Monitoring portfolios and positions',
    intro:
      'The Positions module shows the valued inventory, the weights per asset class and the deviations from the account’s targets.',
    keys: [
      'The valuation is refreshed at each closing price.',
      'Tolerance bands are set per account, usually 2 points.',
      'The rebalancing view computes the orders needed per sleeve.',
      'The weight of a line is always read against total assets.',
    ],
    links: ['Positions', 'Accounts', 'Market prices'],
    sections: [
      {
        heading: 'Reading the inventory',
        body:
          'Each line shows the quantity, the price retained, the counter-value and the weight. Illiquid lines carry an explicit mention: their valuation comes from the last net asset value communicated.',
      },
      {
        heading: 'Allocation deviations',
        body:
          'A deviation beyond the tolerance band triggers an alert on the home page and in the limits control report. The deviation is read in percentage points, not in relative percent.',
      },
      {
        heading: 'Rebalancing',
        body: 'The calculation spreads the amount to correct pro rata across the lines of the sleeve.',
        steps: [
          'Enable the rebalancing view on the Positions page.',
          'Check the amounts proposed per line.',
          'Generate the orders, which arrive in Draft state in the register.',
        ],
      },
    ],
    faq: [
      {
        q: 'Why does a deviation persist after rebalancing?',
        a: 'Orders are only taken into account once executed: between transmission and execution, the position stays unchanged.',
      },
      {
        q: 'How are foreign-currency lines handled?',
        a: 'The weight is computed on the counter-value in the account’s reference currency, at the exchange rate of the valuation.',
      },
    ],
  },
  {
    key: 'orders',
    label: 'Orders and transactions',
    title: 'Life cycle of orders and transactions',
    intro:
      'The transactions register is an append-only event journal: the state of an order is always rebuilt by replaying its events.',
    keys: [
      'No event is modified or deleted; an error is corrected by an amendment.',
      'Replay makes it possible to recover the exact state at any step.',
      'Five families are handled: order, transfer, dividend, split, merger.',
      'Posting closes the cycle and locks the entry.',
    ],
    links: ['Transactions', 'Securities operations', 'Reconciliation'],
    sections: [
      {
        heading: 'Typical sequence of an order',
        body: 'The normal sequence chains six events.',
        steps: [
          'OrderCreated — quantity and limit entered.',
          'OrderValidated — limits checked and dual validation.',
          'OrderTransmitted — sent to the execution venue.',
          'PartialFill or FullFill — quantities and prices received from the market.',
          'CustodianConfirmation — settlement confirmed.',
          'Posted — entry generated in the journal.',
        ],
      },
      {
        heading: 'Corrections',
        body:
          'An OrderAmended records the new value without erasing the old one; the projection applies the last known value and the amendment counter increases. That trail is what makes the register auditable.',
      },
      {
        heading: 'Register rules — one transaction = one economic fact',
        body:
          'A transaction is a dated management fact; an operation is one of its effects on a line (account, security).',
        steps: [
          'A transaction carries at least one operation, often several — a transfer counts two, a spin-off too.',
          'The number of operations follows from the fact, it is not chosen: several distinct facts are never grouped into one transaction for the convenience of entry.',
          'The operations of a transaction are created, modified and deleted together: none survives its transaction on its own.',
        ],
      },
      {
        heading: 'What the register guarantees',
        body: 'The guarantees held by numbering and the checks at start-up.',
        steps: [
          'A unique identifier per transaction and per operation, across all journals: a displayed code designates one thing only.',
          'Continuous numbering: the next identifier is drawn beyond the largest one assigned, all journals combined.',
          'An integrity check at start-up: any collision is reported, and the secondary journals renumbered if needed.',
        ],
      },
      {
        heading: 'What it does not guarantee yet',
        body: 'Two known limits, to be handled on the entry side.',
        steps: [
          'Uniqueness of the fact: DIV, LENDING and FEE exist in both reference sets. Nothing prevents entering a dividend on both sides and counting it twice.',
          'The cash counterpart of a purchase is not an entered operation: it remains derived by the cash projector.',
        ],
      },
      {
        heading: 'Corporate actions',
        body:
          'Dividends, splits and mergers follow the same logic, with their own events: ex-date, collection, withholding tax, application of the ratio, exchange of securities.',
      },
      {
        heading: 'Order strategies',
        body: 'The execution mode chosen at entry determines how the order is presented to the market.',
        steps: [
          'MKT — market: immediate execution at the best available price, with no price guarantee.',
          'LMT — limit: does not accept a price less favourable than the limit set.',
          'STP — stop: becomes a market order as soon as the threshold is crossed.',
          'STP LMT — stop limit: becomes a limit order as soon as the threshold is crossed.',
          'TS — trailing stop: the threshold follows the price at a fixed distance, in value or in percent.',
          'MOO / MOC — market on open or on close, executed at the fixing.',
          'LOO / LOC — limit on open or on close, with a price limit.',
          'PEG — pegged: price attached to a reference (best offer, mid-spread) and readjusted continuously.',
          'ICE — iceberg: only a fraction of the quantity is visible in the book.',
          'TWAP / VWAP — automatic slicing of the order over time or over volume.',
        ],
      },
      {
        heading: 'Order strategies — worked examples',
        body:
          'The same security at €100.00, the same buy order for 100 shares: the choice of strategy changes what is executed, at what price, and what stays in the book.',
        steps: [
          'MKT — you buy with no price condition. The book offers 40 shares at €100.05 then 60 at €100.12: all 100 shares go through, at €100.09 on average. You are filled in full, but you discover the price afterwards.',
          'LMT at €100.00 — you refuse to pay more. The book offers nothing below €100.05: nothing goes through, the order stays in the book. The price drops back to €99.98 in the afternoon, your 100 shares are filled at €100.00 at most. You control the price, never the execution.',
          'STP at €105.00 (on a held position, selling) — downside protection reversed: as long as the price stays below €105.00, nothing happens. On crossing, the order becomes a MKT and goes at the best available price — €104.80 if the book has thinned. The threshold triggers, it does not guarantee.',
          'STP LMT — threshold €95.00, limit €94.50: on crossing €95.00, a limit order at €94.50 is placed. If the price gaps down to €92.00 in one move, nothing is executed — you avoided selling at €92.00, but you are still holding.',
          'TS at 3% — the security rises from €100.00 to €120.00: the sell threshold follows to €116.40. The price comes back down to €116.00: the order triggers. The gain is locked in without having set a target in advance.',
          'MOO / MOC — you only want the fixing price: 100 shares at the opening fixing at €100.40, or at the closing one. Useful to align with an index computed on the closing price.',
          'LOC at €99.50 — at the closing fixing only, and not beyond €99.50: the fixing comes out at €99.20, you are filled; it comes out at €99.80, nothing goes through.',
          'PEG at mid-spread — the book shows €99.90 / €100.10: your price adjusts to €100.00 and follows every move of the book. The aim is to get through without pushing the price, on a thinly traded security.',
        ],
      },
      {
        heading: 'Reconciling the register',
        body:
          'The internal register is matched against the broker’s statement: each transaction carries a reconciliation state, shown in the indicator bar at the top of the register.',
        steps: [
          'Reconciled — amount, quantity and date match the broker’s statement.',
          'Pending — broker’s statement not yet received for the period: the absence of a match is not an anomaly.',
          'Discrepancy — difference in amount, quantity or fees; to be investigated before the accounting close.',
          'No counterpart — no matching line in the statement: operation entered by mistake, or omitted by the broker.',
          'Forced — match validated manually despite a residual discrepancy, with its justification.',
          'Rate — share of reconciled transactions over the whole register; it only counts the Reconciled state, never forced matches.',
          'Granularity — the broker’s statement describes operations: each leg carries its own statement line and its own discrepancy. The transaction’s discrepancy is the sum of those of its operations, and one leg can be reconciled while the other has no counterpart.',
        ],
      },
      {
        heading: 'Time in force of an order',
        body:
          'The order giver sets until when and how the order stays active on the market; that choice determines how many partial fills are possible.',
        steps: [
          'DAY — valid until the close of the current session, cancelled automatically otherwise.',
          'GTC (Good Till Cancelled) — stays active until executed or manually cancelled, with no date limit.',
          'GTD (Good Till Date) — valid until a precise date set by the order giver.',
          'IOC (Immediate or Cancel) — executed immediately, in whole or in part; the unexecuted remainder is cancelled on the spot.',
          'FOK (Fill or Kill) — executed immediately and in full, or cancelled entirely.',
          'AON (All or None) — only accepts a complete execution, but may stay in the book while waiting.',
          'OPG (At the Opening) — executed only at the opening of the session.',
          'MOC / CLS (Market/At the Close) — executed only at the close.',
        ],
      },
    ],
    faq: [
      {
        q: 'How do I cancel an order already transmitted?',
        a: 'Add an OrderCancelled event: the order moves to Cancelled state, the fills already received remain visible in the journal.',
      },
      {
        q: 'What does “Replay active” mean?',
        a: 'The projection displayed corresponds to a historical state, read-only. The “Back to current state” button reapplies all events.',
      },
    ],
  },
  {
    key: 'cash',
    label: 'Cash',
    title: 'Cash management',
    intro: 'The Cash module gives the balances per account and per currency, the liquidity forecast and the movement instructions.',
    keys: [
      'The available balance excludes amounts blocked as collateral.',
      'The minimum liquidity threshold is set by the account.',
      'Any instruction entered appears in “To validate” state.',
      'Counter-values use the exchange rate of the day.',
    ],
    links: ['Cash', 'Accounting', 'Maturities'],
    sections: [
      {
        heading: 'Forecast',
        body:
          'The forecast aggregates known flows: coupons, dividends, order settlements, capital calls, fees. An amber bar flags a projected balance below the account’s minimum threshold.',
      },
      {
        heading: 'Instructions',
        body: 'Four kinds of instruction are possible.',
        steps: [
          'Outgoing transfer — to a referenced client or third-party account.',
          'Capital call — commitment on a closed-end fund.',
          'Foreign-exchange operation — conversion between currency accounts.',
          'Term deposit — reinvestment of surplus liquidity.',
        ],
      },
      {
        heading: 'Surplus liquidity',
        body:
          'A lasting surplus above the target weighs on performance. The placement grid shows the rates available by horizon; the choice remains subject to the account’s liquidity constraints.',
      },
    ],
    faq: [
      {
        q: 'Why can an account be overdrawn?',
        a: 'The collateral account bears margin calls: a temporary negative balance is normal and must be covered before the value date shown.',
      },
      {
        q: 'Does the forecast include unexecuted orders?',
        a: 'Yes, as soon as an order is transmitted, its estimated settlement is included in the forecast.',
      },
    ],
  },
  ACCOUNTING_TOPIC_EN,
  SIMULATION_TOPIC_EN,
  {
    key: 'docs',
    label: 'Documents',
    title: 'Document management',
    intro: 'Document management covers the upload, filing, review and versioning of the documents attached to accounts.',
    keys: [
      'Each document carries a nature (ID card, invoice, contract…) and a type (original, copy, certified copy…).',
      'Uploading a file triggers OCR then AI analysis; manual entry disables them.',
      'Every new version increments the number without erasing the previous ones.',
      'Confidentiality and retention period are mandatory.',
    ],
    links: ['Documents', 'Document viewer', 'Review and metadata'],
    sections: [
      {
        heading: 'Guided upload',
        body:
          'The stepper chains six steps: file, OCR analysis, AI analysis, filing, distribution, control. The AI analysis proposes metadata with a confidence score; they remain editable before saving.',
      },
      {
        heading: 'Manual entry',
        body:
          'In manual entry, the document preview occupies the left part of the screen and the metadata form the right part. The preview zooms with the wheel and pans with the mouse; it can open in a separate window.',
      },
      {
        heading: 'Versions',
        body: 'The history keeps every upload with its author and its reason.',
        steps: [
          'Upload a version from the record or from the library.',
          'State the reason for the revision.',
          'Restore if needed: restoring creates a new version, it overwrites nothing.',
        ],
      },
    ],
    faq: [
      {
        q: 'Can I correct metadata after validation?',
        a: 'Yes, from the Review and metadata tab; the change is tracked in the latest version of the document.',
      },
      {
        q: 'Is OCR mandatory?',
        a: 'No. It is required for file uploads meant for full-text indexing, but manual entry makes it possible to do without.',
      },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    title: 'Producing reports',
    intro: 'The catalogue groups portfolio, client, operations and compliance reports, with their generation parameters.',
    keys: [
      'Each report carries a reference frequency.',
      'The “Custom” period opens the From and To fields.',
      'Three output formats: PDF, XLSX, CSV.',
      'Generated reports remain available in the history.',
    ],
    links: ['Reports', 'Client reporting', 'Limits control'],
    sections: [
      {
        heading: 'Choosing a report',
        body:
          'The drop-down list groups reports by family. The description recalls the content and the expected frequency; the summary at the bottom of the panel recaps the parameters retained before generation.',
      },
      {
        heading: 'Parameters',
        body:
          'Portfolio, presentation currency, period and options determine the content produced. The most used options are the inclusion of charts and the comparison to the benchmark.',
      },
      {
        heading: 'Distribution',
        body: 'A generation goes through two states.',
        steps: ['In progress — the report is in the production queue.', 'Ready — the file can be downloaded from the history.'],
      },
    ],
    faq: [
      {
        q: 'Why does a report come out empty?',
        a: 'The selected period probably contains no movement for the chosen scope; check the portfolio and the dates.',
      },
      {
        q: 'Are regulatory reports archived?',
        a: 'Yes, each edition is filed automatically in document management with its reference.',
      },
    ],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    title: 'Compliance and limits control',
    intro:
      'Controls cover allocation bands, concentration limits, account constraints and regulatory obligations.',
    keys: [
      'A breach is flagged the same day on the home page.',
      'Dual validation is required for orders and transfers.',
      'Breaches must be justified and documented.',
      'MiFID II reports are produced quarterly.',
    ],
    links: ['Limits control', 'MiFID II regulatory reporting', 'KYC file'],
    sections: [
      {
        heading: 'Types of limits',
        body:
          'Three families coexist: allocation bands per asset class, concentration limits per issuer or per line, and the specific constraints written into the mandate agreement.',
      },
      {
        heading: 'Handling a breach',
        body: 'The procedure has three steps.',
        steps: [
          'Record and qualify the breach (passive or active).',
          'Document the cause and the plan to return within the limit.',
          'Follow the actual return and close the alert.',
        ],
      },
      {
        heading: 'Audit trails',
        body:
          'The transactions event journal, the document version history and the accounting journal together form the audit trail required by the regulator.',
      },
    ],
    faq: [
      {
        q: 'Must a passive breach be corrected immediately?',
        a: 'No, but it must be documented and corrected within the period set by the agreement, usually ten business days.',
      },
      {
        q: 'Who validates orders above a certain amount?',
        a: 'Above the threshold set per account, validation by a second authorised manager is required before transmission.',
      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    title: 'Support and contacts',
    intro: 'This page gathers the support channels, response times and the information to provide with a request.',
    keys: [
      'Functional support: Monday to Friday, 8:00 – 18:30.',
      'Blocking incident: response within one business hour.',
      'Every request must state the page and the reference concerned.',
      'Changes are listed in the monthly release note.',
    ],
    links: ['Help and support', 'Release note', 'Contact the team'],
    sections: [
      {
        heading: 'Reporting an incident',
        body: 'Four pieces of information speed up handling.',
        steps: [
          'The page concerned and the action attempted.',
          'The reference of the object (order, document, entry).',
          'The timestamp of the incident.',
          'A screenshot if the behaviour is visual.',
        ],
      },
      {
        heading: 'Change requests',
        body:
          'Requests are qualified with the business owner, then arbitrated monthly. The requester is informed of the decision and of the planned delivery quarter.',
      },
      {
        heading: 'Service continuity',
        body:
          'Planned interventions take place on Saturday mornings and are announced five business days in advance in the notifications.',
      },
    ],
    faq: [
      {
        q: 'Where can I find the release note?',
        a: 'In this guide, under the Support topic, and in the notifications on the day of the release.',
      },
      {
        q: 'How do I request additional access?',
        a: 'The request goes through the head of the management team, who forwards it to the permissions administration.',
      },
    ],
  },
];
