using System.Net;
using System.Text.Json;

namespace PortfolioManagement.Tests.Market;

public sealed class IndexReadTests
{
    private static async Task<JsonElement> FeedAsync(HttpClient client, string query = "")
        => await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/market/indices" + query));

    private static List<string> KeysOf(JsonElement feed)
        => [.. feed.GetProperty("indices").EnumerateArray().Select(i => i.GetProperty("key").GetString()!)];

    [Fact]
    public async Task Sert_les_indices_et_leur_provenance()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/market/indices");
        var feed = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        // La provenance et la date d'arrêté ne sont pas décoratives : une composition d'indice qui
        // ne dit ni d'où elle vient ni de quand ne se vérifie pas.
        Assert.False(string.IsNullOrWhiteSpace(feed.GetProperty("source").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(feed.GetProperty("asOf").GetString()));
        Assert.Equal(28, feed.GetProperty("indices").GetArrayLength());
    }

    [Fact]
    public async Task Sert_la_composition_entiere_sans_pagination()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var feed = await FeedAsync(client);
        var membres = feed.GetProperty("indices").EnumerateArray()
            .Sum(i => i.GetProperty("members").GetArrayLength());

        // Le front remplace ce qu'il sait des compositions : une réponse tronquée le laisserait
        // recoller des morceaux, et une composition à moitié remplacée serait pire que l'ancienne.
        Assert.Equal(4291, membres);
    }

    [Theory]
    [InlineData("?key=cac40", 1)]
    [InlineData("?key=cac40&key=dax", 2)]
    [InlineData("?key=CAC40", 1)]
    [InlineData("?key=inconnu", 0)]
    public async Task Restreint_aux_cles_citees(string query, int attendu)
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        Assert.Equal(attendu, KeysOf(await FeedAsync(client, query)).Count);
    }

    [Fact]
    public async Task Restreint_a_une_zone()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var toutes = await FeedAsync(client);
        var zone = toutes.GetProperty("indices")[0].GetProperty("region").GetString()!;
        var filtre = await FeedAsync(client, "?region=" + Uri.EscapeDataString(zone));

        var regions = filtre.GetProperty("indices").EnumerateArray()
            .Select(i => i.GetProperty("region").GetString()).Distinct().ToList();

        Assert.Single(regions);
        Assert.Equal(zone, regions[0]);
        Assert.NotEmpty(filtre.GetProperty("indices").EnumerateArray());
    }

    [Fact]
    public async Task La_provenance_accompagne_meme_une_reponse_filtree()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var feed = await FeedAsync(client, "?key=cac40");

        // Filtrer restreint les indices, pas la provenance : un seul indice reste daté et sourcé.
        Assert.False(string.IsNullOrWhiteSpace(feed.GetProperty("source").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(feed.GetProperty("asOf").GetString()));
    }

    [Fact]
    public async Task Sert_un_indice_seul_avec_son_etiquette()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/market/indices/cac40");
        var index = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.Headers.ETag);
        Assert.Equal("cac40", index.GetProperty("key").GetString());
        Assert.Equal("CAC 40", index.GetProperty("name").GetString());
        Assert.Equal(40, index.GetProperty("count").GetInt32());
        Assert.NotEmpty(index.GetProperty("members").EnumerateArray());
    }

    /// <summary>L'étiquette vient du contenu : relue à l'identique, elle ne bouge pas.</summary>
    [Fact]
    public async Task L_etiquette_est_stable_d_une_lecture_a_l_autre()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var une = await client.GetAsync("/v1/market/indices/cac40");
        var deux = await client.GetAsync("/v1/market/indices/cac40");

        Assert.Equal(une.Headers.ETag!.ToString(), deux.Headers.ETag!.ToString());
    }

    /// <summary>Deux indices distincts ne partagent pas leur étiquette.</summary>
    [Fact]
    public async Task Deux_indices_ont_des_etiquettes_distinctes()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var cac = await client.GetAsync("/v1/market/indices/cac40");
        var sx5e = await client.GetAsync("/v1/market/indices/sx5e");

        Assert.NotEqual(cac.Headers.ETag!.ToString(), sx5e.Headers.ETag!.ToString());
    }

    [Fact]
    public async Task Accepte_la_cle_quelle_que_soit_la_casse()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/v1/market/indices/CAC40")).StatusCode);
    }

    [Fact]
    public async Task Rend_404_sur_une_cle_inconnue()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/market/indices/nexistepas");
        var probleme = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("nexistepas", probleme.GetProperty("detail").GetString());
    }

    /// <summary>
    /// Le même indice, servi par la collection et par le détail, dit la même chose.
    /// </summary>
    /// <remarks>
    /// C'est la seule raison d'être de l'opération unitaire : relire un indice sans retélécharger
    /// les vingt-sept autres. Si les deux divergeaient, elle deviendrait un piège.
    /// </remarks>
    [Fact]
    public async Task Collection_et_detail_servent_la_meme_composition()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var viaCollection = (await FeedAsync(client, "?key=cac40")).GetProperty("indices")[0];
        var viaDetail = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/market/indices/cac40"));

        Assert.Equal(viaCollection.GetRawText(), viaDetail.GetRawText());
    }

    // ── Liste abrégée ──────────────────────────────────────────────────────────────────────

    private static async Task<JsonElement> SummariesAsync(HttpClient client, string query = "")
        => await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/market/indices2" + query));

    [Fact]
    public async Task Liste_abregee_sert_les_memes_indices_sans_composition()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var abregee = await SummariesAsync(client);
        var complete = await FeedAsync(client);

        Assert.Equal(KeysOf(complete), KeysOf(abregee));
        // Le point de l'opération : aucune entrée ne porte sa composition.
        Assert.All(
            abregee.GetProperty("indices").EnumerateArray(),
            i => Assert.False(i.TryGetProperty("members", out _)));
    }

    [Fact]
    public async Task Liste_abregee_garde_la_provenance_et_le_taux_de_couverture()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var abregee = await SummariesAsync(client);
        var cac = abregee.GetProperty("indices").EnumerateArray()
            .First(i => i.GetProperty("key").GetString() == "cac40");

        // La provenance vaut pour la liste abrégée comme pour la composition : c'est la même
        // donnée vue de plus loin.
        Assert.False(string.IsNullOrWhiteSpace(abregee.GetProperty("source").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(abregee.GetProperty("asOf").GetString()));

        Assert.Equal("CAC 40", cac.GetProperty("name").GetString());
        Assert.Equal(40, cac.GetProperty("count").GetInt32());
        // Sans `memberCount`, retirer les membres retirerait aussi le moyen de calculer la part
        // couverte — ce que les écrans affichent.
        Assert.Equal(40, cac.GetProperty("memberCount").GetInt32());
    }

    [Fact]
    public async Task Liste_abregee_annonce_une_couverture_partielle()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var spx = (await SummariesAsync(client)).GetProperty("indices").EnumerateArray()
            .First(i => i.GetProperty("key").GetString() == "spx");

        // Le S&P 500 est le cas qui justifie les deux compteurs : 500 valeurs à l'indice, moins
        // que cela de lignes détenues.
        Assert.Equal(500, spx.GetProperty("count").GetInt32());
        Assert.True(spx.GetProperty("memberCount").GetInt32() < spx.GetProperty("count").GetInt32());
    }

    [Fact]
    public async Task Liste_abregee_restreint_a_une_zone()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var europe = await SummariesAsync(client, "?region=Europe%20continentale");
        var regions = europe.GetProperty("indices").EnumerateArray()
            .Select(i => i.GetProperty("region").GetString()).Distinct().ToList();

        Assert.Equal(["Europe continentale"], regions);
        Assert.Contains("cac40", KeysOf(europe));
        Assert.DoesNotContain("spx", KeysOf(europe));
    }

    [Fact]
    public async Task Liste_abregee_rend_tout_sans_critere()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        // `region` est facultatif, et l'appel sans critère est l'usage principal : c'est ainsi que
        // le front demande la liste au démarrage.
        Assert.Equal(28, KeysOf(await SummariesAsync(client)).Count);
    }

    [Fact]
    public async Task Liste_abregee_ignore_un_filtre_par_cle()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        // `key` n'est pas un critère de cette opération : le contrat n'en décrit qu'un. Un
        // paramètre étranger est ignoré, il ne restreint rien et ne fait pas échouer l'appel —
        // c'est ce que le client doit pouvoir constater plutôt que de croire à un filtre muet.
        Assert.Equal(28, KeysOf(await SummariesAsync(client, "?key=cac40")).Count);
    }

    // ── Fraîcheur ──────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("/v1/market/indices2")]
    [InlineData("/v1/market/indices/cac40")]
    public async Task Annonce_cinq_minutes_de_fraicheur(string chemin)
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync(chemin);
        var cache = response.Headers.CacheControl;

        Assert.NotNull(cache);
        Assert.Equal(TimeSpan.FromMinutes(5), cache!.MaxAge);
        // `private` et non `public` : la réponse n'est servie qu'à un porteur de jeton, un cache
        // partagé n'a pas à en garder copie pour la rendre au suivant.
        Assert.True(cache.Private);
        Assert.False(cache.Public);
    }

    [Fact]
    public async Task La_composition_garde_son_etiquette_avec_la_fraicheur()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/market/indices/cac40");

        // Les deux en-têtes répondent à deux questions distinctes — « laquelle » et « pour combien
        // de temps » — et poser la seconde ne doit pas faire disparaître la première.
        Assert.NotNull(response.Headers.ETag);
        Assert.Equal(TimeSpan.FromMinutes(5), response.Headers.CacheControl!.MaxAge);
    }
}
