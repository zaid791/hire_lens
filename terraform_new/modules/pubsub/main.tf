terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

# Create Pub/Sub Topic
resource "google_pubsub_topic" "topic" {
  project = var.project_id
  name    = var.topic_name
}

# Create Pub/Sub Subscription for workers
resource "google_pubsub_subscription" "subscription" {
  project                    = var.project_id
  name                       = var.sub_name
  topic                      = google_pubsub_topic.topic.name
  ack_deadline_seconds       = 60
  message_retention_duration = "604800s" # 7 days
}
