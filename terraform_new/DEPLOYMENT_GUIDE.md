# Hire Lens — Step-by-Step Terraform Deployment Guide

This guide walks you through deploying **Hire Lens** (website + Telegram bot + backend) to **GCP + Firebase** using the Terraform stack in `terraform_new/`.

**Time required:** ~15–30 minutes for the first deploy (includes Cloud Build).

**Reference project:** `hire-lens-pw` (Europe West 1)

---

## What you will deploy

| Component | Where it runs |
|-----------|---------------|
| PersonaProbe website | Cloud Run |
| Telegram bot | Cloud Run (webhook mode) |
| FastAPI backend | Cloud Run |
| Firebase Auth + Firestore | Firebase |
| Secrets (Telegram token, Gemini key) | Secret Manager |
| Container images | Artifact Registry (built by Cloud Build) |

**AI model:** Set `model_provider = "gemini"` (default) or `"opensource"`.

---

## Before you start — checklist

Gather these before running Terraform:

- [ ] A **GCP project** with **billing enabled**
- [ ] **Owner** or **Editor** access on that project
- [ ] **Telegram bot token** from [@BotFather](https://t.me/BotFather)
- [ ] **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) (if using `model_provider = "gemini"`)
- [ ] Tools installed: `gcloud`, `terraform` (>= 1.8.0)

---

## Step 1 — Install tools (macOS)

```bash
# Google Cloud CLI
brew install --cask google-cloud-sdk

# Terraform
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify
gcloud version
terraform version
```

Local Docker is **not required** — images are built in GCP via Cloud Build.

---

## Step 2 — Create a GCP project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project → New Project**
3. Choose a name (e.g. `hirelens-dev-yourname`)
4. Copy the **Project ID** — you will need it in Step 4
5. Enable **billing** on the project (Firebase and Cloud Run require it)

---

## Step 3 — Authenticate with Google Cloud

Run these in your terminal:

```bash
# Login (opens browser)
gcloud auth login

# Credentials for Terraform and Cloud Build
gcloud auth application-default login

# Set your project and region
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region europe-west1
gcloud config set compute/region europe-west1
```

Use the same Google account that has **Owner** or **Editor** on the project.

---

## Step 4 — Configure Terraform variables

```bash
cd terraform_new
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` — minimum required values:

```hcl
project_id         = "your-gcp-project-id"
telegram_bot_token = "123456789:ABC-your-bot-token"

model_provider = "gemini"
gemini_api_key = "your-gemini-api-key"

build_images = true
repo_root    = ".."
```

> **Important:** Never commit `terraform.tfvars` — it contains secrets.

---

## Step 5 — Deploy with Terraform

```bash
cd terraform_new

terraform init
terraform plan    # preview (~100 resources on first run)
terraform apply   # type "yes" when prompted
```

First apply typically takes **15–30 minutes** because Cloud Build compiles and pushes three container images (frontend, bot, backend).

### What Terraform creates automatically

1. Enables required GCP APIs
2. Sets up Firebase (project, web app, hosting site)
3. Creates Firestore database and deploys security rules
4. Configures Firebase Auth (email/password) and authorized domains
5. Stores secrets in Secret Manager
6. Builds Docker images via Cloud Build
7. Deploys Cloud Run services (website, bot, backend)
8. Creates VPC, Pub/Sub, Cloud Function, and supporting IAM
9. Writes `.env.production.generated` reference files in the repo

---

## Step 6 — Enable Google Sign-In (manual, one time)

Email/password login is enabled by Terraform. **Google Sign-In must be turned on manually** once per GCP project:

1. Open [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/_/authentication/providers)
2. Select your project
3. Click **Google** → **Enable**
4. Pick a support email → **Save**

If prompted, complete the OAuth consent screen first.

No `terraform apply` or frontend rebuild is needed after this step.

---

## Step 7 — Verify everything works

### Get your live URLs

```bash
terraform output deployment_summary
```

Example output:

```text
website   = "https://run-frontend-hirelens-dev-xxxxx-ew.a.run.app"
backend   = "https://run-backend-hirelens-dev-xxxxx-ew.a.run.app"
bot       = "https://run-bot-hirelens-dev-xxxxx-ew.a.run.app"
```

### Quick health checks

```bash
# Website
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$(terraform output -raw frontend_url)"

# Backend
curl -s "$(terraform output -raw backend_service_url)/health"

# Bot
curl -s "$(terraform output -raw bot_service_url)/"
```

### Manual tests

| Test | How |
|------|-----|
| Website loads | Open the frontend URL in a browser |
| Email sign-up / login | Use the auth modal on the website |
| Google sign-in | Click **Continue with Google** (after Step 6) |
| Telegram bot | Message your bot: `/demo` or `/analyze octocat` |

---

## Step 8 — Local development (optional)

After deploy, Terraform writes reference env files:

| File | Purpose |
|------|---------|
| `apps/persona_probe/.env.production.generated` | Frontend production config |
| `apps/telegram-bot/.env.production.generated` | Bot production config |
| `services/backend/.env.production.generated` | Backend production config |

Copy values into your local `.env.local` / `.env` files for development. Production secrets live in Secret Manager.

---

## Switching AI model later

Edit `terraform.tfvars`:

```hcl
model_provider = "opensource"   # or "gemini"
```

Then run:

```bash
terraform apply
```

---

## Common issues (quick fixes)

| Problem | Fix |
|---------|-----|
| `Error 403: API not enabled` | Wait 2–3 minutes, run `terraform apply` again |
| Cloud Build permission error | Run `gcloud auth application-default login` |
| `auth/unauthorized-domain` | Run `terraform apply` — Cloud Run URL is added automatically |
| `auth/operation-not-allowed` (Google) | Complete [Step 6](#step-6--enable-google-sign-in-manual-one-time) |
| Bot not responding | Check bot logs: `gcloud run services logs read run-bot-hirelens-dev --region=europe-west1 --limit=50` |
| Frontend auth errors | Rebuild frontend: `terraform apply -replace='module.build.null_resource.build_frontend[0]'` |

For a full list of issues encountered during development, see [`TERRAFORM_ISSUES_AND_FIXES.md`](./TERRAFORM_ISSUES_AND_FIXES.md).

---

## Teardown

To delete all deployed resources:

```bash
cd terraform_new
terraform destroy
```

---

## Quick command reference

```bash
# Full deploy
cd terraform_new && terraform init && terraform apply

# View URLs
terraform output deployment_summary

# Check Terraform matches live infra (website/bot/backend should show no changes)
terraform plan

# Tail bot logs
gcloud run services logs tail run-bot-hirelens-dev --region=europe-west1
```

---

## Related docs

- Detailed team guide: [`README_TEAM.md`](./README_TEAM.md)
- Issues and fixes log: [`TERRAFORM_ISSUES_AND_FIXES.md`](./TERRAFORM_ISSUES_AND_FIXES.md)
- Telegram bot: [`../apps/telegram-bot/README.md`](../apps/telegram-bot/README.md)
