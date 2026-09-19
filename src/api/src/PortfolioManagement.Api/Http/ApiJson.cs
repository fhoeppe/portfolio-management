using System.Text.Json;
using System.Text.Json.Serialization;

namespace PortfolioManagement.Api.Http;

/// <summary>Réglages de sérialisation, partagés par le pipeline et par tout ce qui sérialise à la main.</summary>
/// <remarks>
/// Les nuls ne sont pas écrits : le contrat déclare la plupart des champs facultatifs, et un corps
/// qui ne porte que ce qui est renseigné dit la même chose en moins de lignes. Un client qui
/// distingue « absent » de « null » — le merge patch, précisément — lit le corps de la requête, pas
/// celui de la réponse.
/// </remarks>
public static class ApiJson
{
    /// <summary>Les options en vigueur.</summary>
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}
