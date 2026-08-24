# Runbook — Provisionamento da VPS + Coolify (Fase 1)

Guia executável para colocar o TogetherDev Space no ar em VPS própria. Tempo estimado: 2–4 horas na primeira vez.

> Substitua `dominio.com` pelo seu domínio real em todos os comandos/configs.

## 0. Pré-requisitos

| Item | Especificação |
|---|---|
| VPS | Ubuntu 24.04 LTS, 2 vCPU, **4 GB RAM** (Keycloak é pesado), 40 GB SSD |
| Provedor | Qualquer (Hetzner, Contabo, DigitalOcean, Oracle Free Tier) |
| Domínio | Registrado, com acesso ao gerenciador de DNS |
| Chave SSH | Par ed25519 gerado localmente |

## 1. DNS (propagar antes de tudo)

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` ou `app` (frontend) | IP da VPS |
| A | `api` | IP da VPS |
| A | `auth` | IP da VPS |
| A | `s3` | IP da VPS |
| A | `cdn` (opcional, fase de mídia pública) | IP da VPS |

TTL baixo (300s) durante setup. Propagação: verifique com `dig +short app.dominio.com`.

## 2. Criação e hardening da VPS

Como root no primeiro acesso:

```bash
# usuário admin dedicado
adduser deploy && usermod -aG sudo deploy

# SSH só por chave
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh

# firewall
ufw allow OpenSSH && ufw allow 80,443/tcp && ufw --force enable

# fail2ban + updates automáticos
apt update && apt install -y fail2ban unattended-upgrades
systemctl enable --now fail2ban
dpkg-reconfigure -plow unattended-upgrades
```

Em seguida, **em outro terminal**, valide login do `deploy` e só então desabilite root/senha:

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
```

⚠️ Não feche a sessão atual até confirmar que o novo login funciona.

## 3. Instalar Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Ao final, o script imprime a URL (`http://IP:8000`). Acesse, crie conta admin local e **troque a porta/ative HTTPS do painel** (Settings → Instance FQDN com domínio próprio, ex.: `coolify.dominio.com` — adicione registro A se usar).

No Coolify: *Servers → Localhost → Validate* — Docker e Proxy Traefik devem subir. SSL: o proxy emite Let's Encrypt automaticamente por domínio configurado em cada app.

## 4. Infraestrutura (apps no Coolify)

Criar **Project "TogetherDev Space"**, environment `production`, e adicionar:

| App | Fonte | Config essencial |
|---|---|---|
| PostgreSQL 16 | Docker Image `postgres:16-alpine` | DB `togetherdev`, user/pass fortes; **persistent volume** `/var/lib/postgresql/data`; expor apenas internamente |
| Redis 7 | Docker Image `redis:7-alpine` | volume `/data`; interno |
| MinIO | Docker Image `minio/minio` | cmd `server /data --console-address ":9001"`; credenciais fortes; volume `/data`; domínio `s3.dominio.com` → porta 9000 (console 9001 fica interno ou subdomínio separado) |
| Keycloak 26 | Docker Image `quay.io/keycloak/keycloak:26.3` | command `start --optimized --import-realm` (ver §5); env `KC_BOOTSTRAP_ADMIN_*`; domínio `auth.dominio.com` → 8080; **hostname**: `KC_HOSTNAME=auth.dominio.com`, `KC_PROXY=edge` |

Ordem de subida: Postgres → Keycloak → Redis/MinIO (independentes).

## 5. Realm do Keycloak em produção

O import usa `deploy/keycloak/realm-togetherdev.json` (montar como arquivo em `/opt/keycloak/data/import/`). Antes de subir:

1. Trocar `"secret": "local-api-secret-change-me"` por segredo forte.
2. Adicionar aos redirect URIs do client `web`: `https://app.dominio.com/api/auth/callback/keycloak`.
3. `webOrigins`: `https://app.dominio.com`.
4. Remover/bloquear o bloco `smtpServer` de mailpit e configurar SMTP real (Brevo/Mailgun): host, porta 587, auth true, usuário/senha.
5. `registrationAllowed` pode ficar `true` (cadastro público é requisito).

Ajustes pós-boot via UI admin (`auth.dominio.com`): política de senha, brute-force protection on (Realm Settings → Security Defenses).

### 5.1. Lições da execução real (API do Coolify 4.3.10)

Provisionamento executado via API REST em 2026-08-24 — pegadinhas confirmadas:

