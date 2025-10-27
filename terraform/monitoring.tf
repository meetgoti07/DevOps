# Cloud Monitoring and Alerting

# Uptime check for frontend
resource "google_monitoring_uptime_check_config" "frontend_uptime" {
  count        = var.enable_monitoring ? 1 : 0
  display_name = "${var.environment}-canteen-frontend-uptime"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/"
    port         = 80
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "canteen.example.com"
    }
  }
}

# Alert policy for high CPU usage
resource "google_monitoring_alert_policy" "high_cpu" {
  count        = var.enable_monitoring ? 1 : 0
  display_name = "${var.environment}-high-cpu-usage"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "CPU usage above 80%"
    
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = []

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content = "CPU usage is above 80% for 5 minutes"
  }
}

# Alert policy for high memory usage
resource "google_monitoring_alert_policy" "high_memory" {
  count        = var.enable_monitoring ? 1 : 0
  display_name = "${var.environment}-high-memory-usage"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Memory usage above 85%"
    
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/memory/allocatable_utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = []

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content = "Memory usage is above 85% for 5 minutes"
  }
}

# Alert policy for pod restarts
resource "google_monitoring_alert_policy" "pod_restarts" {
  count        = var.enable_monitoring ? 1 : 0
  display_name = "${var.environment}-frequent-pod-restarts"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Pod restart count > 5 in 10 minutes"
    
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND metric.type=\"kubernetes.io/container/restart_count\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      
      aggregations {
        alignment_period   = "600s"
        per_series_aligner = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = []

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content = "Pod has restarted more than 5 times in 10 minutes"
  }

  depends_on = [google_container_cluster.primary]
}

# Log-based metric for error rates
resource "google_logging_metric" "error_count" {
  count = var.enable_monitoring ? 1 : 0
  name  = "${var.environment}_error_count"
  filter = "severity>=ERROR"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    display_name = "Error Log Count"
  }
}

# Dashboard for application metrics (JSON configuration)
resource "google_monitoring_dashboard" "canteen_dashboard" {
  count          = var.enable_monitoring ? 1 : 0
  dashboard_json = jsonencode({
    displayName = "${var.environment} Canteen Queue Manager Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "CPU Utilization"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"k8s_node\" metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 6
          height = 4
          xPos   = 6
          widget = {
            title = "Memory Utilization"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"k8s_node\" metric.type=\"kubernetes.io/node/memory/allocatable_utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 12
          height = 4
          yPos   = 4
          widget = {
            title = "Pod Count by Status"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"k8s_pod\" metric.type=\"kubernetes.io/pod/phase\""
                    aggregation = {
                      alignmentPeriod    = "60s"
                      perSeriesAligner   = "ALIGN_MEAN"
                      crossSeriesReducer = "REDUCE_SUM"
                      groupByFields      = ["metric.phase"]
                    }
                  }
                }
              }]
            }
          }
        }
      ]
    }
  })
}
