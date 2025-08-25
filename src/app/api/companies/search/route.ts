import { NextRequest, NextResponse } from 'next/server'
import { apolloClient } from '@/lib/apollo-http'
import { apolloValidator } from '@/lib/utils/apollo-validator'
import ApolloValidator from '@/lib/utils/apollo-validator'
import { apolloThrottle } from '@/lib/utils/apollo-throttle'
import { type CompanyFilterInput, type CompanySearchResult } from '@/types/apollo'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { filters } = body as { filters: CompanyFilterInput }

        // Validate filters (using a basic validation for now)
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            cleanedFilters: filters
        }
        if (!validation.isValid) {
            return NextResponse.json({
                success: false,
                error: 'VALIDATION_FAILED',
                message: 'Invalid filters provided',
                details: validation.errors
            }, { status: 400 })
        }

        // Check for warnings
        if (validation.warnings.length > 0) {
            console.warn('Company search warnings:', validation.warnings)
        }

        // Transform filters to Apollo API format
        const apolloFilters = transformToApolloCompanyFilters(filters)

        console.log(apolloFilters);

        // Execute search with throttling
        const response = await apolloThrottle.executeRequest(
            () => apolloClient.post('/mixed_companies/search', apolloFilters),
            {
                userId: 'system',
                requestType: 'search',
                priority: 'medium'
            }
        )

        if (!response) {
            console.log("No Response");
            throw new Error('No data received from Apollo API')
        }

        const apolloResponse = response

        // Transform response to our format
        const transformedResults: CompanySearchResult[] = apolloResponse.organizations?.map((org: any) => ({
            id: `apollo_company_${org.id || Math.random().toString(36)}`,
            external_id: org.id?.toString() || '',

            // Basic company information
            name: org.name || '',
            domain: org.primary_domain || org.website_url || '',
            website_url: org.website_url || '',
            linkedin_url: org.linkedin_url || '',
            twitter_url: org.twitter_url || '',
            facebook_url: org.facebook_url || '',

            // Business details
            industry: org.industry || '',
            description: org.short_description || org.description || '',
            keywords: org.keywords || [],

            // Size and metrics
            employee_count: org.estimated_num_employees || 0,
            estimated_annual_revenue: org.estimated_annual_revenue || 0,
            revenue_range: mapRevenueRange(org.estimated_annual_revenue),

            // Location
            headquarters_city: org.headquarters_city || '',
            headquarters_state: org.headquarters_state || '',
            headquarters_country: org.headquarters_country || '',
            locations: org.locations || [],

            // Funding and growth
            founded_year: org.founded_year || 0,
            funding_stage: org.funding_stage || '',
            funding_total: org.funding_total || 0,
            last_funding_date: org.last_funding_date || '',
            investor_count: org.investor_count || 0,

            // Technology and signals
            technologies: org.technologies || [],
            intent_topics: org.intent_topics || [],
            job_postings_count: org.job_postings_count || 0,
            recent_news_count: org.recent_news_count || 0,

            // Contact information
            phone: org.phone || '',
            email_domain: org.primary_domain || '',

            // Social presence
            alexa_ranking: org.alexa_ranking || 0,
            monthly_visits: org.monthly_visits || 0,

            // Key personnel
            key_people: org.key_people || [],

            // Metadata
            data_source: 'apollo' as const,
            confidence: calculateCompanyConfidence(org),
            last_updated: new Date()
        })) || []

        console.log('transformedResults', transformedResults);

        // Prepare response
        const responseData = {
            companies: transformedResults,
            pagination: {
                page: apolloResponse.pagination?.page || filters.page,
                per_page: apolloResponse.pagination?.per_page || filters.perPage,
                total_entries: apolloResponse.pagination?.total_entries || 0,
                total_pages: apolloResponse.pagination?.total_pages || 0,
                has_more: apolloResponse.pagination?.has_more || false
            },
            breadcrumbs: apolloResponse.breadcrumbs || [],
            search_id: apolloResponse.search_id || `company_search_${Date.now()}`
        }

        return NextResponse.json({
            success: true,
            data: responseData,
            meta: {
                total_results: transformedResults.length,
                rate_limit_info: apolloThrottle.getMetrics()
            }
        })

    } catch (error) {
        console.error('Company search error:', error)

        // Handle specific Apollo API errors
        if (error instanceof Error) {
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                return NextResponse.json({
                    success: false,
                    error: 'AUTH_REQUIRED',
                    message: 'Apollo API authentication failed. Please check your API key.'
                }, { status: 401 })
            }

            if (error.message.includes('403') || error.message.includes('forbidden')) {
                return NextResponse.json({
                    success: false,
                    error: 'INSUFFICIENT_CREDITS',
                    message: 'Insufficient Apollo credits or access denied.'
                }, { status: 403 })
            }

            if (error.message.includes('429') || error.message.includes('rate limit')) {
                return NextResponse.json({
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Apollo API rate limit exceeded. Please try again later.'
                }, { status: 429 })
            }
        }

        return NextResponse.json({
            success: false,
            error: 'SEARCH_FAILED',
            message: 'Company search failed. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// Transform our filter format to Apollo API format for companies
function transformToApolloCompanyFilters(filters: CompanyFilterInput) {
    const apolloFilters: any = {
        per_page: filters.perPage || 20,
        page: filters.page || 1
    }

    // Company names
    //   if (filters.companyNames && filters.companyNames.length > 0) {
    //     apolloFilters.organization_names = filters.companyNames
    //   }
    if (filters.organizationNumEmployeesRange && filters.organizationNumEmployeesRange.length !== 0) {
        apolloFilters.organization_num_employees_ranges = filters.organizationNumEmployeesRange.map(it => it.split("-").join(","))
    }
    if (filters.organizationLocations && filters.organizationLocations.length !== 0) {
        apolloFilters.organization_locations = filters.organizationLocations
    }
    if (filters.excludeOrganizationLocations && filters.excludeOrganizationLocations.length !== 0) {
        apolloFilters.organization_not_locations = filters.excludeOrganizationLocations
    }
    if (filters.revenueRangeMin) {
        apolloFilters["revenue_range[min]"] = filters.revenueRangeMin;
    }
    if (filters.revenueRangeMax) {
        apolloFilters["revenue_range[max]"] = filters.revenueRangeMax;
    }
    if (filters.companyTechnologies && filters.companyTechnologies.length !== 0) {
        apolloFilters.currently_using_any_of_technology_uids = filters.companyTechnologies;
    }
    if (filters.companyKeywords && filters.companyKeywords.length !== 0) {
        apolloFilters.q_organization_keyword_tags = filters.companyKeywords;
    }
    if (filters.organizationName) {
        apolloFilters.q_organization_name = filters.organizationName;
    }
    if (filters.latestFundingAmountMin) {
        apolloFilters['latest_funding_amount_range[min]'] = filters.latestFundingDateRangeMin;
    }
    if (filters.latestFundingAmountMax) {
        apolloFilters['latest_funding_amount_range[max]'] = filters.latestFundingDateRangeMax;
    }
    if (filters.totalFundingMin) {
        apolloFilters['total_funding_range[min]'] = filters.totalFundingMin;
    }
    if (filters.totalFundingMax) {
        apolloFilters['total_funding_range[max]'] = filters.totalFundingMax;
    }
    if (filters.latestFundingDateRangeMin) {
        apolloFilters['latest_funding_date_range[min]'] = filters.latestFundingDateRangeMin;
    }
    if (filters.latestFundingDateRangeMax) {
        apolloFilters['latest_funding_date_range[max]'] = filters.latestFundingDateRangeMax;
    }
    if (filters.organizationJobTitles && filters.organizationJobTitles.length !== 0) {
        apolloFilters.q_organization_job_titles = filters.organizationJobTitles;
    }
    if (filters.organizationJobLocations && filters.organizationJobLocations.length !== 0) {
        apolloFilters.organization_job_locations = filters.organizationJobLocations;
    }
    if (filters.organizationJobsMin) {
        apolloFilters['organization_num_jobs_range[min]'] = filters.organizationJobsMin
    }
    if (filters.organizationJobsMax) {
        apolloFilters['organization_num_jobs_range[max]'] = filters.organizationJobsMax
    }
    if (filters.organizationJobPostedAtRangeMin) {
        apolloFilters['organization_job_posted_at_range[min]'] = filters.organizationJobPostedAtRangeMin
    }
    if (filters.organizationJobPostedAtRangeMax) {
        apolloFilters['organization_job_posted_at_range[max]'] = filters.organizationJobPostedAtRangeMax
    }
    return apolloFilters
}

// Map revenue number to range string
function mapRevenueRange(revenue?: number): string | undefined {
    if (!revenue) return undefined

    if (revenue < 1000000) return '0-1M'
    if (revenue < 10000000) return '1M-10M'
    if (revenue < 50000000) return '10M-50M'
    if (revenue < 100000000) return '50M-100M'
    if (revenue < 500000000) return '100M-500M'
    if (revenue < 1000000000) return '500M-1B'
    return '1B+'
}

// Calculate confidence score for companies
function calculateCompanyConfidence(org: any): number {
    let confidence = 0.5 // Base confidence

    // Boost confidence for complete data
    if (org.name) confidence += 0.1
    if (org.primary_domain || org.website_url) confidence += 0.1
    if (org.industry) confidence += 0.1
    if (org.estimated_num_employees) confidence += 0.1
    if (org.headquarters_city && org.headquarters_country) confidence += 0.1
    if (org.founded_year) confidence += 0.05
    if (org.technologies && org.technologies.length > 0) confidence += 0.05

    return Math.min(confidence, 1.0)
}