- **Contexto de build é a raiz do repo**, mesmo com `dockerfile_location=backend/Dockerfile`. Os Dockerfiles usam caminhos prefixados (`COPY backend/...`, `COPY frontend/...`) e há um `.dockerignore` único na raiz. Local: `docker build -f backend/Dockerfile .` a partir da raiz.
- **Keycloak 26 em `start` exige `KC_HOSTNAME`** — sem ele o container entra em crash-loop silencioso (a API não expõe logs de container parado). Definir também `KC_HTTP_ENABLED=true` + `KC_PROXY_HEADERS=xforwarded` atrás do Traefik.
- Import de realm via arquivo montado (`type=file` no endpoint `/applications/{uuid}/storages`), montado em `/opt/keycloak/data/import/realm-togetherdev.json`; o container precisa rodar com `CMD ["start", "--import-realm"]`.
- Volume persistente no MinIO: storages aceitam `{"type":"persistent","name":"minio-data","mount_path":"/data"}` (não existe tipo `volume`).
- Imagens prontas (minio/keycloak) como apps "Dockerfile raw": o `dockerfile` só pode ser definido **na criação** (`POST /applications/dockerfile`); depois, PATCH não permite alterá-lo — recriar o recurso se precisar mudar.
- Postgres/Redis: hostname interno na rede Coolify = UUID do recurso (ex.: `rzlv...:5432`).
- Ordem importa: subir bancos primeiro, esperar `running:healthy`, depois apps que dependem deles.

## 6. Deploy da API

Coolify → Project → **New Resource → GitHub App/Public repo** → `Luanderson-Dev/togetherdev-space`:

- Build Pack: **Dockerfile**, dockerfile location `backend/Dockerfile`
- Domain: `api.dominio.com` → port **8080**
- Health check: `/actuator/health`
- Env vars:
  ```
  SPRING_DATASOURCE_URL=jdbc:postgresql://<nome-servico-postgres>:5432/togetherdev
  SPRING_DATASOURCE_USERNAME=...
  SPRING_DATASOURCE_PASSWORD=...
  SPRING_DATA_REDIS_HOST=<redis>
  KEYCLOAK_ISSUER_URI=https://auth.dominio.com/realms/togetherdev
  KEYCLOAK_AUDIENCE=api
  MINIO_ENDPOINT=http://<minio>:9000
  MINIO_ACCESS_KEY=... MINIO_SECRET_KEY=... MINIO_BUCKET_PUBLIC=media-public
  APP_CORS_ALLOWED_ORIGINS=https://app.dominio.com
  ```
- Webhook de redeploy: copie a URL do deploy webhook para os Secrets do GitHub (`COOLIFY_WEBHOOK_API`) — CI chama após merge (configurar workflow na fase seguinte).

## 7. Deploy do Frontend

- Mesma fonte, Build Pack Dockerfile, location `frontend/Dockerfile`
- **Build arg**: `NEXT_PUBLIC_API_URL=https://api.dominio.com/api/v1`
- Domain: `app.dominio.com` → port **3000**
- Env runtime: `AUTH_KEYCLOAK_ID=web`, `AUTH_KEYCLOAK_ISSUER=https://auth.dominio.com/realms/togetherdev`, `AUTH_SECRET=<openssl rand -base64 32>` (client secret vazio enquanto client `web` for público)

Validação da fase: abrir `app.dominio.com` (página inicial), `api.dominio.com/actuator/health` → `{"status":"UP"}`.

## 8. Monitor externo

- [UptimeRobot](https://uptimerobot.com) ou Healthchecks.io grátis: monitor HTTP em `api.dominio.com/actuator/health` (intervalo 5 min) alertando por e-mail.
- Alerta de disco: cron simples no servidor (`df -h | awk '$5+0 > 80 {exit 1}'`) via Healthchecks.io ping, semanal.

## 9. Backups

| O quê | Como | Frequência |
|---|---|---|
| Postgres | Coolify → recurso DB → Scheduled backup (pg_dump) para S3/R2 destino remoto | diário 03:00 UTC, retenção 30 |
| MinIO | Scheduled task Coolify rodando `mc mirror` p/ bucket remoto | diário |
| Realm Keycloak | Export JSON junto do dump (task `kc.sh export --dir /tmp` + upload) | semanal |
| Snapshot VPS | Painel do provedor | semanal |

**Teste de restore obrigatório** antes de marcar a fase como concluída (fazer na semana seguinte, documentando passos executados).

## 10. Checklist final da fase 1

- [ ] `https://app.dominio.com` responde 200 com TLS válido
- [ ] `https://api.dominio.com/actuator/health` → UP
- [ ] `https://auth.dominio.com` carrega login do realm togetherdev
- [ ] Uptime monitor ativo e testado (derrubar app = alerta recebido)
- [ ] Backup agendado criou primeiro arquivo no destino remoto
- [ ] Painel Coolify acessível por HTTPS com senha forte/2FA
