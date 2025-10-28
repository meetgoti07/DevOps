#!/bin/bash

# Script to seed MongoDB in Kubernetes deployment
# This script copies the seed file to MongoDB pod and executes it

set -e

NAMESPACE="canteen-system"
SEED_FILE="k8s-seed.js"

echo "🌱 Starting MongoDB seeding in Kubernetes..."
echo "=========================================="

# Get MongoDB pod name
echo "📦 Getting MongoDB pod name..."
MONGO_POD=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

if [ -z "$MONGO_POD" ]; then
    echo "❌ Error: MongoDB pod not found in namespace $NAMESPACE"
    exit 1
fi

echo "✓ Found MongoDB pod: $MONGO_POD"

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
    echo "❌ Error: Seed file $SEED_FILE not found"
    exit 1
fi

echo "✓ Seed file found: $SEED_FILE"

# Copy seed file to MongoDB pod
echo ""
echo "📤 Copying seed file to MongoDB pod..."
kubectl cp $SEED_FILE $NAMESPACE/$MONGO_POD:/tmp/seed.js

if [ $? -eq 0 ]; then
    echo "✓ Seed file copied successfully"
else
    echo "❌ Error copying seed file"
    exit 1
fi

# Execute seed script with authentication
echo ""
echo "🚀 Executing seed script..."
echo "=========================================="
kubectl exec -n $NAMESPACE $MONGO_POD -- mongosh -u admin -p admin123 --authenticationDatabase admin --quiet --eval "load('/tmp/seed.js')"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Database seeded successfully!"
    echo ""
    echo "You can verify the data by running:"
    echo "  kubectl exec -n $NAMESPACE $MONGO_POD -- mongosh -u admin -p admin123 --authenticationDatabase admin --eval 'use menudb; db.menu_items.countDocuments()'"
else
    echo "❌ Error executing seed script"
    exit 1
fi
