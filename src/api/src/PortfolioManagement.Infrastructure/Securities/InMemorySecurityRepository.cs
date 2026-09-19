using System.Diagnostics.CodeAnalysis;

using PortfolioManagement.Domain.Securities;

namespace PortfolioManagement.Infrastructure.Securities;

/// <summary>
/// Référentiel des titres tenu en mémoire, amorcé du catalogue embarqué.
/// </summary>
/// <remarks>
/// <para>
/// Rien ne survit au redémarrage, et c'est assumé pour cette tranche : l'objet du moment est de
/// fixer les conventions du contrat — pagination, <c>ETag</c>, <c>problem+json</c>, sémantique du
/// merge patch — avant de choisir un schéma. Le jour où la persistance arrive, c'est cette classe
/// qu'on remplace : <see cref="ISecurityRepository"/> ne change pas.
/// </para>
/// <para>
/// Un <see cref="Lock"/> plutôt qu'un dictionnaire concurrent : la lecture-modification-écriture
/// d'une version doit être indivisible, ce qu'un <c>ConcurrentDictionary</c> ne garantit qu'au
/// prix d'une boucle de comparaison-échange. Les sections critiques tiennent en quelques
/// instructions sur une collection de quelques dizaines d'entrées ; la contention n'est pas le
/// sujet, la justesse l'est.
/// </para>
/// </remarks>
public sealed class InMemorySecurityRepository : ISecurityRepository
{
    private readonly Lock _gate = new();
    private readonly Dictionary<string, Security> _byId;
    private readonly List<string> _order;

    /// <summary>Construit le référentiel à partir d'une graine.</summary>
    /// <param name="seed">Titres d'amorçage, dans l'ordre où ils doivent être servis.</param>
    public InMemorySecurityRepository(IEnumerable<Security> seed)
    {
        _byId = [];
        _order = [];
        foreach (var security in seed)
        {
            _byId[security.Id] = security;
            _order.Add(security.Id);
        }
    }

    /// <inheritdoc />
    public IReadOnlyList<Security> List()
    {
        lock (_gate)
        {
            return [.. _order.Select(id => _byId[id])];
        }
    }

    /// <inheritdoc />
    public Security? Find(string id)
    {
        lock (_gate)
        {
            return _byId.GetValueOrDefault(id);
        }
    }

    /// <inheritdoc />
    public WriteResult Create(Security draft)
    {
        lock (_gate)
        {
            if (TryFindDuplicate(draft.Isin, draft.Mic, null, out var clash))
            {
                return WriteResult.Conflict(
                    $"L'ISIN {draft.Isin} est déjà porté par « {clash.Name} » ({clash.Id}) sur la place {draft.Mic}.");
            }

            var created = draft with { Id = AllocateId(draft), Version = 1 };
            _byId[created.Id] = created;
            _order.Add(created.Id);
            return WriteResult.Ok(created);
        }
    }

    /// <inheritdoc />
    public WriteResult Update(string id, int expectedVersion, Func<Security, Security> change)
    {
        lock (_gate)
        {
            if (!_byId.TryGetValue(id, out var current)) return WriteResult.NotFound();
            if (current.Version != expectedVersion) return WriteResult.Stale();

            var next = change(current);

            // L'identifiant, la version et le dérivé des positions ne sont pas à la main du client :
            // ils sont réimposés ici, quoi qu'ait produit la transformation.
            next = next with
            {
                Id = current.Id,
                Version = current.Version + 1,
                Held = current.Held,
                Mandates = current.Mandates,
            };

            if (TryFindDuplicate(next.Isin, next.Mic, id, out var clash))
            {
                return WriteResult.Conflict(
                    $"L'ISIN {next.Isin} est déjà porté par « {clash.Name} » ({clash.Id}) sur la place {next.Mic}.");
            }

            _byId[id] = next;
            return WriteResult.Ok(next);
        }
    }

    /// <inheritdoc />
    public WriteResult Delete(string id, int expectedVersion)
    {
        lock (_gate)
        {
            if (!_byId.TryGetValue(id, out var current)) return WriteResult.NotFound();
            if (current.Version != expectedVersion) return WriteResult.Stale();
            if (!current.IsDeletable) return WriteResult.Conflict(current.DeleteBlockedReason);

            _byId.Remove(id);
            _order.Remove(id);
            return WriteResult.Ok(current);
        }
    }

    /// <summary>
    /// Un même ISIN peut être coté sur plusieurs places — c'est le couple qui identifie une ligne
    /// de référentiel, pas l'ISIN seul. Un titre sans ISIN n'entre dans aucun doublon.
    /// </summary>
    private bool TryFindDuplicate(string? isin, string mic, string? ignoredId, [NotNullWhen(true)] out Security? clash)
    {
        clash = null;
        if (string.IsNullOrEmpty(isin)) return false;

        foreach (var candidate in _byId.Values)
        {
            if (candidate.Id == ignoredId) continue;
            if (candidate.Isin == isin && candidate.Mic == mic)
            {
                clash = candidate;
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Identifiant lisible plutôt qu'aléatoire : <c>SEC-AAPL</c> se retrouve dans un journal, une
    /// URL ou un ticket sans qu'on ait à le résoudre. Le MIC départage deux cotations du même
    /// mnémonique, et un compteur tranche le reste.
    /// </summary>
    private string AllocateId(Security draft)
    {
        var root = $"SEC-{draft.Ticker.ToUpperInvariant()}";
        if (!_byId.ContainsKey(root)) return root;

        var qualified = $"{root}-{draft.Mic.ToUpperInvariant()}";
        if (!_byId.ContainsKey(qualified)) return qualified;

        for (var suffix = 2; ; suffix++)
        {
            var candidate = $"{qualified}-{suffix}";
            if (!_byId.ContainsKey(candidate)) return candidate;
        }
    }
}
