/* TODO: Explorium-specific feature - commented out for now
   This entire file is commented out to prevent build errors while focusing on Apollo integration
   Uncomment and update when ready to implement Explorium support

// Explorium Data Provider Service
// Implements Explorium API integration with unified interface

import { DataProvider, UnifiedSearchFilters, UnifiedSearchResponse, ProviderConfig } from './provider-manager'
import { ExploriuMService } from '../explorium-service'
import { type ExplorimFilters } from '@/types/explorium'

export class ExplorimProviderService implements DataProvider {
  private config: ProviderConfig
  private exploriuMService: ExploriuMService

  constructor(config: ProviderConfig) {
    this.config = config
    this.exploriuMService = new ExploriuMService()
    
    console.log('🚀 Explorium provider initialized with config:', {
      type: config.type,
      baseUrl: config.baseUrl,
      hasApiKey: !!config.apiKey
    })
  }

  async searchProspects(filters: UnifiedSearchFilters): Promise<UnifiedSearchResponse> {
    console.log('🔍 Explorium searchProspects called with filters:', filters)
    
    try {
      // Transform unified filters to Explorium format
      const explorimFilters = this.transformFilters(filters)
      console.log('🔧 Transformed filters for Explorium:', explorimFilters)
      
      // Call Explorium API
      const searchResults = await this.exploriuMService.searchProspects(explorimFilters)
      console.log('📊 Explorium search results:', searchResults)
      
      // Transform results back to unified format
      const normalizedResponse = this.normalizeResponse(searchResults, filters)
      console.log('✅ Normalized response:', normalizedResponse)
      
      return normalizedResponse
      
    } catch (error) {
      console.error('❌ Explorium search failed:', error)
      throw new Error(`Explorium search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async validateFilters(filters: UnifiedSearchFilters): Promise<any> {
    console.log('✅ Explorium validateFilters called with:', filters)
    
    try {
      // Transform to Explorium format for validation
      const explorimFilters = this.transformFilters(filters)
      
      // Validate using Explorium service
      const validationResult = await this.exploriuMService.validateFilters(explorimFilters)
      console.log('📋 Explorium validation result:', validationResult)
      
      return validationResult
      
    } catch (error) {
      console.error('❌ Explorium validation failed:', error)
      throw new Error(`Explorium validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getProviderInfo(): ProviderConfig {
    return this.config
  }

  transformFilters(filters: UnifiedSearchFilters): ExplorimFilters {
    console.log('🔄 Transforming unified filters to Explorium format:', filters)
    
    const exploriuMFilters: ExplorimFilters = {}

    // Job-level filters - these are for prospect search
    if (filters.jobTitles && filters.jobTitles.length > 0) {
      exploriuMFilters.job_title = filters.jobTitles
    }

    if (filters.seniorities && filters.seniorities.length > 0) {
      exploriuMFilters.seniority = filters.seniorities.map((seniority: string) => {
        // Map unified seniority values to Explorium format
        switch (seniority) {
          case 'owner':
          case 'founder':
          case 'c_suite':
            return 'cxo'
          case 'vp':
            return 'vp'
          case 'director':
            return 'director'
          case 'manager':
            return 'manager'
          case 'senior':
            return 'senior'
          case 'entry':
            return 'entry'
          default:
            return seniority
        }
      })
    }

    if (filters.locations && filters.locations.length > 0) {
      exploriuMFilters.location = filters.locations
    }

    if (filters.hasEmail !== undefined && filters.hasEmail !== null) {
      exploriuMFilters.has_email = filters.hasEmail
    }

    if (filters.hasPhone !== undefined && filters.hasPhone !== null) {
      exploriuMFilters.has_phone = filters.hasPhone
    }

    if (filters.totalYearsExperience && filters.totalYearsExperience.length > 0) {
      const expMonths = filters.totalYearsExperience.map((range: string) => {
        switch (range) {
          case '0-1 years':
          case '0-1': return { gte: 0, lte: 12 }
          case '1-3 years':
          case '1-3': return { gte: 12, lte: 36 }
          case '3-5 years':
          case '3-5': return { gte: 36, lte: 60 }
          case '5-10 years':
          case '5-10': return { gte: 60, lte: 120 }
          case '10+ years':
          case '10+': return { gte: 120 }
          default: return null
        }
      }).filter((range): range is NonNullable<typeof range> => range !== null)
      
      if (expMonths.length > 0) {
        exploriuMFilters.total_experience_months = expMonths[0]
      }
    }

    // Experience filters - convert to months
    if (filters.timeInCurrentRole && filters.timeInCurrentRole.length > 0) {
      const roleMonths = filters.timeInCurrentRole.map((range: string) => {
        switch (range) {
          case '0-6 months':
          case '0-6': return { gte: 0, lte: 6 }
          case '6-12 months':
          case '6-12': return { gte: 6, lte: 12 }
          case '1-2 years':
          case '1-2': return { gte: 12, lte: 24 }
          case '2-5 years':
          case '2-5': return { gte: 24, lte: 60 }
          case '5+ years':
          case '5+': return { gte: 60 }
          default: return null
        }
      }).filter((range): range is NonNullable<typeof range> => range !== null)
      
      if (roleMonths.length > 0) {
        exploriuMFilters.current_role_months = roleMonths[0]
      }
    }

    // Company filters
    if (filters.companyHeadcount && filters.companyHeadcount.length > 0) {
      exploriuMFilters.company_headcount = filters.companyHeadcount.map((range: string) => {
        switch (range) {
          case '1-10': return { gte: 1, lte: 10 }
          case '11-50': return { gte: 11, lte: 50 }
          case '51-200': return { gte: 51, lte: 200 }
          case '201-500': return { gte: 201, lte: 500 }
          case '501-1000': return { gte: 501, lte: 1000 }
          case '1001-5000': return { gte: 1001, lte: 5000 }
          case '5001-10000': return { gte: 5001, lte: 10000 }
          case '10001+': return { gte: 10001 }
          default: return null
        }
      }).filter(Boolean)[0]
    }

    if (filters.companyRevenue && filters.companyRevenue.length > 0) {
      exploriuMFilters.company_revenue = filters.companyRevenue.map((range: string) => {
        switch (range) {
          case '0-1M': return { gte: 0, lte: 1000000 }
          case '1M-10M': return { gte: 1000000, lte: 10000000 }
          case '10M-50M': return { gte: 10000000, lte: 50000000 }
          case '50M-100M': return { gte: 50000000, lte: 100000000 }
          case '100M-500M': return { gte: 100000000, lte: 500000000 }
          case '500M-1B': return { gte: 500000000, lte: 1000000000 }
          case '1B+': return { gte: 1000000000 }
          default: return null
        }
      }).filter(Boolean)[0]
    }

    // Use revenueMin and revenueMax if provided
    if (filters.revenueMin !== undefined && filters.revenueMin !== null) {
      exploriuMFilters.company_revenue = {
        ...(exploriuMFilters.company_revenue || {}),
        gte: filters.revenueMin
      }
    }

    if (filters.revenueMax !== undefined && filters.revenueMax !== null) {
      exploriuMFilters.company_revenue = {
        ...(exploriuMFilters.company_revenue || {}),
        lte: filters.revenueMax
      }
    }

    if (filters.technologies && filters.technologies.length > 0) {
      exploriuMFilters.technologies = filters.technologies
    }

    if (filters.keywords && filters.keywords.length > 0) {
      exploriuMFilters.keywords = filters.keywords
    }

    if (filters.industries && filters.industries.length > 0) {
      exploriuMFilters.industries = filters.industries
    }

    // Pagination
    if (filters.page) {
      exploriuMFilters.page = filters.page
    }

    if (filters.pageSize) {
      exploriuMFilters.page_size = filters.pageSize
    }

    console.log('✅ Transformed filters:', exploriuMFilters)
    return exploriuMFilters
  }

  private normalizeResponse(searchResults: any, filters: UnifiedSearchFilters): UnifiedSearchResponse {
    console.log('🔄 Normalizing Explorium response to unified format')
    
    const prospects = searchResults.prospects || []
    const totalProspects = searchResults.total || prospects.length
    
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20

    return {
      prospects: prospects.map((prospect: any) => ({
        id: prospect.id,
        name: `${prospect.first_name} ${prospect.last_name}`,
        firstName: prospect.first_name,
        lastName: prospect.last_name,
        email: prospect.email,
        phone: prospect.phone,
        title: prospect.title,
        company: prospect.company,
        location: prospect.location,
        linkedinUrl: prospect.linkedin_url,
        // Add other normalized fields as needed
      })),
      totalProspects,
      pagination: {
        page,
        pageSize,
        hasMore: searchResults.pagination?.hasMore || (totalProspects > page * pageSize),
        totalPages: Math.ceil(totalProspects / pageSize)
      },
      provider: 'explorium',
      searchId: `explorium_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }
}

*/

// Placeholder to prevent import errors
export class ExplorimProviderService {
  constructor() {
    throw new Error('Explorium provider is currently disabled. Please use Apollo provider instead.')
  }
} 