# Terraform — Issues, Problems, and Fixes

This document records the problems encountered while building and deploying the Hire Lens Terraform stack (`terraform_new/`), and what was changed to reach the final working version on project **`hire-lens-pw`**.

For deployment steps, see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

## Summary

| Area | Initial problem | Final solution |
|------|-----------------|----------------|
| Provider auth | ADC quota 403 errors | `billing_project` + `user_project_override` on providers |
| Firebase Auth init | Identity Platform 404 | 90s wait after Firebase enable + `google_identity_platform_config` |
| Firestore rules | 400 invalid language | Use `FIREBASE_RULES` (not `FIRESTORE_RULES`) |
| Cloud Build | No gcloud account in build step | Pass `CLOUDSDK_AUTH_ACCESS_TOKEN` from ADC |
| Google sign-in (domain) | `auth/unauthorized-domain` | `auth_config` module adds Cloud Run URL after deploy |
| Google sign-in (provider) | `auth/operation-not-allowed` | Manual enable in Firebase Console (not Terraform) |
| Telegram bot | Not responding on Cloud Run | Webhook mode instead of long-polling |
| Storage bucket config | Wrong Firebase storage bucket name | Use `{project_id}.firebasestorage.app` |
| Auth module layout | Config applied before frontend URL existed | Split into `auth` + `auth_config` modules |
| GitHub OAuth | Legacy auth code / secrets in repo | Removed; Firebase Auth only (email + Google) |

---

## 1. Application Default Credentials quota errors (403)

### Problem
During `terraform apply`, Identity Platform and other API calls failed with:

```text
Error 403: Caller does not have the right permission for quota project ...
```

Terraform was using Application Default Credentials (ADC) without billing the correct GCP project for API quota.

### Fix
Updated `providers.tf`:

```hcl
provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

provider "google-beta" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}
```

---

## 2. Identity Platform not ready (CONFIGURATION_NOT_FOUND)

### Problem
Creating Firebase Auth resources failed with:

```text
Error 404: CONFIGURATION_NOT_FOUND
```

Identity Platform needs time to initialize after Firebase is first enabled on a GCP project.

### Fix
1. Added a **90-second wait** in `modules/project/main.tf` after `google_firebase_project`:

```hcl
resource "time_sleep" "wait_for_identity_platform" {
  depends_on      = [google_firebase_project.default]
  create_duration = "90s"
}
```

2. Switched auth setup to `google_identity_platform_config` (instead of deprecated patterns).
3. Web app creation now depends on the wait completing.

---

## 3. Invalid `count` on Firebase web app config data source

### Problem
Terraform validation failed when using `count` on `google_firebase_web_app_config`.

### Fix
Removed conditional `count` from the data source in `modules/auth/main.tf`. The data source always reads the web app config once `web_app_id` is known.

---

## 4. Firestore security rules deployment failed (400)

### Problem
Deploying Firestore rules failed with a 400 error about invalid rules language.

### Fix
In `modules/firestore_rules/main.tf`, set the correct language identifier:

```hcl
source {
  language = "FIREBASE_RULES"  # not "FIRESTORE_RULES"
  ...
}
```

---

## 5. Cloud Build failed — no gcloud account

### Problem
Cloud Build steps invoked via Terraform `local-exec` failed because `gcloud` had no active account in the build context.

### Fix
In `modules/build/main.tf`, export ADC token before each `gcloud builds submit`:

```bash
export CLOUDSDK_AUTH_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"
```

This lets Cloud Build run using the same credentials as Terraform, without requiring a separate `gcloud auth login` session inside the build.

---

## 6. Firebase Auth unauthorized domain on Cloud Run

### Problem
After deploy, Google sign-in/sign-up on the live website showed:

```text
Firebase: Error (auth/unauthorized-domain)
```

The Cloud Run frontend URL was not in Firebase's authorized domains list.

### Fix
Created **`modules/auth_config`** that runs **after** Cloud Run services deploy. It configures `google_identity_platform_config` with:

- `{project_id}.firebaseapp.com`
- `{project_id}.web.app`
- `localhost`
- The live Cloud Run frontend hostname (derived from `module.services.frontend_url`)

Moved the identity platform config resource from `modules/auth` to `modules/auth_config` and added a `moved.tf` block for state migration.

---

## 7. Google Sign-In — `auth/operation-not-allowed`

### Problem
Email login worked, but **Continue with Google** failed with:

```text
Firebase: Error (auth/operation-not-allowed)
```

Terraform only enabled email/password in Identity Platform. The Google identity provider was never configured.

### What we tried
- Adding `google_identity_platform_default_supported_idp_config` for `google.com` in Terraform — requires OAuth `client_id` and `client_secret`, which Google does not provide an API to auto-create for standard Web clients.
- Briefly added Terraform automation for OAuth consent screen + IDP config (Option B).

### Final decision
**Google Sign-In is enabled manually** in Firebase Console (Option A):

1. Firebase Console → Authentication → Sign-in method → Google → Enable
2. Firebase auto-creates the OAuth Web client

Terraform OAuth automation was **removed** to keep the stack simple. This is documented as a one-time manual step per GCP project in `DEPLOYMENT_GUIDE.md`.

---

## 8. Telegram bot not responding

### Problem
The bot deployed to Cloud Run but did not reply to Telegram messages.

