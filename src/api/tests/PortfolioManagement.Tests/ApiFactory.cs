using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace PortfolioManagement.Tests;

/// <summary>
/// Héberge l'API en mémoire, référentiel amorcé à neuf.
/// </summary>
/// <remarks>
/// Une instance par test, et non une partagée par classe : le référentiel est l'état du processus,
/// et deux tests qui écrivent dans le même se contaminent dans un ordre que rien ne garantit. Le
/// coût d'un hôte par test est le prix de tests qui disent la vérité quand on les lance seuls.
/// </remarks>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <inheritdoc />
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // L'authentification de développement : le pipeline reste en place, le jeton n'est pas
        // réclamé. C'est la configuration que les tests doivent éprouver, puisque c'est celle sous
        // laquelle le front travaille.
        builder.UseEnvironment("Development");
    }

    /// <summary>Un client prêt à parler au contrat.</summary>
    public HttpClient CreateApiClient()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return client;
    }

    /// <summary>Sérialise un corps de requête.</summary>
    public static StringContent Body(object value, string mediaType = "application/json") =>
        new(JsonSerializer.Serialize(value, Json), Encoding.UTF8, mediaType);

    /// <summary>Sérialise un corps déjà écrit en JSON.</summary>
    public static StringContent Raw(string json, string mediaType = "application/json") =>
        new(json, Encoding.UTF8, mediaType);

    /// <summary>Lit un corps de réponse en arbre JSON.</summary>
    public static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
}
