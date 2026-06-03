variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "region" {
  description = "The GCP region for the services."
  type        = string
}

variable "vpc_connector_id" {
  description = "The ID of the Serverless VPC access connector."
  type        = string
}

variable "pubsub_topic_name" {
  description = "The name of the Pub/Sub topic."
  type        = string
}

variable "pubsub_subscription_name" {
  description = "The name of the Pub/Sub subscription."
  type        = string
}

variable "storage_bucket_name" {
  description = "The name of the GCS storage bucket."
  type        = string
}

variable "backend_service_name" {
  description = "The name of the backend Cloud Run service."
  type        = string
}

variable "inference_service_name" {
  description = "The name of the inference Cloud Run service."
  type        = string
}

variable "background_function_name" {
  description = "The name of the background Cloud Function."
  type        = string
}

variable "bot_sa_id" {
  description = "Service account ID prefix for the Telegram Bot."
  type        = string
}

variable "run_sa_id" {
  description = "Service account ID prefix for Cloud Run."
  type        = string
}

variable "backend_image" {
  description = "FastAPI backend container image."
  type        = string
}

variable "inference_image" {
  description = "Inference service container image."
  type        = string
}

variable "labels" {
  description = "Common labels to apply to resources."
  type        = map(string)
}
