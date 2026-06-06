output "secret_ids" {
  description = "Map of logical secret name to Secret Manager secret ID."
  value = {
    telegram-bot-token = google_secret_manager_secret.telegram_bot_token.secret_id
    gemini-api-key     = google_secret_manager_secret.gemini_api_key.secret_id
    jwt-secret         = google_secret_manager_secret.jwt_secret.secret_id
  }
}

output "jwt_secret_id" {
  value = google_secret_manager_secret.jwt_secret.secret_id
}

output "telegram_bot_token_secret_id" {
  value = google_secret_manager_secret.telegram_bot_token.secret_id
}

output "gemini_api_key_secret_id" {
  value = google_secret_manager_secret.gemini_api_key.secret_id
}
