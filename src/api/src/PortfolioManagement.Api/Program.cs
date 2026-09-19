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

// ── Points d'entrée ────────────────────────────────────────────────────────────────────────

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous()
    .WithSummary("Sonde de vivacité");

var v1 = app.MapGroup("/v1").RequireAuthorization();

// Le contrat écrit à la main est servi tel quel, sans être régénéré depuis le code. C'est lui la
// source de vérité : un document produit par l'implémentation décrirait ce qu'elle fait, pas ce
// qu'elle doit faire, et les deux cesseraient de se contredire utilement.
v1.MapGet("/openapi.yaml", () =>
    {
        var path = Path.Combine(AppContext.BaseDirectory, "openapi.yaml");
        return File.Exists(path)
            ? Results.File(path, "application/yaml")
            : Results.NotFound();
    })
    .AllowAnonymous()
    .WithSummary("Le contrat servi par cette API");

v1.MapSecurities();
v1.MapIndices();

app.Run();

/// <summary>Racine de l'application, rendue visible pour que les tests puissent l'héberger.</summary>
public partial class Program;
