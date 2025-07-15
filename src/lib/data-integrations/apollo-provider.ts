// Apollo Provider Service
// Implements Apollo.io mixed_people/search API integration with comprehensive filtering

import { getApolloHttpClient } from '../apollo-http'

// Apollo API Filter Interfaces
export interface ApolloSearchFilters {
  // Person-level filters
  person_titles?: string[]
  person_seniorities?: string[]
  person_locations?: string[]
  person_time_in_current_role?: string[]
  person_total_years_experience?: string[]
  has_email?: boolean

  // Company-level filters
  company_industries?: string[]
  company_headcount?: string[]
  company_domains?: string[]
  company_intent_topics?: string[]
  
  // Organization location filters
  'organization_locations[]'?: string[]
  
  // Revenue range filters
  'revenue_range[min]'?: number
  'revenue_range[max]'?: number
  
  // Technology filters (Apollo UIDs)
  'currently_using_any_of_technology_uids[]'?: string[]
  'currently_not_using_any_of_technology_uids[]'?: string[]
  
  // Organization job-related filters
  'q_organization_job_titles[]'?: string[]
  'organization_job_locations[]'?: string[]

  // Pagination
  page?: number
  per_page?: number
}

// Apollo API Response Interfaces
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
  
  // Additional fields from Apollo response
  headline?: string
  photo_url?: string
  extrapolated_email_confidence?: number
  
  // Location data
  city?: string
  state?: string
  country?: string
  
  // Professional categorization
  departments?: string[]
  subdepartments?: string[]
  seniority?: string
  functions?: string[]
  
  // Email domain info
  email_domain_catchall?: boolean
  revealed_for_current_team?: boolean
  
  // Employment history
  employment_history?: Array<{
    id?: string
    _id?: string
    created_at?: string
    current?: boolean
    degree?: string
    description?: string
    end_date?: string
    grade_level?: string
    kind?: string
    major?: string
    organization_id?: string
    organization_name?: string
    raw_address?: string
    start_date?: string
    title?: string
    _type?: string
    updated_at?: string
    key?: string
  }>
  
  // Organization/Company data
  organization?: {
    id?: string
    name?: string
    website_url?: string
    blog_url?: string
    angellist_url?: string
    linkedin_url?: string
    twitter_url?: string
    facebook_url?: string
    
    // Company details
    primary_phone?: {
      number?: string
      source?: string
      sanitized_number?: string
    }
    languages?: string[]
    alexa_ranking?: number
    phone?: string
    linkedin_uid?: string
    founded_year?: number
    publicly_traded_symbol?: string
    publicly_traded_exchange?: string
    logo_url?: string
    crunchbase_url?: string
    primary_domain?: string
    sanitized_phone?: string
    persona_counts?: Record<string, number>
    
    // Company metrics
    estimated_num_employees?: number
    snippets_loaded?: boolean
    industry?: string
    keywords?: string[]
    estimated_annual_revenue?: number
    technologies?: string[]
    accounting_technologies?: string[]
    departments?: string[]
    seo_description?: string
    short_description?: string
    annual_revenue?: number
    
    // Growth metrics
    organization_headcount_six_month_growth?: number
    organization_headcount_twelve_month_growth?: number
    organization_headcount_twenty_four_month_growth?: number
  }
}

export interface ApolloPagination {
  page: number
  per_page: number
  total_entries: number
  total_pages: number
}

export interface ApolloBreadcrumb {
  label: string
  signal_field_name: string
  value: string | boolean
  display_name: string
}

export interface ApolloResponse {
  breadcrumbs?: ApolloBreadcrumb[]
  partial_results_only?: boolean
  disable_eu_prospecting?: boolean
  partial_results_limit?: number
  pagination: ApolloPagination
  people: ApolloPerson[]
}

// Internal normalized interfaces
export interface NormalizedPerson {
  id: string
  external_id: string
  
  // Personal information
  first_name?: string
  last_name?: string
  full_name: string
  email?: string
  email_status?: 'verified' | 'likely' | 'guessed' | 'unavailable'
  phone?: string
  headline?: string
  photo_url?: string
  
  // Professional information
  title?: string
  seniority_level?: string
  department?: string
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
  employment_history?: Array<{
    company?: string
    title?: string
    start_date?: string
    end_date?: string
    current?: boolean
  }>
  
