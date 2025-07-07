# Campaign Creation Error Fix

This document explains the fixes applied to resolve campaign creation errors.

## Issues Fixed

### 1. Campaign Leads Status Constraint Violation
**Error**: `new row for relation "campaign_leads" violates check constraint "campaign_leads_status_check"`

**Root Cause**: The database constraint only allowed `('active', 'paused', 'completed', 'opted_out')` but the application was trying to insert `'pending'` status.

**Fix**: Updated the constraint to allow all necessary status values including `'pending'`.

### 2. Sequence Steps Channel Constraint Violation  
**Error**: `new row for relation "sequence_steps" violates check constraint "sequence_steps_channel_check"`

**Root Cause**: The workflow was using `'linkedin'` as a channel, but the database only allowed `('email', 'linkedin_invite', 'linkedin_message')`.

**Fix**: 
- Updated database constraint to allow `'linkedin'` channel
- Updated campaign creation code to properly map workflow channels to database channels:
  - `'linkedin'` + `'connect'` action → `'linkedin_invite'`
  - `'linkedin'` + `'message'` action → `'linkedin_message'`
  - `'linkedin'` (generic) → `'linkedin'`

### 3. Messages Stats UUID Error
**Error**: `invalid input syntax for type uuid: "[object Object]"`

**Root Cause**: The campaigns API was passing a Supabase query object instead of actual campaign IDs to the messages query.

**Fix**: Updated the query to first fetch campaign IDs, then use those IDs to query messages.

## Files Modified

### Database
- `supabase/migrations/005_fix_constraint_violations.sql` - New migration to fix constraints
- `fix-constraints.sql` - Manual SQL file for Supabase dashboard

### Application Code
- `src/app/api/campaigns/create/route.ts` - Fixed channel mapping for sequence steps
- `src/app/api/campaigns/route.ts` - Fixed messages stats query

### Utilities
- `fix-database-constraints.js` - Node.js script to apply fixes programmatically

## How to Apply the Fix

### Option 1: Run SQL Manually (Recommended)
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix-constraints.sql`
4. Click "Run"

### Option 2: Run Node.js Script
```bash
node fix-database-constraints.js
```

### Option 3: Run Migration (if Supabase CLI is available)
```bash
supabase db push
```

## Verification

After applying the fixes:

1. **Test Campaign Creation**: Try creating a new campaign with selected leads
2. **Check Dashboard**: Verify that the dashboard loads without UUID errors
3. **Monitor Logs**: Check that no constraint violation errors appear in the logs

## Prevention

To prevent similar issues in the future:

1. **Database Constraints**: Ensure database constraints match application expectations
2. **Channel Mapping**: Use the channel mapping function when creating sequence steps
3. **Query Validation**: Always validate query parameters before database calls
4. **Testing**: Test campaign creation flow thoroughly after schema changes

## Lead Association Process

The campaign creation process now correctly:

1. **Normalizes lead data** using the `normalizeCampaignLead()` function
2. **Upserts leads** using the `upsert_lead()` database function
3. **Associates leads with campaigns** using the `associate_lead_with_campaign()` function with correct status
4. **Creates sequence steps** with properly mapped channel values
5. **Handles errors gracefully** and reports processing results

## Status

✅ **Fixed**: Campaign leads status constraint  
✅ **Fixed**: Sequence steps channel constraint  
✅ **Fixed**: Messages stats UUID error  
✅ **Fixed**: Channel mapping in campaign creation  
✅ **Added**: Comprehensive error handling and validation 