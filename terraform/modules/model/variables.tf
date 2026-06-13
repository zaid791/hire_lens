variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "container_app_name" {
  type = string
}

variable "model_image" {
  type = string
}

variable "tags" {
  type = map(string)
}
