namespace PortfolioManagement.Api.Http;

/// <summary>
/// Fraîcheur des représentations, posée en un seul endroit.
/// </summary>
/// <remarks>
/// Un en-tête de cache est une promesse faite au client : « tu peux réutiliser ceci sans me
/// redemander pendant tant de temps ». La promesse doit donc être calibrée sur le rythme de la
/// donnée, pas sur celui du code — d'où des durées nommées ici plutôt que des nombres répétés à
/// chaque opération, où ils divergeraient au premier ajout.
/// </remarks>
public static class Caching
{
    /// <summary>
    /// Référentiel de marché : cinq minutes.
    /// </summary>
    /// <remarks>
    /// Une composition d'indice est révisée chaque trimestre, un nom d'indice ne change jamais :
    /// cinq minutes sont très en deçà de ce que la donnée autoriserait. C'est délibéré — la durée
    /// est celle au bout de laquelle un exploitant qui vient de corriger sa source accepte
    /// d'attendre pour la voir, et non celle que la stabilité de la donnée permettrait.
    /// </remarks>
    public static readonly TimeSpan MarketReference = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Annonce combien de temps la réponse reste réutilisable telle quelle.
    /// </summary>
    /// <remarks>
    /// <c>private</c> et non <c>public</c> : ces réponses ne sont servies qu'à un porteur de jeton
    /// authentifié, et un cache partagé — mandataire, CDN — n'a pas à en garder copie pour la
    /// rendre au suivant. Seul le navigateur de l'appelant conserve la sienne.
    /// </remarks>
    /// <param name="response">La réponse en cours.</param>
    /// <param name="duration">Durée de fraîcheur annoncée.</param>
    public static void Freshness(this HttpResponse response, TimeSpan duration) =>
        response.Headers.CacheControl = $"private, max-age={(int)duration.TotalSeconds}";
}
