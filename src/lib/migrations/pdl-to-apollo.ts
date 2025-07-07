// Migration utility for converting PeopleDataLabs saved searches to Apollo format
// This utility handles the transformation of existing saved search filters

import { type ApolloFilterInput, type SeniorityLevel, type CompanyHeadcount } from '@/types/apollo'

interface PDLSavedSearch {
  id: string
  name: string
  filters: {
    // PDL specific filters
    job_title?: string[]
    job_title_role?: string[]
    location_name?: string[]
    industry?: string[]
    company_size?: string[]
    management_level?: string[]
    experience_level?: string[]
    // Add other PDL specific fields as needed
  }
  created_at: string
  user_id: string
}

interface ApolloSavedSearch {
  id: string
  name: string
  search_type: 'people' | 'company'
  filters: ApolloFilterInput
  created_at: string
  user_id: string
  migrated_from_pdl: boolean
}

// Mapping PDL management levels to Apollo seniorities
const PDL_TO_APOLLO_SENIORITY: Record<string, SeniorityLevel> = {
  'c_suite': 'c_level',
  'vp': 'vp',
  'director': 'director',
  'manager': 'manager',
  'senior': 'senior',
  'entry': 'junior',
  'intern': 'intern'
}

// Mapping PDL company sizes to Apollo headcount ranges
const PDL_TO_APOLLO_HEADCOUNT: Record<string, CompanyHeadcount> = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '501-1000': '501-1000',
  '1001-5000': '1001-5000',
  '5001-10000': '5001-10000',
  '10000+': '10000+'
}

class PDLToApolloMigrator {
  /**
   * Migrate a single saved search from PDL to Apollo format
   */
  static migrateSavedSearch(pdlSearch: PDLSavedSearch): ApolloSavedSearch {
    const apolloFilters: ApolloFilterInput = {
      jobTitles: [],
      excludeJobTitles: [],
      seniorities: [],
      locations: [],
      excludeLocations: [],
      timeInCurrentRole: [],
      totalYearsExperience: [],
      hasEmail: null,
      industries: [],
      companyHeadcount: [],
      companyDomains: [],
      intentTopics: [],
      technologies: [],
      keywords: [],
      page: 1,
      perPage: 20
    }

    // Map job titles
    if (pdlSearch.filters.job_title?.length) {
      apolloFilters.jobTitles = pdlSearch.filters.job_title
    }
    if (pdlSearch.filters.job_title_role?.length) {
      apolloFilters.jobTitles = [...apolloFilters.jobTitles, ...pdlSearch.filters.job_title_role]
    }

    // Map locations
    if (pdlSearch.filters.location_name?.length) {
      apolloFilters.locations = pdlSearch.filters.location_name
    }

    // Map industries
    if (pdlSearch.filters.industry?.length) {
      apolloFilters.industries = pdlSearch.filters.industry
    }

    // Map management levels to seniorities
    if (pdlSearch.filters.management_level?.length) {
      apolloFilters.seniorities = pdlSearch.filters.management_level
        .map(level => PDL_TO_APOLLO_SENIORITY[level])
        .filter(Boolean) as SeniorityLevel[]
    }

    // Map company sizes to headcount
    if (pdlSearch.filters.company_size?.length) {
      apolloFilters.companyHeadcount = pdlSearch.filters.company_size
        .map(size => PDL_TO_APOLLO_HEADCOUNT[size])
        .filter(Boolean) as CompanyHeadcount[]
    }

    return {
      id: pdlSearch.id,
      name: `${pdlSearch.name} (Migrated)`,
      search_type: 'people', // Default to people search
      filters: apolloFilters,
      created_at: pdlSearch.created_at,
      user_id: pdlSearch.user_id,
      migrated_from_pdl: true
    }
  }

  /**
   * Migrate multiple saved searches
   */
  static migrateBulkSavedSearches(pdlSearches: PDLSavedSearch[]): ApolloSavedSearch[] {
    return pdlSearches.map(search => this.migrateSavedSearch(search))
  }

