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

# 1. Custom Service Accounts
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

# 2. IAM Roles and Bindings
# Grant Firestore access (datastore.user) to both service accounts
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

# Grant Cloud Storage Object User to Cloud Run SA (for data storage)
resource "google_project_iam_member" "run_storage" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# Grant Pub/Sub permissions
# Telegram Bot needs to publish to the topic
resource "google_project_iam_member" "bot_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.bot_sa.email}"
}

# Cloud Run SA needs both publisher and subscriber rights
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

# Grant Cloud Run invoker rights to run_sa (so it can invoke model-inference internally)
resource "google_project_iam_member" "run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# Grant Eventarc event receiver role to Cloud Run SA for Cloud Function triggers
resource "google_project_iam_member" "run_eventarc_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# 3. Create GCS source bucket for Cloud Function code
resource "google_storage_bucket" "func_source_bucket" {
  project                     = var.project_id
  name                        = "${var.project_id}-fn-sources"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

# Generate a dummy zip file dynamically for initial function deployment
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

# 4. FastAPI Backend Cloud Run Service (Public Ingress)
resource "google_cloud_run_v2_service" "backend" {
  project             = var.project_id
  name                = var.backend_service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"

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
    }
  }
}

# Make FastAPI Backend Cloud Run service accessible to the public
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 5. Model Inference Cloud Run Service (Internal Only)
resource "google_cloud_run_v2_service" "inference" {
  project             = var.project_id
  name                = var.inference_service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_INTERNAL_ONLY"

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
    }
  }
}

# 6. Cloud Function 2nd Gen (triggered by Pub/Sub analysis jobs)
resource "google_cloudfunctions2_function" "background_handler" {
  project     = var.project_id
  name        = var.background_function_name
  location    = var.region
  description = "Background processor for Hire Lens GitHub candidate analysis"

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
      PROJECT_ID     = var.project_id
      STORAGE_BUCKET = var.storage_bucket_name
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = "projects/${var.project_id}/topics/${var.pubsub_topic_name}"
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}
