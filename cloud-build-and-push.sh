#!/bin/bash

# Script to build and push all Docker images using Google Cloud Build
# This ensures images are built for the correct architecture (linux/amd64)

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Building Images with Google Cloud Build                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get project ID
if [ -z "$1" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Error: No project ID provided and no default project set${NC}"
        echo "Usage: ./cloud-build-and-push.sh YOUR_PROJECT_ID"
        exit 1
    fi
else
    PROJECT_ID=$1
fi

echo -e "${BLUE}ℹ️  Using GCP Project: $PROJECT_ID${NC}"
echo ""

# Array of services to build
declare -a SERVICES=(
    "api-gateway"
    "user-service"
    "menu-service"
    "order-service"
    "payment-service"
    "queue-service"
    "frontend"
)

# Build and push each service using Cloud Build
TOTAL=${#SERVICES[@]}
CURRENT=0

for service in "${SERVICES[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}[$CURRENT/$TOTAL] Building $service with Cloud Build...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! -d "$service" ]; then
        echo -e "${YELLOW}⚠️  Warning: Directory $service not found, skipping...${NC}"
        continue
    fi
    
    IMAGE_NAME="gcr.io/$PROJECT_ID/canteen-$service"
    
    # Check if service has a cloudbuild.yaml file
    if [ -f "$service/cloudbuild.yaml" ]; then
        echo -e "${BLUE}Building with custom cloudbuild.yaml...${NC}"
        gcloud builds submit \
            --config="cloudbuild.yaml" \
            --project="$PROJECT_ID" \
            "./$service"
    else
        echo -e "${BLUE}Building with default configuration...${NC}"
        gcloud builds submit \
            --tag="$IMAGE_NAME:latest" \
            --project="$PROJECT_ID" \
            "./$service"
    fi
    
    echo -e "${GREEN}✅ Successfully built and pushed $service${NC}"
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              All Images Built and Pushed! 🎉                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ All images are now available in GCR${NC}"
echo ""
echo "View images in GCP Console:"
echo "https://console.cloud.google.com/gcr/images/$PROJECT_ID"
echo ""
echo "Next steps:"
echo "  1. Deploy to Kubernetes:"
echo "     cd kubernetes"
echo "     kubectl apply -f ."
echo ""
