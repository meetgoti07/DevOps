# Terraform Outputs

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "cluster_name" {
  description = "GKE Cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "GKE Cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "GKE Cluster CA certificate"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "kubernetes_cluster_host" {
  description = "GKE cluster host"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "postgres_connection_name" {
  description = "PostgreSQL Cloud SQL connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "postgres_private_ip" {
  description = "PostgreSQL private IP address"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "postgres_username" {
  description = "PostgreSQL username"
  value       = google_sql_user.postgres_user.name
}

output "postgres_password" {
  description = "PostgreSQL password"
  value       = random_password.postgres_password.result
  sensitive   = true
}

output "mysql_connection_name" {
  description = "MySQL Cloud SQL connection name"
  value       = google_sql_database_instance.mysql.connection_name
}

output "mysql_private_ip" {
  description = "MySQL private IP address"
  value       = google_sql_database_instance.mysql.private_ip_address
}

output "mysql_username" {
  description = "MySQL username"
  value       = google_sql_user.mysql_user.name
}

output "mysql_password" {
  description = "MySQL password"
  value       = random_password.mysql_password.result
  sensitive   = true
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.redis.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.redis.port
}

output "app_storage_bucket" {
  description = "Application storage bucket name"
  value       = google_storage_bucket.app_storage.name
}

output "backup_storage_bucket" {
  description = "Backup storage bucket name"
  value       = google_storage_bucket.backup_storage.name
}

output "vpc_network" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

# output "gke_service_account" {
#   description = "Service account for GKE nodes"
#   value       = google_service_account.gke_nodes.email
# }

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${var.zone} --project ${var.project_id}"
}
