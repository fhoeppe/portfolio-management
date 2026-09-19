using System.Reflection;
using System.Text.Json;

using PortfolioManagement.Domain.Securities;

namespace PortfolioManagement.Infrastructure.Securities;

/// <summary>
/// Catalogue d'amorçage, porté par l'assembly.
/// </summary>
/// <remarks>
/// Ces quinze titres sont ceux du prototype, repris tels quels — à une correction près : dix de
/// leurs ISINs avaient une clé de contrôle fausse, et le front les écarte à la lecture d'un
/// catalogue déposé. Les clés ont été recalculées, faute de quoi l'écran aurait affiché quatre
/// titres sur quinze dès qu'il aurait cessé de lire le catalogue embarqué.
/// </remarks>
public static class SecuritySeed
{
    private const string ResourceName = "PortfolioManagement.Infrastructure.Seed.securities.seed.json";

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    /// <summary>Lit le catalogue d'amorçage.</summary>
    /// <exception cref="InvalidOperationException">La ressource embarquée est absente ou illisible.</exception>
    public static IReadOnlyList<Security> Load()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Ressource d'amorçage introuvable : {ResourceName}.");

        return JsonSerializer.Deserialize<List<Security>>(stream, Options)
            ?? throw new InvalidOperationException("Catalogue d'amorçage illisible.");
    }
}
