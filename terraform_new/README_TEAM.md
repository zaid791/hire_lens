# Hire Lens — Team Terraform Deployment Guide

Complete guide for deploying **Hire Lens** (Telegram bot + PersonaProbe website + backend + optional inference service) on **GCP + Firebase** using the Terraform stack in `terraform_new/`.

> **For evaluators / quick deploy:** Start with [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — a shorter step-by-step checklist.  
> **Project overview:** See the [root README](../README.md) for architecture, team, and feature summary.  
> **Troubleshooting history:** See [`TERRAFORM_ISSUES_AND_FIXES.md`](./TERRAFORM_ISSUES_AND_FIXES.md) for problems encountered and fixes applied.

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Prerequisites (macOS)](#prerequisites-macos)
3. [One-time GCP setup](#one-time-gcp-setup)
4. [Authenticate via gcloud CLI](#authenticate-via-gcloud-cli)
5. [Configure Terraform variables](#configure-terraform-variables)
6. [Deploy](#deploy)
7. [Model variants (Gemini vs open-source)](#model-variants-gemini-vs-open-source)
8. [What Terraform automates](#what-terraform-automates)
9. [Teammate onboarding (minimal steps)](#teammate-onboarding-minimal-steps)
10. [Outputs and generated env files](#outputs-and-generated-env-files)
11. [Switching model variant later](#switching-model-variant-later)
12. [Troubleshooting](#troubleshooting)
13. [Module reference](#module-reference)

---

## Architecture overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  PersonaProbe   │     │   Telegram Bot   │     │  FastAPI Backend│
│  (Cloud Run)    │     │   (Cloud Run)    │     │  (Cloud Run)    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Firebase Auth +        │
                    │  Firestore + Rules      │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼────────┐  ┌──────▼──────┐  ┌───────▼────────┐
     │  GCS Storage    │  │  Pub/Sub    │  │  Cloud Function│
     └─────────────────┘  └─────────────┘  └────────────────┘

  model_provider = "gemini":
      Bot + Website → Google Gemini API (key in Secret Manager)

  model_provider = "opensource":
      Bot + Backend → Internal Cloud Run inference service (VPC)
```

| Component | GCP service | Notes |
|-----------|-------------|-------|
| Website (`apps/persona_probe`) | Cloud Run | Firebase config baked in at build time |
| Telegram bot | Cloud Run | Webhook mode (`/telegram/webhook`); `min_instances = 1` recommended |
| Backend API | Cloud Run | Public; secrets from Secret Manager |
| Inference (optional) | Cloud Run | Internal-only when `model_provider = opensource` |
| Auth & database | Firebase Auth + Firestore | Fully provisioned |
| Secrets | Secret Manager | Telegram token, Gemini key, auto-generated JWT |
| Images | Artifact Registry + Cloud Build | Built automatically when `build_images = true` |

---

## Prerequisites (macOS)

Install these once:

### 1. Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Google Cloud CLI

```bash
brew install --cask google-cloud-sdk
```

Restart your terminal, then verify:

```bash
gcloud version
```

### 3. Terraform

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform version   # must be >= 1.8.0
```

### 4. Docker (optional locally)

Cloud Build runs in GCP, so local Docker is **not required** for deployment. Install only if you want to build images locally:

```bash
brew install --cask docker
```

### 5. Telegram bot token

Message [@BotFather](https://t.me/BotFather) on Telegram and create a bot. Save the token.

### 6. Gemini API key (Gemini variant only)

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

---

## One-time GCP setup

Each teammate uses **their own GCP project** (free tier / credits apply).

### Step 1 — Create a GCP project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project → New Project**
3. Name it e.g. `hirelens-dev-yourname`
4. Note the **Project ID** (e.g. `hirelens-dev-yourname`)

### Step 2 — Enable billing

Firebase and Cloud Run require billing on the project:

1. Go to **Billing** in the console
2. Link a billing account to your project

### Step 3 — Set default project (after auth below)

```bash
gcloud config set project YOUR_PROJECT_ID
```

---

## Authenticate via gcloud CLI

Run these commands on macOS:

```bash
# 1. Login with your Google account (opens browser)
gcloud auth login

# 2. Set Application Default Credentials for Terraform + Cloud Build
gcloud auth application-default login

# 3. Set your project
gcloud config set project YOUR_PROJECT_ID

# 4. Set default region (matches terraform.tfvars)
gcloud config set run/region europe-west1
gcloud config set compute/region europe-west1

# 5. Verify
gcloud auth list
gcloud config list
```

**Important:** Use the same Google account that has **Owner** or **Editor** on the GCP project.

Grant Cloud Build permission to deploy (Terraform handles most IAM, but your user needs these roles):

```bash
# Optional sanity check — your account should be Owner/Editor
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"
```

---

## Configure Terraform variables

```bash
cd terraform_new
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_id         = "your-gcp-project-id"
telegram_bot_token = "123456789:ABC-your-bot-token"

# Pick ONE variant:
model_provider = "gemini"          # or "opensource"
gemini_api_key = "your-gemini-key" # required only for gemini

build_images = true
repo_root    = ".."
```

> **Never commit `terraform.tfvars`** — it contains secrets. It is listed in `.gitignore`.

---

## Deploy

```bash
cd terraform_new

# Initialize providers and modules
terraform init

# Preview changes (~5–15 min first run)
terraform plan

# Apply (creates all resources + builds images + deploys services)
terraform apply
```

Type `yes` when prompted.

### What happens during `apply`

1. Enables required GCP APIs
2. Creates Firebase project, web app, hosting site, Firestore, auth config
3. Stores secrets in Secret Manager (Telegram token, Gemini key, auto-generated JWT)
4. Creates VPC, Cloud Run services, Pub/Sub, Cloud Function
5. Runs Cloud Build to build and push Docker images to Artifact Registry
6. Deploys bot, website, backend, and (if opensource) inference service
7. Writes `.env.production.generated` files for local reference

### Verify deployment

```bash
terraform output deployment_summary
```

Open the **website** URL in your browser, then test the Telegram bot with `/demo` or `/analyze octocat`.

---

## Google Sign-In setup

Email/password auth is enabled automatically by Terraform. **Google Sign-In must be enabled manually** in the Firebase Console once per GCP project (Firebase creates the OAuth client for you).

If you see `auth/operation-not-allowed` when clicking **Continue with Google**:

1. Open [Firebase Authentication → Sign-in method](https://console.firebase.google.com/project/_/authentication/providers) for your project.
2. Click **Google** → **Enable**.
3. Choose a support email → **Save**.

If prompted, complete the OAuth consent screen first. No frontend rebuild or `terraform apply` is needed.

---

## Model variants (Gemini vs open-source)

Switch variants with a **single variable** in `terraform.tfvars`:

| Setting | `model_provider = "gemini"` | `model_provider = "opensource"` |
|---------|----------------------------|--------------------------------|
| AI backend | Google Gemini API | Self-hosted Cloud Run inference |
| `gemini_api_key` | **Required** | Not used |
| Inference Cloud Run | Not deployed | Deployed (internal VPC) |
| Bot env | `GEMINI_API_KEY` from Secret Manager | `INFERENCE_SERVICE_URL` |
| Cost profile | Pay-per-use Gemini API | Cloud Run compute only |

### Gemini variant (default)

```hcl
model_provider = "gemini"
gemini_api_key = "AIza..."
```

### Open-source variant

```hcl
model_provider = "opensource"
# gemini_api_key can be omitted
```

The inference service ships with a lightweight FastAPI stub in `services/model-inference/`. Replace it with your Qwen/Ollama container when ready — Terraform wiring stays the same.

> **Note:** The opensource variant rebuilds the frontend **after** the inference URL exists, so the first `terraform apply` may take a few extra minutes.

---

## What Terraform automates

You do **not** need to manually:

| Task | How Terraform handles it |
|------|--------------------------|
| Firebase project setup | `modules/project` |
| Firebase web app + API key | `modules/project` + `modules/auth` |
| Firestore database | `modules/database` |
| Firestore security rules | `modules/firestore_rules` |
| Firebase Auth (email/password) | `modules/auth` |
| Firebase Auth authorized domains | `modules/auth_config` |
| Secret Manager secrets | `modules/secrets` (JWT auto-generated) |
| Cloud Run env vars | `modules/services` wires secrets + URLs |
| Container image builds | `modules/build` via Cloud Build |
| IAM for service accounts | `modules/services` |
| Frontend Firebase config | Baked into Docker build via substitutions |
| Bot `APP_URL` | Auto-set to deployed frontend URL |
| Local env reference files | `local_file` resources |

### One manual step after deploy

| Task | How to do it |
|------|----------------|
| Google Sign-In | Enable in [Firebase Console → Authentication → Google](https://console.firebase.google.com/project/_/authentication/providers) (see [Google Sign-In setup](#google-sign-in-setup)) |

### Secrets stored in Secret Manager

| Secret ID | Source |
|-----------|--------|
| `telegram-bot-token` | `terraform.tfvars` |
| `gemini-api-key` | `terraform.tfvars` (gemini only) |
| `jwt-secret` | Auto-generated random password (reserved for future use) |

---

## Teammate onboarding (minimal steps)

Each teammate needs **~10 minutes** and their **own GCP project**:

1. Install `gcloud` + `terraform` (see [Prerequisites](#prerequisites-macos))
2. Create GCP project + enable billing
3. `gcloud auth login && gcloud auth application-default login`
4. `cp terraform.tfvars.example terraform.tfvars` and fill in 2–3 values
5. `terraform init && terraform apply`
6. Enable Google Sign-In in Firebase Console (one click — see [Google Sign-In setup](#google-sign-in-setup))

No shared secrets file, no copying API keys into Cloud Run by hand.

---

## Outputs and generated env files

After apply:

```bash
terraform output                    # all outputs
terraform output frontend_url       # website URL
terraform output firebase_config    # Firebase SDK config
terraform output deployment_summary # quick reference
```

Auto-generated files (safe to gitignore):

| File | Purpose |
|------|---------|
| `apps/persona_probe/.env.production.generated` | Frontend env reference |
| `apps/telegram-bot/.env.production.generated` | Bot env reference (secrets in Secret Manager when deployed) |
| `services/backend/.env.production.generated` | Backend env reference |

For **local development**, copy values into `.env.local` files manually. Production uses Secret Manager.

---

## Switching model variant later

1. Edit `terraform.tfvars`:
   ```hcl
   model_provider = "opensource"   # or "gemini"
   ```
2. Re-run:
   ```bash
   terraform apply
   ```
3. Terraform will create/destroy the inference service and update Cloud Run env vars automatically.
4. Cloud Build rebuilds affected images when source hashes change.

---

## Troubleshooting

### `Error 403: API not enabled`

Wait 2–3 minutes after first apply for API propagation, then re-run `terraform apply`.

### Cloud Build fails with permission error

Ensure you ran `gcloud auth application-default login` and your account has **Editor** on the project.

### Bot not responding on Telegram

- Confirm `bot_min_instances = 1` (keeps webhook handler warm)
- If bot health page works but Telegram is silent, re-register the webhook — see [LOCAL_DEVELOPMENT.md](../docs/LOCAL_DEVELOPMENT.md#switching-back-to-cloud-bot)
- Check logs:
  ```bash
  gcloud run services logs read run-bot-hirelens-dev --region=europe-west1 --limit=50
  ```
- Verify the Telegram token in Secret Manager:
  ```bash
  gcloud secrets versions access latest --secret=telegram-bot-token
  ```

### `gemini_api_key is required when model_provider is "gemini"`

Set `gemini_api_key` in `terraform.tfvars` or switch to `model_provider = "opensource"`.

### Frontend shows Firebase auth errors

Re-run apply to rebuild the frontend with fresh Firebase config:
```bash
terraform apply -replace='module.build.null_resource.build_frontend[0]'
```

### `auth/operation-not-allowed` on Google Sign-In

Google Sign-In is not enabled yet. Enable it in [Firebase Console → Authentication → Google](https://console.firebase.google.com/project/_/authentication/providers). See [Google Sign-In setup](#google-sign-in-setup).

### `auth/unauthorized-domain`

The Cloud Run frontend URL must be listed in Firebase authorized domains. Re-run `terraform apply` — the `auth_config` module adds it automatically after services deploy.

### Skip image builds (use placeholders for infra-only testing)

```hcl
build_images = false
```

Then provide pre-built image URIs or accept the default hello-world placeholders.

### Destroy everything

```bash
terraform destroy
```

---

## Module reference

```
terraform_new/
├── main.tf                 # Root orchestration
├── variables.tf            # All input variables (incl. model_provider)
├── locals.tf               # Naming, image URIs, variant flags
├── outputs.tf
├── providers.tf
├── versions.tf
├── terraform.tfvars.example
├── cloudbuild/             # Cloud Build configs per service
├── templates/              # Env file templates
└── modules/
    ├── project/            # GCP APIs, Firebase, Hosting site
    ├── secrets/            # Secret Manager
    ├── artifact_registry/  # Docker repository
    ├── database/           # Firestore
    ├── auth/               # Firebase Auth (email/password)
    ├── firestore_rules/    # Security rules deployment
    ├── networking/         # VPC, NAT, Serverless VPC connector
    ├── storage/            # GCS bucket
    ├── pubsub/             # Analysis job topic
    ├── build/              # Cloud Build (initial)
    ├── build_post/         # Frontend rebuild after inference URL exists
    └── services/           # Cloud Run (bot, website, backend, inference)
```

---

## Quick command cheat sheet

```bash
# Full deploy
cd terraform_new && terraform init && terraform apply

# Switch to open-source model
# (edit model_provider in terraform.tfvars first)
terraform apply

# View deployed URLs
terraform output deployment_summary

# Tail bot logs
gcloud run services logs tail run-bot-hirelens-dev --region=europe-west1

# Destroy stack
terraform destroy
```

---

## Support

- **Step-by-step deploy:** [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)
- **Issues & fixes log:** [`TERRAFORM_ISSUES_AND_FIXES.md`](./TERRAFORM_ISSUES_AND_FIXES.md)
- Stack overview: [`README.md`](./README.md)
- Repository layout: [`../docs/repo-structure.md`](../docs/repo-structure.md)
- Telegram bot: [`../apps/telegram-bot/README.md`](../apps/telegram-bot/README.md)
