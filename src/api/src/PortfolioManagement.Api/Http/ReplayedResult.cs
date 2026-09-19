namespace PortfolioManagement.Api.Http;

using PortfolioManagement.Infrastructure.Idempotency;

/// <summary>
/// Rejoue à l'identique une réponse déjà produite pour une clé d'idempotence.
/// </summary>
/// <remarks>
/// Le corps est rendu tel quel, octet pour octet, plutôt que resérialisé depuis l'état courant :
/// une clé d'idempotence promet la réponse d'origine, pas une réponse équivalente. Si le titre a
/// été modifié entre-temps, c'est bien la création initiale que le client doit revoir.
/// </remarks>
/// <param name="response">La réponse conservée.</param>
public sealed class ReplayedResult(IdempotentResponse response) : IResult
{
    /// <inheritdoc />
    public async Task ExecuteAsync(HttpContext httpContext)
    {
        httpContext.Response.StatusCode = response.StatusCode;
        httpContext.Response.ContentType = "application/json";
        if (response.Location is not null) httpContext.Response.Headers.Location = response.Location;
        if (response.ETag is not null) httpContext.Response.Headers.ETag = response.ETag;

        // Dit au client que ce corps n'a pas été reconstruit : sa requête a été reconnue comme un
        // renvoi, et rien de neuf n'a été inscrit au référentiel.
        httpContext.Response.Headers["Idempotent-Replay"] = "true";

        await httpContext.Response.WriteAsync(response.Body, httpContext.RequestAborted);
    }
}

/// <summary>Raccourci de production d'une réponse rejouée.</summary>
public static class ReplayedResultExtensions
{
    /// <summary>Rejoue la réponse conservée pour une clé d'idempotence.</summary>
    /// <param name="_">Point d'extension de <c>Results.Extensions</c>.</param>
    /// <param name="response">La réponse conservée.</param>
    public static IResult Replayed(this IResultExtensions _, IdempotentResponse response) => new ReplayedResult(response);
}
