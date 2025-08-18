export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          website_url: string | null;
          smartlead_org_id: string | null;
          smartlead_org_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          website_url?: string | null;
          smartlead_org_id?: string | null;
          smartlead_org_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          website_url?: string | null;
          smartlead_org_id?: string | null;
          smartlead_org_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profile: {
        Row: {
          user_id: string;
          company_name: string | null;
          website_url: string | null;
          site_summary: string | null;
          icp: Record<string, unknown>;
          linkedin_connected: boolean;
          completed: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string | null;
          website_url?: string | null;
          site_summary?: string | null;
          icp?: Record<string, unknown>;
          linkedin_connected?: boolean;
          completed?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          company_name?: string | null;
          website_url?: string | null;
          site_summary?: string | null;
          icp?: Record<string, unknown>;
          linkedin_connected?: boolean;
          completed?: boolean;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          linkedin_url: string | null;
          company: string | null;
          title: string | null;
          industry: string | null;
          location: string | null;
          phone: string | null;
          status: 'new' | 'contacted' | 'replied' | 'positive' | 'neutral' | 'negative' | 'unsubscribed';
          source: 'manual' | 'zoominfo' | 'apollo' | 'clearbit' | 'website_visitor' | 'syndie';
          enrichment_data: Record<string, unknown>;
          smartlead_campaign_id: string | null;
          syndie_campaign_id: string | null;
          organization_id: string | null;
          clento_campaign_id?: string | null;
          last_email_event: string | null;
          last_event_timestamp: string | null;
          // Syndie integration fields
          syndie_lead_id: string | null;
          linkedin_connection_status: 'not_connected' | 'pending' | 'connected' | 'replied' | 'bounced' | 'not_interested';
          steps: Record<string, unknown>[];
          campaign_info: Record<string, unknown>;
          seat_info: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          linkedin_url?: string | null;
          company?: string | null;
          title?: string | null;
          industry?: string | null;
          location?: string | null;
          phone?: string | null;
          status?: 'new' | 'contacted' | 'replied' | 'positive' | 'neutral' | 'negative' | 'unsubscribed';
          source?: 'manual' | 'zoominfo' | 'apollo' | 'clearbit' | 'website_visitor' | 'syndie';
          enrichment_data?: Record<string, unknown>;
          smartlead_campaign_id?: string | null;
          syndie_campaign_id?: string | null;
          clento_campaign_id?: string | null;
          organization_id: string | null;
          last_email_event?: string | null;
          last_event_timestamp?: string | null;
          // Syndie integration fields
          syndie_lead_id?: string | null;
          linkedin_connection_status?: 'not_connected' | 'pending' | 'connected' | 'replied' | 'bounced' | 'not_interested';
          steps?: Record<string, unknown>[];
          campaign_info?: Record<string, unknown>;
          seat_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string | null;
          linkedin_url?: string | null;
          company?: string | null;
          title?: string | null;
          industry?: string | null;
          location?: string | null;
          phone?: string | null;
          status?: 'new' | 'contacted' | 'replied' | 'positive' | 'neutral' | 'negative' | 'unsubscribed';
          source?: 'manual' | 'zoominfo' | 'apollo' | 'clearbit' | 'website_visitor' | 'syndie';
          enrichment_data?: Record<string, unknown>;
          smartlead_campaign_id?: string | null;
          syndie_campaign_id?: string | null;
          clento_campaign_id?: string | null;
          organization_id: string | null;
          last_email_event?: string | null;
          last_event_timestamp?: string | null;
          // Syndie integration fields
          syndie_lead_id?: string | null;
          linkedin_connection_status?: 'not_connected' | 'pending' | 'connected' | 'replied' | 'bounced' | 'not_interested';
          steps?: Record<string, unknown>[];
          campaign_info?: Record<string, unknown>;
          seat_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: 'draft' | 'active' | 'paused' | 'completed';
          sequence_template: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          sequence_template?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          sequence_template?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      sequence_steps: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          step_number: number;
          channel: 'email' | 'linkedin_invite' | 'linkedin_message';
          status: 'pending' | 'scheduled' | 'sent' | 'failed' | 'skipped';
          send_time: string | null;
          sent_at: string | null;
          payload: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          step_number: number;
          channel: 'email' | 'linkedin_invite' | 'linkedin_message';
          status?: 'pending' | 'scheduled' | 'sent' | 'failed' | 'skipped';
          send_time?: string | null;
          sent_at?: string | null;
          payload?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          lead_id?: string;
          step_number?: number;
          channel?: 'email' | 'linkedin_invite' | 'linkedin_message';
          status?: 'pending' | 'scheduled' | 'sent' | 'failed' | 'skipped';
          send_time?: string | null;
          sent_at?: string | null;
          payload?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          lead_id: string;
          campaign_id: string;
          direction: 'outbound' | 'inbound';
          channel: 'email' | 'linkedin' | 'phone' | 'other';
          subject: string | null;
          body: string | null;
          status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
          external_id: string | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          campaign_id: string;
          direction: 'outbound' | 'inbound';
          channel: 'email' | 'linkedin' | 'phone' | 'other';
          subject?: string | null;
          body?: string | null;
          status?: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
          external_id?: string | null;
          meta?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          campaign_id?: string;
          direction?: 'outbound' | 'inbound';
          channel?: 'email' | 'linkedin' | 'phone' | 'other';
          subject?: string | null;
          body?: string | null;
          status?: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
          external_id?: string | null;
          meta?: Record<string, unknown>;
          created_at?: string;
        };
      };
      campaign_leads: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          status: 'active' | 'paused' | 'completed' | 'opted_out';
          added_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          status?: 'active' | 'paused' | 'completed' | 'opted_out';
          added_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          lead_id?: string;
          status?: 'active' | 'paused' | 'completed' | 'opted_out';
          added_at?: string;
        };
      };
      email_events: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          message_id: string;
          event_type: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'email_delivered' | 'email_sent' | 'email_unsubscribed' | 'email_spam_reported' | 'email_follow_up_opened' | 'email_follow_up_clicked' | 'email_follow_up_replied';
          email: string;
          lead_id: string | null;
          smartlead_org_id: string | null;
          event_data: Record<string, unknown>;
          timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id: string;
          message_id: string;
          event_type: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'email_delivered' | 'email_sent' | 'email_unsubscribed' | 'email_spam_reported' | 'email_follow_up_opened' | 'email_follow_up_clicked' | 'email_follow_up_replied';
          email: string;
          lead_id?: string | null;
          smartlead_org_id?: string | null;
          event_data?: Record<string, unknown>;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string;
          message_id?: string;
          event_type?: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'email_delivered' | 'email_sent' | 'email_unsubscribed' | 'email_spam_reported' | 'email_follow_up_opened' | 'email_follow_up_clicked' | 'email_follow_up_replied';
          email?: string;
          lead_id?: string | null;
          smartlead_org_id?: string | null;
          event_data?: Record<string, unknown>;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      integration_credentials: {
        Row: {
          id: string;
          user_id: string;
          provider: 'gmail' | 'outlook' | 'linkedin' | 'phantombuster' | 'zoominfo' | 'apollo' | 'smartlead';
          credentials: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'gmail' | 'outlook' | 'linkedin' | 'phantombuster' | 'zoominfo' | 'apollo' | 'smartlead';
          credentials: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'gmail' | 'outlook' | 'linkedin' | 'phantombuster' | 'zoominfo' | 'apollo' | 'smartlead';
          credentials?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_active_jobs: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          job_id: string;
          company_name: string;
          company_website: string | null;
          linkedin_url: string;
          department: string;
          job_titles: string[] | null;
          match_count: number;
          job_data: Record<string, unknown>;
          linkedin_jobs: Record<string, unknown>[];
          career_page_jobs: Record<string, unknown>[];
          processing_status: string;
          error_message: string | null;
          scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          job_id: string;
          company_name: string;
          company_website?: string | null;
          linkedin_url: string;
          department: string;
          job_titles?: string[] | null;
          match_count?: number;
          job_data?: Record<string, unknown>;
          linkedin_jobs?: Record<string, unknown>[];
          career_page_jobs?: Record<string, unknown>[];
          processing_status?: string;
          error_message?: string | null;
          scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          job_id?: string;
          company_name?: string;
          company_website?: string | null;
          linkedin_url?: string;
          department?: string;
          job_titles?: string[] | null;
          match_count?: number;
          job_data?: Record<string, unknown>;
          linkedin_jobs?: Record<string, unknown>[];
          career_page_jobs?: Record<string, unknown>[];
          processing_status?: string;
          error_message?: string | null;
          scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_filter_requests: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          job_id: string;
          original_filename: string;
          total_companies: number;
          processed_companies: number;
          successful_companies: number;
          failed_companies: number;
          departments: string[];
          job_titles: string[] | null;
          processing_status: string;
          csv_output_url: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          job_id: string;
          original_filename: string;
          total_companies?: number;
          processed_companies?: number;
          successful_companies?: number;
          failed_companies?: number;
          departments: string[];
          job_titles?: string[] | null;
          processing_status?: string;
          csv_output_url?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          job_id?: string;
          original_filename?: string;
          total_companies?: number;
          processed_companies?: number;
          successful_companies?: number;
          failed_companies?: number;
          departments?: string[];
          job_titles?: string[] | null;
          processing_status?: string;
          csv_output_url?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_stats: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          total_leads: number;
          total_campaigns: number;
          active_campaigns: number;
          messages_sent: number;
          replies_received: number;
          positive_replies: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

export interface Lead {
  id: string
  external_id: string

  // Personal information
  first_name?: string
  last_name?: string
  full_name: string
  email: string
  phone?: string
  headline?: string
  photo_url?: string

  // Professional information
  title?: string
  seniority?: string
  years_experience?: number
  time_in_current_role?: string

  // Professional categorization from Apollo
  departments?: string[]
  subdepartments?: string[]
  functions?: string[]

  // Company information
  company: string
  company_id?: string
  industry?: string
  employee_count?: number
  revenue?: number

  // Enhanced company details
  company_website?: string
  company_linkedin?: string
  company_founded_year?: number
  company_logo_url?: string
  company_phone?: string
  company_alexa_ranking?: number
  company_primary_domain?: string

  // Company growth metrics
  company_headcount_six_month_growth?: number
  company_headcount_twelve_month_growth?: number
  company_headcount_twenty_four_month_growth?: number

  // Location information
  location?: string
  city?: string
  state?: string
  country?: string

  // Social profiles
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  github_url?: string

  // Employment history
  employment_history?: EmploymentRecord[]

  // Email verification
  email_status?: 'verified' | 'likely' | 'guessed' | 'unavailable'

  // Data source information
  source: string
  verified: boolean
  confidence: number
  technologies: string[]
  keywords?: string[]

  // Metadata
  created_at: string
  updated_at: string
  last_enriched_at?: string
  search_count: number
  last_searched_at: string
}

export interface EmploymentRecord {
  id?: string
  organization_id?: string
  organization_name?: string
  title?: string
  start_date?: string
  end_date?: string
  current?: boolean
  description?: string
}

export interface CampaignLead {
  id: string
  campaign_id: string
  lead_id: string
  assigned_at: string
  assigned_by: string
  status: 'pending' | 'contacted' | 'replied' | 'converted' | 'bounced' | 'unsubscribed'
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  first_contacted_at?: string
  last_contacted_at?: string
  replied_at?: string
  converted_at?: string
  unsubscribed_at?: string
  notes?: string
  custom_fields?: Record<string, any>
  lead: Lead
}

export interface LeadSearch {
  id: string
  user_id: string
  filters: Record<string, any>
  source: string
  total_results: number
  leads_found: number
  search_duration_ms?: number
  primary_provider?: string
  fallback_used: boolean
  created_at: string
  estimated_cost: number
}

export interface LeadEnrichment {
  id: string
  lead_id: string
  provider: string
  attempted_at: string
  successful: boolean
  fields_updated?: string[]
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
  error_message?: string
  cost: number
}

export interface EmailVerification {
  id: string
  lead_id: string
  email: string
  verified_at: string
  provider: string
  is_valid: boolean
  is_deliverable: boolean
  verification_reason?: string
  mx_record_found?: boolean
  smtp_check_passed?: boolean
  disposable_email: boolean
  cost: number
}

// Smartlead Integration Types
export interface SmartleadEmailEvent {
  id: string
  user_id: string
  campaign_id: string
  message_id: string
  event_type: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'email_delivered' | 'email_sent' | 'email_unsubscribed' | 'email_spam_reported' | 'email_follow_up_opened' | 'email_follow_up_clicked' | 'email_follow_up_replied'
  email: string
  lead_id?: string
  smartlead_org_id?: string
  event_data: Record<string, any>
  timestamp: string
  created_at: string
  updated_at: string
}

export interface SmartleadWebhookPayload {
  event: string
  email: string
  timestamp: string
  campaign_id: string
  message_id: string
  org_id: string
  additional_data?: Record<string, any>
}

export interface SmartleadCampaignStats {
  campaign_id: string
  opens: number
  clicks: number
  replies: number
  bounces: number
  delivered: number
  sent: number
  unsubscribed: number
  spam_reports: number
  open_rate: number
  click_rate: number
  reply_rate: number
  bounce_rate: number
  last_updated: string
}

export interface SmartleadInboxMessage {
  message_id: string
  campaign_id: string
  email: string
  sender: string
  subject: string
  body: string
  timestamp: string
  reply_status: 'pending' | 'replied' | 'no_reply_needed'
  thread_id?: string
  lead_id?: string
}

export interface SmartleadOrganization {
  id: string
  name: string
  created_at: string
  status: 'active' | 'inactive'
  user_id: string
}

export interface LeadWithSmartleadData extends Lead {
  smartlead_campaign_id?: string
  last_email_event?: string
  last_event_timestamp?: string
  email_events?: SmartleadEmailEvent[]
  campaign_stats?: SmartleadCampaignStats
}