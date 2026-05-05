output "service_bus_name" {
  value = azurerm_servicebus_namespace.this.name
}

output "service_bus_namespace_id" {
  value = azurerm_servicebus_namespace.this.id
}

output "queue_name" {
  value = azurerm_servicebus_queue.analysis_jobs.name
}
