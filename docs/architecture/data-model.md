# Modelo de Dados — MVP v1

PostgreSQL 16+, um schema lógico por módulo (`identity`, `community`, `projects`, `social`). Migrações Flyway sequenciais. Convenções: UUID v7 PKs, `timestamptz` UTC, snake_case.

## Visão geral (relações principais)

```
users ──1:1── profiles
  │
  ├──1:N── group_members ◀── groups
  ├──1:N── project_members ◀── projects ──1:N── milestones
  └──1:N── posts ──1:N── comments
              ▲
        (post pode pertencer a user | group | project)
```

## identity

```sql
-- V1__identity_schema.sql
CREATE TABLE users (
    id            uuid PRIMARY KEY,              -- UUID v7 gerado pela app
    keycloak_sub  uuid NOT NULL UNIQUE,          -- subject do token OIDC
    email         citext NOT NULL UNIQUE,        -- espelho do Keycloak, para joins/consulta
    status        text NOT NULL DEFAULT 'active', -- active | suspended
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
    id            uuid PRIMARY KEY,
    user_id       uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name  text NOT NULL,
    handle        text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,30}$'),
    bio           text CHECK (char_length(bio) <= 500),
    avatar_key    text,                          -- object key no MinIO; NULL = avatar padrão
    links         jsonb NOT NULL DEFAULT '[]',   -- [{label, url}]
    is_public     boolean NOT NULL DEFAULT true, -- perfil público vs só membros
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
```

## community

```sql
CREATE TABLE groups (
    id            uuid PRIMARY KEY,
    slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,60}$'),
    name          text NOT NULL,
    description   text,
    cover_key     text,                          -- MinIO
    visibility    text NOT NULL DEFAULT 'public', -- public | members_only
    deleted_at    timestamptz,
    created_by    uuid NOT NULL,                 -- users.id (sem FK cross-module)
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
    group_id      uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id       uuid NOT NULL,                 -- sem FK física cross-module
    role          text NOT NULL DEFAULT 'member', -- owner | admin | member
    joined_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id),
    UNIQUE (user_id, group_id)
);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

Regra de negócio: grupo tem exatamente **um** `owner` (constraint aplicada em serviço + trigger de integridade).

## projects

```sql
CREATE TABLE projects (
    id            uuid PRIMARY KEY,
    slug          text NOT NULL UNIQUE,
    name          text NOT NULL,
    summary       text CHECK (char_length(summary) <= 300),
    description   text,
    status        text NOT NULL DEFAULT 'active', -- planning | active | paused | done | archived
    repo_url      text,
    demo_url      text,
    cover_key     text,
    group_id      uuid,                          -- projeto vinculado a grupo (opcional)
    deleted_at    timestamptz,
    created_by    uuid NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;

CREATE TABLE project_members (
    project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id       uuid NOT NULL,
    role          text NOT NULL DEFAULT 'member', -- owner | maintainer | member
    joined_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE milestones (
    id            uuid PRIMARY KEY,
    project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title         text NOT NULL,
    description   text,
    status        text NOT NULL DEFAULT 'open',   -- open | in_progress | done
    due_date      date,
    position      int NOT NULL,                   -- ordenação manual
    completed_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_milestones_project ON milestones(project_id, position);
```

## social

```sql
CREATE TABLE posts (
    id            uuid PRIMARY KEY,
    author_id     uuid NOT NULL,                 -- users.id
    space_type    text NOT NULL,                 -- profile | group | project
    space_id      uuid NOT NULL,                 -- id do perfil/grupo/projeto dono do espaço
    content       text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    media_keys    jsonb NOT NULL DEFAULT '[]',   -- imagens anexas (fase 2 usa de fato)
    deleted_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_space ON posts(space_type, space_id, created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id, created_at DESC);

CREATE TABLE comments (
    id            uuid PRIMARY KEY,
    post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id     uuid NOT NULL,
    content       text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    deleted_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
```

Decisões do modelo:

- **`posts` polimórfico** (`space_type` + `space_id`) em vez de 3 tabelas — feed único vira uma query simples. Trade-off documentado: sem FK física para o espaço; integridade garantida nos serviços de cada módulo.
- **Feed cronológico v1**: `idx_posts_space` e `idx_posts_author` cobrem as duas ordenações usadas. Feed "para você" (follows) entra fase 3 com tabela `follows` e materialização.
- **Sem contadores desnormalizados** (nº comentários etc.) no v1 — `COUNT` com índice atende na escala prevista; revisitar quando p95 > 200 ms.
- Extensões exigidas: `citext`, `pgcrypto` (ou geração UUID v7 na app).

## Entidades fora do v1 (previsadas, não criadas)

`friendships`, `follows`, `reactions`, `conversations`, `conversation_members`, `messages`, `mentor_profiles`, `mentoring_requests`, `mentoring_relationships`, `mentoring_sessions`, `notifications`, `reports`, `audit_logs` — nomes já reservados conforme a visão (`README.md`), criados nas fases 2–3 por novas migrações Flyway.
