// B2B Data Integration Service
// Handles communication with ZoomInfo, Apollo.io, and other B2B data providers

export interface LeadSearchFilters {
  // Basic targeting
  jobTitles: string[]
  excludeJobTitles: string[]
  seniorityLevels: string[]
  jobFunctions: string[]
  
  // Company filters
  industries: string[]
  employeeCountMin: number
  employeeCountMax: number
  revenueMin: number
  revenueMax: number
  
  // Geographic
  locations: string[]
  excludeLocations: string[]
  
  // Advanced
  keywords: string
  companyKeywords: string
  technologies: string[]
  fundingStatus: string[]
  hiringActivity: boolean
  recentNews: boolean
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  title: string
  company: string
  industry: string
  location: string
  employeeCount: number
  revenue: number
  linkedinUrl?: string
  phone?: string
  technologies: string[]
  verified: boolean
  source: 'zoominfo' | 'apollo' | 'seamless' | 'hunter'
  confidence: number
  lastUpdated: Date
}

export interface SearchResponse {
  leads: Lead[]
  total: number
  hasMore: boolean
  nextCursor?: string
  searchId: string
}

export interface DataProviderConfig {
  name: string
  apiKey: string
  baseUrl: string
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  features: {
    emailVerification: boolean
    phoneNumbers: boolean
    socialProfiles: boolean
    technographics: boolean
    intentData: boolean
  }
}

interface ZoomInfoQuery {
  outputFields: string[]
  managementLevel?: string[]
  jobFunction?: string[]
  industry?: string[]
  companyEmployeeCountMin?: number
  companyEmployeeCountMax?: number
  companyRevenueMin?: number
  companyRevenueMax?: number
  location?: string[]
  excludeLocation?: string[]
  jobTitle?: string[]
  excludeJobTitle?: string[]
  technologies?: string[]
  intentTopics?: string[]
  rpp: number
  page: number
}

interface ZoomInfoPerson {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  title?: string
  city?: string
  state?: string
  country?: string
  linkedinUrl?: string
  emailStatus?: string
  confidence?: number
  lastUpdated?: string
  company?: {
    name?: string
    industry?: string
    employeeCount?: number
    revenue?: number
    technologies?: string[]
  }
}

interface ZoomInfoResponse {
  data?: ZoomInfoPerson[]
  totalResults?: number
  hasMore?: boolean
  nextCursor?: string
}

interface ApolloQuery {
  page: number
  per_page: number
  person_titles?: string[]
  person_seniorities?: string[]
  organization_industries?: string[]
  organization_num_employees_ranges?: string[]
  organization_locations?: string[]
  person_locations?: string[]
  revenue_range?: {
    min: number
    max: number
  }
  keywords?: string
  organization_keywords?: string
  technologies?: string[]
}

interface ApolloPerson {
  id?: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  phone?: string
  title?: string
  city?: string
  state?: string
  country?: string
  linkedin_url?: string
  email_status?: string
  last_updated?: string
  organization?: {
    name?: string
    industry?: string
    estimated_num_employees?: number
    estimated_annual_revenue?: number
    technologies?: string[]
  }
}

interface ApolloResponse {
  people?: ApolloPerson[]
  total_entries?: number
  pagination?: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

// ZoomInfo API Integration
export class ZoomInfoService {
  private apiKey: string
  private baseUrl = 'https://api.zoominfo.com/lookup'
  private rateLimit = { requestsPerMinute: 100, requestsPerDay: 10000 }

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchLeads(filters: LeadSearchFilters, limit = 50): Promise<SearchResponse> {
    try {
      const query = this.buildZoomInfoQuery(filters, limit)
      
      const response = await fetch(`${this.baseUrl}/person`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      })

      if (!response.ok) {
        throw new Error(`ZoomInfo API error: ${response.status}`)
      }

      const data: ZoomInfoResponse = await response.json()
      return this.formatZoomInfoResponse(data)
      
    } catch (error) {
      console.error('ZoomInfo search error:', error)
      throw new Error('Failed to search ZoomInfo database')
    }
  }

