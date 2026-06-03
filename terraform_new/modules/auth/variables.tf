variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "web_app_id" {
  description = "The Firebase Web App ID."
  type        = string
  default     = ""
}

variable "github_client_id" {
  description = "Client ID for the GitHub OAuth app."
  type        = string
  default     = ""
}

variable "github_client_secret" {
  description = "Client Secret for the GitHub OAuth app."
  type        = string
  default     = ""
  sensitive   = true
}
