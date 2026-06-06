# ── GCP project ──────────────────────────────────────────────────────────────

variable "project_id" {
  description = "Existing GCP project ID where all resources will be created."
  type        = string
}

variable "project_name" {
  description = "Short name used as a prefix for resource naming."
  type        = string
  default     = "hirelens"
}

variable "environment" {
  description = "Deployment environment label (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "region" {
  description = "Primary GCP region for regional resources."
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "GCP zone for zonal resources."
  type        = string
  default     = "europe-west1-b"
}

variable "labels" {
  description = "Extra labels merged onto all resources."
  type        = map(string)
  default     = {}
}

variable "firestore_location" {
  description = "Firestore multi-region location (e.g. eur3, nam5)."
  type        = string
  default     = "eur3"
}

# ── Model provider variant ───────────────────────────────────────────────────

variable "model_provider" {
  description = <<-EOT
    AI backend to deploy:
      gemini      – uses Google Gemini API (requires gemini_api_key)
      opensource  – deploys internal Cloud Run inference service (no Gemini key needed)
  EOT
  type        = string
  default     = "gemini"

  validation {
    condition     = contains(["gemini", "opensource"], var.model_provider)
    error_message = "model_provider must be \"gemini\" or \"opensource\"."
  }
}

# ── Secrets (stored in Secret Manager automatically) ─────────────────────────

variable "telegram_bot_token" {
  description = "Telegram Bot API token from @BotFather. Stored in Secret Manager."
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API key. Required when model_provider = \"gemini\". Stored in Secret Manager."
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.model_provider != "gemini" || var.gemini_api_key != ""
    error_message = "gemini_api_key is required when model_provider is \"gemini\"."
  }
}

# ── Container images ─────────────────────────────────────────────────────────

variable "repo_root" {
  description = "Absolute or relative path to the monorepo root (used by Cloud Build)."
  type        = string
  default     = ".."
}

variable "build_images" {
  description = "When true, runs Cloud Build to build and push container images during apply."
  type        = bool
  default     = true
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository ID for container images."
  type        = string
  default     = "hire-lens"
}

variable "backend_image" {
  description = "Backend container image URI. Ignored when build_images = true."
  type        = string
  default     = ""
}

variable "inference_image" {
  description = "Inference container image URI. Ignored when build_images = true."
  type        = string
  default     = ""
}

variable "bot_image" {
  description = "Telegram bot container image URI. Ignored when build_images = true."
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Frontend container image URI. Ignored when build_images = true."
  type        = string
  default     = ""
}

# ── Deployment tuning ────────────────────────────────────────────────────────

variable "bot_min_instances" {
  description = "Minimum Cloud Run instances for the Telegram bot (keep >= 1 for long-polling)."
  type        = number
  default     = 1
}

variable "generate_local_env_files" {
  description = "Write .env files into the repo for local development reference."
  type        = bool
  default     = true
}

variable "firestore_rules_file" {
  description = "Path to firestore.rules relative to repo_root."
  type        = string
  default     = "firestore.rules"
}
