# Cloud SQL (PostgreSQL) for User Service
resource "google_sql_database_instance" "postgres" {
  name             = "${var.environment}-canteen-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = var.database_tier

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = var.enable_backup
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day  = 7
      hour = 3
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    database_flags {
      name  = "log_duration"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "userdb" {
  name     = "userdb"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "postgres_user" {
  name     = "admin"
  instance = google_sql_database_instance.postgres.name
  password = random_password.postgres_password.result
}

# Cloud SQL (MySQL) for Order Service
resource "google_sql_database_instance" "mysql" {
  name             = "${var.environment}-canteen-mysql"
  database_version = "MYSQL_8_0"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = var.database_tier

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      ssl_mode        = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled            = var.enable_backup
      start_time         = "02:30"
      binary_log_enabled = true
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day  = 7
      hour = 4
    }

    database_flags {
      name  = "max_connections"
      value = "150"
    }

    database_flags {
      name  = "general_log"
      value = "on"
    }

    database_flags {
      name  = "slow_query_log"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "orderdb" {
  name     = "orderdb"
  instance = google_sql_database_instance.mysql.name
}

resource "google_sql_user" "mysql_user" {
  name     = "admin"
  instance = google_sql_database_instance.mysql.name
  password = random_password.mysql_password.result
}

# Cloud Memorystore (Redis) for Queue Service
resource "google_redis_instance" "redis" {
  name           = "${var.environment}-canteen-redis"
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region
  redis_version  = "REDIS_7_0"
  tier           = "BASIC"

  authorized_network = google_compute_network.vpc.id
  connect_mode       = "DIRECT_PEERING"

  depends_on = [google_service_networking_connection.private_vpc_connection]

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 3
        minutes = 0
      }
    }
  }

  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  labels = var.tags
}

# Private Service Connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.environment}-private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]

  depends_on = [google_compute_global_address.private_ip_address]
}

# Enable Service Networking API
resource "google_project_service" "servicenetworking" {
  service = "servicenetworking.googleapis.com"

  disable_on_destroy = false
}

# Random passwords for databases
resource "random_password" "postgres_password" {
  length  = 16
  special = true
}

resource "random_password" "mysql_password" {
  length  = 16
  special = true
}
