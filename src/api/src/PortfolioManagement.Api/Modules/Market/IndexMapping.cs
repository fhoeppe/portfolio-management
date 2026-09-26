using PortfolioManagement.Domain.Market;

namespace PortfolioManagement.Api.Modules.Market;

/// <summary>Traduction entre le domaine et ce que le contrat décrit.</summary>
/// <remarks>
/// Les deux formes coïncident aujourd'hui presque champ pour champ, et cette traduction paraît
/// donc gratuite. Elle ne l'est pas : c'est elle qui permet au domaine de changer sans que la
/// charge servie change avec lui, et c'est le seul endroit à relire quand on se demande ce que
/// l'API expose réellement.
/// </remarks>
public static class IndexMapping
{
    /// <summary>L'indice, tel qu'il est servi.</summary>
    public static IndexResponse ToResponse(this MarketIndex index) => new(
        index.Key,
        index.Name,
        index.Region,
        index.Place,
        // Un MIC vide et un MIC absent disent la même chose — un indice qui ne cote pas sur une
        // place unique — et le contrat ne décrit que l'absence. On ne sert donc pas la chaîne vide.
        string.IsNullOrWhiteSpace(index.Mic) ? null : index.Mic,
        index.Currency,
        index.Count,
        index.Detail,
        index.AsOf,
        [.. index.Members.Select(ToResponse)]);

    /// <summary>L'indice sans sa composition, tel qu'il est servi.</summary>
    public static IndexSummaryResponse ToSummary(this MarketIndex index) => new(
        index.Key,
        index.Name,
        index.Region,
        index.Place,
        string.IsNullOrWhiteSpace(index.Mic) ? null : index.Mic,
        index.Currency,
        index.Count,
        index.Members.Count,
        index.Detail,
        index.AsOf);

    /// <summary>La valeur, telle qu'elle est servie.</summary>
    public static IndexMemberResponse ToResponse(this IndexMember member) => new(
        member.Name,
        member.Ticker,
        member.Isin,
        member.Sector,
        member.Weight,
        member.Cap,
        member.Ref);
}
