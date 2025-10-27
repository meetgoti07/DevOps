# Quick Start Guide

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Prerequisites

✅ GCP Account with billing enabled  
✅ GitHub Account  
✅ Install: `gcloud`, `kubectl`, `terraform`, `docker`

## 🚀 Quick Deployment (5 Steps)

### Step 1: Initial GCP Setup (5 minutes)

```bash
# Make scripts executable
chmod +x setup-gcp.sh build-and-push.sh

# Run automated setup
./setup-gcp.sh
```

This script will:

- Create GCP project
- Enable required APIs
- Create service account for GitHub Actions
- Update Kubernetes manifests
- Generate Terraform config

**Output:** Save the Project ID and key file path shown at the end.

### Step 2: Configure GitHub Secrets (2 minutes)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - **GCP_PROJECT_ID**: Your project ID from Step 1
   - **GCP_SA_KEY**: Copy-paste contents of the JSON key file

```bash
# To view the key file content:
cat ~/gcp-github-actions-key.json
```

### Step 3: Deploy Infrastructure (10 minutes)

```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve

# Configure kubectl
gcloud container clusters get-credentials canteen-gke-cluster \
  --zone us-central1-a \
  --project YOUR_PROJECT_ID
```

### Step 4: Build & Push Images (10 minutes)

```bash
cd ..
./build-and-push.sh YOUR_PROJECT_ID
```

### Step 5: Deploy Application (5 minutes)

```bash
cd kubernetes
chmod +x update-project-id.sh
./update-project-id.sh YOUR_PROJECT_ID

# Deploy everything
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f mongodb.yaml
kubectl apply -f mysql.yaml
kubectl apply -f redis.yaml
kubectl apply -f rabbitmq.yaml

# Wait for databases (2-3 min)
kubectl wait --for=condition=available --timeout=300s \
  deployment/postgres deployment/mongodb deployment/mysql deployment/redis deployment/rabbitmq \
  -n canteen-system

# Deploy services
kubectl apply -f microservices.yaml
kubectl apply -f frontend-gateway.yaml

# Wait for services (3-5 min)
kubectl wait --for=condition=available --timeout=300s \
  deployment/user-service deployment/menu-service deployment/order-service \
  deployment/queue-service deployment/payment-service deployment/api-gateway deployment/frontend \
  -n canteen-system
```

### Get Your Application URL

```bash
# Wait for external IP (may take 2-3 minutes)
kubectl get service api-gateway -n canteen-system -w

# Once IP appears, access your app:
# http://<EXTERNAL-IP>
```

## ✅ Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n canteen-system

# Check services
kubectl get services -n canteen-system

# Test API
EXTERNAL_IP=$(kubectl get service api-gateway -n canteen-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP/health

# Open in browser
open http://$EXTERNAL_IP
```

## 🔄 Enable CI/CD

```bash
# Push to GitHub to trigger automated deployment
git add .
git commit -m "Initial deployment setup"
git push origin main

# Watch deployment in GitHub Actions tab
```

**From now on**, every push to `main` will automatically:

1. Run tests
2. Build Docker images
3. Push to GCR
4. Deploy to GKE
5. Run integration tests

## 📊 Common Commands

```bash
# View logs
kubectl logs -f deployment/order-service -n canteen-system

# Scale service
kubectl scale deployment/order-service --replicas=3 -n canteen-system

# Restart service
kubectl rollout restart deployment/order-service -n canteen-system

# View external IP
kubectl get service api-gateway -n canteen-system

# Access database
kubectl exec -it deployment/postgres -n canteen-system -- psql -U admin -d userdb
```

## 🛑 Cleanup

```bash
# Delete applications only
kubectl delete namespace canteen-system

# Delete infrastructure
cd terraform
terraform destroy -auto-approve

# Delete project (optional)
gcloud projects delete YOUR_PROJECT_ID
```

## 🆘 Troubleshooting

**Pods not starting?**

```bash
kubectl describe pod <pod-name> -n canteen-system
kubectl logs <pod-name> -n canteen-system
```

**Can't access application?**

```bash
# Check if LoadBalancer IP is assigned
kubectl get service api-gateway -n canteen-system

# Check gateway logs
kubectl logs -l app=api-gateway -n canteen-system
```

**GitHub Actions failing?**

- Verify GitHub secrets are set correctly
- Check service account has correct permissions
- Review workflow logs in Actions tab

## 📚 Full Documentation

For detailed explanations and advanced configurations, see:

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [terraform/README.md](terraform/README.md) - Infrastructure details
- [kubernetes/](kubernetes/) - Kubernetes manifests

## 🎯 Architecture

```
Internet → LoadBalancer → API Gateway → Microservices
                                      ↓
                              Databases (PostgreSQL, MySQL, MongoDB, Redis)
                                      ↓
                              RabbitMQ Message Broker
```

**Your single endpoint:** `http://<EXTERNAL-IP>`

- Frontend: `/`
- API: `/api/*`
- All services accessible through gateway

---

**Need help?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.
