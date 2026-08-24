<!--
  Dica: o título do PR vira a mensagem do commit no squash merge.
  Use Conventional Commits — ex.: feat(projects): adicionar conclusão de milestone
-->

## O quê?

<!-- Descreva resumidamente a mudança. -->

## Por quê?

<!-- Qual problema resolve ou qual valor entrega? Contexto da decisão. -->

## Issue relacionada

Closes #

## Tipo de mudança

- [ ] 🐞 Correção de bug (`fix`)
- [ ] ✨ Nova funcionalidade (`feat`)
- [ ] 📚 Documentação (`docs`)
- [ ] ♻️ Refatoração (`refactor`)
- [ ] 🔧 Build/CI/infra (`build`, `ci`, `chore`)

## Checklist

- [ ] Testes adicionados/atualizados (unitário e/ou integração)
- [ ] `./mvnw verify` (backend) e/ou `pnpm lint && pnpm typecheck && pnpm build` (frontend) passando local
- [ ] CI verde
- [ ] Docs atualizadas quando aplicável (contrato, modelo de dados, ADR)
- [ ] Nenhum secret hardcoded; variáveis novas documentadas em `docs/architecture/environments.md`
- [ ] Fiz self-review do diff

## Screenshots

<!-- Se houver mudança visual, cole antes/depois. -->
