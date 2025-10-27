#!/bin/bash

# Script to update PROJECT_ID in Kubernetes manifests
# Usage: ./update-project-id.sh YOUR_GCP_PROJECT_ID

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GCP Project ID"
    echo "Usage: ./update-project-id.sh YOUR_GCP_PROJECT_ID"
    exit 1
fi

PROJECT_ID=$1

echo "🔄 Updating Kubernetes manifests with Project ID: $PROJECT_ID"

# Update microservices.yaml
sed -i.bak "s|gcr.io/PROJECT_ID|gcr.io/$PROJECT_ID|g" microservices.yaml
echo "✅ Updated microservices.yaml"

# Update frontend-gateway.yaml
sed -i.bak "s|gcr.io/PROJECT_ID|gcr.io/$PROJECT_ID|g" frontend-gateway.yaml
echo "✅ Updated frontend-gateway.yaml"

# Remove backup files
rm -f *.bak

echo ""
echo "✅ All Kubernetes manifests updated successfully!"
echo ""
echo "Next steps:"
echo "1. Review the updated manifests: git diff"
echo "2. Apply to cluster: kubectl apply -f ."
