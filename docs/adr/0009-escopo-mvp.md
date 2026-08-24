# ADR 0009 — Escopo do MVP v1 (core mínimo)

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

A visão descreve 9 domínios. Construir todos antes de colocar no ar atrasa validação indefinidamente e explode risco para um dev solo. Era preciso cortar.

Critério de corte: o recurso é essencial para o ciclo mínimo "entrar, se apresentar, agrupar, criar projeto, colaborar, publicar progresso"?

## Decisão

**No MVP v1 (fase 1):**

| Domínio | Entregas |
|---|---|
| Identity | Login/cadastro via Keycloak, perfil público, avatar |
| Community | Grupos (criar, editar, entrar/sair, papéis owner/admin/member) |
| Projects | CRUD projetos, membros com papéis, milestones com status |
| Social (mínimo) | Posts em perfil/grupo/projeto + comentários simples; feed cronológico |

**Fora do v1 — roadmap das fases seguintes:**

| Recurso | Fase |
|---|---|
| Chat tempo real (WebSocket + Redis pub/sub) | 2 |
| Notificações (+ RabbitMQ) | 2 |
| Reações, amizades, follows | 3 |
| Mentoria completa (perfis, requests, sessões) | 3 |
| Moderação (denúncias, bloqueios), audit log | 3 |
| Busca full-text (Postgres FTS primeiro; Meilisearch depois) | 4 |
| Gamificação, feed algorítmico, marketplace, videochamada | não planejado |
| i18n (UI só PT-BR, strings centralizadas desde o início) | 4 |

Também fica decidido: **feed é cronológico** no v1 (sem ranking); **RabbitMQ entra na fase 2** conforme ADR 0004.

## Consequências

**Positivas**
- MVP estimável em ~10–11 semanas de tempo parcial (ver `docs/roadmap.md`).
- Cada fase entrega valor utilizável sozinha.

**Negativas**
- Plataforma lança sem chat — comunidade pode usar Discord paralelamente no início.
- Strings centralizadas agora custa pequena disciplina extra.
