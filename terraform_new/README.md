# Hire Lens — Infrastructure (GCP + Firebase)

Terraform stack that provisions and deploys the full **Hire Lens** cloud system:

- PersonaProbe website (Cloud Run)
- Telegram bot (Cloud Run, webhook mode)
- FastAPI backend (Cloud Run)
- Firebase Auth + Firestore + security rules
- Secret Manager, Artifact Registry, Cloud Build
- GCS, Pub/Sub, Cloud Function, VPC (supporting services)
- Optional inference service (`model_provider = "opensource"`)

**Reference project:** `hire-lens-pw` · **Region:** `europe-west1`

---

## Documentation

| Guide | Use when |
|-------|----------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | **Start here** — step-by-step deploy checklist |
| [README_TEAM.md](./README_TEAM.md) | Extended team guide with architecture and troubleshooting |
| [TERRAFORM_ISSUES_AND_FIXES.md](./TERRAFORM_ISSUES_AND_FIXES.md) | Log of deployment issues and solutions |

---

## Quick start

```bash
cd terraform_new
cp terraform.tfvars.example terraform.tfvars   # edit project_id, secrets

gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

terraform init
terraform plan
terraform apply

terraform output deployment_summary
```

First apply takes **15–30 minutes** (Cloud Build compiles three container images).

---

## Required variables (`terraform.tfvars`)

```hcl
project_id            = "your-gcp-project-id"
telegram_bot_token    = "from @BotFather"
telegram_bot_username = "your_bot_username"
model_provider        = "gemini"
gemini_api_key        = "from Google AI Studio"
build_images          = true
repo_root             = ".."
```

Never commit `terraform.tfvars`.

---

## Model variants

| `model_provider` | Behaviour |
|------------------|-----------|
| `gemini` | Bot + website call Gemini API (key in Secret Manager) |
| `opensource` | Deploys internal Cloud Run inference service |

---

## What gets provisioned

| Resource | Purpose |
|----------|---------|
| Cloud Run × 3–4 | Frontend, bot, backend, (+ inference) |
| Firebase | Auth, Firestore, web app config |
| Secret Manager | Telegram token, Gemini key |
| Artifact Registry + Cloud Build | Container images |
| Firestore rules | User data + admin access control |
| IAM | Service accounts, public bot invoke, bot `run.viewer` |

---

## Targeted redeploys

```bash
# Frontend only
terraform apply \
  -replace='module.build.null_resource.build_frontend[0]' \
  -target=module.build.null_resource.build_frontend \
  -target=module.services.google_cloud_run_v2_service.frontend

# Bot only
terraform apply \
  -replace='module.build.null_resource.build_bot[0]' \
  -target=module.build.null_resource.build_bot \
  -target=module.services.google_cloud_run_v2_service.bot

# Firestore rules only
terraform apply -target=module.firestore_rules
```

---

## Outputs

```bash
terraform output deployment_summary   # all live URLs
terraform output -raw frontend_url
terraform output -raw bot_service_url
terraform output -raw backend_service_url
```

Generated env reference files (after apply):

- `apps/persona_probe/.env.production.generated`
- `apps/telegram-bot/.env.production.generated`
- `services/backend/.env.production.generated`

---

## Teardown

```bash
terraform destroy
```

---

## Related

- [Root README](../README.md)
- [Local development](../docs/LOCAL_DEVELOPMENT.md)
