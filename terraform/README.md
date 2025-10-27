# Terraform Infrastructure for Canteen Queue Manager

This directory contains Terraform configuration to deploy the Canteen Queue Manager microservices infrastructure on Google Cloud Platform (GCP).

## Architecture Overview

The infrastructure includes:

- **GKE Cluster**: Kubernetes cluster with autoscaling node pools
- **Cloud SQL**: PostgreSQL (User Service) and MySQL (Order Service)
- **Cloud Memorystore**: Redis for Queue Service
- **Cloud Storage**: Application data and backups
- **VPC Network**: Private networking with Cloud NAT
- **Monitoring**: Cloud Monitoring with alerts and dashboards

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Terraform** v1.0 or higher installed
4. **kubectl** for Kubernetes management

## Setup Instructions

### 1. Install Required Tools

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Install Terraform
brew install terraform  # macOS
# Or download from https://www.terraform.io/downloads

# Install kubectl
gcloud components install kubectl
```

### 2. Configure GCP Project

```bash
# Authenticate with GCP
gcloud auth login
gcloud auth application-default login

# Set your project
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable storage.googleapis.com
```

### 3. Configure Terraform Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
vim terraform.tfvars
```

Required variables:

- `project_id`: Your GCP project ID
- `region`: GCP region (e.g., us-central1)
- `zone`: GCP zone (e.g., us-central1-a)

### 4. Initialize Terraform

```bash
terraform init
```

### 5. Review the Execution Plan

```bash
terraform plan
```

Review the resources that will be created.

### 6. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

**Note**: Initial deployment takes 15-20 minutes.

## Post-Deployment Steps

### 1. Configure kubectl

```bash
# Get credentials for the GKE cluster
gcloud container clusters get-credentials canteen-gke-cluster \
  --zone us-central1-a \
  --project your-gcp-project-id

# Verify connection
kubectl get nodes
```

### 2. Deploy Application

```bash
# Navigate to kubernetes directory
cd ../kubernetes

# Create namespace
kubectl apply -f namespace.yaml

# Apply configurations
kubectl apply -f configmap.yaml

# Deploy databases (MongoDB - Cloud SQL will be used for PostgreSQL/MySQL)
kubectl apply -f mongodb.yaml
kubectl apply -f rabbitmq.yaml

# Deploy microservices
kubectl apply -f microservices.yaml

# Deploy frontend and gateway
kubectl apply -f frontend-gateway.yaml
```

### 3. Get Database Credentials

```bash
# PostgreSQL password
terraform output -raw postgres_password

# MySQL password
terraform output -raw mysql_password

# Redis connection info
terraform output redis_host
terraform output redis_port
```

### 4. Update Kubernetes Secrets

Create a secrets file with database credentials:

```bash
kubectl create secret generic db-credentials \
  --from-literal=postgres-password=$(terraform output -raw postgres_password) \
  --from-literal=mysql-password=$(terraform output -raw mysql_password) \
  --from-literal=postgres-host=$(terraform output -raw postgres_private_ip) \
  --from-literal=mysql-host=$(terraform output -raw mysql_private_ip) \
  --from-literal=redis-host=$(terraform output -raw redis_host) \
  -n canteen-system
```

## Managing Infrastructure

### View Current State

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show google_container_cluster.primary
```

### Update Infrastructure

```bash
# After modifying .tf files
terraform plan
terraform apply
```

### Destroy Infrastructure

```bash
# WARNING: This will delete all resources
terraform destroy
```

## Cost Optimization

### Development Environment

```hcl
node_machine_type = "e2-medium"
node_count        = 2
database_tier     = "db-f1-micro"
redis_memory_size_gb = 1
```

### Production Environment

```hcl
node_machine_type = "e2-standard-4"
node_count        = 3
min_node_count    = 3
max_node_count    = 10
database_tier     = "db-n1-standard-2"
redis_memory_size_gb = 5
enable_backup     = true
```

## Monitoring and Alerts

### Access Cloud Monitoring

```bash
# Open monitoring dashboard
gcloud monitoring dashboards list

# View alerts
gcloud alpha monitoring policies list
```

### View Logs

```bash
# GKE cluster logs
gcloud logging read "resource.type=k8s_cluster" --limit 50

# Application logs
kubectl logs -f deployment/order-service -n canteen-system
```

## Security Best Practices

1. **Enable Binary Authorization** for image verification
2. **Use Workload Identity** for service account management
3. **Enable VPC-native cluster** for better network isolation
4. **Enable audit logging** for compliance
5. **Use private IP** for Cloud SQL instances
6. **Enable SSL/TLS** for database connections
7. **Rotate credentials** regularly

## Backup and Disaster Recovery

### Database Backups

Automated backups are configured for:

- **Cloud SQL**: Daily backups with 7-day retention
- **Point-in-time recovery** enabled for PostgreSQL

### Manual Backup

```bash
# Export PostgreSQL database
gcloud sql export sql canteen-postgres \
  gs://your-backup-bucket/postgres-backup-$(date +%Y%m%d).sql \
  --database=userdb

# Export MySQL database
gcloud sql export sql canteen-mysql \
  gs://your-backup-bucket/mysql-backup-$(date +%Y%m%d).sql \
  --database=orderdb
```

### Restore from Backup

```bash
# Restore PostgreSQL
gcloud sql import sql canteen-postgres \
  gs://your-backup-bucket/postgres-backup-20251027.sql \
  --database=userdb
```

## Troubleshooting

### GKE Cluster Not Accessible

```bash
# Re-authenticate
gcloud container clusters get-credentials canteen-gke-cluster \
  --zone us-central1-a --project your-gcp-project-id
```

### Cloud SQL Connection Issues

```bash
# Check private IP connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nc -zv <postgres-private-ip> 5432
```

### Node Pool Issues

```bash
# Check node status
kubectl get nodes
kubectl describe node <node-name>

# Check node pool
gcloud container node-pools list --cluster=canteen-gke-cluster
```

## Resource Naming Convention

All resources follow the pattern: `{environment}-canteen-{resource-type}`

Examples:

- `dev-canteen-gke-cluster`
- `dev-canteen-postgres`
- `dev-canteen-vpc`

## Terraform State Management

### Remote State (Recommended for Teams)

Uncomment the backend configuration in `provider.tf`:

```hcl
backend "gcs" {
  bucket = "your-project-terraform-state"
  prefix = "terraform/state"
}
```

Then:

```bash
# Create bucket first
gsutil mb gs://your-project-terraform-state

# Enable versioning
gsutil versioning set on gs://your-project-terraform-state

# Migrate state
terraform init -migrate-state
```

## Support

For issues or questions:

1. Check Terraform documentation: https://registry.terraform.io/providers/hashicorp/google
2. Review GCP documentation: https://cloud.google.com/docs
3. Contact team: cloud-team@example.com

## License

Internal use only - Canteen Queue Manager Project
