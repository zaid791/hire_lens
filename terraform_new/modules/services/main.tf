terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

# ── Service accounts ─────────────────────────────────────────────────────────

resource "google_service_account" "bot_sa" {
  project      = var.project_id
  account_id   = var.bot_sa_id
  display_name = "Telegram Bot Service Account"
}

resource "google_service_account" "run_sa" {
  project      = var.project_id
  account_id   = var.run_sa_id
  display_name = "Cloud Run Execution Service Account"
}

# ── IAM: data, pub/sub, run, secrets ─────────────────────────────────────────

resource "google_project_iam_member" "bot_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.bot_sa.email}"
}

resource "google_project_iam_member" "run_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "run_storage" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "bot_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.bot_sa.email}"
}

resource "google_project_iam_member" "run_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "run_pubsub_subscriber" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "run_eventarc_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "bot_telegram_token" {
  project   = var.project_id
  secret_id = var.telegram_bot_token_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.bot_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "bot_gemini_key" {
  count     = var.model_provider == "gemini" ? 1 : 0
  project   = var.project_id
  secret_id = var.gemini_api_key_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.bot_sa.email}"
}

# ── Cloud Function source bucket ─────────────────────────────────────────────

resource "google_storage_bucket" "func_source_bucket" {
  project                     = var.project_id
  name                        = "${var.project_id}-fn-sources"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

data "archive_file" "dummy_func" {
  type        = "zip"
  output_path = "${path.module}/dummy_func.zip"

  source {
    content  = "exports.helloPubSub = (event, context) => { console.log('Pub/Sub event received:', event); };"
    filename = "index.js"
  }
}

resource "google_storage_bucket_object" "func_zip" {
  name   = "fn-job-handler-${data.archive_file.dummy_func.output_md5}.zip"
  bucket = google_storage_bucket.func_source_bucket.name
  source = data.archive_file.dummy_func.output_path
}

# ── Frontend (PersonaProbe website) ──────────────────────────────────────────

resource "google_cloud_run_v2_service" "frontend" {
  project  = var.project_id
  name     = var.frontend_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = var.labels

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.frontend_image
      ports {
        container_port = 80
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── FastAPI backend ──────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "backend" {
  project  = var.project_id
  name     = var.backend_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = var.labels

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.backend_image

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "STORAGE_BUCKET"
        value = var.storage_bucket_name
      }
      env {
        name  = "PUBSUB_TOPIC"
        value = var.pubsub_topic_name
      }
      env {
        name  = "APP_URL"
        value = google_cloud_run_v2_service.frontend.uri
      }
      env {
        name  = "MODEL_PROVIDER"
        value = var.model_provider
      }
      env {
        name  = "INFERENCE_SERVICE_URL"
        value = local.inference_url
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }

  depends_on = [google_cloud_run_v2_service.frontend]
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Model inference (opensource variant only) ────────────────────────────────

resource "google_cloud_run_v2_service" "inference" {
  count    = var.deploy_inference ? 1 : 0
  project  = var.project_id
  name     = var.inference_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  labels   = var.labels

  template {
    service_account = google_service_account.run_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "ALL_TRAFFIC"
    }

    containers {
      image = var.inference_image

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "MODEL_PROVIDER"
        value = var.model_provider
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

resource "google_cloud_run_v2_service_iam_member" "inference_invoker" {
  count    = var.deploy_inference ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.inference[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_cloud_run_v2_service_iam_member" "inference_bot_invoker" {
  count    = var.deploy_inference ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.inference[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.bot_sa.email}"
}

# ── Telegram bot ─────────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "bot" {
  project  = var.project_id
  name     = var.bot_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = var.labels

  template {
    service_account = google_service_account.bot_sa.email

    scaling {
      min_instance_count = var.bot_min_instances
      max_instance_count = 1
    }

    containers {
      image = var.bot_image

      env {
        name  = "APP_URL"
        value = google_cloud_run_v2_service.frontend.uri
      }
      env {
        name  = "MODEL_PROVIDER"
        value = var.model_provider
      }
      env {
        name  = "INFERENCE_SERVICE_URL"
        value = local.inference_url
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name = "TELEGRAM_BOT_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.telegram_bot_token_secret_id
            version = "latest"
          }
        }
      }
      dynamic "env" {
        for_each = var.model_provider == "gemini" ? [1] : []
        content {
          name = "GEMINI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = var.gemini_api_key_secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }

  depends_on = [
    google_cloud_run_v2_service.frontend,
    google_secret_manager_secret_iam_member.bot_telegram_token
  ]
}

resource "google_cloud_run_v2_service_iam_member" "bot_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.bot.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Pub/Sub background function ──────────────────────────────────────────────

resource "google_cloudfunctions2_function" "background_handler" {
  project     = var.project_id
  name        = var.background_function_name
  location    = var.region
  description = "Background processor for Hire Lens GitHub candidate analysis"
  labels      = var.labels

  build_config {
    runtime     = "nodejs20"
    entry_point = "helloPubSub"
    source {
      storage_source {
        bucket = google_storage_bucket.func_source_bucket.name
        object = google_storage_bucket_object.func_zip.name
      }
    }
  }

  service_config {
    max_instance_count    = 5
    available_memory      = "256Mi"
    timeout_seconds       = 120
    service_account_email = google_service_account.run_sa.email

    vpc_connector = var.vpc_connector_id

    environment_variables = {
      PROJECT_ID      = var.project_id
      STORAGE_BUCKET  = var.storage_bucket_name
      MODEL_PROVIDER  = var.model_provider
      INFERENCE_URL   = local.inference_url
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topic_name}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

locals {
  inference_url = var.deploy_inference ? google_cloud_run_v2_service.inference[0].uri : ""
}
