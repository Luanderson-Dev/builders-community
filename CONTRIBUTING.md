# Guia de Contribuição

Obrigado pelo interesse em contribuir com o **TogetherDev Space**! 🎉

Projeto open source em construção ativa — contribuições de qualquer tamanho são bem-vindas: correção de typo, melhoria de documentação, bug fix ou feature nova. Este guia explica como participar.

## 📋 Índice

1. [Formas de contribuir](#-formas-de-contribuir)
2. [Ambiente de desenvolvimento](#️-ambiente-de-desenvolvimento)
3. [Fluxo de contribuição](#-fluxo-de-contribuição)
4. [Conventional Commits](#-conventional-commits)
5. [Pull Requests](#-pull-requests)
6. [Definition of Done](#-definition-of-done)
7. [Estilo de código](#-estilo-de-código)
8. [Migrações de banco](#-migrações-de-banco)
9. [Reportando vulnerabilidades](#-reportando-vulnerabilidades)

## 🤝 Formas de contribuir

| Forma | Como |
|---|---|
| 🐞 Reportar bug | Abra uma [issue de bug](https://github.com/Luanderson-Dev/togetherdev-space/issues/new?template=bug_report.yml) |
| 💡 Sugerir funcionalidade | Abra uma [issue de feature](https://github.com/Luanderson-Dev/togetherdev-space/issues/new?template=feature_request.yml) |
| 📚 Melhorar documentação | PR direto apontando o que melhorar |
| 🛠️ Código | Comente na issue que vai trabalhar nela (evita trabalho duplicado) e siga o fluxo abaixo |

Issues marcadas com [`good first issue`](https://github.com/Luanderson-Dev/togetherdev-space/labels/good%20first%20issue) são ideais para começar.

## 💻 Ambiente de desenvolvimento

Pré-requisitos: **Java 25**, **Node 22+**, **pnpm**, **Docker**.

```bash
git clone https://github.com/Luanderson-Dev/togetherdev-space.git
cd togetherdev-space

# 1. Infraestrutura local (postgres, redis, minio, keycloak, mailpit)
docker compose -f deploy/docker-compose.local.yml up -d

# 2. Backend (http://localhost:8080)
cd backend
cp src/main/resources/application.yml .env.example  # defaults já funcionam no local
./mvnw spring-boot:run

# 3. Frontend (http://localhost:3000)
cd ../frontend
cp .env.example .env.local   # gere AUTH_SECRET: openssl rand -base64 32
pnpm install
pnpm dev
```

Verificações locais antes de abrir PR:

```bash
cd backend && ./mvnw verify          # build + testes + Spotless
cd ../frontend && pnpm lint && pnpm typecheck && pnpm format:check && pnpm build
```

## 🔀 Fluxo de contribuição

1. Abra/comente numa issue descrevendo a mudança proposta.
2. Faça um fork ou crie branch a partir da `main`:
   ```
   feat/<slug>      nova funcionalidade
   fix/<slug>       correção de bug
   docs/<slug>      documentação
   refactor/<slug>  refatoração sem mudança de comportamento
   chore/<slug>     build, CI, deps
   ```
3. Commits seguindo Conventional Commits (abaixo).
4. Abra o PR preenchendo o template. Mantenha PRs pequenos e focados.
5. CI precisa estar verde: backend (`mvnw verify`), frontend (lint/typecheck/format/build) e commitlint.
6. Revisão do mantenedor → merge squash na `main`.

## 📝 Conventional Commits

Formato obrigatório (verificado por CI):

```
<tipo>(<escopo opcional>): <assunto>

[campo de corpo opcional]

[rodapés opcionais, ex.: Closes #123]
```

Assunto: imperativo, minúsculas preferidas, sem ponto final, ≤ 72 caracteres.

### Tipos

| Tipo | Uso | Versão |
|---|---|---|
| `feat` | nova funcionalidade | minor |
| `fix` | correção de bug | patch |
| `docs` | documentação | — |
| `style` | formatação, sem lógica | — |
| `refactor` | mudança interna sem mudar comportamento | — |
| `perf` | melhoria de performance | — |
| `test` | testes | — |
| `build` | sistema de build/dependências | patch |
| `ci` | pipelines/configuração de CI | — |
| `chore` | manutenção | — |

### Escopos válidos

Módulos de domínio e camadas transversais:

```
identity · community · projects · social · api · web
infra · deps · docs · adr · roadmap · deploy · ci
```

### Exemplos

```
feat(projects): adicionar conclusão de milestone

Closes #42
```

```
fix(identity): renovar access token antes de expirar
```

```
docs(adr): registrar decisão de armazenamento MinIO
```

Breaking changes: adicione `!` após o tipo (`feat(api)!:`) e descreva no corpo.

## 🔍 Pull Requests

- Use o [template automático](.github/PULL_REQUEST_TEMPLATE.md).
- Um PR = um objetivo. Evite misturar feature + refatoração grande.
- Todos os checks do CI precisam estar verdes.
- Squash merge — o título do PR vira a mensagem do commit na `main`, então capriche nele (Conventional Commits).

## ✅ Definition of Done

Um PR está pronto quando:

1. Novas regras de negócio têm teste unitário; endpoints novos têm teste de integração.
2. Lint/formatação passam localmente (Spotless, ESLint/Prettier).
3. CI verde.
4. Documentação atualizada quando muda contrato, modelo de dados ou decisão de arquitetura (novo ADR quando aplicável — ver `docs/adr/0001`).
5. Nenhum secret hardcoded; novas variáveis documentadas em `docs/architecture/environments.md`.

## 🎨 Estilo de código

**Backend (Spring Boot/Maven)**

- Pacotes por módulo de domínio conforme [`docs/architecture/domains.md`](docs/architecture/domains.md); fronteiras verificadas por ArchUnit — violação quebra o build.
- Sem lógica de negócio em controllers; casos de uso na camada `application`.
- Erros via `application/problem+json` padronizado ([api-conventions](docs/architecture/api-conventions.md)).
- Formatação automática via Spotless: `./mvnw spotless:apply`.
- Mensagens de log/código em inglês; strings de UI em PT-BR centralizadas.

**Frontend (Next.js/TypeScript)**

- Server Components por padrão; `"use client"` só onde interativo.
- UI via shadcn/ui + Tailwind; nada de CSS inline ad hoc.
- Formatação: `pnpm format`.

## 🗃️ Migrações de banco

1. Nome `V{n}__descricao.sql`, sequencial — **nunca edite migração já mergeada**.
2. Backward-compatible (expand/contract): rollback da aplicação não pode quebrar.
3. Índices pensados junto (referência: [`docs/architecture/data-model.md`](docs/architecture/data-model.md)).

## 🔐 Reportando vulnerabilidades

**Não abra issue pública.** Veja [`SECURITY.md`](SECURITY.md) para reporte responsável.

## ⚖️ Licença das contribuições

Ao contribuir você concorda que suas contribuições serão licenciadas sob a [MIT License](LICENSE) do projeto.

---

Dúvidas? Abra uma [Discussion](https://github.com/Luanderson-Dev/togetherdev-space/discussions) ou comente na issue relacionada. Bora construir juntos! 🚀
