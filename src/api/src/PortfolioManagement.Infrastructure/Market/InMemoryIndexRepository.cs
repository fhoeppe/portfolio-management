using PortfolioManagement.Domain.Market;

namespace PortfolioManagement.Infrastructure.Market;

/// <summary>
/// Référentiel des indices tenu en mémoire, amorcé des compositions embarquées.
/// </summary>
/// <remarks>
/// Aucun verrou, contrairement au référentiel des titres : rien n'écrit ici. Les collections sont
/// constituées une fois à la construction et ne bougent plus, ce qui les rend partageables entre
/// requêtes sans précaution. Le jour où une écriture apparaîtra, c'est cette absence de verrou
/// qu'il faudra reprendre — et elle est visible, ce qui vaut mieux qu'un verrou posé d'avance
/// pour un besoin qui n'existe pas.
/// </remarks>
public sealed class InMemoryIndexRepository : IIndexRepository
{
    private readonly IReadOnlyList<MarketIndex> _ordered;
    private readonly Dictionary<string, MarketIndex> _byKey;

    /// <summary>Construit le référentiel à partir d'une livraison.</summary>
    /// <param name="metadata">Provenance et date d'arrêté de la livraison.</param>
    /// <param name="indices">Indices, dans l'ordre où ils doivent être servis.</param>
    public InMemoryIndexRepository(IndexFeedMetadata metadata, IEnumerable<MarketIndex> indices)
    {
        Metadata = metadata;
        _ordered = [.. indices];
        // Une clé d'indice se compare sans égard à la casse : le contrat la veut en minuscules,
        // mais refuser `CAC40` à la lecture n'aiderait personne.
        _byKey = _ordered
            .GroupBy(i => i.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
    }

    /// <inheritdoc />
    public IndexFeedMetadata Metadata { get; }

    /// <inheritdoc />
    public IReadOnlyList<MarketIndex> List() => _ordered;

    /// <inheritdoc />
    public MarketIndex? Find(string key) =>
        string.IsNullOrWhiteSpace(key) ? null : _byKey.GetValueOrDefault(key.Trim());
}
