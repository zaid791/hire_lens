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
        --substitutions=_IMAGE="${var.frontend_image}",_VITE_FIREBASE_API_KEY="${var.firebase_api_key}",_VITE_FIREBASE_AUTH_DOMAIN="${var.firebase_auth_domain}",_VITE_FIREBASE_PROJECT_ID="${var.project_id}",_VITE_FIREBASE_STORAGE_BUCKET="${var.firebase_storage_bucket}",_VITE_FIREBASE_MESSAGING_SENDER_ID="${var.firebase_messaging_sender_id}",_VITE_FIREBASE_APP_ID="${var.firebase_app_id}",_VITE_GEMINI_API_KEY="${var.gemini_api_key}",_VITE_MODEL_PROVIDER="${var.model_provider}",_VITE_INFERENCE_URL="${var.inference_url}"
    EOT
  }
}

resource "null_resource" "redeploy_frontend" {
  count = var.build_images && var.deploy_inference && var.inference_url != "" ? 1 : 0

  triggers = {
    rebuild = null_resource.rebuild_frontend[0].id
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud run services update ${var.frontend_service_name} \
        --project="${var.project_id}" \
        --region="${var.region}" \
        --image="${var.frontend_image}"
    EOT
  }

  depends_on = [null_resource.rebuild_frontend]
}
