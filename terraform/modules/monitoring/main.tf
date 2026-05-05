resource "azurerm_application_insights" "this" {
  name                = "appi-${var.resource_group_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  tags                = var.tags
}
