# Google Kubernetes Engine (GKE) Configuration

resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.zone

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Master authorized networks (restrict API access)
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All public IPs (Update to restrict in production)"
    }
    gcp_public_cidrs_access_enabled = false
  }

  depends_on = [
    google_compute_network.vpc,
    google_compute_subnetwork.subnet
  ]

  # IP allocation policy for VPC-native cluster
  ip_allocation_policy {
    cluster_secondary_range_name  = "pod-ranges"
    services_secondary_range_name = "services-range"
  }

  # Workload Identity for secure access to GCP services
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Enable monitoring and logging
  monitoring_config {
    enable_components = var.enable_monitoring ? ["SYSTEM_COMPONENTS", "WORKLOADS"] : []

    dynamic "managed_prometheus" {
      for_each = var.enable_monitoring ? [1] : []
      content {
        enabled = true
      }
    }
  }

  logging_config {
    enable_components = var.enable_monitoring ? ["SYSTEM_COMPONENTS", "WORKLOADS"] : []
  }

  # Enable intranode visibility and VPC flow logs
  enable_intranode_visibility = true

  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }

  # Release channel for automatic updates
  release_channel {
    channel = "REGULAR"
  }

  # Enable Network Policy
  network_policy {
    enabled = true
  }

  # Enable addons
  addons_config {
    http_load_balancing {
      disabled = false
    }

    horizontal_pod_autoscaling {
      disabled = false
    }

    network_policy_config {
      disabled = false
    }

    dns_cache_config {
      enabled = true
    }
  }

  # Security settings
  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  # Binary Authorization
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Metadata server configuration
  metadata_config {
    node_metadata = "GKE_METADATA"
  }

  # Resource labels
  resource_labels = var.tags
}

# Primary node pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  # Autoscaling configuration
  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  # Node configuration
  node_config {
    preemptible  = false
    machine_type = var.node_machine_type

    # Disk configuration
    disk_size_gb = var.disk_size_gb
    disk_type    = "pd-standard"

    # Service account with minimal permissions
    service_account = google_service_account.gke_nodes.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Security and metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }

    labels = var.tags

    tags = ["gke-node", var.environment]

    # Shielded instance configuration
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  # Node pool management
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}

# Service account for GKE nodes
resource "google_service_account" "gke_nodes" {
  account_id   = "${var.environment}-gke-nodes-sa"
  display_name = "Service Account for GKE Nodes"
}

# IAM bindings for service account
resource "google_project_iam_member" "gke_nodes_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}

resource "google_project_iam_member" "gke_nodes_resource_metadata_writer" {
  project = var.project_id
  role    = "roles/stackdriver.resourceMetadata.writer"
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}
