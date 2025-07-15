// Explorium API Service
// Handles autocomplete and validation for ICP filters

export interface ExploriuMAutocompleteResult {
  value: string
  label: string
  category?: string
}

export interface ExploriuMAPIResponse<T> {
  data: T[]
  total: number
  page?: number
  page_size?: number
}

export interface IndustryAutocompleteResult {
  id: string
  name: string
  category_type: 'linkedin' | 'naics' | 'google'
}

export interface JobTitleAutocompleteResult {
  id: string
  title: string
  department?: string
  level?: string
}

export interface LocationAutocompleteResult {
  id: string
  name: string
  country_code?: string
  region_code?: string
  type: 'country' | 'region' | 'city'
}

export interface TechnologyAutocompleteResult {
  id: string
  name: string
  category?: string
}

export interface ExploriuMBusinessResult {
  business_id: string
  name?: string
  company_name?: string
  domain?: string
  website?: string
  description?: string
  industry?: string
  size?: string
  employee_count?: number
  revenue?: string
  location?: string
  founded_year?: number
  [key: string]: any
}

export interface ExploriuMProspectResult {
  prospect_id: string
  name?: string
  first_name?: string
  last_name?: string
  full_name?: string  // Add this - this is where Explorium puts the actual name!
  title?: string
  job_title?: string
  company_name?: string
  company_domain?: string
  company_website?: string      // Add missing field
  company_linkedin?: string     // Add missing field  
  email?: string
  professional_email_hashed?: string  // Add missing field
  phone?: string
  linkedin_url?: string
  linkedin?: string             // Add missing field (appears as 'linkedin' in response)
  location?: string
  city?: string
  country_name?: string         // Add missing field
  region_name?: string          // Add missing field
  job_level?: string
  job_seniority_level?: string  // Add missing field  
  job_department?: string
  total_experience_months?: number
  current_role_months?: number
  company_size?: string
  company_industry?: string
  experience?: string           // Add missing field
  skills?: string               // Add missing field  
  interests?: string            // Add missing field
  business_id?: string          // Add missing field
  organization?: any
  [key: string]: any
}

export interface ExploriuMBusinessResponse {
  data: ExploriuMBusinessResult[]
  total?: number
  page?: number
  page_size?: number
  [key: string]: any
}

export interface ExploriuMProspectResponse {
  data: ExploriuMProspectResult[]
  total?: number
  page?: number
  page_size?: number
  [key: string]: any
}

export interface ExploriuMContactDetailsResponse {
  data: Array<{
    prospect_id: string
    email?: string
    phone?: string
    [key: string]: any
  }>
  [key: string]: any
}

export class ExploriuMService {
  private apiKey: string
  private baseUrl: string = 'https://api.explorium.ai'

