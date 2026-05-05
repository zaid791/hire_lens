# Terraform Setup

This directory contains the Terraform scaffold for the Hire Lens Azure deployment.

## What this first setup covers

- Resource group
- Storage account and blob container
- Cosmos DB account, database, and container
- Service Bus namespace and queue
- Application Insights
- Azure Functions app skeleton
- Azure Container Apps environment and inference app skeleton

## Prerequisites

- Terraform installed
- Azure CLI installed
- An Azure subscription you can deploy into

## Step by Step

1. Sign in to Azure:

   ```bash
   az login
   az account set --subscription "<your-subscription-id-or-name>"
   ```

2. Review the editable values in `terraform.tfvars.example`.

3. Copy it to `terraform.tfvars` and fill in the values you want to use.

4. Initialize Terraform:

   ```bash
   terraform init
   ```

5. Format and inspect the plan:

   ```bash
   terraform fmt -recursive
   terraform plan -var-file=terraform.tfvars
   ```

6. Apply the infrastructure:

   ```bash
   terraform apply -var-file=terraform.tfvars
   ```

## Suggested rollout order

1. Create the resource group, storage, database, messaging, and monitoring first.
2. Add the Functions app after you have the backend code ready.
3. Add the Container Apps inference service when the model API contract is stable.
4. Add auth and any optional dashboard resources after the core path works.
