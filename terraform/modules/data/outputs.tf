output "storage_account_name" {
  value = azurerm_storage_account.this.name
}

output "storage_account_primary_access_key" {
  value     = azurerm_storage_account.this.primary_access_key
  sensitive = true
}

output "cosmos_account_name" {
  value = azurerm_cosmosdb_account.this.name
}

output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.this.endpoint
}

output "cosmos_primary_key" {
  value     = azurerm_cosmosdb_account.this.primary_key
  sensitive = true
}
