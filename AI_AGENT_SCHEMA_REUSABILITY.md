# AI Agent Schema Reusability Documentation

## Overview
This document explains how the existing AI SDR database schema can be leveraged to support multiple AI agents (AI SDR, AI Marketer, AI Recruiter, AI Sales Buddy, Asset Inventory AI) without requiring separate database structures.

## Core Principle: Semantic Mapping
The key insight is that all AI agents follow similar workflows:
1. **Entity Management** (Leads/Candidates/Contacts/Assets)
2. **Entity Lists** (Lead Lists/Candidate Lists/Contact Lists/Asset Lists)
3. **Campaigns** (Outreach/Marketing/Recruitment/Sales Prep/Security Queries)
4. **Messages/Communications** (Sales Pitches/Job Offers/Marketing Content/Call Prep/Security Alerts)
5. **Analytics** (Response Rates/Application Rates/Engagement/Success Rates)

## Database Schema Mapping

### 1. Core Tables and Their Multi-Agent Usage

#### `leads` Table → Universal Entity Table
```sql
-- This table represents different entities based on agent context:
- AI SDR: Sales prospects/leads
- AI Recruiter: Job candidates  
- AI Marketer: Marketing contacts
- AI Sales Buddy: Call preparation subjects
- Asset Inventory AI: Security assets
```

**Key Fields:**
- `name`: Person/Entity name
- `email`: Contact email (for recruitment/marketing)
- `company`: Company/Organization
- `title`: Job title/Role/Asset type
- `linkedin_url`: LinkedIn profile (for recruitment)
- `phone`: Contact number
- `status`: Universal status (new/contacted/replied/positive/negative)

#### `lead_lists` Table → Universal Entity Lists
```sql
-- This table represents different list types:
- AI SDR: Lead lists (by industry/role/company size)
- AI Recruiter: Candidate pools (by skills/experience/location)
- AI Marketer: Contact segments (by demographics/interests)
- AI Sales Buddy: Client lists (by deal stage/priority)
- Asset Inventory AI: Asset groups (by type/criticality/location)
```

#### `campaigns` Table → Universal Campaign Management
```sql
-- This table handles all campaign types:
- AI SDR: Sales outreach campaigns
- AI Recruiter: Recruitment campaigns
- AI Marketer: Marketing campaigns  
- AI Sales Buddy: Call preparation sessions
- Asset Inventory AI: Security assessment queries
```

**Key Fields:**
- `name`: Campaign/Session name
- `type`: Campaign type (can distinguish agent context)
- `settings`: JSON field for agent-specific configurations
- `sequence_template`: Message templates (sales/job offers/marketing/prep notes)

#### `messages` Table → Universal Communication
```sql
-- This table stores all message types:
- AI SDR: Sales pitches and follow-ups
- AI Recruiter: Job descriptions and interview invitations
- AI Marketer: Marketing content and newsletters
- AI Sales Buddy: Call preparation notes and insights
- Asset Inventory AI: Security alerts and assessment reports
```

### 2. Agent-Specific Configurations

#### UI Layer Semantic Mapping
Each agent uses the same database tables but with different terminology:

```typescript
const agentConfig = {
  'ai-sdr': {
    entityName: 'Leads',
    listName: 'Lead Lists',
    campaignName: 'Sales Campaigns'
  },
  'ai-recruiter': {
    entityName: 'Candidates', 
    listName: 'Candidate Lists',
    campaignName: 'Recruitment Campaigns'
  },
  'ai-marketer': {
    entityName: 'Contacts',
    listName: 'Contact Lists', 
    campaignName: 'Marketing Campaigns'
  }
  // ... etc
}
```

#### Message Template Differentiation
The `sequence_template` field in campaigns table stores JSON with agent-specific message templates:

