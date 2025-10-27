#!/bin/bash

# Kubernetes Cleanup Script for Canteen Queue Manager
# This script removes all deployed resources

set -e

echo "🧹 Cleaning up Canteen Queue Manager from Kubernetes"
echo "===================================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace canteen-system &> /dev/null; then
    echo "ℹ️  Namespace 'canteen-system' does not exist. Nothing to clean up."
    exit 0
fi

echo "🗑️  Deleting all resources in canteen-system namespace..."

# Delete all resources in the namespace
kubectl delete namespace canteen-system

echo "⏳ Waiting for namespace deletion to complete..."
while kubectl get namespace canteen-system &> /dev/null; do
    echo "   Still deleting..."
    sleep 2
done

echo "✅ Cleanup completed successfully!"
echo ""
echo "🔍 Verify cleanup:"
echo "   kubectl get namespaces | grep canteen"
echo ""
echo "All Canteen Queue Manager resources have been removed from Kubernetes."