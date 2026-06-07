variable "project_id" {
  type = string
}

variable "frontend_url" {
  description = "Public Cloud Run URL for the website (used as an authorized Firebase Auth domain)."
  type        = string
}

variable "additional_authorized_domains" {
  type    = list(string)
  default = []
}
