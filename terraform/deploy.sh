#!/bin/bash

# Terraform Deployment Script for Canteen Queue Manager
# This script automates the infrastructure deployment on GCP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Canteen Queue Manager - Terraform Deploy${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install Terraform first."
        echo "Visit: https://www.terraform.io/downloads"
        exit 1
    fi
    print_info "✓ Terraform found: $(terraform version | head -n1)"
    
    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install Google Cloud SDK first."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_info "✓ gcloud found: $(gcloud version | head -n1)"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found. Please install kubectl first."
        echo "Run: gcloud components install kubectl"
        exit 1
    fi
    print_info "✓ kubectl found: $(kubectl version --client --short 2>/dev/null || echo 'installed')"
    
    echo ""
}

# Check if terraform.tfvars exists
check_tfvars() {
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found!"
        print_info "Creating from template..."
        
        if [ -f "terraform.tfvars.example" ]; then
            cp terraform.tfvars.example terraform.tfvars
            print_warning "Please edit terraform.tfvars with your GCP project details"
            echo "Required: project_id, region, zone"
            echo ""
            read -p "Press Enter after updating terraform.tfvars..."
        else
            print_error "terraform.tfvars.example not found"
            exit 1
        fi
    fi
    print_info "✓ terraform.tfvars found"
    echo ""
}

# Enable GCP APIs
enable_gcp_apis() {
    print_info "Enabling required GCP APIs..."
    
    # Extract project_id from terraform.tfvars
    PROJECT_ID=$(grep 'project_id' terraform.tfvars | cut -d'"' -f2)
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Could not find project_id in terraform.tfvars"
        exit 1
    fi
    
    print_info "Using project: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    APIS=(
        "compute.googleapis.com"
        "container.googleapis.com"
        "sqladmin.googleapis.com"
        "redis.googleapis.com"
        "servicenetworking.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
        "storage.googleapis.com"
        "binaryauthorization.googleapis.com"
    )
    
    for api in "${APIS[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null || true
    done
    
    print_info "✓ All APIs enabled"
    echo ""
}

# Initialize Terraform
init_terraform() {
    print_info "Initializing Terraform..."
    terraform init
    echo ""
}

# Validate Terraform configuration
validate_terraform() {
    print_info "Validating Terraform configuration..."
    terraform validate
    
    if [ $? -eq 0 ]; then
        print_info "✓ Configuration is valid"
    else
        print_error "Configuration validation failed"
        exit 1
    fi
    echo ""
}

# Plan Terraform deployment
plan_terraform() {
    print_info "Creating Terraform execution plan..."
    terraform plan -out=tfplan
    echo ""
    
    print_warning "Review the execution plan above."
    read -p "Do you want to proceed with deployment? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    echo ""
}

# Apply Terraform
apply_terraform() {
    print_info "Applying Terraform configuration..."
    print_warning "This will take 15-20 minutes..."
    echo ""
    
    terraform apply tfplan
    
    if [ $? -eq 0 ]; then
        print_info "✓ Infrastructure deployed successfully!"
    else
        print_error "Deployment failed"
        exit 1
    fi
    echo ""
}

# Configure kubectl
configure_kubectl() {
    print_info "Configuring kubectl..."
    
    CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null)
    ZONE=$(grep 'zone' terraform.tfvars | head -n1 | cut -d'"' -f2)
    PROJECT_ID=$(grep 'project_id' terraform.tfvars | cut -d'"' -f2)
    
    if [ -z "$CLUSTER_NAME" ]; then
        print_warning "Could not get cluster name from Terraform output"
        CLUSTER_NAME="canteen-gke-cluster"
    fi
    
    print_info "Getting credentials for cluster: $CLUSTER_NAME"
    gcloud container clusters get-credentials "$CLUSTER_NAME" \
        --zone "$ZONE" \
        --project "$PROJECT_ID"
    
    print_info "✓ kubectl configured"
    kubectl get nodes
    echo ""
}

# Display outputs
display_outputs() {
    print_info "Deployment Summary:"
    echo "===================="
    
    echo ""
    echo "GKE Cluster:"
    terraform output cluster_name
    
    echo ""
    echo "Database Credentials (save these securely):"
    echo "PostgreSQL:"
    echo "  Host: $(terraform output -raw postgres_private_ip)"
    echo "  Username: $(terraform output -raw postgres_username)"
    echo "  Password: $(terraform output -raw postgres_password)"
    
    echo ""
    echo "MySQL:"
    echo "  Host: $(terraform output -raw mysql_private_ip)"
    echo "  Username: $(terraform output -raw mysql_username)"
    echo "  Password: $(terraform output -raw mysql_password)"
    
    echo ""
    echo "Redis:"
    echo "  Host: $(terraform output -raw redis_host)"
    echo "  Port: $(terraform output -raw redis_port)"
    
    echo ""
    echo "Storage Buckets:"
    terraform output app_storage_bucket
    terraform output backup_storage_bucket
    
    echo ""
    print_info "Next steps:"
    echo "1. Deploy applications to GKE:"
    echo "   cd ../kubernetes && ./deploy.sh"
    echo ""
    echo "2. Create Kubernetes secrets with database credentials:"
    echo "   kubectl create secret generic db-credentials \\"
    echo "     --from-literal=postgres-password=\$(terraform output -raw postgres_password) \\"
    echo "     --from-literal=mysql-password=\$(terraform output -raw mysql_password) \\"
    echo "     -n canteen-system"
    echo ""
    echo "3. Access monitoring:"
    echo "   https://console.cloud.google.com/monitoring"
    echo ""
}

# Save credentials to file
save_credentials() {
    print_info "Saving credentials to .credentials file..."
    
    cat > .credentials << EOF
# Canteen Queue Manager - Infrastructure Credentials
# Generated: $(date)
# WARNING: Keep this file secure and do not commit to version control

PROJECT_ID=$(grep 'project_id' terraform.tfvars | cut -d'"' -f2)

# PostgreSQL
POSTGRES_HOST=$(terraform output -raw postgres_private_ip)
POSTGRES_USER=$(terraform output -raw postgres_username)
POSTGRES_PASSWORD=$(terraform output -raw postgres_password)

# MySQL
MYSQL_HOST=$(terraform output -raw mysql_private_ip)
MYSQL_USER=$(terraform output -raw mysql_username)
MYSQL_PASSWORD=$(terraform output -raw mysql_password)

# Redis
REDIS_HOST=$(terraform output -raw redis_host)
REDIS_PORT=$(terraform output -raw redis_port)

# GKE
CLUSTER_NAME=$(terraform output -raw cluster_name)
CLUSTER_ZONE=$(grep 'zone' terraform.tfvars | head -n1 | cut -d'"' -f2)

# kubectl config command
# gcloud container clusters get-credentials \$CLUSTER_NAME --zone \$CLUSTER_ZONE --project \$PROJECT_ID
EOF
    
    chmod 600 .credentials
    print_info "✓ Credentials saved to .credentials (secure mode)"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    check_tfvars
    enable_gcp_apis
    init_terraform
    validate_terraform
    plan_terraform
    apply_terraform
    configure_kubectl
    save_credentials
    display_outputs
    
    echo ""
    print_info "========================================="
    print_info "Deployment Complete! 🎉"
    print_info "========================================="
}

# Run main function
main
