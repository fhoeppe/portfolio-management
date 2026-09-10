// Référentiel applicatif des places de négociation : géographie, devise de règlement,
// fuseau, séance, indice de référence et cycle de dénouement.
// Complète mic-registry.js (norme ISO 10383) des données propres à l'application.
(function () {
  if (window.PlacesService) return;

  var P = [{"mic":"XPAR","place":"Euronext Paris","code":"FR","flag":"🇫🇷","country":"France","currency":"EUR","tz":"Europe/Paris","hours":"09:00 – 17:30","index":"CAC 40","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear France","penalty":"CSDR — pénalités quotidiennes"}},{"mic":"XAMS","place":"Euronext Amsterdam","code":"NL","flag":"🇳🇱","country":"Pays-Bas","currency":"EUR","tz":"Europe/Amsterdam","hours":"09:00 – 17:40","index":"AEX","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear Nederland","penalty":"CSDR — pénalités quotidiennes"}},{"mic":"XBRU","place":"Euronext Brussels","code":"BE","flag":"🇧🇪","country":"Belgique","currency":"EUR","tz":"Europe/Brussels","hours":"09:00 – 17:30","index":"BEL 20","settlement":null},{"mic":"XLIS","place":"Euronext Lisbon","code":"PT","flag":"🇵🇹","country":"Portugal","currency":"EUR","tz":"Europe/Lisbon","hours":"08:00 – 16:30","index":"PSI 20","settlement":null},{"mic":"XDUB","place":"Euronext Dublin","code":"IE","flag":"🇮🇪","country":"Irlande","currency":"EUR","tz":"Europe/Dublin","hours":"08:00 – 16:30","index":"ISEQ 20","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Euroclear Bank","penalty":"CSDR — pénalités quotidiennes"}},{"mic":"XETR","place":"Xetra Francfort","code":"DE","flag":"🇩🇪","country":"Allemagne","currency":"EUR","tz":"Europe/Berlin","hours":"09:00 – 17:30","index":"DAX 40","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Clearstream","penalty":"CSDR — pénalités quotidiennes"}},{"mic":"XMIL","place":"Borsa Italiana","code":"IT","flag":"🇮🇹","country":"Italie","currency":"EUR","tz":"Europe/Rome","hours":"09:00 – 17:30","index":"FTSE MIB","settlement":null},{"mic":"XMAD","place":"Bolsa de Madrid","code":"ES","flag":"🇪🇸","country":"Espagne","currency":"EUR","tz":"Europe/Madrid","hours":"09:00 – 17:30","index":"IBEX 35","settlement":null},{"mic":"XLUX","place":"Bourse de Luxembourg","code":"LU","flag":"🇱🇺","country":"Luxembourg","currency":"EUR","tz":"Europe/Luxembourg","hours":"09:00 – 17:35","index":"LuxX","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"Clearstream","penalty":"CSDR — pénalités quotidiennes"}},{"mic":"XWBO","place":"Wiener Börse","code":"AT","flag":"🇦🇹","country":"Autriche","currency":"EUR","tz":"Europe/Vienna","hours":"09:00 – 17:35","index":"ATX","settlement":null},{"mic":"XLON","place":"London Stock Exchange","code":"GB","flag":"🇬🇧","country":"Royaume-Uni","currency":"GBP","tz":"Europe/London","hours":"08:00 – 16:30","index":"FTSE 100","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"CREST","penalty":"Régime britannique"}},{"mic":"XSWX","place":"SIX Swiss Exchange","code":"CH","flag":"🇨🇭","country":"Suisse","currency":"CHF","tz":"Europe/Zurich","hours":"09:00 – 17:20","index":"SMI","settlement":{"cycle":"T+2","shift":"11/10/2027","csd":"SIX SIS","penalty":"Régime suisse"}},{"mic":"XSTO","place":"Nasdaq Stockholm","code":"SE","flag":"🇸🇪","country":"Suède","currency":"SEK","tz":"Europe/Stockholm","hours":"09:00 – 17:25","index":"OMXS30","settlement":null},{"mic":"XCSE","place":"Nasdaq Copenhague","code":"DK","flag":"🇩🇰","country":"Danemark","currency":"DKK","tz":"Europe/Copenhagen","hours":"09:00 – 16:55","index":"OMXC25","settlement":null},{"mic":"XOSL","place":"Oslo Børs","code":"NO","flag":"🇳🇴","country":"Norvège","currency":"NOK","tz":"Europe/Oslo","hours":"09:00 – 16:20","index":"OBX","settlement":null},{"mic":"XHEL","place":"Nasdaq Helsinki","code":"FI","flag":"🇫🇮","country":"Finlande","currency":"EUR","tz":"Europe/Helsinki","hours":"10:00 – 18:25","index":"OMXH25","settlement":null},{"mic":"XNAS","place":"Nasdaq","code":"US","flag":"🇺🇸","country":"États-Unis","currency":"USD","tz":"America/New_York","hours":"09:30 – 16:00","index":"Nasdaq 100","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"DTCC","penalty":"SEC 15c6-1"}},{"mic":"XNYS","place":"New York Stock Exchange","code":"US","flag":"🇺🇸","country":"États-Unis","currency":"USD","tz":"America/New_York","hours":"09:30 – 16:00","index":"S&P 500","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"DTCC","penalty":"SEC 15c6-1"}},{"mic":"XTSE","place":"Toronto Stock Exchange","code":"CA","flag":"🇨🇦","country":"Canada","currency":"CAD","tz":"America/Toronto","hours":"09:30 – 16:00","index":"S&P/TSX 60","settlement":{"cycle":"T+1","shift":"Depuis le 27/05/2024","csd":"CDS","penalty":"Régime canadien"}},{"mic":"XTKS","place":"Tokyo Stock Exchange","code":"JP","flag":"🇯🇵","country":"Japon","currency":"JPY","tz":"Asia/Tokyo","hours":"09:00 – 15:00","index":"Nikkei 225","settlement":null},{"mic":"XASX","place":"Australian Securities Exchange","code":"AU","flag":"🇦🇺","country":"Australie","currency":"AUD","tz":"Australia/Sydney","hours":"10:00 – 16:00","index":"S&P/ASX 200","settlement":null}];

  var byMic = {}, byCountry = {};
  P.forEach(function (p) {
    byMic[p.mic] = p;
    (byCountry[p.code] = byCountry[p.code] || []).push(p);
  });

  var CONTINENT = { US: 'Amérique du Nord', CA: 'Amérique du Nord', JP: 'Asie-Pacifique', AU: 'Asie-Pacifique' };
  // Sections classées par ordre alphabétique.
  var CONTINENT_ORDER = ['Amérique du Nord', 'Asie-Pacifique', 'Europe'];

  function continentOf(code) { return CONTINENT[code] || 'Europe'; }

  window.PlacesService = {
    /** Toutes les places du référentiel applicatif. */
    all: function () { return P.slice(); },

    /** Une place par son code MIC. */
    getByMic: function (mic) { return byMic[String(mic).toUpperCase()] || null; },

    /** Les places d'un pays (ISO 3166 alpha-2). */
    byCountry: function (code) { return (byCountry[String(code).toUpperCase()] || []).slice(); },

    /** Les codes MIC, triés. */
    mics: function () { return P.map(function (p) { return p.mic; }).sort(); },

    /** Les pays porteurs d'au moins une place, avec leur continent. */
    countries: function () {
      var seen = {}, out = [];
      P.forEach(function (p) {
        if (seen[p.code]) return;
        seen[p.code] = true;
        out.push({ code: p.code, flag: p.flag, country: p.country, continent: continentOf(p.code) });
      });
      return out;
    },

    /** Les pays groupés par continent, chaque groupe trié par nom. */
    byContinent: function () {
      var cs = this.countries();
      return CONTINENT_ORDER
        .map(function (name) {
          return {
            continent: name,
            countries: cs.filter(function (c) { return c.continent === name; })
              .sort(function (a, b) { return a.country.localeCompare(b.country, 'fr'); })
          };
        })
        .filter(function (g) { return g.countries.length > 0; });
    },

    /** Les places dont le cycle de dénouement est renseigné. */
    withSettlement: function () { return P.filter(function (p) { return !!p.settlement; }); },

    continentOf: continentOf,
    continentOrder: function () { return CONTINENT_ORDER.slice(); },
    count: P.length
  };
})();
