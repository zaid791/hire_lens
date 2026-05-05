output "resource_group_name" {
  value = module.resource_group.name
}

output "storage_account_name" {
  value = module.data.storage_account_name
}

output "cosmos_account_name" {
  value = module.data.cosmos_account_name
}

output "service_bus_namespace_name" {
  value = module.messaging.service_bus_name
}

output "function_app_name" {
  value = module.functions.function_app_name
}

output "model_app_name" {
  value = module.model.container_app_name
}
