# Workflow Storage System

This document describes the implementation of the workflow JSON storage system using Google Cloud Storage (GCS) and database integration.

## Overview

The workflow storage system stores React Flow workflow configurations as JSON files in Google Cloud Storage, with references stored in the Supabase database. Each workflow is assigned a unique ID and stored with the naming convention `workflows/{flow-id}.json`.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes     │    │   Database      │
│   Workflow      │───▶│   /api/campaigns │───▶│   campaigns     │
│   Builder       │    │   /[id]/workflow │    │   table         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Google Cloud     │
                       │ Storage          │
                       │ workflows/       │
                       │ {flow-id}.json   │
                       └──────────────────┘
```

## Database Schema Changes

### New Column in `campaigns` Table

```sql
ALTER TABLE public.campaigns 
ADD COLUMN workflow_json_file text;

-- Add constraint for file naming convention
ALTER TABLE public.campaigns 
ADD CONSTRAINT chk_workflow_json_file_format 
CHECK (workflow_json_file IS NULL OR workflow_json_file ~ '^workflows/[a-zA-Z0-9_-]+\.json$');
```

The `workflow_json_file` column stores the GCS file path in the format: `workflows/{flow-id}.json`

## File Structure

### New Files Created

```
src/
├── lib/services/
│   └── workflow-storage.ts          # Core workflow storage service
├── app/api/campaigns/[id]/workflow/
│   └── route.ts                     # API endpoints for workflow CRUD
├── hooks/
│   └── useWorkflowStorage.ts        # React hook for workflow operations
└── utils/
    └── gcsUtil.ts                   # Enhanced with download functions

supabase/migrations/
└── 20250124_001_add_workflow_json_to_campaigns.sql

scripts/
└── migrate-workflow-storage.sql     # Migration script

