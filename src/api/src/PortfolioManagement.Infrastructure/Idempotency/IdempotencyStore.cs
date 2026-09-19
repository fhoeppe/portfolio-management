namespace PortfolioManagement.Infrastructure.Idempotency;

/// <summary>Réponse conservée pour être rejouée à l'identique.</summary>
/// <param name="StatusCode">Statut de la réponse d'origine.</param>
/// <param name="Location">En-tête <c>Location</c> de la création.</param>
/// <param name="ETag">En-tête <c>ETag</c> de la ressource créée.</param>
/// <param name="Body">Corps JSON sérialisé, rendu tel quel.</param>
public sealed record IdempotentResponse(int StatusCode, string? Location, string? ETag, string Body);

/// <summary>
/// Mémoire des clés d'idempotence.
/// </summary>
/// <remarks>
/// <para>
/// Ce que résout cette mémoire : un client envoie une création, le réseau coupe avant la réponse,
/// il renvoie. Sans clé, le référentiel se retrouve avec deux titres ; avec elle, le serveur
/// reconnaît la tentative et rejoue la réponse d'origine au lieu de créer une seconde fois.
/// </para>
/// <para>
/// La rétention est courte — vingt-quatre heures — parce qu'une clé sert à couvrir une reprise
/// immédiate, pas à garantir l'unicité d'une création dans le temps. Le ménage se fait à
/// l'insertion : rien à planifier, et une mémoire qui ne sert pas ne coûte rien.
/// </para>
/// </remarks>
public sealed class IdempotencyStore(TimeProvider clock)
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly Lock _gate = new();
    private readonly Dictionary<string, (IdempotentResponse Response, DateTimeOffset StoredAt)> _entries = [];

    /// <summary>La clé a-t-elle déjà été honorée ? Rend alors la réponse à rejouer.</summary>
    public IdempotentResponse? Recall(string key)
    {
        lock (_gate)
        {
            if (!_entries.TryGetValue(key, out var entry)) return null;
            if (clock.GetUtcNow() - entry.StoredAt > Retention)
            {
                _entries.Remove(key);
                return null;
            }

            return entry.Response;
        }
    }

    /// <summary>Retient la réponse produite pour cette clé.</summary>
    public void Remember(string key, IdempotentResponse response)
    {
        lock (_gate)
        {
            var now = clock.GetUtcNow();
            foreach (var stale in _entries.Where(e => now - e.Value.StoredAt > Retention).Select(e => e.Key).ToList())
            {
                _entries.Remove(stale);
            }

            _entries[key] = (response, now);
        }
    }
}