  // Metadata
  data_source: 'apollo'
  confidence: number
  last_updated: Date
}

export interface SearchResponse {
  people: NormalizedPerson[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
    has_more: boolean
  }
  breadcrumbs: ApolloBreadcrumb[]
  search_id: string
}

// Valid options for Apollo filters
export const APOLLO_SENIORITIES = [
  'founder',
  'c_level',
  'vp',
  'director',
  'manager',
  'senior',
  'junior',
  'intern'
] as const

export const APOLLO_TIME_IN_ROLE = [
  '0-6_months',
  '6-12_months', 
  '1-3_years',
  '3-5_years',
  '5-10_years',
  '10+_years'
] as const

export const APOLLO_EXPERIENCE_RANGES = [
  '0-1_years',
  '1-3_years',
  '3-5_years',
  '5-10_years',
  '10-15_years',
  '15-20_years',
  '20+_years'
] as const

export const APOLLO_COMPANY_HEADCOUNT = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+'
] as const

class ApolloProviderService {
  private httpClient = getApolloHttpClient()

  /**
   * Search for people using Apollo's mixed_people/search endpoint
   */
  async searchPeople(filters: ApolloSearchFilters): Promise<SearchResponse> {
    try {
      // Validate and clean filters
      const cleanedFilters = this.validateAndCleanFilters(filters)
      
      console.log('Apollo search with filters:', cleanedFilters)
      
      // Make API call to Apollo
      const response: ApolloResponse = await this.httpClient.post(
        '/mixed_people/search',
        cleanedFilters
      )
      
      // Normalize the response
      return this.normalizeResponse(response)
      
    } catch (error) {
      console.error('Apollo search error:', error)
      throw new Error(`Apollo search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a single person by ID from Apollo
   */
  async getPerson(id: string): Promise<NormalizedPerson | null> {
    try {
      const response = await this.httpClient.get(`/people/${id}`)
      if (response.person) {
        return this.normalizePerson(response.person)
      }
      return null
    } catch (error) {
      console.error('Apollo get person error:', error)
      return null
    }
  }

  /**
   * Validate and clean the search filters according to Apollo's requirements
   */
  private validateAndCleanFilters(filters: ApolloSearchFilters): ApolloSearchFilters {
    const cleaned: ApolloSearchFilters = {
      page: Math.max(1, filters.page || 1),
      per_page: Math.min(100, Math.max(1, filters.per_page || 20))
    }

    // Person-level filters
    if (filters.person_titles?.length) {
      cleaned.person_titles = filters.person_titles
        .filter(title => title.trim().length > 0)
        .slice(0, 100) // Apollo limit
    }

    if (filters.person_seniorities?.length) {
      cleaned.person_seniorities = filters.person_seniorities
        .filter(seniority => APOLLO_SENIORITIES.includes(seniority as any))
        .slice(0, 20)
    }

    if (filters.person_locations?.length) {
      cleaned.person_locations = filters.person_locations
        .filter(location => location.trim().length > 0)
        .slice(0, 50)
    }

    if (filters.person_time_in_current_role?.length) {
      cleaned.person_time_in_current_role = filters.person_time_in_current_role
        .filter(time => APOLLO_TIME_IN_ROLE.includes(time as any))
    }

    if (filters.person_total_years_experience?.length) {
      cleaned.person_total_years_experience = filters.person_total_years_experience
        .filter(exp => APOLLO_EXPERIENCE_RANGES.includes(exp as any))
    }

    if (typeof filters.has_email === 'boolean') {
      cleaned.has_email = filters.has_email
    }

    // Company-level filters
    if (filters.company_industries?.length) {
      cleaned.company_industries = filters.company_industries
        .filter(industry => industry.trim().length > 0)
        .slice(0, 50)
    }

    if (filters.company_headcount?.length) {
      cleaned.company_headcount = filters.company_headcount
        .filter(headcount => APOLLO_COMPANY_HEADCOUNT.includes(headcount as any))
    }

    if (filters.company_domains?.length) {
      cleaned.company_domains = filters.company_domains
        .filter(domain => domain.trim().length > 0 && domain.includes('.'))
        .slice(0, 20)
    }

    if (filters.company_intent_topics?.length) {
      cleaned.company_intent_topics = filters.company_intent_topics
        .filter(topic => topic.trim().length > 0)
        .slice(0, 30)
    }

    // Organization location filters
    if (filters['organization_locations[]']?.length) {
      cleaned['organization_locations[]'] = filters['organization_locations[]']
        .filter(location => location.trim().length > 0)
        .slice(0, 50)
    }

    // Revenue range filters (ensure integers only)
    if (typeof filters['revenue_range[min]'] === 'number' && filters['revenue_range[min]'] >= 0) {
      cleaned['revenue_range[min]'] = Math.floor(filters['revenue_range[min]'])
    }

    if (typeof filters['revenue_range[max]'] === 'number' && filters['revenue_range[max]'] >= 0) {
      cleaned['revenue_range[max]'] = Math.floor(filters['revenue_range[max]'])
    }

    // Technology UIDs filter
    if (filters['currently_using_any_of_technology_uids[]']?.length) {
      cleaned['currently_using_any_of_technology_uids[]'] = filters['currently_using_any_of_technology_uids[]']
        .filter(uid => uid.trim().length > 0)
        .slice(0, 50) // Apollo supports up to 50 technology filters
    }

    // Exclude Technology UIDs filter
    if (filters['currently_not_using_any_of_technology_uids[]']?.length) {
      cleaned['currently_not_using_any_of_technology_uids[]'] = filters['currently_not_using_any_of_technology_uids[]']
        .filter(uid => uid.trim().length > 0)
        .slice(0, 50) // Apollo supports up to 50 technology filters
    }

    // Organization job titles filter
    if (filters['q_organization_job_titles[]']?.length) {
      cleaned['q_organization_job_titles[]'] = filters['q_organization_job_titles[]']
        .filter(title => title.trim().length > 0)
        .slice(0, 30)
    }

    // Organization job locations filter
    if (filters['organization_job_locations[]']?.length) {
      cleaned['organization_job_locations[]'] = filters['organization_job_locations[]']
        .filter(location => location.trim().length > 0)
        .slice(0, 30)
    }

    return cleaned
  }

  /**
   * Normalize Apollo API response to internal format
   */
  private normalizeResponse(response: ApolloResponse): SearchResponse {
    const normalizedPeople = response.people.map(person => this.normalizePerson(person))
    
    return {
      people: normalizedPeople,
      pagination: {
        page: response.pagination.page,
        per_page: response.pagination.per_page,
        total_entries: response.pagination.total_entries,
        total_pages: response.pagination.total_pages,
        has_more: response.pagination.page < response.pagination.total_pages
      },
      breadcrumbs: response.breadcrumbs || [],
      search_id: `apollo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Normalize a single person from Apollo format to internal format
   */
  private normalizePerson(person: ApolloPerson): NormalizedPerson {
    // Extract location information
    const locationParts = [person.city, person.state, person.country].filter(Boolean)
    const location = locationParts.join(', ')

    // Extract employment history
    const employmentHistory = person.employment_history?.map(emp => ({
      company: emp.organization_name,
      title: emp.title,
      start_date: emp.start_date,
      end_date: emp.end_date,
      current: emp.current || false
    })) || []

    // Determine seniority level from title
    const seniority = this.extractSeniorityFromTitle(person.title || '')

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(person)

    return {
      id: `apollo_${person.id}`,
      external_id: person.id,
      
      // Personal information
      first_name: person.first_name,
      last_name: person.last_name,
      full_name: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email,
      email_status: person.email_status,
      phone: person.phone,
      headline: person.headline,
      photo_url: person.photo_url,
      
      // Professional information
      title: person.title,
      seniority_level: seniority,
      department: this.extractDepartmentFromTitle(person.title || ''),
      years_experience: this.calculateYearsExperience(employmentHistory),
      time_in_current_role: this.calculateTimeInCurrentRole(employmentHistory),
      
      // Professional categorization from Apollo
      departments: person.departments,
      subdepartments: person.subdepartments,
      seniority: person.seniority,
      functions: person.functions,
      
      // Company information
      company: person.organization?.name,
      company_id: person.organization?.id,
      industry: person.organization?.industry,
      company_size: person.organization?.estimated_num_employees,
      company_revenue: person.organization?.estimated_annual_revenue,
      company_website: person.organization?.website_url,
      company_linkedin: person.organization?.linkedin_url,
      company_founded_year: person.organization?.founded_year,
      company_logo_url: person.organization?.logo_url,
      company_phone: person.organization?.primary_phone?.number,
      company_alexa_ranking: person.organization?.alexa_ranking,
      company_primary_domain: person.organization?.primary_domain,
      
      // Company growth metrics
      company_headcount_six_month_growth: person.organization?.organization_headcount_six_month_growth,
      company_headcount_twelve_month_growth: person.organization?.organization_headcount_twelve_month_growth,
      company_headcount_twenty_four_month_growth: person.organization?.organization_headcount_twenty_four_month_growth,
      
      // Location
      city: person.city,
      state: person.state,
      country: person.country,
      location,
      
      // Social profiles
      linkedin_url: person.linkedin_url,
      twitter_url: person.twitter_url,
      facebook_url: person.facebook_url,
      github_url: person.github_url,
      
      // Technologies and skills
      technologies: person.organization?.technologies || [],
      keywords: person.organization?.keywords || [],
      
      // Employment history
      employment_history: employmentHistory,
      
      // Metadata
      data_source: 'apollo',
      confidence,
      last_updated: new Date()
    }
  }

  /**
   * Extract seniority level from job title
   */
  private extractSeniorityFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('ceo') || lowerTitle.includes('cfo') || lowerTitle.includes('cto') || 
        lowerTitle.includes('chief') || lowerTitle.includes('founder') || lowerTitle.includes('president')) {
      return 'c_level'
    }
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) {
      return 'vp'
    }
    if (lowerTitle.includes('director')) {
      return 'director'
    }
    if (lowerTitle.includes('manager') || lowerTitle.includes('lead') || lowerTitle.includes('head of')) {
      return 'manager'
    }
    if (lowerTitle.includes('senior') || lowerTitle.includes('sr.') || lowerTitle.includes('principal')) {
      return 'senior'
    }
    if (lowerTitle.includes('junior') || lowerTitle.includes('jr.') || lowerTitle.includes('associate')) {
      return 'junior'
    }
    if (lowerTitle.includes('intern')) {
      return 'intern'
    }
    
    return 'individual_contributor'
  }

