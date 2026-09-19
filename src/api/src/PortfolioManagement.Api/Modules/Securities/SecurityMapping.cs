using PortfolioManagement.Domain.Securities;
using PortfolioManagement.Infrastructure.Securities;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>Traduction entre le titre du domaine et ses représentations HTTP.</summary>
/// <remarks>
/// Écrite à la main plutôt que confiée à un générateur : la correspondance n'est pas une simple
/// recopie — le MIC devient un nom de place, les champs dérivés des positions ne traversent que
/// dans un sens — et une correspondance qui décide de quelque chose se lit mieux qu'elle ne se
/// configure.
/// </remarks>
public static class SecurityMapping
{
    /// <summary>Le titre tel qu'il est servi.</summary>
    public static SecurityResponse ToResponse(this Security security) => new(
        security.Id,
        security.Ticker,
        security.Name,
        security.Isin,
        security.Mic,
        security.Place ?? PlaceDirectory.NameOf(security.Mic),
        security.Currency,
        security.AssetClass,
        security.Region,
        security.Tradable,
        security.Quoted,
        security.Followed,
        security.Rating,
        security.Cap,
        security.Liquidity,
        security.Esg,
        security.Domicile,
        security.Complexity,
        security.Reviewed,
        security.ReviewedBy,
        security.Note,
        security.Held,
        security.Mandates);

    /// <summary>
    /// Le titre décrit par une représentation d'écriture.
    /// </summary>
    /// <remarks>
    /// L'identifiant, la version et le dérivé des positions ne sont pas ici : le référentiel les
    /// réimpose lui-même. La normalisation — mnémonique et codes en capitales — a lieu à ce
    /// passage et nulle part ailleurs, pour que deux clients qui écrivent « aapl » et « AAPL »
    /// n'inscrivent pas deux titres.
    /// </remarks>
    public static Security ToDomain(this SecurityInput input)
    {
        var mic = input.Mic!.Trim().ToUpperInvariant();

        return new Security
        {
            Id = string.Empty,
            Ticker = input.Ticker!.Trim().ToUpperInvariant(),
            Name = input.Name!.Trim(),
            Isin = Blank(input.Isin) ? null : input.Isin!.Trim().ToUpperInvariant(),
            Mic = mic,
            Place = PlaceDirectory.NameOf(mic),
            Currency = input.Currency!.Trim().ToUpperInvariant(),
            AssetClass = Trimmed(input.AssetClass),
            Region = Trimmed(input.Region),
            Tradable = input.Tradable,
            Quoted = input.Quoted,
            Followed = input.Followed,
            Rating = Trimmed(input.Rating),
            Cap = input.Cap,
            Liquidity = Trimmed(input.Liquidity),
            Esg = Trimmed(input.Esg),
            Domicile = Trimmed(input.Domicile),
            Complexity = Trimmed(input.Complexity),
            Reviewed = input.Reviewed,
            ReviewedBy = Trimmed(input.ReviewedBy),
            Note = Trimmed(input.Note),
        };
    }

    /// <summary>
    /// Le titre courant vu comme une représentation d'écriture, point de départ d'un merge patch.
    /// </summary>
    public static SecurityInput ToInput(this Security security) => new()
    {
        Ticker = security.Ticker,
        Name = security.Name,
        Isin = security.Isin,
        Mic = security.Mic,
        Currency = security.Currency,
        AssetClass = security.AssetClass,
        Region = security.Region,
        Tradable = security.Tradable,
        Quoted = security.Quoted,
        Followed = security.Followed,
        Rating = security.Rating,
        Cap = security.Cap,
        Liquidity = security.Liquidity,
        Esg = security.Esg,
        Domicile = security.Domicile,
        Complexity = security.Complexity,
        Reviewed = security.Reviewed,
        ReviewedBy = security.ReviewedBy,
        Note = security.Note,
    };

    private static bool Blank(string? value) => string.IsNullOrWhiteSpace(value);

    private static string? Trimmed(string? value) => Blank(value) ? null : value!.Trim();
}
