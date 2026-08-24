# ADR 0007 — MinIO para armazenamento de objetos

- **Status:** Aceito
- **Data:** 2026-08-24

## Contexto

O v1 já precisa guardar avatares (e provavelmente capas de projeto/grupo). Opções: volume Docker local, object storage externo (S3/R2/B2), MinIO self-hosted.

Volume local escala mal, dificulta backup consistente e acopla arquivos ao container do app.

## Decisão

**MinIO** self-hosted via Coolify, exposto em `s3.dominio.com`:

- API compatível S3 — o código usa AWS SDK v2 apontando para endpoint custom; migrar para S3/R2 real depois = trocar credenciais/endpoint.
- Buckets: `media-public` (avatares, capas — leitura pública via URL assinada ou policy de leitura anônima) e `media-private` (uso futuro).
- Uploads fluem **pelo backend** (presigned PUT gerado pela API; cliente faz upload direto ao MinIO) — valida tamanho/tipo antes de emitir presign.
- Limites v1: imagens JPEG/PNG/WebP ≤ 5 MB; processamento (resize) entra fase 3 com job assíncrono.
- Backup: `mc mirror` diário para bucket remoto (B2/R2 free tier) — agendado no Coolify.

## Consequências

**Positivas**
- Compatível S3: zero rewrite ao migrar para nuvem.
- Upload direto poupa memória/banda do backend Java.

**Negativas**
- +1 container (~300–500 MB RAM).
- Presigned URLs exigem relógio sincronizado e CORS bem configurado.
