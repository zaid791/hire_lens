module "project" {
  source     = "./modules/project"
  project_id = var.project_id
}

module "secrets" {
  source = "./modules/secrets"

  project_id         = var.project_id
  telegram_bot_token = var.telegram_bot_token
  gemini_api_key     = var.gemini_api_key
  labels             = local.common_labels

  depends_on = [module.project]
}

module "artifact_registry" {
  source = "./modules/artifact_registry"

  project_id    = var.project_id
  region        = var.region
  repository_id = var.artifact_registry_repo
  labels        = local.common_labels

  depends_on = [module.project]
}

module "database" {
  source             = "./modules/database"
  project_id         = var.project_id
  firestore_location = var.firestore_location

  depends_on = [module.project]
}

module "auth" {
  source     = "./modules/auth"
  project_id = var.project_id
  web_app_id = module.project.web_app_id

  depends_on = [module.project]
}

module "firestore_rules" {
  source = "./modules/firestore_rules"

  project_id      = var.project_id
  rules_file_path = abspath("${var.repo_root}/${var.firestore_rules_file}")

  depends_on = [module.database]
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

module "build" {
  source = "./modules/build"

  project_id                   = var.project_id
  region                       = var.region
  repo_root                    = var.repo_root
  build_images                 = var.build_images
  deploy_inference             = local.deploy_inference
  backend_image                = local.resolved_backend_image
  inference_image              = local.resolved_inference_image
  bot_image                    = local.resolved_bot_image
  frontend_image               = local.resolved_frontend_image
  model_provider               = var.model_provider
  firebase_api_key             = module.auth.api_key
  firebase_auth_domain         = module.project.auth_domain
  firebase_storage_bucket      = local.firebase_storage_bucket
  firebase_messaging_sender_id = module.project.project_number
  firebase_app_id              = module.project.web_app_id
  gemini_api_key               = var.gemini_api_key
  inference_url                = ""
  telegram_bot_username        = var.telegram_bot_username

  depends_on = [
    module.project,
    module.auth,
    module.artifact_registry
  ]
}

module "services" {
  source = "./modules/services"

  project_id                   = var.project_id
  region                       = var.region
  vpc_connector_id             = module.networking.vpc_connector_id
  pubsub_topic_name            = module.pubsub.topic_name
  pubsub_subscription_name     = module.pubsub.subscription_name
  storage_bucket_name          = module.storage.bucket_name
  backend_service_name         = local.backend_service_name
  inference_service_name       = local.inference_service_name
  bot_service_name             = local.bot_service_name
  frontend_service_name        = local.frontend_service_name
  background_function_name     = local.background_function_name
  bot_sa_id                    = local.bot_service_account_id
  run_sa_id                    = local.run_service_account_id
  backend_image                = local.resolved_backend_image
  inference_image              = local.resolved_inference_image
  bot_image                    = local.resolved_bot_image
  frontend_image               = local.resolved_frontend_image
  labels                       = local.common_labels
  model_provider               = var.model_provider
  deploy_inference             = local.deploy_inference
  bot_min_instances            = var.bot_min_instances
  telegram_bot_token_secret_id = module.secrets.telegram_bot_token_secret_id
  gemini_api_key_secret_id     = module.secrets.gemini_api_key_secret_id
  frontend_deploy_stamp        = coalesce(module.build.frontend_build_id, "")
  bot_deploy_stamp             = coalesce(module.build.bot_build_id, "")

  depends_on = [
    module.project,
    module.database,
    module.networking,
    module.storage,
    module.pubsub,
    module.secrets,
    module.build
  ]
}

module "build_post" {
  source = "./modules/build_post"

  project_id                   = var.project_id
  region                       = var.region
  repo_root                    = var.repo_root
  build_images                 = var.build_images
  deploy_inference             = local.deploy_inference
  inference_url                = module.services.inference_url
  frontend_image               = local.resolved_frontend_image
  frontend_service_name        = local.frontend_service_name
  model_provider               = var.model_provider
  firebase_api_key             = module.auth.api_key
  firebase_auth_domain         = module.project.auth_domain
  firebase_storage_bucket      = local.firebase_storage_bucket
  firebase_messaging_sender_id = module.project.project_number
  firebase_app_id              = module.project.web_app_id
  gemini_api_key               = var.gemini_api_key
  telegram_bot_username        = var.telegram_bot_username

  depends_on = [module.services]
}

module "auth_config" {
  source       = "./modules/auth_config"
  project_id   = var.project_id
  frontend_url = module.services.frontend_url

  depends_on = [module.services]
}

# ── Auto-generated local env files for teammates ─────────────────────────────

resource "local_file" "frontend_env" {
  count = var.generate_local_env_files ? 1 : 0

  filename = "${abspath(var.repo_root)}/apps/persona_probe/.env.production.generated"
  content = templatefile("${path.module}/templates/frontend.env.tpl", {
    firebase_api_key             = module.auth.api_key
    firebase_auth_domain         = module.project.auth_domain
    firebase_project_id          = var.project_id
    firebase_storage_bucket      = local.firebase_storage_bucket
    firebase_messaging_sender_id = module.project.project_number
    firebase_app_id              = module.project.web_app_id
    gemini_api_key               = var.gemini_api_key
    model_provider               = var.model_provider
    inference_url                = module.services.inference_url
    frontend_url                 = module.services.frontend_url
    backend_url                  = module.services.backend_url
    telegram_bot_username        = var.telegram_bot_username
  })
}

resource "local_file" "bot_env" {
  count = var.generate_local_env_files ? 1 : 0

  filename = "${abspath(var.repo_root)}/apps/telegram-bot/.env.production.generated"
  content = templatefile("${path.module}/templates/bot.env.tpl", {
    app_url        = module.services.frontend_url
    model_provider = var.model_provider
    inference_url  = module.services.inference_url
    project_id     = var.project_id
  })
}

resource "local_file" "backend_env" {
  count = var.generate_local_env_files ? 1 : 0

  filename = "${abspath(var.repo_root)}/services/backend/.env.production.generated"
  content = templatefile("${path.module}/templates/backend.env.tpl", {
    project_id     = var.project_id
    storage_bucket = module.storage.bucket_name
    pubsub_topic   = module.pubsub.topic_name
    app_url        = module.services.frontend_url
    model_provider = var.model_provider
    inference_url  = module.services.inference_url
  })
}
