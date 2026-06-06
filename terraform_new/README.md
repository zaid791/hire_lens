# Hire Lens Terraform (GCP + Firebase)

Deploy the full Hire Lens stack — **Telegram bot**, **PersonaProbe website**, **backend**, and optional **inference service** — on Google Cloud Platform with Firebase.

**→ Start here: [README_TEAM.md](./README_TEAM.md)** — complete step-by-step guide for macOS setup, authentication, deployment, and model variant switching.

## Quick start

```bash
cd terraform_new
cp terraform.tfvars.example terraform.tfvars   # edit project_id, telegram_bot_token, model_provider
gcloud auth login && gcloud auth application-default login
terraform init && terraform apply
terraform output deployment_summary
```

## Model variants

Set `model_provider` in `terraform.tfvars`:

| Value | Description |
|-------|-------------|
| `gemini` | Uses Google Gemini API (requires `gemini_api_key`) |
| `opensource` | Deploys internal Cloud Run inference service |

## What gets provisioned

- Firebase (Auth, Firestore, Hosting site, web app)
- Cloud Run: website, bot, backend, inference (opensource only)
- Secret Manager for all secrets and keys
- Pub/Sub, Cloud Function, GCS, VPC, Artifact Registry
- Cloud Build image pipeline (when `build_images = true`)