docs/
└── WORKFLOW_STORAGE.md             # This documentation
```

## API Endpoints

### GET `/api/campaigns/[id]/workflow`
Load workflow for a specific campaign.

**Response:**
```json
{
  "workflow": {
    "id": "flow-uuid",
    "nodes": [...],
    "edges": [...],
    "timestamp": "2025-01-24T10:24:28.794Z",
    "version": 1,
    "campaignId": "campaign-uuid"
  }
}
```

### POST `/api/campaigns/[id]/workflow`
Save workflow for a specific campaign.

**Request:**
```json
{
  "workflow": {
    "nodes": [...],
    "edges": [...],
    "timestamp": "2025-01-24T10:24:28.794Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "flowId": "generated-uuid",
  "fileName": "workflows/generated-uuid.json",
  "gcsUrl": "https://storage.googleapis.com/bucket/workflows/generated-uuid.json"
}
```

### DELETE `/api/campaigns/[id]/workflow`
Delete workflow for a specific campaign.

**Response:**
```json
{
  "success": true
}
```

## Usage Examples

### Using the React Hook

```typescript
import { useWorkflowStorage } from '@/hooks/useWorkflowStorage';

function MyComponent() {
  const { saveWorkflow, loadWorkflow, loading, error } = useWorkflowStorage();

  const handleSave = async () => {
    const success = await saveWorkflow('campaign-id', workflowData);
    if (success) {
      console.log('Workflow saved successfully');
    }
  };

  const handleLoad = async () => {
    const workflow = await loadWorkflow('campaign-id');
    if (workflow) {
      setWorkflowData(workflow);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleSave}>Save Workflow</button>
      <button onClick={handleLoad}>Load Workflow</button>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { saveWorkflowToGCS, loadWorkflowFromGCS } from '@/lib/services/workflow-storage';

// Save workflow
const result = await saveWorkflowToGCS(workflowData, 'campaign-id');
if (result.success) {
  console.log('Saved to:', result.fileName);
}

// Load workflow
const workflow = await loadWorkflowFromGCS('flow-id');
if (workflow) {
  console.log('Loaded workflow:', workflow.id);
}
```

## Data Flow

### Saving a Workflow

1. **Frontend**: User creates/edits workflow in React Flow builder
2. **Frontend**: Calls `handleSaveWorkflow()` with workflow data
3. **API**: POST `/api/campaigns/[id]/workflow` receives workflow data
4. **Service**: `saveWorkflowToGCS()` generates unique flow ID
5. **GCS**: JSON file saved as `workflows/{flow-id}.json`
6. **Database**: `campaigns.workflow_json_file` updated with file path
7. **Frontend**: Success/error feedback displayed

### Loading a Workflow

1. **Frontend**: Component mounts or user requests workflow load
2. **API**: GET `/api/campaigns/[id]/workflow` called
3. **Database**: Query `campaigns` table for `workflow_json_file`
4. **Service**: `loadWorkflowFromGCS()` downloads JSON from GCS
5. **API**: Returns parsed workflow data
6. **Frontend**: Workflow builder populated with loaded data

## File Naming Convention

- **Format**: `workflows/{flow-id}.json`
- **Flow ID**: UUID v4 format (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- **Example**: `workflows/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json`

## Error Handling

### Common Error Scenarios

1. **GCS Upload Failure**: Network issues, permissions, quota exceeded
2. **Database Update Failure**: Constraint violations, connection issues
3. **File Not Found**: Workflow file deleted or corrupted
4. **Permission Denied**: User doesn't own the campaign
5. **Invalid JSON**: Corrupted workflow data

### Error Recovery

- **Atomic Operations**: Database updates only after successful GCS operations
- **Cleanup**: Failed uploads trigger cleanup of partial data
- **Fallback**: Local storage used as backup during development
- **Validation**: JSON schema validation before storage

## Security Considerations

### Access Control
- **Authentication**: Clerk user authentication required
- **Authorization**: Users can only access their own campaigns
- **File Permissions**: GCS bucket configured with proper IAM roles

### Data Validation
- **Input Sanitization**: All workflow data validated before storage
- **File Name Validation**: Regex constraints on file naming
- **Size Limits**: JSON file size limits enforced
- **Schema Validation**: Workflow structure validated against TypeScript types

## Performance Optimizations

### Caching Strategy
- **Local Storage**: Draft workflows cached locally
- **CDN**: GCS files served through CDN for faster access
- **Compression**: JSON files compressed during upload
- **Lazy Loading**: Workflows loaded only when needed

### Database Optimizations
- **Indexing**: Index on `workflow_json_file` for faster lookups
- **Connection Pooling**: Supabase connection pooling enabled
- **Query Optimization**: Minimal data fetched in queries

## Monitoring and Logging

### Logging Points
- **Upload Operations**: File size, duration, success/failure
- **Download Operations**: Cache hits/misses, load times
- **Database Operations**: Query performance, error rates
- **User Actions**: Workflow save/load events

### Metrics to Track
- **Storage Usage**: Total GCS storage consumed
- **API Performance**: Response times for workflow endpoints
- **Error Rates**: Failed operations by type
- **User Engagement**: Workflow creation/modification frequency

## Migration Guide

### From Local Storage to GCS

1. **Run Database Migration**:
   ```sql
   -- Run the migration script
   \i scripts/migrate-workflow-storage.sql
   ```

2. **Update Environment Variables**:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_STORAGE_BUCKET=your-leads-bucket-name
   GOOGLE_CLOUD_FLOW_STORAGE_BUCKET=campaign-flow
   GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=your-service-account-json
   ```

3. **Deploy Updated Code**:
   - Deploy the new API endpoints
   - Update frontend to use new storage system
   - Test workflow save/load functionality

4. **Migrate Existing Data** (if needed):
   ```typescript
   // Script to migrate existing localStorage workflows to GCS
   const migrateWorkflows = async () => {
     // Implementation depends on your specific needs
   };
   ```

## Environment Variables

The workflow storage system uses dedicated environment variables:

- **`GOOGLE_CLOUD_PROJECT_ID`**: Your Google Cloud project ID
- **`GOOGLE_CLOUD_STORAGE_BUCKET`**: Bucket for lead lists (existing)
- **`GOOGLE_CLOUD_FLOW_STORAGE_BUCKET`**: Dedicated bucket for campaign workflows (new)
- **`GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY`**: Service account JSON key

### Bucket Separation

The system uses two separate buckets:
- **Lead Lists Bucket**: `GOOGLE_CLOUD_STORAGE_BUCKET` (e.g., "leads-list")
- **Workflow Bucket**: `GOOGLE_CLOUD_FLOW_STORAGE_BUCKET` (e.g., "campaign-flow")

This separation ensures:
- **Isolated permissions**: Different access controls for different data types
- **Better organization**: Clear separation of concerns
- **Scalability**: Independent scaling and management

## Troubleshooting

### Common Issues

1. **"Failed to save workflow to cloud storage"**
   - Check GCS credentials and permissions
   - Verify flow bucket (`GOOGLE_CLOUD_FLOW_STORAGE_BUCKET`) exists and is accessible
   - Check network connectivity

2. **"Workflow file not found"**
   - Verify file exists in GCS bucket
   - Check file naming convention
   - Ensure database record is correct

3. **"Permission denied"**
   - Verify user authentication
   - Check campaign ownership
   - Validate API endpoint permissions

### Debug Steps

1. **Check Logs**: Review server logs for detailed error messages
2. **Verify Credentials**: Test GCS access with service account
3. **Database Query**: Manually check `campaigns` table for file references
4. **GCS Console**: Verify files exist in the bucket
5. **Network**: Test connectivity to GCS endpoints

## Future Enhancements

### Planned Features
- **Workflow Versioning**: Track workflow changes over time
- **Workflow Templates**: Shared template library
- **Collaboration**: Multi-user workflow editing
- **Analytics**: Workflow performance metrics
- **Backup**: Automated backup and restore

### Performance Improvements
- **Caching Layer**: Redis cache for frequently accessed workflows
- **Compression**: Advanced compression algorithms
- **CDN Integration**: Global content delivery
- **Batch Operations**: Bulk workflow operations

## Related Documentation

- [React Flow Documentation](https://reactflow.dev/)
- [Google Cloud Storage API](https://cloud.google.com/storage/docs)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Workflow Builder README](../src/components/workflow/README.md)
