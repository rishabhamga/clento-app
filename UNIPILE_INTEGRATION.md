# Unipile Integration Setup Guide

This guide explains how to set up and configure the Unipile integration for the Accounts Management feature in Clento.

## Overview

The Accounts Management feature allows users to connect and manage various social media and communication accounts for automated outreach. It integrates with [Unipile](https://unipile.com) to provide a unified API for managing multiple platforms.

## Features Implemented

### Phase 1 - Account Management (Current)
- ✅ Connect LinkedIn accounts via Unipile hosted auth
- ✅ Account status monitoring (connected, disconnected, expired, error)
- ✅ Account synchronization with Unipile API
- ✅ Disconnect and remove accounts
- ✅ Organization-based account management
- ✅ Beautiful, responsive UI matching platform design

### Phase 2 - Messaging (Coming Soon)
- 🔄 Send LinkedIn messages through connected accounts
- 🔄 Message templates and personalization
- 🔄 Campaign integration with account selection
- 🔄 Message tracking and analytics

## Setup Instructions

### 1. Get Unipile API Access

1. Sign up for a Unipile account at [https://unipile.com](https://unipile.com)
2. Create a new application in your Unipile dashboard
3. Copy your API key and API URL (usually `https://api{XXX}.unipile.com:{PORT}`)

### 2. Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Unipile Integration
UNIPILE_API_URL=https://apiXXX.unipile.com:XXX
UNIPILE_API_KEY=your_unipile_api_key_here
```

### 3. Database Migration

Run the database migration to create the user_accounts table:

```bash
# Apply the migration
supabase db push

# Or if using a different setup, run the SQL file directly:
# supabase/migrations/20250109_001_accounts_integration.sql
```

### 4. Webhook Configuration (Optional but Recommended)

For real-time account status updates, configure webhooks in your Unipile dashboard:

- **Webhook URL**: `https://your-domain.com/api/accounts/webhook`
- **Events**: Account status changes, connection success/failure

## Usage

### For Users

1. **Navigate to Accounts**: Click "Accounts" in the sidebar navigation
2. **Connect Account**: Click "Connect Account" and choose LinkedIn
3. **Authentication**: Complete the Unipile hosted authentication flow
4. **Manage Accounts**: View, sync, or disconnect accounts as needed

### For Developers

The integration provides several API endpoints:

- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account record
- `POST /api/accounts/connect` - Initiate connection flow
- `POST /api/accounts/sync/[id]` - Sync account data
- `POST /api/accounts/disconnect/[id]` - Disconnect account
- `POST /api/accounts/webhook` - Handle Unipile webhooks

## Architecture

### Database Schema

The `user_accounts` table stores account information:

```sql
- id: UUID primary key
- user_id: Reference to users table
- organization_id: Reference to organizations table (nullable)
- unipile_account_id: Unipile's account identifier
- provider: Account platform (linkedin, email, twitter, etc.)
- account_type: personal, business, or page
- display_name: Account display name
- connection_status: connected, disconnected, expired, error, pending, credentials
- unipile_data: JSON data from Unipile API
- capabilities: Supported actions for this account
```

### Service Layer

The `UnipileService` class (`src/lib/unipile-service.ts`) provides:

- Hosted authentication link creation
- Account data retrieval and synchronization
- Account disconnection
- Error handling and status management

### UI Components

- **AccountsPage**: Main accounts management interface
- **AccountCard**: Individual account display and actions
- **ConnectAccountCard**: New account connection interface

## Supported Providers

### Currently Available
- **LinkedIn**: Full support with hosted authentication

### Coming Soon
- **Email**: Gmail, Outlook via OAuth
- **Twitter**: Account connection and messaging
- **Facebook**: Pages and messaging
- **Instagram**: Business accounts and DMs

## Troubleshooting

### Common Issues

1. **"Unipile integration not configured"**
   - Check that `UNIPILE_API_KEY` and `UNIPILE_API_URL` are set
   - Verify API key is valid in Unipile dashboard

2. **"Connection failed" during LinkedIn auth**
   - Check webhook URL is accessible from Unipile servers
   - Verify redirect URLs are correctly configured
   - Check Unipile account has LinkedIn integration enabled

3. **Account shows "expired" or "credentials" status**
   - User needs to re-authenticate through reconnection flow
   - LinkedIn may have revoked access due to inactivity

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## Security Considerations

- All API keys are stored as environment variables
- User accounts are protected by Row Level Security (RLS) policies
- Webhook endpoints validate payloads from Unipile
- Account data is encrypted at rest in Supabase

## Next Steps

1. **Test the integration** with a LinkedIn account
2. **Configure webhooks** for real-time updates
3. **Add more providers** as needed
4. **Implement messaging** features in Phase 2

## Support

For Unipile-specific issues:
- [Unipile Documentation](https://developer.unipile.com)
- [Unipile Support](https://unipile.com/support)

For integration issues:
- Check the browser console and server logs
- Review the API endpoint responses
- Verify database permissions and RLS policies
