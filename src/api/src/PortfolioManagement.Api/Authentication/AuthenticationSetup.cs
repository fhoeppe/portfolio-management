using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace PortfolioManagement.Api.Authentication;

/// <summary>Mise en place du jeton porteur déclaré par le contrat.</summary>
public static class AuthenticationSetup
{
    /// <summary>Enregistre le schéma d'authentification qui correspond à la configuration.</summary>
    /// <param name="builder">Le constructeur d'application, pour l'accès à la configuration et à l'environnement.</param>
    /// <exception cref="InvalidOperationException">
    /// La vérification du jeton est désactivée hors développement, ou activée sans clé de signature.
    /// </exception>
    public static IServiceCollection AddApiAuthentication(this WebApplicationBuilder builder)
    {
        var options = builder.Configuration.GetSection(ApiAuthenticationOptions.SectionName)
            .Get<ApiAuthenticationOptions>() ?? new ApiAuthenticationOptions();

        builder.Services.Configure<ApiAuthenticationOptions>(
            builder.Configuration.GetSection(ApiAuthenticationOptions.SectionName));

        if (!options.Enabled)
        {
            if (!builder.Environment.IsDevelopment())
            {
                throw new InvalidOperationException(
                    "Authentication:Enabled ne peut valoir false qu'en développement. "
                    + "Renseignez Authentication:Jwt et passez Authentication:Enabled à true.");
            }

            builder.Services
                .AddAuthentication(DevelopmentAuthenticationHandler.SchemeName)
                .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, DevelopmentAuthenticationHandler>(
                    DevelopmentAuthenticationHandler.SchemeName, configureOptions: null);

            return builder.Services.AddAuthorization();
        }

        if (options.Jwt.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Authentication:Jwt:SigningKey est absente ou trop courte. "
                + "Renseignez-la par user-secrets ou par la variable Authentication__Jwt__SigningKey.");
        }

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(jwt =>
            {
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = options.Jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = options.Jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Jwt.SigningKey)),
                    ValidateLifetime = true,

                    // Aucune tolérance d'horloge : le défaut de cinq minutes prolonge silencieusement
                    // la validité d'un jeton révoqué, et les serveurs de cette application sont à
                    // l'heure.
                    ClockSkew = TimeSpan.Zero,
                };
            });

        return builder.Services.AddAuthorization();
    }
}
