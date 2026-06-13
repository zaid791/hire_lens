terraform {
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = ">= 3.2"
    }
  }
}

resource "null_resource" "rebuild_frontend" {
  count = var.build_images && var.deploy_inference && var.inference_url != "" ? 1 : 0

  triggers = {
    inference_url = var.inference_url
  }

  provisioner "local-exec" {
    command = <<-EOT
      export CLOUDSDK_AUTH_ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"
      gcloud builds submit "${abspath(var.repo_root)}/apps/persona_probe" \
        --project="${var.project_id}" \
        --region="${var.region}" \
        --config="${abspath(path.module)}/../../cloudbuild/frontend.yaml" \
        --substitutions=${local.frontend_substitutions}
    EOT
  }
}
