# Google Cloud Storage Setup Guide

## Step 1: Google Cloud Console Setup

### 1. Enable Cloud Storage API
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Navigate to "APIs & Services" → "Library"
- Search for "Cloud Storage API" and enable it

### 2. Create Service Account
- Go to "IAM & Admin" → "Service Accounts"
- Click "Create Service Account"
- Name: `clento-storage-service`
- Grant roles: 
  - `Storage Object Admin`
  - `Storage Admin`
- Create and download the JSON key file

### 3. Set Bucket Permissions
- Go to Cloud Storage → Your bucket (`leads-list`)
- Go to "Permissions" tab
- Add your service account with "Storage Object Admin" role

## Step 2: Environment Variables

Add these to your `.env` file:

```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=leads-list

# Option 1: Use service account key file (for local development)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Option 2: Use service account key content directly (recommended for deployment)
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

## Step 3: Bucket Configuration

Your bucket `leads-list` should be configured with:
- **Location**: Choose based on your users (e.g., us-central1)
- **Storage Class**: Standard
- **Access Control**: Uniform (recommended)
- **Public Access**: Allowed (for serving uploaded files)

## Step 4: Security Best Practices

1. **Service Account Permissions**: Only grant minimum required permissions
2. **Bucket Access**: Use signed URLs for sensitive files if needed
3. **CORS Configuration**: Configure if accessing from browser directly
4. **Lifecycle Rules**: Set up automatic cleanup of old files

## Step 5: Testing

After setup, test the upload functionality:
1. Create a lead list
2. Upload a CSV file
3. Check that the file appears in your Google Cloud Storage bucket
4. Verify the file URL is accessible

## Troubleshooting

### Common Issues:
1. **"Authentication failed"**: Check service account key and permissions
2. **"Bucket not found"**: Verify bucket name and project ID
3. **"Access denied"**: Check IAM roles and bucket permissions
4. **"CORS error"**: Configure CORS policy if needed

### Debug Steps:
1. Check environment variables are loaded
2. Verify service account has correct permissions
3. Test bucket access with gsutil CLI
4. Check Google Cloud Console logs
