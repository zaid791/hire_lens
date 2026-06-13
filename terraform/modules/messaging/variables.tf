variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "service_bus_name" {
  type = string
}

variable "queue_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
