import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { apolloProvider, type ApolloSearchFilters } from '@/lib/data-integrations/apollo-provider'
import { getApolloThrottleManager } from '@/lib/utils/apollo-throttle'
import ApolloValidator from '@/lib/utils/apollo-validator'
import { type ApolloFilterInput } from '@/types/apollo'

// Transform UI filter input to Apollo API format
function transformFiltersToApollo(filters: ApolloFilterInput): ApolloSearchFilters {
  const apolloFilters: ApolloSearchFilters = {
    page: filters.page || 1,
    per_page: filters.perPage || 20
  }

  // Person-level filters
  if (filters.jobTitles?.length > 0) {
    apolloFilters.person_titles = filters.jobTitles
  }

  if (filters.seniorities?.length > 0) {
    apolloFilters.person_seniorities = filters.seniorities
  }

  if (filters.locations?.length > 0) {
    apolloFilters.person_locations = filters.locations
  }

  if (filters.timeInCurrentRole?.length > 0) {
    apolloFilters.person_time_in_current_role = filters.timeInCurrentRole
  }

  if (filters.totalYearsExperience?.length > 0) {
    apolloFilters.person_total_years_experience = filters.totalYearsExperience
  }

  if (typeof filters.hasEmail === 'boolean') {
    apolloFilters.has_email = filters.hasEmail
  }

  // Company-level filters
  if (filters.industries?.length > 0) {
    apolloFilters.company_industries = filters.industries
  }

  if (filters.companyHeadcount?.length > 0) {
    apolloFilters.company_headcount = filters.companyHeadcount
  }

  if (filters.companyDomains?.length > 0) {
    apolloFilters.company_domains = filters.companyDomains
  }

  if (filters.intentTopics?.length > 0) {
    apolloFilters.company_intent_topics = filters.intentTopics
  }

  return apolloFilters
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let requestId: string = ''

  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { filters } = body as {
      filters: ApolloFilterInput
    }

    if (!filters) {
      return NextResponse.json({ 
        error: 'Filters are required',
        code: 'MISSING_FILTERS' 
      }, { status: 400 })
    }

    // Transform UI filters to Apollo format
    const apolloFilters = transformFiltersToApollo(filters)

    // Validate filters
    const validation = ApolloValidator.validateSearchFilters(apolloFilters)
    
    if (!validation.isValid) {
      console.warn(`Apollo: Validation failed for user ${clerkUserId}:`, validation.errors)
      return NextResponse.json({
        error: 'Invalid filters provided',
        code: 'VALIDATION_FAILED',
        details: validation.errors,
        warnings: validation.warnings
      }, { status: 400 })
    }

    // Log validation warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Apollo: Validation warnings for user ${clerkUserId}:`, validation.warnings)
    }

    // Use cleaned filters from validation
    const cleanedFilters = validation.cleanedFilters!

    // Get throttle manager and execute request with rate limiting
    const throttleManager = getApolloThrottleManager()
    
    console.log(`Apollo: Starting search for user ${clerkUserId} with ${Object.keys(cleanedFilters).length} filter groups`)

    const searchResult = await throttleManager.executeRequest(
      () => apolloProvider.searchPeople(cleanedFilters),
      {
        userId: clerkUserId,
        requestType: 'search',
        priority: 'medium'
      }
    )

    requestId = searchResult.search_id

    // Log successful request
    const responseTime = Date.now() - startTime
    console.log(`Apollo: Search completed for user ${clerkUserId} in ${responseTime}ms. Found ${searchResult.people.length} results (${searchResult.pagination.total_entries} total)`)

    // Return successful response with comprehensive data
    return NextResponse.json({
      success: true,
      data: {
        people: searchResult.people,
        pagination: searchResult.pagination,
        breadcrumbs: searchResult.breadcrumbs,
        search_id: searchResult.search_id,
        validation_warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      },
      meta: {
        request_id: requestId,
        response_time_ms: responseTime,
        rate_limit_info: throttleManager.getMetrics(),
        queue_status: throttleManager.getQueueStatus()
      }
    })

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    // Enhanced error logging
    console.error('Apollo search error:', {
      error: error.message,
      requestId,
      responseTime,
      stack: error.stack
    })

    // Handle specific Apollo errors
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        error: 'Apollo API configuration error',
        code: 'API_KEY_ERROR',
        meta: { request_id: requestId, response_time_ms: responseTime }
      }, { status: 503 })
    }

    if (error.message?.includes('rate limit')) {
      const throttleManager = getApolloThrottleManager()
      const waitTime = throttleManager.getEstimatedWaitTime()
      
      return NextResponse.json({
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after_ms: waitTime,
        meta: { 
          request_id: requestId, 
          response_time_ms: responseTime,
          estimated_wait_time_ms: waitTime
        }
      }, { status: 429 })
    }

    if (error.message?.includes('validation')) {
      return NextResponse.json({
        error: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details || error.message,
        meta: { request_id: requestId, response_time_ms: responseTime }
      }, { status: 400 })
    }

    // Generic error response
    return NextResponse.json({
      error: 'Search request failed. Please try again.',
      code: 'SEARCH_FAILED',
      meta: { 
        request_id: requestId, 
        response_time_ms: responseTime,
        error_type: error.constructor.name
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST to search leads.',
    code: 'METHOD_NOT_ALLOWED'
  }, { status: 405 })
} 