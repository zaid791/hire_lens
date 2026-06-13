locals {
  frontend_substitutions = join(",", [
    "_IMAGE=${var.frontend_image}",
    "_VITE_FIREBASE_API_KEY=${var.firebase_api_key}",
    "_VITE_FIREBASE_AUTH_DOMAIN=${var.firebase_auth_domain}",
    "_VITE_FIREBASE_PROJECT_ID=${var.project_id}",
    "_VITE_FIREBASE_STORAGE_BUCKET=${var.firebase_storage_bucket}",
    "_VITE_FIREBASE_MESSAGING_SENDER_ID=${var.firebase_messaging_sender_id}",
    "_VITE_FIREBASE_APP_ID=${var.firebase_app_id}",
    "_VITE_GEMINI_API_KEY=${var.gemini_api_key}",
    "_VITE_MODEL_PROVIDER=${var.model_provider}",
    "_VITE_INFERENCE_URL=${var.inference_url}",
    "_VITE_TELEGRAM_BOT_USERNAME=${var.telegram_bot_username}",
  ])
}
