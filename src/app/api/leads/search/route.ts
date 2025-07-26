import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDataProviderManager, getCurrentProvider } from '@/lib/data-providers/provider-manager'
import { type UnifiedSearchFilters } from '@/lib/data-providers/provider-manager'

// Transform UI filter input to unified format
function transformFiltersToUnified(filters: any): UnifiedSearchFilters {
  const unifiedFilters: UnifiedSearchFilters = {
    searchType: filters.searchType || 'people',
    page: filters.page || 1,
    pageSize: filters.pageSize || 25,
    totalSize: filters.totalSize || 1000
  }

  // Location filters (support both personLocations from UI and generic locations)
  if (filters.personLocations?.length > 0) {
    unifiedFilters.locations = filters.personLocations
  } else if (filters.organizationLocations?.length > 0) {
    unifiedFilters.locations = filters.organizationLocations
  } else if (filters.locations?.length > 0) {
    unifiedFilters.locations = filters.locations
  }

  // Job-level filters
  if (filters.jobTitles?.length > 0) {
    unifiedFilters.jobTitles = filters.jobTitles
  }

  if (filters.seniorities?.length > 0) {
    unifiedFilters.seniorities = filters.seniorities
  }

  // Experience filters
  if (filters.timeInCurrentRole?.length > 0) {
    unifiedFilters.timeInCurrentRole = filters.timeInCurrentRole
  }

  if (filters.totalYearsExperience?.length > 0) {
    unifiedFilters.totalYearsExperience = filters.totalYearsExperience
  }

  // Contact filters
  if (typeof filters.hasEmail === 'boolean') {
    unifiedFilters.hasEmail = filters.hasEmail
  }

  if (typeof filters.hasPhone === 'boolean') {
    unifiedFilters.hasPhone = filters.hasPhone
  }

  // Company filters
  if (filters.companyHeadcount?.length > 0) {
    unifiedFilters.companyHeadcount = filters.companyHeadcount
  }

  if (filters.companyRevenue?.length > 0) {
    unifiedFilters.companyRevenue = filters.companyRevenue
  }

  if (filters.industries?.length > 0) {
    unifiedFilters.industries = filters.industries
  }

  if (filters.technologyUids?.length > 0) {
    unifiedFilters.technologies = filters.technologyUids
  } else if (filters.technologies?.length > 0) {
    unifiedFilters.technologies = filters.technologies
  }

  if (filters.excludeTechnologyUids?.length > 0) {
    unifiedFilters.excludeTechnologyUids = filters.excludeTechnologyUids
  }

  if (filters.keywords?.length > 0) {
    unifiedFilters.keywords = filters.keywords
  }

  // Organization job filters
  if (filters.organizationJobTitles?.length > 0) {
    unifiedFilters.organizationJobTitles = filters.organizationJobTitles
  }

  if (filters.organizationJobLocations?.length > 0) {
    unifiedFilters.organizationJobLocations = filters.organizationJobLocations
  }

  if (typeof filters.organizationNumJobsMin === 'number' && !isNaN(filters.organizationNumJobsMin)) {
    unifiedFilters.organizationNumJobsMin = filters.organizationNumJobsMin
  }

  if (typeof filters.organizationNumJobsMax === 'number' && !isNaN(filters.organizationNumJobsMax)) {
    unifiedFilters.organizationNumJobsMax = filters.organizationNumJobsMax
  }

  if (filters.organizationJobPostedAtMin) {
    unifiedFilters.organizationJobPostedAtMin = filters.organizationJobPostedAtMin
  }

  if (filters.organizationJobPostedAtMax) {
    unifiedFilters.organizationJobPostedAtMax = filters.organizationJobPostedAtMax
  }

  // Organization activity filters
  if (typeof filters.jobPostings === 'boolean') {
    unifiedFilters.jobPostings = filters.jobPostings
  }

  if (typeof filters.newsEvents === 'boolean') {
    unifiedFilters.newsEvents = filters.newsEvents
  }

  if (typeof filters.webTraffic === 'boolean') {
    unifiedFilters.webTraffic = filters.webTraffic
  }

  if(filters.companyDomains) {
    unifiedFilters.companyDomains = filters.companyDomains
  }

  if(filters.revenueMin) {
    unifiedFilters.revenueMin = filters.revenueMin
  }
  if(filters.revenueMax) {
    unifiedFilters.revenueMax = filters.revenueMax
  }

  console.log('Original filters:', filters)
  console.log('Unified filters:', unifiedFilters)

  return unifiedFilters
}

