# ADR 0002 — Monólito modular

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Produto novo, dev solo, domínios ainda instáveis. Microserviços desde o início trariam custo operacional (deploy distribuído, tracing, consistência eventual) sem retorno proporcional. Por outro lado, um monólito sem fronteiras internas tende ao "big ball of mud" e trava a evolução para serviços.

Alternativas consideradas: microserviços (descartado — ops >> valor no estágio atual), monólito em camadas técnicas (descartado — não isola domínios).

## Decisão

**Monólito modular** em um único deploy Spring Boot:

- Pacotes de primeiro nível = módulos de domínio: `identity`, `community`, `projects`, `social` (+ futuros: `messaging`, `notifications`, `mentoring`, `moderation`, `search`).
- Regras de fronteira:
  1. Módulo só acessa dados de outras tabelas via **API pública do módulo** (interface Java exposta em pacote `api/` do módulo) — nunca via repository/entidade alheia.
  2. Comunicação assíncrona interna por **eventos de domínio** (`ApplicationEventPublisher`) — ex.: `ProjectCreatedEvent`.
  3. Dependência cíclica entre módulos é erro de build (verificada por ArchUnit + `spring-javaformat`/jdeps no CI).
  4. Tabelas pertencem a **um único módulo**; FKs cruzam módulos apenas referenciando UUIDs (sem FK física cross-módulo quando acoplamento deve ser fraco).
- Testes ArchUnit falham o build se fronteira for violada — a regra vive no código, não na documentação.
- Extração futura de serviço (identity/messaging/notification/search) vira "substituir chamada local por cliente HTTP/evento" — as costuras já existem.

## Consequências

**Positivas**
- Velocidade de monólito com disciplina de serviços.
- Caminho de extração barato porque as fronteiras já foram pagas.

**Negativas**
- Exige vigilância constante nas fronteiras (mitigada por ArchUnit no CI).
- Um bug grave derruba tudo (aceito no MVP; mitiga-se com boas práticas de resiliência básica).
