# Clerk Webhook Setup Guide

This guide explains how to configure Clerk webhooks to automatically sync organizations from Clerk to your Supabase database in real-time.

## Overview

When users create organizations in Clerk (during onboarding or through the OrganizationSwitcher), those organizations need to be automatically reflected in your Supabase database. This is accomplished through Clerk webhooks that trigger when organization events occur.

## Required Webhook Events

Configure your Clerk webhook to listen for these events:

### User Events (Already Configured)
- `user.created` - When a new user signs up
- `user.updated` - When user profile is updated  
- `user.deleted` - When a user is deleted

### Organization Events (Newly Added)
- `organization.created` - When a new organization is created
- `organization.updated` - When organization details are updated
- `organization.deleted` - When an organization is deleted
- `organizationMembership.created` - When a user joins an organization
- `organizationMembership.deleted` - When a user leaves an organization

## Setup Steps

### 1. Access Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the sidebar

### 2. Create/Update Webhook Endpoint
1. Click **Create Endpoint** (or edit existing endpoint)
2. Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
   - For development: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - For production: `https://your-production-domain.com/api/webhooks/clerk`

### 3. Configure Events
Select these events in the webhook configuration:

**User Events:**
- [x] user.created
- [x] user.updated  
- [x] user.deleted

**Organization Events:**
- [x] organization.created
- [x] organization.updated
- [x] organization.deleted
- [x] organizationMembership.created
- [x] organizationMembership.deleted

### 4. Environment Variables

Ensure you have the webhook secret in your environment:

```bash
# .env.local
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

The webhook secret is provided by Clerk when you create the webhook endpoint.

### 5. Database Function Requirements

Your Supabase database should have the `create_organization_with_admin` function. If not, run this migration:

```sql
-- This function should already exist in your database
-- If not, check supabase/migrations/ for the organization setup
SELECT create_organization_with_admin(
  'test_clerk_org_id',
  'Test Org',
  'test-org', 
  'test_user_clerk_id',
  null,
  null
);
```

## Testing the Setup

### 1. Local Development
1. Use ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```
2. Update your Clerk webhook URL to the ngrok URL
3. Create a test organization in your app
4. Check your server logs for webhook events

### 2. Verify Organization Sync
After creating an organization in Clerk:

1. **Check Logs**: Look for webhook processing in your server logs:
   ```
   Creating organization in Supabase: org_xxx
   Organization created in Supabase: org_xxx with internal ID: 123
   ```

2. **Check Database**: Query your Supabase organizations table:
   ```sql
   SELECT * FROM organizations WHERE clerk_org_id = 'org_xxx';
   ```

3. **Check Dashboard**: The organization should appear immediately in your app's organization switcher

## Troubleshooting

### Webhook Not Triggering
- ✅ Verify the webhook URL is correct and accessible
- ✅ Check that all required events are selected in Clerk
- ✅ Ensure `CLERK_WEBHOOK_SECRET` environment variable is set
- ✅ Check server logs for webhook processing errors

### Organization Not Created in Database
- ✅ Verify `create_organization_with_admin` function exists in Supabase
- ✅ Check that the creating user exists in your `users` table
- ✅ Review webhook handler logs for detailed error messages
- ✅ Ensure database permissions are correct for the webhook operations

### Membership Issues
- ✅ Verify both user and organization exist in database before membership creation
- ✅ Check `organization_members` table structure matches webhook expectations
- ✅ Review foreign key constraints and indexes

## Security Considerations

1. **Webhook Verification**: The webhook handler verifies the signature using `svix` library
2. **Environment Secrets**: Store webhook secrets securely in environment variables
3. **Database Permissions**: Use service role key for webhook operations
4. **Error Handling**: All webhook operations include proper error handling and logging

## Production Deployment

1. **Update Webhook URL**: Change from ngrok to your production domain
2. **Environment Variables**: Ensure all required env vars are set in production
3. **Database Migrations**: Run all organization-related migrations
4. **Monitoring**: Set up logging and monitoring for webhook events
5. **Testing**: Create a test organization to verify the complete flow

## Benefits of This Setup

✅ **Real-time Sync**: Organizations appear in your database immediately after creation in Clerk
✅ **Automatic Membership Management**: User-organization relationships are maintained automatically  
✅ **No Manual Sync**: Eliminates the need for lazy loading or manual sync operations
✅ **Consistent Data**: Ensures your database stays in sync with Clerk organization changes
✅ **Better UX**: Users see their organizations immediately without refresh or delays

## Next Steps

After setting up webhooks:

1. **Test Organization Creation**: Create organizations through your onboarding flow
2. **Test Membership Changes**: Add/remove members and verify database updates
3. **Monitor Logs**: Watch for any webhook processing errors
4. **Update Documentation**: Document your specific webhook URL and any custom configurations 