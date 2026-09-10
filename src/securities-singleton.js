// Singleton partagé des titres négociables et de leurs informations de marché.
// Une seule source de vérité pour Titres.dc.html, Transactions.dc.html et Ordres.dc.html.
(function () {
  if (window.SecuritiesSingleton) return;

  var SECURITIES = [
    { ticker: 'AAPL', name: 'Apple Inc.', isin: 'US0378331005', mic: 'XNAS', place: 'Nasdaq', country: 'États-Unis', currency: 'USD', assetClass: 'Action', sector: 'Technologie' },
    { ticker: 'MC', name: 'LVMH', isin: 'FR0000121014', mic: 'XPAR', place: 'Euronext Paris', country: 'France', currency: 'EUR', assetClass: 'Action', sector: 'Luxe' },
    { ticker: 'AI', name: 'Air Liquide', isin: 'FR0000120073', mic: 'XPAR', place: 'Euronext Paris', country: 'France', currency: 'EUR', assetClass: 'Action', sector: 'Gaz industriels et santé' },
    { ticker: 'OR', name: "L'Oréal", isin: 'FR0000120321', mic: 'XPAR', place: 'Euronext Paris', country: 'France', currency: 'EUR', assetClass: 'Action', sector: 'Cosmétiques' },
    { ticker: 'EUEQ', name: 'Europe ex-UK Equity', isin: 'LU0000000001', mic: 'XLUX', place: 'Bourse de Luxembourg', country: 'Luxembourg', currency: 'EUR', assetClass: 'ETF', sector: 'Fonds indiciel — actions Europe' },
    { ticker: 'USLC', name: 'US Large Cap Core', isin: 'IE00B1234567', mic: 'XDUB', place: 'Euronext Dublin', country: 'Irlande', currency: 'USD', assetClass: 'ETF', sector: 'Fonds indiciel — actions américaines' }
  ];

  var byTicker = {};
  SECURITIES.forEach(function (s) { byTicker[s.ticker] = s; });

  window.SecuritiesSingleton = {
    all: function () { return SECURITIES.slice(); },
    get: function (ticker) { return byTicker[ticker] || null; },
    byMic: function (mic) { return SECURITIES.filter(function (s) { return !mic || s.mic === mic; }); },
    micList: function () {
      var seen = {}, out = [];
      SECURITIES.forEach(function (s) { if (!seen[s.mic]) { seen[s.mic] = true; out.push({ mic: s.mic, place: s.place }); } });
      return out;
    },
    label: function (ticker) {
      var s = byTicker[ticker];
      return s ? s.ticker + ' — ' + s.name : ticker;
    }
  };
})();
