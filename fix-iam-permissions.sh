#!/bin/bash

# Fix IAM Permissions for Service Networking
# This script adds the required servicenetworking.networksAdmin role to the GitHub Actions service account

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Fix IAM Permissions for Service Networking                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if gcloud is installed
command -v gcloud >/dev/null 2>&1 || { 
    print_error "gcloud CLI is required but not installed."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    print_error "No GCP project is configured."
    echo ""
    read -p "Enter your GCP Project ID: " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID is required"
        exit 1
    fi
    
    gcloud config set project $PROJECT_ID
fi

print_info "Using GCP Project: $PROJECT_ID"
echo ""

# Service Account details
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account exists
print_info "Checking if service account exists..."
if gcloud iam service-accounts describe $SA_EMAIL >/dev/null 2>&1; then
    print_success "Service account found: $SA_EMAIL"
else
    print_error "Service account not found: $SA_EMAIL"
    echo ""
    print_info "Please run setup-gcp.sh first to create the service account"
    exit 1
fi

echo ""
print_info "Adding IAM roles for Service Networking..."
echo ""

# Add Service Networking Admin role
print_info "Adding roles/servicenetworking.networksAdmin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/servicenetworking.networksAdmin" \
    --quiet

print_success "Added roles/servicenetworking.networksAdmin"

# Add Compute Network Admin role (needed for VPC peering)
print_info "Adding roles/compute.networkAdmin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/compute.networkAdmin" \
    --quiet

print_success "Added roles/compute.networkAdmin"

# Add Cloud SQL Admin role
print_info "Adding roles/cloudsql.admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.admin" \
    --quiet

print_success "Added roles/cloudsql.admin"

# Add Redis Admin role
print_info "Adding roles/redis.admin..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/redis.admin" \
    --quiet

print_success "Added roles/redis.admin"

echo ""
print_success "All IAM permissions added successfully!"
echo ""

# Display current roles
print_info "Current IAM roles for service account:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:serviceAccount:${SA_EMAIL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_success "Setup complete! You can now run Terraform apply."
echo ""
print_info "Next steps:"
echo "  1. cd terraform"
echo "  2. terraform init"
echo "  3. terraform apply"
echo ""
