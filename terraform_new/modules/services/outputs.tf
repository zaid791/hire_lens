output "backend_url" {
  description = "FastAPI backend Cloud Run URL."
  value       = google_cloud_run_v2_service.backend.uri
}

output "inference_url" {
  description = "Model inference Cloud Run URL (empty when using Gemini)."
  value       = local.inference_url
}

output "bot_url" {
  description = "Telegram bot Cloud Run URL (health-check endpoint)."
  value       = google_cloud_run_v2_service.bot.uri
}

output "frontend_url" {
  description = "PersonaProbe website Cloud Run URL."
  value       = google_cloud_run_v2_service.frontend.uri
}

output "bot_service_account_email" {
  description = "Service account email for the Telegram bot."
  value       = google_service_account.bot_sa.email
}

output "run_service_account_email" {
  description = "Service account email for Cloud Run services."
  value       = google_service_account.run_sa.email
}
