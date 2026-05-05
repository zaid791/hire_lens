resource "azurerm_service_plan" "this" {
  name                = "asp-${var.function_app_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = var.tags
}

resource "azurerm_storage_account" "functions" {
  name                            = substr(replace("st${var.function_app_name}", "-", ""), 0, 24)
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  allow_nested_items_to_be_public = false
  min_tls_version                 = "TLS1_2"
  tags                            = var.tags
}

resource "azurerm_linux_function_app" "this" {
  name                       = var.function_app_name
  resource_group_name        = var.resource_group_name
  location                   = var.location
  service_plan_id            = azurerm_service_plan.this.id
  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  https_only                 = true
  tags                       = var.tags

  site_config {
    always_on = false
    application_stack {
      dotnet_version = "8.0"
    }
  }

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION"           = "~4"
    "FUNCTIONS_WORKER_RUNTIME"              = "dotnet-isolated"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.application_insights_conn
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.application_insights_key
  }
}