  private buildZoomInfoQuery(filters: LeadSearchFilters, limit: number): ZoomInfoQuery {
    const query: ZoomInfoQuery = {
      outputFields: [
        'id', 'firstName', 'lastName', 'email', 'phone', 'title',
        'company', 'industry', 'location', 'linkedinUrl', 'companyEmployeeCount',
        'companyRevenue', 'emailStatus', 'lastUpdated'
      ],
      managementLevel: filters.seniorityLevels.length > 0 ? 
        this.mapSeniorityToZoomInfo(filters.seniorityLevels) : undefined,
      jobFunction: filters.jobFunctions.length > 0 ? filters.jobFunctions : undefined,
      industry: filters.industries.length > 0 ? filters.industries : undefined,
      companyEmployeeCountMin: filters.employeeCountMin > 1 ? filters.employeeCountMin : undefined,
      companyEmployeeCountMax: filters.employeeCountMax < 50000 ? filters.employeeCountMax : undefined,
      companyRevenueMin: filters.revenueMin > 0 ? filters.revenueMin * 1000000 : undefined,
      companyRevenueMax: filters.revenueMax < 10000 ? filters.revenueMax * 1000000 : undefined,
      location: filters.locations.length > 0 ? filters.locations : undefined,
      excludeLocation: filters.excludeLocations.length > 0 ? filters.excludeLocations : undefined,
      jobTitle: filters.jobTitles.length > 0 ? filters.jobTitles : undefined,
      excludeJobTitle: filters.excludeJobTitles.length > 0 ? filters.excludeJobTitles : undefined,
      rpp: limit,
      page: 1
    }

    // Add technology filters if ZoomInfo supports technographics
    if (filters.technologies.length > 0) {
      query.technologies = filters.technologies
    }

    // Add intent data filters
    if (filters.hiringActivity) {
      query.intentTopics = ['hiring', 'recruitment', 'talent acquisition']
    }

    return query
  }

  private mapSeniorityToZoomInfo(levels: string[]): string[] {
    const mapping: { [key: string]: string } = {
      'C-Level': 'c_level',
      'VP': 'vp',
      'Director': 'director',
      'Manager': 'manager',
      'Individual Contributor': 'individual_contributor'
    }
    
    return levels.map(level => mapping[level]).filter(Boolean)
  }

