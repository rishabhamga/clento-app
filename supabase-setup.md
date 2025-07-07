# Supabase & Clerk Setup Guide

This guide will walk you through setting up your Supabase database and Clerk authentication for the AI SDR Platform.

## 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Project Name**: `ai-sdr-platform`
   - **Database Password**: Use a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for development)
5. Click "Create new project"
6. Wait for project creation (2-3 minutes)

### Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service Role Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Create Database Tables

You have two options to create the database schema:

#### Option A: Using SQL Editor (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire content from `supabase/migrations/001_init.sql`
4. Click "Run" to execute the migration
5. Verify tables were created in **Table Editor**

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Link to your project (use Project Reference from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Push migration to remote
supabase db push
```

### Step 4: Verify Tables Created

Go to **Table Editor** and confirm these tables exist:

✅ **users** - User profiles and settings
✅ **leads** - Contact information and status
✅ **campaigns** - Outreach campaigns
✅ **campaign_leads** - Junction table for campaign-lead relationships
✅ **sequence_steps** - Automated sequence steps
✅ **messages** - Message logs and replies
✅ **integration_credentials** - Encrypted API keys and credentials

### Step 5: Set up Row Level Security (RLS)

The migration file already includes RLS policies, but verify they're active:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table ensuring users can only access their own data
3. If policies are missing, run the RLS section from the migration file again

### Step 6: Configure JWT Settings for Clerk Integration

1. Go to **Settings** → **API**
2. Scroll down to **JWT Settings**
3. You'll need the **JWT Secret** later for Clerk integration
4. Copy the JWT Secret (starts with `super-secret-jwt-token...`)

---

## 🔐 Clerk Setup

### Step 1: Create Clerk Application

1. Go to [clerk.com](https://clerk.com)
2. Sign up or sign in
3. Click "Add application"
4. Fill in application details:
   - **Application Name**: `AI SDR Platform`
   - **Sign-in Options**: 
     - ✅ Email address
     - ✅ Password
     - ✅ Google (optional)
   - **Framework**: Next.js
5. Click "Create application"

### Step 2: Get Clerk API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy these values:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

### Step 3: Configure Sign-in/Sign-up Pages

1. Go to **User & Authentication** → **Email, Phone, Username**
2. Configure authentication settings:
   - **Email address**: Required
   - **Password**: Required
   - **Email verification**: Enabled (recommended)

### Step 4: Enable Native Supabase Integration (RECOMMENDED)

**⚠️ Important: As of April 2025, JWT templates are deprecated. Use native integration instead.**

1. In Clerk dashboard, go to **Integrations**
2. Find **"Supabase"** in the integrations list
3. Click **"Configure"** or **"Enable"**
4. This automatically adds the required `"role": "authenticated"` claim to your session tokens
5. **No JWT template creation needed!**

### Step 5: Configure Webhooks (Optional)

For real-time user sync between Clerk and Supabase:

1. Go to **Webhooks**
2. Click "Add Endpoint"
3. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
4. **Events**: Select `user.created`, `user.updated`, `user.deleted`
5. Click "Create"

---

## 🔧 Environment Variables Setup

Create a `.env.local` file in your project root:

```env
# Clerk Configuration (Native Integration - No JWT Secret Needed)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (No JWT Secret Sharing Needed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Services
OPENAI_API_KEY=sk-your_openai_key_here
PERPLEXITY_API_KEY=pplx-your_key_here

# Lead Data APIs
ZOOMINFO_API_KEY=your_zoominfo_key_here
APOLLO_API_KEY=your_apollo_key_here
CLEARBIT_API_KEY=sk_your_clearbit_key_here

# Communication APIs
PHANTOMBUSTER_API_KEY=your_phantombuster_key_here

# Email Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# Optional: Other services
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
RESEND_API_KEY=re_your_resend_key_here
```

---

## 🧪 Testing the Setup

### Test Supabase Connection

1. Go to **SQL Editor** in Supabase
2. Run this test query:
   ```sql
   SELECT 'Supabase connection successful!' as message;
   ```
3. Should return the success message

### Test Clerk Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/sign-in`
3. Try creating a test account
4. Verify the user appears in Clerk's **Users** section

### Test Database Integration

1. After signing in, check **Table Editor** → **users**
2. You should see your user record created automatically (via native integration)
3. Verify RLS policies work: only your user's data should be visible
4. Try creating a test lead or campaign through your app

---

## 🚀 Production Deployment Setup

### For Vercel Deployment:

1. In Vercel dashboard, go to your project **Settings** → **Environment Variables**
2. Add all the environment variables from `.env.local`
3. Make sure to use production keys for:
   - Clerk (replace `pk_test_` with `pk_live_`)
   - Supabase (use production project URL/keys)

### For Supabase Production:

1. Create a new Supabase project for production
2. Run the same migration in production
3. Update environment variables with production credentials

---

## 📋 Checklist

Before starting development, ensure:

- [ ] Supabase project created and tables exist
- [ ] RLS policies are active and working
- [ ] Clerk application configured with correct settings
- [ ] Native Supabase integration enabled in Clerk (no JWT template needed)
- [ ] All environment variables set in `.env.local`
- [ ] Test user can sign up and sign in
- [ ] User record appears in Supabase after Clerk signup
- [ ] Database operations work with proper user isolation

---

## 🛠️ Troubleshooting

**Issue**: Tables not created
- **Solution**: Check SQL Editor for errors, run migration step by step

**Issue**: RLS blocks all queries
- **Solution**: Verify native Supabase integration is enabled in Clerk dashboard

**Issue**: User not syncing to Supabase
- **Solution**: Check native integration status and webhook setup

**Issue**: Authentication not working
- **Solution**: Verify Clerk keys and middleware configuration

**Issue**: CORS errors
- **Solution**: Check Supabase API settings and allowed origins

For more help, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guides](https://nextjs.org/docs) 