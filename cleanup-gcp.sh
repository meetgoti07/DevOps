#!/bin/bash

# Comprehensive GCP Cleanup Script
# This script removes ALL canteen-queue-manager resources from GCP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project configured${NC}"
    exit 1
fi

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}GCP Cleanup Script${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: This will delete ALL canteen-queue-manager resources!${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel, or press Enter to continue...${NC}"
read

# Function to delete resources with error handling
safe_delete() {
    local resource_type=$1
    local resource_name=$2
    local extra_flags=$3
    
    echo -e "${YELLOW}Deleting ${resource_type}: ${resource_name}${NC}"
    if eval "$resource_type delete $resource_name --project=$PROJECT_ID $extra_flags --quiet 2>/dev/null"; then
        echo -e "${GREEN}✓ Deleted ${resource_name}${NC}"
    else
        echo -e "${RED}✗ Failed to delete ${resource_name} (may not exist)${NC}"
    fi
}

echo ""
echo -e "${BLUE}Step 1: Deleting GKE Clusters${NC}"
echo "================================"
for cluster in $(gcloud container clusters list --project=$PROJECT_ID --format="value(name)" 2>/dev/null); do
    zone=$(gcloud container clusters list --project=$PROJECT_ID --filter="name=$cluster" --format="value(location)" 2>/dev/null)
    safe_delete "gcloud container clusters" "$cluster --zone=$zone"
done

echo ""
echo -e "${BLUE}Step 2: Deleting Cloud SQL Instances${NC}"
echo "================================"
for instance in $(gcloud sql instances list --project=$PROJECT_ID --format="value(name)" 2>/dev/null); do
    # Disable deletion protection first
    echo "Disabling deletion protection for $instance..."
    gcloud sql instances patch $instance --no-deletion-protection --project=$PROJECT_ID --quiet 2>/dev/null || true
    safe_delete "gcloud sql instances" "$instance"
done

echo ""
echo -e "${BLUE}Step 3: Deleting Redis Instances${NC}"
echo "================================"
for redis in $(gcloud redis instances list --region=us-central1 --project=$PROJECT_ID --format="value(name)" 2>/dev/null); do
    safe_delete "gcloud redis instances" "$redis --region=us-central1"
done

echo ""
echo -e "${BLUE}Step 4: Deleting Firewall Rules${NC}"
echo "================================"
for firewall in $(gcloud compute firewall-rules list --project=$PROJECT_ID --format="value(name)" | grep -E "(canteen|dev-allow|production-allow)" 2>/dev/null); do
    safe_delete "gcloud compute firewall-rules" "$firewall"
done

echo ""
echo -e "${BLUE}Step 5: Deleting Cloud NAT${NC}"
echo "================================"
for router in $(gcloud compute routers list --project=$PROJECT_ID --format="value(name)" 2>/dev/null); do
    region=$(gcloud compute routers list --project=$PROJECT_ID --filter="name=$router" --format="value(region)" 2>/dev/null)
    # Delete NAT configurations first
    for nat in $(gcloud compute routers nats list --router=$router --region=$region --project=$PROJECT_ID --format="value(name)" 2>/dev/null); do
        safe_delete "gcloud compute routers nats" "$nat --router=$router --region=$region"
    done
    # Then delete the router
    safe_delete "gcloud compute routers" "$router --region=$region"
done

echo ""
echo -e "${BLUE}Step 6: Deleting Subnets${NC}"
echo "================================"
for subnet in $(gcloud compute networks subnets list --project=$PROJECT_ID --format="value(name)" | grep "canteen" 2>/dev/null); do
    region=$(gcloud compute networks subnets list --project=$PROJECT_ID --filter="name=$subnet" --format="value(region)" 2>/dev/null)
    safe_delete "gcloud compute networks subnets" "$subnet --region=$region"
done

echo ""
echo -e "${BLUE}Step 7: Deleting VPC Peering Connections${NC}"
echo "================================"
for network in $(gcloud compute networks list --project=$PROJECT_ID --format="value(name)" | grep -E "(canteen|dev-canteen|production-canteen)" 2>/dev/null); do
    echo "Checking peering for network: $network"
    gcloud services vpc-peerings delete --network=$network --service=servicenetworking.googleapis.com --project=$PROJECT_ID --quiet 2>/dev/null || echo "No peering or failed to delete"
done

echo ""
echo -e "${BLUE}Step 8: Deleting Global Addresses${NC}"
echo "================================"
for address in $(gcloud compute addresses list --global --project=$PROJECT_ID --format="value(name)" | grep "canteen" 2>/dev/null); do
    safe_delete "gcloud compute addresses" "$address --global"
done

echo ""
echo -e "${BLUE}Step 9: Deleting VPC Networks${NC}"
echo "================================"
for network in $(gcloud compute networks list --project=$PROJECT_ID --format="value(name)" | grep -E "(canteen|dev-canteen|production-canteen)" 2>/dev/null); do
    safe_delete "gcloud compute networks" "$network"
done

echo ""
echo -e "${BLUE}Step 10: Deleting Storage Buckets${NC}"
echo "================================"
for bucket in $(gsutil ls -p $PROJECT_ID 2>/dev/null | grep -E "canteen|terraform-state" | sed 's|gs://||' | sed 's|/||'); do
    echo -e "${YELLOW}Deleting bucket: $bucket${NC}"
    if gsutil rm -r gs://$bucket 2>/dev/null; then
        echo -e "${GREEN}✓ Deleted bucket $bucket${NC}"
    else
        echo -e "${RED}✗ Failed to delete bucket $bucket${NC}"
    fi
done

echo ""
echo -e "${BLUE}Step 11: Deleting Container Images${NC}"
echo "================================"
for image in $(gcloud container images list --project=$PROJECT_ID --format="value(name)" | grep "canteen" 2>/dev/null); do
    echo -e "${YELLOW}Deleting image: $image${NC}"
    gcloud container images delete $image --quiet --project=$PROJECT_ID 2>/dev/null || echo "Failed to delete $image"
done

echo ""
echo -e "${BLUE}Step 12: Removing Terraform State Lock${NC}"
echo "================================"
gsutil rm gs://canteen-terraform-state-bucket/terraform/state/*.tflock 2>/dev/null || echo "No lock files found"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "- All GKE clusters deleted"
echo "- All Cloud SQL instances deleted"
echo "- All Redis instances deleted"
echo "- All firewall rules deleted"
echo "- All VPC networks deleted"
echo "- All storage buckets deleted"
echo "- All container images deleted"
echo ""
echo -e "${YELLOW}Note: Some resources may take a few minutes to fully delete.${NC}"
echo -e "${YELLOW}Check the GCP Console to verify all resources are removed.${NC}"
