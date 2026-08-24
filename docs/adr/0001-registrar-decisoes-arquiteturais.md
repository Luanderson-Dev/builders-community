# ADR 0001 — Registrar decisões arquiteturais

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

O projeto é desenvolvido por um único dev, em tempo parcial. Decisões técnicas serão tomadas continuamente e, sem registro, o "porquê" se perde — inclusive para o próprio autor meses depois. A visão do produto está no `README.md` (raiz do projeto).

## Decisão

Adotar **MADR** (Markdown Any Decision Records) como formato de ADR, em PT-BR, armazenados em `docs/adr/`, numerados sequencialmente (`NNNN-titulo-curto.md`).

Cada ADR contém: Status, Data, Contexto, Decisão e Consequências (positivas/negativas).

Regras:

1. Toda decisão de arquitetura, stack, infraestrutura ou convenção transversal gera um ADR.
2. ADRs são imutáveis; mudanças geram novo ADR que marca o anterior como **Substituído por**.
3. ADRs propostos ficam com status **Proposto** até decisão final.

## Consequências

**Positivas**
- Histórico rastreável e barato (só Markdown, versionado no git).
- Onboarding trivial caso o time cresça.

**Negativas**
- Custa disciplina escrever; mitigado pelo formato curto do MADR.
