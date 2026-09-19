namespace PortfolioManagement.Api.Modules.Market;

/// <summary>Une valeur au sein d'un indice, telle qu'elle est servie.</summary>
/// <param name="Name">Dénomination de la valeur.</param>
/// <param name="Ticker">Code mnémonique sur sa place.</param>
/// <param name="Isin">Code ISO 6166.</param>
/// <param name="Sector">Secteur d'activité, tel que la source le donne.</param>
/// <param name="Weight">Poids dans l'indice, en pourcentage — <c>8.4</c>, pas <c>0.084</c>.</param>
/// <param name="Cap">Capitalisation telle qu'on veut la lire. Libellé, pas montant calculable.</param>
/// <param name="Ref">Avis du comité — <c>ok</c> ou <c>none</c>. Absent vaut « non retenue ».</param>
public sealed record IndexMemberResponse(
    string Name,
    string? Ticker,
    string Isin,
    string? Sector,
    decimal Weight,
    string? Cap,
    string? Ref);

/// <summary>Un indice et sa composition, tels qu'ils sont servis.</summary>
/// <param name="Key">Clé stable, en minuscules sans espace.</param>
/// <param name="Name">Dénomination d'usage.</param>
/// <param name="Region">Zone géographique.</param>
/// <param name="Place">Nom d'usage de la place.</param>
/// <param name="Mic">MIC de la place. Absent pour un indice réparti sur plusieurs places.</param>
/// <param name="Currency">Devise de cotation, code ISO 4217.</param>
/// <param name="Count">Effectif réel de l'indice, même si <paramref name="Members"/> en décrit moins.</param>
/// <param name="Detail">Précision d'usage.</param>
/// <param name="AsOf">Date d'arrêté de cette composition.</param>
/// <param name="Members">Les valeurs décrites, avec leur poids.</param>
public sealed record IndexResponse(
    string Key,
    string Name,
    string Region,
    string? Place,
    string? Mic,
    string? Currency,
    int Count,
    string? Detail,
    DateOnly? AsOf,
    IReadOnlyList<IndexMemberResponse> Members);

/// <summary>Enveloppe de livraison des compositions.</summary>
/// <remarks>
/// Les trois champs de tête ne sont pas de la décoration : une composition d'indice sans
/// provenance ni date d'arrêté ne se vérifie pas, et le front les affiche telles quelles.
/// </remarks>
/// <param name="Version">Version du format, pour qu'un changement futur soit détectable.</param>
/// <param name="Source">D'où vient la donnée, en clair.</param>
/// <param name="AsOf">Date d'arrêté générale, reprise par les indices qui n'en portent pas.</param>
/// <param name="Indices">Les indices et leur composition.</param>
public sealed record IndexFeedResponse(
    string? Version,
    string? Source,
    DateOnly? AsOf,
    IReadOnlyList<IndexResponse> Indices);

/// <summary>Critères de la liste des indices.</summary>
/// <param name="Keys">Clés retenues. Vide, la liste n'est pas restreinte.</param>
/// <param name="Region">Zone géographique retenue, le cas échéant.</param>
public readonly record struct IndexQuery(IReadOnlyList<string> Keys, string? Region);
