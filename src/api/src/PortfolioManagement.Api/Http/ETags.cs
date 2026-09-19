using System.Globalization;

using Microsoft.Net.Http.Headers;

namespace PortfolioManagement.Api.Http;

/// <summary>
/// Traduction entre le numéro de version d'une ressource et l'<c>ETag</c> qui la transporte.
/// </summary>
/// <remarks>
/// L'étiquette est opaque pour le client : il la reçoit en <c>ETag</c> et la rend en
/// <c>If-Match</c>, sans jamais avoir à l'interpréter. Qu'elle contienne aujourd'hui un compteur
/// et demain une empreinte ne regarde que le serveur — c'est précisément ce que garantit le fait
/// de ne la fabriquer et ne la lire qu'ici.
/// </remarks>
public static class ETags
{
    /// <summary>L'étiquette forte correspondant à cette version.</summary>
    public static string For(int version) => $"\"{version.ToString(CultureInfo.InvariantCulture)}\"";

    /// <summary>
    /// L'étiquette forte correspondant à ce contenu.
    /// </summary>
    /// <remarks>
    /// Pour une ressource que personne n'écrit, il n'y a pas de compteur à incrémenter : l'identité
    /// d'une version se lit dans le contenu lui-même. L'empreinte est fabriquée ici plutôt que chez
    /// l'appelant, pour la même raison que le reste de cette classe — une étiquette est opaque au
    /// client, et elle ne le reste que si un seul endroit décide de sa forme.
    ///
    /// SHA-256 tronqué : ce n'est pas un usage cryptographique, seulement le besoin qu'une
    /// modification change l'étiquette. Seize caractères hexadécimaux suffisent largement à ce que
    /// deux contenus distincts ne se confondent pas.
    /// </remarks>
    /// <param name="content">Ce qui identifie la représentation servie.</param>
    public static string ForContent(string content)
    {
        var digest = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(content));
        return $"\"{Convert.ToHexStringLower(digest.AsSpan(0, 8))}\"";
    }

    /// <summary>
    /// Lit l'<c>If-Match</c> de la requête.
    /// </summary>
    /// <param name="request">Requête entrante.</param>
    /// <param name="version">Version revendiquée par le client, si l'en-tête est exploitable.</param>
    /// <returns>
    /// <c>false</c> si l'en-tête est absent, vide, ou porte une étiquette que ce serveur n'a pas
    /// pu émettre. Le refus est délibérément indifférencié : dans tous ces cas la réponse est la
    /// même, et détailler laquelle des trois s'est produite n'aide personne.
    /// </returns>
    public static bool TryReadIfMatch(HttpRequest request, out int version)
    {
        version = 0;

        var header = request.Headers.IfMatch;
        if (header.Count == 0) return false;

        var raw = header[0];
        if (string.IsNullOrWhiteSpace(raw)) return false;

        // « * » vaut « n'importe quelle version » : le client affirme vouloir écrire quoi qu'il
        // arrive. On ne l'accepte pas — le contrat exige une version précise, et un référentiel
        // se corrige à partir de ce qu'on a lu, pas à l'aveugle.
        if (!EntityTagHeaderValue.TryParse(raw, out var tag) || tag.Tag.Length < 3) return false;

        return int.TryParse(tag.Tag.Value!.AsSpan(1, tag.Tag.Length - 2), NumberStyles.None, CultureInfo.InvariantCulture, out version);
    }
}
