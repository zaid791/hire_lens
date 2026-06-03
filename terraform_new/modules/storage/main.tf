terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

resource "google_storage_bucket" "bucket" {
  project                     = var.project_id
  name                        = var.bucket_name
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true

  # Block public access
  public_access_prevention = "enforced"

  # Optional lifecycle rule (e.g. migrate objects to coldline after 90 days)
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}
