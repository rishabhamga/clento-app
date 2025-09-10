// Email personalization types for the new email-focused system
export type EmailLeadRow = Record<string, string> & {
  "First name": string;
  "Last name": string;
  Title: string;
  Company: string;
  Location: string;
  "Linkedin url": string;
  "Company website": string;
  "Email"?: string; // Optional email field
};

// Campaign context from the console for email personalization
export interface CampaignContext {
  // Campaign identification
  campaignId: string;
  campaignName: string;
  
  // Pain points from campaign
  painPoints: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  
  // Proof points from campaign
  proofPoints: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  
  // Coaching points for email guidance
  coachingPoints: Array<{
    id: string;
    editable: boolean;
    instruction: string;
  }>;
  
  // Email-specific coaching points
  emailCoachingPoints: Array<{
    id: string;
    editable: boolean;
    instruction: string;
  }>;
  
  // Outreach settings
  outreach: {
    signOffs: string[];
    toneOfVoice: string;
    callsToAction: string[];
    maxResourceAge: number;
    campaignLanguage: string;
    messagePersonalization: boolean;
    personalizationSources: string[];
  };
  
  // Website analysis data
  websiteAnalysis?: {
    coreOffer: string;
    industry: string;
    techStack: string[];
    icpSummary: string;
    businessModel: string;
    competitiveAdvantages: string[];
    leadMagnets: Array<{
      url: string;
      type: string;
      title: string;
      description: string;
      callToAction: string;
      targetAudience: string;
    }>;
    socialProof: {
      metrics: Array<{
        value: string;
        metric: string;
      }>;
      clientLogos: string[];
      testimonials: Array<{
        quote: string;
        author: string;
        company: string;
        position: string;
      }>;
    };
    caseStudies: Array<{
      title: string;
      metrics: string;
      results: string[];
      industry: string;
      solution: string;
      challenge: string;
      clientInfo: string;
    }>;
    targetPersonas: Array<{
      title: string;
      industry: string;
      challenges: string[];
      painPoints: string[];
      companySize: string;
      demographics: {
        department: string;
        seniorityLevel: string;
        decisionMakingAuthority: string;
      };
      desiredOutcomes: string[];
    }>;
  };
}

// Enhanced field context that includes campaign data
export interface EmailFieldContext extends CampaignContext {
  // Legacy context fields for backward compatibility
  coreOffering: string;
  competitiveAdvantages: string;
  techStack: string;
  caseStudies: string;
  leadMagnets: string;
  socialProof: string;
  valueProp: string;
  painPointsText: string; // Renamed to avoid conflict with campaign painPoints array
  successStories: string;
  campaignLanguage: string;
  signOffs: string;
  tone: string;
  ctas: string;
}

// Email sequence output format
export interface EmailSequenceOutput {
  initial_email: string;
  follow_up_email_1: string;
  follow_up_email_2: string;
  follow_up_email_3: string;
  follow_up_email_4: string;
  // Metadata
  subject_lines: {
    initial: string;
    followUp1: string;
    followUp2: string;
    followUp3: string;
    followUp4: string;
  };
  personalization_score: number;
  campaign_reference: string;
}

// Enhanced company enrichment with LinkedIn profile data
export interface EnhancedCompanyEnrichment {
  // Company website data
  description?: string;
  techStackHints?: string[];
  headlines?: { title: string; url: string }[];
  
  // LinkedIn company data
  linkedInData?: {
    followers?: number;
    industry?: string;
    companySize?: string;
    recentPosts?: Array<{
      content: string;
      date: string;
      engagement: number;
    }>;
    employees?: Array<{
      name: string;
      title: string;
      department: string;
    }>;
  };
  
  // Lead LinkedIn profile data
  leadLinkedInData?: {
    profileData?: {
      headline: string;
      summary?: string;
      experience: Array<{
        title: string;
        company: string;
        duration: string;
      }>;
      education: Array<{
        school: string;
        degree: string;
        field?: string;
      }>;
      skills: string[];
      connections?: number;
    };
    recentActivity?: Array<{
      type: 'post' | 'comment' | 'share';
      content: string;
      date: string;
      engagement?: number;
    }>;
    mutualConnections?: Array<{
      name: string;
      title: string;
      company: string;
    }>;
  };
  
  // Error tracking
  scrapingErrors?: {
    companyWebsite?: string;
    linkedInCompany?: string;
    linkedInProfile?: string;
  };
  
  // Scraping timestamps
  scrapedAt: {
    companyWebsite?: Date;
    linkedInCompany?: Date;
    linkedInProfile?: Date;
  };
}

// Job processing status
export interface EmailPersonalizationJob {
  jobId: string;
  campaignId: string;
  rowCount: number;
  processed: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  errors?: Array<{
    row: number;
    leadName: string;
    error: string;
    timestamp: Date;
  }>;
  results?: {
    csv: string;
    successCount: number;
    errorCount: number;
    scrapingStats: {
      companyWebsiteSuccess: number;
      companyWebsiteFailures: number;
      linkedInCompanySuccess: number;
      linkedInCompanyFailures: number;
      linkedInProfileSuccess: number;
      linkedInProfileFailures: number;
    };
  };
}

// API request types
export interface EmailPersonalizationRequest {
  campaignId: string;
  csvFile: File;
  customContext?: Partial<EmailFieldContext>;
}

export interface EmailPersonalizationResponse {
  jobId: string;
  rowCount: number;
  estimatedCompletionTime: number; // in seconds
}

// CSV sample data structure
export interface SampleCSVData {
  headers: string[];
  sampleRows: Array<Record<string, string>>;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
}