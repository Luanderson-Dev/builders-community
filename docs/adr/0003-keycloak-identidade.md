# ADR 0003 — Keycloak para identidade e acesso

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Autenticação segura exige: hash de senha, reset por e-mail, verificação de e-mail, sessões, MFA opcional, proteção brute-force. Construir isso próprio é semanas de trabalho sensível e superfície de ataque permanente.

Alternativas consideradas:

1. Spring Security + JWT próprio — controle total, mas reimplementar recovery/MFA/brute-force com qualidade leva tempo e risco alto para dev solo.
2. Auth0/Cognito — zero ops, mas custo por MAU cresce e dados de identidade saem da VPS (LGPD).

## Decisão

**Keycloak** self-hosted (via Coolify) como Identity Provider:

- Protocolo **OAuth2/OIDC**, fluxo **Authorization Code + PKCE**.
- Realm dedicado `togetherdev`; clients: `web` (público, PKCE) consumido pelo BFF Next.js (Auth.js provider Keycloak); backend é **resource server** validando access tokens JWT.
- Papéis de plataforma (`platform_admin`, `user`) como realm roles; papéis contextuais (owner/admin/member de grupo/projeto) ficam no Postgres, não no token — evitam token inflado e renegociação a cada mudança de papel.
- E-mail transacional: SMTP configurado no Keycloak (fase 1 usa Brevo/Mailgun free tier ou SMTP da VPS).
- Tema de login customizado (fase 4, pós-lançamento).
- Backup: export automático do realm (`--optimized` + volume) junto dos backups do Postgres.

## Consequências

**Positivas**
- Login, reset, verificação de e-mail, MFA e rate-limit de credenciais resolvidos dia 1.
- Padrão aberto: trocar provedor depois é trabalho de config, não rewrite.

**Negativas**
- +1 container pesado (~1 GB RAM) — VPS precisa de folga.
- Curva de aprendizado de realm/client/roles; mitigada pela doc `architecture/security.md`.
