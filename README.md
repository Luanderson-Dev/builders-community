# 🚀 TogetherDev Space

![Java](https://img.shields.io/badge/Java_25-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Keycloak](https://img.shields.io/badge/Keycloak-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white)

> Rede social, hub de projetos e rede de mentoria para builders: onde ideias viram grupos, grupos viram projetos e projetos constroem reputação.

---

## 📌 Visão Geral

O **TogetherDev Space** conecta pessoas que constroem coisas.

A plataforma combina quatro dimensões em um produto só:

- **Rede social** — perfis, posts, comentários e feed de progresso
- **Comunidade** — grupos por interesse com membros e papéis
- **Hub de projetos** — projetos com equipe, papéis e milestones
- **Mentoria** — descoberta de mentores e sessões *(planejado)*

### 💡 Diferencial

Não é mais uma rede social genérica. O foco é o **ciclo de construção real**:

```
pessoas → grupos → projetos → colaboração → progresso → feedback → mentoria → reputação
```

---

## 🧠 Como Funciona

O produto gira em torno de espaços de colaboração:

1. **Perfil** — builder se apresenta (handle, bio, links, avatar)
2. **Grupos** — comunidade se organiza por interesse (público ou restrito)
3. **Projetos** — dentro dos grupos ou soltos, com owner/maintainers/membros
4. **Milestones** — progresso tangível, marcável e público
5. **Feed** — posts em qualquer espaço (perfil, grupo ou projeto), cronológicos
6. **Reputação** — consequência natural do histórico público de construção *(fases futuras)*

---

## ✨ Funcionalidades

### MVP v1

- Cadastro/login via Keycloak (OIDC + PKCE)
- Perfil público editável com avatar
- Grupos com papéis (owner, admin, member)
- Projetos com equipe e milestones
- Posts em perfil/grupo/projeto + comentários
- Feed cronológico paginado
- Páginas públicas indexáveis (SEO)

### Planejado

- Chat em tempo real (WebSocket)
- Notificações in-app e e-mail
- Mentoria completa (requests, sessões, feedback)
- Reações, amizades e follows
- Moderação (denúncias, bloqueios) e auditoria
- Busca full-text avançada e i18n

---

## 🏗️ Arquitetura

Monorepo dividido em duas aplicações sobre infraestrutura self-hosted:

### Frontend

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui
- Auth.js como BFF — tokens nunca chegam ao browser

### Backend

- Spring Boot 4.x + Java 25 (Maven)
- Monólito modular — fronteiras verificadas por ArchUnit
- PostgreSQL (dados), Redis (cache/rate-limit), MinIO (objetos S3-compatible)
- Keycloak como Identity Provider

```
Browser ──▶ Next.js (BFF/SSR) ──▶ API Spring Boot ──▶ PostgreSQL
                │                       │      │
                ▼                       ▼      ▼
            Keycloak                  Redis   MinIO
```

Detalhes completos em [`docs/architecture/`](docs/architecture/overview.md).

---

## 🔌 Comunicação

Frontend consome a API REST do backend via BFF:

- Base: `NEXT_PUBLIC_API_URL` (ex.: `https://api.dominio.com/api/v1`)
- Autenticação: cookie de sessão `httpOnly` no Next → header `Authorization: Bearer <jwt>` server-side
- Erros padronizados em `application/problem+json` (RFC 9457) com `code` estável
- Contrato OpenAPI servido pelo springdoc (`/v3/api-docs`)

Convenções completas: [`docs/architecture/api-conventions.md`](docs/architecture/api-conventions.md)

---

## 🚀 Como Rodar

### 🐳 Docker (infraestrutura local)

```bash
docker compose -f deploy/docker-compose.local.yml up -d
```

Sobe: PostgreSQL (:5432), Redis (:6379), MinIO (:9000/:9001), Keycloak (:8081), Mailpit (:8025).

### 💻 Aplicações

#### Backend

```bash
cd backend
./mvnw spring-boot:run    # http://localhost:8080
./mvnw verify             # testes + formatação (Spotless)
```

#### Frontend

```bash
cd frontend
pnpm install
pnpm dev                 # http://localhost:3000
```

> ⚠️ Infraestrutura de deploy (VPS/Coolify/Traefik) e apps entram conforme [`docs/roadmap.md`](docs/roadmap.md) fases 0–1.

---

## 📁 Estrutura do Projeto

```
togetherdev-space/
├── backend/                    # API Java/Spring (monólito modular)
│   ├── identity/               # usuários, perfis, avatares
│   ├── community/              # grupos e membros
│   ├── projects/               # projetos, papéis, milestones
│   └── social/                 # posts, comentários, feed
├── frontend/                   # Next.js App Router
│   ├── app/
│   ├── components/
│   └── lib/
├── docs/
│   ├── adr/                    # decisões arquiteturais (MADR)
│   ├── architecture/           # visão, domínios, dados, API, segurança, ambientes
│   └── roadmap.md              # plano semanal até lançamento
├── deploy/                     # docker-compose local, configs
└── .github/workflows/          # CI paths-filtered
```

---

## 📚 Documentação

| Doc | Conteúdo |
|---|---|
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | Visão C4, stack, princípios |
| [`docs/architecture/domains.md`](docs/architecture/domains.md) | Módulos, fases, regras de dependência |
| [`docs/architecture/data-model.md`](docs/architecture/data-model.md) | Schema SQL do MVP |
| [`docs/architecture/api-conventions.md`](docs/architecture/api-conventions.md) | Contrato REST |
| [`docs/architecture/security.md`](docs/architecture/security.md) | OIDC/BFF, papéis, LGPD |
| [`docs/architecture/environments.md`](docs/architecture/environments.md) | Ambientes, variáveis, backups, runbook |
| [`docs/architecture/provisioning-vps.md`](docs/architecture/provisioning-vps.md) | Provisionamento VPS + Coolify |
| [`docs/adr/`](docs/adr/) | ADRs 0001–0009 |
| [`docs/roadmap.md`](docs/roadmap.md) | Fases 0–6 semanais |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Commits, DoD, release |

---

## 📌 Regras Técnicas

- Fronteiras entre módulos são verificadas em build (ArchUnit) — violação quebra CI
- Migrações Flyway imutáveis e backward-compatible (rollback seguro)
- Papéis contextuais (grupo/projeto) vivem no Postgres, nunca no JWT
- Default-deny em endpoints; todo endpoint novo tem teste de autorização
- Cada fase do roadmap termina deployada em produção
- Secrets apenas em variáveis de ambiente (nunca versionadas)

## ⚠️ Limitações Atuais (MVP)

- Sem chat em tempo real (fase 2)
- Sem notificações push/e-mail além das transacionais do Keycloak
- Feed apenas cronológico (sem ranking/follows)
- Sem mentoria, moderação ou busca avançada
- UI apenas em português

---

## 🗺️ Roadmap

Plano detalhado semana a semana em [`docs/roadmap.md`](docs/roadmap.md):

| Fase | Entrega |
|---|---|
| 0 | Fundação: monorepo + CI |
| 1 | VPS + Coolify + hello-world HTTPS |
| 2 | Identity: login Keycloak + perfil |
| 3 | Grupos |
| 4 | Projetos + milestones |
| 5 | Feed + posts |
| 6 | Endurecimento + beta público |

---

## 🧪 Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind, shadcn/ui |
| Backend | Java 25, Spring Boot 4.x, Maven |
| Dados | PostgreSQL 16+, Flyway, Redis |
| Identidade | Keycloak (OIDC, Authorization Code + PKCE) |
| Objetos | MinIO (API S3) |
| Deploy | Docker, Coolify, Traefik, GitHub Actions |
| Testes | JUnit 5, Testcontainers, ArchUnit |

---

## 🤝 Contribuindo

Contribuições bem-vindas — correções pontuais ou funcionalidades.

Veja o [`CONTRIBUTING.md`](CONTRIBUTING.md) para Conventional Commits, fluxo de PRs, Definition of Done e estilo de código.

---

## 👨‍💻 Autor

**[Luanderson Pimenta Mendes](https://github.com/Luanderson-Dev)** — Full-Stack Engineer

## 📄 Licença

Licenciado sob [MIT](LICENSE) © 2026 Luanderson Pimenta Mendes.

> 💡 **MIT implica:** você pode usar, copiar, modificar e distribuir — inclusive comercialmente — desde que mantenha o aviso de copyright. Sem garantias.
