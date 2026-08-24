# Convenções de API REST

Contrato entre frontend Next.js (BFF) e backend Spring Boot. OpenAPI servido pelo springdoc em `/v3/api-docs` + Swagger UI em `/swagger-ui.html` (desabilitado em produção pública).

## Formato geral

- Base: `https://api.dominio.com/api/v1`
- JSON UTF-8, `camelCase`.
- Datas/horas: RFC 3339 / ISO 8601, sempre UTC (`2026-08-24T12:00:00Z`).
- IDs: UUID v7 como string.
- Content-Type de erro: `application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)).

## Recursos v1

| Recurso | Endpoints |
|---|---|
| Perfis | `GET /profiles/{handle}`, `PATCH /me/profile`, `PUT /me/avatar` |
| Grupos | `GET/POST /groups`, `GET/PATCH/DELETE /groups/{slug}` |
| Membros de grupo | `GET/POST/DELETE /groups/{slug}/members`, `PATCH .../members/{userId}` |
| Projetos | `GET/POST /projects`, `GET/PATCH/DELETE /projects/{slug}` |
| Membros de projeto | idem grupos |
| Milestones | CRUD `/projects/{slug}/milestones`, `PATCH .../{id}/status` |
| Posts | `GET/POST /spaces/{type}/{id}/posts`, `GET /feed` |
| Comentários | `GET/POST /posts/{id}/comments` |
| Uploads | `POST /uploads/presign` → `{url, method, headers}` p/ PUT direto no MinIO |

## Paginação

Page-based simples (escala do v1):

```
GET /feed?page=0&size=20
→ { "content": [...], "page": 0, "size": 20, "totalElements": 143, "totalPages": 8 }
```

Máximo `size=50`. Cursor-based documentado como upgrade quando feed ganhar follows.

## Filtro e ordenação

Query params convencionais:

```
GET /projects?status=active&sort=-createdAt,name&groupSlug=web-builders
```

`sort` = lista de campos, prefixo `-` decrescente. Campos permitidos whitelistados por endpoint (nunca sort direto de input).

## Erros

```json
{
  "type": "https://api.dominio.com/errors/not-a-member",
  "title": "Você não é membro deste grupo",
  "status": 403,
  "detail": "Ação exige papel admin ou superior.",
  "instance": "/api/v1/groups/web-builders/members",
  "code": "GROUP_NOT_MEMBER"
}
```

- `code`: enum estável consumido pelo frontend para mensagens/i18n.
- Validação: 422 com campo a campo:

```json
{ "status": 422, "code": "VALIDATION_FAILED",
  "errors": [{ "field": "handle", "code": "TAKEN", "message": "Já está em uso" }] }
```

- Nunca vazar stacktrace/SQL; logar detalhe server-side com request-id.

## Versionamento

- Versão major na URL (`/api/v1`) — quebra de contrato = `/api/v2` convivendo até migração.
- Adicionar campos opcionais não é breaking; remover/renomear é.

## Idempotência e concorrência

- POST de criação aceita header opcional `Idempotency-Key` (armazenado 24 h no Redis).
- Atualizações otimistas onde risco de perda: `version int` + `If-Match`/409 (milestones primeiro).

## Autenticação nas chamadas

Backend espera `Authorization: Bearer <jwt>` emitido pelo Keycloak (realm `builders`, audience `api`). O BFF Next injeta o header — ver [security.md](security.md). Endpoints públicos marcados explicitamente; default é negar.

## Rate limiting

Por IP+usuário no Redis: 120 req/min autenticado, 30 req/min anônimo por IP. Excedeu → `429` + `Retry-After`. Upload presign: 10/min.
