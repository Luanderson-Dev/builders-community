# ADR 0005 — Next.js (React/TypeScript) no frontend

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

Plataforma de comunidade depende de páginas públicas indexáveis (projetos, grupos, perfis) — SEO importa. O frontend React/TS era pré-definido pela visão (`README.md`).

Alternativas consideradas:

1. Vite SPA — hospedagem mais simples, mas SEO fraco exigiria soluções alternativas (prerender, SSR externo).
2. React Router v7 (meta-framework) — bom meio termo, ecossistema menor que Next.

## Decisão

Usar **Next.js (App Router) + TypeScript**:

- Server Components por padrão; páginas públicas de grupos/projetos/perfis renderizadas no servidor (SSR/ISR).
- Páginas autenticadas client-side após hidratação.
- **Padrão BFF**: rotas `/api/auth/*` do Next (Auth.js) guardam a sessão em cookie `httpOnly`; chamadas ao backend partem do servidor Next com o access token. O browser nunca vê o token.
- UI: Tailwind CSS + shadcn/ui (componentes copiáveis, zero dependência pesada de design system).
- Data fetching server-side direto na API Java; mutações client-side via fetch wrapper.

## Consequências

**Positivas**
- SEO e first paint bons nas páginas públicas.
- BFF elimina classe inteira de bugs de token no browser.
- Servidor Node único no Coolify.

**Negativas**
- Precisa de runtime Node (não é estático puro) — custo aceito.
- Acoplamento moderado ao framework Next.js.
