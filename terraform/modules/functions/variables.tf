variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "storage_account_name" {
  type = string
}

variable "storage_account_key" {
  type      = string
  sensitive = true
}

variable "application_insights_key" {
  type      = string
  sensitive = true
}

variable "application_insights_conn" {
  type      = string
  sensitive = true
}

variable "function_app_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
