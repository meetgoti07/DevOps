# Terraform Remote Backend Setup

This guide explains how to configure Terraform to use Google Cloud Storage (GCS) as a remote backend for state management.

## Why Remote Backend?

Using a remote backend solves several problems:

1. **Shared State**: Multiple team members and CI/CD can access the same state
2. **State Locking**: Prevents concurrent modifications
3. **State Versioning**: Automatic backup of state history
4. **Security**: State stored securely in GCP with proper access controls

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and configured
- Terraform installed
- Proper GCP permissions (Storage Admin or Owner role)

## Setup Instructions

### 1. Run the Setup Script

From the `terraform/` directory, run:

```bash
./setup-backend.sh
```

This script will:
- Create a GCS bucket for Terraform state
- Enable versioning on the bucket
- Configure lifecycle rules for old state versions
- Migrate your local state to the remote backend

### 2. Verify the Setup

Check that the bucket was created:

```bash
gsutil ls -b gs://canteen-terraform-state-bucket
```

View the state file:

```bash
gsutil ls gs://canteen-terraform-state-bucket/terraform/state/
```

### 3. Commit Changes

After successful migration, commit the updated `provider.tf`:

```bash
git add provider.tf
git commit -m "Configure Terraform remote backend with GCS"
git push
```

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create GCS Bucket

```bash
export PROJECT_ID=$(gcloud config get-value project)
export BUCKET_NAME="canteen-terraform-state-bucket"

# Create bucket
gsutil mb -p ${PROJECT_ID} -l us-central1 gs://${BUCKET_NAME}

# Enable versioning
gsutil versioning set on gs://${BUCKET_NAME}

# Set uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://${BUCKET_NAME}
```

### 2. Initialize Terraform

```bash
cd terraform/
terraform init -migrate-state
```

When prompted, type `yes` to migrate your local state to the remote backend.

## Troubleshooting

### Bucket Already Exists

If you get an error that the bucket already exists:

```bash
# Check if it's your bucket
gsutil ls -b gs://canteen-terraform-state-bucket

# If it's yours, just run terraform init
terraform init -migrate-state
```

### State Lock Issues

If you encounter state lock errors:

```bash
# List current locks
gsutil ls gs://canteen-terraform-state-bucket/terraform/state/*.tflock

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

### Permission Issues

Ensure your service account has these permissions:
- `storage.buckets.get`
- `storage.buckets.create`
- `storage.objects.create`
- `storage.objects.delete`
- `storage.objects.get`
- `storage.objects.list`

You can grant Storage Admin role:

```bash
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:YOUR_SA_EMAIL" \
  --role="roles/storage.admin"
```

## CI/CD Configuration

The GitHub Actions workflows are already configured to use the remote backend. They will:

1. Authenticate with GCP using `GCP_SA_KEY` secret
2. Run `terraform init` (connects to remote backend automatically)
3. Execute terraform commands with shared state

No additional configuration needed for CI/CD!

## State Management Best Practices

1. **Never commit `terraform.tfstate`** - It's now in GCS
2. **Use state locking** - Enabled automatically with GCS backend
3. **Backup regularly** - GCS versioning handles this
4. **Review state changes** - Use `terraform plan` before `apply`
5. **Protect the bucket** - Limit access to necessary team members only

## Cleaning Up

To remove the remote backend (not recommended for production):

1. Download current state:
   ```bash
   terraform state pull > terraform.tfstate
   ```

2. Remove backend configuration from `provider.tf`

3. Re-initialize:
   ```bash
   terraform init -migrate-state
   ```

4. Delete the bucket:
   ```bash
   gsutil rm -r gs://canteen-terraform-state-bucket
   ```

## Security Considerations

- The state file may contain sensitive data (passwords, private keys)
- GCS bucket access is controlled via IAM
- State is encrypted at rest by default in GCS
- Enable audit logging for the bucket in production
- Consider using customer-managed encryption keys (CMEK) for additional security

## Further Reading

- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/gcs.html)
- [GCS Bucket Versioning](https://cloud.google.com/storage/docs/object-versioning)
- [Terraform State Best Practices](https://www.terraform.io/docs/language/state/index.html)
