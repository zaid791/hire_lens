terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

# Create custom VPC Network
resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = var.vpc_name
  auto_create_subnetworks = false
}

# Create Subnetwork for compute instances / internal services
resource "google_compute_subnetwork" "subnet" {
  project                  = var.project_id
  name                     = var.subnet_name
  ip_cidr_range            = "10.0.0.0/24"
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = true
}

# Create Serverless VPC Access Connector for Cloud Run / Cloud Functions
resource "google_vpc_access_connector" "connector" {
  project       = var.project_id
  name          = var.connector_name
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28" # Must be a free /28 block in VPC
  min_instances = 2
  max_instances = 10
}

# Create Cloud Router (necessary for NAT)
resource "google_compute_router" "router" {
  project = var.project_id
  name    = var.router_name
  region  = var.region
  network = google_compute_network.vpc.id
}

# Create Cloud NAT (allows outbound internet access for resources in private VPC)
resource "google_compute_router_nat" "nat" {
  project                            = var.project_id
  name                               = var.nat_name
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
