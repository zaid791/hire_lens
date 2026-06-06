output "web_app_id" {
  description = "The App ID of the registered Firebase Web App."
  value       = google_firebase_web_app.default.app_id
}

output "project_number" {
  description = "The project number of the GCP project."
  value       = data.google_project.project.number
}

output "auth_domain" {
  description = "The default authentication domain for the Firebase project."
  value       = "${var.project_id}.firebaseapp.com"
}

output "hosting_site_id" {
  description = "Firebase Hosting site ID."
  value       = google_firebase_hosting_site.default.site_id
}