```json
{
  "ai-sdr": {
    "subject": "Quick question about {{company}}",
    "message": "Hi {{name}}, I noticed {{company}} is growing rapidly..."
  },
  "ai-recruiter": {
    "subject": "Exciting opportunity at {{our_company}}",
    "message": "Hi {{name}}, We're looking for a talented {{title}}..."
  },
  "ai-marketer": {
    "subject": "Special offer for {{company}}",
    "message": "Hi {{name}}, We have an exclusive offer for {{company}}..."
  }
}
```

## Implementation Strategy

### 1. Agent Context Management
```typescript
// Store selected agent in localStorage/session
const selectedAgent = localStorage.getItem('selectedAgent') || 'ai-sdr'

// Filter data by agent context where needed
const getLeadsByAgent = (agent: string) => {
  // Same table, different semantic meaning
  return supabase.from('leads').select('*').eq('agent_type', agent)
}
```

### 2. Dynamic UI Rendering
All pages (leads, lead-lists, campaigns) use the same components but with dynamic configuration:

```typescript
const pageConfig = agentConfigs[selectedAgent]
// Uses pageConfig.entityName instead of hardcoded "Leads"
// Uses pageConfig.campaignType instead of hardcoded "Sales Campaign"
```

### 3. Campaign Type Differentiation
Use the `settings` JSON field in campaigns to store agent-specific data:

```json
{
  "agent_type": "ai-recruiter",
  "job_requirements": {
    "skills": ["React", "Node.js"],
    "experience": "3+ years",
    "location": "Remote"
  },
  "message_tone": "professional",
  "interview_process": "3 rounds"
}
```

## Benefits of This Approach

### 1. **Code Reusability** 
- Single codebase supports all agents
- Shared components and logic
- Consistent user experience

### 2. **Database Efficiency**
- No duplicate table structures
- Shared analytics and reporting
- Single backup/maintenance strategy

### 3. **Development Speed**
- New agent types can be added quickly
- Feature improvements benefit all agents
- Single test suite covers all scenarios

### 4. **Data Insights**
- Cross-agent analytics possible
- Unified reporting dashboard
- Better understanding of user patterns

## Agent-Specific Customizations

### AI Recruiter Specific Features
1. **Candidate Filtering:**
   - Skills-based filtering (stored in lead.tags)
   - Experience level (stored in lead.title field)
   - Location preferences (stored in lead.location)

2. **Interview Pipeline:**
   - Use campaign stages for interview rounds
   - Message templates for interview invitations
   - Status tracking (applied → screening → interview → offer)

3. **Job Matching:**
   - Store job requirements in campaign.settings
   - Match candidates to multiple job postings
   - Track application status per job

### AI Marketer Specific Features
1. **Segmentation:**
   - Use lead_lists for audience segments
   - Dynamic content based on segment
   - A/B testing through campaign variants

2. **Engagement Tracking:**
   - Email opens/clicks (existing analytics)
   - Content engagement metrics
   - Conversion funnel tracking

### AI Sales Buddy Specific Features
1. **Call Preparation:**
   - Store call notes in messages table
   - Previous interaction history
   - Deal context and talking points

2. **Performance Insights:**
   - Call success rates
   - Follow-up recommendations
   - Deal progression analytics

## Migration Strategy

### Phase 1: Core Infrastructure ✅
- Dynamic sidebar navigation
- Agent selection mechanism
- UI terminology mapping

### Phase 2: Page Customization ✅
- Dynamic page titles and descriptions
- Agent-specific button text
- Contextual messaging

### Phase 3: Data Layer Enhancement (Next Steps)
- Add `agent_type` field to relevant tables
- Implement agent-specific filtering
- Create agent-specific message templates

### Phase 4: Advanced Features (Future)
- Agent-specific analytics dashboards
- Cross-agent workflow automation
- Advanced AI agent collaboration features

## Conclusion

This schema reusability approach allows the Observe Agents platform to support multiple AI agent types without database duplication, while maintaining the flexibility to customize each agent's experience. The semantic mapping strategy ensures that each agent feels purpose-built while leveraging a shared, robust foundation.
