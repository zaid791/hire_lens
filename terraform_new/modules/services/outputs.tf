output "backend_url" {
  description = "The URL of the FastAPI backend Cloud Run service."
  value       = google_cloud_run_v2_service.backend.uri
}

output "inference_url" {
  description = "The URL of the model inference Cloud Run service."
  value       = google_cloud_run_v2_service.inference.uri
}

output "bot_service_account_email" {
  description = "The email of the service account allocated to the Telegram Bot."
  value       = google_service_account.bot_sa.email
}
