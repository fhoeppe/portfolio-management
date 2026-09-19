using System.ComponentModel.DataAnnotations;

namespace PortfolioManagement.Api.Authentication;

/// <summary>Réglages du jeton porteur.</summary>
public sealed class ApiAuthenticationOptions
{
    /// <summary>Section d'<c>appsettings</c> qui porte ces réglages.</summary>
    public const string SectionName = "Authentication";

    /// <summary>
    /// La vérification du jeton est-elle en vigueur ?
    /// </summary>
    /// <remarks>
    /// À faux, le pipeline d'authentification reste en place — les opérations exigent toujours un
    /// principal, les autorisations s'évaluent — mais le jeton n'est plus réclamé : chaque requête
    /// est authentifiée sous une identité de développement. Ce n'est pas une porte dérobée, c'est
    /// un émetteur de substitution : le jour où l'émission de jetons existe, seule cette valeur
    /// change, et rien dans les endpoints n'a à être rouvert.
    /// </remarks>
    public bool Enabled { get; init; }

    /// <summary>Paramètres de validation du jeton, lus lorsque <see cref="Enabled"/> est vrai.</summary>
    public JwtOptions Jwt { get; init; } = new();
}

/// <summary>Paramètres de validation d'un JWT.</summary>
public sealed class JwtOptions
{
    /// <summary>Émetteur attendu.</summary>
    public string Issuer { get; init; } = string.Empty;

    /// <summary>Audience attendue.</summary>
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// Clé de signature symétrique.
    /// </summary>
    /// <remarks>
    /// Jamais dans un <c>appsettings</c> versionné : <c>dotnet user-secrets</c> en développement,
    /// variable d'environnement <c>Authentication__Jwt__SigningKey</c> en exploitation.
    /// </remarks>
    [MinLength(32, ErrorMessage = "La clé de signature fait au moins 32 caractères.")]
    public string SigningKey { get; init; } = string.Empty;
}
