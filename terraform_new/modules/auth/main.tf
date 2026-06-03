terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0"
    }
  }
}

# Configure default project settings for Identity Platform (Firebase Auth)
resource "google_identity_platform_project_default_config" "default" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }

    anonymous {
      enabled = false
    }
  }
}

# Configure GitHub OAuth sign-in if credentials are provided
resource "google_identity_platform_default_supported_idp_config" "github" {
  count    = var.github_client_id != "" ? 1 : 0
  provider = google-beta
  project  = var.project_id

  idp_id        = "github.com"
  client_id     = var.github_client_id
  client_secret = var.github_client_secret
  enabled       = true

  depends_on = [google_identity_platform_project_default_config.default]
}

# Fetch the active API key for Firebase Client configs using the Web App ID
data "google_firebase_web_app_config" "default" {
  count      = var.web_app_id != "" ? 1 : 0
  provider   = google-beta
  project    = var.project_id
  web_app_id = var.web_app_id

  depends_on = [google_identity_platform_project_default_config.default]
}
