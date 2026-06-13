output "api_key" {
  description = "The browser API key used for Firebase client SDK initialization."
  value       = data.google_firebase_web_app_config.default.api_key
}
