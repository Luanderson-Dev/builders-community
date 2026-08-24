# ADR 0004 — PostgreSQL fonte principal + Redis cache

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Dados relacionais dominam o modelo (grupos, projetos, membros, posts). A visão original também lista Redis (efêmero/cache) e RabbitMQ (assíncrono).

## Decisão

**PostgreSQL 16+** como único armazenamento persistente do MVP:

- Migrações versionadas com **Flyway** (`V{n}__descricao.sql`), obrigatórias — sem DDL manual.
- Um banco, schemas lógicos por domínio (espelha os módulos do ADR 0002).
- UUID v7 como PK (ordenável no tempo, amigável a índice B-tree).
- Busca full-text do v1 usa FTS nativo do Postgres (tsvector) — sem Elasticsearch/Meilisearch agora.
- Cache de leitura pesada (feed, páginas públicas) usa `@Cacheable` sobre **Redis**, com TTL curto; invalidação explícita em mutações.

**RabbitMQ fica de fora do v1.** Eventos internos entre módulos usam Spring Events (in-process, transacionais com `@TransactionalEventListener`). RabbitMQ entra junto das notificações (fase 2), quando houver consumidores externos/extraíveis — trocar publisher interno por AMQP depois será localizado num único ponto.

## Consequências

**Positivas**
- Menos uma infraestrutura crítica (broker) para operar no lançamento.
- FTS nativo elimina mais um serviço; upgrade path claro.
- Relacional + ACID casa com o modelo de permissões (membros, papéis).

**Negativas**
- Redis ainda é um serviço a mais no v1 — justificado por sessões de rate-limit e cache desde cedo; se pesar, cai para Caffeine local sem mudança de código de aplicação.
- Eventos in-process não sobrevivem a crash (sem outbox) — aceito enquanto tudo roda num processo; outbox pattern documentado como passo de evolução.
