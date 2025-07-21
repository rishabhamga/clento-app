// Data Provider Manager
// Abstracts data provider selection and management between Apollo and Explorium

import { ApolloProviderService } from './apollo-provider'
// TODO: Explorium-specific feature - commented out for now
// import { ExplorimProviderService } from './explorium-provider'

export type DataProviderType = 'apollo' // | 'explorium' // TODO: Explorium-specific feature - commented out for now

export interface ProviderConfig {
  type: DataProviderType
  apiKey: string
  baseUrl?: string
  rateLimit?: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  features?: {
    emailVerification: boolean
    phoneNumbers: boolean
    socialProfiles: boolean
    technographics: boolean
    intentData: boolean
  }
}

export interface UnifiedSearchFilters {
  // Person-level filters
  jobTitles?: string[]
  seniorities?: string[]
  locations?: string[]
  timeInCurrentRole?: string[]
  totalYearsExperience?: string[]
  hasEmail?: boolean
  hasPhone?: boolean
  
  // Company-level filters
  industries?: string[]
  companyHeadcount?: string[]
  companyRevenue?: string[]
  revenueMin?: number | null
  revenueMax?: number | null
  technologies?: string[]
  technologyUids?: string[] // Apollo technology UIDs
  excludeTechnologyUids?: string[] // Apollo technology UIDs to exclude
  keywords?: string[]
  
  // Organization-specific filters
  organizationLocations?: string[] // Company headquarters locations
  organizationJobTitles?: string[] // Job titles in active job postings
  organizationJobLocations?: string[] // Locations of active job postings
  organizationNumJobsMin?: number // Minimum number of active job postings
  organizationNumJobsMax?: number // Maximum number of active job postings
  organizationJobPostedAtMin?: string | null // Minimum job posting date
  organizationJobPostedAtMax?: string | null // Maximum job posting date
  
  // Organization activity filters
  jobPostings?: boolean | null // Filter by active job postings
  newsEvents?: boolean | null // Filter by recent news events
  webTraffic?: boolean | null // Filter by web traffic data
  
  // Search metadata
  searchType?: 'people' | 'company'
  page?: number
  pageSize?: number
  totalSize?: number
}

export interface UnifiedSearchResponse {
  prospects: any[]
  companies?: any[]
  totalProspects: number
  totalCompanies?: number
  pagination: {
    page: number
    pageSize: number
    hasMore: boolean
    totalPages: number
  }
  provider: DataProviderType
  searchId: string
}

export interface DataProvider {
  searchProspects(filters: UnifiedSearchFilters): Promise<UnifiedSearchResponse>
  validateFilters(filters: UnifiedSearchFilters): Promise<any>
  getProviderInfo(): ProviderConfig
  transformFilters(filters: UnifiedSearchFilters): any
}

export class DataProviderManager {
  private provider: DataProvider
  private config: ProviderConfig

  constructor() {
    // Determine provider from environment variable
    const providerType = this.getProviderFromEnv()
    this.config = this.getProviderConfig(providerType)
    this.provider = this.createProvider(providerType)
  }

  private getProviderFromEnv(): DataProviderType {
    const envProvider = process.env.DATA_PROVIDER?.toLowerCase()
    
    // Log the detected provider for debugging
    console.log('🔧 DATA_PROVIDER environment variable:', process.env.DATA_PROVIDER)
    
    if (envProvider === 'apollo') {
      console.log('✅ Using Apollo.io as data provider')
      return 'apollo'
    } 
    // TODO: Explorium-specific feature - commented out for now
    // else if (envProvider === 'explorium') {
    //   console.log('✅ Using Explorium as data provider')
    //   return 'explorium'
    // }
    
    // More detailed warning for invalid values
    if (envProvider) {
      console.warn(`⚠️  Invalid DATA_PROVIDER value: "${envProvider}". Valid options: 'apollo'. Defaulting to apollo.`)
    } else {
      console.warn('⚠️  DATA_PROVIDER not set, defaulting to apollo')
    }
    
    return 'apollo'
  }

