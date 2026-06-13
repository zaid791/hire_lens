resource "azurerm_container_app_environment" "this" {
  name                = "cae-${var.container_app_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_container_app" "this" {
  name                         = var.container_app_name
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  revision_mode                = "Single"
  tags                         = var.tags

  template {
    container {
      name   = "model"
      image  = var.model_image
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    external_enabled = false
    target_port      = 80

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
