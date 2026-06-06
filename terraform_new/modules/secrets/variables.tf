variable "project_id" {
  type = string
}

variable "telegram_bot_token" {
  type      = string
  sensitive = true
}

variable "gemini_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "labels" {
  type    = map(string)
  default = {}
}
