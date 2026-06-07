terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0"
    }
  }
}

locals {
  frontend_host = var.frontend_url != "" ? trimprefix(var.frontend_url, "https://") : ""
  authorized_domains = distinct(compact(concat(
    [
      "${var.project_id}.firebaseapp.com",
      "${var.project_id}.web.app",
      "localhost",
    ],
    local.frontend_host != "" ? [local.frontend_host] : [],
    var.additional_authorized_domains,
  )))
}

resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.project_id

  authorized_domains = local.authorized_domains

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
