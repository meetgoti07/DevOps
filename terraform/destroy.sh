#!/bin/bash

# Terraform Destroy Script for Canteen Queue Manager
# WARNING: This will delete ALL infrastructure resources

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}================================================${NC}"
echo -e "${RED}WARNING: Infrastructure Destruction${NC}"
echo -e "${RED}================================================${NC}"
echo ""
echo "This will permanently delete:"
echo "  - GKE Cluster and all running workloads"
echo "  - Cloud SQL databases (PostgreSQL and MySQL)"
echo "  - Redis instance"
echo "  - Storage buckets (if empty)"
echo "  - VPC network and firewall rules"
echo "  - Monitoring dashboards and alerts"
echo ""

read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm

if [ "$confirm" != "destroy" ]; then
    echo "Destruction cancelled"
    exit 0
fi

echo ""
read -p "Last chance - Type 'yes' to proceed: " final_confirm

if [ "$final_confirm" != "yes" ]; then
    echo "Destruction cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting infrastructure destruction...${NC}"
echo ""

terraform destroy -auto-approve

echo ""
echo -e "${RED}Infrastructure destroyed${NC}"
echo ""
echo "Cleanup complete. All resources have been deleted."
echo "Note: Some resources may take a few minutes to fully delete."
