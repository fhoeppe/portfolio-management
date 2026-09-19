using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using PortfolioManagement.Domain.Market;

namespace PortfolioManagement.Infrastructure.Market;

/// <summary>
/// Compositions d'amorçage, portées par l'assembly.
/// </summary>
/// <remarks>
/// <para>
/// C'est le même fichier que celui que l'exploitant peut déposer sur le serveur statique, repris
/// tel quel. Les deux sources servent le même format — c'est ce qui permet de basculer de l'un à
/// l'autre en ne changeant qu'une URL côté front, et c'est ce qui rend la bascule vérifiable :
/// si les deux ne rendaient pas la même chose, la comparaison n'aurait aucune valeur.
/// </para>
/// <para>
/// Un mégaoctet dans l'assembly, et c'est assumé pour cette tranche : la donnée doit voyager avec
/// le binaire pour que l'API réponde quelque chose sans qu'on ait rien à déposer. Le jour où elle
/// vient d'un fournisseur sous licence, c'est cette classe qu'on remplace, pas le reste.
/// </para>
/// </remarks>
public static class IndexSeed
{
    private const string ResourceName = "PortfolioManagement.Infrastructure.Seed.indices.seed.json";

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    /// <summary>Enveloppe du fichier d'amorçage, telle qu'elle est écrite.</summary>
    /// <remarks>
    /// Un type de lecture distinct du domaine : le fichier porte des champs que le contrat ne
    /// décrit pas — une note de provenance de plusieurs paragraphes — et le domaine n'a pas à les
    /// connaître pour autant qu'on les ignore proprement.
    /// </remarks>
    private sealed record SeedEnvelope(
        [property: JsonPropertyName("version")] string? Version,
        [property: JsonPropertyName("source")] string? Source,
        [property: JsonPropertyName("asOf")] DateOnly? AsOf,
        [property: JsonPropertyName("indices")] List<MarketIndex>? Indices);

    /// <summary>Lit les compositions d'amorçage et leur provenance.</summary>
    /// <exception cref="InvalidOperationException">La ressource embarquée est absente ou illisible.</exception>
    public static (IndexFeedMetadata Metadata, IReadOnlyList<MarketIndex> Indices) Load()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Ressource d'amorçage introuvable : {ResourceName}.");

        var envelope = JsonSerializer.Deserialize<SeedEnvelope>(stream, Options)
            ?? throw new InvalidOperationException("Compositions d'amorçage illisibles.");

        return (
            new IndexFeedMetadata(envelope.Version, envelope.Source, envelope.AsOf),
            envelope.Indices ?? []);
    }
}
