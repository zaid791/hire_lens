variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "firestore_location" {
  description = "Location ID for the Firestore database (e.g. nam5, eur3)."
  type        = string
}
