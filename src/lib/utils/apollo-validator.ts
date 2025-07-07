// Apollo Request Validation Utilities
// Comprehensive validation for Apollo API requests with detailed error reporting

import { 
  ApolloSearchFilters,
  APOLLO_SENIORITIES,
  APOLLO_TIME_IN_ROLE,
  APOLLO_EXPERIENCE_RANGES,
  APOLLO_COMPANY_HEADCOUNT
} from '../data-integrations/apollo-provider'

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  cleanedFilters?: ApolloSearchFilters
}

export class ApolloValidationError extends Error {
  public errors: ValidationError[]
  public warnings: ValidationError[]

  constructor(errors: ValidationError[], warnings: ValidationError[] = []) {
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`
    super(message)
    this.name = 'ApolloValidationError'
    this.errors = errors
    this.warnings = warnings
  }
}

class ApolloValidator {
  // Apollo API limits
  private static readonly LIMITS = {
    MAX_PERSON_TITLES: 100,
    MAX_SENIORITIES: 20,
    MAX_LOCATIONS: 50,
    MAX_INDUSTRIES: 50,
    MAX_DOMAINS: 20,
    MAX_INTENT_TOPICS: 30,
    MAX_PER_PAGE: 100,
    MIN_PER_PAGE: 1,
    MAX_PAGE: 1000,
    MIN_PAGE: 1,
    MAX_STRING_LENGTH: 100,
    MIN_STRING_LENGTH: 1
  }

  /**
   * Validate Apollo search filters
   */
  static validateSearchFilters(filters: ApolloSearchFilters): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const cleanedFilters: ApolloSearchFilters = { ...filters }

    // Validate pagination
    this.validatePagination(filters, errors, cleanedFilters)

    // Validate person-level filters
    this.validatePersonFilters(filters, errors, warnings, cleanedFilters)

    // Check for filter combinations that might be too restrictive
    this.validateFilterCombinations(cleanedFilters, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedFilters: errors.length === 0 ? cleanedFilters : undefined
    }
  }

  /**
   * Validate pagination parameters
   */
  private static validatePagination(
    filters: ApolloSearchFilters, 
    errors: ValidationError[], 
    cleaned: ApolloSearchFilters
  ) {
    // Validate page
    if (filters.page !== undefined) {
      if (!Number.isInteger(filters.page) || filters.page < this.LIMITS.MIN_PAGE) {
        errors.push({
          field: 'page',
          message: `Page must be an integer >= ${this.LIMITS.MIN_PAGE}`,
          code: 'INVALID_PAGE',
          value: filters.page
        })
      } else if (filters.page > this.LIMITS.MAX_PAGE) {
        errors.push({
          field: 'page',
          message: `Page must be <= ${this.LIMITS.MAX_PAGE}`,
          code: 'PAGE_TOO_HIGH',
          value: filters.page
        })
      } else {
        cleaned.page = filters.page
      }
    } else {
      cleaned.page = 1
    }

    // Validate per_page
    if (filters.per_page !== undefined) {
      if (!Number.isInteger(filters.per_page) || filters.per_page < this.LIMITS.MIN_PER_PAGE) {
        errors.push({
          field: 'per_page',
          message: `Per page must be an integer >= ${this.LIMITS.MIN_PER_PAGE}`,
          code: 'INVALID_PER_PAGE',
          value: filters.per_page
        })
      } else if (filters.per_page > this.LIMITS.MAX_PER_PAGE) {
        errors.push({
          field: 'per_page',
          message: `Per page must be <= ${this.LIMITS.MAX_PER_PAGE}`,
          code: 'PER_PAGE_TOO_HIGH',
          value: filters.per_page
        })
      } else {
        cleaned.per_page = filters.per_page
      }
    } else {
      cleaned.per_page = 20
    }
  }

  /**
   * Validate person-level filters
   */
  private static validatePersonFilters(
    filters: ApolloSearchFilters,
    errors: ValidationError[],
    warnings: ValidationError[],
    cleaned: ApolloSearchFilters
  ) {
    // Validate person_titles
    if (filters.person_titles) {
      if (!Array.isArray(filters.person_titles)) {
        errors.push({
          field: 'person_titles',
          message: 'Person titles must be an array',
          code: 'INVALID_TYPE',
          value: filters.person_titles
        })
      } else {
        const validTitles = filters.person_titles
          .filter(title => typeof title === 'string' && title.trim().length > 0)
          .slice(0, this.LIMITS.MAX_PERSON_TITLES)

        if (validTitles.length !== filters.person_titles.length) {
          warnings.push({
            field: 'person_titles',
            message: `Some person titles were filtered out. Only ${validTitles.length} of ${filters.person_titles.length} titles are valid`,
            code: 'FILTERED_VALUES'
          })
        }

        if (validTitles.length > 0) {
          cleaned.person_titles = validTitles
        }
      }
    }

    // Validate person_seniorities
    if (filters.person_seniorities) {
      if (!Array.isArray(filters.person_seniorities)) {
        errors.push({
          field: 'person_seniorities',
          message: 'Person seniorities must be an array',
          code: 'INVALID_TYPE',
          value: filters.person_seniorities
        })
      } else {
        const validSeniorities = filters.person_seniorities
          .filter(seniority => APOLLO_SENIORITIES.includes(seniority as any))
          .slice(0, this.LIMITS.MAX_SENIORITIES)

        if (validSeniorities.length !== filters.person_seniorities.length) {
          const invalidSeniorities = filters.person_seniorities.filter(
            s => !APOLLO_SENIORITIES.includes(s as any)
          )
          warnings.push({
            field: 'person_seniorities',
            message: `Invalid seniorities removed: ${invalidSeniorities.join(', ')}. Valid options: ${APOLLO_SENIORITIES.join(', ')}`,
            code: 'INVALID_VALUES'
          })
        }

        if (validSeniorities.length > 0) {
          cleaned.person_seniorities = validSeniorities
        }
      }
    }

    // Validate person_locations
    if (filters.person_locations) {
      if (!Array.isArray(filters.person_locations)) {
        errors.push({
          field: 'person_locations',
          message: 'Person locations must be an array',
          code: 'INVALID_TYPE',
          value: filters.person_locations
        })
      } else {
        const validLocations = filters.person_locations
          .filter(location => typeof location === 'string' && location.trim().length > 0)
          .slice(0, this.LIMITS.MAX_LOCATIONS)

        if (validLocations.length !== filters.person_locations.length) {
          warnings.push({
            field: 'person_locations',
            message: `Some locations were filtered out. Only ${validLocations.length} of ${filters.person_locations.length} locations are valid`,
            code: 'FILTERED_VALUES'
          })
        }

        if (validLocations.length > 0) {
          cleaned.person_locations = validLocations
        }
      }
    }

    // Validate person_time_in_current_role
    if (filters.person_time_in_current_role) {
      if (!Array.isArray(filters.person_time_in_current_role)) {
        errors.push({
          field: 'person_time_in_current_role',
          message: 'Person time in current role must be an array',
          code: 'INVALID_TYPE',
          value: filters.person_time_in_current_role
        })
      } else {
        const validTimeRanges = filters.person_time_in_current_role
          .filter(time => APOLLO_TIME_IN_ROLE.includes(time as any))

        if (validTimeRanges.length !== filters.person_time_in_current_role.length) {
          const invalidRanges = filters.person_time_in_current_role.filter(
            t => !APOLLO_TIME_IN_ROLE.includes(t as any)
          )
          warnings.push({
            field: 'person_time_in_current_role',
            message: `Invalid time ranges removed: ${invalidRanges.join(', ')}. Valid options: ${APOLLO_TIME_IN_ROLE.join(', ')}`,
            code: 'INVALID_VALUES'
          })
        }

        if (validTimeRanges.length > 0) {
          cleaned.person_time_in_current_role = validTimeRanges
        }
      }
    }

    // Validate person_total_years_experience
    if (filters.person_total_years_experience) {
      if (!Array.isArray(filters.person_total_years_experience)) {
        errors.push({
          field: 'person_total_years_experience',
          message: 'Person total years experience must be an array',
          code: 'INVALID_TYPE',
          value: filters.person_total_years_experience
        })
      } else {
        const validExperience = filters.person_total_years_experience
          .filter(exp => APOLLO_EXPERIENCE_RANGES.includes(exp as any))

        if (validExperience.length !== filters.person_total_years_experience.length) {
          const invalidRanges = filters.person_total_years_experience.filter(
            e => !APOLLO_EXPERIENCE_RANGES.includes(e as any)
          )
          warnings.push({
            field: 'person_total_years_experience',
            message: `Invalid experience ranges removed: ${invalidRanges.join(', ')}. Valid options: ${APOLLO_EXPERIENCE_RANGES.join(', ')}`,
            code: 'INVALID_VALUES'
          })
        }

        if (validExperience.length > 0) {
          cleaned.person_total_years_experience = validExperience
        }
      }
    }

    // Validate has_email
    if (filters.has_email !== undefined) {
      if (typeof filters.has_email !== 'boolean') {
        errors.push({
          field: 'has_email',
          message: 'Has email must be a boolean',
          code: 'INVALID_TYPE',
          value: filters.has_email
        })
      } else {
        cleaned.has_email = filters.has_email
      }
    }
  }



  /**
   * Validate filter combinations to warn about overly restrictive searches
   */
  private static validateFilterCombinations(
    filters: ApolloSearchFilters,
    warnings: ValidationError[]
  ) {
    let filterCount = 0
    const activeFilters: string[] = []

    if (filters.person_titles?.length) {
      filterCount++
      activeFilters.push('person_titles')
    }
    if (filters.person_seniorities?.length) {
      filterCount++
      activeFilters.push('person_seniorities')
    }
    if (filters.person_locations?.length) {
      filterCount++
      activeFilters.push('person_locations')
    }
    if (filters.company_industries?.length) {
      filterCount++
      activeFilters.push('company_industries')
    }
    if (filters.company_headcount?.length) {
      filterCount++
      activeFilters.push('company_headcount')
    }

    // Warn if too many restrictive filters are applied
    if (filterCount > 5) {
      warnings.push({
        field: 'filter_combination',
        message: `Many filters applied (${activeFilters.join(', ')}). This might result in very few or no results.`,
        code: 'OVERLY_RESTRICTIVE'
      })
    }

    // Warn if no filters are applied
    if (filterCount === 0 && !filters.has_email) {
      warnings.push({
        field: 'filter_combination',
        message: 'No filters applied. This will return random results and consume your API quota quickly.',
        code: 'NO_FILTERS'
      })
    }
  }

  /**
   * Quick validation for common use cases
   */
  static quickValidate(filters: ApolloSearchFilters): boolean {
    try {
      const result = this.validateSearchFilters(filters)
      return result.isValid
    } catch {
      return false
    }
  }

  /**
   * Get validation summary for logging
   */
  static getValidationSummary(result: ValidationResult): string {
    const summary: string[] = []

    if (result.isValid) {
      summary.push('✓ Validation passed')
    } else {
      summary.push(`✗ Validation failed with ${result.errors.length} errors`)
    }

    if (result.warnings.length > 0) {
      summary.push(`⚠ ${result.warnings.length} warnings`)
    }

    return summary.join(', ')
  }

  /**
   * Validate company search filters
   */
  public static validateCompanyFilters(filters: any): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    cleanedFilters?: any
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const cleanedFilters = { ...filters }

    try {
      // Validate company names
      if (filters.companyNames && Array.isArray(filters.companyNames)) {
        if (filters.companyNames.length > 100) {
          errors.push('Maximum 100 company names allowed')
        } else if (filters.companyNames.length > 50) {
          warnings.push('Consider reducing company names for better performance')
        }
        cleanedFilters.companyNames = filters.companyNames.slice(0, 100)
      }

      // Validate exclude company names
      if (filters.excludeCompanyNames && Array.isArray(filters.excludeCompanyNames)) {
        if (filters.excludeCompanyNames.length > 100) {
          errors.push('Maximum 100 excluded company names allowed')
        }
        cleanedFilters.excludeCompanyNames = filters.excludeCompanyNames.slice(0, 100)
      }

      // Validate industries
      if (filters.industries && Array.isArray(filters.industries)) {
        if (filters.industries.length > 25) {
          errors.push('Maximum 25 industries allowed')
        } else if (filters.industries.length > 15) {
          warnings.push('Consider reducing industries for better performance')
        }
        cleanedFilters.industries = filters.industries.slice(0, 25)
      }

      // Validate headcount ranges
      if (filters.headcountRanges && Array.isArray(filters.headcountRanges)) {
        if (filters.headcountRanges.length > 8) {
          warnings.push('Too many headcount ranges selected')
        }
      }

      // Validate revenue ranges
      if (filters.revenueRanges && Array.isArray(filters.revenueRanges)) {
        if (filters.revenueRanges.length > 7) {
          warnings.push('Too many revenue ranges selected')
        }
      }

      // Validate funding stages
      if (filters.fundingStages && Array.isArray(filters.fundingStages)) {
        if (filters.fundingStages.length > 11) {
          warnings.push('Too many funding stages selected')
        }
      }

      // Validate locations
      if (filters.locations && Array.isArray(filters.locations)) {
        if (filters.locations.length > 50) {
          errors.push('Maximum 50 locations allowed')
        } else if (filters.locations.length > 25) {
          warnings.push('Consider reducing locations for better performance')
        }
        cleanedFilters.locations = filters.locations.slice(0, 50)
      }

      // Validate domains
      if (filters.companyDomains && Array.isArray(filters.companyDomains)) {
        if (filters.companyDomains.length > 50) {
          errors.push('Maximum 50 domains allowed')
        }

        // Validate domain format
        const validDomains = filters.companyDomains.filter((domain: string) => {
          return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(domain)
        })

        if (validDomains.length !== filters.companyDomains.length) {
          warnings.push('Some domains have invalid format and will be ignored')
        }

        cleanedFilters.companyDomains = validDomains.slice(0, 50)
      }

      // Validate technologies
      if (filters.technologies && Array.isArray(filters.technologies)) {
        if (filters.technologies.length > 20) {
          errors.push('Maximum 20 technologies allowed')
        } else if (filters.technologies.length > 10) {
          warnings.push('Consider reducing technologies for better performance')
        }
        cleanedFilters.technologies = filters.technologies.slice(0, 20)
      }

      // Validate intent topics
      if (filters.intentTopics && Array.isArray(filters.intentTopics)) {
        if (filters.intentTopics.length > 10) {
          errors.push('Maximum 10 intent topics allowed')
        }
        cleanedFilters.intentTopics = filters.intentTopics.slice(0, 10)
      }

      // Validate keywords
      if (filters.keywords && Array.isArray(filters.keywords)) {
        if (filters.keywords.length > 20) {
          errors.push('Maximum 20 keywords allowed')
        }
        
        // Validate individual keywords
        const validKeywords = filters.keywords.filter((keyword: string) => {
          return typeof keyword === 'string' && keyword.trim().length > 0 && keyword.length <= 100
        })

        if (validKeywords.length !== filters.keywords.length) {
          warnings.push('Some keywords are invalid and will be ignored')
        }

        cleanedFilters.keywords = validKeywords.slice(0, 20)
      }

      // Validate pagination
      if (filters.page !== undefined && filters.page < 1) {
        errors.push('Page number must be greater than 0')
      }

      if (filters.perPage !== undefined) {
        if (filters.perPage < 1 || filters.perPage > 100) {
          errors.push('Per page must be between 1 and 100')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        cleanedFilters: errors.length === 0 ? cleanedFilters : undefined
      }

    } catch (error) {
      return {
        isValid: false,
        errors: ['Filter validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings: []
      }
    }
  }
}

export const apolloValidator = new ApolloValidator()
export default ApolloValidator 