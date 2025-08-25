// Apollo Data Provider Service
// Implements Apollo.io API integration with unified interface

import { DataProvider, UnifiedSearchFilters, UnifiedSearchResponse, ProviderConfig } from './provider-manager'

// Apollo API specific types
export interface ApolloSearchParams {
  person_titles?: string[]
  person_locations?: string[]
  person_seniorities?: string[]
  include_similar_titles?: boolean
  organization_locations?: string[]
  organization_ids?: string[]
  organization_num_employees_ranges?: string[]
  organization_job_titles?: string[]
  organization_job_locations?: string[]
  revenue_range?: {
    min?: number
    max?: number
  }
  currently_using_any_of_technology_uids?: string[]
  currently_not_using_any_of_technology_uids?: string[]
  organization_num_jobs_range?: {
    min?: number
    max?: number
  }
  organization_job_posted_at_range?: {
    min?: Date
    max?: Date
  }
  has_job_postings?: boolean
  organization_recent_news_events?: boolean
  organization_has_web_traffic?: boolean
  q_organization_domains_list?: string[]
  q_organization_job_titles?: string[]
  contact_email_status?: string[]
  q_keywords?: string
  page?: number
  per_page?: number
}

export interface ApolloResponse {
  breadcrumbs: any
  people: ApolloPerson[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

export interface ApolloOrganization {
  id: string
  name: string
  website_url?: string
  linkedin_url?: string
  primary_domain?: string
  industry?: string
  estimated_num_employees?: number
  estimated_annual_revenue?: number
  founded_year?: number
  logo_url?: string
  alexa_ranking?: number
  primary_phone?: {
    number: string
    sanitized_number: string
  }
}

export interface ApolloEmploymentHistory {
  id: string
  created_at: string
  current: boolean
  degree?: string
  description?: string
  end_date?: string
  organization_id: string
  organization_name: string
  start_date?: string
  title?: string
  key?: string
}

export interface ApolloTechnology {
  uid: string
  name: string
  category?: string
}

export interface ApolloEmailStatus {
  email: string
  email_status: 'verified' | 'likely' | 'guessed' | 'unavailable'
  extrapolated_email_confidence: number
}

export interface ApolloLocation {
  country?: string
  state?: string
  city?: string
  raw_address?: string
}

export interface ApolloSocial {
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  github_url?: string
}

export interface ApolloPersonalInfo {
  name: string
  first_name?: string
  last_name?: string
  title?: string
  headline?: string
  photo_url?: string
  email?: string
  phone?: string
  email_status?: 'verified' | 'likely' | 'guessed' | 'unavailable'
  extrapolated_email_confidence?: number
  departments?: string[]
  subdepartments?: string[]
  seniority?: string
  functions?: string[]
}

export interface ApolloCompanyInfo {
  organization: ApolloOrganization
  employment_history?: ApolloEmploymentHistory[]
  technologies?: ApolloTechnology[]
}

export interface ApolloContactInfo {
  email_status?: ApolloEmailStatus
  location?: ApolloLocation
  social?: ApolloSocial
}

export interface ApolloPersonalData {
  personal_info: ApolloPersonalInfo
  company_info: ApolloCompanyInfo
  contact_info: ApolloContactInfo
}

export interface ApolloPerson {
  id: string
  name: string
  first_name?: string
  last_name?: string
  title?: string
  email?: string
  email_status?: 'verified' | 'likely' | 'guessed' | 'unavailable'
  phone?: string
  linkedin_url?: string
  twitter_url?: string
  github_url?: string
  facebook_url?: string
  headline?: string
  photo_url?: string
  extrapolated_email_confidence?: number
  city?: string
  state?: string
  country?: string
  departments?: string[]
  subdepartments?: string[]
  seniority?: string
  functions?: string[]
  organization?: ApolloOrganization
  employment_history?: ApolloEmploymentHistory[]
  technologies?: ApolloTechnology[]
}

export class ApolloProviderService implements DataProvider {
  private config: ProviderConfig
  private baseUrl: string
  private apiKey: string

  constructor(config: ProviderConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.apollo.io/v1'
    this.apiKey = config.apiKey

    if (!this.apiKey) {
      throw new Error('Apollo API key is required')
    }
  }

  async searchProspects(filters: UnifiedSearchFilters): Promise<UnifiedSearchResponse> {
    try {
      const apolloParams = this.transformFilters(filters)
      console.log('🔍 Apollo search with params:', apolloParams)

      const response = await this.makeRequest<ApolloResponse>('/mixed_people/search', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(apolloParams)
      })
      console.log("BREADCRUMBS" ,response.breadcrumbs)

    //   console.log(response, "ACTUAL SEARCH RESULT")

      console.log('✅ Apollo response received:', {
        total: response.pagination.total_entries,
        page: response.pagination.page,
        per_page: response.pagination.per_page,
        results: response.people.length,
        totalPages: response.pagination.total_pages
      })

      return this.normalizeResponse(response, filters)
    } catch (error) {
      console.error('❌ Apollo search error:', error)
      throw error
    }
  }

  async validateFilters(filters: UnifiedSearchFilters): Promise<any> {
    // Basic validation for Apollo filters
    const errors: string[] = []
    const warnings: string[] = []

    // Validate required fields
    if (!filters.searchType) {
      warnings.push('Search type not specified, defaulting to people')
    }

    // Validate array filters
    if (filters.jobTitles && filters.jobTitles.length > 100) {
      errors.push('Too many job titles specified (max 100)')
    }

    if (filters.locations && filters.locations.length > 50) {
      errors.push('Too many locations specified (max 50)')
    }

    if (filters.pageSize && filters.pageSize > 100) {
      errors.push('Page size too large (max 100)')
    }

    // Validate organization job filters
    if (filters.organizationJobTitles && filters.organizationJobTitles.length > 50) {
      errors.push('Too many organization job titles specified (max 50)')
    }

    if (filters.organizationJobLocations && filters.organizationJobLocations.length > 30) {
      errors.push('Too many organization job locations specified (max 30)')
    }

    // Validate job posting count range
    if (filters.organizationNumJobsMin !== undefined && filters.organizationNumJobsMin !== null) {
      if (filters.organizationNumJobsMin < 0) {
        errors.push('Minimum job postings count cannot be negative')
      }
      if (filters.organizationNumJobsMin > 10000) {
        warnings.push('Very high minimum job postings count may limit results significantly')
      }
    }

    if (filters.organizationNumJobsMax !== undefined && filters.organizationNumJobsMax !== null) {
      if (filters.organizationNumJobsMax < 0) {
        errors.push('Maximum job postings count cannot be negative')
      }
      if (filters.organizationNumJobsMin && filters.organizationNumJobsMax &&
          filters.organizationNumJobsMin > filters.organizationNumJobsMax) {
        errors.push('Minimum job postings count cannot exceed maximum')
      }
    }

    // Validate job posting date range
    if (filters.organizationJobPostedAtMin && !this.isValidDate(filters.organizationJobPostedAtMin)) {
      errors.push('Invalid minimum job posting date format (expected YYYY-MM-DD)')
    }

    if (filters.organizationJobPostedAtMax && !this.isValidDate(filters.organizationJobPostedAtMax)) {
      errors.push('Invalid maximum job posting date format (expected YYYY-MM-DD)')
    }

    if (filters.organizationJobPostedAtMin && filters.organizationJobPostedAtMax) {
      const minDate = new Date(filters.organizationJobPostedAtMin)
      const maxDate = new Date(filters.organizationJobPostedAtMax)
      if (minDate > maxDate) {
        errors.push('Minimum job posting date cannot be later than maximum date')
      }
    }

    // Validate date ranges aren't too far in the past (Apollo limitation)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    if (filters.organizationJobPostedAtMin) {
      const minDate = new Date(filters.organizationJobPostedAtMin)
      if (minDate < oneYearAgo) {
        warnings.push('Job posting dates older than 1 year may have limited data')
      }
    }

    console.log('🔍 Apollo filter validation completed:', {
      organizationJobFiltersFound: !!(
        filters.organizationJobTitles?.length ||
        filters.organizationJobLocations?.length ||
        filters.organizationNumJobsMin !== undefined ||
        filters.organizationNumJobsMax !== undefined ||
        filters.organizationJobPostedAtMin ||
        filters.organizationJobPostedAtMax ||
        filters.jobPostings !== undefined
      ),
      errors: errors.length,
      warnings: warnings.length
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedFilters: filters
    }
  }

  getProviderInfo(): ProviderConfig {
    return this.config
  }

  transformFilters(filters: UnifiedSearchFilters): ApolloSearchParams {
    const params: ApolloSearchParams = {
      page: filters.page || 1,
      per_page: Math.min(filters.pageSize || 25, 100),
      include_similar_titles: true // Apollo feature to include similar job titles
    }

    if(filters.orgIds?.length){
        params.organization_ids = filters.orgIds
    }
    // Person-level filters
    if (filters.jobTitles?.length) {
      params.person_titles = filters.jobTitles
    }

    // Person locations – prefer explicit personLocations (if present in extended filter type) but fall back to generic locations
    const personLocs = (filters as any).personLocations as string[] | undefined
    if (personLocs && personLocs.length) {
      params.person_locations = this.transformLocations(personLocs)
    } else if (filters.locations?.length) {
      params.person_locations = this.transformLocations(filters.locations)
    }

    // Company (organization) headquarters locations
    if (filters.organizationLocations?.length) {
      params.organization_locations = this.transformLocations(filters.organizationLocations)
    }

    if (filters.seniorities?.length) {
      params.person_seniorities = this.transformSeniorities(filters.seniorities)
    }

    if(filters.companyDomains) {
        params.q_organization_domains_list = filters.companyDomains
    }

    if(filters.organizationJobTitles) {
        params.q_organization_job_titles = filters.organizationJobTitles
    }

    if(filters.keywords) {
        params.q_keywords = filters.keywords.join(', ')
    }

    // Company-level filters
    if (filters.companyHeadcount?.length) {
      params.organization_num_employees_ranges = this.transformCompanyHeadcount(filters.companyHeadcount)
    }

    // Revenue range – include only when valid numeric values are present
    const hasValidRevenueMin = typeof filters.revenueMin === 'number' && !isNaN(filters.revenueMin)
    const hasValidRevenueMax = typeof filters.revenueMax === 'number' && !isNaN(filters.revenueMax)
    if (hasValidRevenueMin || hasValidRevenueMax) {
      params.revenue_range = {}
      if (hasValidRevenueMin) {
        params.revenue_range.min = filters.revenueMin as number
      }
      if (hasValidRevenueMax) {
        params.revenue_range.max = filters.revenueMax as number
      }
    }

    // Technologies – include and exclude
    if (filters.technologyUids?.length) {
      params.currently_using_any_of_technology_uids = filters.technologyUids
    } else if (filters.technologies?.length) {
      params.currently_using_any_of_technology_uids = this.transformTechnologies(filters.technologies)
    }

    if (filters.excludeTechnologyUids?.length) {
      params.currently_not_using_any_of_technology_uids = filters.excludeTechnologyUids
    }

    // Organization job filters (FIXED PARAMETER NAMES)
    if (filters.organizationJobTitles?.length) {
      // Use the correct Apollo API parameter name for organization job titles
      params.organization_job_titles = filters.organizationJobTitles
      console.log('🎯 Set organization job titles:', filters.organizationJobTitles)
    }

    if (filters.organizationJobLocations?.length) {
      params.organization_job_locations = this.transformLocations(filters.organizationJobLocations)
      console.log('🌍 Set organization job locations:', filters.organizationJobLocations)
    }

    // Organization job postings count range
    const hasValidJobsMin = typeof filters.organizationNumJobsMin === 'number' && !isNaN(filters.organizationNumJobsMin) && filters.organizationNumJobsMin >= 0
    const hasValidJobsMax = typeof filters.organizationNumJobsMax === 'number' && !isNaN(filters.organizationNumJobsMax) && filters.organizationNumJobsMax >= 0
    if (hasValidJobsMin || hasValidJobsMax) {
      params.organization_num_jobs_range = {}
      if (hasValidJobsMin) {
        params.organization_num_jobs_range.min = filters.organizationNumJobsMin as number
        console.log('📊 Set min job postings:', filters.organizationNumJobsMin)
      }
      if (hasValidJobsMax) {
        params.organization_num_jobs_range.max = filters.organizationNumJobsMax as number
        console.log('📊 Set max job postings:', filters.organizationNumJobsMax)
      }
    }

    // Organization job posting date filters (with validation)
    if ((filters.organizationJobPostedAtMin && this.isValidDate(filters.organizationJobPostedAtMin)) ||
        (filters.organizationJobPostedAtMax && this.isValidDate(filters.organizationJobPostedAtMax))) {
      params.organization_job_posted_at_range = params.organization_job_posted_at_range || {};
      if (filters.organizationJobPostedAtMin && this.isValidDate(filters.organizationJobPostedAtMin)) {
        params.organization_job_posted_at_range.min = new Date(filters.organizationJobPostedAtMin);
        console.log('📅 Set job posted min date:', filters.organizationJobPostedAtMin);
      }
      if (filters.organizationJobPostedAtMax && this.isValidDate(filters.organizationJobPostedAtMax)) {
        params.organization_job_posted_at_range.max = new Date(filters.organizationJobPostedAtMax);
        console.log('📅 Set job posted max date:', filters.organizationJobPostedAtMax);
      }
    }

    // Organization activity filters
    if (typeof filters.jobPostings === 'boolean') {
      params.has_job_postings = filters.jobPostings
      console.log('💼 Set job postings filter:', filters.jobPostings)
    }

    if (typeof filters.newsEvents === 'boolean') {
      params.organization_recent_news_events = filters.newsEvents
    }

    if (typeof filters.webTraffic === 'boolean') {
      params.organization_has_web_traffic = filters.webTraffic
    }

    console.log('🔄 Transformed filters for Apollo:', params)

    // Validate organization job filters are being set correctly
    const orgJobFiltersSet = Object.keys(params).filter(key => key.includes('organization_job') || key.includes('has_job_postings')).length > 0
    if (orgJobFiltersSet) {
      console.log('✅ Organization job filters detected and applied:', {
        organizationJobTitles: params.organization_job_titles,
        organizationJobLocations: params.organization_job_locations,
        organizationNumJobsRange: params.organization_num_jobs_range,
        hasJobPostings: params.has_job_postings
      })
    }

    return params
  }

  private transformLocations(locations: string[]): string[] {
    // Apollo expects location strings, can be country names or cities
    const locationMap: { [key: string]: string } = {
      'United States': 'United States',
      'US': 'United States',
      'USA': 'United States',
      'United Kingdom': 'United Kingdom',
      'UK': 'United Kingdom',
      'GB': 'United Kingdom',
      'Canada': 'Canada',
      'CA': 'Canada',
      'Australia': 'Australia',
      'AU': 'Australia',
      'Germany': 'Germany',
      'DE': 'Germany',
      'France': 'France',
      'FR': 'France',
      'India': 'India',
      'IN': 'India',
      'Japan': 'Japan',
      'JP': 'Japan',
      'China': 'China',
      'CN': 'China',
      'Brazil': 'Brazil',
      'BR': 'Brazil'
    }

    return locations.map(location => locationMap[location] || location)
  }

  private transformSeniorities(seniorities: string[]): string[] {
    // Map common seniority terms to Apollo values
    const seniorityMap: { [key: string]: string } = {
      'C-Level': 'founder',
      'CTO': 'founder',
      'CEO': 'founder',
      'CFO': 'founder',
      'COO': 'founder',
      'VP': 'vp',
      'Vice President': 'vp',
      'Director': 'director',
      'Head of': 'director',
      'Manager': 'manager',
      'Senior': 'senior',
      'Entry': 'entry',
      'owner': 'owner',
      'founder': 'founder',
      'c_suite': 'founder',
      'vp': 'vp',
      'director': 'director',
      'manager': 'manager',
      'senior': 'senior',
      'entry': 'entry'
    }

    return seniorities.map(seniority => seniorityMap[seniority] || seniority.toLowerCase())
  }

  private transformCompanyHeadcount(headcount: string[]): string[] {
    // Apollo expects specific ranges
    const headcountMap: { [key: string]: string } = {
      '1-10': '1,10',
      '11-50': '11,50',
      '51-200': '51,200',
      '201-500': '201,500',
      '501-1000': '501,1000',
      '1001-5000': '1001,5000',
      '5001-10000': '5001,10000',
      '10001+': '10001,'
    }

    return headcount.map(range => headcountMap[range] || range)
  }

  private transformCompanyRevenue(revenue: string[]): { min?: number; max?: number } {
    // Apollo expects revenue range with min/max
    const revenueMap: { [key: string]: { min?: number; max?: number } } = {
      '0-1M': { min: 0, max: 1000000 },
      '1M-10M': { min: 1000000, max: 10000000 },
      '10M-50M': { min: 10000000, max: 50000000 },
      '50M-100M': { min: 50000000, max: 100000000 },
      '100M-500M': { min: 100000000, max: 500000000 },
      '500M-1B': { min: 500000000, max: 1000000000 },
      '1B+': { min: 1000000000 }
    }

    // For simplicity, use the first revenue range
    if (revenue.length > 0) {
      return revenueMap[revenue[0]] || {}
    }

    return {}
  }

  private transformTechnologies(technologies: string[]): string[] {
    // Apollo expects technology UIDs, but we'll use names for now
    // In a real implementation, you'd maintain a mapping of names to UIDs
    const techMap: { [key: string]: string } = {
      'Google Analytics': 'google_analytics',
      'Salesforce': 'salesforce',
      'HubSpot': 'hubspot',
      'Slack': 'slack',
      'Zoom': 'zoom',
      'AWS': 'amazon_web_services',
      'Microsoft Office': 'microsoft_office',
      'Shopify': 'shopify',
      'WordPress': 'wordpress',
      'Mailchimp': 'mailchimp'
    }

    return technologies.map(tech => techMap[tech] || tech.toLowerCase().replace(/\s+/g, '_'))
  }

  private normalizeResponse(response: ApolloResponse, filters: UnifiedSearchFilters): UnifiedSearchResponse {
    const prospects = response.people.map(person => ({
      // Basic Apollo fields
      id: person.id,
      external_id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      full_name: person.name,
      title: person.title,
      headline: person.headline,
      email: person.email,
      phone: person.phone,
      linkedin_url: person.linkedin_url,
      twitter_url: person.twitter_url,
      facebook_url: person.facebook_url,
      github_url: person.github_url,

      // Location fields
      city: person.city,
      state: person.state,
      country: person.country,

      // Job information
      seniority: person.seniority,
      departments: person.departments || [],
      subdepartments: person.subdepartments || [],
      functions: person.functions || [],

      // Company information (flattened for compatibility)
      company: person.organization?.name,
      company_id: person.organization?.id,
      company_website: person.organization?.website_url,
      company_linkedin: person.organization?.linkedin_url,
      company_logo_url: person.organization?.logo_url,
      company_size: person.organization?.estimated_num_employees,
      company_revenue: person.organization?.estimated_annual_revenue,
      industry: person.organization?.industry,

      // Image URLs
      photo_url: person.photo_url,

      // Apollo-specific fields
      email_status: person.email_status,
      extrapolated_email_confidence: person.extrapolated_email_confidence,

      // Preserve nested objects for enhanced UI
      organization: person.organization,
      organization_id: person.organization?.id,
      employment_history: person.employment_history || [],
      technologies: person.technologies || [],

      // Additional fields
      confidence: person.extrapolated_email_confidence || 0,
      data_source: 'apollo',
      last_updated: new Date()
    }))

    return {
      prospects,
      totalProspects: response.pagination.total_entries,
      pagination: {
        page: response.pagination.page,
        pageSize: response.pagination.per_page,
        hasMore: response.pagination.page < response.pagination.total_pages,
        totalPages: response.pagination.total_pages
      },
      provider: 'apollo',
      searchId: `apollo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Apollo API error ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Apollo API request failed:', error)
      throw error
    }
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') return false
    const date = new Date(dateString)
    const isValidTimestamp = !isNaN(date.getTime())
    const matchesFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    return isValidTimestamp && matchesFormat
  }
}