  constructor() {
    this.apiKey = process.env.EXPLORIUM_API_KEY || ''
    if (!this.apiKey) {
      console.warn('EXPLORIUM_API_KEY not found in environment variables')
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Explorium API key is not configured')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    // Log the request for debugging
    console.log(`🔍 Explorium API: ${options.method || 'GET'} ${url}`)
    
    if (options.body) {
      try {
        const parsedBody = JSON.parse(options.body as string)
        console.log(`📋 Request payload:`, {
          mode: parsedBody.mode,
          size: parsedBody.size,
          page_size: parsedBody.page_size,
          page: parsedBody.page,
          filters_count: Object.keys(parsedBody.filters || {}).length
        })
      } catch (e) {
        console.log(`📋 Request body:`, options.body)
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'API_KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Explorium API error ${response.status}:`, errorText)
      throw new Error(`Explorium API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ Response:`, { 
      total: data.total_results || data.total,
      page: data.page,
      page_size: data.page_size,
      records: data.data?.length 
    })
    
    return data
  }

  /**
   * Autocomplete business/company related fields
   */
  async autocompleteBusinesses(field: string, query: string, limit: number = 10): Promise<ExploriuMAutocompleteResult[]> {
    try {
      const endpoint = `/v1/autocomplete/businesses?field=${encodeURIComponent(field)}&query=${encodeURIComponent(query)}&limit=${limit}`
      const response = await this.makeRequest<{ suggestions: ExploriuMAutocompleteResult[] }>(endpoint)
      return response.suggestions || []
    } catch (error) {
      console.error(`Explorium businesses autocomplete error for field ${field}:`, error)
      return []
    }
  }

  /**
   * Autocomplete prospect/people related fields
   */
  async autocompleteProspects(field: string, query: string, limit: number = 10): Promise<ExploriuMAutocompleteResult[]> {
    try {
      const endpoint = `/v1/autocomplete/prospects?field=${encodeURIComponent(field)}&query=${encodeURIComponent(query)}&limit=${limit}`
      const response = await this.makeRequest<{ suggestions: ExploriuMAutocompleteResult[] }>(endpoint)
      return response.suggestions || []
    } catch (error) {
      console.error(`Explorium prospects autocomplete error for field ${field}:`, error)
      return []
    }
  }

  /**
   * Validate and get standardized industry categories
   */
  async validateIndustries(industries: string[]): Promise<{ [key: string]: string[] }> {
    const validatedIndustries: { [key: string]: string[] } = {}

    for (const industry of industries) {
      try {
        // Try LinkedIn categories first (most common)
        const linkedInResults = await this.autocompleteBusinesses('linkedin_category', industry, 5)
        if (linkedInResults.length > 0) {
          validatedIndustries[industry] = linkedInResults.map(r => r.value)
          continue
        }

        // Try NAICS codes as fallback
        const naicsResults = await this.autocompleteBusinesses('naics_category', industry, 5)
        if (naicsResults.length > 0) {
          validatedIndustries[industry] = naicsResults.map(r => r.value)
          continue
        }

        // Try Google categories as fallback
        const googleResults = await this.autocompleteBusinesses('google_category', industry, 5)
        if (googleResults.length > 0) {
          validatedIndustries[industry] = googleResults.map(r => r.value)
          continue
        }

        // If no matches found, keep original
        validatedIndustries[industry] = [industry]
      } catch (error) {
        console.error(`Error validating industry "${industry}":`, error)
        validatedIndustries[industry] = [industry]
      }
    }

    return validatedIndustries
  }

  /**
   * Validate and get standardized job titles/levels
   */
  async validateJobTitles(jobTitles: string[]): Promise<{ [key: string]: { titles: string[], levels: string[], departments: string[] } }> {
    const validatedJobs: { [key: string]: { titles: string[], levels: string[], departments: string[] } } = {}

    for (const jobTitle of jobTitles) {
      try {
        // Get job title suggestions
        const titleResults = await this.autocompleteProspects('job_title', jobTitle, 5)
        
        // Get job level suggestions
        const levelResults = await this.autocompleteProspects('job_level', jobTitle, 5)
        
        // Get department suggestions
        const deptResults = await this.autocompleteProspects('job_department', jobTitle, 5)

        validatedJobs[jobTitle] = {
          titles: titleResults.map(r => r.value),
          levels: levelResults.map(r => r.value),
          departments: deptResults.map(r => r.value)
        }
      } catch (error) {
        console.error(`Error validating job title "${jobTitle}":`, error)
        validatedJobs[jobTitle] = {
          titles: [jobTitle],
          levels: [],
          departments: []
        }
      }
    }

    return validatedJobs
  }

  /**
   * Validate and get standardized locations
   */
  async validateLocations(locations: string[]): Promise<{ [key: string]: string[] }> {
    const validatedLocations: { [key: string]: string[] } = {}

    for (const location of locations) {
      try {
        // Try country codes first
        const countryResults = await this.autocompleteBusinesses('country_code', location, 5)
        if (countryResults.length > 0) {
          validatedLocations[location] = countryResults.map(r => r.value)
          continue
        }

        // Try regions
        const regionResults = await this.autocompleteBusinesses('region_country_code', location, 5)
        if (regionResults.length > 0) {
          validatedLocations[location] = regionResults.map(r => r.value)
          continue
        }

        // Try cities
        const cityResults = await this.autocompleteBusinesses('city_region_country', location, 5)
        if (cityResults.length > 0) {
          validatedLocations[location] = cityResults.map(r => r.value)
          continue
        }

        // If no matches found, keep original
        validatedLocations[location] = [location]
      } catch (error) {
        console.error(`Error validating location "${location}":`, error)
        validatedLocations[location] = [location]
      }
    }

    return validatedLocations
  }

  /**
   * Validate and get standardized technologies
   */
  async validateTechnologies(technologies: string[]): Promise<{ [key: string]: string[] }> {
    const validatedTechs: { [key: string]: string[] } = {}

    for (const tech of technologies) {
      try {
        // Try technology stack
        const techResults = await this.autocompleteBusinesses('company_tech_stack_tech', tech, 5)
        if (techResults.length > 0) {
          validatedTechs[tech] = techResults.map(r => r.value)
          continue
        }

        // Try technology categories
        const categoryResults = await this.autocompleteBusinesses('company_tech_stack_category', tech, 5)
        if (categoryResults.length > 0) {
          validatedTechs[tech] = categoryResults.map(r => r.value)
          continue
        }

        // If no matches found, keep original
        validatedTechs[tech] = [tech]
      } catch (error) {
        console.error(`Error validating technology "${tech}":`, error)
        validatedTechs[tech] = [tech]
      }
    }

    return validatedTechs
  }

  /**
   * Get business statistics for preview
   */
  async getBusinessStatistics(filters: any): Promise<{ count: number, sample_companies?: any[] }> {
    try {
      const response = await this.makeRequest<{ total: number, data?: any[] }>('/v1/businesses/statistics', {
        method: 'POST',
        body: JSON.stringify({ filters })
      })
      
      return {
        count: response.total,
        sample_companies: response.data
      }
    } catch (error) {
      console.error('Error getting business statistics:', error)
      return { count: 0 }
    }
  }

  /**
   * Fetch businesses from Explorium (Step 1 of two-stage search)
   */
  async fetchBusinesses(filters: any, options: { page?: number, pageSize?: number, totalSize?: number, mode?: 'full' | 'preview' } = {}): Promise<ExploriuMBusinessResponse> {
    try {
      const { page = 1, pageSize = 25, totalSize = 100, mode = 'preview' } = options
      
      // Transform filters to proper Explorium format
      const transformedFilters = this.transformBusinessFilters(filters)
      
      const payload = {
        filters: transformedFilters,
        mode,
        size: Math.min(totalSize, 1), // Total max records across all pages (API limit: 10,000)
        page_size: Math.min(pageSize, 1), // Records per page (API limit: 100)
        page
      }

      console.log('🔍 Fetching businesses with payload:', JSON.stringify(payload, null, 2))

      const response = await this.makeRequest<ExploriuMBusinessResponse>('/v1/businesses', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('✅ Businesses response:', { 
        total: response.total, 
        page: response.page, 
        page_size: response.page_size,
        records_returned: response.data?.length 
      })

      return response
    } catch (error) {
      console.error('❌ Error fetching businesses:', error)
      throw error
    }
  }

  /**
   * Fetch prospects from Explorium (Step 2 of two-stage search)
   */
  async fetchProspects(filters: any, options: { page?: number, pageSize?: number, totalSize?: number, mode?: 'full' | 'preview', businessIds?: string[] } = {}): Promise<ExploriuMProspectResponse> {
    try {
      const { page = 1, pageSize = 1, totalSize = 1, mode = 'preview' , businessIds } = options
      
      // Transform filters to proper Explorium format
      const transformedFilters = this.transformProspectFilters(filters, businessIds)

      const payload = {
        filters: transformedFilters,
        mode, // Use the actual mode parameter instead of hardcoded 'preview'
        size: Math.min(totalSize, 1), // Total max records across all pages (API limit: 10,000)
        page_size: Math.min(pageSize, 1), // Records per page (API limit: 100)
        page
      }

      console.log('🔍 Fetching prospects with payload:', JSON.stringify(payload, null, 2))
      console.log(`🔧 Using ${mode} mode for prospect fetch`)

      const response = await this.makeRequest<ExploriuMProspectResponse>('/v1/prospects', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      console.log('✅ Prospects response:', { 
        total: response.total, 
        page: response.page, 
        page_size: response.page_size,
        records_returned: response.data?.length 
      })

      return response
    } catch (error) {
      console.error('❌ Error fetching prospects:', error)
      throw error
    }
  }

  /**
   * Enrich contact details for prospects (Step 3 of two-stage search)
   */
  async enrichContactDetails(prospectIds: string[]): Promise<ExploriuMContactDetailsResponse> {
    try {
      if (!prospectIds || prospectIds.length === 0) {
        return { data: [] }
      }

      const payload = {
        prospect_ids: prospectIds
      }

      console.log('Enriching contact details for prospect IDs:', prospectIds)

      const response = await this.makeRequest<ExploriuMContactDetailsResponse>('/v1/prospects/enrich/contact-details', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      return response
    } catch (error) {
      console.error('Error enriching contact details:', error)
      throw error
    }
  }

  /**
   * Perform complete two-stage prospect search
   */
  async searchProspects(filters: any, options: { page?: number, pageSize?: number, totalSize?: number, useCompanyFirst?: boolean } = {}) {
    try {
      const { page = 1, pageSize = 25, totalSize = 1000, useCompanyFirst = false } = options

      if (useCompanyFirst) {
        console.log('🔍 Performing two-stage search (companies → prospects)')
        
        try {
          // Stage 1: Get companies
          const businessesResponse = await this.fetchBusinesses(filters, { 
            page, 
            pageSize: Math.min(pageSize * 2, 50),
            totalSize: totalSize * 2, // Request more companies to get enough prospects
            mode: 'preview'
          })
          
          if (!businessesResponse.data || businessesResponse.data.length === 0) {
            console.log('⚠️ No companies found, trying direct prospect search')
            return this.directProspectSearch(filters, { page, pageSize, totalSize })
          }

          // Extract business IDs
          const businessIds = businessesResponse.data.map((company: any) => company.business_id).filter(Boolean)
          
          if (businessIds.length === 0) {
            console.log('⚠️ No business IDs found, trying direct prospect search')
            return this.directProspectSearch(filters, { page, pageSize, totalSize })
          }

          console.log(`📊 Found ${businessIds.length} companies, searching for prospects...`)

          // Stage 2: Get prospects from those companies
          const prospectsResponse = await this.fetchProspects(filters, { page, pageSize, totalSize, businessIds })
          
          // Stage 3: Enrich contact details
          let enrichedProspects = prospectsResponse.data || []
          
          if (enrichedProspects.length > 0) {
            const prospectIds = enrichedProspects.map((prospect: any) => prospect.prospect_id).filter(Boolean)
            
            if (prospectIds.length > 0) {
              // Try contact enrichment to get additional details like emails and phone numbers
              console.log('🔄 Attempting contact enrichment...')
              
              try {
                const contactDetailsResponse = await this.enrichContactDetails(prospectIds)
                
                if (contactDetailsResponse.data && contactDetailsResponse.data.length > 0) {
                  console.log('✅ Contact enrichment successful:', {
                    enriched_count: contactDetailsResponse.data.length,
                    sample_enriched: contactDetailsResponse.data[0]
                  })
                  
                  const contactMap = new Map()
                  contactDetailsResponse.data.forEach((contact: any) => {
                    contactMap.set(contact.prospect_id, contact)
                  })
                  
                  enrichedProspects = enrichedProspects.map((prospect: any) => {
                    const contactDetails = contactMap.get(prospect.prospect_id)
                    return {
                      ...prospect,
                      ...contactDetails,
                      email: contactDetails?.email || prospect.email,
                      phone: contactDetails?.phone || prospect.phone,
                      contact_details: contactDetails
                    }
                  })
                } else {
                  console.log('⚠️ Contact enrichment returned no data')
                }
              } catch (error) {
                console.log('⚠️ Contact enrichment failed:', (error as Error).message)
                console.log('ℹ️ Using prospect data as-is without additional enrichment')
              }
            }
          }

          return {
            prospects: enrichedProspects,
            companies: businessesResponse.data,
            totalProspects: prospectsResponse.total || enrichedProspects.length,
            totalCompanies: businessesResponse.total || businessesResponse.data.length,
            pagination: {
              page,
              pageSize,
              hasMore: (prospectsResponse.total || 0) > page * pageSize
            }
          }
          
        } catch (businessError) {
          console.warn('Two-stage search failed, falling back to direct prospect search:', businessError)
          return this.directProspectSearch(filters, { page, pageSize, totalSize })
        }
      } else {
        console.log('Performing direct prospect search')
        return this.directProspectSearch(filters, { page, pageSize, totalSize })
      }
    } catch (error) {
      console.error('Error in searchProspects:', error)
      throw error
    }
  }

  /**
   * Direct prospect search fallback method
   */
  private async directProspectSearch(filters: any, options: { page?: number, pageSize?: number, totalSize?: number }) {
    const { page = 1, pageSize = 25, totalSize = 1000 } = options
    
    console.log('🔍 Performing direct prospect search')
    
    // Use 'full' mode to get complete prospect data instead of partial
    const prospectsResponse = await this.fetchProspects(filters, { page, pageSize, totalSize, mode: 'full' })
    
    console.log('📊 Raw prospects response:', {
      total: prospectsResponse.total,
      page: prospectsResponse.page,
      page_size: prospectsResponse.page_size,
      records_returned: prospectsResponse.data?.length || 0
    })
    
    // Log a sample of the prospect data to see the structure
    if (prospectsResponse.data && prospectsResponse.data.length > 0) {
      console.log('📋 Sample prospect data (first record):', JSON.stringify(prospectsResponse.data[0], null, 2))
      console.log('📋 All prospect IDs and names:', prospectsResponse.data.map(p => ({
        id: p.prospect_id,
        name: p.full_name || p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'NO NAME',
        title: p.title || p.job_title || 'NO TITLE',
        company: p.company_name || p.organization?.name || 'NO COMPANY'
      })))
    }
    
    // Enrich contact details
    let enrichedProspects = prospectsResponse.data || []
    
    if (enrichedProspects.length > 0) {
      const prospectIds = enrichedProspects.map((prospect: any) => prospect.prospect_id).filter(Boolean)
      
      console.log('Enriching contact details for prospect IDs:', prospectIds)
      
      if (prospectIds.length > 0) {
        // TEMPORARILY DISABLED: Contact enrichment endpoint is returning 404
        // TODO: Check with Explorium API documentation for correct endpoint
        console.log('⚠️ Contact enrichment temporarily disabled due to 404 errors')
        console.log('ℹ️ Using prospect data as-is without additional enrichment')
        
        /* COMMENTED OUT UNTIL ENDPOINT IS FIXED
        try {
          const contactDetailsResponse = await this.enrichContactDetails(prospectIds)
          
          if (contactDetailsResponse.data) {
            console.log('✅ Contact enrichment successful:', {
              enriched_count: contactDetailsResponse.data.length,
              sample_enriched: contactDetailsResponse.data[0]
            })
            
            const contactMap = new Map()
            contactDetailsResponse.data.forEach((contact: any) => {
              contactMap.set(contact.prospect_id, contact)
            })
            
            enrichedProspects = enrichedProspects.map((prospect: any) => {
              const contactDetails = contactMap.get(prospect.prospect_id)
              return {
                ...prospect,
                ...contactDetails,
                email: contactDetails?.email || prospect.email,
                phone: contactDetails?.phone || prospect.phone,
                contact_details: contactDetails
              }
            })
            
            console.log('📋 Sample enriched prospect:', JSON.stringify(enrichedProspects[0], null, 2))
          }
        } catch (enrichError) {
          console.error('Failed to enrich contact details in direct search:', enrichError)
          console.log('⚠️ Continuing with original prospect data without enrichment')
        }
        */
      }
    }
    
    const finalResults = {
      prospects: enrichedProspects,
      companies: [],
      totalProspects: prospectsResponse.total || enrichedProspects.length,
      totalCompanies: 0,
      pagination: {
        page,
        pageSize,
        total: prospectsResponse.total || enrichedProspects.length
      }
    }
    
    console.log('✅ Final search results summary:', {
      prospects_count: finalResults.prospects.length,
      total_prospects: finalResults.totalProspects,
      companies_count: finalResults.companies.length,
      total_companies: finalResults.totalCompanies,
      sample_final_prospect: finalResults.prospects[0] ? {
        id: finalResults.prospects[0].prospect_id,
        name: finalResults.prospects[0].full_name || finalResults.prospects[0].name || `${finalResults.prospects[0].first_name || ''} ${finalResults.prospects[0].last_name || ''}`.trim(),
        title: finalResults.prospects[0].title || finalResults.prospects[0].job_title,
        company: finalResults.prospects[0].company_name,
        email: finalResults.prospects[0].email
      } : 'NO PROSPECTS'
    })

    return finalResults
  }

  /**
   * Comprehensive ICP validation using all autocomplete endpoints
   */
  async validateICP(parsedICP: any) {
    const validationResults = {
      industries: {} as { [key: string]: string[] },
      jobTitles: {} as { [key: string]: { titles: string[], levels: string[], departments: string[] } },
      locations: {} as { [key: string]: string[] },
      technologies: {} as { [key: string]: string[] },
      isValid: true,
      errors: [] as string[]
    }

    try {
      // Validate industries
      if (parsedICP.industries && parsedICP.industries.length > 0) {
        validationResults.industries = await this.validateIndustries(parsedICP.industries)
      }

      // Validate job titles
      if (parsedICP.jobTitles && parsedICP.jobTitles.length > 0) {
        validationResults.jobTitles = await this.validateJobTitles(parsedICP.jobTitles)
      }

      // Validate locations
      if (parsedICP.locations && parsedICP.locations.length > 0) {
        validationResults.locations = await this.validateLocations(parsedICP.locations)
      }

      // Validate technologies
      if (parsedICP.technologies && parsedICP.technologies.length > 0) {
        validationResults.technologies = await this.validateTechnologies(parsedICP.technologies)
      }

    } catch (error) {
      console.error('Error during ICP validation:', error)
      validationResults.isValid = false
      validationResults.errors.push(error instanceof Error ? error.message : 'Unknown validation error')
    }

    return validationResults
  }

  /**
   * Transform filters for business search to proper Explorium format
   */
  private transformBusinessFilters(filters: any): any {
    const transformed: any = {}

    // Country filter
    if (filters.country_code && Array.isArray(filters.country_code)) {
      transformed.country_code = {
        values: filters.country_code.map((code: string) => code.toLowerCase())
      }
    }

    // Company size filter  
    if (filters.company_size && Array.isArray(filters.company_size)) {
      transformed.company_size = {
        values: filters.company_size
      }
    }

    // LinkedIn category filter (for businesses)
    if (filters.linkedin_category && Array.isArray(filters.linkedin_category)) {
      transformed.linkedin_category = {
        values: filters.linkedin_category
      }
    }

    // Technology stack filter
    if (filters.company_tech_stack_tech && Array.isArray(filters.company_tech_stack_tech)) {
      transformed.company_tech_stack_tech = {
        values: filters.company_tech_stack_tech
      }
    }

    return transformed
  }

  /**
   * Transform filters for prospect search to proper Explorium format
   */
  private transformProspectFilters(filters: any, businessIds?: string[]): any {
    const transformed: any = {}

    // If business IDs are provided, add them to filters for company-first search
    if (businessIds && businessIds.length > 0) {
      transformed.business_id = {
        values: businessIds
      }
    }

    // Prospect location filters
    if (filters.country_code && Array.isArray(filters.country_code)) {
      transformed.country_code = {
        values: filters.country_code.map((code: string) => code.toLowerCase())
      }
    }

    if (filters.region_country_code && Array.isArray(filters.region_country_code)) {
      transformed.region_country_code = {
        values: filters.region_country_code
      }
    }

    if (filters.city_region_country && Array.isArray(filters.city_region_country)) {
      transformed.city_region_country = {
        values: filters.city_region_country
      }
    }

    // Job title filter
    if (filters.job_title && Array.isArray(filters.job_title)) {
      transformed.job_title = {
        values: filters.job_title
      }
    }

    // Job level/seniority filter
    if (filters.job_level && Array.isArray(filters.job_level)) {
      transformed.job_level = {
        values: filters.job_level.map((level: string) => level.toLowerCase())
      }
    }

    // Job department filter
    if (filters.job_department && Array.isArray(filters.job_department)) {
      transformed.job_department = {
        values: filters.job_department
      }
    }

    // Experience range filters
    if (filters.total_experience_months) {
      transformed.total_experience_months = filters.total_experience_months
    }

    if (filters.current_role_months) {
      transformed.current_role_months = filters.current_role_months
    }

    // Company-related filters for prospects
    if (filters.company_country_code && Array.isArray(filters.company_country_code)) {
      transformed.company_country_code = {
        values: filters.company_country_code.map((code: string) => code.toLowerCase())
      }
    }

    if (filters.company_region_country_code && Array.isArray(filters.company_region_country_code)) {
      transformed.company_region_country_code = {
        values: filters.company_region_country_code
      }
    }

    if (filters.company_city_region_country && Array.isArray(filters.company_city_region_country)) {
      transformed.company_city_region_country = {
        values: filters.company_city_region_country
      }
    }

    if (filters.company_size && Array.isArray(filters.company_size)) {
      transformed.company_size = {
        values: filters.company_size
      }
    }

    if (filters.linkedin_category && Array.isArray(filters.linkedin_category)) {
      transformed.linkedin_category = {
        values: filters.linkedin_category
      }
    }

    // Contact availability filters
    if (typeof filters.has_email === 'boolean') {
      transformed.has_email = {
        value: filters.has_email  // Use 'value' not 'values'
      }
    } else {
      // Default to requiring email for prospects
      transformed.has_email = {
        value: true  // Use 'value' not 'values'
      }
    }

    if (typeof filters.has_phone === 'boolean') {
      transformed.has_phone = {
        value: filters.has_phone  // Use 'value' not 'values'
      }
    }

    return transformed
  }
}

// Export singleton instance
export const exploriuMService = new ExploriuMService() 