variable "project_id" {
  description = "The GCP project ID."
  type        = string
}

variable "region" {
  description = "The GCP region for networking resources."
  type        = string
}

variable "vpc_name" {
  description = "The name of the VPC network."
  type        = string
}

variable "subnet_name" {
  description = "The name of the subnet."
  type        = string
}

variable "router_name" {
  description = "The name of the Cloud Router."
  type        = string
}

variable "nat_name" {
  description = "The name of the Cloud NAT gateway."
  type        = string
}

variable "connector_name" {
  description = "The name of the Serverless VPC access connector."
  type        = string
}
