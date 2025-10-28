# Cloud Storage for application data and backups

# Bucket for storing logs from backup bucket
resource "google_storage_bucket" "backup_logging" {
  name          = "${var.project_id}-${var.environment}-backup-logs"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

  logging {
    log_bucket = google_storage_bucket.backup_logs_archive.name
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  labels = var.tags
}

# Bucket for application uploads (e.g., menu images)
resource "google_storage_bucket" "app_storage" {
  name          = "${var.project_id}-${var.environment}-app-storage"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

  logging {
    log_bucket = google_storage_bucket.app_logs_archive.name
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["https://*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }

  labels = var.tags
}

# Bucket for backups
resource "google_storage_bucket" "backup_storage" {
  name          = "${var.project_id}-${var.environment}-backups"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type = "Delete"
    }
  }

  logging {
    log_bucket = google_storage_bucket.backup_logging.name
  }

  labels = var.tags
}

# Bucket for Terraform state (commented out - create manually first)
# resource "google_storage_bucket" "terraform_state" {
#   name          = "${var.project_id}-terraform-state"
#   location      = var.region
#   force_destroy = false
#
#   uniform_bucket_level_access = true
#
#   versioning {
#     enabled = true
#   }
#
#   labels = var.tags
# }

# Archive buckets for logs
resource "google_storage_bucket" "backup_logs_archive" {
  name          = "${var.project_id}-${var.environment}-backup-logs-archive"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

  logging {
    log_bucket = google_storage_bucket.archive_access_logs.name
  }

  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type = "Delete"
    }
  }

  labels = var.tags

  depends_on = [google_storage_bucket.archive_access_logs]
}

resource "google_storage_bucket" "app_logs_archive" {
  name          = "${var.project_id}-${var.environment}-app-logs-archive"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

  logging {
    log_bucket = google_storage_bucket.archive_access_logs.name
  }

  lifecycle_rule {
    condition {
      age = 180
    }
    action {
      type = "Delete"
    }
  }

  labels = var.tags

  depends_on = [google_storage_bucket.archive_access_logs]
}

# Bucket for archive access logs
resource "google_storage_bucket" "archive_access_logs" {
  name          = "${var.project_id}-${var.environment}-archive-access-logs"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  public_access_prevention = "enforced"

  # Prevent recreation if already exists
  lifecycle {
    prevent_destroy = false
    ignore_changes  = []
  }

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  labels = var.tags
}

# IAM for storage buckets
# Commented out - using default GKE service account
# resource "google_storage_bucket_iam_member" "app_storage_viewer" {
#   bucket = google_storage_bucket.app_storage.name
#   role   = "roles/storage.objectViewer"
#   member = "serviceAccount:${google_service_account.gke_nodes.email}"
# }

# resource "google_storage_bucket_iam_member" "backup_storage_admin" {
#   bucket = google_storage_bucket.backup_storage.name
#   role   = "roles/storage.objectAdmin"
#   member = "serviceAccount:${google_service_account.gke_nodes.email}"
# }
