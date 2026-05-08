resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

module "resource_group" {
  source   = "./modules/resource-group"
  name     = local.resource_group_name
  location = var.location
  tags     = var.tags
}

module "data" {
  source                = "./modules/data"
  resource_group_name   = module.resource_group.name
  location              = module.resource_group.location
  cosmos_location       = var.cosmos_location
  storage_account_name  = local.storage_account_name
  cosmos_account_name   = local.cosmos_account_name
  cosmos_db_name        = var.cosmos_db_name
  cosmos_container_name = var.cosmos_container_name
  tags                  = var.tags
}

module "messaging" {
  source              = "./modules/messaging"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  service_bus_name    = local.service_bus_name
  queue_name          = var.service_bus_queue_name
  tags                = var.tags
}

module "monitoring" {
  source              = "./modules/monitoring"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = var.tags
}

module "functions" {
  source                    = "./modules/functions"
  resource_group_name       = module.resource_group.name
  location                  = module.resource_group.location
  storage_account_name      = module.data.storage_account_name
  storage_account_key       = module.data.storage_account_primary_access_key
  application_insights_key  = module.monitoring.instrumentation_key
  application_insights_conn = module.monitoring.connection_string
  function_app_name         = local.function_app_name
  tags                      = var.tags
}

module "model" {
  source              = "./modules/model"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  container_app_name  = local.model_app_name
  model_image         = var.model_image
  tags                = var.tags
}
