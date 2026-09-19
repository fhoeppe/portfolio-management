# Configuration

## Hiérarchie de chargement

Du moins prioritaire au plus prioritaire :

1. `appsettings.json`
2. `appsettings.{Environment}.json` — `Development`, `Staging`, `Production`
3. **User secrets** (développement local uniquement, jamais versionné)
4. **Variables d'environnement** — le double souligné sépare les sections : `Authentication__Jwt__SigningKey`
5. Arguments de ligne de commande

## Clés

| Clé | Type | Défaut | Obligatoire | Rôle |
|---|---|---|---|---|
| `Authentication:Enabled` | booléen | `true` (`false` en développement) | oui | Le jeton porteur est-il réclamé ? |
| `Authentication:Jwt:Issuer` | chaîne | `https://api.portfolio-management.example` | si `Enabled` | Émetteur attendu. |
| `Authentication:Jwt:Audience` | chaîne | `portfolio-management` | si `Enabled` | Audience attendue. |
| `Authentication:Jwt:SigningKey` | chaîne | — | si `Enabled` | Clé symétrique, **32 caractères au moins**. Jamais versionnée. |
| `Cors:AllowedOrigins` | tableau de chaînes | `[]` (`["http://localhost:4200"]` en développement) | non | Origines autorisées à appeler l'API depuis un navigateur. |
| `Logging:LogLevel:*` | chaîne | `Information` | non | Verbosité, par catégorie. |

## L'authentification désactivée

`Authentication:Enabled = false` **ne désarme pas le pipeline** : les opérations exigent toujours
un principal et les autorisations s'évaluent. Seule la provenance de l'identité change — un schéma
de substitution authentifie chaque requête sous une identité de développement, en attendant qu'un
émetteur de jetons existe.

Le démarrage **échoue** si cette valeur est fausse hors de l'environnement `Development` :

```
Authentication:Enabled ne peut valoir false qu'en développement.
```

Un binaire qui authentifierait tout le monde en exploitation est un incident, pas une commodité.

## Secrets

En développement :

```bash
cd src/PortfolioManagement.Api
dotnet user-secrets init
dotnet user-secrets set "Authentication:Jwt:SigningKey" "…au moins 32 caractères…"
```

En exploitation, par variable d'environnement — jamais dans un `appsettings` versionné :

```bash
Authentication__Enabled=true
Authentication__Jwt__SigningKey=…
Cors__AllowedOrigins__0=https://app.example.com
```

`appsettings.json` porte `SigningKey: ""` **délibérément** : la clé vide fait échouer le démarrage
avec un message qui dit quoi renseigner, là où une clé d'exemple risquerait d'atteindre la
production.

## Rotation de la clé de signature

La validation n'accepte qu'une clé à la fois. Une rotation sans coupure demande donc de tolérer
transitoirement deux clés — ce que le code ne fait pas encore. Aujourd'hui : fenêtre de
maintenance, nouvelle valeur, redémarrage, et les jetons émis sous l'ancienne clé sont refusés.
À reprendre quand l'émission de jetons existera.

## Ce qui n'est pas configurable, et pourquoi

| | |
|---|---|
| **Le catalogue d'amorçage** | Embarqué dans l'assembly. Rien à déposer pour que l'API réponde. |
| **La taille de page maximale** (200) | Le contrat la fixe ; la rendre réglable, c'est permettre à un déploiement de s'en écarter. |
| **La rétention des clés d'idempotence** (24 h) | Une clé couvre une reprise immédiate, pas l'unicité d'une création dans le temps. |
| **La tolérance d'horloge JWT** (zéro) | Le défaut de cinq minutes prolonge silencieusement la validité d'un jeton révoqué. |
