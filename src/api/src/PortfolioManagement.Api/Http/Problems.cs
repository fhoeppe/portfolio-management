using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace PortfolioManagement.Api.Http;

/// <summary>Une erreur rapportée sur un champ précis du corps de la requête.</summary>
/// <param name="JsonPointer">Pointeur JSON vers le champ fautif — <c>/isin</c>. Sérialisé en <c>pointer</c>, nom que fixe le contrat.</param>
/// <param name="Message">Ce qui ne va pas, en clair, pour être affiché sous le champ.</param>
public sealed record FieldError(
    [property: JsonPropertyName("pointer")] string JsonPointer,
    string Message);

/// <summary>
/// Fabrique des réponses d'erreur au format RFC 9457.
/// </summary>
/// <remarks>
/// <para>
/// Toutes les erreurs passent par ici pour une raison simple : le contrat promet un <c>type</c>
/// stable et un tableau <c>errors</c> pointant le champ fautif, et c'est ce tableau dont les
/// formulaires de saisie du front ont besoin pour placer le message au bon endroit. Laisser chaque
/// endpoint composer son objet d'erreur, c'est se retrouver avec autant de dialectes que de verbes.
/// </para>
/// <para>
/// La frontière entre <c>400</c> et <c>422</c> est tenue ici, et elle est simple : <c>400</c> quand
/// la requête ne se lit pas — JSON invalide, paramètre de requête impossible à interpréter ;
/// <c>422</c> quand elle se lit parfaitement mais qu'un champ est refusé. Le second cas est le seul
/// qui porte des pointeurs, puisque c'est le seul où un champ est identifiable.
/// </para>
/// </remarks>
public static class Problems
{
    private const string Base = "https://api.portfolio-management.example/problems/";

    /// <summary>Requête illisible — paramètre ou corps qui ne s'interprète pas.</summary>
    public static ProblemHttpResult BadRequest(string detail, string slug = "invalid-parameter") =>
        Build(StatusCodes.Status400BadRequest, "Requête invalide", detail, slug);

    /// <summary>Ressource inconnue.</summary>
    public static ProblemHttpResult NotFound(string detail) =>
        Build(StatusCodes.Status404NotFound, "Ressource inconnue", detail, "not-found");

    /// <summary>Conflit avec l'état courant du référentiel.</summary>
    public static ProblemHttpResult Conflict(string detail, string slug = "still-referenced") =>
        Build(StatusCodes.Status409Conflict, "Conflit avec l'état courant", detail, slug);

    /// <summary>L'<c>If-Match</c> fourni ne correspond plus à la version courante.</summary>
    public static ProblemHttpResult PreconditionFailed() =>
        Build(
            StatusCodes.Status412PreconditionFailed,
            "Version périmée",
            "La ressource a été modifiée depuis votre lecture. Rechargez avant de réessayer.",
            "stale-version");

    /// <summary>L'<c>If-Match</c> est absent, alors que le contrat l'exige sur toute écriture.</summary>
    public static ProblemHttpResult PreconditionRequired() =>
        Build(
            StatusCodes.Status428PreconditionRequired,
            "Précondition requise",
            "Cette opération exige un en-tête If-Match portant l'ETag de la version que vous modifiez.",
            "precondition-required");

    /// <summary>Type de média non pris en charge.</summary>
    public static ProblemHttpResult UnsupportedMediaType(string detail) =>
        Build(StatusCodes.Status415UnsupportedMediaType, "Type de média non pris en charge", detail, "unsupported-media-type");

    /// <summary>Requête bien formée mais refusée champ par champ.</summary>
    public static ProblemHttpResult Unprocessable(string title, IReadOnlyList<FieldError> errors) =>
        Build(StatusCodes.Status422UnprocessableEntity, title, null, "business-rule", errors);

    private static ProblemHttpResult Build(
        int status,
        string title,
        string? detail,
        string slug,
        IReadOnlyList<FieldError>? errors = null)
    {
        var problem = new ProblemDetails
        {
            Type = Base + slug,
            Title = title,
            Status = status,
            Detail = detail,
        };

        if (errors is { Count: > 0 })
        {
            problem.Extensions["errors"] = errors;
        }

        return TypedResults.Problem(problem);
    }
}
