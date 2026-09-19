# Déploiement

> **Avertissement.** Cette tranche tient son référentiel **en mémoire** : redémarrer l'API rend les
> quinze titres d'origine et perd toute écriture. Le déploiement décrit ici est donc celui d'un
> environnement de recette ou de démonstration. **Ne pas exposer en production avant d'avoir choisi
> une persistance** — voir la couture `ISecurityRepository`.

## Prérequis

- Ubuntu 24.04 LTS ou Debian 12
- Runtime ASP.NET Core 10 (`aspnetcore-runtime-10.0`), ou Docker
- Nginx, certbot (TLS Let's Encrypt)

## Option A — Kestrel derrière Nginx, piloté par systemd

### 1. Publier

```bash
dotnet publish src/PortfolioManagement.Api -c Release -o /var/app/pm-api \
    --runtime linux-x64 --self-contained false
```

### 2. Service — `/etc/systemd/system/pm-api.service`

```ini
[Unit]
Description=Portfolio Management API (.NET 10)
After=network.target

[Service]
WorkingDirectory=/var/app/pm-api
ExecStart=/usr/bin/dotnet /var/app/pm-api/PortfolioManagement.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=pm-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
EnvironmentFile=/etc/pm-api/pm-api.env

[Install]
WantedBy=multi-user.target
```

`/etc/pm-api/pm-api.env`, en `chmod 600`, porte les secrets :

```
Authentication__Enabled=true
Authentication__Jwt__SigningKey=…
Cors__AllowedOrigins__0=https://app.example.com
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pm-api
journalctl -u pm-api -f
```

Kestrel n'écoute que sur la boucle locale : rien n'atteint l'API sans passer par Nginx.

### 3. Nginx — `/etc/nginx/sites-available/pm-api.conf`

```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    gzip on;
    gzip_types application/json application/problem+json application/yaml;
    gzip_min_length 1024;

    client_max_body_size 2m;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pm-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.example.com
```

> **À faire avant la première mise derrière proxy.** `Program.cs` n'appelle pas encore
> `UseForwardedHeaders()`. Tant qu'il ne le fait pas, l'application voit l'adresse de Nginx et le
> schéma `http` au lieu de ceux du client — sans conséquence tant qu'aucune décision n'en dépend
> (ni journal d'adresse, ni limitation de débit, ni redirection absolue), mais à poser avant que ce
> soit le cas.

## Option B — Docker

`deploy/Dockerfile` n'existe pas encore. Le squelette attendu, multi-étapes, image *chiseled* :

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Packages.props Directory.Build.props global.json ./
COPY src/ src/
RUN dotnet publish src/PortfolioManagement.Api -c Release -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080 ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "PortfolioManagement.Api.dll"]
```

## Le front

Deux montages, selon que front et API partagent ou non un domaine.

| Situation | Montage |
|---|---|
| Domaines séparés (`app.` / `api.`) | Angular en statique sous Nginx, `Cors:AllowedOrigins` porte l'origine du front. |
| Domaine unique | Angular en statique, `location /v1/ { proxy_pass http://127.0.0.1:5000/v1/; }` — plus de CORS du tout. |

Le second est préférable dès que rien n'impose le premier : ce qui ne traverse pas d'origine n'a
pas à être autorisé. En développement, c'est déjà ce que fait `proxy.conf.api.json`.

```bash
cd ../angular && npm run build
sudo rsync -av --delete dist/angular/browser/ /var/www/pm-app/
```

## Mise à jour

```bash
dotnet publish … -o /var/app/pm-api.new
sudo systemctl stop pm-api
sudo rsync -a --delete /var/app/pm-api.new/ /var/app/pm-api/
sudo systemctl start pm-api
curl -fsS https://api.example.com/health
```

Coupure franche, et non bascule progressive : l'état vit dans le processus, deux instances
serviraient deux référentiels divergents. C'est une raison de plus de ne pas exposer cette tranche
en production.

**Retour arrière** : `/var/app/pm-api.previous`, conservé par le déploiement précédent, puis
`systemctl restart`.

## Supervision

| Quoi | Où |
|---|---|
| Vivacité | `GET /health` — anonyme, sans dépendance externe. |
| Journaux | `journalctl -u pm-api -f`, ou `docker logs`. |
| Contrat servi | `GET /v1/openapi.yaml` — dit quelle version du contrat le binaire porte. |

La journalisation passe par le fournisseur console intégré. Serilog, l'export OpenTelemetry et une
sonde de disponibilité par dépendance viendront avec la persistance : sans base, il n'y a rien à
sonder qui ne soit déjà couvert par `/health`.
