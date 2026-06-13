# Hire Lens

**Cloud Computing Project — Telegram-first HR assistant for GitHub developer intelligence**

Hire Lens helps recruiters and hiring teams quickly understand a candidate’s public GitHub presence. Users sign in on the web, connect Telegram, and run AI-powered profile analyses from either the **PersonaProbe dashboard** or the **Telegram bot**. Usage quotas, subscription tiers, and Telegram linking are stored in **Firebase Firestore** and enforced consistently across channels.

---

## Team

| Name | Role |
|------|------|
| Mohammed Zaid Shaikh | Telegram bot, web app, Firebase integration |
| Piotr Bartosiewicz | Analysis pipeline, backend services |
| Krzysztof Krawiec | Terraform, GCP deployment, infrastructure |

---

## Features (implemented)

- **PersonaProbe web app** — search a GitHub username and get language stats, commit patterns, and Gemini-generated persona insights
- **Firebase Authentication** — email/password and Google sign-in
- **Telegram bot** — `/analyze`, `/demo`, `/profile`; shares daily quota with the website
- **Account linking** — website users connect Telegram via a secure one-time token flow
- **Quota & tiers** — base (4 requests/day) and premium (100 requests/day), tracked in Firestore
- **Admin panel** — protected `/admin` route for listing users, tiers, remaining quota, and Telegram link status
- **Infrastructure as Code** — full GCP + Firebase stack provisioned with Terraform (`terraform_new/`)

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  PersonaProbe       │     │  Telegram Bot       │
│  (Cloud Run)        │     │  (Cloud Run)        │
│  /app  /admin       │     │  webhook mode       │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └─────────────┬─────────────┘
                         │
              ┌──────────▼──────────┐
              │ Firebase Auth +     │
              │ Firestore           │
              └──────────┬──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼───────┐
│ Secret Mgr   │  │ GCS + Pub/Sub│  │ FastAPI      │
│ (API keys)   │  │ + Function   │  │ Backend      │
└──────────────┘  └──────────────┘  └──────────────┘
                         │
              ┌──────────▼──────────┐
              │ Gemini API          │  model_provider = "gemini" (default)
              │ or Cloud Run        │  model_provider = "opensource"
              │ inference service   │
              └─────────────────────┘
```

| Component | Technology | Location in repo |
|-----------|------------|------------------|
| Website | React 19, Vite, Tailwind | `apps/persona_probe/` |
| Telegram bot | Node.js, Telegraf | `apps/telegram-bot/` |
| Backend API | FastAPI (Python) | `services/backend/` |
| Inference (optional) | Python | `services/model-inference/` |
| Infrastructure | Terraform | `terraform_new/` |
| Firestore rules | Firebase Rules | `firestore.rules` |

---

## Repository structure

```
hire_lens/
├── apps/
│   ├── persona_probe/      # Main web dashboard (search, auth, admin)
│   └── telegram-bot/       # Telegram interface
├── services/
│   ├── backend/            # FastAPI health & orchestration API
│   └── model-inference/    # Optional self-hosted model (opensource variant)
├── terraform_new/          # Active GCP/Firebase deployment (use this)
├── docs/                   # Developer guides
├── diagrams/               # Architecture diagrams
├── plan/                   # Written project plan (LaTeX)
└── presentation/           # Slide deck (LaTeX)
```

See [docs/repo-structure.md](docs/repo-structure.md) for folder ownership rules.

---

## Quick start for evaluators

### 1. Live deployment

After Terraform apply, get service URLs:

```bash
cd terraform_new
terraform output deployment_summary
```

| Test | Expected result |
|------|-----------------|
| Open frontend URL | PersonaProbe landing page loads |
| Sign up / log in | Firebase auth works |
| Search `demo` | Instant mock analysis report |
| Connect Telegram | Opens bot with link token; tap **Start** |
| Message bot `/demo` | Analysis report in Telegram (linked account) |
| Open `/admin` | Admin table (admin Firebase UID required) |

Full deployment steps: [terraform_new/DEPLOYMENT_GUIDE.md](terraform_new/DEPLOYMENT_GUIDE.md)

### 2. Local development

```bash
# Pull config from your deployed GCP project
chmod +x scripts/setup-local-from-cloud.sh
./scripts/setup-local-from-cloud.sh

# Terminal 1 — frontend
cd apps/persona_probe && npm install && npm run dev

# Terminal 2 — bot (requires ADC for Firestore)
cd apps/telegram-bot && npm install && npm run dev

# Terminal 3 — backend (optional)
cd services/backend && pip install -r requirements.txt && uvicorn backend:app --reload
```

Details: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)

---

## Configuration

| Variable / secret | Purpose |
|-------------------|---------|
| `telegram_bot_token` | Bot API token (Secret Manager in cloud) |
| `gemini_api_key` | Gemini analysis (when `model_provider = gemini`) |
| `VITE_FIREBASE_*` | Frontend Firebase SDK config |
| `VITE_TELEGRAM_BOT_USERNAME` | Website “Connect Telegram” deep link |
| Firestore `admins/{uid}` | Grants access to `/admin` panel |

Never commit `terraform.tfvars`, `.env`, or `.env.local` with real secrets.

---

## Course deliverables

| Deliverable | Path |
|-------------|------|
| Project plan | `plan/project_plan.tex` |
| Presentation | `presentation/presentation.tex` |
| Architecture diagrams | `diagrams/` |
| Deployment guide | `terraform_new/DEPLOYMENT_GUIDE.md` |
| Infrastructure issues log | `terraform_new/TERRAFORM_ISSUES_AND_FIXES.md` |

---

## Documentation index

| Document | Description |
|----------|-------------|
| [apps/persona_probe/README.md](apps/persona_probe/README.md) | Web app setup and features |
| [apps/telegram-bot/README.md](apps/telegram-bot/README.md) | Bot commands and linking flow |
| [terraform_new/README.md](terraform_new/README.md) | Terraform overview |
| [terraform_new/DEPLOYMENT_GUIDE.md](terraform_new/DEPLOYMENT_GUIDE.md) | Step-by-step cloud deploy |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Run all services locally |
| [docs/repo-structure.md](docs/repo-structure.md) | Monorepo layout and boundaries |

---

## Notes

- **Active infrastructure:** use `terraform_new/` (GCP + Firebase). The `terraform/` folder contains an earlier Azure scaffold and is not used for the current deployment.
- **Admin access:** create a Firestore document at `admins/{your-firebase-uid}` and deploy updated rules (`terraform apply -target=module.firestore_rules`).
- **Cloud bot webhook:** if the Telegram bot stops responding after local dev, re-register the webhook — see [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md#switching-back-to-cloud-bot).
