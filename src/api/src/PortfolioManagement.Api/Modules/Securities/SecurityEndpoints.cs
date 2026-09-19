using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

using Microsoft.AspNetCore.Http.HttpResults;

using FluentValidation;

using PortfolioManagement.Api.Http;
using PortfolioManagement.Domain.Securities;
using PortfolioManagement.Infrastructure.Idempotency;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>Les six opérations du référentiel des titres, telles que le contrat les décrit.</summary>
public static class SecurityEndpoints
{
    private const int MaxPageSize = 200;

    /// <summary>Branche les opérations sur le groupe de routes.</summary>
    /// <param name="group">Groupe racine de l'API, déjà préfixé et protégé.</param>
    public static RouteGroupBuilder MapSecurities(this RouteGroupBuilder group)
    {
        var securities = group.MapGroup("/securities").WithTags("Titres");

        securities.MapGet("/", List)
            .WithName("listSecurities")
            .WithSummary("Lister les titres du référentiel")
            .WithDescription(
                "Filtrable par place, par autorisation et par veille. Les titres négociables sont "
                + "`?tradable=true&followed=false`, les titres suivis `?followed=true`.");

        securities.MapPost("/", Create)
            .WithName("createSecurity")
            .WithSummary("Inscrire un titre au référentiel");

        securities.MapGet("/{securityId}", Get)
            .WithName("getSecurity")
            .WithSummary("Détail d'un titre");

        securities.MapPut("/{securityId}", Replace)
            .WithName("replaceSecurity")
            .WithSummary("Remplacer un titre");

        securities.MapPatch("/{securityId}", Patch)
            .WithName("patchSecurity")
            .WithSummary("Modifier un titre");

        securities.MapDelete("/{securityId}", Delete)
            .WithName("deleteSecurity")
            .WithSummary("Retirer un titre du référentiel");

        return group;
    }

    // ── Lecture ────────────────────────────────────────────────────────────────────────────

    private static IResult List(HttpRequest request, ISecurityRepository repository)
    {
        if (!TryReadQuery(request, out var query, out var problem)) return problem!;

        var matching = repository.List().Where(s => Matches(s, query)).ToList();

        // Le référentiel est servi dans son ordre d'inscription, celui du catalogue livré. C'est un
        // ordre stable et porteur de sens — actions, puis fonds, puis indices — et l'écran applique
        // de toute façon son propre tri par-dessus.
        var page = matching
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(s => s.ToResponse())
            .ToList();

        return TypedResults.Ok(new PagedResult<SecurityResponse>(page, query.Page, query.PageSize, matching.Count));
    }

    private static IResult Get(string securityId, HttpResponse response, ISecurityRepository repository)
    {
        var security = repository.Find(securityId);
        if (security is null) return Problems.NotFound($"Aucun titre ne porte l'identifiant {securityId}.");

        response.Headers.ETag = ETags.For(security.Version);
        return TypedResults.Ok(security.ToResponse());
    }

