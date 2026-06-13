# Model Inference Service

Optional **self-hosted inference API** for the Hire Lens `opensource` model variant.

---

## Purpose

When `model_provider = "opensource"` in Terraform, this service is deployed to Cloud Run (internal-only) and called by the Telegram bot and backend instead of the Gemini API.

Keeps model calls inside the GCP project boundary — useful for demonstrating a fully self-contained cloud pipeline without external AI API dependency.

---

## Current status

| Variant | AI backend |
|---------|------------|
| `gemini` (default) | Google Gemini API via Secret Manager key |
| `opensource` | This service on Cloud Run |

Switch variants in `terraform_new/terraform.tfvars` and run `terraform apply`.

---

## Tech stack

- Python
- Docker (Cloud Build image)
- Deployed to Cloud Run inside VPC (internal ingress)

---

## Boundaries

| Do | Don't |
|----|-------|
| Expose a stable inference HTTP API | Add Telegram or frontend code |
| Keep prompts and model loading here | Commit model weights to Git |

---

## Deployment

Enabled automatically when `model_provider = "opensource"` in Terraform. Image built from `services/model-inference/Dockerfile` via Cloud Build.

```bash
cd terraform_new
# terraform.tfvars: model_provider = "opensource"
terraform apply
```

---

## Local development

Typically used via the cloud-deployed instance. For local testing, run the container or app module directly and set `INFERENCE_SERVICE_URL` in the bot/backend `.env` files.

---

## Related

- [Terraform README](../../terraform_new/README.md)
- [Telegram bot README](../../apps/telegram-bot/README.md)
