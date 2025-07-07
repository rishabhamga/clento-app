# Clerk Authentication Setup Guide

This guide will help you fix the Clerk middleware import error and set up automatic user synchronization with Supabase.

## Issues Fixed

✅ **Fixed Clerk middleware import error** - Updated to use `withClerkMiddleware` for Clerk v4.29.5
✅ **Added automatic user sync webhook** - Users are now automatically synced to Supabase
✅ **Enhanced onboarding flow** - Ensures users are synced during onboarding

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other services (if using)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
OPENAI_API_KEY=sk-...
PDL_API_KEY=your_pdl_api_key
APOLLO_API_KEY=your_apollo_api_key
```

## Clerk Dashboard Configuration

### 1. Create Webhook Endpoint

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the left sidebar
3. Click **Add Endpoint**
4. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/clerk`
   - For local development: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
5. Select these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
6. Click **Create**
7. Copy the **Signing Secret** and add it to your environment as `CLERK_WEBHOOK_SECRET`

### 2. Get API Keys

1. In your Clerk Dashboard, go to **API Keys**
2. Copy the **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy the **Secret Key** → `CLERK_SECRET_KEY`

## Testing the Setup

### 1. Test Local Development

```bash
# Start your development server
npm run dev

# Test user registration
# 1. Visit http://localhost:3000/sign-up
# 2. Create a new account
# 3. Check your Supabase database - user should appear in 'users' table
```

### 2. Test Webhook (Production)

```bash
# Use ngrok for local webhook testing
npx ngrok http 3000

# Update your Clerk webhook URL to the ngrok URL
# Register a new user and check logs
```

## Database Schema

Make sure your Supabase `users` table has these columns:

```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

## Troubleshooting

### Build Error: "Export clerkMiddleware doesn't exist"

✅ **Fixed** - Updated middleware to use `withClerkMiddleware` for Clerk v4.29.5

### Users Not Syncing to Supabase

✅ **Fixed** - Added webhook handler and onboarding sync

### Common Issues

1. **Webhook not receiving events**: Check your webhook URL and make sure it's publicly accessible
2. **Database connection errors**: Verify your Supabase service role key has the correct permissions
3. **Authentication redirects not working**: Check your Clerk redirect URLs in the dashboard

## Files Changed

- ✅ `src/middleware.ts` - Fixed Clerk middleware import
- ✅ `src/app/api/webhooks/clerk/route.ts` - Added webhook handler
- ✅ `src/components/OnboardingWizard.tsx` - Added user sync during onboarding
- ✅ `package.json` - Added `svix` dependency

## Next Steps

1. Add the required environment variables
2. Configure the Clerk webhook in your dashboard
3. Test user registration
4. Deploy and update webhook URL for production

The authentication system should now work correctly with automatic user synchronization to Supabase! 