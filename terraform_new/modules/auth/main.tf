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

data "google_firebase_web_app_config" "default" {
  count      = var.web_app_id != "" ? 1 : 0
  provider   = google-beta
  project    = var.project_id
  web_app_id = var.web_app_id

  depends_on = [google_identity_platform_project_default_config.default]
}
