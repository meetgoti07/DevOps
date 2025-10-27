#!/bin/bash

# Canteen Queue Manager - Initial GCP Setup Script
# This script automates the initial setup of GCP for the project

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Canteen Queue Manager - GCP Initial Setup                    ║"
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

# Check if required tools are installed
echo "📋 Checking prerequisites..."
echo ""

command -v gcloud >/dev/null 2>&1 || { print_error "gcloud CLI is required but not installed. Visit: https://cloud.google.com/sdk/docs/install"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { print_error "kubectl is required but not installed. Visit: https://kubernetes.io/docs/tasks/tools/"; exit 1; }
command -v terraform >/dev/null 2>&1 || { print_error "terraform is required but not installed. Visit: https://www.terraform.io/downloads"; exit 1; }

print_success "All required tools are installed"
echo ""

# Step 1: Project Configuration
echo "════════════════════════════════════════════════════════════════"
echo "Step 1: GCP Project Configuration"
echo "════════════════════════════════════════════════════════════════"
echo ""

print_info "First, let's find your billing account..."
gcloud billing accounts list
echo ""

read -p "Enter your Billing Account ID: " BILLING_ACCOUNT_ID

if [ -z "$BILLING_ACCOUNT_ID" ]; then
    print_error "Billing Account ID is required"
    exit 1
fi

# Generate unique project ID
TIMESTAMP=$(date +%s)
DEFAULT_PROJECT_ID="canteen-qm-${TIMESTAMP}"

echo ""
read -p "Enter GCP Project ID [${DEFAULT_PROJECT_ID}]: " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-$DEFAULT_PROJECT_ID}

read -p "Enter Project Name [Canteen Queue Manager]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-"Canteen Queue Manager"}

echo ""
print_info "Creating GCP project: $PROJECT_ID"

# Create project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME" 2>/dev/null || {
    print_warning "Project may already exist, continuing..."
}

# Link billing
print_info "Linking billing account..."
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# Set as default project
gcloud config set project $PROJECT_ID

print_success "Project configured: $PROJECT_ID"
echo ""

# Step 2: Enable APIs
echo "════════════════════════════════════════════════════════════════"
echo "Step 2: Enabling Required GCP APIs"
echo "════════════════════════════════════════════════════════════════"
echo ""

print_info "This will take 2-3 minutes..."

APIS=(
    "container.googleapis.com"
    "compute.googleapis.com"
    "sqladmin.googleapis.com"
    "redis.googleapis.com"
    "storage-api.googleapis.com"
    "cloudresourcemanager.googleapis.com"
    "iam.googleapis.com"
    "servicenetworking.googleapis.com"
    "monitoring.googleapis.com"
    "logging.googleapis.com"
    "cloudbuild.googleapis.com"
)

for api in "${APIS[@]}"; do
    print_info "Enabling $api..."
    gcloud services enable $api --quiet
done

print_success "All APIs enabled"
echo ""

# Step 3: Create Service Account for GitHub Actions
echo "════════════════════════════════════════════════════════════════"
echo "Step 3: Creating Service Account for GitHub Actions"
echo "════════════════════════════════════════════════════════════════"
echo ""

SA_NAME="github-actions"
SA_DISPLAY_NAME="GitHub Actions CI/CD"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

print_info "Creating service account: $SA_EMAIL"

gcloud iam service-accounts create $SA_NAME \
    --description="Service account for GitHub Actions CI/CD" \
    --display-name="$SA_DISPLAY_NAME" 2>/dev/null || {
    print_warning "Service account may already exist, continuing..."
}

# Grant roles
print_info "Granting IAM roles..."

ROLES=(
    "roles/container.admin"
    "roles/storage.admin"
    "roles/compute.admin"
    "roles/iam.serviceAccountUser"
    "roles/viewer"
)

for role in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="$role" \
        --quiet >/dev/null
done

# Create and download key
KEY_FILE="$HOME/gcp-github-actions-key.json"
print_info "Creating service account key..."

gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account=$SA_EMAIL

print_success "Service account key created: $KEY_FILE"
print_warning "⚠️  IMPORTANT: Keep this file secure! You'll need it for GitHub Secrets"
echo ""

