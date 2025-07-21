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

### 4. Data Provider Configuration (NEW)
```
# Data Provider Selection (Required)
DATA_PROVIDER=apollo   # Options: 'apollo' or 'explorium' (defaults to 'apollo')

# Apollo.io API Integration
APOLLO_API_KEY=your_apollo_api_key_here

# Explorium API Integration (Alternative)
EXPLORIUM_API_KEY=your_explorium_api_key_here
```

### 5. Optional Services
```
# LinkedIn Integration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Legacy Data Providers (Optional)
PDL_API_KEY=your_pdl_api_key
```

## 🔧 Apollo API Integration Setup

### Overview
The Clento platform now supports dual data providers - Apollo.io and Explorium. The system automatically switches between providers based on the `DATA_PROVIDER` environment variable.

### Configuration Steps

#### 1. Set Data Provider
```bash
# In your .env.local file
DATA_PROVIDER=apollo    # Use Apollo.io
# OR
DATA_PROVIDER=explorium # Use Explorium
```

#### 2. Configure Apollo.io API Key
1. **Get your Apollo API Key:**
   - Visit https://app.apollo.io/
   - Log in to your account
   - Go to **Settings** → **API Keys**
   - Create a new API key or copy an existing one

2. **Add to environment:**
```bash
APOLLO_API_KEY=your_apollo_api_key_here
```

#### 3. Verify Setup
```bash
# Start your development server
npm run dev

# Check the console logs for provider confirmation
# You should see: "Using data provider: apollo"
```

### Provider Switching Features

#### Apollo.io Provider Features:
- ✅ Email verification and confidence scoring
- ✅ Phone number availability
- ✅ Social media profiles (LinkedIn, Twitter, etc.)
- ✅ Technographic data (company technologies)
- ✅ Advanced filtering (seniority, location, company size)
- ✅ Real-time search results

#### Explorium Provider Features:
- ✅ Email verification and confidence scoring
- ✅ Phone number availability
- ✅ Social media profiles
- ✅ Technographic data
- ✅ Intent data capabilities
- ✅ Advanced B2B database coverage

### Provider-Specific Filter Formats

#### Apollo Seniority Options:
- `owner`, `founder`, `c_suite`, `vp`, `director`, `manager`, `senior`, `entry`

#### Explorium Seniority Options:
- `cxo`, `vp`, `director`, `manager`, `senior`, `entry`

### API Endpoint Behavior

The system automatically adapts API calls based on the configured provider:

```javascript
// Apollo.io endpoint
POST /v1/mixed_people/search

// Explorium endpoint
POST /api/explorium/search
```

### Usage Examples

#### Natural Language Processing
The system adapts NLP parsing based on the active provider:

```javascript
// For Apollo
"Find C-suite executives in tech companies"
// Converts to: seniorities: ['c_suite']

// For Explorium  
"Find C-suite executives in tech companies"
// Converts to: seniorities: ['cxo']
```

#### Filter Transformation
The system automatically transforms unified filters to provider-specific formats:

```javascript
// Unified filter input
{
  seniorities: ['executive'],
  companyHeadcount: ['51-200'],
  locations: ['United States']
}

// Apollo transformation
{
  person_seniorities: ['c_suite'],
  organization_num_employees_ranges: ['51,200'],
  person_locations: ['United States']
}
```

### Error Handling

The system includes comprehensive error handling for both providers:

#### Common Error Scenarios:
1. **Missing API Key**: Clear error message with setup instructions
2. **Invalid Provider**: Defaults to Apollo with warning
3. **Rate Limiting**: Respects provider-specific rate limits
4. **API Failures**: Graceful fallback with detailed error messages

### Rate Limits

#### Apollo.io Limits:
- 60 requests per minute
- 5,000 requests per day

#### Explorium Limits:
- 100 requests per minute
- 10,000 requests per day

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

### Test Data Provider Integration:
1. **Test Apollo Provider:**
   ```bash
   # Set in .env.local
   DATA_PROVIDER=apollo
   APOLLO_API_KEY=your_apollo_key
   ```
   - Restart dev server
   - Navigate to lead search page
   - Verify Apollo-specific filter options appear
   - Test search functionality

2. **Test Explorium Provider:**
   ```bash
   # Set in .env.local
   DATA_PROVIDER=explorium
   EXPLORIUM_API_KEY=your_explorium_key
   ```
   - Restart dev server
   - Navigate to lead search page
   - Verify Explorium-specific filter options appear
   - Test search functionality

3. **Test Provider Switching:**
   - Switch between providers
   - Verify UI adapts correctly
   - Check that search results format correctly
   - Confirm no data mixing between providers

## 🚀 Production Deployment

When deploying to production (Vercel, etc.):
1. Add all environment variables to your deployment platform
2. Update Clerk redirect URLs to use your production domain
3. Use production Clerk keys (replace `pk_test_` with `pk_live_`)
4. Use production Supabase project URLs
5. **Set DATA_PROVIDER to your preferred provider**
6. **Configure appropriate data provider API keys**

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

### Apollo.io:
1. Visit https://app.apollo.io/
2. Log in to your account
3. Go to **Settings** → **API Keys**
4. Create a new API key or copy existing one
5. Ensure you have an active subscription for API access

### Explorium:
1. Visit https://www.explorium.ai/
2. Contact their sales team for API access
3. API keys are provided upon subscription approval

## 📋 Checklist

Before using the application, ensure:

- [ ] All environment variables are set in `.env.local`
- [ ] Clerk redirect URLs are configured in dashboard
- [ ] Supabase project is set up with proper schema
- [ ] OpenAI API key is valid and has billing enabled
- [ ] **DATA_PROVIDER is set to your preferred provider**
- [ ] **Corresponding data provider API key is configured**
- [ ] Application starts without errors (`npm run dev`)
- [ ] Authentication flow redirects to localhost (not accounts.dev)
- [ ] Color theme is consistent (purple gradient, no blue)
- [ ] **Data provider switching works correctly**
- [ ] **Search functionality works with selected provider**

---

## 🛠️ Troubleshooting

### Data Provider Issues

**Issue**: "DATA_PROVIDER not set or invalid, defaulting to apollo"
- **Solution**: Set `DATA_PROVIDER=apollo` or `DATA_PROVIDER=explorium` in your `.env.local` file

**Issue**: "API key not configured for [provider] provider"
- **Solution**: Ensure the correct API key is set (e.g., `APOLLO_API_KEY` for Apollo provider)

**Issue**: Provider-specific filters not showing
- **Solution**: Restart dev server after changing DATA_PROVIDER environment variable

**Issue**: Search results not appearing
- **Solution**: Check API key validity and subscription status with the provider

### General Issues

**Issue**: Still redirecting to accounts.dev
- **Solution**: Double-check that redirect environment variables are properly set and restart your dev server

**Issue**: "Analyzing Your Website" shows wrong colors
- **Solution**: Clear browser cache and refresh the page

**Issue**: Build errors after color changes
- **Solution**: Run `npm run build` to check for TypeScript errors and fix any missing imports

For more help, check the main README.md or create an issue in the repository. 