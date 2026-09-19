using System.Net;

namespace PortfolioManagement.Tests.Securities;

public sealed class SecurityReadTests
{
    [Fact]
    public async Task Sert_le_catalogue_amorce()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/securities?pageSize=200");
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(15, body.GetProperty("total").GetInt32());
        Assert.Equal(15, body.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task Tous_les_isin_du_catalogue_sont_valides()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var body = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/securities?pageSize=200"));

        // Le catalogue livré ne peut pas contenir ce que l'API refuserait à l'écriture : le front
        // écarte les ISIN de clé fausse à la lecture, et un référentiel qui en sert n'affiche
        // qu'une partie de lui-même.
        foreach (var item in body.GetProperty("items").EnumerateArray())
        {
            var isin = item.GetProperty("isin").GetString();
            Assert.True(
                Domain.Securities.Isin.IsValid(isin),
                $"{item.GetProperty("ticker").GetString()} porte un ISIN de clé fausse : {isin}");
        }
    }

    [Fact]
    public async Task Pagine()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var first = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/securities?page=1&pageSize=4"));
        var second = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/securities?page=2&pageSize=4"));

        Assert.Equal(4, first.GetProperty("items").GetArrayLength());
        Assert.Equal(15, first.GetProperty("total").GetInt32());
        Assert.NotEqual(
            first.GetProperty("items")[0].GetProperty("id").GetString(),
            second.GetProperty("items")[0].GetProperty("id").GetString());
    }

    [Theory]
    [InlineData("mic=XPAR", 4)]
    [InlineData("mic=xpar", 4)]
    [InlineData("q=lvmh", 1)]
    [InlineData("q=FR0000120073", 1)]
    [InlineData("tradable=true", 15)]
    [InlineData("tradable=false", 0)]
    [InlineData("followed=true", 4)]
    [InlineData("followed=false", 11)]
    // Les deux listes de l'écran Titres, telles que le contrat les décrit.
    [InlineData("tradable=true&followed=false", 11)]
    [InlineData("followed=true&mic=OTC", 3)]
    public async Task Filtre(string query, int expected)
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var body = await ApiFactory.ReadJsonAsync(await client.GetAsync($"/v1/securities?{query}&pageSize=200"));

        Assert.Equal(expected, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task Les_deux_listes_de_l_ecran_partitionnent_le_referentiel()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var negociables = await ApiFactory.ReadJsonAsync(
            await client.GetAsync("/v1/securities?tradable=true&followed=false&pageSize=200"));
        var suivis = await ApiFactory.ReadJsonAsync(await client.GetAsync("/v1/securities?followed=true&pageSize=200"));

        var tickersNegociables = negociables.GetProperty("items").EnumerateArray()
            .Select(s => s.GetProperty("ticker").GetString()!).ToHashSet(StringComparer.Ordinal);
        var tickersSuivis = suivis.GetProperty("items").EnumerateArray()
            .Select(s => s.GetProperty("ticker").GetString()!).ToHashSet(StringComparer.Ordinal);

        // Les deux listes sont disjointes, et elles couvrent tout le référentiel : un titre est
        // négociable ou tenu en veille, jamais les deux, jamais ni l'un ni l'autre — tant qu'aucun
        // titre n'est écarté par le référentiel.
        Assert.Empty(tickersNegociables.Intersect(tickersSuivis, StringComparer.Ordinal));
        Assert.Equal(15, tickersNegociables.Count + tickersSuivis.Count);
        Assert.Equal(["HYBND", "INFRA", "PRVE", "SX5E"], tickersSuivis.Order(StringComparer.Ordinal));
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=abc")]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=201")]
    [InlineData("tradable=peut-être")]
    [InlineData("followed=peut-être")]
    public async Task Refuse_un_critere_illisible(string query)
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync($"/v1/securities?{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Sert_un_titre_avec_son_etag()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/securities/SEC-AI");
        var body = await ApiFactory.ReadJsonAsync(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("\"1\"", response.Headers.ETag?.ToString());
        Assert.Equal("Air Liquide", body.GetProperty("name").GetString());
        Assert.Equal("Euronext Paris", body.GetProperty("place").GetString());
        Assert.Equal(37, body.GetProperty("held").GetInt32());
    }

    [Fact]
    public async Task Rend_404_sur_un_identifiant_inconnu()
    {
        using var app = new ApiFactory();
        using var client = app.CreateApiClient();

        var response = await client.GetAsync("/v1/securities/SEC-INCONNU");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
