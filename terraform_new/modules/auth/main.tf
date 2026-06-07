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

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = var.web_app_id
}
