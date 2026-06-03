variable "project_id" {
  description = "The GCP project ID where resources will be created."
  type        = string
}

variable "project_name" {
  description = "Short project name used as a naming prefix."
  type        = string
  default     = "hirelens"
}

variable "environment" {
  description = "Deployment environment name (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "region" {
  description = "The GCP region for regional resources."
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "The GCP zone for zonal resources."
  type        = string
  default     = "europe-west1-b"
}

variable "labels" {
  description = "Labels to apply to resources."
  type        = map(string)
  default     = {}
}

variable "firestore_location" {
  description = "Location ID for the Firestore database (e.g., nam5, eur3)."
  type        = string
  default     = "eur3"
}

variable "backend_image" {
  description = "Container image URI for the FastAPI backend service."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
}

variable "inference_image" {
  description = "Container image URI for the model inference service."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
}

variable "github_client_id" {
  description = "Client ID for the GitHub OAuth app in Firebase Authentication."
  type        = string
  default     = ""
}

variable "github_client_secret" {
  description = "Client Secret for the GitHub OAuth app in Firebase Authentication."
  type        = string
  default     = ""
  sensitive   = true
}
