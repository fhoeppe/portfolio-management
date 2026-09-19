namespace PortfolioManagement.Infrastructure.Securities;

/// <summary>
/// Nom lisible d'une place à partir de son code ISO 10383.
/// </summary>
/// <remarks>
/// <para>
/// Le contrat ne fait pas saisir le nom de la place : <c>SecurityInput</c> ne porte que le MIC, et
/// <c>place</c> n'apparaît qu'en réponse. C'est délibéré — deux clients qui écriraient « Euronext
/// Paris » et « EURONEXT PARIS » produiraient deux libellés pour une même place. Le nom est donc
/// dérivé, jamais reçu.
/// </para>
/// <para>
/// Les libellés reprennent ceux de <c>MARKET_INFO</c>, la table que l'écran Titres porte
/// aujourd'hui : c'est la donnée la plus juste dont dispose l'application, et l'API n'a rien à
/// gagner à la contredire. Le jour où l'écran cessera de porter la sienne, c'est celle-ci qui
/// restera.
/// </para>
/// <para>
/// La table ne couvre que les places du catalogue d'amorçage. Le registre ISO complet — 2 875
/// entrées — vit côté front dans <c>mic.data.ts</c> ; le porter ici est le travail du module
/// Marché, qui a <c>/market/places</c> à servir. En attendant, un MIC inconnu rend <c>null</c>
/// plutôt qu'une approximation.
/// </para>
/// </remarks>
public static class PlaceDirectory
{
    private static readonly Dictionary<string, string> Names = new(StringComparer.OrdinalIgnoreCase)
    {
        ["XPAR"] = "Euronext Paris",
        ["XAMS"] = "Euronext Amsterdam",
        ["XBRU"] = "Euronext Bruxelles",
        ["XLIS"] = "Euronext Lisbonne",
        ["XDUB"] = "Euronext Dublin",
        ["XLUX"] = "Bourse de Luxembourg",
        ["XETR"] = "Xetra Francfort",
        ["XLON"] = "London Stock Exchange",
        ["XMIL"] = "Borsa Italiana",
        ["XMAD"] = "Bolsa de Madrid",
        ["XSWX"] = "SIX Swiss Exchange",
        ["XNYS"] = "New York Stock Exchange",
        ["XNAS"] = "Nasdaq",
        ["ARCX"] = "NYSE Arca",
        ["OTC"] = "Hors marché",
    };

    /// <summary>Le nom de la place, ou <c>null</c> si le code n'est pas connu du référentiel.</summary>
    public static string? NameOf(string mic) => Names.GetValueOrDefault(mic);

    /// <summary>Le code est-il celui d'une place connue ?</summary>
    public static bool IsKnown(string mic) => Names.ContainsKey(mic);
}
