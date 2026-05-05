variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "storage_account_name" {
  type = string
}

variable "cosmos_account_name" {
  type = string
}

variable "cosmos_db_name" {
  type = string
}

variable "cosmos_container_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
