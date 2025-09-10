// LinkedIn Job Filter Types and Interfaces

// Database model types
export interface CompanyActiveJob {
  id: string;
  user_id: string;
  organization_id: string;
  job_id: string;
  company_name: string;
  company_website?: string;
  linkedin_url: string;
  department: string;
  job_titles?: string[];
  match_count: number;
  job_data: JobMatchingResult;
  linkedin_jobs: LinkedInJobResult[];
  career_page_jobs: CareerPageJobResult[];
  processing_status: ProcessingStatus;
  error_message?: string;
  scraped_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobFilterRequest {
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
  job_titles?: string[];
  processing_status: ProcessingStatus;
  csv_output_url?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Processing status types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'timeout' | 'cancelled';

// Job matching data structures
export interface JobMatchingResult {
  total_matches: number;
  linkedin_matches: number;
  career_page_matches: number;
  exact_matches: number;
  fuzzy_matches: number;
  department_matches: {[department: string]: number};
  confidence_score: number;
  processing_time_ms: number;
  scraped_urls: string[];
  error_urls: string[];
}

export interface LinkedInJobResult {
  title: string;
  department?: string;
  location?: string;
  job_url: string;
  match_type: MatchType;
  confidence_score: number;
  scraped_at: string;
  source_page?: string;
}

export interface CareerPageJobResult {
  title: string;
  department?: string;
  location?: string;
  job_url: string;
  match_type: MatchType;
  confidence_score: number;
  scraped_at: string;
  source_page: string;
}

export type MatchType = 'exact' | 'fuzzy' | 'department' | 'title_keyword';

// CSV upload and processing types
export interface CSVJobFilterData {
  // Required fields
  'LinkedIn URL': string;
  'Company Website': string;
  
  // Optional fields that might be in CSV
  'Company Name'?: string;
  'Company'?: string;
  'Website'?: string;
  'linkedin_url'?: string;
  'company_website'?: string;
  
  // Internal processing
  source: 'csv_upload';
  upload_date: string;
  validation_status: 'valid' | 'invalid' | 'pending';
  validation_message?: string;
}

export interface JobFilterCSVUploadState {
  file: File | null;
  uploadProgress: number;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationMessage: string;
  parsedData: CSVJobFilterData[];
  selectedDepartments: string[];
  customJobTitles: string[];
  error: string | null;
}

export interface JobFilterCSVValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  data: CSVJobFilterData[];
  totalRows: number;
  validRows: number;
}

// API request/response types
export interface JobFilterAPIRequest {
  file: File;
  departments: string[];
  jobTitles?: string[];
  options?: {
    includeCareerPages?: boolean;
    fuzzyMatching?: boolean;
    confidenceThreshold?: number;
  };
}

export interface JobFilterAPIResponse {
  jobId: string;
  totalCompanies: number;
  estimatedCompletionTime: number;
  message: string;
}

export interface JobFilterStatusResponse {
  jobId: string;
  status: ProcessingStatus;
  progress: {
    totalCompanies: number;
    processedCompanies: number;
    successfulCompanies: number;
    failedCompanies: number;
    percentageComplete: number;
  };
  currentCompany?: string;
  estimatedTimeRemaining?: number;
  errorMessage?: string;
  completedAt?: string;
}

export interface JobFilterResultsResponse {
  jobId: string;
  status: ProcessingStatus;
  results: CompanyJobResult[];
  summary: {
    totalCompanies: number;
    companiesWithJobs: number;
    totalJobsFound: number;
    averageMatchesPerCompany: number;
    processingTime: number;
  };
  downloadUrl?: string;
  errorMessage?: string;
}

export interface CompanyJobResult {
  companyName: string;
  companyWebsite?: string;
  linkedinUrl: string;
  department: string;
  matchCount: number;
  jobData: JobMatchingResult;
  processingStatus: ProcessingStatus;
  errorMessage?: string;
}

// Job matching criteria and configuration
export interface JobMatchingCriteria {
  departments: string[];
  jobTitles?: string[];
  exactMatch: boolean;
  fuzzyMatch: boolean;
  confidenceThreshold: number;
  includeCareerPages: boolean;
}

export interface DepartmentConfig {
  name: string;
  keywords: string[];
  commonTitles: string[];
  aliases: string[];
}

export interface JobTitleMapping {
  standardTitle: string;
  aliases: string[];
  department: string;
  seniority: 'entry' | 'mid' | 'senior' | 'executive';
}

// Scraping service types
export interface ScrapingConfig {
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
  userAgents: string[];
  rateLimitDelay: number;
  maxConcurrentRequests: number;
}

export interface ScrapingResult {
  success: boolean;
  url: string;
  jobsFound: (LinkedInJobResult | CareerPageJobResult)[];
  totalJobs: number;
  processingTime: number;
  errorMessage?: string;
  statusCode?: number;
  metadata?: {
    scrapingMethod?: string;
    extractedJobsCount?: number;
    matchedJobsCount?: number;
    firecrawlMetadata?: any;
    fallbackUsed?: boolean;
    firecrawlAvailable?: boolean;
    error?: string;
    companyName?: string;
    pageType?: string;
    hasScreenshots?: boolean;
    extractionTimestamp?: string;
  };
}

// Predefined departments and job titles
export const PREDEFINED_DEPARTMENTS = [
  'Sales',
  'Engineering',
  'Product',
  'Marketing',
  'Logistics',
  'Operations',
  'Machine Learning',
  'IT Support',
  'Customer Support',
  'Human Resources',
  'Finance',
  'Legal',
  'Business Development',
  'Data Science',
  'Design',
  'Quality Assurance'
] as const;

export type PredefinedDepartment = typeof PREDEFINED_DEPARTMENTS[number];

export const PREDEFINED_JOB_TITLES = [
  // Revenue and Sales Leadership
  'Chief Revenue Officer',
  'CRO',
  'Chief Growth Officer',
  'CGO',
  'Chief Sales Officer',
  'CSO',
  'Chief Commercial Officer',
  'CCO',
  'VP Revenue',
  'VP of Revenue',
  'VP Sales',
  'Vice President Sales',
  'VP of Commercial',
  'Head of Sales',
  'Head of Revenue',
  'Head of Commercial',
  'Head of Growth',
  'Director of Sales',
  'Director Sales',
  'Sales Director',
  'VP Go To Market',
  'Head of GTM',
  'GTM Lead',
  'GTM Manager',
  'Go-to-Market Strategist',
  'Revenue Operations',
  'RevOps',
  'Director RevOps',
  'Sales Operations',
  'Sales Ops'
] as const;

export type PredefinedJobTitle = typeof PREDEFINED_JOB_TITLES[number];

// Error types
export interface JobFilterError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError extends JobFilterError {
  field: string;
  row?: number;
}

export interface ScrapingError extends JobFilterError {
  url: string;
  statusCode?: number;
  retryCount: number;
}