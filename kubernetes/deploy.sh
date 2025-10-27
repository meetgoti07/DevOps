#!/bin/bash

# Kubernetes Deployment Script for Canteen Queue Manager
# This script deploys the entire microservice architecture to Kubernetes

set -e

# Ensure GKE auth plugin is in PATH
export PATH="${PATH}:/opt/homebrew/share/google-cloud-sdk/bin"
export USE_GKE_GCLOUD_AUTH_PLUGIN=True

echo "🚀 Starting Kubernetes Deployment for Canteen Queue Manager"
echo "============================================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if Kubernetes cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster connection verified"

# Function to wait for deployment to be ready
wait_for_deployment() {
    local deployment=$1
    local namespace=$2
    echo "⏳ Waiting for $deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n $namespace
    if [ $? -eq 0 ]; then
        echo "✅ $deployment is ready"
    else
        echo "❌ $deployment failed to become ready"
        return 1
    fi
}

# Function to wait for pod to be ready
wait_for_pod() {
    local app=$1
    local namespace=$2
    echo "⏳ Waiting for $app pods to be ready..."
    kubectl wait --for=condition=ready --timeout=300s pod -l app=$app -n $namespace
    if [ $? -eq 0 ]; then
        echo "✅ $app pods are ready"
    else
        echo "❌ $app pods failed to become ready"
        return 1
    fi
}

# Step 1: Create namespace
echo "📁 Creating namespace..."
kubectl apply -f namespace.yaml
echo "✅ Namespace created"

# Step 2: Apply ConfigMap and Secrets
echo "🔧 Applying configuration..."
kubectl apply -f configmap.yaml
echo "✅ Configuration applied"

# Step 2.5: Apply Network Policies (skip deprecated PodSecurityPolicy)
echo "🔒 Applying network policies..."
kubectl apply -f security-policies.yaml 2>&1 | grep -v "PodSecurityPolicy" || true
echo "✅ Network policies applied"

# Step 3: Deploy databases first (they need to be ready before services)
echo "🗄️  Deploying databases..."

echo "   Deploying PostgreSQL..."
kubectl apply -f postgres.yaml
wait_for_deployment postgres canteen-system

echo "   Deploying MongoDB..."
kubectl apply -f mongodb.yaml
wait_for_deployment mongodb canteen-system

echo "   Deploying MySQL..."
kubectl apply -f mysql.yaml
wait_for_deployment mysql canteen-system

echo "   Deploying Redis..."
kubectl apply -f redis.yaml
wait_for_deployment redis canteen-system

echo "✅ All databases deployed successfully"

# Step 4: Deploy RabbitMQ
echo "🐰 Deploying RabbitMQ..."
kubectl apply -f rabbitmq.yaml
wait_for_deployment rabbitmq canteen-system
echo "✅ RabbitMQ deployed successfully"

# Step 5: Deploy microservices
echo "🔧 Deploying microservices..."
kubectl apply -f microservices.yaml

# Wait for each service to be ready
wait_for_deployment user-service canteen-system
wait_for_deployment menu-service canteen-system
wait_for_deployment order-service canteen-system
wait_for_deployment queue-service canteen-system
wait_for_deployment payment-service canteen-system

echo "✅ All microservices deployed successfully"

# Step 7: Deploy API Gateway and Frontend
echo "🌐 Deploying API Gateway and Frontend..."
kubectl apply -f frontend-gateway.yaml

wait_for_deployment api-gateway canteen-system
wait_for_deployment frontend canteen-system

echo "✅ API Gateway and Frontend deployed successfully"

# Step 8: Display access information
echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo ""
echo "📝 Access Information:"
echo "   Frontend:           http://localhost:30000"
echo "   API Gateway:        http://localhost:30080"
echo "   RabbitMQ Management: http://localhost:30015 (guest/guest)"
echo ""
echo "🔍 Useful commands:"
echo "   kubectl get pods -n canteen-system"
echo "   kubectl get services -n canteen-system"
echo "   kubectl logs -f deployment/order-service -n canteen-system"
echo ""
echo "🧹 To clean up:"
echo "   kubectl delete namespace canteen-system"
echo ""

# Step 9: Show current status
echo "📊 Current Pod Status:"
kubectl get pods -n canteen-system

echo ""
echo "🌐 Current Service Status:"
kubectl get services -n canteen-system

echo ""
echo "✅ Canteen Queue Manager is now running on Kubernetes!"