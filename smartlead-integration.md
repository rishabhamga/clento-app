PRD for Smartlead Email Integration into Clento.ai
Overview:
The objective is to integrate Smartlead’s email campaign functionalities into Clento.ai, enabling customers to visualize detailed campaign analytics, inbox management, lead activities, and real-time reply capabilities within Clento.ai, leveraging Smartlead's robust APIs and webhook systems.

Features to Integrate:
Inbox Management & Reply Support

Campaign Performance & Analytics

Email Deliverability Metrics

Lead-Specific Activity Logs

Real-Time Data Sync (Webhooks)

Implementation & Integration Plan:
Step 1: Account & Customer Mapping Setup
Logic:
You'll have one Master Smartlead Account.

Create multiple Organizations (Orgs) within Smartlead corresponding to your Clento customers.

Store the Smartlead Organization ID against each customer record in your Supabase database for easy mapping and identification.

Supabase Database Schema Modification:
sql
Copy
Edit
-- Add columns to existing customers table:
ALTER TABLE customers
ADD COLUMN smartlead_org_id TEXT,
ADD COLUMN smartlead_org_name TEXT;
Process:
For every new customer onboarded to Clento:

Create an Org on Smartlead.

Manually store this smartlead_org_id in Supabase.

Step 2: Smartlead Webhook Integration (Real-time Data Sync)
Smartlead Webhooks (for real-time data):
Inbound Replies

Opens, Clicks, Replies (lead activities)

Email Delivered/Bounced

Unsubscribes/Spam Reports

Setting up Webhook Endpoint (on Clento backend):
Create a POST endpoint in your backend server to consume webhook payloads:

Example:

nginx
Copy
Edit
POST https://api.clento.ai/webhooks/smartlead
Webhook Payload Sample (from Smartlead docs):

json
Copy
Edit
{
    "event": "email_opened",
    "email": "lead@example.com",
    "timestamp": "2023-08-01T12:00:00Z",
    "campaign_id": "abc123",
    "message_id": "msg456",
    "org_id": "org789"
}
Backend Logic (pseudo-code):

javascript
Copy
Edit
app.post('/webhooks/smartlead', async (req, res) => {
  const { event, email, timestamp, campaign_id, message_id, org_id } = req.body;

  // Validate org_id and map to customer
  const customer = await supabase.from('customers').select('*').eq('smartlead_org_id', org_id).single();

  if (!customer.data) {
    return res.status(400).send('Organization not found');
  }

  // Store events in Supabase
  await supabase.from('email_events').insert({
    event_type: event,
    email,
    campaign_id,
    message_id,
    customer_id: customer.data.id,
    timestamp
  });

  res.status(200).send('Event received');
});
Supabase Schema for Email Events:
sql
Copy
Edit
CREATE TABLE email_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  campaign_id TEXT,
  message_id TEXT,
  event_type TEXT,
  email TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
Step 3: Fetching and Displaying Campaign Analytics
Smartlead APIs:
Use Smartlead’s API endpoints to fetch data when users open dashboards:

Campaign Analytics Endpoint:

ruby
Copy
Edit
GET /api/v1/orgs/:orgId/campaigns/:campaignId/stats
Inbox/Email Details Endpoint:

ruby
Copy
Edit
GET /api/v1/orgs/:orgId/campaigns/:campaignId/inbox
UI Implementation (on Clento frontend dashboard):
Campaign Analytics Data:

Open rates, click rates, reply rates

Deliverability stats (bounces, spam)

Visual components in your dashboard:

Campaign summary cards (matching your existing UI theme).

Interactive graphs for opens, clicks, replies, bounce rates.

Inbox Details:

List all inbound replies/emails.

Enable users to read replies and respond directly from the Clento UI.

Step 4: Lead-specific Activity Log & Enhanced Lead Details Page
Logic:
Maintain a detailed log of each lead's interaction (opened, replied, bounced, etc.).

Map events to specific leads.

Supabase Schema Modification:
sql
Copy
Edit
-- Enhance existing leads table:
ALTER TABLE leads
ADD COLUMN linkedin_url TEXT,
ADD COLUMN company TEXT,
ADD COLUMN smartlead_campaign_id TEXT,
ADD COLUMN last_email_event TEXT,
ADD COLUMN last_event_timestamp TIMESTAMPTZ;
Sample UI (Leads Page):
Table view (matching your existing UI):

Columns: Name, Email, LinkedIn URL, Company, Campaign Name, Last Interaction (opened, clicked, replied), Timestamp

Filters: Campaign, Company, Interaction type, Date range.

Step 5: Replying to Emails from Clento.ai (Reply Support)
Smartlead API for sending replies:
ruby
Copy
Edit
POST /api/v1/orgs/:orgId/campaigns/:campaignId/inbox/reply
Sample Request Payload:
json
Copy
Edit
{
  "message_id": "original_msg_id",
  "reply_text": "Your reply message here"
}
Implementation (Frontend UI):
On Inbox view, clicking an email opens a reply modal.

Reply sent via your backend server using Smartlead’s reply API.

Backend Server Logic (pseudo-code):
javascript
Copy
Edit
app.post('/reply-email', async (req, res) => {
  const { customer_id, campaign_id, message_id, reply_text } = req.body;

  const customer = await supabase.from('customers').select('smartlead_org_id').eq('id', customer_id).single();

  const response = await axios.post(`https://api.smartlead.ai/api/v1/orgs/${customer.data.smartlead_org_id}/campaigns/${campaign_id}/inbox/reply`, {
    message_id,
    reply_text
  }, {
    headers: {
      Authorization: `Bearer ${SMARTLEAD_API_KEY}`
    }
  });

  res.status(200).send(response.data);
});
API References Summary (Smartlead):
Webhook Integration:

Event Types: Email Opened, Clicked, Replied, Delivered, Bounced, etc.

GET Campaign Analytics:

Endpoint: /api/v1/orgs/:orgId/campaigns/:campaignId/stats

Data: opens, clicks, replies, bounces, etc.

GET Inbox Messages:

Endpoint: /api/v1/orgs/:orgId/campaigns/:campaignId/inbox

Data: message_id, email content, sender, timestamp, reply status.

POST Reply Emails:

Endpoint: /api/v1/orgs/:orgId/campaigns/:campaignId/inbox/reply

Data: original message_id, reply_text.

Additional Recommended Enhancements (Future Scope):
Email Warm-up tracking (Smartlead API supports warm-up analytics).

Automated A/B Testing for Campaigns (fetch variations and track performance).

Dynamic Smartlead Org creation from Clento UI (using Smartlead API).

Key Points to Note for AI Coder:
Ensure secure handling of API keys in environment variables.

Proper error handling for API calls and webhooks.

Real-time UI updates (websocket integration suggested with Supabase realtime if needed).

Maintain Supabase indexes for faster query performance.

This detailed PRD and integration plan provides everything needed for your AI coder to implement Smartlead’s powerful email campaign capabilities into Clento.ai.