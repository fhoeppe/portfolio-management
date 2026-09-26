# API — Portfolio Management

API ASP.NET Core qui sert le contrat décrit par [`../angular/openapi/openapi.yaml`](../angular/openapi/openapi.yaml).

## État

**Première tranche : le référentiel des titres.** Les six opérations de `/securities` sont
implémentées de bout en bout, avec les conventions que le contrat fixe pour toutes les ressources à
venir — pagination, `ETag` / `If-Match`, `application/problem+json`, JSON Merge Patch, clé
d'idempotence.

Les dix-huit autres chemins du contrat — comptes, positions, transactions, places, cours,
calendriers — ne sont pas servis. Le bouchon Prism les couvre toujours (`npm run mock` côté
Angular).

## Démarrer

```bash
dotnet run --project src/PortfolioManagement.Api --urls http://localhost:8080
```

L'API écoute sur `http://localhost:8080`, le contrat étant servi sous `/v1`. Depuis le dossier
`../angular`, `npm run api` fait la même chose.

```bash
curl http://localhost:8080/health
curl 'http://localhost:8080/v1/securities?pageSize=5'
curl http://localhost:8080/v1/openapi.yaml
```

## Swagger

<http://localhost:8080/swagger> affiche le contrat et permet de l'essayer.

C'est l'**interface** de Swagger seule (`Swashbuckle.AspNetCore.SwaggerUI`, sans le générateur) :
elle lit `/v1/openapi.yaml`, le document écrit à la main, et ne produit rien. Les 18 chemins pas
encore servis y figurent donc, et répondent `404` — l'écart entre ce qui est promis et ce qui est
rendu reste visible, ce qui est tout l'intérêt d'un contrat qu'on n'a pas généré depuis le code.

« Try it out » fonctionne sans se connecter en développement, où toute requête est authentifiée ;
le bouton **Authorize** sert au jeton porteur hors développement. Le contrat déclarant la
production en premier serveur, un intercepteur réémet chaque essai vers l'origine qui sert la page
— l'essai porte donc toujours sur le serveur qu'on a sous la main.

Les deux listes de l'écran Titres s'obtiennent par composition de critères, et non par deux
sous-ressources :

```bash
curl 'http://localhost:8080/v1/securities?tradable=true&followed=false'   # 11 titres négociables
curl 'http://localhost:8080/v1/securities?followed=true'                  #  4 titres suivis
```

`tradable` et `followed` sont deux faits indépendants : un titre en veille reste autorisé par le
référentiel — ce qui le retient, c'est la veille, pas un refus. `?tradable=true` seul rend donc
aussi les titres suivis, d'où les deux critères sur la liste des négociables.

Le serveur de développement Angular est configuré pour relayer `/v1` vers le port 8080
(`proxy.conf.api.json`) : un simple `ng serve` suffit, et **l'application continue de fonctionner
API arrêtée** — le catalogue embarqué prend le relais.

## Tests

```bash
dotnet test
```

78 tests, dont la suite HTTP complète montée sur `WebApplicationFactory` : un hôte par test, pour
qu'aucun ne dépende de ce qu'un autre a écrit.

## Structure

```
src/
  PortfolioManagement.Domain/          entités et règles — ne dépend d'aucun framework
    Securities/  Security, Isin, ISecurityRepository
  PortfolioManagement.Infrastructure/  persistance et données de référence
    Securities/  InMemorySecurityRepository, SecuritySeed, PlaceDirectory
    Idempotency/ IdempotencyStore
    Seed/        securities.seed.json — le catalogue d'amorçage
  PortfolioManagement.Api/             pipeline HTTP
    Http/        Problems, ETags, ApiJson, ReplayedResult — transverse à tous les modules
    Modules/
      Securities/  endpoints, DTO, validation, correspondance, lecture du merge patch
    Authentication/
tests/
  PortfolioManagement.Tests/
```

Un module par famille du contrat. `Program.cs` n'est qu'une liste : `AddSecuritiesModule()` puis
`MapSecurities()`. Les cinq familles restantes suivront la même forme.

## Décisions, et pourquoi

**Le contrat est écrit à la main, pas généré.** Il est servi tel quel sur `/v1/openapi.yaml`. Un
document produit par l'implémentation décrirait ce qu'elle fait, pas ce qu'elle doit faire — les
deux cesseraient de pouvoir se contredire utilement.

**La persistance est en mémoire.** Rien ne survit au redémarrage. L'objet de cette tranche est de
fixer les conventions avant de choisir un schéma ; `ISecurityRepository` est la couture par laquelle
une base entrera, et elle ne changera pas.

**Ni EF Core, ni MediatR, ni Mapperly.** Le premier n'a rien à faire sans base. Les deux autres
rendent service à partir d'une certaine surface — une ressource et six opérations ne l'atteignent
pas, et un intermédiaire qu'on traverse sans y rien décider se lit moins bien qu'un appel direct.

**Le jeton porteur est déclaré mais pas réclamé en développement.** Le pipeline d'authentification
est en place et chaque opération exige un principal ; en développement, un schéma de substitution
authentifie toute requête. Le démarrage **refuse** cette configuration hors développement. Voir
[`docs/configuration.md`](docs/configuration.md).

**`400` contre `422`.** `400` quand la requête ne se lit pas — JSON invalide, `page=abc`. `422`
quand elle se lit parfaitement mais qu'un champ est refusé. Seul le second porte des pointeurs
JSON vers les champs fautifs, puisque c'est le seul où un champ est identifiable.

**`428` contre `412`.** L'`If-Match` manquant est un `428`, l'`If-Match` périmé un `412`. Ce n'est
pas la même erreur et le client n'y répond pas pareil : au premier il relit, au second il recharge
et rejoue.

## Ce que le catalogue d'amorçage a corrigé

Les quinze titres viennent du prototype, repris tels quels — à une exception près : **dix de leurs
ISINs avaient une clé de contrôle fausse**. Le catalogue embarqué du front n'était jamais vérifié
(import direct), mais tout ce qui passe par `parseSecurities` les écarte. L'écran aurait affiché
quatre titres sur quinze le jour où il a cessé de lire l'embarqué. Les clés ont été recalculées ici
et dans `titres-data.ts`, `positions-data.ts` et `transactions-data.ts`, pour que les quatre sources
ne divergent pas.

## Prochaines étapes

1. Servir `sector`, `activity` et `index` : l'écran Titres les porte encore dans sa table
   `MARKET_INFO`, qui double — et prime sur — ce que le référentiel sert.
2. Étendre au module Comptes, puis Positions. Positions est en lecture seule dans le contrat et
   rendra enfin `held` / `mandates` calculés au lieu d'être portés par la graine.
3. Choisir la persistance. `ISecurityRepository` ne changera pas ; `InMemorySecurityRepository`
   sera remplacé.
