# Website Analysis System Fix

## Problem
The website analysis system is returning empty logs and not performing fresh AI analysis because:

1. **Caching Issue**: System returns cached/failed analysis instead of doing fresh analysis
2. **Missing OpenAI API Key**: API key is not properly configured
3. **Silent Failures**: Errors are not properly surfaced to the user

## Solution

### Step 1: Configure OpenAI API Key

#### Option A: For Development (.env file)
1. Create a `.env` file in your project root:
```bash
# Create .env file
touch .env
```

2. Add your OpenAI API key to the `.env` file:
```env
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

3. Get your OpenAI API key from: https://platform.openai.com/api-keys

#### Option B: For Cursor/MCP Integration
Update `.cursor/mcp.json` with your actual API key:
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "OPENAI_API_KEY": "sk-your_actual_openai_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_key_if_needed",
        "PERPLEXITY_API_KEY": "your_perplexity_key_if_needed"
      }
    }
  }
}
```

### Step 2: Test OpenAI Connection

Run the test script to verify your API key works:
```bash
node test-openai-connection.js
```

This will:
- Check if your API key is configured
- Test the connection to OpenAI
- Verify JSON parsing works

### Step 3: Clear Failed Analysis Records

Clear any stuck or failed analysis records:
```bash
node clear-failed-analysis.js
```

This will:
- Delete failed analysis records
- Remove stuck "analyzing" records older than 1 hour
- Show remaining analyses

### Step 4: Force Fresh Analysis

The analyze-site API now supports a `force` parameter to bypass cache:

#### Frontend Usage
When calling the analyze-site API, add `force: true`:
```javascript
const response = await fetch('/api/analyze-site', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    website_url: 'https://example.com',
    force: true  // This bypasses cache and forces fresh analysis
  })
});
```

#### Testing with curl
```bash
curl -X POST http://localhost:3000/api/analyze-site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_clerk_token" \
  -d '{
    "website_url": "https://example.com",
    "force": true
  }'
```

### Step 5: Monitor Analysis Logs

Watch the logs during analysis:
```bash
npm run dev
```

Look for these log messages:
- ✅ "OpenAI configuration status: { hasApiKey: true, ... }"
- ✅ "Starting comprehensive analysis of https://example.com"
- ✅ "Analysis completed in X seconds"
- ❌ "OpenAI API key is not configured"
- ❌ "AI analysis failed: ..."

## Key Changes Made

### 1. Enhanced analyze-site API (`src/app/api/analyze-site/route.ts`)
- Added `force` parameter to bypass cache
- Deletes existing analysis when force=true
- Better error handling and logging

### 2. Improved AI Service (`src/lib/ai-icp-service.ts`)
- Added OpenAI configuration check
- Better error handling (throws errors instead of silent fallback)
- More detailed logging for debugging

### 3. Utility Scripts
- `test-openai-connection.js`: Test API key and connection
- `clear-failed-analysis.js`: Clean up database

## Troubleshooting

### Error: "OpenAI API key is not configured"
- Check your `.env` file has the correct API key
- For Cursor, check `.cursor/mcp.json` has the real API key
- Restart your development server after adding the key

### Error: "Authentication failed - check your API key" 
- Verify your API key is correct
- Check if you have sufficient credits: https://platform.openai.com/usage
- Make sure the key starts with "sk-"

### Error: "Returning existing completed analysis"
- Use `force: true` in your API request
- Or run the clear script to remove old analyses

### Still getting empty analysis?
1. Check the browser console for errors
2. Check the server logs for detailed error messages
3. Run `node test-openai-connection.js` to verify API setup
4. Try with `force: true` parameter

## Testing the Fix

1. Set up your OpenAI API key
2. Run `node test-openai-connection.js` to verify connection
3. Run `node clear-failed-analysis.js` to clean database
4. Test analysis with force parameter:
   ```javascript
   fetch('/api/analyze-site', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       website_url: 'https://example.com',
       force: true
     })
   })
   ```
5. Monitor logs for successful analysis

The system should now perform fresh AI analysis and provide detailed results instead of empty logs. 