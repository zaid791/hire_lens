# Backend Service

FastAPI service deployed to **Google Cloud Run** as part of the Hire Lens stack.

---

## Purpose

- Health endpoint for deployment verification and monitoring
- Foundation for future API endpoints (report storage, Pub/Sub job orchestration)
- CORS configuration for the PersonaProbe frontend

Most user-facing logic (auth, quotas, analysis) currently runs in the **web app** and **Telegram bot** with direct Firestore access.

---

## Tech stack

- Python 3.12+
- FastAPI
- Uvicorn

---

## API

| Endpoint | Method | Response |
|----------|--------|----------|
| `/health` | GET | `{ "status": "ok", "model_provider": "...", "inference_configured": bool }` |

---

## Local development

```bash
cp .env.example .env
pip install -r requirements.txt
uvicorn backend:app --reload --port 8080
```

Verify:

```bash
curl http://localhost:8080/health
```

Or use the setup script from the repo root:

```bash
./scripts/setup-local-from-cloud.sh
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `APP_URL` | Frontend origin for CORS |
| `MODEL_PROVIDER` | `gemini` or `opensource` |
| `INFERENCE_SERVICE_URL` | Internal inference URL (opensource variant) |

---

## Deployment

Provisioned and deployed automatically by `terraform_new/`. Image built via Cloud Build (`terraform_new/cloudbuild/backend.yaml`).

```bash
cd terraform_new
terraform output -raw backend_service_url
curl "$(terraform output -raw backend_service_url)/health"
```

---

## Boundaries

- Infrastructure: `terraform_new/`
- UI: `apps/persona_probe/`
- Shared contracts (future): `packages/shared/`

---

## Related

- [Root README](../../README.md)
- [Local development](../../docs/LOCAL_DEVELOPMENT.md)
