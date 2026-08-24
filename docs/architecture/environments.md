# Ambientes e Operação

## Visão geral

| Ambiente | Onde | Domínio | Deploy |
|---|---|---|---|
| Local | Docker Compose na máquina dev | `localhost:*` | manual |
| Produção | VPS única, Coolify | `*.dominio.com` | push na `main` (CI verde) |

Staging compartilhando a VPS fica **opcional** até fase 4; até lá, produção recebe só o que passou local + CI.

## Local (`deploy/docker-compose.local.yml`)

Serviços: `postgres`, `redis`, `minio`, `keycloak`, `mailpit` (captura e-mails). Apps Java e Next rodam fora do compose (hot reload).

```
localhost:8080  API Spring      localhost:3000  Next
localhost:5432  Postgres        localhost:6379  Redis
localhost:9000  MinIO S3        localhost:9001  MinIO console
localhost:8081  Keycloak        localhost:8025  Mailpit UI
```

Seed: realm Keycloak exportado em `deploy/keycloak/realm-builders.json` (importado no boot); usuário admin local; migração Flyway roda automática.

Comandos:

```bash
docker compose -f deploy/docker-compose.local.yml up -d   # infra
./mvnw spring-boot:run                                     # backend
pnpm --filter frontend dev                                 # frontend
```

## Variáveis de ambiente

Nomes canônicos (valores nunca versionados — Coolify env vars ou `.env.local` gitignored):

**Backend**
```
SPRING_DATASOURCE_URL / _USERNAME / _PASSWORD
REDIS_URL
KEYCLOAK_ISSUER_URI          # https://auth.dominio.com/realms/builders
KEYCLOAK_JWKS_URI
KEYCLOAK_AUDIENCE            # api
MINIO_ENDPOINT / _ACCESS_KEY / _SECRET_KEY / _BUCKET_PUBLIC
APP_CORS_ALLOWED_ORIGINS     # https://app.dominio.com
APP_RATE_LIMIT_*             # limites por minuto
```

**Frontend**
```
AUTH_KEYCLOAK_ID / AUTH_KEYCLOAK_SECRET / AUTH_KEYCLOAK_ISSUER
NEXT_PUBLIC_API_URL          # https://api.dominio.com/api/v1
AUTH_SECRET                  # segredo de assinatura da sessão Auth.js
```

**Regra:** qualquer variável nova entra primeiro aqui, depois no código.

## Produção (VPS + Coolify)

Layout de recursos (VPS 4 GB mínimo):

| Container | RAM aprox. |
|---|---|
| Traefik | ~100 MB |
| Keycloak | ~800 MB–1 GB |
| PostgreSQL | ~500 MB |
| Redis | ~100 MB |
| MinIO | ~400 MB |
| API Spring (-XX:MaxRAMPercentage=70) | ~600 MB |
| Next.js | ~200 MB |

Deploy:

1. CI GitHub Actions verde (build + testes + lint).
2. Push/merge na `main` dispara deploy no Coolify (webhook).
3. Health checks `/actuator/health` (API) e `/api/health` (Next); falha = rollback automático para imagem anterior.

Migrações Flyway rodam no start da API — sempre backward-compatible com a versão anterior do código (expand/contract), permitindo rollback seguro.

## Backups

| O quê | Frequência | Destino | Retenção |
|---|---|---|---|
| Postgres (pg_dump custom) | diário 03:00 UTC | volume Coolify + B2/R2 remoto | 30 dias |
| Realm Keycloak (export JSON) | diário junto do dump | idem | 30 dias |
| MinIO (`mc mirror`) | diário | bucket remoto | espelho contínuo |
| Snapshot VPS completo | semanal | provedor | 4 semanas |

**Restore testado mensalmente** em ambiente descartável — backup não testado é esperança, não backup.

## Observabilidade mínima (fase 1)

- Logs estruturados JSON (logback encoder), request-id correlacionado front↔back.
- Actuator: health, info, metrics expostos apenas internamente (rede Docker).
- Uptime externo: monitor gratuito (UptimeRobot/Healthchecks.io) apontando para `/actuator/health`.
- Alerta: e-mail quando health falha 3× seguidas ou disco > 80 %.
- Fase 4+: Grafana + Prometheus + Loki self-hosted (mesma VPS ou segunda barata).

## Runbook básico

| Sintoma | Primeira ação |
|---|---|
| API 5xx em massa | `coolify logs api` → verificar migração/deploys recentes → rollback deploy |
| Site lento | checar CPU/RAM VPS (`htop`), conexões PG (`pg_stat_activity`), rate-limit Redis |
| Disco cheio | podar imagens Docker antigas, verificar retenção de backups, expandir volume |
| Keycloak fora | container restart; se realm corrompido, reimportar último export |
| VPS inacessível | console do provedor → snapshot mais recente se necessário |