  private formatZoomInfoResponse(data: ZoomInfoResponse): SearchResponse {
    const leads: Lead[] = data.data?.map((person: ZoomInfoPerson) => ({
      id: `zi_${person.id}`,
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      fullName: `${person.firstName || ''} ${person.lastName || ''}`.trim(),
      email: person.email || '',
      title: person.title || '',
      company: person.company?.name || '',
      industry: person.company?.industry || '',
      location: `${person.city || ''}, ${person.state || ''}, ${person.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
      employeeCount: person.company?.employeeCount || 0,
      revenue: person.company?.revenue ? Math.round(person.company.revenue / 1000000) : 0,
      linkedinUrl: person.linkedinUrl,
      phone: person.phone,
      technologies: person.company?.technologies || [],
      verified: person.emailStatus === 'verified',
      source: 'zoominfo' as const,
      confidence: person.confidence || 0.8,
      lastUpdated: new Date(person.lastUpdated || Date.now())
    })) || []

    return {
      leads,
      total: data.totalResults || 0,
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor,
      searchId: `zi_${Date.now()}`
    }
  }
}

// Apollo.io API Integration
export class ApolloService {
  private apiKey: string
  private baseUrl = 'https://api.apollo.io/v1'
  private rateLimit = { requestsPerMinute: 60, requestsPerDay: 5000 }

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchLeads(filters: LeadSearchFilters, limit = 50): Promise<SearchResponse> {
    try {
      const payload = this.buildApolloQuery(filters, limit)
      
      const response = await fetch(`${this.baseUrl}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status}`)
      }

      const data: ApolloResponse = await response.json()
      return this.formatApolloResponse(data)
      
    } catch (error) {
      console.error('Apollo search error:', error)
      throw new Error('Failed to search Apollo database')
    }
  }

  private buildApolloQuery(filters: LeadSearchFilters, limit: number): ApolloQuery {
    const query: ApolloQuery = {
      page: 1,
      per_page: limit,
      person_titles: filters.jobTitles.length > 0 ? filters.jobTitles : undefined,
      person_seniorities: filters.seniorityLevels.length > 0 ? 
        this.mapSeniorityToApollo(filters.seniorityLevels) : undefined,
      organization_industries: filters.industries.length > 0 ? filters.industries : undefined,
      organization_num_employees_ranges: this.buildEmployeeRanges(filters),
      organization_locations: filters.locations.length > 0 ? filters.locations : undefined,
      person_locations: filters.locations.length > 0 ? filters.locations : undefined,
      revenue_range: this.buildRevenueRange(filters),
      keywords: filters.keywords || undefined,
      organization_keywords: filters.companyKeywords || undefined,
      technologies: filters.technologies.length > 0 ? filters.technologies : undefined,
    }

    return query
  }

  private mapSeniorityToApollo(levels: string[]): string[] {
    const mapping: { [key: string]: string } = {
      'C-Level': 'c_suite',
      'VP': 'vp',
      'Director': 'director',
      'Manager': 'manager',
      'Individual Contributor': 'individual'
    }
    
    return levels.map(level => mapping[level]).filter(Boolean)
  }

  private buildEmployeeRanges(filters: LeadSearchFilters): string[] | undefined {
    const ranges: string[] = []
    
    if (filters.employeeCountMin <= 10 && filters.employeeCountMax >= 10) ranges.push('1,10')
    if (filters.employeeCountMin <= 50 && filters.employeeCountMax >= 11) ranges.push('11,50')
    if (filters.employeeCountMin <= 200 && filters.employeeCountMax >= 51) ranges.push('51,200')
    if (filters.employeeCountMin <= 1000 && filters.employeeCountMax >= 201) ranges.push('201,1000')
    if (filters.employeeCountMin <= 5000 && filters.employeeCountMax >= 1001) ranges.push('1001,5000')
    if (filters.employeeCountMax >= 5001) ranges.push('5001,10000')
    
    return ranges.length > 0 ? ranges : undefined
  }

  private buildRevenueRange(filters: LeadSearchFilters): { min: number; max: number } | undefined {
    if (filters.revenueMin > 0 || filters.revenueMax < 10000) {
      return {
        min: filters.revenueMin * 1000000,
        max: filters.revenueMax * 1000000
      }
    }
    return undefined
  }

  private formatApolloResponse(data: ApolloResponse): SearchResponse {
    const leads: Lead[] = data.people?.map((person: ApolloPerson) => ({
      id: `ap_${person.id}`,
      firstName: person.first_name || '',
      lastName: person.last_name || '',
      fullName: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email || '',
      title: person.title || '',
      company: person.organization?.name || '',
      industry: person.organization?.industry || '',
      location: `${person.city || ''}, ${person.state || ''}, ${person.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
      employeeCount: person.organization?.estimated_num_employees || 0,
      revenue: person.organization?.estimated_annual_revenue ? 
        Math.round(person.organization.estimated_annual_revenue / 1000000) : 0,
      linkedinUrl: person.linkedin_url,
      phone: person.phone,
      technologies: person.organization?.technologies || [],
      verified: person.email_status === 'verified',
      source: 'apollo' as const,
      confidence: 0.7, // Apollo typically has good data quality
      lastUpdated: new Date(person.last_updated || Date.now())
    })) || []

    return {
      leads,
      total: data.total_entries || 0,
      hasMore: (data.pagination?.page || 0) < (data.pagination?.total_pages || 0),
      searchId: `ap_${Date.now()}`
    }
  }
}

// Unified B2B Data Service
export class B2BDataService {
  private zoomInfo?: ZoomInfoService
  private apollo?: ApolloService
  private providers: DataProviderConfig[] = []

