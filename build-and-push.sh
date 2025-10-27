#!/bin/bash

# Script to build and push all Docker images to Google Container Registry
# Usage: ./build-and-push.sh [PROJECT_ID]

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Building and Pushing Docker Images to GCR                    ║"
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
        echo "Usage: ./build-and-push.sh YOUR_PROJECT_ID"
        echo "Or set default: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
else
    PROJECT_ID=$1
fi

echo -e "${BLUE}ℹ️  Using GCP Project: $PROJECT_ID${NC}"
echo ""

# Configure Docker for GCR
echo -e "${BLUE}ℹ️  Configuring Docker for GCR...${NC}"
gcloud auth configure-docker gcr.io --quiet

# Array of services to build
declare -a SERVICES=(

    "frontend"
)

# Build and push each service
TOTAL=${#SERVICES[@]}
CURRENT=0

for service in "${SERVICES[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}[$CURRENT/$TOTAL] Building $service...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! -d "$service" ]; then
        echo -e "${YELLOW}⚠️  Warning: Directory $service not found, skipping...${NC}"
        continue
    fi
    
    IMAGE_NAME="gcr.io/$PROJECT_ID/canteen-$service"
    
    # Build image
    echo -e "${BLUE}Building Docker image...${NC}"
    docker build -t "$IMAGE_NAME:latest" "./$service"
    
    # Tag with timestamp for versioning
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    docker tag "$IMAGE_NAME:latest" "$IMAGE_NAME:$TIMESTAMP"
    
    # Push both tags
    echo -e "${BLUE}Pushing to GCR...${NC}"
    docker push "$IMAGE_NAME:latest"
    docker push "$IMAGE_NAME:$TIMESTAMP"
    
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
echo "Or list images with:"
echo "  gcloud container images list --repository=gcr.io/$PROJECT_ID"
echo ""
echo "Next steps:"
echo "  1. Deploy infrastructure with Terraform (if not done)"
echo "  2. Deploy to Kubernetes:"
echo "     cd kubernetes"
echo "     ./update-project-id.sh $PROJECT_ID"
echo "     kubectl apply -f ."
echo ""
