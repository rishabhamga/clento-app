import Papa from 'papaparse';
// Apollo Data Types and Interfaces
// Comprehensive TypeScript definitions for Apollo integration

// Search Filter Types
export type SeniorityLevel =
  | 'owner'
  | 'founder'
  | 'c_suite'
  | 'partner'
  | 'vp'
  | 'head'
  | 'director'
  | 'manager'
  | 'senior'
  | 'entry'
  | 'intern'

export type TimeInRole =
  | '0-6_months'
  | '6-12_months'
  | '1-3_years'
  | '3-5_years'
  | '5-10_years'
  | '10+_years'

export type ExperienceRange =
  | '0-1_years'
  | '1-3_years'
  | '3-5_years'
  | '5-10_years'
  | '10-15_years'
  | '15-20_years'
  | '20+_years'

export type CompanyHeadcount =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5001-10000'
  | '10000+'

export type EmailStatus = 'verified' | 'likely' | 'guessed' | 'unavailable'

export type Department =
  | 'sales'
  | 'marketing'
  | 'engineering'
  | 'hr'
  | 'finance'
  | 'operations'
  | 'product'
  | 'legal'
  | 'other'

export type SearchType = 'people' | 'company' | 'csv_upload'

// Company-specific types
export type FundingStage =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d'
  | 'series_e'
  | 'series_f_plus'
  | 'ipo'
  | 'acquired'
  | 'private_equity'

export type RevenueRange =
  | '0-1M'
  | '1M-10M'
  | '10M-50M'
  | '50M-100M'
  | '100M-500M'
  | '500M-1B'
  | '1B+'

// Filter input interface for UI components
export interface ApolloFilterInput {
  // Person-level filters
  jobTitles: string[]
  seniorities: SeniorityLevel[]
  personLocations: string[] // Person's location (where they live)
  excludePersonLocations: string[]
  organizationLocations: string[] // Company headquarters locations
  excludeOrganizationLocations: string[]
  hasEmail: boolean | null

  // Company-level filters
  industries: string[]
  companyHeadcount: CompanyHeadcount[]
  companyDomains: string[]
  intentTopics: string[]
  technologies: string[]
  technologyUids: string[] // Apollo technology UIDs for currently_using_any_of_technology_uids[]
  excludeTechnologyUids: string[] // Apollo technology UIDs for currently_not_using_any_of_technology_uids[]
  keywords: string[]

  // Organization job-related filters
  organizationJobTitles: string[] // For q_organization_job_titles[]
  organizationJobLocations: string[] // For organization_job_locations[]

  // Organization job postings / hiring signals
  organizationNumJobsMin: number | null // organization_num_jobs_range[min]
  organizationNumJobsMax: number | null // organization_num_jobs_range[max]
  organizationJobPostedAtMin: string | null // organization_job_posted_at_range[min] (ISO date string)
  organizationJobPostedAtMax: string | null // organization_job_posted_at_range[max]

  // Revenue range filters
  revenueMin: number | null
  revenueMax: number | null

  // Funding and growth
  fundingStages: FundingStage[]
  fundingAmountMin: number | null
  fundingAmountMax: number | null
  foundedYearMin: number | null
  foundedYearMax: number | null

  // Engagement signals
  jobPostings: boolean | null
  newsEvents: boolean | null
  webTraffic: boolean | null

  // Search options
  page: number
  perPage: number
}

// Company search specific filters
export interface CompanyFilterInput {
  // Basic company filters
  companyNames: string[]
  excludeCompanyNames: string[]
  industries: string[]
  excludeIndustries: string[]
  locations: string[]
  excludeLocations: string[]

  // Size and metrics
  headcountRanges: CompanyHeadcount[]
  revenueRanges: RevenueRange[]

  // Technology and signals
  technologies: string[]
  excludeTechnologies: string[]
  intentTopics: string[]
  keywords: string[]

  // Funding and growth
  fundingStages: FundingStage[]
  fundingAmountMin: number
  fundingAmountMax: number
  foundedYearMin: number
  foundedYearMax: number

  // Engagement signals
  jobPostings: boolean | null
  newsEvents: boolean | null
  webTraffic: boolean | null

  // Search options
  page: number
  perPage: number
}