# Step 4: Update Kubernetes manifests
echo "════════════════════════════════════════════════════════════════"
echo "Step 4: Updating Kubernetes Manifests"
echo "════════════════════════════════════════════════════════════════"
echo ""

print_info "Updating manifests with project ID..."

if [ -f "kubernetes/microservices.yaml" ]; then
    sed -i.bak "s|gcr.io/PROJECT_ID|gcr.io/$PROJECT_ID|g" kubernetes/microservices.yaml
    print_success "Updated kubernetes/microservices.yaml"
fi

if [ -f "kubernetes/frontend-gateway.yaml" ]; then
    sed -i.bak "s|gcr.io/PROJECT_ID|gcr.io/$PROJECT_ID|g" kubernetes/frontend-gateway.yaml
    print_success "Updated kubernetes/frontend-gateway.yaml"
fi

# Remove backup files
rm -f kubernetes/*.bak

echo ""

# Step 5: Create Terraform variables
echo "════════════════════════════════════════════════════════════════"
echo "Step 5: Creating Terraform Configuration"
echo "════════════════════════════════════════════════════════════════"
echo ""

print_info "Creating terraform/terraform.tfvars..."

cat > terraform/terraform.tfvars << EOF
project_id          = "$PROJECT_ID"
region              = "us-central1"
zone                = "us-central1-a"
environment         = "production"
cluster_name        = "canteen-gke-cluster"
node_count          = 3
node_machine_type   = "e2-standard-4"
min_node_count      = 2
max_node_count      = 5
disk_size_gb        = 50
enable_monitoring   = true
enable_backup       = true
database_tier       = "db-f1-micro"
redis_memory_size_gb = 1

tags = {
  project     = "canteen-queue-manager"
  managed_by  = "terraform"
  environment = "production"
}
EOF

print_success "Created terraform/terraform.tfvars"
echo ""

# Step 6: Summary and Next Steps
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

print_success "GCP project configured successfully!"
echo ""
echo "📝 Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project ID:          $PROJECT_ID"
echo "Project Name:        $PROJECT_NAME"
echo "Region:              us-central1"
echo "Service Account:     $SA_EMAIL"
echo "Key File:            $KEY_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "IMPORTANT: Configure GitHub Secrets"
echo ""
echo "Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "Add these secrets:"
echo "  1. GCP_PROJECT_ID"
echo "     Value: $PROJECT_ID"
echo ""
echo "  2. GCP_SA_KEY"
echo "     Value: (contents of $KEY_FILE)"
echo "     To copy: cat $KEY_FILE | pbcopy (macOS) or cat $KEY_FILE"
echo ""

print_info "Next Steps:"
echo ""
echo "1. Configure GitHub Secrets (see above)"
echo "2. Deploy infrastructure:"
echo "   cd terraform"
echo "   terraform init"
echo "   terraform apply"
echo ""
echo "3. Build and push Docker images:"
echo "   gcloud auth configure-docker gcr.io"
echo "   See DEPLOYMENT_GUIDE.md for complete instructions"
echo ""
echo "4. Deploy to Kubernetes:"
echo "   cd kubernetes"
echo "   ./deploy.sh"
echo ""
echo "5. Push code to GitHub to trigger CI/CD:"
echo "   git add ."
echo "   git commit -m 'Initial deployment setup'"
echo "   git push origin main"
echo ""

print_success "For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""

# Save configuration for reference
CONFIG_FILE="gcp-setup-config.txt"
cat > $CONFIG_FILE << EOF
GCP Setup Configuration
========================

Project ID: $PROJECT_ID
Project Name: $PROJECT_NAME
Region: us-central1
Zone: us-central1-a
Service Account: $SA_EMAIL
Key File: $KEY_FILE

Setup Date: $(date)

GitHub Secrets Required:
- GCP_PROJECT_ID: $PROJECT_ID
- GCP_SA_KEY: (contents of $KEY_FILE)

Next Steps: See DEPLOYMENT_GUIDE.md
EOF

print_success "Configuration saved to: $CONFIG_FILE"
echo ""
