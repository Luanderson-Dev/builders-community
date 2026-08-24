# ADR 0008 — VPS própria com Coolify + Traefik

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Deploy inicial de: Traefik, Keycloak, PostgreSQL, Redis, MinIO, backend Java, frontend Node — operados por uma pessoa, com orçamento mínimo e controle total dos dados (LGPD).

## Decisão

Uma **VPS** (mínimo 4 GB RAM / 2 vCPU) com:

- **Coolify** como camada de gestão (deploy via git push, variáveis, SSL automático).
- **Traefik** como reverse proxy (gerenciado pelo Coolify), roteamento por domínio:
  - `app.dominio.com` → frontend Next
  - `api.dominio.com` → backend Spring
  - `auth.dominio.com` → Keycloak
  - `s3.dominio.com` → MinIO
- HTTPS via Let's Encrypt automático.
- Backups: dump diário do Postgres (scheduled task Coolify) + snapshot semanal da VPS, retenção 30 dias; restore testado mensalmente (ver roadmap).
- Ambientes: `staging` (mesma VPS, subdomínios `*.staging.dominio.com`) opcional na fase 1; produção desde cedo com "deploy = push na main" após CI verde.

Escala horizontal futura: mover Postgres/MinIO para gerenciado e app para segunda máquina — nada na decisão atual impede isso.

## Consequências

**Positivas**
- Custo fixo baixo (~US$ 10–25/mês), dados sob nosso controle.
- Deploy contínuo simples sem Kubernetes.

**Negativas**
- Single point of failure até separar dados — aceito para MVP, mitigado por backups testados.
- Ops de segurança da VPS é responsabilidade nossa (patches, firewall, fail2ban).
