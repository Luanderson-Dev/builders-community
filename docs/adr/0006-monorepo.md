# ADR 0006 — Monorepo

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Backend (Java/Spring) e frontend (Next.js) evoluem juntos nas fases iniciais; dev solo; CI único desejado.

Alternativa considerada: repos separados — isolamento maior, porém overhead de sincronizar PRs, versões de API e CI duplicado.

## Decisão

**Monorepo** com estrutura:

```
togetherdev-space/
├── backend/          # Spring Boot (Maven)
├── frontend/         # Next.js (pnpm)
├── docs/             # este conjunto de documentação
├── deploy/           # docker-compose.local.yml, configs de ambiente
└── .github/workflows/
```

- CI (GitHub Actions) com paths filter: commit que toca só `frontend/` roda pipeline do frontend apenas.
- Contrato API: OpenAPI gerado pelo backend (springdoc), spec exportada como artefato; tipos TS do frontend derivados dela (openapi-typescript) na fase 2 do roadmap — antes disso, client fetch tipado manual.
- Conventional Commits obrigatório (ver CONTRIBUTING.md) — habilita changelog automático depois.

## Consequências

**Positivas**
- Mudanças cross-stack atômicas num commit.
- Um lugar para issues, CI, docs.

**Negativas**
- Repo cresce; mitigado por paths filter no CI.
- Extração futura de serviço exigirá split — git subtree/filter-repo resolve na hora.
