output "function_app_name" {
  value = azurerm_linux_function_app.this.name
}

output "function_app_default_hostname" {
  value = azurerm_linux_function_app.this.default_hostname
}
