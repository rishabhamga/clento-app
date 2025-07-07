# Database Schema Reference

This document provides a quick reference for all database tables in the AI SDR Platform.

## 📋 Table Overview

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User profiles extending Clerk auth | Referenced by all other tables |
| `leads` | Contact information and status | Many-to-many with campaigns |
| `campaigns` | Outreach campaigns | Has many sequence_steps and messages |
| `sequence_steps` | Automated sequence steps | Belongs to campaign and lead |
| `messages` | Conversation history | Belongs to lead and campaign |
| `campaign_leads` | Junction table | Links campaigns to leads |
| `integration_credentials` | Encrypted API keys | Belongs to user |

---

## 🗂️ Table Schemas

### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,           -- Clerk user ID
  email TEXT UNIQUE NOT NULL,              -- User email
  full_name TEXT,                          -- Full name
  company_name TEXT,                       -- Company name
  website_url TEXT,                        -- Company website
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `leads`
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,                 -- Contact's full name
  email TEXT,                              -- Contact's email
  linkedin_url TEXT,                       -- LinkedIn profile URL
  company TEXT,                            -- Company name
  title TEXT,                              -- Job title
  industry TEXT,                           -- Industry
  location TEXT,                           -- Location
  phone TEXT,                              -- Phone number
  status TEXT DEFAULT 'new',               -- new, contacted, replied, positive, neutral, negative, unsubscribed
  source TEXT DEFAULT 'manual',            -- manual, zoominfo, apollo, clearbit, website_visitor
  enrichment_data JSONB DEFAULT '{}',      -- Additional data from APIs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                      -- Campaign name
  description TEXT,                        -- Campaign description
  status TEXT DEFAULT 'draft',             -- draft, active, paused, completed
  sequence_template TEXT DEFAULT 'email_first', -- Template type
  settings JSONB DEFAULT '{}',             -- Campaign settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `sequence_steps`
```sql
CREATE TABLE sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,            -- Step order in sequence
  channel TEXT NOT NULL,                   -- email, linkedin_invite, linkedin_message
  status TEXT DEFAULT 'pending',           -- pending, scheduled, sent, failed, skipped
  send_time TIMESTAMPTZ,                   -- When to send
  sent_at TIMESTAMPTZ,                     -- When actually sent
  payload JSONB DEFAULT '{}',              -- Message content and metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,                 -- outbound, inbound
  channel TEXT NOT NULL,                   -- email, linkedin, phone, other
  subject TEXT,                            -- Message subject
  body TEXT,                               -- Message content
  status TEXT DEFAULT 'sent',              -- sent, delivered, opened, replied, bounced
  external_id TEXT,                        -- External message ID for tracking
  meta JSONB DEFAULT '{}',                 -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `campaign_leads`
```sql
CREATE TABLE campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',            -- active, paused, completed, opted_out
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);
```

### `integration_credentials`
```sql
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                  -- gmail, outlook, linkedin, phantombuster, zoominfo, apollo
  credentials JSONB NOT NULL,              -- Encrypted credentials
  is_active BOOLEAN DEFAULT true,          -- Whether credentials are active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

---

## 🔗 Relationships

### User → Everything
- One user has many leads, campaigns, and credentials
- All data is isolated by user (RLS policies enforce this)

### Campaign ↔ Leads (Many-to-Many)
- `campaign_leads` junction table links campaigns to leads
- One lead can be in multiple campaigns
- One campaign can contain multiple leads

### Campaign → Sequence Steps
- Each campaign generates sequence steps for each lead
- Steps define what happens when (email on day 1, LinkedIn on day 3, etc.)

### Lead → Messages
- All conversation history is stored in messages
- Both outbound (sent by system) and inbound (replies) messages

### User → Integration Credentials
- Stores encrypted API keys and OAuth tokens
- One record per provider per user

---

## 📊 Key Indexes

Performance indexes created:
- `leads_user_email_unique` - Prevents duplicate emails per user
- `sequence_steps_send_time_idx` - Fast lookup of due steps
- `sequence_steps_campaign_lead_idx` - Fast campaign/lead queries
- `messages_lead_id_idx` - Fast message history lookup
- `messages_campaign_id_idx` - Fast campaign message lookup
- `messages_created_at_idx` - Fast chronological queries

---

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies use Clerk JWT for authentication

### Data Isolation
- `clerk_id` from JWT matches user records
- All queries automatically filtered by user
- No cross-user data access possible

### Encrypted Storage
- API keys stored encrypted in `integration_credentials`
- Sensitive data protected at rest

---

## 🧮 Analytics Function

The `get_user_stats()` function provides dashboard metrics:

```sql
SELECT * FROM get_user_stats('user-uuid-here');
```

Returns:
- `total_leads` - Total leads for user
- `total_campaigns` - Total campaigns created
- `active_campaigns` - Currently running campaigns
- `messages_sent` - Total outbound messages
- `replies_received` - Total inbound messages
- `positive_replies` - Leads marked as positive

---

## 🔧 Maintenance

### Auto-updating Timestamps
Triggers automatically update `updated_at` on:
- users, leads, campaigns, sequence_steps, integration_credentials

### Data Cleanup
Foreign key constraints with `ON DELETE CASCADE` ensure:
- Deleting a user removes all their data
- Deleting a campaign removes its steps and messages
- Deleting a lead removes associated messages

---

## 📝 Usage Examples

### Create a lead
```sql
INSERT INTO leads (user_id, full_name, email, company, title)
VALUES (
  (SELECT id FROM users WHERE clerk_id = 'clerk_user_id'),
  'John Doe',
  'john@example.com',
  'Example Corp',
  'CTO'
);
```

### Get user's positive leads
```sql
SELECT * FROM leads 
WHERE user_id = (SELECT id FROM users WHERE clerk_id = 'clerk_user_id')
  AND status = 'positive';
```

### Get campaign performance
```sql
SELECT 
  c.name,
  COUNT(cl.lead_id) as total_leads,
  COUNT(CASE WHEN l.status = 'positive' THEN 1 END) as positive_leads
FROM campaigns c
LEFT JOIN campaign_leads cl ON c.id = cl.campaign_id
LEFT JOIN leads l ON cl.lead_id = l.id
WHERE c.user_id = (SELECT id FROM users WHERE clerk_id = 'clerk_user_id')
GROUP BY c.id, c.name;
``` 