resource "azurerm_servicebus_namespace" "this" {
  name                = var.service_bus_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_servicebus_queue" "analysis_jobs" {
  name         = var.queue_name
  namespace_id = azurerm_servicebus_namespace.this.id
}
