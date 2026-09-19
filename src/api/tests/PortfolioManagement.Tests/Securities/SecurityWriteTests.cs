using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace PortfolioManagement.Tests.Securities;

public sealed class SecurityWriteTests
{
    private static readonly object ValidInput = new
    {
        ticker = "asml",
        name = "ASML Holding",
        mic = "XAMS",
        currency = "EUR",
        isin = "NL0010273215",
        assetClass = "Action",
        cap = 5,
    };

    private static async Task<string> ETagOf(HttpClient client, string id)
    {
        var response = await client.GetAsync($"/v1/securities/{id}");
        return response.Headers.ETag!.ToString();
    }

    private static HttpRequestMessage Patch(string id, string json, string etag)
    {
        var request = new HttpRequestMessage(HttpMethod.Patch, $"/v1/securities/{id}")
        {
            Content = ApiFactory.Raw(json, "application/merge-patch+json"),
        };
        request.Headers.TryAddWithoutValidation("If-Match", etag);
        return request;
    }

    // ── Création ───────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Inscrit_un_titre_et_le_situe()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.PostAsync("/v1/securities", ApiFactory.Body(ValidInput));
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("/v1/securities/SEC-ASML", response.Headers.Location?.ToString());
        Assert.Equal("\"1\"", response.Headers.ETag?.ToString());

