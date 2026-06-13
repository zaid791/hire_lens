output "container_app_name" {
  value = azurerm_container_app.this.name
}

output "container_app_fqdn" {
  value = azurerm_container_app.this.ingress[0].fqdn
}
