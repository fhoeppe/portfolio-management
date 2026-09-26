using System.Text.Json.Serialization;

using PortfolioManagement.Api.Authentication;
using PortfolioManagement.Api.Http;
using PortfolioManagement.Api.Modules.Market;
using PortfolioManagement.Api.Modules.Securities;
using PortfolioManagement.Infrastructure.Idempotency;

var builder = WebApplication.CreateBuilder(args);

// ── Services ───────────────────────────────────────────────────────────────────────────────

builder.Services.ConfigureHttpJsonOptions(json =>
{
    json.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    json.SerializerOptions.PropertyNameCaseInsensitive = true;
});

// Les erreurs non rattrapées ressortent en application/problem+json, comme celles que les
// endpoints fabriquent : un client n'a pas à distinguer une règle métier d'un incident serveur
// pour savoir lire la réponse.
builder.Services.AddProblemDetails();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IdempotencyStore>();
builder.Services.AddSecuritiesModule();
builder.Services.AddMarketModule();
builder.AddApiAuthentication();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .WithHeaders("Authorization", "Content-Type", "If-Match", "Idempotency-Key")
    // Sans cette ligne, un navigateur ne voit ni l'ETag ni le Location : la lecture-modification
    // du contrat devient impossible depuis une page servie par une autre origine.
    .WithExposedHeaders("ETag", "Location", "Idempotent-Replay")
    .AllowAnyMethod()));

var app = builder.Build();

// ── Pipeline ───────────────────────────────────────────────────────────────────────────────

app.UseExceptionHandler();
app.UseStatusCodePages();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Swagger ────────────────────────────────────────────────────────────────────────────────

// L'interface seule, montée sur le contrat écrit à la main servi plus bas : pas de générateur,
// donc rien qui décrive l'implémentation à la place du contrat (voir README, « Décisions »).
// Elle reste anonyme comme le document qu'elle affiche — ce que les opérations, elles, exigent,
// se règle dans l'interface par le bouton « Authorize ».
app.UseSwaggerUI(ui =>
{
    ui.RoutePrefix = "swagger";
    ui.DocumentTitle = "Portfolio Management — contrat de l'API";
    ui.SwaggerEndpoint("/v1/openapi.yaml", "Portfolio Management v1");

    // Le contrat déclare la production en premier serveur, l'environnement local en second :
    // « Try it out » partirait donc vers api.portfolio-management.example. Plutôt que de
    // réordonner le document — l'ordre y est une information, pas un réglage d'outil — chaque
    // requête est réémise vers l'origine qui sert cette page. L'essai porte ainsi toujours sur
    // le serveur qu'on a sous la main, quel que soit le serveur choisi dans la liste.
    // Écrit sur une seule ligne : Swashbuckle sérialise cette fonction en JSON puis la dépose
    // dans un littéral JavaScript entre apostrophes (`JSON.parse('…')`). Le littéral consomme les
    // `\n` de l'encodage JSON et les rend comme vraies fins de ligne, que `JSON.parse` refuse
    // ensuite — « Bad control character in string literal » — et toute la page reste blanche.
    ui.UseRequestInterceptor(
        "(request) => { const url = new URL(request.url, window.location.origin); url.protocol = window.location.protocol; url.host = window.location.host; request.url = url.toString(); return request; }");
});

// ── Points d'entrée ────────────────────────────────────────────────────────────────────────

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous()
    .WithSummary("Sonde de vivacité");

var v1 = app.MapGroup("/v1").RequireAuthorization();

// Le contrat écrit à la main est servi tel quel, sans être régénéré depuis le code. C'est lui la
// source de vérité : un document produit par l'implémentation décrirait ce qu'elle fait, pas ce
// qu'elle doit faire, et les deux cesseraient de se contredire utilement.
v1.MapGet("/openapi.yaml", (HttpResponse response) =>
    {
        var path = Path.Combine(AppContext.BaseDirectory, "openapi.yaml");
        if (!File.Exists(path)) return Results.NotFound();

        // `no-cache` ne veut pas dire « ne garde rien » mais « redemande avant de servir » : le
        // navigateur conserve sa copie et la revalide, ce qui rend un 304 quand le document n'a
        // pas bougé. Sans cet en-tête, il applique sa fraîcheur heuristique et Swagger continue
        // d'afficher le contrat d'il y a dix minutes — un chemin ajouté n'y apparaît pas, et on
        // croit l'implémentation fautive.
        response.Headers.CacheControl = "no-cache";
        return Results.File(path, "application/yaml");
    })
    .AllowAnonymous()
    .WithSummary("Le contrat servi par cette API");

v1.MapSecurities();
v1.MapIndices();

app.Run();

/// <summary>Racine de l'application, rendue visible pour que les tests puissent l'héberger.</summary>
public partial class Program;
