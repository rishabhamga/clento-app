import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apolloProvider } from '@/lib/data-integrations/apollo-provider'
import { getApolloThrottleManager } from '@/lib/utils/apollo-throttle'
import ApolloValidator from '@/lib/utils/apollo-validator'
import { type ApolloFilterInput, type LeadSearchResult } from '@/types/apollo'

interface FilterState {
  locations: string[]
  excludeLocations: string[]
  jobTitles: string[]
  excludeJobTitles: string[]
  seniorityLevels: string[]
  jobFunctions: string[]
  industries: string[]
  employeeCountMin: number
  employeeCountMax: number
  revenueMin: number
  revenueMax: number
  keywords: string
  companyKeywords: string
  technologies: string[]
  fundingStatus: string[]
  hiringActivity: boolean
  organizationNumJobsMax: number
  organizationNumJobsMin: number
  recentNews: boolean
}

interface SearchRequest {
  filters: FilterState
  source: 'b2b-data' | 'ecommerce' | 'csv-import' | 'local-data'
  page?: number
  limit?: number
}

interface Lead {
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
  source: string
}

// Mock data for development - in production, this would call ZoomInfo/Apollo APIs
const generateMockLeads = (filters: FilterState, count: number = 50): Lead[] => {
  const mockLeads: Lead[] = []

  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Chris', 'Amanda', 'Robert', 'Lisa']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  const companies = ['TechCorp', 'InnovateLabs', 'DataSys', 'CloudFirst', 'ScaleUp Inc', 'NextGen Solutions', 'AI Dynamics', 'Digital Edge']
  const domains = ['techcorp.com', 'innovatelabs.com', 'datasys.io', 'cloudfirst.com', 'scaleup.co', 'nextgen.solutions', 'aidynamics.ai', 'digitaledge.com']

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const company = companies[Math.floor(Math.random() * companies.length)]
    const domain = domains[Math.floor(Math.random() * domains.length)]

    // Apply basic filtering logic
    const title = filters.jobTitles.length > 0
      ? filters.jobTitles[Math.floor(Math.random() * filters.jobTitles.length)]
      : 'Senior Manager'

    const industry = filters.industries.length > 0
      ? filters.industries[Math.floor(Math.random() * filters.industries.length)]
      : 'Technology'

    const employeeCount = Math.floor(Math.random() * (filters.employeeCountMax - filters.employeeCountMin)) + filters.employeeCountMin

    mockLeads.push({
      id: `lead_${i + 1}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      title,
      company,
      industry,
      location: filters.locations.length > 0 ? filters.locations[0] : 'San Francisco, CA',
      employeeCount,
      revenue: Math.floor(Math.random() * (filters.revenueMax - filters.revenueMin)) + filters.revenueMin,
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      technologies: filters.technologies.length > 0 ? filters.technologies.slice(0, 2) : ['Salesforce', 'HubSpot'],
      verified: Math.random() > 0.2, // 80% verified
      source: 'zoominfo'
    })
  }

  return mockLeads
}

async function searchZoomInfo(filters: FilterState): Promise<{ results: Lead[], total: number }> {
  // In production, this would make actual API calls to ZoomInfo
  // For now, return mock data that respects the filters

  const mockResults = generateMockLeads(filters, 50)
  const total = Math.floor(Math.random() * 5000) + 100 // Mock total count

  return {
    results: mockResults,
    total
  }
}

// Transform legacy FilterState to Apollo format
function transformToApolloFilters(filters: FilterState, page: number = 1, limit: number = 50): ApolloFilterInput {
  return {
    jobTitles: filters.jobTitles || [],
    excludeJobTitles: filters.excludeJobTitles || [],
    seniorities: filters.seniorityLevels as any || [],
    personLocations: filters.locations || [], // Person's location (where they live)
    excludePersonLocations: filters.excludeLocations || [],
    organizationLocations: [], // Company headquarters locations (separate from person location)
    excludeOrganizationLocations: [],
    hasEmail: null,
    industries: filters.industries || [],
    companyHeadcount: [],
    companyDomains: [],
    intentTopics: [],
    technologies: filters.technologies || [],
    technologyUids: [], // Apollo technology UIDs
    excludeTechnologyUids: [], // Apollo technology UIDs for exclusion
    keywords: [filters.keywords, filters.companyKeywords].filter(Boolean),
    organizationJobTitles: [], // Organization job titles
    organizationJobLocations: [], // Organization job locations
    organizationNumJobsMin: null,
    organizationNumJobsMax: null,
    organizationJobPostedAtMin: null,
    organizationJobPostedAtMax: null,
    revenueMin: filters.revenueMin || null,
    revenueMax: filters.revenueMax || null,
    fundingStages: [],
    fundingAmountMin: null,
    fundingAmountMax: null,
    foundedYearMin: null,
    foundedYearMax: null,
    jobPostings: null,
    newsEvents: null,
    webTraffic: null,
    page,
    perPage: limit
  }
}

// Convert Apollo NormalizedPerson to legacy Lead format for backward compatibility
function transformApolloToLead(apolloLead: any): Lead {
  return {
    id: apolloLead.id,
    firstName: apolloLead.first_name || '',
    lastName: apolloLead.last_name || '',
    fullName: apolloLead.full_name,
    email: apolloLead.email || '',
    title: apolloLead.title || '',
    company: apolloLead.company || '',
    industry: apolloLead.industry || '',
    location: apolloLead.location || '',
    employeeCount: apolloLead.company_size || 0,
    revenue: Math.round((apolloLead.company_revenue || 0) / 1000000), // Convert to millions
    linkedinUrl: apolloLead.linkedin_url,
    phone: apolloLead.phone,
    technologies: apolloLead.technologies || [],
    verified: apolloLead.email_status === 'verified',
    source: 'apollo'
  }
}

async function searchApollo(filters: FilterState, page: number = 1, limit: number = 50, userId: string): Promise<{ results: Lead[], total: number }> {
  try {
    // Transform legacy filters to Apollo format
    const apolloFilters = transformToApolloFilters(filters, page, limit)

    // Convert to Apollo API format
    const apolloSearchFilters = {
      person_titles: apolloFilters.jobTitles,
      person_seniorities: apolloFilters.seniorities,
      person_locations: apolloFilters.personLocations,
      organization_locations: apolloFilters.organizationLocations,
      has_email: true, // Default to requiring email for campaigns
      company_industries: apolloFilters.industries,
      page: apolloFilters.page,
      per_page: apolloFilters.perPage
    }

    // Validate filters
    const validation = ApolloValidator.validateSearchFilters(apolloSearchFilters)
    if (!validation.isValid) {
      console.warn('Apollo validation failed:', validation.errors)
      throw new Error(`Invalid search filters: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // Execute search with throttling
    const throttleManager = getApolloThrottleManager()
    const searchResult = await throttleManager.executeRequest(
      () => apolloProvider.searchPeople(validation.cleanedFilters!),
      {
        userId,
        requestType: 'search',
        priority: 'medium'
      }
    )

    // Transform results to legacy format
    const results = searchResult.people.map(transformApolloToLead)

    console.log(`Apollo search completed: ${results.length} results from ${searchResult.pagination.total_entries} total`)

    return {
      results,
      total: searchResult.pagination.total_entries
    }

  } catch (error) {
    console.error('Apollo search error:', error)
    throw new Error(`Apollo search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function searchEcommerce(filters: FilterState): Promise<{ results: Lead[], total: number }> {
  // Mock e-commerce specific data
  const ecommerceCompanies = ['ShopNow', 'EasyStore', 'QuickCart', 'MegaMart Online', 'FlashSale']
  const mockResults = generateMockLeads(filters, 25).map(lead => ({
    ...lead,
    company: ecommerceCompanies[Math.floor(Math.random() * ecommerceCompanies.length)],
    industry: 'E-commerce',
    technologies: ['Shopify', 'WooCommerce', 'Stripe', 'Google Analytics']
  }))

  return {
    results: mockResults,
    total: Math.floor(Math.random() * 2000) + 100
  }
}

async function searchLocalBusiness(filters: FilterState): Promise<{ results: Lead[], total: number }> {
  // Mock local business data
  const localBusinesses = ['Main Street Cafe', 'Downtown Dental', 'City Fitness Center', 'Local Law Firm']
  const mockResults = generateMockLeads(filters, 20).map(lead => ({
    ...lead,
    company: localBusinesses[Math.floor(Math.random() * localBusinesses.length)],
    industry: 'Local Business',
    employeeCount: Math.floor(Math.random() * 50) + 1, // Smaller local businesses
    technologies: ['Google My Business', 'Square', 'QuickBooks']
  }))

  return {
    results: mockResults,
    total: Math.floor(Math.random() * 1000) + 50
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SearchRequest = await request.json()
    const { filters, source, page = 1, limit = 50 } = body

    let searchResults: { results: Lead[], total: number }

    // Route to appropriate data source
    switch (source) {
      case 'b2b-data':
        try {
          // Primary search using Apollo
          searchResults = await searchApollo(filters, page, limit, userId)
        } catch (error) {
          console.error('Apollo search failed:', error)
          // In the future, could fallback to other providers
          throw error
        }
        break

      case 'ecommerce':
        searchResults = await searchEcommerce(filters)
        break

      case 'local-data':
        searchResults = await searchLocalBusiness(filters)
        break

      default:
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedResults = searchResults.results.slice(startIndex, endIndex)

    // Log search for analytics (in production, save to database)
    console.log(`User ${userId} searched ${source} with ${Object.keys(filters).length} filters, found ${searchResults.total} results`)

    return NextResponse.json({
      results: paginatedResults,
      total: searchResults.total,
      page,
      limit,
      totalPages: Math.ceil(searchResults.total / limit),
      source
    })

  } catch (error) {
    console.error('Search leads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}