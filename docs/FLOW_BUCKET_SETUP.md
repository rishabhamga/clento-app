# Campaign Flow Bucket Setup Guide

This guide helps you set up the dedicated Google Cloud Storage bucket for campaign workflows.

## Quick Setup Steps

### 1. Create the Flow Bucket

```bash
# Using gcloud CLI
gsutil mb gs://campaign-flow

# Or create via Google Cloud Console:
# 1. Go to Google Cloud Storage
# 2. Click "Create Bucket"
# 3. Name: "campaign-flow"
# 4. Choose location and settings
```

### 2. Set Bucket Permissions

```bash
# Grant your service account access to the flow bucket
gsutil iam ch serviceAccount:your-service-account@project.iam.gserviceaccount.com:objectAdmin gs://campaign-flow
```

### 3. Update Environment Variables

Add to your `.env` file:

```env
# Existing lead lists bucket (keep as is)
GOOGLE_CLOUD_STORAGE_BUCKET=leads-list

# New dedicated flow bucket
GOOGLE_CLOUD_FLOW_STORAGE_BUCKET=campaign-flow
```

### 4. Verify Setup

Test the bucket access:

```bash
# Test write access
echo '{"test": true}' | gsutil cp - gs://campaign-flow/test.json

# Test read access
gsutil cat gs://campaign-flow/test.json

# Clean up test file
gsutil rm gs://campaign-flow/test.json
```

## Bucket Structure

Your flow bucket will have this structure:

```
campaign-flow/
└── workflows/
    ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.json
    ├── b2c3d4e5-f6g7-8901-bcde-f23456789012.json
    └── ...
```

## Security Considerations

### IAM Permissions

Your service account needs these permissions on the flow bucket:
- `storage.objects.create` - Upload workflow files
- `storage.objects.get` - Download workflow files
- `storage.objects.delete` - Delete workflow files
- `storage.objects.list` - List workflow files

### Bucket Policy

Consider setting up bucket lifecycle policies:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365,
          "matchesPrefix": ["workflows/"]
        }
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Check service account permissions
   gsutil iam get gs://campaign-flow
   ```

2. **Bucket Not Found**
   ```bash
   # Verify bucket exists
   gsutil ls gs://campaign-flow
   ```

3. **Environment Variable Not Set**
   ```bash
   # Check environment variables
   echo $GOOGLE_CLOUD_FLOW_STORAGE_BUCKET
   ```

### Testing the Integration

Use this test script to verify everything works:

```javascript
// test-flow-bucket.js
const { uploadFlowToGCS, downloadFlowJsonFromGCS, deleteFlowFromGCS } = require('./src/utils/gcsUtil');

async function testFlowBucket() {
  const testFlow = {
    id: 'test-flow-123',
    nodes: [],
    edges: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Test upload
    const buffer = Buffer.from(JSON.stringify(testFlow), 'utf-8');
    const uploadResult = await uploadFlowToGCS(buffer, 'test-flow-123.json');
    console.log('Upload result:', uploadResult);

    // Test download
    const downloadedFlow = await downloadFlowJsonFromGCS('workflows/test-flow-123.json');
    console.log('Downloaded flow:', downloadedFlow);

    // Test delete
    const deleteResult = await deleteFlowFromGCS('workflows/test-flow-123.json');
    console.log('Delete result:', deleteResult);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFlowBucket();
```

## Migration from Single Bucket

If you were previously using a single bucket for everything:

1. **Keep existing setup** - Lead lists will continue using `GOOGLE_CLOUD_STORAGE_BUCKET`
2. **Add new bucket** - Workflows will use `GOOGLE_CLOUD_FLOW_STORAGE_BUCKET`
3. **No data migration needed** - This is for new workflow files only

## Cost Considerations

- **Storage costs**: JSON files are typically small (< 1MB each)
- **Operation costs**: Minimal for typical usage patterns
- **Transfer costs**: Only when downloading workflows (rare)

Estimated cost for 1000 workflows: **< $0.10/month**

## Monitoring

Set up monitoring for the flow bucket:

```bash
# Enable logging
gsutil logging set on -b gs://your-logging-bucket gs://campaign-flow

# Set up alerts for storage usage
# (Configure in Google Cloud Monitoring)
```

## Related Documentation

- [Main Workflow Storage Documentation](./WORKFLOW_STORAGE.md)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Service Account Setup Guide](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
