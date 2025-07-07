# Environment Variables Setup for Clento AI SDR Platform

## Required Variables for Complete Setup

Create a `.env.local` file in your project root with these variables:

### 1. Clerk Authentication & Redirects
```
# Clerk Basic Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=your_webhook_secret_here

# Clerk Redirect URLs (IMPORTANT: Fixes localhost redirect issue)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding
```

### 2. Supabase Database
```
PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. AI Services (Required for website analysis)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Optional Services
```
# LinkedIn Integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Data Providers
PDL_API_KEY=your_pdl_api_key
APOLLO_API_KEY=your_apollo_api_key
```

## 🔧 Fixing the Clerk Redirect Issue

The issue where users are redirected to `mighty-stingray-65.accounts.dev/default-redirect` instead of localhost is caused by missing Clerk redirect environment variables.

### Solution:
1. **Add the redirect URLs above to your `.env.local` file**
2. **In your Clerk Dashboard:**
   - Go to https://dashboard.clerk.com
   - Navigate to your application
   - Go to **User & Authentication** → **Email, Phone, Username**
   - Scroll down to **Redirect URLs**
   - Add these URLs:
     - `http://localhost:3000/onboarding` (for development)
     - `http://localhost:3001/onboarding` (backup port)
     - `https://your-domain.com/onboarding` (for production)

### 3. For Development Environment:
```bash
# Make sure your app is running on the correct port
npm run dev

# If port 3000 is taken, it will use 3001 - update Clerk accordingly
```

## 🎨 Theme Fixes Applied

✅ **Fixed blue color theme issues:**
- Updated "Analyzing Your Website" text color to use gradient theme
- Changed progress bar from blue to purple theme
- Updated all blue color references in onboarding wizard
- Fixed campaign pitch page blue colors
- Maintained consistent purple gradient theme throughout

## 🧪 Testing the Setup

### Test Clerk Authentication Flow:
1. Start your development server: `npm run dev`
2. Visit `/sign-up` to create a test account
3. Verify redirect goes to `/onboarding` (not accounts.dev)
4. Complete onboarding flow
5. Verify redirect to `/dashboard`

### Test Website Analysis:
1. Go through onboarding
2. Enter a website URL for analysis
3. Verify the color theme is consistent (purple, not blue)
4. Check that analysis completes successfully

## 🚀 Production Deployment

When deploying to production (Vercel, etc.):
1. Add all environment variables to your deployment platform
2. Update Clerk redirect URLs to use your production domain
3. Use production Clerk keys (replace `pk_test_` with `pk_live_`)
4. Use production Supabase project URLs

## 🔑 Getting API Keys

### Clerk:
1. Visit https://dashboard.clerk.com
2. Create/select your application
3. Go to **API Keys** to get your publishable and secret keys

### Supabase:
1. Visit https://supabase.com
2. Create/select your project
3. Go to **Settings** → **API** to get your URLs and keys

### OpenAI:
1. Visit https://platform.openai.com
2. Go to **API keys** to create a new key
3. Ensure you have billing set up for API usage

## 📋 Checklist

Before using the application, ensure:

- [ ] All environment variables are set in `.env.local`
- [ ] Clerk redirect URLs are configured in dashboard
- [ ] Supabase project is set up with proper schema
- [ ] OpenAI API key is valid and has billing enabled
- [ ] Application starts without errors (`npm run dev`)
- [ ] Authentication flow redirects to localhost (not accounts.dev)
- [ ] Color theme is consistent (purple gradient, no blue)

---

## 🛠️ Troubleshooting

**Issue**: Still redirecting to accounts.dev
- **Solution**: Double-check that redirect environment variables are properly set and restart your dev server

**Issue**: "Analyzing Your Website" shows wrong colors
- **Solution**: Clear browser cache and refresh the page

**Issue**: Build errors after color changes
- **Solution**: Run `npm run build` to check for TypeScript errors and fix any missing imports

For more help, check the main README.md or create an issue in the repository. 