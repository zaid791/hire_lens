variable "project_name" {
  description = "Short project name used for Azure resource names."
  type        = string
  default     = "hirelens"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region for the deployment."
  type        = string
  default     = "westeurope"
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default = {
    project = "hire-lens"
    managed = "terraform"
  }
}

variable "function_app_name" {
  description = "Override for the Azure Functions app name."
  type        = string
  default     = null
}

variable "model_app_name" {
  description = "Override for the Azure Container Apps name."
  type        = string
  default     = null
}

variable "function_image" {
  description = "Container image for the Functions app if you later switch to container deployment."
  type        = string
  default     = "mcr.microsoft.com/azure-functions/dotnet-isolated:4-dotnet-isolated8.0"
}

variable "model_image" {
  description = "Container image for the model service."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "cosmos_db_name" {
  description = "Cosmos DB database name."
  type        = string
  default     = "hirelens"
}

variable "cosmos_container_name" {
  description = "Cosmos DB container name for application records."
  type        = string
  default     = "records"
}

variable "cosmos_location" {
  description = "Optional override for the Cosmos DB region."
  type        = string
  default     = "polandcentral"
}

variable "service_bus_queue_name" {
  description = "Service Bus queue name for background jobs."
  type        = string
  default     = "analysis-jobs"
}