// Transform results to expected UI format
function transformResultsToUI(results: any, provider: string) {
  // For Apollo API, we want to preserve the rich structure
  const transformApolloProspect = (prospect: any) => {
    return {
      // Basic Apollo fields
      id: prospect.id || prospect.external_id,
      name: prospect.name || `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim(),
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      full_name: prospect.name || `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim(),
      title: prospect.title,
      headline: prospect.headline,
      email: prospect.email,
      phone: prospect.phone,
      linkedin_url: prospect.linkedin_url,
      twitter_url: prospect.twitter_url,
      facebook_url: prospect.facebook_url,
      github_url: prospect.github_url,

      // Location fields
      city: prospect.city,
      state: prospect.state,
      country: prospect.country,

      // Job information
      seniority: prospect.seniority,
      seniority_level: prospect.seniority_level,
      departments: prospect.departments || [],
      subdepartments: prospect.subdepartments || [],
      functions: prospect.functions || [],

      // Company information from nested objects
      company: prospect.organization?.name || prospect.account?.name,
      company_id: prospect.organization_id || prospect.account_id,
      company_website: prospect.organization?.website_url || prospect.account?.website_url,
      company_linkedin: prospect.organization?.linkedin_url || prospect.account?.linkedin_url,

      // Image URLs
      photo_url: prospect.photo_url,
      company_logo_url: prospect.organization?.logo_url || prospect.account?.logo_url,

      // Apollo-specific fields
      email_status: prospect.email_status,
      employment_history: prospect.employment_history || [],
      organization: prospect.organization,
      organization_id: prospect.organization_id,
      account: prospect.account,
      account_id: prospect.account_id,
      extrapolated_email_confidence: prospect.extrapolated_email_confidence,
      email_domain_catchall: prospect.email_domain_catchall,
      revealed_for_current_team: prospect.revealed_for_current_team,
      intent_strength: prospect.intent_strength,
      show_intent: prospect.show_intent,

      // Additional fields that might be present
      skills: prospect.skills || [],
      technologies: prospect.technologies || [],
      confidence: prospect.confidence || 0,

      // Data source
      data_source: provider,
      _raw: prospect
    }
  }

  // Handle different result formats based on provider
  let transformedProspects = []

  if (provider === 'apollo' && results.prospects) {
    // Apollo returns people in prospects array
    transformedProspects = results.prospects.map(transformApolloProspect)
  } else if (results.people) {
    // Direct people array
    transformedProspects = results.people.map(transformApolloProspect)
  } else {
    // Fallback for other formats
    transformedProspects = (results.prospects || []).map(transformApolloProspect)
  }

  return {
    people: transformedProspects,
    pagination: {
      page: results.pagination?.page || 1,
      per_page: results.pagination?.pageSize || results.pagination?.per_page || 25,
      total_entries: results.totalProspects || results.total_entries || 0,
      total_pages: results.pagination?.totalPages || results.pagination?.total_pages || 1,
      has_more: results.pagination?.hasMore || false
    },
    search_id: results.searchId || results.search_id || '',
    breadcrumbs: results.breadcrumbs || [{
      label: `${results.totalProspects || results.total_entries || 0} prospects found`,
      signal_field_name: 'total_results',
      value: results.totalProspects || results.total_entries || 0,
      display_name: `${results.totalProspects || results.total_entries || 0} results`
    }]
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    const { filters, page = 1, pageSize = 25, totalSize = 1000 } = body

    if (!filters) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_FILTERS',
        message: 'Filters are required'
      }, { status: 400 })
    }

    // Map perPage from filters to pageSize if present, always prefer the latest value
    let effectivePageSize = 25
    if (typeof filters.perPage === 'number') {
      effectivePageSize = filters.perPage
    } else if (typeof filters.pageSize === 'number') {
      effectivePageSize = filters.pageSize
    }

    console.log('📋 Received search request:', { filters, page, pageSize, totalSize })

    // Get the current provider
    const currentProvider = getCurrentProvider()
    console.log('🔧 Using data provider:', currentProvider)

    // Transform filters to unified format
    const unifiedFilters = transformFiltersToUnified({
      ...filters,
      page,
      pageSize: effectivePageSize,
      totalSize
    })

    console.log('🔄 Unified filters:', unifiedFilters)

    // Get provider manager and perform search
    const dataProviderManager = getDataProviderManager()
    const searchResults = await dataProviderManager.searchProspects(unifiedFilters)

    console.log('✅ Search results:', {
      provider: searchResults.provider,
      prospects: searchResults.prospects?.length || 0,
      companies: searchResults.companies?.length || 0,
      totalProspects: searchResults.totalProspects,
      totalCompanies: searchResults.totalCompanies
    })

    // Transform results to expected UI format
    const transformedResults = transformResultsToUI(searchResults, currentProvider)

    return NextResponse.json({
      success: true,
      data: transformedResults,
      meta: {
        provider: currentProvider,
        total_results: searchResults.totalProspects,
        search_id: searchResults.searchId,
        filters_used: unifiedFilters
      }
    })

  } catch (error) {
    console.error('❌ Search error:', error)

    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const isProviderError = errorMessage.includes('API key not configured') ||
                           errorMessage.includes('Apollo API error') ||
                           errorMessage.includes('Explorium')

    return NextResponse.json({
      success: false,
      error: isProviderError ? 'PROVIDER_ERROR' : 'INTERNAL_ERROR',
      message: isProviderError ? errorMessage : 'Internal server error occurred',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, {
      status: isProviderError ? 503 : 500
    })
  }
}

export async function GET() {
  try {
    const currentProvider = getCurrentProvider()
    const dataProviderManager = getDataProviderManager()
    const providerConfig = dataProviderManager.getProviderInfo()
    const filterOptions = dataProviderManager.getFilterOptions()

    return NextResponse.json({
      success: true,
      data: {
        currentProvider,
        providerConfig: {
          type: providerConfig.type,
          baseUrl: providerConfig.baseUrl,
          rateLimit: providerConfig.rateLimit,
          features: providerConfig.features
        },
        filterOptions,
        available: !!providerConfig.apiKey
      }
    })
  } catch (error) {
    console.error('❌ Provider info error:', error)
    return NextResponse.json({
      success: false,
      error: 'PROVIDER_INFO_ERROR',
      message: 'Failed to get provider information'
    }, { status: 500 })
  }
}