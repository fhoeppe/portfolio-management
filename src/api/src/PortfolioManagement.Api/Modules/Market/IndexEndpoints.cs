using Microsoft.AspNetCore.Http.HttpResults;

using PortfolioManagement.Api.Http;
using PortfolioManagement.Domain.Market;

namespace PortfolioManagement.Api.Modules.Market;

/// <summary>Les deux lectures du référentiel des indices, telles que le contrat les décrit.</summary>
public static class IndexEndpoints
{
    /// <summary>Branche les opérations sur le groupe de routes.</summary>
    /// <param name="group">Groupe racine de l'API, déjà préfixé et protégé.</param>
    public static RouteGroupBuilder MapIndices(this RouteGroupBuilder group)
    {
        var indices = group.MapGroup("/market/indices").WithTags("Marché");

        indices.MapGet("/", List)
            .WithName("listIndices")
            .WithSummary("Indices de référence et leur composition")
            .WithDescription(
                "Référentiel des indices suivis, avec la composition de chacun à sa date d'arrêté. "
                + "Restreignable par `?key=cac40&key=dax` ou par `?region=Europe continentale`.");

        indices.MapGet("/{indexKey}", Get)
            .WithName("getIndex")
            .WithSummary("Composition d'un indice");

        // Chemin frère et non sous-ressource : `/market/indices/{indexKey}` capture déjà tout
        // segment placé là, et `/market/indices/summary` serait lu comme l'indice de clé
        // « summary ».
        var summaries = group.MapGroup("/market/indices2").WithTags("Marché");

        summaries.MapGet("/", ListSummaries)
            .WithName("listIndexSummaries")
            .WithSummary("Liste des indices connus, sans leur composition")
            .WithDescription(
                "Les mêmes indices que `/market/indices`, privés de leurs `members` — de quoi peupler "
                + "un sélecteur sans transporter les quelque quatre mille lignes de composition. "
                + "Un seul critère, facultatif : `?region=Europe continentale`.");

        return group;
    }

    // ── Lecture ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Sert la collection, filtres appliqués.
    /// </summary>
    /// <remarks>
    /// Pas de pagination, contrairement aux titres, et c'est le contrat qui le veut : le front
    /// charge cette ressource pour <b>remplacer</b> ce qu'il sait des compositions, et une réponse
    /// paginée l'obligerait à recoller les morceaux avant de pouvoir s'en servir. Vingt-huit
    /// indices ne justifient pas ce détour ; les filtres sont là pour n'en demander qu'une partie.
    /// </remarks>
    private static Ok<IndexFeedResponse> List(HttpRequest request, IIndexRepository repository)
    {
        var query = ReadQuery(request);
        var matching = repository.List().Where(i => Matches(i, query)).ToList();
        var metadata = repository.Metadata;

        return TypedResults.Ok(new IndexFeedResponse(
            metadata.Version,
            metadata.Source,
            metadata.AsOf,
            [.. matching.Select(i => i.ToResponse())]));
    }

    /// <summary>
    /// Sert la liste abrégée : les mêmes indices, sans leur composition.
    /// </summary>
    /// <remarks>
    /// L'enveloppe est celle de la collection complète, délibérément : un appelant qui passe de
    /// l'une à l'autre ne réapprend rien. Le filtrage, lui, se réduit à <c>region</c>, et il est
    /// facultatif — sans critère, toute la liste part. Filtrer par clés n'aurait pas de sens ici :
    /// on demande quels indices existent, or une liste de clés répond déjà à cette question, et qui
    /// connaît les siennes veut leur composition, servie par <c>/market/indices/{indexKey}</c>.
    /// </remarks>
    private static Ok<IndexSummaryFeedResponse> ListSummaries(
        HttpRequest request,
        HttpResponse response,
        IIndexRepository repository)
    {
        // Cinq minutes de fraîcheur : le front redemande cette liste à chaque démarrage, et deux
        // rechargements de page à une minute d'intervalle n'ont aucune raison de la retransporter.
        response.Freshness(Caching.MarketReference);

        var region = request.Query["region"].FirstOrDefault();
        var matching = repository.List().Where(i => InRegion(i, region));
        var metadata = repository.Metadata;

        return TypedResults.Ok(new IndexSummaryFeedResponse(
            metadata.Version,
            metadata.Source,
            metadata.AsOf,
            [.. matching.Select(i => i.ToSummary())]));
    }

    /// <summary>
    /// Sert un indice seul.
    /// </summary>
    /// <remarks>
    /// L'<c>ETag</c> vient du contenu et non d'un compteur de version : rien n'écrit ici, donc rien
    /// n'incrémente. Il permet au client de relire un indice sans retélécharger sa composition
    /// quand elle n'a pas bougé — ce qui est le seul intérêt d'une opération qui fait doublon avec
    /// la collection.
    /// </remarks>
    private static IResult Get(string indexKey, HttpResponse response, IIndexRepository repository)
    {
        var index = repository.Find(indexKey);
        if (index is null) return Problems.NotFound($"Aucun indice ne porte la clé {indexKey}.");

        // Étiquette et fraîcheur répondent à deux questions différentes, et se complètent : la
        // première dit « voici laquelle », la seconde « inutile de redemander avant cinq minutes ».
        // Sans la seconde, le client revalidait à chaque consultation d'indice — un aller-retour
        // pour s'entendre dire que rien n'a bougé.
        response.Headers.ETag = ETags.ForContent(Fingerprint(index));
        response.Freshness(Caching.MarketReference);
        return TypedResults.Ok(index.ToResponse());
    }

    // ── Rouages ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Ce qui identifie une composition à un instant donné.
    /// </summary>
    /// <remarks>
    /// La date d'arrêté et l'effectif décrit suffisent : une composition révisée change de date,
    /// et une composition complétée change de nombre de lignes. Deux livraisons qui coïncideraient
    /// sur les deux seraient la même livraison.
    /// </remarks>
    private static string Fingerprint(MarketIndex index) =>
        $"{index.Key}:{index.AsOf:yyyy-MM-dd}:{index.Members.Count}";

    /// <summary>L'indice satisfait-il les critères ?</summary>
    private static bool Matches(MarketIndex index, IndexQuery query)
    {
        if (query.Keys.Count > 0 && !query.Keys.Contains(index.Key, StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        return InRegion(index, query.Region);
    }

    /// <summary>L'indice est-il de cette zone ? Zone absente, tout passe.</summary>
    private static bool InRegion(MarketIndex index, string? region) =>
        string.IsNullOrWhiteSpace(region)
        || string.Equals(index.Region, region.Trim(), StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Lit les critères.
    /// </summary>
    /// <remarks>
    /// Aucun des deux ne peut être mal formé — ce sont des chaînes, et une clé inconnue rend
    /// simplement une collection vide. D'où l'absence du <c>TryRead…</c> qu'impose la pagination
    /// des titres : il n'y a rien à refuser, donc rien à rapporter.
    /// </remarks>
    private static IndexQuery ReadQuery(HttpRequest request)
    {
        var keys = request.Query["key"]
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k!.Trim())
            .ToList();

        var region = request.Query["region"].FirstOrDefault();
        return new IndexQuery(keys, string.IsNullOrWhiteSpace(region) ? null : region);
    }
}
