# Domínios e Módulos

Monólito modular (ADR 0002): cada domínio = pacote Java de primeiro nível com fronteira verificada.

## Módulos e fases

| Módulo | Responsabilidade | Fase |
|---|---|---|
| `identity` | Usuários (vínculo com Keycloak), perfis, avatares, privacidade básica | 1 |
| `community` | Grupos, membros de grupo, papéis de grupo | 1 |
| `projects` | Projetos, membros/papéis de projeto, milestones | 1 |
| `social` | Posts, comentários, feed cronológico | 1 |
| `messaging` | Conversas, mensagens, WebSocket | 2 |
| `notifications` | Notificações in-app/e-mail, consumidores de eventos | 2 |
| `mentoring` | Perfis de mentor, requests, relacionamentos, sessões | 3 |
| `moderation` | Denúncias, bloqueios, ações admin, audit log | 3 |
| `search` | Indexação e busca (Postgres FTS → Meilisearch) | 4 |

## Estrutura interna padrão de módulo

```
br.com.builderscommunity.<modulo>/
├── api/          # interfaces públicas p/ OUTROS módulos + eventos publicados
├── application/  # casos de uso (services), portas
├── domain/       # entidades, value objects, regras
├── infrastructure/
│   ├── persistence/  # entities JPA, repositories
│   └── web/          # controllers REST do módulo
└── internal/     # impl details que NÃO podem ser importados fora
```

## Regras de dependência

```
identity ◀── community ◀── projects
    ▲            ▲             ▲
    └────────────┴── social ───┘
```

1. **`identity` não depende de ninguém.** É a base.
2. `community`, `projects`, `social` dependem apenas de `api/` de módulos anteriores à seta.
3. Eventos de domínio (Spring Events) desacoplam o inverso: ex. `projects` publica `ProjectCreatedEvent`; módulos futuros (`notifications`) consomem sem dependência reversa.
4. **Sem FK física entre schemas de módulos diferentes** — referência por UUID lógico. Dentro do mesmo módulo, FK normal.
5. ArchUnit falha o build em violação (import proibido, acesso cross-module a repository).

## Papéis e permissões por módulo

| Recurso | Papéis | Permissões chave |
|---|---|---|
| Grupo | owner, admin, member | owner/admin editam e removem membros; member posta no grupo |
| Projeto | owner, maintainer, member | owner deleta; maintainer edita milestones; membro publica progresso |
| Post | autor | edita/deleta próprio; dono do espaço (grupo/projeto) pode moderar |
| Plataforma | platform_admin (realm role Keycloak) | painel admin, moderação |

Papéis contextuais moram no Postgres (não no JWT) — ver [security.md](security.md).

## Convenções transversais

- IDs públicos: UUID v7, serializados como string.
- Timestamps: `timestamptz` UTC, campos `created_at`/`updated_at` automáticos.
- Soft delete apenas onde exigido (posts, grupos) via `deleted_at`.
- Auditoria de mutações sensíveis: tabela `audit_logs` (fase 3), antes disso logs estruturados.
