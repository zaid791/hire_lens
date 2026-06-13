variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "bucket_name" {
  description = "The name of the GCS bucket."
  type        = string
}

variable "region" {
  description = "The GCP region for the storage bucket."
  type        = string
}
