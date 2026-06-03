module "project" {
  source     = "./modules/project"
  project_id = var.project_id
}

module "database" {
  source             = "./modules/database"
  project_id         = var.project_id
  firestore_location = var.firestore_location
  
  depends_on = [module.project]
}

module "auth" {
  source               = "./modules/auth"
  project_id           = var.project_id
  web_app_id           = module.project.web_app_id
  github_client_id     = var.github_client_id
  github_client_secret = var.github_client_secret
  
  depends_on = [module.project]
}

module "networking" {
  source         = "./modules/networking"
  project_id     = var.project_id
  region         = var.region
  vpc_name       = local.vpc_name
  subnet_name    = local.subnet_name
  router_name    = local.router_name
  nat_name       = local.nat_name
  connector_name = local.vpc_connector_name
  
  depends_on = [module.project]
}

module "storage" {
  source      = "./modules/storage"
  project_id  = var.project_id
  bucket_name = local.storage_bucket_name
  region      = var.region
  
  depends_on = [module.project]
}

module "pubsub" {
  source     = "./modules/pubsub"
  project_id = var.project_id
  topic_name = local.pubsub_topic_name
  sub_name   = local.pubsub_sub_name
  
  depends_on = [module.project]
}

module "services" {
  source                   = "./modules/services"
  project_id               = var.project_id
  region                   = var.region
  vpc_connector_id         = module.networking.vpc_connector_id
  pubsub_topic_name        = module.pubsub.topic_name
  pubsub_subscription_name = module.pubsub.subscription_name
  storage_bucket_name      = module.storage.bucket_name
  backend_service_name     = local.backend_service_name
  inference_service_name   = local.inference_service_name
  background_function_name = local.background_function_name
  bot_sa_id                = local.bot_service_account_id
  run_sa_id                = local.run_service_account_id
  backend_image            = var.backend_image
  inference_image          = var.inference_image
  labels                   = local.common_labels
  
  depends_on = [
    module.project,
    module.database,
    module.networking,
    module.storage,
    module.pubsub
  ]
}
