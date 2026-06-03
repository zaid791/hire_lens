terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"
  
  # Protect database from accidental deletion in production environments
  delete_protection_state = "DELETE_PROTECTION_DISABLED" # Change to DELETE_PROTECTION_ENABLED for production
}
