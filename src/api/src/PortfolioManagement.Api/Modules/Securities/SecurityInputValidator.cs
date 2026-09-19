using System.Text.RegularExpressions;

using FluentValidation;

using PortfolioManagement.Domain.Securities;

namespace PortfolioManagement.Api.Modules.Securities;

/// <summary>
/// Contrôle d'une représentation d'écriture, avant qu'elle n'atteigne le référentiel.
/// </summary>
/// <remarks>
/// <c>PUT</c> et <c>PATCH</c> passent tous deux par ici : le second fabrique la représentation
/// complète qui résulte de la fusion, puis la soumet au même contrôle. Un patch ne peut donc pas
/// mener à un état qu'une écriture intégrale aurait refusé, et les deux verbes ne peuvent pas
/// diverger au fil des règles ajoutées.
/// </remarks>
public sealed partial class SecurityInputValidator : AbstractValidator<SecurityInput>
{
    /// <summary>
    /// Déclare les règles.
    /// </summary>
    /// <remarks>
    /// Chaque <c>When</c> porte <see cref="ApplyConditionTo.CurrentValidator"/>, et ce n'est pas
    /// décoratif : sans cette portée, la condition s'applique à toute la chaîne qui la précède, et
    /// un « ne vérifier la forme que si le champ est renseigné » désactive du même coup le
    /// « le champ est obligatoire » placé juste au-dessus. Le champ vide passe alors sans un mot.
    /// </remarks>
    public SecurityInputValidator()
    {
        RuleFor(x => x.Ticker)
            .NotEmpty().WithMessage("Le mnémonique est obligatoire.")
            .MaximumLength(20).WithMessage("Le mnémonique ne dépasse pas 20 caractères.")
            .Must(ticker => TickerShape().IsMatch(ticker!.Trim().ToUpperInvariant()))
                .When(x => !string.IsNullOrWhiteSpace(x.Ticker), ApplyConditionTo.CurrentValidator)
                .WithMessage("Le mnémonique n'accepte que lettres, chiffres, point et tiret.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("La dénomination est obligatoire.")
            .MaximumLength(200).WithMessage("La dénomination ne dépasse pas 200 caractères.");

        RuleFor(x => x.Mic)
            .NotEmpty().WithMessage("Le code de place (MIC) est obligatoire.")
            .Must(mic => MicShape().IsMatch(mic!.Trim().ToUpperInvariant()))
                .When(x => !string.IsNullOrWhiteSpace(x.Mic), ApplyConditionTo.CurrentValidator)
                .WithMessage("Le code de place attendu est un code ISO 10383 de 3 ou 4 caractères.");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("La devise est obligatoire.")
            .Must(currency => CurrencyShape().IsMatch(currency!.Trim().ToUpperInvariant()))
                .When(x => !string.IsNullOrWhiteSpace(x.Currency), ApplyConditionTo.CurrentValidator)
                .WithMessage("La devise attendue est un code ISO 4217 de trois lettres — EUR, USD.");

        // L'ISIN est facultatif ; présent, il est vérifié jusqu'à sa clé de contrôle. Un code bien
        // formé mais de clé fausse désigne un autre titre ou aucun, et c'est exactement ce qu'une
        // faute de frappe produit une fois sur dix.
        RuleFor(x => x.Isin)
            .Must(isin => Isin.IsValid(isin!.Trim().ToUpperInvariant()))
            .When(x => !string.IsNullOrWhiteSpace(x.Isin), ApplyConditionTo.CurrentValidator)
            .WithMessage("L'ISIN est invalide : la clé de contrôle ne correspond pas au code.");

        // Un pourcentage, et non un rang. Les bornes 1-5 venaient d'une lecture erronée du champ :
        // elles refusaient sept des quinze titres livrés — dont deux des quatre tenus en veille —
        // et toute écriture sur eux repartait en 422 sur une propriété que le client n'avait pas
        // touchée. Un patch qui ne nomme que `followed` ne doit pas buter sur le plafond.
        RuleFor(x => x.Cap)
            .InclusiveBetween(0, 100)
            .WithMessage("Le plafond de concentration s'exprime en pourcentage de l'actif net, de 0 à 100.");

        RuleFor(x => x.Rating).MaximumLength(60);
        RuleFor(x => x.Liquidity).MaximumLength(200);
        RuleFor(x => x.Esg).MaximumLength(120);
        RuleFor(x => x.Domicile).MaximumLength(120);
        RuleFor(x => x.Complexity).MaximumLength(120);
        RuleFor(x => x.AssetClass).MaximumLength(60);
        RuleFor(x => x.Region).MaximumLength(120);
        RuleFor(x => x.ReviewedBy).MaximumLength(160);
        RuleFor(x => x.Note).MaximumLength(2000);
    }

    [GeneratedRegex(@"^[A-Z0-9.\-]{1,20}$")]
    private static partial Regex TickerShape();

    [GeneratedRegex("^[A-Z0-9]{3,4}$")]
    private static partial Regex MicShape();

    [GeneratedRegex("^[A-Z]{3}$")]
    private static partial Regex CurrencyShape();
}
