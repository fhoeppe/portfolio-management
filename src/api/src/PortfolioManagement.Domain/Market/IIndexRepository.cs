namespace PortfolioManagement.Domain.Market;

/// <summary>Accès au référentiel des indices de référence.</summary>
/// <remarks>
/// En lecture seule, et ce n'est pas une étape : une composition d'indice n'est pas une donnée que
/// cette application produit, c'est une donnée qu'elle reçoit d'un fournisseur. Le jour où elle
/// viendra d'une base ou d'un flux, c'est l'implémentation qui change, pas ce contrat.
/// </remarks>
public interface IIndexRepository
{
    /// <summary>Provenance et date d'arrêté de la livraison en place.</summary>
    IndexFeedMetadata Metadata { get; }

    /// <summary>Tous les indices, dans l'ordre de la livraison.</summary>
    IReadOnlyList<MarketIndex> List();

    /// <summary>Un indice par sa clé, ou <c>null</c>. La casse n'entre pas en compte.</summary>
    MarketIndex? Find(string key);
}
