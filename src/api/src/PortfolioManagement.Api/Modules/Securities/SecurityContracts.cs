using System.Text.Json.Serialization;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>Page de résultats, telle que le contrat la décrit pour toute collection.</summary>
/// <typeparam name="T">Nature des éléments servis.</typeparam>
/// <param name="Items">Les éléments de la page.</param>
/// <param name="Page">Numéro de la page servie, à partir de 1.</param>
/// <param name="PageSize">Taille de page demandée.</param>
/// <param name="Total">Nombre total d'éléments, tous filtres appliqués.</param>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);

/// <summary>Un titre du référentiel, tel qu'il est servi.</summary>
/// <param name="Id">Identifiant stable.</param>
/// <param name="Ticker">Code mnémonique.</param>
/// <param name="Name">Dénomination.</param>
/// <param name="Isin">Code ISO 6166.</param>
/// <param name="Mic">Code ISO 10383 de la place.</param>
/// <param name="Place">Nom lisible de la place, dérivé du MIC.</param>
/// <param name="Currency">Devise de cotation, code ISO 4217.</param>
/// <param name="AssetClass">Nature de l'instrument.</param>
/// <param name="Region">Zone géographique de rattachement.</param>
/// <param name="Tradable">Le titre est-il ouvert à la négociation ?</param>
/// <param name="Quoted">Le titre est-il coté en continu ?</param>
/// <param name="Followed">Le titre est-il tenu en veille par le référentiel ?</param>
/// <param name="Rating">Notation de crédit et son agence.</param>
/// <param name="Cap">Plafond de concentration, en % de l'actif net par compte. Zéro si aucun.</param>
/// <param name="Liquidity">Appréciation de liquidité.</param>
/// <param name="Esg">Classification extra-financière.</param>
/// <param name="Domicile">Pays de domiciliation.</param>
/// <param name="Complexity">Qualification MIF.</param>
/// <param name="Reviewed">Date de la dernière revue.</param>
/// <param name="ReviewedBy">Instance qui a mené la revue.</param>
/// <param name="Note">Commentaire du comité.</param>
/// <param name="Held">Quantité détenue, tous comptes confondus. Dérivé des positions, non modifiable.</param>
/// <param name="Mandates">Comptes qui portent le titre. Dérivé des positions, non modifiable.</param>
public sealed record SecurityResponse(
    string Id,
    string Ticker,
    string Name,
    string? Isin,
    string Mic,
    string? Place,
    string Currency,
    string? AssetClass,
    string? Region,
    bool Tradable,
    bool Quoted,
    bool Followed,
    string? Rating,
    int Cap,
    string? Liquidity,
    string? Esg,
    string? Domicile,
    string? Complexity,
    DateOnly? Reviewed,
    string? ReviewedBy,
    string? Note,
    int Held,
    IReadOnlyList<string> Mandates);

/// <summary>
/// Représentation complète d'un titre en écriture, pour <c>POST</c> et <c>PUT</c>.
/// </summary>
/// <remarks>
/// Ni <c>id</c>, ni <c>place</c>, ni <c>held</c>, ni <c>mandates</c> : le premier est attribué,
/// le deuxième est dérivé du MIC, les deux derniers viennent des positions. Un client qui les
/// enverrait les verrait ignorés — d'où leur absence pure et simple du type.
/// </remarks>
public sealed record SecurityInput
{
    /// <summary>Code mnémonique. Obligatoire.</summary>
    public string? Ticker { get; init; }

    /// <summary>Dénomination. Obligatoire.</summary>
    public string? Name { get; init; }

    /// <summary>Code ISO 6166, clé de contrôle comprise.</summary>
    public string? Isin { get; init; }

    /// <summary>Code ISO 10383 de la place. Obligatoire.</summary>
    public string? Mic { get; init; }

    /// <summary>Devise de cotation, code ISO 4217. Obligatoire.</summary>
    public string? Currency { get; init; }

    /// <summary>Nature de l'instrument.</summary>
    public string? AssetClass { get; init; }

    /// <summary>Zone géographique de rattachement.</summary>
    public string? Region { get; init; }

    /// <summary>Le titre est-il ouvert à la négociation ? Vrai par défaut.</summary>
    public bool Tradable { get; init; } = true;

    /// <summary>Le titre est-il coté en continu ? Vrai par défaut.</summary>
    public bool Quoted { get; init; } = true;

    /// <summary>Le titre est-il tenu en veille par le référentiel ?</summary>
    public bool Followed { get; init; }

    /// <summary>Notation de crédit et son agence.</summary>
    public string? Rating { get; init; }

    /// <summary>Plafond de concentration, en % de l'actif net par compte. Zéro si aucun.</summary>
    public int Cap { get; init; }

    /// <summary>Appréciation de liquidité.</summary>
    public string? Liquidity { get; init; }

    /// <summary>Classification extra-financière.</summary>
    public string? Esg { get; init; }

    /// <summary>Pays de domiciliation.</summary>
    public string? Domicile { get; init; }

    /// <summary>Qualification MIF.</summary>
    public string? Complexity { get; init; }

    /// <summary>Date de la dernière revue.</summary>
    public DateOnly? Reviewed { get; init; }

    /// <summary>Instance qui a mené la revue.</summary>
    public string? ReviewedBy { get; init; }

    /// <summary>Commentaire du comité.</summary>
    public string? Note { get; init; }
}

/// <summary>Critères de la liste des titres.</summary>
/// <param name="Page">Numéro de page, à partir de 1.</param>
/// <param name="PageSize">Taille de page, de 1 à 200.</param>
/// <param name="Q">Recherche plein texte sur le mnémonique, la dénomination et l'ISIN.</param>
/// <param name="Mic">Restreint à une place de négociation.</param>
/// <param name="Tradable">Restreint aux titres que le référentiel autorise, ou leur complément.</param>
/// <param name="Followed">Restreint aux titres tenus en veille, ou leur complément.</param>
public sealed record SecurityQuery(
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 50,
    [property: JsonPropertyName("q")] string? Q = null,
    [property: JsonPropertyName("mic")] string? Mic = null,
    [property: JsonPropertyName("tradable")] bool? Tradable = null,
    [property: JsonPropertyName("followed")] bool? Followed = null);
