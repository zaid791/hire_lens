terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6"
    }
  }
}

resource "random_password" "jwt_secret" {
  length  = 48
  special = true
}

resource "google_secret_manager_secret" "telegram_bot_token" {
  project   = var.project_id
  secret_id = "telegram-bot-token"
  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret" "gemini_api_key" {
  project   = var.project_id
  secret_id = "gemini-api-key"
  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret" "jwt_secret" {
  project   = var.project_id
  secret_id = "jwt-secret"
  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret_version" "telegram_bot_token" {
  secret      = google_secret_manager_secret.telegram_bot_token.id
  secret_data = var.telegram_bot_token
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  count       = var.gemini_api_key != "" ? 1 : 0
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}