  private getProviderConfig(type: DataProviderType): ProviderConfig {
    switch (type) {
      case 'apollo':
        const apolloConfig = {
          type: 'apollo' as DataProviderType,
          apiKey: process.env.APOLLO_API_KEY || '',
          baseUrl: 'https://api.apollo.io/v1',
          rateLimit: {
            requestsPerMinute: 60,
            requestsPerDay: 5000
          },
          features: {
            emailVerification: true,
            phoneNumbers: true,
            socialProfiles: true,
            technographics: true,
            intentData: false
          }
        }
        
        // Validate Apollo API key
        if (!apolloConfig.apiKey) {
          console.warn('⚠️  APOLLO_API_KEY not configured. Apollo provider will not function.')
        } else {
          console.log('✅ Apollo API key configured')
        }
        
        return apolloConfig
      
      // TODO: Explorium-specific feature - commented out for now
      // case 'explorium':
      //   const explorimConfig = {
      //     type: 'explorium' as DataProviderType,
      //     apiKey: process.env.EXPLORIUM_API_KEY || '',
      //     baseUrl: 'https://api.explorium.ai',
      //     rateLimit: {
      //       requestsPerMinute: 100,
      //       requestsPerDay: 10000
      //     },
      //     features: {
      //       emailVerification: true,
      //       phoneNumbers: true,
      //       socialProfiles: true,
      //       technographics: true,
      //       intentData: true
      //     }
      //   }
      //   
      //   // Validate Explorium API key
      //   if (!explorimConfig.apiKey) {
      //     console.warn('⚠️  EXPLORIUM_API_KEY not configured. Explorium provider will not function.')
      //   } else {
      //     console.log('✅ Explorium API key configured')
      //   }
      //   
      //   return explorimConfig
      
      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }
  }

  private createProvider(type: DataProviderType): DataProvider {
    try {
      switch (type) {
        case 'apollo':
          console.log('🔧 Using Apollo provider instance')
          return new ApolloProviderService(this.config)
        
        // TODO: Explorium-specific feature - commented out for now
        // case 'explorium':
        //   console.log('🔧 Creating Explorium provider instance')
        //   return new ExplorimProviderService(this.config)
        
        default:
          throw new Error(`Cannot create provider for type: ${type}`)
      }
    } catch (error) {
      console.error('❌ Failed to create provider:', error)
      throw new Error(`Failed to initialize ${type} provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Public API methods
  async searchProspects(filters: UnifiedSearchFilters): Promise<UnifiedSearchResponse> {
    if (!this.config.apiKey) {
      const errorMessage = `API key not configured for ${this.config.type} provider. Please set ${this.config.type.toUpperCase()}_API_KEY environment variable.`
      console.error('❌', errorMessage)
      throw new Error(errorMessage)
    }
    
    try {
      console.log(`🔍 Searching prospects using ${this.config.type} provider`)
      return await this.provider.searchProspects(filters)
    } catch (error) {
      console.error(`❌ ${this.config.type} search failed:`, error)
      throw error
    }
  }

  async validateFilters(filters: UnifiedSearchFilters): Promise<any> {
    try {
      return await this.provider.validateFilters(filters)
    } catch (error) {
      console.error(`❌ ${this.config.type} filter validation failed:`, error)
      throw error
    }
  }

  getProviderInfo(): ProviderConfig {
    return this.config
  }

  getCurrentProvider(): DataProviderType {
    return this.config.type
  }

  // TODO: Explorium-specific feature - commented out for now
  // getProviderSpecificFilters(): any {
  //   return this.provider.getProviderSpecificFilters?.() || {}
  // }

  // Helper method to get provider-specific filter options
  getFilterOptions(): any {
    switch (this.config.type) {
      case 'apollo':
        return {
          seniorities: ['owner', 'founder', 'c_suite', 'vp', 'director', 'manager', 'senior', 'entry'],
          timeInCurrentRole: ['0-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
          totalYearsExperience: ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
          companyHeadcount: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'],
          companyRevenue: ['0-1M', '1M-10M', '10M-50M', '50M-100M', '100M-500M', '500M-1B', '1B+']
        }
      
      // TODO: Explorium-specific feature - commented out for now
      // case 'explorium':
      //   return {
      //     seniorities: ['cxo', 'vp', 'director', 'manager', 'senior', 'entry'],
      //     timeInCurrentRole: ['0-6', '6-12', '1-2', '2-5', '5+'],
      //     totalYearsExperience: ['0-1', '1-3', '3-5', '5-10', '10+'],
      //     companyHeadcount: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'],
      //     companyRevenue: ['0-1M', '1M-10M', '10M-50M', '50M-100M', '100M-500M', '500M-1B', '1B+']
      //   }
      
      default:
        return {}
    }
  }
}

// Singleton instance
let dataProviderManager: DataProviderManager | null = null

export function getDataProviderManager(): DataProviderManager {
  if (!dataProviderManager) {
    dataProviderManager = new DataProviderManager()
  }
  return dataProviderManager
}

export function getCurrentProvider(): DataProviderType {
  return getDataProviderManager().getCurrentProvider()
}

export function getProviderConfig(): ProviderConfig {
  return getDataProviderManager().getProviderInfo()
} 