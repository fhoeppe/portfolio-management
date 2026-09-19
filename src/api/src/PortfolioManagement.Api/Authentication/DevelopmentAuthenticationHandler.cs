using System.Security.Claims;
using System.Text.Encodings.Web;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace PortfolioManagement.Api.Authentication;

/// <summary>
/// Authentifie toute requête sous une identité de développement.
/// </summary>
/// <remarks>
/// Ce gestionnaire n'existe que pour permettre au front de parler à l'API avant qu'un émetteur de
/// jetons n'existe. Il n'est enregistré que si <see cref="ApiAuthenticationOptions.Enabled"/> est
/// faux, et le démarrage refuse cette configuration hors développement — un binaire qui
/// authentifierait tout le monde en exploitation est un incident, pas une commodité.
/// </remarks>
/// <param name="options">Réglages du schéma, fournis par le pipeline.</param>
/// <param name="logger">Fabrique de journaux.</param>
/// <param name="encoder">Encodeur d'URL.</param>
public sealed class DevelopmentAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    /// <summary>Nom du schéma.</summary>
    public const string SchemeName = "Development";

    /// <inheritdoc />
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, "dev"),
                new Claim(ClaimTypes.Name, "Utilisateur de développement"),
            ],
            SchemeName);

        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
