output "vpc_network_id" {
  description = "The ID of the VPC network."
  value       = google_compute_network.vpc.id
}

output "vpc_subnetwork_id" {
  description = "The ID of the subnetwork."
  value       = google_compute_subnetwork.subnet.id
}

output "vpc_connector_id" {
  description = "The Serverless VPC Access Connector ID."
  value       = google_vpc_access_connector.connector.id
}
