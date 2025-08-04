# Smartlead Integration Database Schema

This document describes the database schema changes required for the Smartlead email integration.

## Overview

The Smartlead integration adds email campaign management and real-time email event tracking capabilities to Clento.ai. This integration requires several database schema modifications to support:

- Customer-to-Smartlead organization mapping
- Email event tracking from webhooks
- Enhanced lead management with email activity
- Campaign performance analytics

## Schema Changes

### 1. Users Table Modifications

**New Columns Added:**
- `smartlead_org_id` (TEXT, nullable) - Smartlead organization ID for this customer
- `smartlead_org_name` (TEXT, nullable) - Human-readable Smartlead organization name

**Purpose:** Maps each Clento customer to their corresponding Smartlead organization for proper data isolation and API calls.

### 2. Leads Table Enhancements

**New Columns Added:**
- `smartlead_campaign_id` (TEXT, nullable) - Associated Smartlead campaign ID
- `last_email_event` (TEXT, nullable) - Last email event type (opened, clicked, replied, etc.)
- `last_event_timestamp` (TIMESTAMPTZ, nullable) - Timestamp of the last email event

**Purpose:** Tracks email engagement history for each lead and enables quick access to recent activity.

### 3. New Email Events Table

**Table:** `public.email_events`

**Columns:**
- `id` (UUID, Primary Key) - Unique event identifier
- `user_id` (UUID, Foreign Key → users.id) - Customer who owns this event
- `campaign_id` (TEXT, Not Null) - Smartlead campaign identifier
- `message_id` (TEXT, Not Null) - Specific email message identifier
- `event_type` (TEXT, Not Null) - Type of email event (constrained values)
- `email` (TEXT, Not Null) - Lead's email address
- `lead_id` (UUID, Foreign Key → leads.id) - Associated lead record
- `smartlead_org_id` (TEXT, nullable) - Smartlead organization context
- `event_data` (JSONB) - Additional event metadata
- `timestamp` (TIMESTAMPTZ) - When the event occurred
- `created_at` (TIMESTAMPTZ) - When the record was created
- `updated_at` (TIMESTAMPTZ) - When the record was last updated

**Constraints:**
- Event type must be one of: `email_opened`, `email_clicked`, `email_replied`, `email_bounced`, `email_delivered`, `email_sent`, `email_unsubscribed`, `email_spam_reported`, `email_follow_up_opened`, `email_follow_up_clicked`, `email_follow_up_replied`

**Purpose:** Stores all email events received from Smartlead webhooks for analytics and lead activity tracking.

### 4. Integration Credentials Update

**Modified Constraint:**
- Added `'smartlead'` to the list of allowed providers in `integration_credentials` table

**Purpose:** Enables storing Smartlead API credentials alongside other integration credentials.

## Indexes for Performance

### Users Table
- `idx_users_smartlead_org_id` - Fast lookups by Smartlead organization ID

### Leads Table
- `idx_leads_smartlead_campaign_id` - Campaign-based lead queries
- `idx_leads_last_event_timestamp` - Recent activity sorting

### Email Events Table
- `idx_email_events_user_id` - User-specific event queries
- `idx_email_events_campaign_id` - Campaign analytics
- `idx_email_events_message_id` - Message-specific lookups
- `idx_email_events_event_type` - Event type filtering
- `idx_email_events_email` - Email-based searches
- `idx_email_events_lead_id` - Lead activity history
- `idx_email_events_smartlead_org_id` - Organization-scoped queries
- `idx_email_events_timestamp` - Time-based sorting
- `idx_email_events_user_campaign` - Combined user/campaign queries
- `idx_email_events_email_event_type` - Email/event type combinations
- `idx_email_events_lead_timestamp` - Lead activity timelines

## Data Flow

### Webhook Processing
1. Smartlead sends webhook to `/api/webhooks/smartlead`
2. Webhook validates `org_id` against `users.smartlead_org_id`
3. Event stored in `email_events` table
4. Lead record updated with latest activity

### Analytics Queries
1. Campaign performance: Aggregate `email_events` by `campaign_id` and `event_type`
2. Lead activity: Join `leads` with `email_events` on `lead_id`
3. User analytics: Filter by `user_id` across all tables

## Migration Files

- `20250108_001_smartlead_integration.sql` - Main migration with all schema changes
- `test_smartlead_schema.sql` - Validation script to test the migration

## TypeScript Types

Updated `src/types/database.ts` with:
- Enhanced `users`, `leads`, and `integration_credentials` table types
- New `email_events` table type definition
- Smartlead-specific interfaces for API responses and data structures

## Usage Examples

### Finding User's Smartlead Organization
```sql
SELECT smartlead_org_id, smartlead_org_name 
FROM users 
WHERE id = $1;
```

### Getting Lead Email Activity
```sql
SELECT ee.event_type, ee.timestamp, ee.event_data
FROM email_events ee
WHERE ee.lead_id = $1
ORDER BY ee.timestamp DESC
LIMIT 10;
```

### Campaign Performance Analytics
```sql
SELECT 
  campaign_id,
  COUNT(*) FILTER (WHERE event_type = 'email_sent') as sent,
  COUNT(*) FILTER (WHERE event_type = 'email_opened') as opened,
  COUNT(*) FILTER (WHERE event_type = 'email_clicked') as clicked,
  COUNT(*) FILTER (WHERE event_type = 'email_replied') as replied
FROM email_events
WHERE user_id = $1 AND campaign_id = $2
GROUP BY campaign_id;
```

## Security Considerations

- All user data is properly isolated by `user_id`
- Foreign key constraints ensure data integrity
- Webhook validation prevents unauthorized data insertion
- Sensitive Smartlead API keys stored in environment variables

## Performance Monitoring

Monitor these queries for performance:
- Webhook event insertion rate
- Campaign analytics aggregations
- Lead activity timeline queries
- Large-scale email event searches

Consider partitioning `email_events` table by timestamp if volume becomes high (>1M records).

## Rollback Instructions

To rollback this migration:

```sql
-- Remove new columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS smartlead_org_id,
DROP COLUMN IF EXISTS smartlead_org_name;

-- Remove new columns from leads table  
ALTER TABLE public.leads
DROP COLUMN IF EXISTS smartlead_campaign_id,
DROP COLUMN IF EXISTS last_email_event,
DROP COLUMN IF EXISTS last_event_timestamp;

-- Drop email_events table
DROP TABLE IF EXISTS public.email_events;

-- Revert integration_credentials constraint
ALTER TABLE public.integration_credentials
DROP CONSTRAINT IF EXISTS integration_credentials_provider_check;

ALTER TABLE public.integration_credentials
ADD CONSTRAINT integration_credentials_provider_check CHECK (
  provider IN ('gmail', 'outlook', 'linkedin', 'phantombuster', 'zoominfo', 'apollo')
);
```

**Note:** Rollback will permanently delete all Smartlead-related data. Ensure data backup before proceeding. 