  /**
   * Extract department from job title
   */
  private extractDepartmentFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('sales') || lowerTitle.includes('business development') || lowerTitle.includes('account')) {
      return 'sales'
    }
    if (lowerTitle.includes('marketing') || lowerTitle.includes('growth') || lowerTitle.includes('brand')) {
      return 'marketing'
    }
    if (lowerTitle.includes('engineer') || lowerTitle.includes('developer') || lowerTitle.includes('technical') ||
        lowerTitle.includes('software') || lowerTitle.includes('it ') || lowerTitle.includes('devops')) {
      return 'engineering'
    }
    if (lowerTitle.includes('hr') || lowerTitle.includes('human resources') || lowerTitle.includes('people')) {
      return 'hr'
    }
    if (lowerTitle.includes('finance') || lowerTitle.includes('accounting') || lowerTitle.includes('financial')) {
      return 'finance'
    }
    if (lowerTitle.includes('operations') || lowerTitle.includes('ops') || lowerTitle.includes('supply chain')) {
      return 'operations'
    }
    if (lowerTitle.includes('product') || lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) {
      return 'product'
    }
    if (lowerTitle.includes('legal') || lowerTitle.includes('counsel') || lowerTitle.includes('compliance')) {
      return 'legal'
    }
    
    return 'other'
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(person: ApolloPerson): number {
    let score = 0.6 // Base score for Apollo data

    // Email verification adds confidence
    if (person.email_status === 'verified') score += 0.2
    else if (person.email_status === 'likely') score += 0.1

    // Having phone number
    if (person.phone) score += 0.05

    // LinkedIn profile
    if (person.linkedin_url) score += 0.05

    // Company information
    if (person.organization?.name) score += 0.05
    if (person.organization?.website_url) score += 0.02
    if (person.organization?.estimated_num_employees) score += 0.02
    if (person.organization?.industry) score += 0.01

    return Math.min(1.0, Math.round(score * 100) / 100)
  }

  /**
   * Calculate years of experience based on employment history
   */
  private calculateYearsExperience(employmentHistory: Array<{ start_date?: string; end_date?: string; current?: boolean }>): number {
    if (!employmentHistory.length) return 0
    
    const currentYear = new Date().getFullYear()
    let earliestYear = currentYear
    
    employmentHistory.forEach(emp => {
      if (emp.start_date) {
        const startYear = parseInt(emp.start_date.split('-')[0])
        if (startYear < earliestYear) {
          earliestYear = startYear
        }
      }
    })
    
    return currentYear - earliestYear
  }

  /**
   * Calculate time in current role based on employment history
   */
  private calculateTimeInCurrentRole(employmentHistory: Array<{ start_date?: string; current?: boolean }>): string {
    const currentJob = employmentHistory.find(emp => emp.current)
    
    if (!currentJob?.start_date) return '0-6_months'
    
    const startDate = new Date(currentJob.start_date)
    const currentDate = new Date()
    const monthsDiff = Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    if (monthsDiff <= 6) return '0-6_months'
    if (monthsDiff <= 12) return '6-12_months'
    if (monthsDiff <= 36) return '1-3_years'
    if (monthsDiff <= 60) return '3-5_years'
    if (monthsDiff <= 120) return '5-10_years'
    return '10+_years'
  }

  /**
   * Transform UI filter input to Apollo API search filters format
   */
  public transformUIFiltersToAPIFilters(uiFilters: import('@/types/apollo').ApolloFilterInput): ApolloSearchFilters {
    const apiFilters: ApolloSearchFilters = {
      page: uiFilters.page || 1,
      per_page: uiFilters.perPage || 20
    }

    // Person-level filters
    if (uiFilters.jobTitles?.length) {
      apiFilters.person_titles = uiFilters.jobTitles
    }

    if (uiFilters.seniorities?.length) {
      apiFilters.person_seniorities = uiFilters.seniorities
    }

    if (uiFilters.personLocations?.length) {
      apiFilters.person_locations = uiFilters.personLocations
    }

    if (typeof uiFilters.hasEmail === 'boolean') {
      apiFilters.has_email = uiFilters.hasEmail
    }

    // Company-level filters
    if (uiFilters.industries?.length) {
      apiFilters.company_industries = uiFilters.industries
    }

    if (uiFilters.companyHeadcount?.length) {
      apiFilters.company_headcount = uiFilters.companyHeadcount
    }

    if (uiFilters.companyDomains?.length) {
      apiFilters.company_domains = uiFilters.companyDomains
    }

    if (uiFilters.intentTopics?.length) {
      apiFilters.company_intent_topics = uiFilters.intentTopics
    }

    // Organization location filters
    if (uiFilters.organizationLocations?.length) {
      apiFilters['organization_locations[]'] = uiFilters.organizationLocations
    }

    // Revenue range filters (ensure integers)
    if (typeof uiFilters.revenueMin === 'number' && uiFilters.revenueMin >= 0) {
      apiFilters['revenue_range[min]'] = Math.floor(uiFilters.revenueMin)
    }

    if (typeof uiFilters.revenueMax === 'number' && uiFilters.revenueMax >= 0) {
      apiFilters['revenue_range[max]'] = Math.floor(uiFilters.revenueMax)
    }

    // Technology UIDs (Apollo format)
    if (uiFilters.technologyUids?.length) {
      apiFilters['currently_using_any_of_technology_uids[]'] = uiFilters.technologyUids
    }

    // Exclude Technology UIDs (Apollo format)
    if (uiFilters.excludeTechnologyUids?.length) {
      apiFilters['currently_not_using_any_of_technology_uids[]'] = uiFilters.excludeTechnologyUids
    }

    // Organization job-related filters
    if (uiFilters.organizationJobTitles?.length) {
      apiFilters['q_organization_job_titles[]'] = uiFilters.organizationJobTitles
    }

    if (uiFilters.organizationJobLocations?.length) {
      apiFilters['organization_job_locations[]'] = uiFilters.organizationJobLocations
    }

    return apiFilters
  }

  /**
   * Search people using UI filter format (convenience method)
   */
  async searchPeopleWithUIFilters(uiFilters: import('@/types/apollo').ApolloFilterInput): Promise<SearchResponse> {
    const apiFilters = this.transformUIFiltersToAPIFilters(uiFilters)
    return this.searchPeople(apiFilters)
  }
}

// Export singleton instance
export const apolloProvider = new ApolloProviderService()
export default apolloProvider 