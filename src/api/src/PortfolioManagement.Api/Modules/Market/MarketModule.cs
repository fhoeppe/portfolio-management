using PortfolioManagement.Domain.Market;
using PortfolioManagement.Infrastructure.Market;

namespace PortfolioManagement.Api.Modules.Market;

/// <summary>Point d'entrée du module Marché : ce qu'il enregistre, ce qu'il expose.</summary>
/// <remarks>
/// Même forme que le module Titres — deux appels pour le brancher, deux lignes retirées pour le
/// débrancher. Il ne porte pour l'instant que les indices ; les cours et les taux de change
/// viendront s'y ajouter sans que <c>Program.cs</c> en sache plus.
/// </remarks>
public static class MarketModule
{
    /// <summary>Enregistre le référentiel des indices.</summary>
    public static IServiceCollection AddMarketModule(this IServiceCollection services)
    {
        // Le fichier d'amorçage est lu une fois, à l'enregistrement : un mégaoctet de JSON désérialisé
        // à chaque requête coûterait plus cher que tout le reste de l'API réunie.
        services.AddSingleton<IIndexRepository>(_ =>
        {
            var (metadata, indices) = IndexSeed.Load();
            return new InMemoryIndexRepository(metadata, indices);
        });

        return services;
    }
}