  /**
   * Validate migrated search and report incompatibilities
   */
  static validateMigration(pdlSearch: PDLSavedSearch, apolloSearch: ApolloSavedSearch): {
    isValid: boolean
    warnings: string[]
    unsupportedFields: string[]
  } {
    const warnings: string[] = []
    const unsupportedFields: string[] = []

    // Check for unsupported PDL fields
    const pdlFields = Object.keys(pdlSearch.filters)
    const supportedFields = [
      'job_title', 'job_title_role', 'location_name', 'industry', 
      'company_size', 'management_level', 'experience_level'
    ]

    pdlFields.forEach(field => {
      if (!supportedFields.includes(field)) {
        unsupportedFields.push(field)
      }
    })

    // Check for data loss
    if (pdlSearch.filters.experience_level?.length && !apolloSearch.filters.totalYearsExperience.length) {
      warnings.push('Experience level filters could not be automatically mapped to Apollo format')
    }

    if (unsupportedFields.length > 0) {
      warnings.push(`The following PDL filters are not supported in Apollo: ${unsupportedFields.join(', ')}`)
    }

    return {
      isValid: unsupportedFields.length === 0,
      warnings,
      unsupportedFields
    }
  }

  /**
   * Generate migration report
   */
  static generateMigrationReport(pdlSearches: PDLSavedSearch[]): {
    totalSearches: number
    successfulMigrations: number
    partialMigrations: number
    failedMigrations: number
    warnings: string[]
  } {
    const report = {
      totalSearches: pdlSearches.length,
      successfulMigrations: 0,
      partialMigrations: 0,
      failedMigrations: 0,
      warnings: [] as string[]
    }

    pdlSearches.forEach((pdlSearch) => {
      try {
        const apolloSearch = this.migrateSavedSearch(pdlSearch)
        const validation = this.validateMigration(pdlSearch, apolloSearch)

        if (validation.isValid && validation.warnings.length === 0) {
          report.successfulMigrations++
        } else if (validation.isValid && validation.warnings.length > 0) {
          report.partialMigrations++
          report.warnings.push(`Search "${pdlSearch.name}": ${validation.warnings.join(', ')}`)
        } else {
          report.failedMigrations++
          report.warnings.push(`Search "${pdlSearch.name}": Migration failed - ${validation.unsupportedFields.join(', ')}`)
        }
      } catch (error) {
        report.failedMigrations++
        report.warnings.push(`Search "${pdlSearch.name}": Migration error - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })

    return report
  }
}

// Example usage function for database migration
export async function migratePDLSearchesToApollo(
  getUserSavedSearches: (userId: string) => Promise<PDLSavedSearch[]>,
  saveApolloSearch: (search: ApolloSavedSearch) => Promise<void>,
  userId: string
): Promise<{
  success: boolean
  report: ReturnType<typeof PDLToApolloMigrator.generateMigrationReport>
}> {
  try {
    const pdlSearches = await getUserSavedSearches(userId)
    
    if (pdlSearches.length === 0) {
      return {
        success: true,
        report: {
          totalSearches: 0,
          successfulMigrations: 0,
          partialMigrations: 0,
          failedMigrations: 0,
          warnings: []
        }
      }
    }

    const apolloSearches = PDLToApolloMigrator.migrateBulkSavedSearches(pdlSearches)
    
    // Save migrated searches
    for (const apolloSearch of apolloSearches) {
      await saveApolloSearch(apolloSearch)
    }

    const report = PDLToApolloMigrator.generateMigrationReport(pdlSearches)

    return {
      success: true,
      report
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      report: {
        totalSearches: 0,
        successfulMigrations: 0,
        partialMigrations: 0,
        failedMigrations: 0,
        warnings: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }
}

export { PDLToApolloMigrator }
export type { PDLSavedSearch, ApolloSavedSearch } 