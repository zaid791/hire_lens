# Local Development — Run Hire Lens from Cloud Config

This guide pulls configuration from your deployed GCP/Firebase stack and runs all services on your machine.

---

## Prerequisites

- Node.js 18+
- Python 3.12+
- `gcloud` CLI authenticated
- Terraform already applied to your GCP project (`hire-lens-pw` or your own)

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project hire-lens-pw
```

---

## Step 1 — Pull cloud config to local env files

From the repo root:

```bash
chmod +x scripts/setup-local-from-cloud.sh
./scripts/setup-local-from-cloud.sh
```

This script:

1. Reads Firebase config from `apps/persona_probe/.env.production.generated` (created by `terraform apply`)
2. Reads secrets from `terraform_new/terraform.tfvars` (Telegram token, Gemini key)
3. Writes:
   - `apps/persona_probe/.env.local`
   - `apps/telegram-bot/.env`
   - `services/backend/.env`
4. Clears the Telegram **webhook** so the local bot can use **long-polling** (Cloud Run uses webhooks)

> If `.env.production.generated` files are missing, run `cd terraform_new && terraform apply` first.

To skip webhook deletion (e.g. keep cloud bot running):

```bash
DELETE_TELEGRAM_WEBHOOK=0 ./scripts/setup-local-from-cloud.sh
```

---

## Step 2 — Install dependencies

Open **three terminals** (or use a process manager):

### Terminal 1 — Frontend (PersonaProbe)

```bash
cd apps/persona_probe
npm install
npm run dev
```

→ http://localhost:3000

### Terminal 2 — Backend API

```bash
cd services/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend:app --host 0.0.0.0 --port 8080 --reload
```

→ http://localhost:8080/health

### Terminal 3 — Telegram bot

```bash
cd apps/telegram-bot
npm install
npm run dev
```

→ http://localhost:8081 (health check; bot uses **long-polling** locally)

---

## Step 3 — Verify

| Service | Check |
|---------|--------|
| Frontend | Open http://localhost:3000 — search `demo` or sign in |
| Backend | `curl http://localhost:8080/health` → `{"status":"ok",...}` |
| Bot | Message your bot on Telegram: `/demo` |
| Firebase Auth | Email login + Google sign-in (localhost is in authorized domains) |
| Firestore (bot) | `/profile` needs ADC — run `gcloud auth application-default login` |
| Connect Telegram | Set `VITE_TELEGRAM_BOT_USERNAME` in `.env.local`, then use **Connect Telegram** on the dashboard |

---

## Local vs cloud differences

| | Cloud (Cloud Run) | Local |
|--|-------------------|--------|
| Frontend URL | `run-frontend-*.a.run.app` | `http://localhost:3000` |
| Bot mode | Webhook | Long-polling |
| Bot port | 8080 | **8081** (avoids backend conflict) |
| Secrets | Secret Manager | `.env` / `.env.local` files |
| Firestore | Service account | Application Default Credentials |

---

## Switching back to cloud bot

Redeploy or restart the Cloud Run bot service — it re-registers the webhook automatically on startup.

Or run:

```bash
# Replace with your bot token
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://run-bot-hirelens-dev-xxxxx-ew.a.run.app/telegram/webhook"
```

---

## Troubleshooting

### Bot not responding locally

- Run `./scripts/setup-local-from-cloud.sh` again to clear the webhook
- Only **one** bot instance should poll at a time (stop Cloud Run bot or use webhook delete)

### `Firebase Admin SDK not initialized`

```bash
gcloud auth application-default login
```

Ensure `GOOGLE_CLOUD_PROJECT=hire-lens-pw` is in `apps/telegram-bot/.env`.

### `auth/unauthorized-domain` on localhost

Firebase authorized domains should include `localhost` (Terraform adds this). Re-run `terraform apply` if missing.

### Regenerate cloud env files

```bash
cd terraform_new
terraform apply   # with generate_local_env_files = true
./scripts/setup-local-from-cloud.sh
```

---

## Quick reference

```bash
# One-time setup
./scripts/setup-local-from-cloud.sh

# Run all (3 terminals)
cd apps/persona_probe && npm run dev
cd services/backend && source .venv/bin/activate && uvicorn backend:app --port 8080 --reload
cd apps/telegram-bot && npm run dev
```
