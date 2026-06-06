output "project_id" {
  description = "GCP project ID."
  value       = var.project_id
}

output "model_provider" {
  description = "Active AI model variant (gemini or opensource)."
  value       = var.model_provider
}

output "firebase_config" {
  description = "Firebase Web SDK configuration for the frontend."
  value = {
    apiKey            = module.auth.api_key
    authDomain        = module.project.auth_domain
    projectId         = var.project_id
    storageBucket     = module.storage.bucket_name
    messagingSenderId = module.project.project_number
    appId             = module.project.web_app_id
  }
}

output "frontend_url" {
  description = "Deployed PersonaProbe website URL (set as APP_URL everywhere)."
  value       = module.services.frontend_url
}

output "backend_service_url" {
  description = "FastAPI backend Cloud Run URL."
  value       = module.services.backend_url
}

output "inference_service_url" {
  description = "Internal inference service URL (empty when model_provider = gemini)."
  value       = module.services.inference_url
}

output "bot_service_url" {
  description = "Telegram bot Cloud Run health-check URL."
  value       = module.services.bot_url
}

output "storage_bucket_name" {
  description = "GCS bucket for application data."
  value       = module.storage.bucket_name
}

output "pubsub_topic_name" {
  description = "Pub/Sub topic for analysis jobs."
  value       = module.pubsub.topic_name
}

output "bot_service_account_email" {
  description = "Telegram bot service account email."
  value       = module.services.bot_service_account_email
}

output "artifact_registry_url" {
  description = "Artifact Registry repository URL for container images."
  value       = module.artifact_registry.repository_url
}

output "secret_ids" {
  description = "Secret Manager secret IDs (values are never exported)."
  value       = module.secrets.secret_ids
}

output "firebase_hosting_site" {
  description = "Firebase Hosting site ID (for custom domain setup)."
  value       = module.project.hosting_site_id
}

output "deployment_summary" {
  description = "Quick reference after apply."
  value = {
    website       = module.services.frontend_url
    backend       = module.services.backend_url
    bot           = module.services.bot_url
    inference     = local.deploy_inference ? module.services.inference_url : "not deployed (gemini variant)"
    model_variant = var.model_provider
    firebase_auth = module.project.auth_domain
  }
}
