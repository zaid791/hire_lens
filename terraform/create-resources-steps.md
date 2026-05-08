# Terraform Resource Creation Steps

Use this guide to create the Hire Lens Azure resources from a clean start now that `Microsoft.App` is no longer managed by Terraform.

## Before You Start

1. Make sure Terraform is installed.
2. Make sure Azure CLI is installed.
3. Sign in to Azure with `az login`.
4. Select the correct subscription.
5. Register `Microsoft.App` manually in Azure before running Terraform.

### Manual provider registration

Run this once per Azure subscription:

```bash
az provider register --namespace Microsoft.App
az provider show --namespace Microsoft.App --query registrationState -o tsv
```

Wait until the second command returns `Registered`.

## Step-by-Step Creation

### 1. Go to the Terraform folder

```bash
cd /Users/zaid/Documents/sem_2/Cloud\ Computing/hire_lens/terraform
```

### 2. Log in and select your subscription

```bash
az login
az account set --subscription "<your-subscription-id-or-name>"
```

### 3. Create your Terraform variables file

Copy the example file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set the values you want. The current expected minimum values are:

```hcl
project_name    = "hirelens"
environment     = "dev"
location        = "westeurope"
cosmos_location = "polandcentral"

tags = {
  project = "hire-lens"
  owner   = "your-name"
  managed = "terraform"
}
```

If you want to override the app or image names, uncomment and edit the optional values in the file.

### 4. Initialize Terraform

```bash
terraform init
```

### 5. Format the configuration

```bash
terraform fmt -recursive
```

### 6. Validate the configuration

```bash
terraform validate
```

### 7. Review the execution plan

```bash
terraform plan -var-file=terraform.tfvars
```

Check that the plan includes the expected resources:

- Resource group
- Storage account and blob container
- Cosmos DB account, database, and container
- Service Bus namespace and queue
- Application Insights
- Azure Functions app
- Azure Container Apps environment and app

### 8. Apply the infrastructure

```bash
terraform apply -var-file=terraform.tfvars
```

Type `yes` when prompted.

### 9. Review the outputs

After the apply finishes, inspect the outputs:

```bash
terraform output
```

Use the output values for the resource group, storage account, Cosmos DB, and any app endpoint names you need next.

## Updating the Infrastructure Later

If you change `terraform.tfvars` or any `.tf` file, repeat these commands in order:

```bash
terraform fmt -recursive
terraform validate
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## Tear Down

When you want to delete the created resources:

```bash
terraform destroy -var-file=terraform.tfvars
```

Because `Microsoft.App` is no longer owned by Terraform, destroy will not try to unregister that provider. The provider remains registered in the Azure subscription until you remove it manually.

## Common Checks

If something fails, verify these first:

1. `az provider show --namespace Microsoft.App --query registrationState -o tsv` returns `Registered`.
2. The Azure subscription in `az account show` matches the one you expect.
3. `terraform.tfvars` exists in the current folder.
4. The Cosmos region override is set to a supported region, such as `polandcentral`.
