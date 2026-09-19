namespace PortfolioManagement.Domain.Securities;

/// <summary>
/// Un titre du référentiel.
/// </summary>
/// <remarks>
/// <para>
/// Trois familles de propriétés cohabitent ici, et elles n'ont pas le même propriétaire.
/// </para>
/// <para>
/// <b>Le contrat</b> — de <see cref="Id"/> à <see cref="Quoted"/> — est ce que décrit
/// <c>openapi.yaml</c>. C'est le noyau : ce que tout consommateur peut attendre.
/// </para>
/// <para>
/// <b>La fiche</b> — notation, liquidité, classification ESG, domicile, revue du comité — est la
/// due diligence attachée au titre. Elle vient du référentiel, elle s'édite avec lui, et l'écran
/// Titres l'affiche dans son panneau latéral. Elle a été ajoutée au contrat parce que sans elle le
/// front perdait sa fiche en passant du catalogue embarqué à l'API.
/// </para>
/// <para>
/// <b>Le dérivé</b> — <see cref="Held"/> et <see cref="Mandates"/> — ne s'écrit pas. Ces deux
/// propriétés viennent des positions, et elles sont ici parce qu'une règle en dépend : un titre
/// détenu ne se supprime pas. Elles sont en lecture seule dans le contrat, et le jour où le module
/// Positions existera elles seront calculées au lieu d'être portées.
/// </para>
/// </remarks>
public sealed record Security
{
    /// <summary>Identifiant stable, de la forme <c>SEC-AAPL</c>.</summary>
    public required string Id { get; init; }

    /// <summary>Code mnémonique sur sa place de cotation.</summary>
    public required string Ticker { get; init; }

    /// <summary>Dénomination du titre.</summary>
    public required string Name { get; init; }

    /// <summary>Code ISO 6166, clé de contrôle comprise. Absent pour un instrument qui n'en a pas.</summary>
    public string? Isin { get; init; }

    /// <summary>Code ISO 10383 de la place. <c>OTC</c> pour un instrument hors marché.</summary>
    public required string Mic { get; init; }

    /// <summary>Nom lisible de la place — « Euronext Paris ». Dérivé du MIC, jamais saisi.</summary>
    public string? Place { get; init; }

    /// <summary>Devise de cotation, code ISO 4217.</summary>
    public required string Currency { get; init; }

    /// <summary>Nature de l'instrument — Action, ETF, Fonds, Index.</summary>
    public string? AssetClass { get; init; }

    /// <summary>Zone géographique de rattachement.</summary>
    public string? Region { get; init; }

    /// <summary>Le titre est-il ouvert à la négociation ?</summary>
    public bool Tradable { get; init; } = true;

    /// <summary>
    /// Faux pour un instrument non coté en continu — fonds fermé, co-investissement — dont la
    /// valeur est une valeur liquidative publiée, non un cours.
    /// </summary>
    public bool Quoted { get; init; } = true;

    /// <summary>
    /// Le titre est-il tenu en veille plutôt qu'à l'achat ?
    /// </summary>
    /// <remarks>
    /// C'est ici que la veille est détenue, et nulle part ailleurs : l'écran Titres met un titre
    /// sous surveillance en patchant ce champ, puis relit les deux listes. Il empilait autrefois
    /// ses propres mises en suivi par-dessus une constante figée dans son code, ce qui donnait deux
    /// définitions d'un même fait et une veille perdue à chaque rechargement.
    /// </remarks>
    public bool Followed { get; init; }

    // -- Fiche de référentiel ---------------------------------------------------------------

    /// <summary>Notation de crédit et son agence — « A− (S&amp;P) ».</summary>
    public string? Rating { get; init; }

    /// <summary>
    /// Plafond de concentration, en pourcentage de l'actif net par compte. Zéro pour « aucun
    /// plafond » — c'est ainsi que l'écran le lit et l'affiche, et non comme un rang de taille.
    /// </summary>
    public int Cap { get; init; }

    /// <summary>Appréciation de liquidité, volume moyen compris.</summary>
    public string? Liquidity { get; init; }

    /// <summary>Classification extra-financière — « Article 8 SFDR ».</summary>
    public string? Esg { get; init; }

    /// <summary>Pays de domiciliation de l'émetteur ou du fonds.</summary>
    public string? Domicile { get; init; }

    /// <summary>Qualification MIF — « Non complexe », « Complexe ».</summary>
    public string? Complexity { get; init; }

    /// <summary>Date de la dernière revue du titre.</summary>
    public DateOnly? Reviewed { get; init; }

    /// <summary>Instance qui a mené cette revue.</summary>
    public string? ReviewedBy { get; init; }

    /// <summary>Commentaire libre du comité.</summary>
    public string? Note { get; init; }

    // -- Dérivé des positions, en lecture seule ---------------------------------------------

    /// <summary>Quantité détenue, tous comptes confondus.</summary>
    public int Held { get; init; }

    /// <summary>Comptes qui portent ce titre, en position ou en historique.</summary>
    public IReadOnlyList<string> Mandates { get; init; } = [];

    // -- Concurrence ------------------------------------------------------------------------

    /// <summary>
    /// Numéro de version, incrémenté à chaque écriture. C'est lui que l'<c>ETag</c> transporte :
    /// une valeur opaque pour le client, qui la rend telle quelle en <c>If-Match</c>.
    /// </summary>
    public int Version { get; init; } = 1;

    /// <summary>
    /// Le titre peut-il être retiré du référentiel ?
    /// </summary>
    /// <remarks>
    /// Non s'il est encore référencé par une position ou un historique de compte : il cesserait
    /// d'être résoluble dans des écritures passées, et la piste d'audit serait rompue. Pour un
    /// titre qu'on ne veut plus négocier sans rompre l'historique, il faut passer
    /// <see cref="Tradable"/> à faux — c'est exactement ce que dit le contrat.
    /// </remarks>
    public bool IsDeletable => Held == 0 && Mandates.Count == 0;

    /// <summary>Pourquoi la suppression est refusée, en clair. Chaîne vide si elle est permise.</summary>
    public string DeleteBlockedReason => (Held, Mandates.Count) switch
    {
        (> 0, _) => $"Le titre est détenu à hauteur de {Held} unité(s) et ne peut être retiré du référentiel.",
        (_, > 0) => $"Le titre figure dans l'historique de {Mandates.Count} compte(s) et ne peut être retiré du référentiel.",
        _ => string.Empty,
    };
}
