namespace PortfolioManagement.Domain.Market;

/// <summary>
/// Un indice de référence et sa composition, à une date d'arrêté.
/// </summary>
/// <remarks>
/// <para>
/// <c>MarketIndex</c> et non <c>Index</c> : <see cref="System.Index"/> existe déjà, et un type de
/// domaine qui oblige à qualifier chaque usage coûte plus cher que trois lettres de préfixe.
/// </para>
/// <para>
/// La composition est <b>partielle par nature</b>. <see cref="Count"/> donne l'effectif réel de
/// l'indice — quarante pour le CAC 40 — quand <see cref="Members"/> peut n'en décrire que dix :
/// c'est le rapport des deux qui donne la part couverte, et le front l'affiche telle quelle. Servir
/// une composition incomplète sans dire combien il en manque reviendrait à la présenter comme
/// complète.
/// </para>
/// </remarks>
public sealed record MarketIndex
{
    /// <summary>Clé stable, en minuscules sans espace — <c>cac40</c>, <c>sx5e</c>.</summary>
    public required string Key { get; init; }

    /// <summary>Dénomination d'usage — « CAC 40 ».</summary>
    public required string Name { get; init; }

    /// <summary>Zone géographique, telle que les sélecteurs la groupent.</summary>
    public required string Region { get; init; }

    /// <summary>Nom d'usage de la place — « Euronext Paris ».</summary>
    public string? Place { get; init; }

    /// <summary>
    /// MIC de la place cotant l'indice.
    /// </summary>
    /// <remarks>
    /// Vide pour un indice réparti sur plusieurs places : un S&amp;P 500 cote à New York et au
    /// Nasdaq, un STOXX Europe 600 sur seize marchés. Lui attribuer un MIC unique serait faux, et
    /// tout composant qui en hériterait le serait aussi.
    /// </remarks>
    public string? Mic { get; init; }

    /// <summary>Devise de cotation de l'indice, code ISO 4217.</summary>
    public string? Currency { get; init; }

    /// <summary>Effectif réel de l'indice, même si <see cref="Members"/> en décrit moins.</summary>
    public int Count { get; init; }

    /// <summary>Précision d'usage — « 40 valeurs · révision trimestrielle · devise EUR ».</summary>
    public string? Detail { get; init; }

    /// <summary>Date d'arrêté de cette composition. À défaut, celle de l'enveloppe.</summary>
    public DateOnly? AsOf { get; init; }

    /// <summary>Les valeurs décrites, avec leur poids.</summary>
    public IReadOnlyList<IndexMember> Members { get; init; } = [];
}

/// <summary>Une valeur au sein d'un indice.</summary>
public sealed record IndexMember
{
    /// <summary>Dénomination de la valeur.</summary>
    public required string Name { get; init; }

    /// <summary>Code mnémonique sur sa place.</summary>
    public string? Ticker { get; init; }

    /// <summary>Code ISO 6166.</summary>
    public required string Isin { get; init; }

    /// <summary>Secteur d'activité, tel que la source le donne.</summary>
    public string? Sector { get; init; }

    /// <summary>
    /// Poids dans l'indice, <b>en pourcentage</b> — <c>8.4</c>, pas <c>0.084</c>.
    /// </summary>
    /// <remarks>
    /// La somme des poids livrés n'a aucune raison de valoir cent : sur une composition partielle
    /// elle vaut la part couverte, et c'est cette part que le front annonce.
    /// </remarks>
    public decimal Weight { get; init; }

    /// <summary>Capitalisation telle qu'on veut la lire — « 148 Md€ ». Libellé, pas montant.</summary>
    public string? Cap { get; init; }

    /// <summary>Avis du comité sur la valeur — <c>ok</c> ou <c>none</c>. Absent vaut « non retenue ».</summary>
    public string? Ref { get; init; }
}

/// <summary>
/// Ce qui accompagne une livraison de compositions : d'où elle vient, et de quand.
/// </summary>
/// <remarks>
/// Ces trois champs ne sont pas de la décoration. Une composition d'indice sans provenance ni date
/// d'arrêté ne se vérifie pas — elle se révise chaque trimestre, et une liste sans date ne dit pas
/// si elle décrit le marché d'aujourd'hui ou celui d'il y a deux ans.
/// </remarks>
/// <param name="Version">Version du format, pour qu'un changement futur soit détectable.</param>
/// <param name="Source">D'où vient la donnée, en clair.</param>
/// <param name="AsOf">Date d'arrêté générale, reprise par les indices qui n'en portent pas.</param>
public readonly record struct IndexFeedMetadata(string? Version, string? Source, DateOnly? AsOf);
