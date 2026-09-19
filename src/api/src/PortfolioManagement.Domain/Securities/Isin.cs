namespace PortfolioManagement.Domain.Securities;

/// <summary>
/// Contrôle d'un code ISIN (ISO 6166).
/// </summary>
/// <remarks>
/// Le motif du contrat — deux lettres de pays, neuf caractères, une clé — ne vérifie que la forme.
/// La clé se vérifie en plus, et c'est elle qui compte : un ISIN bien formé mais de clé fausse
/// désigne un autre titre ou aucun, et une faute de frappe passe le motif une fois sur dix.
/// Le front applique déjà ce contrôle à l'entrée d'un référentiel chargé ; l'API ne peut pas être
/// plus laxiste que le client qu'elle sert.
/// </remarks>
public static class Isin
{
    /// <summary>Le code est-il bien formé et sa clé de contrôle juste ?</summary>
    public static bool IsValid(string? isin)
    {
        if (string.IsNullOrEmpty(isin) || isin.Length != 12) return false;
        if (!char.IsAsciiLetterUpper(isin[0]) || !char.IsAsciiLetterUpper(isin[1])) return false;
        if (!char.IsAsciiDigit(isin[11])) return false;

        for (var i = 2; i < 11; i++)
        {
            if (!char.IsAsciiDigit(isin[i]) && !char.IsAsciiLetterUpper(isin[i])) return false;
        }

        // Un identifiant national tout à zéro — « XX0000000000 » — a une clé arithmétiquement juste,
        // la somme valant zéro. Il ne désigne pourtant aucun titre : c'est le remplissage type d'une
        // extraction bâclée. Le front le refuse déjà ; l'API ne peut pas être plus tolérante.
        if (isin.AsSpan(2).IndexOfAnyExcept('0') < 0) return false;

        return Checksum(isin) == isin[11] - '0';
    }

    /// <summary>
    /// Clé attendue : chaque lettre devient son rang alphabétique décalé de 10 — A vaut 10, Z vaut
    /// 35 —, ce qui donne une chaîne de chiffres, puis module 10 à doublement alterné en partant
    /// de la droite.
    /// </summary>
    private static int Checksum(string isin)
    {
        Span<char> digits = stackalloc char[24];
        var length = 0;

        for (var i = 0; i < 11; i++)
        {
            var c = isin[i];
            if (char.IsAsciiDigit(c))
            {
                digits[length++] = c;
            }
            else
            {
                var rank = c - 'A' + 10;
                digits[length++] = (char)('0' + rank / 10);
                digits[length++] = (char)('0' + rank % 10);
            }
        }

        var sum = 0;
        var doubling = true;
        for (var i = length - 1; i >= 0; i--)
        {
            var value = digits[i] - '0';
            if (doubling)
            {
                value *= 2;
                if (value > 9) value -= 9;
            }
            doubling = !doubling;
            sum += value;
        }

        return (10 - sum % 10) % 10;
    }
}
