variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "repository_id" {
  type = string
}

variable "cloudbuild_sa_id" {
  type    = string
  default = "sa-cloud-build"
}

variable "labels" {
  type    = map(string)
  default = {}
}
