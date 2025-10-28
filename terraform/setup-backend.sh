#!/bin/bash

# Setup script for Terraform remote backend on GCS
# This script creates a GCS bucket for storing Terraform state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project configured${NC}"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Using GCP Project: ${PROJECT_ID}${NC}"

# Define bucket name (must be globally unique)
BUCKET_NAME="canteen-terraform-state-bucket"
LOCATION="us-central1"

# Check if bucket already exists
if gsutil ls -b gs://${BUCKET_NAME} &>/dev/null; then
    echo -e "${YELLOW}Bucket ${BUCKET_NAME} already exists${NC}"
else
    echo -e "${GREEN}Creating GCS bucket for Terraform state...${NC}"
    
    # Create the bucket
    gsutil mb -p ${PROJECT_ID} -l ${LOCATION} gs://${BUCKET_NAME}
    
    # Enable versioning on the bucket
    gsutil versioning set on gs://${BUCKET_NAME}
    
    # Set uniform bucket-level access
    gsutil uniformbucketlevelaccess set on gs://${BUCKET_NAME}
    
    echo -e "${GREEN}✓ Bucket created successfully${NC}"
fi

# Configure bucket for security best practices
echo -e "${GREEN}Configuring bucket security...${NC}"

# Set lifecycle rule to delete old versions after 30 days
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "numNewerVersions": 3,
          "isLive": false
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://${BUCKET_NAME}
rm /tmp/lifecycle.json

echo -e "${GREEN}✓ Bucket security configured${NC}"

# Initialize Terraform with the new backend
echo -e "${GREEN}Initializing Terraform with remote backend...${NC}"

cd "$(dirname "$0")"

# Create a temporary backend config file
cat > backend-config.tfvars <<EOF
bucket = "${BUCKET_NAME}"
prefix = "terraform/state"
EOF

# Initialize Terraform
if terraform init -backend-config=backend-config.tfvars -migrate-state; then
    echo -e "${GREEN}✓ Terraform backend configured successfully${NC}"
    rm backend-config.tfvars
else
    echo -e "${RED}Error: Failed to initialize Terraform backend${NC}"
    rm backend-config.tfvars
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Backend Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Terraform state is now stored in:"
echo "  gs://${BUCKET_NAME}/terraform/state"
echo ""
echo "Your local state has been migrated to the remote backend."
echo "You can now safely commit your changes and use Terraform in CI/CD."
