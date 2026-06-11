variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_connector_id" {
  type = string
}

variable "pubsub_topic_name" {
  type = string
}

variable "pubsub_subscription_name" {
  type = string
}

variable "storage_bucket_name" {
  type = string
}

variable "backend_service_name" {
  type = string
}

variable "inference_service_name" {
  type = string
}

variable "bot_service_name" {
  type = string
}

variable "frontend_service_name" {
  type = string
}

variable "background_function_name" {
  type = string
}

variable "bot_sa_id" {
  type = string
}

variable "run_sa_id" {
  type = string
}

variable "backend_image" {
  type = string
}

variable "inference_image" {
  type = string
}

variable "bot_image" {
  type = string
}

variable "frontend_image" {
  type = string
}

variable "labels" {
  type = map(string)
}

variable "model_provider" {
  type = string
}

variable "deploy_inference" {
  type = bool
}

variable "bot_min_instances" {
  type    = number
  default = 1
}

variable "telegram_bot_token_secret_id" {
  type = string
}

variable "gemini_api_key_secret_id" {
  type = string
}

variable "frontend_deploy_stamp" {
  description = "Changes when the frontend image is rebuilt, forcing a new Cloud Run revision."
  type        = string
  default     = ""
}

variable "bot_deploy_stamp" {
  description = "Changes when the bot image is rebuilt, forcing a new Cloud Run revision."
  type        = string
  default     = ""
}
