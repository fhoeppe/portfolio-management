using FluentValidation;

using PortfolioManagement.Domain.Securities;
using PortfolioManagement.Infrastructure.Securities;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>Point d'entrée du module Titres : ce qu'il enregistre, ce qu'il expose.</summary>
/// <remarks>
/// Un module se branche par deux appels et se débranche en les retirant. Les cinq autres familles
/// du contrat — Comptes, Positions, Transactions, Marché, Calendriers — suivront la même forme,
/// et c'est ce qui permettra à <c>Program.cs</c> de rester une liste.
/// </remarks>
public static class SecuritiesModule
{
    /// <summary>Enregistre le référentiel et son contrôle de saisie.</summary>
    public static IServiceCollection AddSecuritiesModule(this IServiceCollection services)
    {
        // Singleton : le référentiel EST l'état du processus pour cette tranche. Le jour où une base
        // le remplace, c'est cette ligne qui change de portée en même temps que d'implémentation.
        services.AddSingleton<ISecurityRepository>(_ => new InMemorySecurityRepository(SecuritySeed.Load()));
        services.AddSingleton<IValidator<SecurityInput>, SecurityInputValidator>();

        return services;
    }
}