// Default filter state
export const DEFAULT_APOLLO_FILTERS: ApolloFilterInput = {
  jobTitles: [],
  seniorities: [],
  personLocations: [],
  excludePersonLocations: [],
  organizationLocations: [],
  excludeOrganizationLocations: [],
  hasEmail: null,
  industries: [],
  companyHeadcount: [],
  companyDomains: [],
  intentTopics: [],
  technologies: [],
  technologyUids: [],
  excludeTechnologyUids: [],
  keywords: [],
  organizationJobTitles: [],
  organizationJobLocations: [],
  organizationNumJobsMin: null,
  organizationNumJobsMax: null,
  organizationJobPostedAtMin: null,
  organizationJobPostedAtMax: null,
  revenueMin: null,
  revenueMax: null,
  fundingStages: [],
  fundingAmountMin: null,
  fundingAmountMax: null,
  foundedYearMin: null,
  foundedYearMax: null,
  jobPostings: null,
  newsEvents: null,
  webTraffic: null,
  page: 1,
  perPage: 20
}

export const DEFAULT_COMPANY_FILTERS: CompanyFilterInput = {
  companyNames: [],
  excludeCompanyNames: [],
  industries: [],
  excludeIndustries: [],
  locations: [],
  excludeLocations: [],
  headcountRanges: [],
  revenueRanges: [],
  technologies: [],
  excludeTechnologies: [],
  intentTopics: [],
  keywords: [],
  fundingStages: [],
  fundingAmountMin: 0,
  fundingAmountMax: 0,
  foundedYearMin: 0,
  foundedYearMax: 0,
  jobPostings: null,
  newsEvents: null,
  webTraffic: null,
  page: 1,
  perPage: 20
}

// Filter option definitions for UI components
export const SENIORITY_OPTIONS: Array<{ value: SeniorityLevel; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder' },
  { value: 'c_suite', label: 'C-Suite (CEO, CTO, etc.)' },
  { value: 'partner', label: 'Partner' },
  { value: 'vp', label: 'Vice President' },
  { value: 'head', label: 'Head of Department' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'intern', label: 'Intern' }
]

export const TIME_IN_ROLE_OPTIONS: Array<{ value: TimeInRole; label: string }> = [
  { value: '0-6_months', label: '0-6 months' },
  { value: '6-12_months', label: '6-12 months' },
  { value: '1-3_years', label: '1-3 years' },
  { value: '3-5_years', label: '3-5 years' },
  { value: '5-10_years', label: '5-10 years' },
  { value: '10+_years', label: '10+ years' }
]

export const EXPERIENCE_OPTIONS: Array<{ value: ExperienceRange; label: string }> = [
  { value: '0-1_years', label: '0-1 years' },
  { value: '1-3_years', label: '1-3 years' },
  { value: '3-5_years', label: '3-5 years' },
  { value: '5-10_years', label: '5-10 years' },
  { value: '10-15_years', label: '10-15 years' },
  { value: '15-20_years', label: '15-20 years' },
  { value: '20+_years', label: '20+ years' }
]

export const HEADCOUNT_OPTIONS: Array<{ value: CompanyHeadcount; label: string }> = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001-10000', label: '5,001-10,000 employees' },
  { value: '10000+', label: '10,000+ employees' }
]

export const REVENUE_RANGE_OPTIONS: Array<{ value: RevenueRange; label: string }> = [
  { value: '0-1M', label: '$0 - $1M' },
  { value: '1M-10M', label: '$1M - $10M' },
  { value: '10M-50M', label: '$10M - $50M' },
  { value: '50M-100M', label: '$50M - $100M' },
  { value: '100M-500M', label: '$100M - $500M' },
  { value: '500M-1B', label: '$500M - $1B' },
  { value: '1B+', label: '$1B+' }
]

export const FUNDING_STAGE_OPTIONS: Array<{ value: FundingStage; label: string }> = [
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c', label: 'Series C' },
  { value: 'series_d', label: 'Series D' },
  { value: 'series_e', label: 'Series E' },
  { value: 'series_f_plus', label: 'Series F+' },
  { value: 'ipo', label: 'IPO' },
  { value: 'acquired', label: 'Acquired' },
  { value: 'private_equity', label: 'Private Equity' }
]

export const COMMON_INDUSTRIES = [
  'Technology',
  'Software',
  'SaaS',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'E-commerce',
  'Consulting',
  'Marketing & Advertising',
  'Education',
  'Real Estate',
  'Construction',
  'Automotive',
  'Energy & Utilities',
  'Telecommunications',
  'Media & Entertainment',
  'Non-profit',
  'Government',
  'Insurance',
  'Legal Services',
  'Transportation & Logistics',
  'Food & Beverage',
  'Hospitality & Tourism',
  'Agriculture'
]

