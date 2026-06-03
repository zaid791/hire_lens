output "api_key" {
  description = "The browser API key used for Firebase client SDK initialization."
  value       = length(data.google_firebase_web_app_config.default) > 0 ? data.google_firebase_web_app_config.default[0].api_key : ""
}