    // ── Création ───────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Create(
        HttpContext context,
        ISecurityRepository repository,
        IdempotencyStore idempotency,
        IValidator<SecurityInput> validator,
        CancellationToken cancellationToken)
    {
        var idempotencyKey = context.Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(idempotencyKey) && idempotency.Recall(idempotencyKey) is { } replay)
        {
            return Replay(replay);
        }

        var (input, malformed) = await ReadBody<SecurityInput>(context.Request, cancellationToken);
        if (malformed is not null) return malformed;

        if (Validate(validator, input!) is { } invalid) return invalid;

        var outcome = repository.Create(input!.ToDomain());
        if (outcome.Outcome == WriteOutcome.Conflict)
        {
            return Problems.Conflict(outcome.Detail!, "duplicate-isin");
        }

        var created = outcome.Value!;
        var location = $"{context.Request.PathBase}{context.Request.Path.Value!.TrimEnd('/')}/{created.Id}";
        var etag = ETags.For(created.Version);
        var body = JsonSerializer.Serialize(created.ToResponse(), ApiJson.Options);

        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            idempotency.Remember(idempotencyKey, new IdempotentResponse(StatusCodes.Status201Created, location, etag, body));
        }

        context.Response.Headers.Location = location;
        context.Response.Headers.ETag = etag;
        return Results.Text(body, "application/json", statusCode: StatusCodes.Status201Created);
    }

    // ── Écriture intégrale ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> Replace(
        string securityId,
        HttpContext context,
        ISecurityRepository repository,
        IValidator<SecurityInput> validator,
        CancellationToken cancellationToken)
    {
        if (!ETags.TryReadIfMatch(context.Request, out var expected)) return Problems.PreconditionRequired();

        var (input, malformed) = await ReadBody<SecurityInput>(context.Request, cancellationToken);
        if (malformed is not null) return malformed;

        if (Validate(validator, input!) is { } invalid) return invalid;

        return Write(context, repository.Update(securityId, expected, _ => input!.ToDomain()), securityId);
    }

    // ── Écriture partielle ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> Patch(
        string securityId,
        HttpContext context,
        ISecurityRepository repository,
        IValidator<SecurityInput> validator,
        CancellationToken cancellationToken)
    {
        var mediaType = context.Request.ContentType?.Split(';')[0].Trim();
        if (mediaType is not ("application/merge-patch+json" or "application/json"))
        {
            return Problems.UnsupportedMediaType(
                "Ce point d'entrée applique un JSON Merge Patch ; envoyez application/merge-patch+json.");
        }

        if (!ETags.TryReadIfMatch(context.Request, out var expected)) return Problems.PreconditionRequired();

        var current = repository.Find(securityId);
        if (current is null) return Problems.NotFound($"Aucun titre ne porte l'identifiant {securityId}.");

        var (patch, malformed) = await ReadBody<JsonObject>(context.Request, cancellationToken);
        if (malformed is not null) return malformed;

        var applied = SecurityPatchReader.Apply(current.ToInput(), patch!);
        if (applied.Merged is null)
        {
            return Problems.Unprocessable("Patch refusé", applied.Errors);
        }

        if (Validate(validator, applied.Merged) is { } invalid) return invalid;

        // La transformation n'est pas recalculée sous verrou : la version attendue garantit que le
        // titre y est identique à celui qu'on vient de lire, faute de quoi l'écriture part en 412.
        return Write(context, repository.Update(securityId, expected, _ => applied.Merged.ToDomain()), securityId);
    }

    // ── Retrait ────────────────────────────────────────────────────────────────────────────

    private static IResult Delete(string securityId, HttpRequest request, ISecurityRepository repository)
    {
        if (!ETags.TryReadIfMatch(request, out var expected)) return Problems.PreconditionRequired();

        var outcome = repository.Delete(securityId, expected);
        return outcome.Outcome switch
        {
            WriteOutcome.Ok => TypedResults.NoContent(),
            WriteOutcome.NotFound => Problems.NotFound($"Aucun titre ne porte l'identifiant {securityId}."),
            WriteOutcome.VersionMismatch => Problems.PreconditionFailed(),
            _ => Problems.Conflict(outcome.Detail!),
        };
    }

    // ── Rouages communs ────────────────────────────────────────────────────────────────────

    private static IResult Write(HttpContext context, WriteResult outcome, string securityId)
    {
        switch (outcome.Outcome)
        {
            case WriteOutcome.NotFound:
                return Problems.NotFound($"Aucun titre ne porte l'identifiant {securityId}.");
            case WriteOutcome.VersionMismatch:
                return Problems.PreconditionFailed();
            case WriteOutcome.Conflict:
                return Problems.Conflict(outcome.Detail!, "duplicate-isin");
            default:
                var updated = outcome.Value!;
                context.Response.Headers.ETag = ETags.For(updated.Version);
                return TypedResults.Ok(updated.ToResponse());
        }
    }

    private static IResult Replay(IdempotentResponse response)
    {
        return Results.Extensions.Replayed(response);
    }

    /// <summary>
    /// Lit le corps de la requête. Un corps illisible est un <c>400</c> — la requête ne se lit pas ;
    /// un corps lisible mais refusé sera un <c>422</c>, plus loin.
    /// </summary>
    private static async Task<(T? Value, IResult? Problem)> ReadBody<T>(HttpRequest request, CancellationToken cancellationToken)
        where T : class
    {
        try
        {
            var value = await request.ReadFromJsonAsync<T>(ApiJson.Options, cancellationToken);
            return value is null
                ? (null, Problems.BadRequest("Le corps de la requête est vide.", "malformed-body"))
                : (value, null);
        }
        catch (JsonException exception)
        {
            return (null, Problems.BadRequest($"Le corps de la requête n'est pas un JSON exploitable : {exception.Message}", "malformed-body"));
        }
    }

    private static ProblemHttpResult? Validate(IValidator<SecurityInput> validator, SecurityInput input)
    {
        var result = validator.Validate(input);
        if (result.IsValid) return null;

        var errors = result.Errors
            .Select(e => new FieldError("/" + char.ToLowerInvariant(e.PropertyName[0]) + e.PropertyName[1..], e.ErrorMessage))
            .ToList();

        return Problems.Unprocessable("Titre refusé", errors);
    }

    /// <summary>
    /// Le titre satisfait-il les critères ?
    /// </summary>
    /// <remarks>
    /// <c>tradable</c> et <c>followed</c> sont deux faits indépendants du référentiel, et c'est
    /// leur conjonction qui forme les deux listes de l'écran Titres : les **négociables** sont
    /// <c>tradable=true&amp;followed=false</c>, les **suivis** <c>followed=true</c>. Un titre en
    /// veille reste autorisé par le référentiel — ce qui le retient, c'est la veille, pas un refus.
    /// Les servir comme deux sous-ressources aurait figé cette composition dans des URL ; les
    /// laisser en critères permet aussi de demander ce que ni l'un ni l'autre ne nomme.
    /// </remarks>
    private static bool Matches(Security security, SecurityQuery query)
    {
        if (query.Tradable is { } tradable && security.Tradable != tradable) return false;
        if (query.Followed is { } followed && security.Followed != followed) return false;

        if (!string.IsNullOrWhiteSpace(query.Mic)
            && !string.Equals(security.Mic, query.Mic.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(query.Q)) return true;

        var needle = query.Q.Trim();
        return security.Ticker.Contains(needle, StringComparison.OrdinalIgnoreCase)
            || security.Name.Contains(needle, StringComparison.OrdinalIgnoreCase)
            || (security.Isin?.Contains(needle, StringComparison.OrdinalIgnoreCase) ?? false);
    }

    /// <summary>
    /// Lit les critères de la liste.
    /// </summary>
    /// <remarks>
    /// À la main plutôt que par liaison automatique : un <c>page=abc</c> lié automatiquement rend
    /// un <c>400</c> au corps vide, là où le contrat promet un <c>problem+json</c> qui nomme le
    /// paramètre fautif.
    /// </remarks>
    private static bool TryReadQuery(HttpRequest request, out SecurityQuery query, out IResult? problem)
    {
        query = new SecurityQuery();
        problem = null;

        if (!TryReadInt(request, "page", 1, out var page, out problem)) return false;
        if (!TryReadInt(request, "pageSize", 50, out var pageSize, out problem)) return false;

        if (page < 1)
        {
            problem = Problems.BadRequest("Le numéro de page commence à 1.");
            return false;
        }

        if (pageSize is < 1 or > MaxPageSize)
        {
            problem = Problems.BadRequest($"La taille de page va de 1 à {MaxPageSize}.");
            return false;
        }

        if (!TryReadFlag(request, "tradable", out var tradable, out problem)) return false;
        if (!TryReadFlag(request, "followed", out var followed, out problem)) return false;

        query = new SecurityQuery(page, pageSize, request.Query["q"], request.Query["mic"], tradable, followed);
        return true;
    }

    private static bool TryReadFlag(HttpRequest request, string name, out bool? value, out IResult? problem)
    {
        value = null;
        problem = null;

        if (!request.Query.TryGetValue(name, out var raw) || string.IsNullOrEmpty(raw)) return true;

        if (!bool.TryParse(raw, out var parsed))
        {
            problem = Problems.BadRequest($"`{name}` attend true ou false.");
            return false;
        }

        value = parsed;
        return true;
    }

    private static bool TryReadInt(HttpRequest request, string name, int fallback, out int value, out IResult? problem)
    {
        value = fallback;
        problem = null;

        if (!request.Query.TryGetValue(name, out var raw) || string.IsNullOrEmpty(raw)) return true;

        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value)) return true;

        problem = Problems.BadRequest($"`{name}` attend un nombre entier.");
        return false;
    }
}
