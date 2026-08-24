# Segurança

## Modelo de autenticação (OIDC)

```
┌─────────┐   1. login redirect (Authorization Code + PKCE)   ┌──────────┐
│ Browser │ ────────────────────────────────────────────────▶ │ Keycloak │
│         │ ◀──────────── code ────────────────────────────── │          │
│         │                                                   └──────────┘
│         │   2. BFF troca code→tokens (server-side, segredo) 
│         │      sessão = cookie httpOnly assinado (Auth.js)
│         │
│         │   3. mutação: browser → Next API route → API Java
│         │      header Authorization: Bearer <access_token>
└─────────┘
```

Regras:

- **Tokens nunca tocam o browser.** Cookie de sessão `httpOnly; Secure; SameSite=Lax`.
- Access token curto (5 min), refresh token rotativo (12 h); Auth.js renova server-side.
- Logout: encerra sessão Auth.js + RP-initiated logout no Keycloak.
- CSRF: mutações via rotas do Next com verificação de origem; API Java stateless atrás do BFF.

## Backend como resource server

```yaml
spring.security.oauth2.resourceserver.jwt:
  issuer-uri: ${KEYCLOAK_ISSUER_URI}
  audiences: api            # valida 'aud' — rejeita tokens de outros clients
```

Pipeline de autorização:

1. Filtro JWT valida assinatura + `iss` + `aud` + expiração.
2. `keycloak_sub` → lookup em `users` → `AppUserPrincipal`.
3. Autorização contextual: **papéis de grupo/projeto vêm do Postgres**, checados por anotações (`@PreAuthorize("@groupAccess.canManage(#slug, principal)")`) implementadas como beans de acesso por módulo (`GroupAccess`, `ProjectAccess`). Nada de papéis contextuais no JWT.
4. Default-deny: todo endpoint exige config explícita de acesso.

## Papéis

| Escopo | Papel | Onde vive |
|---|---|---|
| Plataforma | `platform_admin`, `user` | Realm roles Keycloak |
| Grupo | owner / admin / member | Postgres |
| Projeto | owner / maintainer / member | Postgres |
| Conteúdo | autor do post/comentário | implícito |

## Segurança da VPS

- SSH só por chave, senha desabilitada, fail2ban ativo.
- Firewall (ufw): apenas 80/443 públicos; tudo mais na rede interna Docker.
- Patches automáticos de SO (unattended-upgrades); Coolify atualizado mensalmente.
- Backups cifrados no destino remoto.

## Proteções de aplicação

| Risco | Mitigação |
|---|---|
| Brute force login | nativo do Keycloak (lockout progressivo) |
| Rate limit API | Redis: 120/min auth, 30/min anônimo (ver [api-conventions](api-conventions.md)) |
| Upload malicioso | presign só p/ imagens JPEG/PNG/WebP ≤ 5 MB; content-type validado; servidos de domínio separado (`s3.*`) |
| XSS | React escapa por padrão; sem `dangerouslySetInnerHTML`; CSP restritiva (`default-src 'self'`) |
| SQL injection | JPA parameterizado; zero SQL concatenado |
| IDOR | toda query filtra por acesso do usuário; testes de autorização por endpoint |
| Secrets | nunca em código/git; Coolify env vars; rotação documentada |
| Dependências | Dependabot/Renovate semanal; `org.owasp:dependency-check-maven` no CI |

## LGPD

- Coleta mínima: e-mail, nome exibido, bio opcional, avatar opcional.
- Consentimento e política de privacidade no cadastro (fase 1).
- Direitos do titular: export de dados próprio (JSON, `/me/export`) e exclusão de conta (anonimização de conteúdo público, fase 2).
- Dados em repouso: disco da VPS criptografado pelo provedor + backups cifrados.

## Checklist de release de segurança (por fase)

- [ ] Novos endpoints têm teste de autorização (positivo e negativo)
- [ ] Nenhum secret novo fora do gerenciador de env
- [ ] Headers de resposta: HSTS, X-Content-Type-Options, CSP (Traefik middleware)
- [ ] Logs não contêm PII além do necessário nem tokens