Long-polling does not work reliably on Cloud Run because:
- Instances scale to zero or restart
- Telegram's polling connection drops when containers recycle
- Startup timeouts occurred waiting for the polling loop

### Fix
Updated `apps/telegram-bot/src/bot.ts` to use **webhook mode** when running on Cloud Run (`K_SERVICE` env var is set):

1. Bot starts a small HTTP server on port 8080
2. Resolves its public Cloud Run URL via the Cloud Run API
3. Registers Telegram webhook at `/telegram/webhook`
4. Processes updates via `bot.handleUpdate()`

Added IAM in Terraform:

```hcl
resource "google_project_iam_member" "bot_run_viewer" {
  role   = "roles/run.viewer"
  member = "serviceAccount:${google_service_account.bot_sa.email}"
}
```

This lets the bot service account read its own Cloud Run service URL.

Cloud Run IAM also allows public invoke on the bot service so Telegram can POST webhook updates.

---

## 9. Wrong Firebase storage bucket in build config

### Problem
Frontend build used an incorrect storage bucket name, causing Firebase SDK misconfiguration.

### Fix
In `locals.tf`, set the Firebase Storage bucket to the standard Firebase format:

```hcl
firebase_storage_bucket = "${var.project_id}.firebasestorage.app"
```

This is separate from the application data GCS bucket created in `modules/storage`.

---

## 10. Removed legacy GitHub OAuth

### Problem
Old GitHub OAuth login code and secrets were still present in the repo from before Firebase Auth migration.

### Fix
- Removed GitHub OAuth from frontend (`AuthModal.tsx`) and backend
- Removed GitHub-related Terraform wiring
- Cleaned secrets from `.env` / `.env.local` files
- Auth is now: **email/password** (Terraform) + **Google** (Firebase Console)

---

## 11. Auth module split (`auth` vs `auth_config`)

### Problem
Identity Platform config (especially authorized domains) needed the **live frontend URL**, which only exists after Cloud Run deploys. Applying auth config too early meant the Cloud Run domain was missing.

### Fix
| Module | Responsibility | When it runs |
|--------|----------------|--------------|
| `modules/auth` | Reads Firebase web app config (API key) | Before build |
| `modules/auth_config` | Identity Platform config + authorized domains | After `module.services` |

State migration handled via `moved.tf`:

```hcl
moved {
  from = module.auth.google_identity_platform_config.default
  to   = module.auth_config.google_identity_platform_config.default
}
```

---

## 12. Known harmless Terraform drift (post-deploy)

After the working deploy, `terraform plan` may still show changes on **non-user-facing** resources:

| Resource | Why |
|----------|-----|
| Firestore rules ruleset | Provider adds `language = "FIREBASE_RULES"` metadata |
| VPC access connector | Deployed throughput (1000) vs provider default (300) |
| Cloud Function zip | Dummy handler archive hash changes |

**Important:** Frontend, backend, and bot Cloud Run services show **no changes** in plan — the live website stack matches Terraform.

Do not run `terraform apply` just to clear this drift unless you intentionally want to reconcile background resources.

---

## 13. Runtime verification (final working state)

Verified on `hire-lens-pw`:

| Check | Result |
|-------|--------|
| Frontend HTTP 200 | Pass |
| Backend `/health` | Pass (`model_provider: gemini`) |
| Bot webhook mode | Pass |
| Email auth | Pass |
| Google auth | Pass (after Firebase Console enable) |
| Authorized domains include Cloud Run URL | Pass |
| `terraform plan` — no changes to Cloud Run services | Pass |

**Live URLs (reference):**

- Website: `https://run-frontend-hirelens-dev-nkzpdyy63a-ew.a.run.app`
- Backend: `https://run-backend-hirelens-dev-nkzpdyy63a-ew.a.run.app`
- Bot: `https://run-bot-hirelens-dev-nkzpdyy63a-ew.a.run.app`

---

## File changes reference

Key files touched during troubleshooting:

```
terraform_new/
├── providers.tf              # billing_project fix
├── moved.tf                  # auth → auth_config state migration
├── locals.tf                 # firebase_storage_bucket fix
├── main.tf                   # auth_config wired after services
├── modules/
│   ├── project/main.tf       # time_sleep for Identity Platform
│   ├── auth/main.tf          # simplified to web app config data source
│   ├── auth_config/main.tf   # authorized domains + email auth
│   ├── firestore_rules/      # FIREBASE_RULES language
│   ├── build/main.tf         # ADC token for Cloud Build
│   └── services/main.tf      # bot IAM (run.viewer)
apps/
├── telegram-bot/src/bot.ts   # webhook mode for Cloud Run
└── persona_probe/src/components/AuthModal.tsx  # Firebase Auth only
```

---

## Lessons learned

1. **Firebase Auth on Cloud Run** requires the Cloud Run hostname in authorized domains — configure auth **after** services deploy.
2. **Google Sign-In cannot be fully automated in Terraform** without manually creating OAuth Web client credentials. Firebase Console enable is the simplest path.
3. **Telegram bots on Cloud Run** should use webhooks, not long-polling.
4. **Always set `billing_project`** when using ADC with Terraform against a specific GCP project.
5. **Identity Platform needs a propagation delay** after first Firebase enable — use `time_sleep` or retry logic.
