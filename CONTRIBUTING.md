# Guia de Contribuição

Projeto solo hoje, mas processo leve mantém consistência e prepara crescimento. Regras curtas, aplicadas por CI onde possível.

## Branches e commits

- **Conventional Commits** obrigatório (verificado por commitlint no CI):
  ```
  feat(projects): adicionar conclusão de milestone
  fix(auth): renovar access token antes de expirar
  docs(adr): registrar decisão de MinIO
  refactor(social): extrair montagem do feed
  test(groups): cobrir remoção de membro por não-admin
  chore(deps): bump spring boot para 3.x.y
  ```
  Tipos: `feat | fix | docs | style | refactor | perf | test | build | ci | chore`.
- Escopos = módulos (`identity`, `community`, `projects`, `social`) ou camadas (`api`, `web`, `infra`, `deps`).
- Branches: `feat/<slug>`, `fix/<slug>`, `docs/<slug>` — vida curta (< 3 dias idealmente).
- PRs mesmo sozinho: auto-review obrigatório antes do merge (leitura própria com olho de revisor), CI verde. Merge squash na `main`.

## Definition of Done

Uma task só está pronta com:

1. Código + testes (novas regras de negócio têm teste unitário; endpoints têm teste de integração com Testcontainers).
2. Lint/formatter passando (Spotless, ESLint/Prettier).
3. CI verde.
4. Deployado (fim de fase) ou integrado a algo deployado.
5. Docs atualizadas se mudou contrato, modelo ou decisão (ADR novo quando aplicável — ADR 0001).

## Estilo de código

**Backend**
- Pacotes por módulo/domínio conforme `architecture/domains.md`; violação de fronteira quebra build (ArchUnit).
- Sem lógica de negócio em controllers; casos de uso em `application/`.
- Erros via problem+json padronizado (`api-conventions.md`).
- Nomes e mensagens de log em inglês; strings de UI em PT-BR centralizadas (i18n-ready).

**Frontend**
- Server Components por padrão; `"use client"` só onde interativo.
- Fetch de dados server-side direto na API; mutações pelo wrapper client.
- Componentes UI via shadcn/ui; nada de CSS inline ad hoc.

## Commits que tocam schema

Migração Flyway nova exige:

1. Nome `V{n}__descricao.sql`, sequencial, **nunca editar migração já mergeada**.
2. Backward-compatible (expand/contract) — rollback de app não pode quebrar.
3. Índices pensados junto (ver `data-model.md`).

## Segurança

- Nunca commitar secrets (`.env*` gitignored; valores no Coolify/local apenas).
- Endpoint novo ⇒ teste de autorização positivo E negativo no mesmo PR.
- Dependabot/Renovate: PRs semanais revisados e mergeados rápido.

## Processo de release

1. Merge squash na `main` → CI → deploy automático Coolify (ADR 0008).
2. Tag `vX.Y.Z` manual ao fim de cada fase do roadmap (changelog gerado dos Conventional Commits).
3. Rollback = redeploy da imagem anterior pelo Coolify; migrações sempre compatíveis.
