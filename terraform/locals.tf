locals {
  name_prefix     = lower(replace("${var.project_name}-${var.environment}", "_", "-"))
  resource_suffix = substr(replace(random_string.suffix.result, "_", ""), 0, 6)

  resource_group_name  = "rg-${local.name_prefix}"
  storage_account_name = substr(lower(replace("st${var.project_name}${var.environment}${local.resource_suffix}", "-", "")), 0, 24)
  cosmos_account_name  = substr(lower(replace("cos${var.project_name}${var.environment}${local.resource_suffix}", "-", "")), 0, 44)
  service_bus_name     = substr(lower(replace("sb${var.project_name}${var.environment}${local.resource_suffix}", "-", "")), 0, 50)
  function_app_name    = coalesce(var.function_app_name, substr(lower(replace("func-${local.name_prefix}-${local.resource_suffix}", "_", "-")), 0, 60))
  model_app_name       = coalesce(var.model_app_name, substr(lower(replace("model-${local.name_prefix}-${local.resource_suffix}", "_", "-")), 0, 60))
}
