# Canteen Queue Manager - End-to-End Deployment Guide

## 🎯 Overview

This guide will help you deploy the Canteen Queue Manager system to Google Cloud Platform (GCP) with automated CI/CD using GitHub Actions. The deployment includes:

- **Infrastructure**: GKE cluster, Cloud SQL (PostgreSQL, MySQL), Cloud Memorystore (Redis), VPC networking
- **Microservices**: 5 backend services (User, Menu, Order, Queue, Payment)
- **Frontend**: Next.js application
- **API Gateway**: NGINX reverse proxy
- **CI/CD**: Automated build, test, and deployment on every push

## 📋 Prerequisites

Before starting, ensure you have:

1. **GCP Account** with billing enabled
2. **GitHub Account** with a repository for this project
3. **Local Tools Installed**:
   - `gcloud` CLI ([Install](https://cloud.google.com/sdk/docs/install))
   - `kubectl` ([Install](https://kubernetes.io/docs/tasks/tools/))
   - `terraform` ([Install](https://www.terraform.io/downloads))
   - `git`

## 🚀 Deployment Steps

### Phase 1: Initial GCP Setup (One-time)

#### Step 1.1: Create GCP Project

```bash
# Set your project name
export PROJECT_ID="canteen-queue-manager-$(date +%s)"
export PROJECT_NAME="Canteen Queue Manager"
export BILLING_ACCOUNT_ID="YOUR_BILLING_ACCOUNT_ID"

# Create new GCP project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Link billing account
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID

# Set as default project
gcloud config set project $PROJECT_ID
```

**To find your billing account ID:**
```bash
gcloud billing accounts list
```

#### Step 1.2: Enable Required GCP APIs

```bash
# Enable all required APIs (takes 2-3 minutes)
gcloud services enable \
  container.googleapis.com \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage-api.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  servicenetworking.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudbuild.googleapis.com
```

#### Step 1.3: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions CI/CD" \
  --display-name="GitHub Actions"

# Get service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/container.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create ~/gcp-key.json \
  --iam-account=$SA_EMAIL

echo "✅ Service account key saved to ~/gcp-key.json"
echo "⚠️  Keep this file secure! You'll upload it to GitHub Secrets"
```

### Phase 2: GitHub Repository Setup

#### Step 2.1: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd /Users/meetgoti/Documents/Study/SEM7/Cloud/canteen-queue-manager
git init

# Add all files
git add .
git commit -m "Initial commit: Canteen Queue Manager system"

# Create GitHub repository (using GitHub CLI or web interface)
# Via GitHub CLI:
gh repo create canteen-queue-manager --public --source=. --remote=origin --push

# OR via web, then:
git remote add origin https://github.com/YOUR_USERNAME/canteen-queue-manager.git
git branch -M main
git push -u origin main
```

#### Step 2.2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

1. **GCP_PROJECT_ID**
   - Value: Your GCP project ID (from `echo $PROJECT_ID`)

2. **GCP_SA_KEY**
   - Value: Contents of `~/gcp-key.json`
   - To get the content: `cat ~/gcp-key.json | base64`
   - Paste the entire JSON content (not base64 encoded, just the JSON)

3. **SLACK_WEBHOOK** (Optional, for notifications)
   - Value: Your Slack webhook URL (or leave empty to skip notifications)

**Visual Guide:**
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

Name: GCP_PROJECT_ID
Value: your-project-id-12345

Name: GCP_SA_KEY
Value: {
  "type": "service_account",
  "project_id": "your-project-id",
  ...
}
```

### Phase 3: Infrastructure Deployment with Terraform

#### Step 3.1: Configure Terraform Variables

```bash
cd terraform

# Create terraform.tfvars from template
cat > terraform.tfvars << EOF
project_id          = "$PROJECT_ID"
region              = "us-central1"
zone                = "us-central1-a"
environment         = "production"
cluster_name        = "canteen-gke-cluster"
node_count          = 3
node_machine_type   = "e2-standard-4"
min_node_count      = 2
max_node_count      = 5
disk_size_gb        = 50
enable_monitoring   = true
enable_backup       = true
database_tier       = "db-f1-micro"
redis_memory_size_gb = 1

tags = {
  project     = "canteen-queue-manager"
  managed_by  = "terraform"
  environment = "production"
}
EOF
```

#### Step 3.2: Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure (takes 10-15 minutes)
terraform apply -auto-approve

# Save outputs for later
terraform output -json > ../terraform-outputs.json
```

**What Terraform Creates:**
- ✅ GKE Kubernetes Cluster (3 nodes)
- ✅ VPC Network with subnets
- ✅ Cloud SQL instances (PostgreSQL, MySQL)
- ✅ Redis instance
- ✅ Storage buckets
- ✅ Firewall rules
- ✅ IAM service accounts

#### Step 3.3: Configure kubectl

```bash
# Get cluster credentials
gcloud container clusters get-credentials canteen-gke-cluster \
  --zone us-central1-a \
  --project $PROJECT_ID

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Phase 4: Initial Application Deployment

#### Step 4.1: Build and Push Docker Images

```bash
# Return to project root
cd ..

# Configure Docker for GCR
gcloud auth configure-docker gcr.io

# Build and push all images
export GCP_PROJECT_ID=$(gcloud config get-value project)

# Array of services
services=("user-service" "menu-service" "order-service" "queue-service" "payment-service" "api-gateway" "frontend")

for service in "${services[@]}"; do
  echo "Building $service..."
  docker build -t gcr.io/$GCP_PROJECT_ID/canteen-$service:latest ./$service
  docker push gcr.io/$GCP_PROJECT_ID/canteen-$service:latest
done

echo "✅ All images pushed to GCR"
```

#### Step 4.2: Update Kubernetes Manifests

The manifests need to reference your GCR images. This is already configured in the updated files (see Phase 5).

#### Step 4.3: Deploy to Kubernetes

```bash
cd kubernetes

# Create namespace
kubectl apply -f namespace.yaml

# Apply ConfigMaps and Secrets
kubectl apply -f configmap.yaml

# Deploy databases
kubectl apply -f postgres.yaml
kubectl apply -f mongodb.yaml
kubectl apply -f mysql.yaml
kubectl apply -f redis.yaml

# Wait for databases to be ready (2-3 minutes)
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n canteen-system
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n canteen-system
kubectl wait --for=condition=available --timeout=300s deployment/mysql -n canteen-system
kubectl wait --for=condition=available --timeout=300s deployment/redis -n canteen-system

# Deploy RabbitMQ
kubectl apply -f rabbitmq.yaml
kubectl wait --for=condition=available --timeout=300s deployment/rabbitmq -n canteen-system

# Deploy microservices
kubectl apply -f microservices.yaml

# Wait for services (3-5 minutes)
kubectl wait --for=condition=available --timeout=300s \
  deployment/user-service \
  deployment/menu-service \
  deployment/order-service \
  deployment/queue-service \
  deployment/payment-service \
  -n canteen-system

# Deploy frontend and gateway
kubectl apply -f frontend-gateway.yaml

kubectl wait --for=condition=available --timeout=300s \
  deployment/api-gateway \
  deployment/frontend \
  -n canteen-system

echo "✅ All services deployed!"
```

#### Step 4.4: Get External IP Address

```bash
# Get the LoadBalancer IP (may take 2-3 minutes to assign)
kubectl get service api-gateway -n canteen-system

# Wait for EXTERNAL-IP to appear (not <pending>)
watch kubectl get service api-gateway -n canteen-system

# Once you have the IP, set it
export EXTERNAL_IP=$(kubectl get service api-gateway -n canteen-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "🌐 Your application is accessible at: http://$EXTERNAL_IP"
```

### Phase 5: Configure Automated CI/CD

#### Step 5.1: Test GitHub Actions

Now that everything is set up, test the CI/CD pipeline:

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: Trigger CI/CD pipeline"
git push origin main
```

#### Step 5.2: Monitor Deployment

Go to your GitHub repository → **Actions** tab

You should see workflows running:
1. **Infrastructure Deployment** - Validates Terraform
2. **CI/CD Pipeline** - Builds, tests, and deploys

**Expected workflow:**
```
Code Quality & Security Scan (2-3 min)
↓
Build All Services (5-7 min)
↓
Build Docker Images (10-15 min)
↓
Deploy to GKE (3-5 min)
↓
Integration Tests (2-3 min)
↓
✅ Deployment Complete!
```

### Phase 6: Verify Deployment

#### Step 6.1: Check All Pods

```bash
# View all pods
kubectl get pods -n canteen-system

# All pods should show STATUS: Running
```

#### Step 6.2: Check Services

```bash
# View all services
kubectl get services -n canteen-system

# Check external IP
kubectl get service api-gateway -n canteen-system
```

#### Step 6.3: Test Application

```bash
# Get the external IP
export EXTERNAL_IP=$(kubectl get service api-gateway -n canteen-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test API Gateway health
curl http://$EXTERNAL_IP/health

# Test service health
curl http://$EXTERNAL_IP/health/user-service
curl http://$EXTERNAL_IP/health/menu-service
curl http://$EXTERNAL_IP/health/order-service

# Open frontend in browser
open http://$EXTERNAL_IP
```

### Phase 7: Ongoing Workflow

#### Daily Development Workflow

```bash
# 1. Make changes to your code
vim frontend/app/page.tsx

# 2. Commit changes
git add .
git commit -m "feat: Add new feature"

# 3. Push to GitHub
git push origin main

# 4. GitHub Actions automatically:
#    - Runs tests
#    - Builds Docker images
#    - Pushes to GCR
#    - Updates GKE deployments
#    - Runs integration tests

# 5. Check deployment status
kubectl get pods -n canteen-system
kubectl rollout status deployment/frontend -n canteen-system
```

#### Monitoring and Logs

```bash
# View logs for a service
kubectl logs -f deployment/order-service -n canteen-system

# View logs for multiple pods
kubectl logs -l app=frontend -n canteen-system --all-containers=true

# Check pod resources
kubectl top pods -n canteen-system

# Check node resources
kubectl top nodes

# View events
kubectl get events -n canteen-system --sort-by='.lastTimestamp'
```

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          Internet                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Load Balancer                │
│                    (External IP: x.x.x.x)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      GKE Cluster                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NGINX API Gateway                        │  │
│  │              (Port 80/443)                           │  │
│  └───────┬──────────────────────────────────────────────┘  │
│          │                                                   │
│  ┌───────┴────────┬────────────┬────────────┬──────────┐   │
│  │                │            │            │          │   │
│  ▼                ▼            ▼            ▼          ▼   │
│ ┌──────┐   ┌──────────┐  ┌──────────┐ ┌────────┐ ┌────┐  │
│ │User  │   │Menu      │  │Order     │ │Queue   │ │Pay │  │
│ │Svc   │   │Service   │  │Service   │ │Service │ │Svc │  │
│ │Java  │   │Node.js   │  │Python    │ │Go      │ │Py  │  │
│ └──┬───┘   └────┬─────┘  └────┬─────┘ └───┬────┘ └─┬──┘  │
│    │            │             │            │         │     │
│  ┌─▼────┐   ┌──▼─────┐   ┌───▼────┐   ┌──▼─────┐  │     │
│  │Cloud │   │MongoDB │   │Cloud   │   │Redis   │  │     │
│  │SQL   │   │        │   │SQL     │   │        │  │     │
│  │PG    │   │        │   │MySQL   │   │        │  │     │
│  └──────┘   └────────┘   └───┬────┘   └────────┘  │     │
│                               │                      │     │
│  ┌────────────────────────────┴──────────────────────┘    │
│  │              RabbitMQ Message Broker                    │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend                         │  │
│  │              (Served at /)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline Flow

```
┌──────────────────┐
│  Push to GitHub  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────┐
│  GitHub Actions Triggered          │
│  - Code Quality Scan               │
│  - Security Scanning               │
│  - Secret Detection                │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Build & Test All Services         │
│  - Java (Maven)                    │
│  - Node.js (pnpm)                  │
│  - Python (pytest)                 │
│  - Go (go test)                    │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Build Docker Images               │
│  - Push to GCR                     │
│  - Tag with commit SHA             │
│  - Scan images with Trivy          │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Deploy to GKE                     │
│  - Update deployment images        │
│  - Rolling update                  │
│  - Wait for rollout                │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Integration Tests                 │
│  - Health checks                   │
│  - Smoke tests                     │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Notification                      │
│  - Slack/Email alert               │
└────────────────────────────────────┘
```

## 🔧 Configuration Files Updated

The following files have been updated for GCP deployment:

1. **kubernetes/microservices.yaml** - Uses GCR images
2. **kubernetes/frontend-gateway.yaml** - LoadBalancer service
3. **.github/workflows/ci-cd.yml** - Complete CI/CD pipeline
4. **.github/workflows/infrastructure.yml** - Infrastructure validation
5. **terraform/terraform.tfvars** - Your specific configuration

## 📝 Important Commands Reference

### GKE Management
```bash
# Get cluster credentials
gcloud container clusters get-credentials canteen-gke-cluster --zone us-central1-a

# Scale deployment
kubectl scale deployment/order-service --replicas=3 -n canteen-system

# Restart deployment
kubectl rollout restart deployment/order-service -n canteen-system

# View deployment history
kubectl rollout history deployment/order-service -n canteen-system

# Rollback deployment
kubectl rollout undo deployment/order-service -n canteen-system
```

### Debugging
```bash
# Get pod details
kubectl describe pod <pod-name> -n canteen-system

# Execute command in pod
kubectl exec -it <pod-name> -n canteen-system -- /bin/sh

# Port forward to local
kubectl port-forward service/order-service 8000:8000 -n canteen-system

# View resource usage
kubectl top pods -n canteen-system
kubectl top nodes
```

### Database Access
```bash
# Connect to PostgreSQL
kubectl exec -it deployment/postgres -n canteen-system -- psql -U admin -d userdb

# Connect to MongoDB
kubectl exec -it deployment/mongodb -n canteen-system -- mongo menudb

# Connect to MySQL
kubectl exec -it deployment/mysql -n canteen-system -- mysql -u admin -padmin123 orderdb

# Connect to Redis
kubectl exec -it deployment/redis -n canteen-system -- redis-cli
```

## 🛡️ Security Best Practices

1. **Secrets Management**: Never commit secrets to Git
   - Use GitHub Secrets for CI/CD credentials
   - Use Kubernetes Secrets for application credentials
   - Consider Google Secret Manager for production

2. **Network Security**:
   - Services communicate within VPC
   - Only API Gateway is publicly exposed
   - Use Cloud Armor for DDoS protection (optional)

3. **Image Security**:
   - Scan images with Trivy before deployment
   - Use minimal base images
   - Keep dependencies updated

4. **Access Control**:
   - Use GCP IAM for fine-grained permissions
   - Enable GKE workload identity
   - Implement RBAC in Kubernetes

## 📈 Monitoring and Observability

### Cloud Console
1. Go to [GCP Console](https://console.cloud.google.com)
2. Navigate to **Kubernetes Engine** → **Workloads**
3. View metrics, logs, and health status

### Logs
```bash
# View logs in Cloud Logging
gcloud logging read "resource.type=k8s_container AND resource.labels.namespace_name=canteen-system" --limit 50

# Stream logs
kubectl logs -f deployment/order-service -n canteen-system
```

### Metrics
```bash
# View in Cloud Monitoring
# Go to: Monitoring → Metrics Explorer
# Add filters for GKE cluster and namespace

# Or use kubectl
kubectl top pods -n canteen-system
```

## 🧹 Cleanup and Teardown

### Option 1: Delete Everything (including infrastructure)

```bash
# Delete Kubernetes resources
kubectl delete namespace canteen-system

# Destroy Terraform infrastructure
cd terraform
terraform destroy -auto-approve

# Delete Docker images from GCR
gcloud container images list --repository=gcr.io/$PROJECT_ID
gcloud container images delete gcr.io/$PROJECT_ID/canteen-user-service --force-delete-tags

# Delete GCP project (CAUTION: This deletes everything!)
gcloud projects delete $PROJECT_ID
```

### Option 2: Keep Infrastructure, Delete Applications

```bash
# Only delete application deployments
kubectl delete namespace canteen-system

# Keep GKE cluster and databases for redeployment
```

## 🆘 Troubleshooting

### Issue: Pods not starting

```bash
# Check pod status
kubectl get pods -n canteen-system

# Describe pod for events
kubectl describe pod <pod-name> -n canteen-system

# Check logs
kubectl logs <pod-name> -n canteen-system

# Common causes:
# - Image pull errors (check GCR permissions)
# - Resource limits (check node capacity)
# - Database connection issues (check DB pods)
```

### Issue: Cannot access application

```bash
# Check service external IP
kubectl get service api-gateway -n canteen-system

# Check ingress/gateway logs
kubectl logs -l app=api-gateway -n canteen-system

# Test internal connectivity
kubectl run test --image=curlimages/curl -it --rm -- \
  curl http://api-gateway.canteen-system.svc.cluster.local/health
```

### Issue: GitHub Actions failing

1. Check secrets are set correctly in GitHub
2. Verify GCP service account has correct permissions
3. Check workflow logs in Actions tab
4. Ensure GKE cluster is running

### Issue: Database connection errors

```bash
# Check database pods
kubectl get pods -l component=database -n canteen-system

# Check database logs
kubectl logs deployment/postgres -n canteen-system

# Verify connection strings in ConfigMap
kubectl get configmap -n canteen-system -o yaml
```

## 📚 Additional Resources

- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)

## ✅ Deployment Checklist

- [ ] GCP project created and billing enabled
- [ ] All APIs enabled
- [ ] Service account created and key downloaded
- [ ] GitHub repository created
- [ ] GitHub secrets configured (GCP_PROJECT_ID, GCP_SA_KEY)
- [ ] Terraform initialized and applied
- [ ] kubectl configured
- [ ] Docker images built and pushed
- [ ] Kubernetes resources deployed
- [ ] External IP obtained and tested
- [ ] CI/CD pipeline tested
- [ ] Application accessible from browser

## 🎉 Success!

If you've followed all steps, your Canteen Queue Manager should now be:
- ✅ Running on Google Kubernetes Engine
- ✅ Accessible via external LoadBalancer IP
- ✅ Automatically deployed on every push to GitHub
- ✅ Monitored and logged in Google Cloud Console
- ✅ Scalable and production-ready

**Your single endpoint:** `http://<EXTERNAL_IP>`

This endpoint serves:
- Frontend: `http://<EXTERNAL_IP>/`
- API Gateway: Routes to all microservices
- All backend services through the API Gateway

---

**Need Help?** Check the Troubleshooting section or review your configuration files.
