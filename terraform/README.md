# Terraform (Azure scaffold — superseded)

> **Note for evaluators:** This folder contains an **early Azure-based infrastructure scaffold** from the initial project planning phase. The **active, deployed stack** uses **Google Cloud Platform + Firebase** and lives in [`../terraform_new/`](../terraform_new/).

---

## Why two Terraform folders exist

| Folder | Cloud | Status |
|--------|-------|--------|
| `terraform/` | Azure (Functions, Cosmos DB, Container Apps) | Planning scaffold — not used for final deployment |
| `terraform_new/` | GCP (Cloud Run, Firebase, Secret Manager) | **Active — use this for submission demo** |

The team migrated to GCP + Firebase for managed auth, Firestore, and Cloud Run simplicity.

---

## What this Azure scaffold covers

- Resource group
- Storage account and blob container
- Cosmos DB account, database, and container
- Service Bus namespace and queue
- Application Insights
- Azure Functions app skeleton
- Azure Container Apps environment skeleton

---

## If you need to inspect this scaffold

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # if present
az login
terraform init
terraform plan
```

Do **not** confuse this with the live Hire Lens deployment.

---

## Deploy the actual project

See [../terraform_new/DEPLOYMENT_GUIDE.md](../terraform_new/DEPLOYMENT_GUIDE.md).
