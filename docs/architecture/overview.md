# Visão Geral da Arquitetura

> Documento de referência. Decisões individuais vivem em `docs/adr/`. A visão do produto está no [`README.md`](../../README.md) (raiz).

## O que é

Plataforma que combina **rede social, hub de projetos e rede de mentoria** para a comunidade de builders. Núcleo do produto:

```
pessoas → grupos → projetos → colaboração → progresso → feedback → mentoria → reputação
```

O MVP v1 cobre o ciclo até "publicar progresso" (ver [ADR 0009](../adr/0009-escopo-mvp.md)).

## Diagrama de contexto (C4 nível 1)

```
                    ┌──────────────────────────────┐
   Builder ───────▶ │                              │
 (browser/mobile)   │   TogetherDev Space          │
                    │                              │
 Visitante ───────▶ │  rede social + hub projetos  │
                    │                              │
 Admin ───────────▶ │                              │
                    └──────────┬───────────────────┘
                               │ e-mails transacionais
                               ▼
                        Provedor SMTP
```

## Diagrama de containers (C4 nível 2)

```
                          Internet
                              │
                     ┌────────▼────────┐
                     │     Traefik     │  TLS automático, roteamento por host
                     │  (via Coolify)  │
                     └─┬────┬────┬───┬─┘
        app.dominio.com│    │    │   │s3.dominio.com
              ┌────────▼─┐ ┌▼────▼─┐ ┌▼──────┐
              │ Frontend │ │ API   │ │ MinIO │
              │ Next.js  │ │ Java/ │ │       │
              │ (BFF)    │ │ Spring│ │       │
              └────┬─────┘ └─┬───┬─┘ └───────┘
                   │         │   │
      auth.dominio.com│  ┌───▼─┐ ┌▼─────┐
              ┌───────▼──┐ │ PG  │ │Redis │
              │ Keycloak │ └─────┘ └──────┘
              └──────────┘
```

Fluxos principais:

1. **Navegação pública** — browser → Next.js (SSR) → API Java → Postgres.
2. **Autenticação** — browser → Next BFF → Keycloak (Authorization Code + PKCE); token fica em cookie `httpOnly` no servidor Next ([security.md](security.md)).
3. **Upload** — backend gera presigned PUT → browser envia direto ao MinIO ([ADR 0007](../adr/0007-minio-armazenamento.md)).
4. **Mutação autenticada** — browser → Next BFF → API Java com access token no header.

## Stack

| Camada | Tecnologia | ADR |
|---|---|---|
| Backend | Java 25 (LTS), Spring Boot 4.x, Maven | [0002](../adr/0002-monolito-modular.md) |
| Persistência | PostgreSQL 16+, Flyway | [0004](../adr/0004-postgresql-redis.md) |
| Cache / rate-limit | Redis | [0004](../adr/0004-postgresql-redis.md) |
| Identidade | Keycloak (OIDC, PKCE) | [0003](../adr/0003-keycloak-identidade.md) |
| Objetos | MinIO (API S3, AWS SDK v2) | [0007](../adr/0007-minio-armazenamento.md) |
| Frontend | Next.js App Router, TypeScript, Tailwind + shadcn/ui, Auth.js | [0005](../adr/0005-nextjs-frontend.md) |
| Deploy | VPS + Coolify + Traefik, GitHub Actions CI | [0008](../adr/0008-vps-coolify-traefik.md) |
| Mensageria | (fase 2) RabbitMQ | [0009](../adr/0009-escopo-mvp.md) |

## Princípios

1. **Fronteiras de módulo no código**, verificadas por ArchUnit — não só em docs.
2. **Postgres é a verdade**; cache é sempre rederivável.
3. **Cada fase do roadmap termina deployada** — nada de "funciona na minha máquina" acumulado.
4. **Segurança por padrão**: endpoints fechados por default (`@PreAuthorize`), dados pessoais mínimos, LGPD desde o schema.
5. **Simplicidade primeiro**: preferir solução chata e compreensível a esperta; complexidade entra quando o problema real aparecer.
6. **Observabilidade básica obrigatória**: health checks, logs estruturados JSON, métricas Actuator — desde a semana 1.

## Evolução planejada

Extração futura de serviços já prevista pelas costuras do monólito modular: `identity-service`, `messaging-service`, `notification-service`, `search-service`, `media-service`. Gatilho sugerido: extrair somente quando um módulo tiver equipe própria ou perfil de escala divergente comprovado.

## Mapa da documentação

- [domains.md](domains.md) — módulos, fases, regras de dependência
- [data-model.md](data-model.md) — modelo de dados v1
- [api-conventions.md](api-conventions.md) — contrato REST
- [security.md](security.md) — authn/authz detalhado
- [environments.md](environments.md) — ambientes, variáveis, backups
- [../roadmap.md](../roadmap.md) — plano semanal até o lançamento