  constructor() {
    // Initialize services if API keys are available
    const zoomInfoKey = process.env.ZOOMINFO_API_KEY
    const apolloKey = process.env.APOLLO_API_KEY

    if (zoomInfoKey) {
      this.zoomInfo = new ZoomInfoService(zoomInfoKey)
      this.providers.push({
        name: 'ZoomInfo',
        apiKey: zoomInfoKey,
        baseUrl: 'https://api.zoominfo.com',
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
        features: {
          emailVerification: true,
          phoneNumbers: true,
          socialProfiles: true,
          technographics: true,
          intentData: true
        }
      })
    }

    if (apolloKey) {
      this.apollo = new ApolloService(apolloKey)
      this.providers.push({
        name: 'Apollo',
        apiKey: apolloKey,
        baseUrl: 'https://api.apollo.io',
        rateLimit: { requestsPerMinute: 60, requestsPerDay: 5000 },
        features: {
          emailVerification: true,
          phoneNumbers: false,
          socialProfiles: true,
          technographics: true,
          intentData: false
        }
      })
    }
  }

  async searchLeads(filters: LeadSearchFilters, limit = 50): Promise<SearchResponse> {
    const errors: string[] = []

    // Try ZoomInfo first (typically higher data quality)
    if (this.zoomInfo) {
      try {
        const results = await this.zoomInfo.searchLeads(filters, limit)
        if (results.leads.length > 0) {
          return results
        }
      } catch (error) {
        console.error('ZoomInfo search failed:', error)
        errors.push(`ZoomInfo: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Fallback to Apollo
    if (this.apollo) {
      try {
        const results = await this.apollo.searchLeads(filters, limit)
        if (results.leads.length > 0) {
          return results
        }
      } catch (error) {
        console.error('Apollo search failed:', error)
        errors.push(`Apollo: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // If all providers fail, return empty results with error info
    console.warn('All B2B data providers failed:', errors)
    return {
      leads: [],
      total: 0,
      hasMore: false,
      searchId: `failed_${Date.now()}`
    }
  }

  async enrichLead(email: string): Promise<Lead | null> {
    // Try each provider for lead enrichment
    const providers: (ZoomInfoService | ApolloService)[] = []
    
    if (this.zoomInfo) providers.push(this.zoomInfo)
    if (this.apollo) providers.push(this.apollo)
    
    for (const provider of providers) {
      try {
        // Create a minimal filter to search for this specific email
        const filters: LeadSearchFilters = {
          jobTitles: [],
          excludeJobTitles: [],
          seniorityLevels: [],
          jobFunctions: [],
          industries: [],
          employeeCountMin: 1,
          employeeCountMax: 50000,
          revenueMin: 0,
          revenueMax: 10000,
          locations: [],
          excludeLocations: [],
          keywords: email,
          companyKeywords: '',
          technologies: [],
          fundingStatus: [],
          hiringActivity: false,
          recentNews: false
        }

        const results = await provider.searchLeads(filters, 1)
        if (results.leads.length > 0) {
          const lead = results.leads.find(l => l.email.toLowerCase() === email.toLowerCase())
          if (lead) return lead
        }
      } catch (error) {
        console.error(`Lead enrichment failed for provider:`, error)
        continue
      }
    }

    return null
  }

  getAvailableProviders(): DataProviderConfig[] {
    return this.providers
  }

  async verifyEmail(email: string): Promise<{ valid: boolean, deliverable: boolean, reason?: string }> {
    // Use available providers to verify email deliverability
    try {
      if (this.zoomInfo) {
        const response = await fetch('https://api.zoominfo.com/lookup/email/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.ZOOMINFO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        })

        if (response.ok) {
          const data = await response.json()
          return {
            valid: data.status === 'valid',
            deliverable: data.deliverable,
            reason: data.reason
          }
        }
      }
    } catch (error) {
      console.error('Email verification failed:', error)
    }

    return { valid: true, deliverable: true } // Default to assuming valid
  }
}

// Export singleton instance
export const b2bDataService = new B2BDataService() 