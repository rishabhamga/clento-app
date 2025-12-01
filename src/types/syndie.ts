// Syndie Integration TypeScript Types
// Types for Syndie automation webhook payloads and lead management

export type LinkedInConnectionStatus =
    | 'not_connected'
    | 'pending'
    | 'accepted'
    | 'replied'
    | 'bounced'
    | 'not_interested'
    | 'sent'

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
  id: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  connectionStatus: string;
  customStatus: string;
  location: string;
  company: string;
  headline: string;
  phone: string;
  jobtitle: string;
  email: string;
  createdAt: string;
  steps: SyndieWebhookPayloadStep[];
  campaign: SyndieWebhookPayloadCampaign;
}

export interface SyndieWebhookPayloadStep {
  stepNodeId: string;
  timestamp: string;
  success: boolean;

  // optional fields depending on step type
  metadata?: {
    automationResults: {
      total: number;
      successful: number;
      failed: number;
    };
  };

  details?: {
    failedCount: number;
    successCount: number;
    comments: {
      post: string;
      comment: string | null;
      commentedAt: string | null;
      success: boolean;
      reason: string;
    }[];
  };
}

export interface SyndieWebhookPayloadCampaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  fromTime: string;
  toTime: string;
  status: string;

  seat: {
    id: string;
    providerId: string;
    firstName: string;
    lastName: string;
    publicIdentifier: string;
    accountType: string;
  };

  leadList: {
    id: string;
    name: string;
    listType: string;
  };
}

// Extended Lead interface that includes Syndie fields
export interface SyndieLead {
    id: string;
    name: string;
    headline: string;
    location: string;
    profilePicture: string;
    publicIdentifier: string;
    company: string;
    campaign: string;
    campaignStatus: 'active' | 'draft' | 'paused' | 'completed'
    senderName: string;
    senderPicture: string;
    status: | 'not_connected' | 'pending' | 'accepted' | 'replied' | 'bounced' | 'not_interested' | 'sent';
    createdAt: string;
    updatedAt: string;
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
    // Lead list information from JOIN
    lead_list_name?: string | null;
    // Account information from seat_info JSONB
    seat_account_name?: string | null;
}

// Lead filtering and search interfaces
export interface LeadFilters {
    status?: string[];
    connectionStatus?: LinkedInConnectionStatus[];
    account?: string;
    campaign?: string;
    leadListId?: string;
    source?: string;
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
    requestsSent: number,
    accepted: number,
    replied: number,
    profileVisits: number,
    likePosts: number,
    commentPosts: number,
    sendInmail: number,
    followProfile: number,
    followCompany: number,
    sendFollowup: number,
    withdrawRequest: number,
    triggerLead: number,
    sendEmail: number
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
    stepNodeId: string;
    stepType: string;
    timestamp: string;
    success: boolean;
    title: string;
    description?: string;
    details?: any;
    message: string;
    errorMessage?: string;
}

export interface LeadActivityTimeline {
    id: string;
    name: string;
    profile: {
        first_name: string;
        last_name: string;
        fullName: string;
        headline: string;
        location: string;
        profile_picture_url: string;
        public_identifier: string;
        experience: {
            company_id?: string;
            company: string;
            position: string;
            location?: string;
            skills: string[];
            start: string;
            end: string | null;
        }[];
        education: {
            school: string;
            start: string | null;
            end: string | null;
        }[];
        skills: {
            name: string;
            endorsement_count: number;
            insights: any[];
            endorsement_id: string | null;
            endorsed: boolean;
        }[];
        summary: string;
        aiShortSummary: string;
    };
    campaign: {
        id: string;
        name: string;
        status: string;
        senderName: string;
        senderPicture: string;
    };
    connectionStatus: string;
    steps: StepTimelineItem[]
    messages: Record<string, unknown>;
    likedPosts: any[];
    comments: any[];
    createdAt: string;
    updatedAt: string;
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