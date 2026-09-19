using System.Globalization;
using System.Text.Json.Nodes;

using PortfolioManagement.Api.Http;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>
/// Application d'un JSON Merge Patch (RFC 7386) sur la représentation courante d'un titre.
/// </summary>
/// <remarks>
/// <para>
/// Toute la difficulté du merge patch tient dans une distinction qu'une désérialisation ordinaire
/// efface : un champ <b>absent</b> n'est pas touché, un champ à <b>null</b> est effacé. Lire le
/// corps dans un <see cref="JsonObject"/> plutôt que dans un type est donc le seul moyen d'honorer
/// la sémantique — un <c>SecurityPatch?</c> fraîchement désérialisé ne sait pas dire laquelle des
/// deux intentions a produit son <c>null</c>.
/// </para>
/// <para>
/// Les champs que le contrat ne rend pas modifiables — mnémonique, place, devise — sont refusés
/// et non ignorés. Un client qui les envoie se trompe ; le lui taire lui ferait croire que son
/// écriture a porté.
/// </para>
/// </remarks>
public static class SecurityPatchReader
{
    private static readonly HashSet<string> Immutable = new(StringComparer.Ordinal)
    {
        "id", "ticker", "mic", "place", "currency", "held", "mandates",
    };

    /// <summary>Résultat de la fusion : la représentation obtenue, ou les champs qui l'ont empêchée.</summary>
    /// <param name="Merged">La représentation complète issue de la fusion. Nulle en cas d'erreur.</param>
    /// <param name="Errors">Les champs refusés, prêts à être rapportés.</param>
    public readonly record struct Result(SecurityInput? Merged, IReadOnlyList<FieldError> Errors);

    /// <summary>Fusionne le patch dans la représentation courante.</summary>
    /// <param name="current">Le titre tel qu'il est aujourd'hui, vu comme une représentation d'écriture.</param>
    /// <param name="patch">Le corps du <c>PATCH</c>, déjà lu en objet JSON.</param>
    public static Result Apply(SecurityInput current, JsonObject patch)
    {
        var errors = new List<FieldError>();
        var merged = current;

        foreach (var (name, value) in patch)
        {
            if (Immutable.Contains(name))
            {
                errors.Add(new FieldError($"/{name}", "Ce champ n'est pas modifiable par un patch."));
                continue;
            }

            merged = name switch
            {
                "name" => merged with { Name = Text(name, value, errors, required: true) ?? merged.Name },
                "isin" => merged with { Isin = Text(name, value, errors) },
                "assetClass" => merged with { AssetClass = Text(name, value, errors) },
                "region" => merged with { Region = Text(name, value, errors) },
                "rating" => merged with { Rating = Text(name, value, errors) },
                "liquidity" => merged with { Liquidity = Text(name, value, errors) },
                "esg" => merged with { Esg = Text(name, value, errors) },
                "domicile" => merged with { Domicile = Text(name, value, errors) },
                "complexity" => merged with { Complexity = Text(name, value, errors) },
                "reviewedBy" => merged with { ReviewedBy = Text(name, value, errors) },
                "note" => merged with { Note = Text(name, value, errors) },
                "tradable" => merged with { Tradable = Flag(name, value, errors) ?? merged.Tradable },
                "quoted" => merged with { Quoted = Flag(name, value, errors) ?? merged.Quoted },
                "followed" => merged with { Followed = Flag(name, value, errors) ?? merged.Followed },
                "cap" => merged with { Cap = Number(name, value, errors) ?? merged.Cap },
                "reviewed" => merged with { Reviewed = Date(name, value, errors) },
                _ => Unknown(name, errors, merged),
            };
        }

        return errors.Count > 0 ? new Result(null, errors) : new Result(merged, []);
    }

    private static SecurityInput Unknown(string name, List<FieldError> errors, SecurityInput merged)
    {
        errors.Add(new FieldError($"/{name}", "Champ inconnu du référentiel des titres."));
        return merged;
    }

    private static string? Text(string name, JsonNode? value, List<FieldError> errors, bool required = false)
    {
        if (value is null)
        {
            if (required) errors.Add(new FieldError($"/{name}", "Ce champ ne peut pas être effacé."));
            return null;
        }

        if (value.GetValueKind() != System.Text.Json.JsonValueKind.String)
        {
            errors.Add(new FieldError($"/{name}", "Une chaîne de caractères est attendue."));
            return null;
        }

        return value.GetValue<string>();
    }

    private static bool? Flag(string name, JsonNode? value, List<FieldError> errors)
    {
        var kind = value?.GetValueKind();
        if (kind is System.Text.Json.JsonValueKind.True or System.Text.Json.JsonValueKind.False)
        {
            return value!.GetValue<bool>();
        }

        errors.Add(new FieldError($"/{name}", "Un booléen est attendu ; ce champ ne peut pas être effacé."));
        return null;
    }

    private static int? Number(string name, JsonNode? value, List<FieldError> errors)
    {
        if (value?.GetValueKind() == System.Text.Json.JsonValueKind.Number && value.AsValue().TryGetValue<int>(out var number))
        {
            return number;
        }

        errors.Add(new FieldError($"/{name}", "Un entier est attendu ; ce champ ne peut pas être effacé."));
        return null;
    }

    private static DateOnly? Date(string name, JsonNode? value, List<FieldError> errors)
    {
        if (value is null) return null;

        if (value.GetValueKind() == System.Text.Json.JsonValueKind.String
            && DateOnly.TryParseExact(value.GetValue<string>(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            return date;
        }

        errors.Add(new FieldError($"/{name}", "Une date au format aaaa-mm-jj est attendue."));
        return null;
    }
}
