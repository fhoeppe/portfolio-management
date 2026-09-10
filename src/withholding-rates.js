// Barème officiel de retenue à la source sur dividendes, par pays de source.
// Taux légal interne et taux conventionnel maximal des conventions fiscales bilatérales.
// Source de référence : conventions OCDE et barèmes nationaux publiés.
(function () {
  if (window.WithholdingRates) return;

  var BASE = {
    FR: { flag: '🇫🇷', country: 'France',              legal: 12.8,   treaty: 12.8, recovery: 'Sans objet' },
    US: { flag: '🇺🇸', country: 'États-Unis',          legal: 30,     treaty: 15,   recovery: 'Formulaire W-8BEN' },
    DE: { flag: '🇩🇪', country: 'Allemagne',           legal: 26.375, treaty: 15,   recovery: 'Réclamation annuelle' },
    CH: { flag: '🇨🇭', country: 'Suisse',              legal: 35,     treaty: 15,   recovery: 'Réclamation annuelle' },
    NL: { flag: '🇳🇱', country: 'Pays-Bas',            legal: 15,     treaty: 15,   recovery: 'Sans objet' },
    IT: { flag: '🇮🇹', country: 'Italie',              legal: 26,     treaty: 15,   recovery: 'Réclamation annuelle' },
    ES: { flag: '🇪🇸', country: 'Espagne',             legal: 19,     treaty: 15,   recovery: 'Réclamation annuelle' },
    GB: { flag: '🇬🇧', country: 'Royaume-Uni',         legal: 0,      treaty: 0,    recovery: 'Sans objet' },
    LU: { flag: '🇱🇺', country: 'Luxembourg',          legal: 15,     treaty: 15,   recovery: 'Sans objet' },
    IE: { flag: '🇮🇪', country: 'Irlande',             legal: 25,     treaty: 15,   recovery: 'Exonération à la source' },
    CA: { flag: '🇨🇦', country: 'Canada',              legal: 25,     treaty: 15,   recovery: 'Formulaire NR301' },
    BE: { flag: '🇧🇪', country: 'Belgique',            legal: 30,     treaty: 15,   recovery: 'Réclamation annuelle' },
    SE: { flag: '🇸🇪', country: 'Suède',               legal: 30,     treaty: 15,   recovery: 'Réclamation annuelle' },
    DK: { flag: '🇩🇰', country: 'Danemark',            legal: 27,     treaty: 15,   recovery: 'Réclamation annuelle' },
    NO: { flag: '🇳🇴', country: 'Norvège',             legal: 25,     treaty: 15,   recovery: 'Réclamation annuelle' },
    FI: { flag: '🇫🇮', country: 'Finlande',            legal: 30,     treaty: 15,   recovery: 'Réclamation annuelle' },
    AT: { flag: '🇦🇹', country: 'Autriche',            legal: 27.5,   treaty: 15,   recovery: 'Réclamation annuelle' },
    PT: { flag: '🇵🇹', country: 'Portugal',            legal: 28,     treaty: 15,   recovery: 'Réclamation annuelle' },
    JP: { flag: '🇯🇵', country: 'Japon',               legal: 20.42,  treaty: 10,   recovery: 'Formulaire 17' },
    AU: { flag: '🇦🇺', country: 'Australie',           legal: 30,     treaty: 15,   recovery: 'Réclamation annuelle' }
  };

  // Convention plus favorable selon le pays de résidence du bénéficiaire.
  var CONTINENT = {
    FR: 'Europe', DE: 'Europe', CH: 'Europe', NL: 'Europe', IT: 'Europe', ES: 'Europe',
    GB: 'Europe', LU: 'Europe', IE: 'Europe', BE: 'Europe', SE: 'Europe', DK: 'Europe',
    NO: 'Europe', FI: 'Europe', AT: 'Europe', PT: 'Europe',
    US: 'Amérique du Nord', CA: 'Amérique du Nord',
    JP: 'Asie-Pacifique', AU: 'Asie-Pacifique'
  };

  // Sections classées par ordre alphabétique.
  var CONTINENT_ORDER = ['Amérique du Nord', 'Asie-Pacifique', 'Europe'];

  var TREATY_OVERRIDES = {
    LU: { CH: 15, DE: 15, US: 15 },
    BE: { FR: 12.8, NL: 15 },
    CH: { US: 15, DE: 15 }
  };

  window.WithholdingRates = {
    // Barème officiel pour un pays de résidence donné.
    forResidence: function (residence) {
      var over = TREATY_OVERRIDES[residence] || {};
      return Object.keys(BASE).map(function (code) {
        var b = BASE[code];
        return {
          code: code,
          flag: b.flag,
          country: b.country,
          continent: CONTINENT[code] || 'Autres',
          legal: b.legal,
          treaty: over[code] !== undefined ? over[code] : b.treaty,
          recovery: b.recovery
        };
      }).sort(function (a, b) {
        var ia = CONTINENT_ORDER.indexOf(a.continent), ib = CONTINENT_ORDER.indexOf(b.continent);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        return a.country.localeCompare(b.country, 'fr');
      });
    },

    // Taux d'un pays isolé.
    get: function (code, residence) {
      return this.forResidence(residence).find(function (r) { return r.code === code; }) || null;
    },

    // Retenue effectivement appliquée : conventionnelle si le certificat est valide, légale sinon.
    applied: function (rate, certified) {
      return certified ? rate.treaty : rate.legal;
    },

    codes: function () { return Object.keys(BASE); },

    // Pays groupés par continent, chaque groupe trié par nom.
    byContinent: function (residence) {
      var rows = this.forResidence(residence);
      return CONTINENT_ORDER
        .map(function (name) {
          return { continent: name, rows: rows.filter(function (r) { return r.continent === name; }) };
        })
        .filter(function (g) { return g.rows.length > 0; });
    }
  };
})();
