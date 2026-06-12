# Telegram Bot

Telegram interface for **Hire Lens**. Linked website users can analyze public GitHub profiles and check their daily quota from chat.

Deployed to **Google Cloud Run** (webhook mode). Uses **long-polling** locally.

---

## Features

| Command / input | Description |
|-----------------|-------------|
| `/start` | Onboarding; completes account link when opened via website token |
| `/analyze <username>` | Full GitHub + AI analysis report |
| `/demo` | Sample report (no GitHub API call) |
| `/profile` | Subscription tier and remaining daily quota |
| GitHub username or URL | Shortcut for `/analyze` |

---

## Account linking (required)

The bot only serves users with a linked website account:

1. User signs up on the website (`/login`)
2. User clicks **Connect Telegram** on the dashboard (`/app`)
3. User taps **Start** in the Telegram chat that opens

Quota and subscription tier are read from the same Firestore `users/{uid}` document as the website.

---

## Tech stack

- Node.js + TypeScript
- [Telegraf](https://telegraf.js.org/)
- Firebase Admin SDK (Firestore)
- GitHub REST API
- Google Gemini API (or internal inference service when `MODEL_PROVIDER=opensource`)

---

## Runtime modes

| Environment | Mode | How updates arrive |
|-------------|------|-------------------|
| Cloud Run | Webhook | Telegram POSTs to `/telegram/webhook` |
| Local dev | Long-polling | `bot.launch()` |

On Cloud Run startup the bot resolves its public URL and calls `setWebhook` automatically.

### If the cloud bot stops responding

Local dev clears the webhook. Re-register after switching back to cloud:

```bash
PROJECT_ID="your-project-id"
BOT_URL="$(cd terraform_new && terraform output -raw bot_service_url)"
TOKEN="$(gcloud secrets versions access latest --secret=telegram-bot-token --project=$PROJECT_ID)"

curl -s "https://api.telegram.org/bot${TOKEN}/setWebhook?url=${BOT_URL}/telegram/webhook&drop_pending_updates=true"
```

See [docs/LOCAL_DEVELOPMENT.md](../../docs/LOCAL_DEVELOPMENT.md#switching-back-to-cloud-bot).

---

## Local development

```bash
cp .env.example .env
# TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, APP_URL=http://localhost:5173
gcloud auth application-default login   # Firestore access
npm install
npm run dev
```

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `GEMINI_API_KEY` | Required when `MODEL_PROVIDER=gemini` |
| `APP_URL` | Frontend URL for link instructions |
| `MODEL_PROVIDER` | `gemini` (default) or `opensource` |
| `INFERENCE_SERVICE_URL` | Required when `MODEL_PROVIDER=opensource` |

On the website, set `VITE_TELEGRAM_BOT_USERNAME` in `.env.local`.

---

## Quota limits

| Tier | Daily limit |
|------|-------------|
| `base` | 4 analyses |
| `premium` | 100 analyses |

Counters reset daily (`lastRequestDate` in Firestore).

---

## Project structure

```
src/
├── bot.ts              # Commands, webhook server, analysis handler
├── services/
│   ├── firebaseService.ts   # Firestore: linking, quota, profiles
│   ├── githubService.ts
│   ├── geminiService.ts
│   └── inferenceService.ts
└── utils/              # Language & commit analysis
```

---

## Production deploy

Built and deployed via Terraform + Cloud Build. No manual steps beyond `terraform apply`.

Targeted bot-only redeploy:

```bash
cd terraform_new
terraform apply \
  -replace='module.build.null_resource.build_bot[0]' \
  -target=module.build.null_resource.build_bot \
  -target=module.services.google_cloud_run_v2_service.bot
```

---

## Related docs

- [Root README](../../README.md)
- [PersonaProbe README](../persona_probe/README.md)
- [Deployment guide](../../terraform_new/DEPLOYMENT_GUIDE.md)