export const COMMON_JOB_TITLES = [
  // Sales
  'Sales Director', 'VP Sales', 'Sales Manager', 'Account Executive', 'Business Development Manager',
  'Sales Representative', 'Regional Sales Manager', 'Inside Sales Manager', 'Channel Partner Manager',

  // Marketing
  'Marketing Director', 'VP Marketing', 'Marketing Manager', 'Digital Marketing Manager',
  'Content Marketing Manager', 'Growth Marketing Manager', 'Product Marketing Manager',

  // Engineering
  'Engineering Director', 'VP Engineering', 'Engineering Manager', 'Software Engineer',
  'Senior Software Engineer', 'Lead Engineer', 'Principal Engineer', 'CTO',

  // Operations
  'Operations Director', 'VP Operations', 'Operations Manager', 'COO', 'General Manager',

  // Finance
  'Finance Director', 'VP Finance', 'CFO', 'Controller', 'Finance Manager',

  // HR
  'HR Director', 'VP People', 'HR Manager', 'People Operations Manager', 'CHRO',

  // Product
  'Product Director', 'VP Product', 'Product Manager', 'Senior Product Manager',
  'Chief Product Officer'
]

export const COMMON_INTENT_TOPICS = [
  'software buying intent',
  'technology evaluation',
  'digital transformation',
  'cloud migration',
  'cybersecurity solutions',
  'data analytics',
  'sales automation',
  'marketing automation',
  'customer success',
  'hr technology',
  'financial technology',
  'collaboration tools',
  'project management',
  'business intelligence',
  'artificial intelligence',
  'machine learning',
  'crm software',
  'erp systems',
  'compliance software',
  'backup solutions'
]

export async function getTechnologies(): Promise<string[]> {
  const response = await fetch('/supported_technologies.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        const technologies = results.data
          .map((row: any) => row.Technology)
          .filter((tech: string | undefined) => typeof tech === 'string');
        resolve(technologies);
      },
      error: reject,
    });
  });
}

// // Fallback list of common technologies (used if CSV loading fails)
// export const COMMON_TECHNOLOGIES = [
//   'Salesforce', 'HubSpot', 'Slack', 'Microsoft Office 365', 'Google Workspace',
//   'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
//   'React', 'Angular', 'Vue.js', 'Node.js', 'Python',
//   'Java', 'PHP', 'Ruby', 'Go', 'Rust',
//   'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
//   'Shopify', 'WooCommerce', 'Magento', 'BigCommerce',
//   'Tableau', 'Power BI', 'Looker', 'Segment', 'Mixpanel'
// ]

// Search result interfaces
export interface SearchPagination {
  page: number
  per_page: number
  total_entries: number
  total_pages: number
  has_more: boolean
}

export interface SearchBreadcrumb {
  label: string
  signal_field_name: string
  value: string | boolean
  display_name: string
}

export interface EmploymentHistoryEntry {
  _id?: string
  company?: string
  title?: string
  start_date?: string
  end_date?: string
  current?: boolean
  organization_id?: string
  organization_name?: string
  created_at?: string | null
  updated_at?: string | null
  description?: string | null
  degree?: string | null
  emails?: string[] | null
  grade_level?: string | null
  kind?: string | null
  major?: string | null
  raw_address?: string | null
  id?: string
  key?: string
}

export interface ApolloPhone {
  number: string
  source: string
  sanitized_number: string
}

export interface ApolloOrganization {
  id: string
  name: string
  website_url?: string
  blog_url?: string
  angellist_url?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  primary_phone?: ApolloPhone
  languages?: string[]
  alexa_ranking?: number | null
  phone?: string
  linkedin_uid?: string
  founded_year?: number
  publicly_traded_symbol?: string | null
  publicly_traded_exchange?: string | null
  logo_url?: string
  crunchbase_url?: string | null
  primary_domain?: string
  sanitized_phone?: string
  city?: string
  state?: string
  country?: string
  organization_headcount_six_month_growth?: number
  organization_headcount_twelve_month_growth?: number
  organization_headcount_twenty_four_month_growth?: number
}

export interface ApolloAccount {
  id: string
  name: string
  website_url?: string
  blog_url?: string
  angellist_url?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  primary_phone?: ApolloPhone
  languages?: string[]
  alexa_ranking?: number | null
  phone?: string | null
  linkedin_uid?: string
  founded_year?: number
  publicly_traded_symbol?: string | null
  publicly_traded_exchange?: string | null
  logo_url?: string
  crunchbase_url?: string | null
  primary_domain?: string
  sanitized_phone?: string
  raw_address?: string
  street_address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  domain?: string
  team_id?: string
  organization_id?: string
  account_stage_id?: string
  source?: string
  original_source?: string
  creator_id?: string
  owner_id?: string
  created_at?: string
  phone_status?: string
  hubspot_id?: string | null
  salesforce_id?: string | null
  crm_owner_id?: string | null
  parent_account_id?: string | null
  account_playbook_statuses?: any[]
  existence_level?: string
  label_ids?: string[]
  typed_custom_fields?: any
  custom_field_errors?: any
  modality?: string
  source_display_name?: string
  crm_record_url?: string | null
  organization_headcount_six_month_growth?: number
  organization_headcount_twelve_month_growth?: number
  organization_headcount_twenty_four_month_growth?: number
}

