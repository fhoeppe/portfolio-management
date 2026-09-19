namespace PortfolioManagement.Domain.Securities;

/// <summary>Issue d'une écriture. Chaque cas correspond à un statut HTTP du contrat.</summary>
public enum WriteOutcome
{
    /// <summary>L'écriture a eu lieu.</summary>
    Ok,

    /// <summary>Aucun titre ne porte cet identifiant — <c>404</c>.</summary>
    NotFound,

    /// <summary>L'<c>If-Match</c> ne correspond plus à la version courante — <c>412</c>.</summary>
    VersionMismatch,

    /// <summary>L'écriture heurte l'état du référentiel — <c>409</c>.</summary>
    Conflict,
}

/// <summary>Résultat d'une écriture : son issue, le titre tel qu'il en ressort, et le motif du refus.</summary>
/// <param name="Outcome">Ce qui s'est passé.</param>
/// <param name="Value">Le titre après écriture. Nul dès que l'issue n'est pas <see cref="WriteOutcome.Ok"/>.</param>
/// <param name="Detail">Phrase explicative destinée au corps <c>application/problem+json</c>.</param>
public readonly record struct WriteResult(WriteOutcome Outcome, Security? Value, string? Detail)
{
    /// <summary>L'écriture a abouti.</summary>
    public static WriteResult Ok(Security value) => new(WriteOutcome.Ok, value, null);

    /// <summary>Le titre visé n'existe pas.</summary>
    public static WriteResult NotFound() => new(WriteOutcome.NotFound, null, null);

    /// <summary>La version que le client croyait modifier n'est plus la courante.</summary>
    public static WriteResult Stale() => new(WriteOutcome.VersionMismatch, null, null);

    /// <summary>L'écriture heurte une règle du référentiel.</summary>
    public static WriteResult Conflict(string detail) => new(WriteOutcome.Conflict, null, detail);
}

/// <summary>
/// Accès au référentiel des titres.
/// </summary>
/// <remarks>
/// Les écritures prennent la version attendue en argument plutôt que de laisser l'appelant relire
/// puis écrire : le contrôle de concurrence doit se faire du même côté du verrou que l'écriture,
/// sans quoi deux requêtes qui lisent la même version la valident toutes les deux avant que l'une
/// n'écrive. C'est la raison pour laquelle <see cref="Update"/> reçoit une transformation et non un
/// titre déjà construit — elle s'applique sur la valeur courante, à l'abri.
/// </remarks>
public interface ISecurityRepository
{
    /// <summary>Tous les titres, dans l'ordre d'inscription.</summary>
    IReadOnlyList<Security> List();

    /// <summary>Le titre portant cet identifiant, ou <c>null</c>.</summary>
    Security? Find(string id);

    /// <summary>Inscrit un titre. Refusé si son ISIN est déjà porté sur la même place.</summary>
    /// <param name="draft">Le titre à inscrire ; son <c>Id</c> et sa <c>Version</c> sont attribués ici.</param>
    WriteResult Create(Security draft);

    /// <summary>Applique une transformation au titre, sous réserve que sa version soit encore celle attendue.</summary>
    /// <param name="id">Identifiant du titre visé.</param>
    /// <param name="expectedVersion">Version portée par l'<c>If-Match</c> du client.</param>
    /// <param name="change">Transformation à appliquer, évaluée sous verrou.</param>
    WriteResult Update(string id, int expectedVersion, Func<Security, Security> change);

    /// <summary>Retire un titre, sous réserve de version et de non-référencement.</summary>
    /// <param name="id">Identifiant du titre visé.</param>
    /// <param name="expectedVersion">Version portée par l'<c>If-Match</c> du client.</param>
    WriteResult Delete(string id, int expectedVersion);
}
