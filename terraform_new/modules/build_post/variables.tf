variable "project_id" { type = string }
variable "region" { type = string }
variable "repo_root" { type = string }
variable "build_images" { type = bool }
variable "deploy_inference" { type = bool }
variable "frontend_image" { type = string }
variable "frontend_service_name" { type = string }
variable "inference_url" { type = string }
variable "model_provider" { type = string }
variable "firebase_api_key" { type = string }
variable "firebase_auth_domain" { type = string }
variable "firebase_storage_bucket" { type = string }
variable "firebase_messaging_sender_id" { type = string }
variable "firebase_app_id" { type = string }
variable "gemini_api_key" {
  type      = string
  sensitive = true
}