        // Le mnémonique est normalisé en capitales à l'entrée, et le nom de la place est dérivé du
        // MIC : ni l'un ni l'autre n'est laissé à la main du client.
        Assert.Equal("ASML", body.GetProperty("ticker").GetString());
        Assert.Equal("Euronext Amsterdam", body.GetProperty("place").GetString());
    }

    [Fact]
    public async Task Refuse_un_isin_de_cle_fausse()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.PostAsync(
            "/v1/securities",
            ApiFactory.Body(new { ticker = "TEST", name = "Essai", mic = "XPAR", currency = "EUR", isin = "FR0000120074" }));
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("/isin", body.GetProperty("errors")[0].GetProperty("pointer").GetString());
    }

    [Fact]
    public async Task Rapporte_chaque_champ_obligatoire_manquant()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.PostAsync("/v1/securities", ApiFactory.Raw("""{"ticker":"","name":"","mic":"","currency":""}"""));
        var body = await ApiFactory.ReadJsonAsync(response);

        // Les quatre, pas le premier : un formulaire qui ne reçoit qu'une erreur à la fois se
        // corrige en quatre allers-retours. C'est aussi la régression que produit un `When` posé
        // sans portée sur une chaîne de règles — il éteint le `NotEmpty` qu'il suit.
        var pointers = body.GetProperty("errors").EnumerateArray()
            .Select(e => e.GetProperty("pointer").GetString())
            .ToList();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal(["/ticker", "/name", "/mic", "/currency"], pointers);
    }

    [Fact]
    public async Task Refuse_un_isin_deja_porte_sur_la_meme_place()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.PostAsync(
            "/v1/securities",
            ApiFactory.Body(new { ticker = "AIR", name = "Air Liquide (doublon)", mic = "XPAR", currency = "EUR", isin = "FR0000120073" }));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Accepte_le_meme_isin_sur_une_autre_place()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.PostAsync(
            "/v1/securities",
            ApiFactory.Body(new { ticker = "AIL", name = "Air Liquide — Xetra", mic = "XETR", currency = "EUR", isin = "FR0000120073" }));

        // Une même valeur cotée sur deux places fait deux lignes de référentiel : c'est le couple
        // ISIN + MIC qui identifie une ligne, jamais l'ISIN seul.
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Rejoue_la_reponse_d_une_cle_d_idempotence()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var key = Guid.NewGuid().ToString();
        client.DefaultRequestHeaders.Add("Idempotency-Key", key);

        var first = await client.PostAsync("/v1/securities", ApiFactory.Body(ValidInput));
        var second = await client.PostAsync("/v1/securities", ApiFactory.Body(ValidInput));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);
        Assert.Equal(first.Headers.Location, second.Headers.Location);
        Assert.True(second.Headers.Contains("Idempotent-Replay"));

        var total = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/securities?pageSize=200"));
        Assert.Equal(16, total.GetProperty("total").GetInt32());
    }

    // ── Concurrence ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Exige_un_if_match_sur_toute_ecriture()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var patch = await client.SendAsync(new HttpRequestMessage(HttpMethod.Patch, "/v1/securities/SEC-AI")
        {
            Content = ApiFactory.Raw("""{"note":"x"}""", "application/merge-patch+json"),
        });
        var put = await client.PutAsync("/v1/securities/SEC-AI", ApiFactory.Body(ValidInput));
        var delete = await client.DeleteAsync("/v1/securities/SEC-AI");

        Assert.Equal(HttpStatusCode.PreconditionRequired, patch.StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionRequired, put.StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionRequired, delete.StatusCode);
    }

    [Fact]
    public async Task Refuse_une_ecriture_sur_une_version_perimee()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var stale = await ETagOf(client, "SEC-AI");
        await client.SendAsync(Patch("SEC-AI", """{"note":"première écriture"}""", stale));

        var second = await client.SendAsync(Patch("SEC-AI", """{"note":"seconde écriture"}""", stale));

        Assert.Equal(HttpStatusCode.PreconditionFailed, second.StatusCode);
    }

    [Fact]
    public async Task Incremente_l_etag_a_chaque_ecriture()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var first = await client.SendAsync(Patch("SEC-AI", """{"note":"un"}""", await ETagOf(client, "SEC-AI")));
        var second = await client.SendAsync(Patch("SEC-AI", """{"note":"deux"}""", first.Headers.ETag!.ToString()));

        Assert.Equal("\"2\"", first.Headers.ETag?.ToString());
        Assert.Equal("\"3\"", second.Headers.ETag?.ToString());
    }

    // ── Merge patch ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Le_patch_remplace_ce_qu_il_cite_et_efface_ce_qu_il_met_a_null()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.SendAsync(Patch(
            "SEC-AI",
            """{"note":"Revue 2026 : conservée.","esg":null}""",
            await ETagOf(client, "SEC-AI")));
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Revue 2026 : conservée.", body.GetProperty("note").GetString());
        // Effacé : absent du corps, puisque les nuls ne sont pas sérialisés.
        Assert.False(body.TryGetProperty("esg", out _));
        // Non cité : intact.
        Assert.Equal("A− (S&P)", body.GetProperty("rating").GetString());
    }

    [Fact]
    public async Task Le_patch_refuse_les_champs_non_modifiables_et_inconnus()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.SendAsync(Patch(
            "SEC-AI",
            """{"ticker":"XX","held":99,"couleur":"bleu"}""",
            await ETagOf(client, "SEC-AI")));
        var body = await ApiFactory.ReadJsonAsync(response);

        var pointers = body.GetProperty("errors").EnumerateArray()
            .Select(e => e.GetProperty("pointer").GetString())
            .ToList();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal(["/ticker", "/held", "/couleur"], pointers);
    }

    [Fact]
    public async Task Le_patch_exige_le_bon_type_de_media()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var request = new HttpRequestMessage(HttpMethod.Patch, "/v1/securities/SEC-AI")
        {
            Content = ApiFactory.Raw("""{"note":"x"}""", "text/plain"),
        };
        request.Headers.TryAddWithoutValidation("If-Match", "\"1\"");

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, (await client.SendAsync(request)).StatusCode);
    }

    [Fact]
    public async Task Le_patch_ne_peut_pas_mener_a_un_etat_qu_un_put_aurait_refuse()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.SendAsync(Patch(
            "SEC-AI",
            """{"isin":"FR0000120074"}""",
            await ETagOf(client, "SEC-AI")));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    // ── Remplacement ───────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Le_put_remet_aux_defauts_ce_qu_il_omet()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var request = new HttpRequestMessage(HttpMethod.Put, "/v1/securities/SEC-AI")
        {
            Content = ApiFactory.Body(new { ticker = "AI", name = "Air Liquide", mic = "XPAR", currency = "EUR" }),
        };
        request.Headers.TryAddWithoutValidation("If-Match", await ETagOf(client, "SEC-AI"));

        var body = await ApiFactory.ReadJsonAsync(await client.SendAsync(request));

        Assert.False(body.TryGetProperty("rating", out _));
        Assert.False(body.TryGetProperty("esg", out _));
        // Le dérivé des positions, lui, ne se laisse pas remettre à zéro par une écriture.
        Assert.Equal(37, body.GetProperty("held").GetInt32());
    }

    // ── Retrait ────────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Refuse_de_retirer_un_titre_detenu()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/v1/securities/SEC-AI");
        request.Headers.TryAddWithoutValidation("If-Match", await ETagOf(client, "SEC-AI"));

        var response = await client.SendAsync(request);
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Contains("37", body.GetProperty("detail").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Retire_un_titre_que_rien_ne_reference()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/v1/securities/SEC-HYBND");
        request.Headers.TryAddWithoutValidation("If-Match", await ETagOf(client, "SEC-HYBND"));

        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(request)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/v1/securities/SEC-HYBND")).StatusCode);
    }

    // ── Veille ─────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// La mise en veille passe par le patch, et les deux listes s'en trouvent recomposées.
    /// </summary>
    /// <remarks>
    /// C'est le geste que l'écran Titres produit quand on verse une sélection dans les suivis, et
    /// le contrat sur lequel il s'appuie : le titre quitte les négociables et rejoint les suivis
    /// sans qu'aucune autre propriété ne bouge. Le vérifier sur un titre <b>hors</b> du périmètre
    /// livré est le cœur du cas — tant qu'on ne l'éprouve que sur les quatre titres déjà en veille,
    /// une partition recalculée côté client passerait pour juste.
    /// </remarks>
    [Fact]
    public async Task Met_un_titre_en_veille_et_recompose_les_deux_listes()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var etag = await ETagOf(client, "SEC-AI");
        var patched = await client.SendAsync(Patch("SEC-AI", """{"followed":true}""", etag));
        var body = await ApiFactory.ReadJsonAsync(patched);

        Assert.Equal(HttpStatusCode.OK, patched.StatusCode);
        Assert.True(body.GetProperty("followed").GetBoolean());
        // Le patch ne touche que ce qu'il nomme : la veille n'est pas un refus de négociation.
        Assert.True(body.GetProperty("tradable").GetBoolean());
        Assert.Equal("Air Liquide", body.GetProperty("name").GetString());

        var suivis = await Tickers(client, "followed=true");
        var negociables = await Tickers(client, "tradable=true&followed=false");

        Assert.Contains("AI", suivis);
        Assert.DoesNotContain("AI", negociables);
        Assert.Equal(5, suivis.Count);
    }

    /// <summary>La sortie de veille fait le chemin inverse, sur un titre que la graine y avait mis.</summary>
    [Fact]
    public async Task Sort_un_titre_de_veille()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var etag = await ETagOf(client, "SEC-INFRA");
        var patched = await client.SendAsync(Patch("SEC-INFRA", """{"followed":false}""", etag));

        Assert.Equal(HttpStatusCode.OK, patched.StatusCode);
        Assert.False((await ApiFactory.ReadJsonAsync(patched)).GetProperty("followed").GetBoolean());

        Assert.DoesNotContain("INFRA", await Tickers(client, "followed=true"));
        Assert.Contains("INFRA", await Tickers(client, "tradable=true&followed=false"));
    }

    /// <summary>
    /// Le plafond de concentration est un pourcentage, et le référentiel livré en use comme tel.
    /// </summary>
    /// <remarks>
    /// Les bornes 1-5 lisaient ce champ comme un rang de taille. Sept des quinze titres livrés
    /// portaient une valeur au-dessus, si bien qu'aucune écriture ne passait sur eux — pas même un
    /// patch qui ne nommait que la veille, puisque la fusion resoumet la représentation entière au
    /// même contrôle. Le cas est gardé ici pour que la borne ne se resserre pas par mégarde.
    /// </remarks>
    [Theory]
    [InlineData(35, HttpStatusCode.OK)]
    [InlineData(100, HttpStatusCode.OK)]
    [InlineData(101, HttpStatusCode.UnprocessableEntity)]
    public async Task Accepte_un_plafond_de_concentration_en_pourcentage(int cap, HttpStatusCode attendu)
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var etag = await ETagOf(client, "SEC-TSY10");
        var patched = await client.SendAsync(Patch("SEC-TSY10", $$"""{"cap":{{cap}}}""", etag));

        Assert.Equal(attendu, patched.StatusCode);
    }

    private static async Task<List<string>> Tickers(HttpClient client, string query)
    {
        var body = await ApiFactory.ReadJsonAsync(await client.GetAsync($"/v1/securities?pageSize=200&{query}"));
        return [.. body.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("ticker").GetString()!)];
    }
}
