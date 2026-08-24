# Roadmap — MVP v1

Cadência semanal, dev solo, tempo parcial (~10–15 h/semana estimado). Cada fase termina **deployada em produção** — regra inegociável. Escopo definido no [ADR 0009](adr/0009-escopo-mvp.md).

Regras do roadmap:

1. Atrasou? corta escopo da semana, nunca adia o deploy.
2. Semana com 0 horas disponíveis → semana de buffer; roadmap desliza, docs não mentem.
3. Todo fim de fase: revisar este arquivo + ADRs afetados.

## Fase 0 — Fundação (Semana 1)

Meta: esqueleto monorepo rodando local com CI.

- [x] `git init`, GitHub repo público ([togetherdev-space](https://github.com/Luanderson-Dev/builders-community)), proteção da `main`
- [x] Licença MIT + guia de contribuição
- [ ] Estrutura monorepo (ADR 0006): `backend/`, `frontend/`, `docs/`, `deploy/`
- [x] Backend: Spring Boot 4.x + Java 25 via start.spring.io (Maven), Actuator, Flyway, JPA, Spotless
- [x] Frontend: Next.js App Router + TS + Tailwind v4 + shadcn/ui + pnpm
- [x] `deploy/docker-compose.local.yml`: postgres, redis, minio, keycloak, mailpit
- [x] CI GitHub Actions paths-filtered: build + testes + lint dos dois lados
- [x] Formatação: Spotless (Java), Prettier+ESLint (TS); Conventional Commits verificado no CI
- [x] Visão consolidada no `README.md` raiz; README apontando pra docs

**Done quando:** CI verde em PR de exemplo tocando backend e frontend; compose sobe tudo local. ✅ [PR #1](https://github.com/Luanderson-Dev/builders-community/pull/1)

## Fase 1 — Infra base no ar (Semana 2)

Meta: hello-world de API e frontend acessíveis por HTTPS na VPS.

- [ ] Provisionar VPS (4 GB), hardening SSH/firewall/fail2ban ([environments.md](architecture/environments.md))
- [ ] Instalar Coolify; Traefik + Let's Encrypt funcionando
- [ ] Subir postgres, redis, minio, keycloak como apps Coolify
- [ ] Deploy API Spring (`Dockerfile` multi-stage) → `api.dominio.com/actuator/health` 200
- [ ] Deploy Next → `app.dominio.com` renderiza página inicial
- [ ] DNS + domínio configurados; uptime monitor externo ativo
- [ ] Backup diário Postgres agendado + destino remoto configurado

**Done quando:** dois hellos públicos em HTTPS, deploy = push na main, backup rodando.

## Fase 2 — Identity e perfil (Semanas 3–4)

Meta: cadastro/login real e perfil público editável.

- [ ] Realm `togetherdev` no Keycloak (clients `web`/`api`, roles plataforma, SMTP)
- [ ] Auth.js no Next: login/logout/sessão cookie httpOnly ([security.md](architecture/security.md))
- [ ] Backend resource server validando JWT (issuer + audience)
- [ ] Migração V1: `users`, `profiles` ([data-model.md](architecture/data-model.md))
- [ ] Sync user no primeiro login (upsert por `keycloak_sub`)
- [ ] Endpoints: `GET /profiles/{handle}`, `PATCH /me/profile`
- [ ] Upload avatar: presign + PUT MinIO + resize básico server-side
- [ ] UI: páginas login, onboarding (criar handle/perfil), perfil público SSR
- [ ] Testes autorização por endpoint (positivo/negativo)

**Done quando:** pessoa real se cadastra, edita perfil, vê perfil público indexável.

## Fase 3 — Grupos (Semanas 5–6)

Meta: comunidade se agrupa.

- [ ] Migração V2: `groups`, `group_members`
- [ ] CRUD grupos + papéis owner/admin/member (beans `GroupAccess`)
- [ ] Entrar/sair, convite por link (token assinado) opcional
- [ ] Páginas públicas de grupo (SSR/SEO) + painel de membros
- [ ] Listagem/descoberta simples (busca por nome, filtro)
- [ ] Testes de fronteira ArchUnit ativos no build

**Done quando:** grupo criável, entrável e navegável por visitante anônimo.

## Fase 4 — Projetos e milestones (Semanas 7–8)

Meta: núcleo "hub de projetos".

- [ ] Migração V3: `projects`, `project_members`, `milestones`
- [ ] CRUD projetos (vínculo opcional a grupo), status lifecycle
- [ ] Papéis owner/maintainer/member + permissões
- [ ] Milestones: criar/reordenar/concluir
- [ ] Página pública de projeto: descrição, equipe, milestones, links repo/demo
- [ ] Capa de projeto/grupo via MinIO

**Done quando:** projeto público completo visível sem login, gerenciável pelo owner.

## Fase 5 — Feed e posts (Semanas 9–10)

Meta: vida social mínima.

- [ ] Migração V4: `posts`, `comments`
- [ ] Posts em espaço (perfil/grupo/projeto) — modelo polimórfico
- [ ] Feed cronológico paginado (`GET /feed`) com cache Redis curto
- [ ] Comentários simples (1 nível)
- [ ] UI composer + timeline + página de post compartilhável
- [ ] Rate limits ativos ([api-conventions](architecture/api-conventions.md))

**Done quando:** usuário posta progresso num projeto e aparece no feed de um membro do grupo.

## Fase 6 — Endurecimento e lançamento beta (Semana 11)

Meta: abrir para a comunidade.

- [ ] Revisão segurança checklist completa ([security.md](architecture/security.md))
- [ ] LGPD: política de privacidade, consentimento no signup, `/me/export`
- [ ] Restore de backup testado de verdade (documentar passo-a-passo executado)
- [ ] Carga básica: k6 smoke (50 usuários simultâneos nas rotas quentes)
- [ ] Headers CSP/HSTS no Traefik; revisar logs sem PII/token
- [ ] Página institucional + convite para primeiros N builders
- [ ] Bug tracker aberto (GitHub Issues com labels de fase)

**Done quando:** beta público no ar, monitorado, com backup restaurável.

## Pós-MVP (fases 2+ do produto)

| Fase | Conteúdo |
|---|---|
| 2 | Chat WebSocket (messaging), notificações + RabbitMQ, anonimização/exclusão conta |
| 3 | Mentoria completa, reações/amizades/follows, moderação + audit log |
| 4 | Busca full-text avançada, i18n en, tema custom Keycloak, Grafana stack |

Gatilhos de extração de serviço e outbox pattern: quando notificações (fase 2) exigirem entrega garantida fora do processo.
