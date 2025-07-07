# Supabase MCP Server Setup Guide

## Issue
The error `spawn npx ENOENT` occurs because Cursor's MCP environment can't find the `npx` command in the system PATH.

## Solution Options

### Option 1: Use Full Path to npx (Recommended)

Update your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/opt/homebrew/bin/npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Option 2: Install Globally and Use Direct Command

1. First, install the MCP server globally:
```bash
npm install -g @supabase/mcp-server-supabase
```

2. Then update your `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "/opt/homebrew/bin/supabase-mcp-server",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key", 
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Option 3: Use Node.js Direct Execution

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/opt/homebrew/bin/node",
      "args": [
        "/opt/homebrew/lib/node_modules/@supabase/mcp-server-supabase/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Get Your Supabase Credentials

1. **SUPABASE_URL**: Go to your Supabase project → Settings → API → Project URL
2. **SUPABASE_ANON_KEY**: Go to your Supabase project → Settings → API → Project API keys → anon/public
3. **SUPABASE_SERVICE_ROLE_KEY**: Go to your Supabase project → Settings → API → Project API keys → service_role

## Environment Variables Alternative

Instead of putting credentials in mcp.json, you can set them as environment variables:

### For macOS/Linux (.zshrc or .bash_profile):
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Then use this simpler mcp.json:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "/opt/homebrew/bin/npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ]
    }
  }
}
```

## Troubleshooting

### If you still get path errors:
1. Find your exact npx path: `which npx`
2. Use that full path in the "command" field

### If npm authentication fails:
1. Run: `npm login`
2. Or use yarn: `yarn global add @supabase/mcp-server-supabase`

### If the MCP server still doesn't connect:
1. Check Cursor's MCP logs in: **Cursor → Help → Show Logs → MCP**
2. Restart Cursor after updating mcp.json
3. Verify your Supabase credentials are correct

## Testing Connection

After updating your configuration:
1. Restart Cursor completely
2. Check MCP logs for successful connection
3. Try using Supabase tools in Cursor's chat

## Your Project Specific Values

For your project, use these values:

```bash
# From your .env file:
SUPABASE_URL="${PUBLIC_SUPABASE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
```

Your anon key can be found in the Supabase dashboard. 