export interface LeadSearchResult {
  // Apollo fields
  id: string
  external_id?: string
  name: string
  state?: string
  first_name?: string
  last_name?: string
  full_name?: string
  title?: string
  headline?: string
  company?: string
  company_id?: string
  company_domain?: string
  company_website?: string
  company_linkedin?: string
  email?: string
  phone?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  github_url?: string

  // Enhanced location fields
  location?: string
  city?: string
  region?: string
  country?: string

  // Enhanced job information
  seniority?: string
  seniority_level?: string
  department?: string
  departments?: string[]
  subdepartments?: string[]
  functions?: string[]
  experience_years?: number
  time_in_role?: number
  time_in_role_months?: number

  // Enhanced company information
  company_size?: string | number
  company_industry?: string
  company_revenue?: number

  // Additional profile information from Explorium
  skills?: string[]
  experience?: string[]
  interests?: string[]
  business_id?: string

  // Image URLs
  photo_url?: string
  company_logo_url?: string

  // Confidence/matching score
  confidence?: number

  // Data source and metadata
  data_source?: 'apollo' | 'explorium' | 'csv_upload'
  _raw?: any

  // Apollo-specific fields (keeping for compatibility)
  years_experience?: number
  industry?: string // Keeping as alias for company_industry

  // Apollo API response fields
  email_status?: EmailStatus
  employment_history?: EmploymentHistoryEntry[]
  organization?: ApolloOrganization
  organization_id?: string
  account?: ApolloAccount
  account_id?: string
  extrapolated_email_confidence?: number | null
  email_domain_catchall?: boolean
  revealed_for_current_team?: boolean
  intent_strength?: number | null
  show_intent?: boolean
}

export interface CompanySearchResult {
  id: string
  external_id: string

  // Basic company information
  name: string
  domain?: string
  website_url?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string

  // Business details
  industry?: string
  description?: string
  keywords?: string[]

  // Size and metrics
  employee_count?: number
  estimated_annual_revenue?: number
  revenue_range?: RevenueRange

  // Location
  headquarters_city?: string
  headquarters_state?: string
  headquarters_country?: string
  locations?: Array<{
    city?: string
    state?: string
    country?: string
    address?: string
  }>

  // Funding and growth
  founded_year?: number
  funding_stage?: FundingStage
  funding_total?: number
  last_funding_date?: string
  investor_count?: number

  // Technology and signals
  technologies?: string[]
  intent_topics?: string[]
  job_postings_count?: number
  recent_news_count?: number

  // Contact information
  phone?: string
  email_domain?: string

  // Social presence
  alexa_ranking?: number
  monthly_visits?: number

  // Key personnel
  key_people?: Array<{
    name?: string
    title?: string
    linkedin_url?: string
  }>

  // Metadata
  data_source: 'apollo'
  confidence: number
  last_updated: Date
}

export interface ApolloSearchResponse {
  people?: LeadSearchResult[]
  companies?: CompanySearchResult[]
  pagination: SearchPagination
  breadcrumbs: SearchBreadcrumb[]
  search_id: string
}

// Error handling
export interface ApolloError {
  code: string
  message: string
  details?: any
}

export class ApolloAPIError extends Error {
  public code: string
  public details?: any

  constructor(error: ApolloError) {
    super(error.message)
    this.name = 'ApolloAPIError'
    this.code = error.code
    this.details = error.details
  }
}

// Rate limiting information
export interface RateLimitInfo {
  remainingRequests: number
  resetTime: Date
  dailyLimit: number
  dailyUsed: number
}

// Search context for React components
export interface SearchState {
  searchType: SearchType
  peopleFilters: ApolloFilterInput
  companyFilters: CompanyFilterInput
  peopleResults: LeadSearchResult[]
  companyResults: CompanySearchResult[]
  pagination: SearchPagination | null
  breadcrumbs: SearchBreadcrumb[]
  loading: boolean
  error: string | null
  rateLimitInfo: RateLimitInfo | null
  searchId: string | null
}

export const DEFAULT_SEARCH_STATE: SearchState = {
  searchType: 'people',
  peopleFilters: DEFAULT_APOLLO_FILTERS,
  companyFilters: DEFAULT_COMPANY_FILTERS,
  peopleResults: [],
  companyResults: [],
  pagination: null,
  breadcrumbs: [],
  loading: false,
  error: null,
  rateLimitInfo: null,
  searchId: null
}