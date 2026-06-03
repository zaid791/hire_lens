locals {
  name_prefix     = lower(replace("${var.project_name}-${var.environment}", "_", "-"))
  resource_suffix = substr(replace(random_string.suffix.result, "_", ""), 0, 6)

  # Service naming conventions
  vpc_name             = "vpc-${local.name_prefix}"
  subnet_name          = "sb-${local.name_prefix}"
  router_name          = "router-${local.name_prefix}"
  nat_name             = "nat-${local.name_prefix}"
  vpc_connector_name   = "conn-${substr(local.name_prefix, 0, 15)}" # Maximum 25 characters for VPC Connector name

  storage_bucket_name  = "${local.name_prefix}-data-${local.resource_suffix}"
  pubsub_topic_name    = "${local.name_prefix}-analysis-jobs"
  pubsub_sub_name      = "${local.name_prefix}-analysis-jobs-sub"

  # Cloud Run services
  backend_service_name   = "run-backend-${local.name_prefix}"
  inference_service_name = "run-inference-${local.name_prefix}"

  # Cloud Functions
  background_function_name = "fn-job-handler-${local.name_prefix}"

  # IAM Service Accounts
  bot_service_account_id = "sa-telegram-bot"
  run_service_account_id = "sa-cloud-run"

  common_labels = merge(var.labels, {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  })
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}
