#!/bin/bash

# Kubernetes Deployment Script for Canteen Queue Manager
# This script deploys the entire microservice architecture to Kubernetes

set -e

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
kubectl apply -f kubernetes/namespace.yaml
echo "✅ Namespace created"

# Step 2: Apply ConfigMap and Secrets
echo "🔧 Applying configuration..."
kubectl apply -f kubernetes/configmap.yaml
echo "✅ Configuration applied"

# Step 3: Deploy databases first (they need to be ready before services)
echo "🗄️  Deploying databases..."

echo "   Deploying PostgreSQL..."
kubectl apply -f kubernetes/postgres.yaml
wait_for_deployment postgres canteen-system

echo "   Deploying MongoDB..."
kubectl apply -f kubernetes/mongodb.yaml
wait_for_deployment mongodb canteen-system

echo "   Deploying MySQL..."
kubectl apply -f kubernetes/mysql.yaml
wait_for_deployment mysql canteen-system

echo "   Deploying Redis..."
kubectl apply -f kubernetes/redis.yaml
wait_for_deployment redis canteen-system

echo "✅ All databases deployed successfully"

# Step 4: Deploy RabbitMQ
echo "🐰 Deploying RabbitMQ..."
kubectl apply -f kubernetes/rabbitmq.yaml
wait_for_deployment rabbitmq canteen-system
echo "✅ RabbitMQ deployed successfully"

# Step 5: Build Docker images (if not already built)
echo "🐳 Building Docker images..."
if ! docker image inspect canteen-user-service:latest &> /dev/null; then
    echo "   Building User Service..."
    cd user-service && docker build -t canteen-user-service:latest . && cd ..
fi

if ! docker image inspect canteen-menu-service:latest &> /dev/null; then
    echo "   Building Menu Service..."
    cd menu-service && docker build -t canteen-menu-service:latest . && cd ..
fi

if ! docker image inspect canteen-order-service:latest &> /dev/null; then
    echo "   Building Order Service..."
    cd order-service && docker build -t canteen-order-service:latest . && cd ..
fi

if ! docker image inspect canteen-queue-service:latest &> /dev/null; then
    echo "   Building Queue Service..."
    cd queue-service && docker build -t canteen-queue-service:latest . && cd ..
fi

if ! docker image inspect canteen-payment-service:latest &> /dev/null; then
    echo "   Building Payment Service..."
    cd payment-service && docker build -t canteen-payment-service:latest . && cd ..
fi

if ! docker image inspect canteen-api-gateway:latest &> /dev/null; then
    echo "   Building API Gateway..."
    cd api-gateway && docker build -t canteen-api-gateway:latest . && cd ..
fi

if ! docker image inspect canteen-frontend:latest &> /dev/null; then
    echo "   Building Frontend..."
    cd frontend && docker build -t canteen-frontend:latest . && cd ..
fi

echo "✅ All Docker images ready"

# Step 6: Deploy microservices
echo "🔧 Deploying microservices..."
kubectl apply -f kubernetes/microservices.yaml

# Wait for each service to be ready
wait_for_deployment user-service canteen-system
wait_for_deployment menu-service canteen-system
wait_for_deployment order-service canteen-system
wait_for_deployment queue-service canteen-system
wait_for_deployment payment-service canteen-system

echo "✅ All microservices deployed successfully"

# Step 7: Deploy API Gateway and Frontend
echo "🌐 Deploying API Gateway and Frontend..."
kubectl apply -f kubernetes/frontend-gateway.yaml

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