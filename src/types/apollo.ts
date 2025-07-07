// Apollo Data Types and Interfaces
// Comprehensive TypeScript definitions for Apollo integration

// Search Filter Types
export type SeniorityLevel = 
  | 'founder'
  | 'c_level' 
  | 'vp'
  | 'director'
  | 'manager'
  | 'senior'
  | 'junior'
  | 'intern'
  | 'individual_contributor'

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
  excludeJobTitles: string[]
  seniorities: SeniorityLevel[]
  locations: string[]
  excludeLocations: string[]
  timeInCurrentRole: TimeInRole[]
  totalYearsExperience: ExperienceRange[]
  hasEmail: boolean | null

  // Company-level filters
  industries: string[]
  companyHeadcount: CompanyHeadcount[]
  companyDomains: string[]
  intentTopics: string[]
  technologies: string[]
  keywords: string[]

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
  excludeJobTitles: [],
  seniorities: [],
  locations: [],
  excludeLocations: [],
  timeInCurrentRole: [],
  totalYearsExperience: [],
  hasEmail: null,
  industries: [],
  companyHeadcount: [],
  companyDomains: [],
  intentTopics: [],
  technologies: [],
  keywords: [],
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
  { value: 'founder', label: 'Founder' },
  { value: 'c_level', label: 'C-Level (CEO, CTO, etc.)' },
  { value: 'vp', label: 'Vice President' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'junior', label: 'Junior Level' },
  { value: 'intern', label: 'Intern' },
  { value: 'individual_contributor', label: 'Individual Contributor' }
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

export const COMMON_TECHNOLOGIES = [
  'Salesforce', 'HubSpot', 'Slack', 'Microsoft Office 365', 'Google Workspace',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'React', 'Angular', 'Vue.js', 'Node.js', 'Python',
  'Java', 'PHP', 'Ruby', 'Go', 'Rust',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'Shopify', 'WooCommerce', 'Magento', 'BigCommerce',
  'Tableau', 'Power BI', 'Looker', 'Segment', 'Mixpanel'
]

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
  company?: string
  title?: string
  start_date?: string
  end_date?: string
  current?: boolean
}

export interface LeadSearchResult {
  id: string
  external_id: string
  
  // Personal information
  first_name?: string
  last_name?: string
  full_name: string
  email?: string
  email_status?: EmailStatus
  phone?: string
  headline?: string
  photo_url?: string
  
  // Professional information
  title?: string
  seniority_level?: SeniorityLevel
  department?: Department
  years_experience?: number
  time_in_current_role?: string
  
  // Professional categorization from Apollo
  departments?: string[]
  subdepartments?: string[]
  seniority?: string
  functions?: string[]
  
  // Company information
  company?: string
  company_id?: string
  industry?: string
  company_size?: number
  company_revenue?: number
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
  
  // Location
  city?: string
  state?: string
  country?: string
  location?: string
  
  // Social profiles
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  github_url?: string
  
  // Technologies and skills
  technologies?: string[]
  keywords?: string[]
  
  // Employment history
  employment_history?: EmploymentHistoryEntry[]
  
  // Metadata
  data_source: 'apollo' | 'csv_upload'
  confidence: number
  last_updated: Date
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