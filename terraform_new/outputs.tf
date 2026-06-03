output "project_id" {
  description = "The GCP Project ID."
  value       = var.project_id
}

output "firebase_config" {
  description = "Firebase Web App configuration parameters required for SDK initialization."
  value = {
    apiKey            = module.auth.api_key
    authDomain        = module.project.auth_domain
    projectId         = var.project_id
    storageBucket     = module.storage.bucket_name
    messagingSenderId = module.project.project_number
    appId             = module.project.web_app_id
  }
}

output "storage_bucket_name" {
  description = "The name of the GCS bucket for data storage."
  value       = module.storage.bucket_name
}

output "backend_service_url" {
  description = "The URL of the FastAPI backend Cloud Run service."
  value       = module.services.backend_url
}

output "inference_service_url" {
  description = "The URL of the model inference Cloud Run service."
  value       = module.services.inference_url
}

output "pubsub_topic_name" {
  description = "The name of the Pub/Sub topic for analysis jobs."
  value       = module.pubsub.topic_name
}

output "bot_service_account_email" {
  description = "Service account email for the Telegram Bot integrations."
  value       = module.services.bot_service_account_email
}
