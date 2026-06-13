locals {
  name_prefix     = lower(replace("${var.project_name}-${var.environment}", "_", "-"))
  resource_suffix = substr(replace(random_string.suffix.result, "_", ""), 0, 6)

  use_gemini       = var.model_provider == "gemini"
  use_opensource   = var.model_provider == "opensource"
  deploy_inference = local.use_opensource

  # Networking
  vpc_name           = "vpc-${local.name_prefix}"
  subnet_name        = "sb-${local.name_prefix}"
  router_name        = "router-${local.name_prefix}"
  nat_name           = "nat-${local.name_prefix}"
  vpc_connector_name = "conn-${substr(local.name_prefix, 0, 15)}"

  # Storage & messaging
  storage_bucket_name = "${local.name_prefix}-data-${local.resource_suffix}"
  pubsub_topic_name   = "${local.name_prefix}-analysis-jobs"
  pubsub_sub_name     = "${local.name_prefix}-analysis-jobs-sub"

  # Cloud Run service names
  backend_service_name     = "run-backend-${local.name_prefix}"
  inference_service_name   = "run-inference-${local.name_prefix}"
  bot_service_name         = "run-bot-${local.name_prefix}"
  frontend_service_name    = "run-frontend-${local.name_prefix}"
  background_function_name = "fn-job-handler-${local.name_prefix}"

  # Service accounts
  bot_service_account_id = "sa-telegram-bot"
  run_service_account_id = "sa-cloud-run"

  # Artifact Registry image URIs
  ar_host = "${var.region}-docker.pkg.dev"
  ar_base = "${local.ar_host}/${var.project_id}/${var.artifact_registry_repo}"

  resolved_backend_image = var.build_images ? "${local.ar_base}/backend:latest" : (
    var.backend_image != "" ? var.backend_image : "us-docker.pkg.dev/cloudrun/container/hello:latest"
  )
  resolved_inference_image = var.build_images ? "${local.ar_base}/inference:latest" : (
    var.inference_image != "" ? var.inference_image : "us-docker.pkg.dev/cloudrun/container/hello:latest"
  )
  resolved_bot_image = var.build_images ? "${local.ar_base}/bot:latest" : (
    var.bot_image != "" ? var.bot_image : "us-docker.pkg.dev/cloudrun/container/hello:latest"
  )
  resolved_frontend_image = var.build_images ? "${local.ar_base}/frontend:latest" : (
    var.frontend_image != "" ? var.frontend_image : "us-docker.pkg.dev/cloudrun/container/hello:latest"
  )

  common_labels = merge(var.labels, {
    project        = var.project_name
    environment    = var.environment
    managed_by     = "terraform"
    model_provider = var.model_provider
  })

  # Default Firebase Storage bucket (distinct from the app data GCS bucket).
  firebase_storage_bucket = "${var.project_id}.firebasestorage.app"
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}
