// Syndie Integration TypeScript Types
// Types for Syndie automation webhook payloads and lead management

export type LinkedInConnectionStatus =
  | 'not_connected'
  | 'pending'
  | 'connected'
  | 'replied'
  | 'bounced'
  | 'not_interested';

export interface SyndieLeadStep {
  stepNodeId: string;
  timestamp: string;
  success: boolean;
  details: Record<string, any>;
  stepType?: string;
  action?: string;
  response?: string;
  errorMessage?: string;
}

export interface SyndieCampaignInfo {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyndieSeatInfo {
  id: string;
  providerId: string;
  firstName: string;
  lastName: string;
  publicIdentifier: string;
  accountType: string;
  isActive?: boolean;
  linkedinUrl?: string;
}

export interface SyndieWebhookPayload {
  id: string; // This maps to syndie_lead_id in database
  firstName: string;
  lastName: string;
  headline?: string;
  location?: string;
  company: string;
  linkedinUrl: string;
  connectionStatus: LinkedInConnectionStatus;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
  steps: SyndieLeadStep[];
  campaign: {
    id: string;
    name: string;
    description?: string;
    status: string;
    seat: SyndieSeatInfo;
    leadList?: {
      id: string;
      name: string;
      // leadList details typically not stored in our database
    };
  };
}

// Extended Lead interface that includes Syndie fields
export interface SyndieLead {
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
  last_email_event: string | null;
  last_event_timestamp: string | null;
  created_at: string;
  updated_at: string;

  // Syndie-specific fields
  syndie_lead_id: string | null;
  linkedin_connection_status: LinkedInConnectionStatus;
  steps: SyndieLeadStep[];
  campaign_info: SyndieCampaignInfo;
  seat_info: SyndieSeatInfo;
  syndie_campaign_id: string | null
}

// Lead with enhanced Syndie tracking
export interface LeadWithSyndieData extends SyndieLead {
  // Additional computed fields for UI
  lastStepAt?: string;
  nextStepDue?: string;
  connectionProgress?: number;
  totalSteps?: number;
  completedSteps?: number;
  failedSteps?: number;
  isActive?: boolean;
}

// Lead filtering and search interfaces
export interface LeadFilters {
  status?: string[];
  connectionStatus?: LinkedInConnectionStatus[];
  account?: string;
  campaign?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface LeadSearchParams {
  filters?: LeadFilters;
  sortBy?: 'created_at' | 'updated_at' | 'last_step_at' | 'connection_status' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LeadListResponse {
  leads: LeadWithSyndieData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: LeadFilters;
}

// Lead statistics for dashboard display
export interface LeadStats {
  total: number;
  byConnectionStatus: Record<LinkedInConnectionStatus, number>;
  bySource: Record<string, number>;
  recentActivity: number;
  activeAutomations: number;
  newThisWeek: number;
  repliedThisWeek: number;
}

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  leadId?: string;
  operation: 'created' | 'updated' | 'error';
  message: string;
  errors?: string[];
}

// Step timeline for UI visualization
export interface StepTimelineItem {
  id: string;
  stepType: string;
  timestamp: string;
  success: boolean;
  title: string;
  description?: string;
  details?: Record<string, any>;
  errorMessage?: string;
}

export interface LeadActivityTimeline {
  leadId: string;
  steps: StepTimelineItem[];
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  lastActivity?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type LeadApiResponse = ApiResponse<LeadWithSyndieData>;
export type LeadListApiResponse = ApiResponse<LeadListResponse>;
export type LeadStatsApiResponse = ApiResponse<LeadStats>;
export type WebhookApiResponse = ApiResponse<WebhookProcessingResult>;