'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import {
  type SearchState,
  type SearchType,
  type ApolloFilterInput,
  type CompanyFilterInput,
  type LeadSearchResult,
  type CompanySearchResult,
  type SearchPagination,
  type SearchBreadcrumb,
  type RateLimitInfo,
  DEFAULT_SEARCH_STATE
} from '@/types/apollo'
import { Stats } from 'fs';

// Action types for the reducer
type SearchAction =
  | { type: 'SET_SEARCH_TYPE'; payload: SearchType }
  | { type: 'SET_PEOPLE_FILTERS'; payload: ApolloFilterInput }
  | { type: 'SET_COMPANY_FILTERS'; payload: CompanyFilterInput }
  | { type: 'UPDATE_PEOPLE_FILTER'; payload: { field: keyof ApolloFilterInput; value: any } }
  | { type: 'UPDATE_COMPANY_FILTER'; payload: { field: keyof CompanyFilterInput; value: any } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PEOPLE_RESULTS'; payload: { results: LeadSearchResult[]; pagination: SearchPagination; breadcrumbs: SearchBreadcrumb[]; searchId: string } }
  | { type: 'SET_COMPANY_RESULTS'; payload: { results: CompanySearchResult[]; pagination: SearchPagination; breadcrumbs: SearchBreadcrumb[]; searchId: string } }
  | { type: 'SET_RATE_LIMIT_INFO'; payload: RateLimitInfo | null }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PEOPLE_PAGE'; payload: number }
  | { type: 'SET_COMPANY_PAGE'; payload: number }
  | { type: 'SET_PEOPLE_PER_PAGE'; payload: number }
  | { type: 'SET_COMPANY_PER_PAGE'; payload: number }
  | { type: 'SET_SEARCH_RESULTS'; payload: LeadSearchResult[] }
  | { type: 'SET_PER_PAGE'; payload: number }

// Reducer function
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_SEARCH_TYPE':
      return {
        ...state,
        searchType: action.payload,
        error: null,
      }

    case 'SET_PEOPLE_FILTERS':
      return {
        ...state,
        peopleFilters: action.payload,
        error: null,
      }

    case 'SET_COMPANY_FILTERS':
      return {
        ...state,
        companyFilters: action.payload,
        error: null,
      }

    case 'UPDATE_PEOPLE_FILTER':
      return {
        ...state,
        peopleFilters: {
          ...state.peopleFilters,
          [action.payload.field]: action.payload.value,
          page: 1, // Reset page when filters change
        },
        error: null,
      }

    case 'UPDATE_COMPANY_FILTER':
      return {
        ...state,
        companyFilters: {
          ...state.companyFilters,
          [action.payload.field]: action.payload.value,
          page: 1, // Reset page when filters change
        },
        error: null,
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting new search
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    case 'SET_PEOPLE_RESULTS':
      return {
        ...state,
        peopleResults: action.payload.results,
        pagination: action.payload.pagination,
        breadcrumbs: action.payload.breadcrumbs,
        searchId: action.payload.searchId,
        loading: false,
        error: null,
      }

    case 'SET_COMPANY_RESULTS':
      return {
        ...state,
        companyResults: action.payload.results,
        pagination: action.payload.pagination,
        breadcrumbs: action.payload.breadcrumbs,
        searchId: action.payload.searchId,
        loading: false,
        error: null,
      }

    case 'SET_RATE_LIMIT_INFO':
      return {
        ...state,
        rateLimitInfo: action.payload,
      }

    case 'CLEAR_RESULTS':
      return {
        ...state,
        peopleResults: [],
        companyResults: [],
        pagination: null,
        breadcrumbs: [],
        searchId: null,
        error: null,
      }

    case 'RESET_FILTERS':
      return {
        ...DEFAULT_SEARCH_STATE,
        searchType: state.searchType, // Keep the current search type
      }

    case 'SET_PAGE':
      const currentFilters = state.searchType === 'people' ? state.peopleFilters : state.companyFilters
      const updatedFilters = { ...currentFilters, page: action.payload }

      return {
        ...state,
        ...(state.searchType === 'people'
          ? { peopleFilters: updatedFilters as ApolloFilterInput }
          : { companyFilters: updatedFilters as CompanyFilterInput }
        ),
      }

    case 'SET_PEOPLE_PAGE':
      return {
        ...state,
        peopleFilters: {
          ...state.peopleFilters,
          page: action.payload,
        },
      }

    case 'SET_COMPANY_PAGE':
      return {
        ...state,
        companyFilters: {
          ...state.companyFilters,
          page: action.payload,
        },
      }

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        peopleResults: action.payload,
        pagination: {
          page: 1,
          per_page: action.payload.length,
          total_entries: action.payload.length,
          total_pages: 1,
          has_more: false
        },
        breadcrumbs: [],
        searchId: `csv-${Date.now()}`,
        loading: false,
        error: null,
      }

    case 'SET_PER_PAGE': {
      // Update perPage in the correct filter, reset page to 1
      if (state.searchType === 'people') {
        return {
          ...state,
          peopleFilters: {
            ...state.peopleFilters,
            perPage: action.payload,
            page: 1,
          },
        }
      } else {
        return {
          ...state,
          companyFilters: {
            ...state.companyFilters,
            perPage: action.payload,
            page: 1,
          },
        }
      }
    }

    case 'SET_PEOPLE_PER_PAGE':
      return {
        ...state,
        peopleFilters: {
          ...state.peopleFilters,
          perPage: action.payload,
          page: 1,
        },
      }

    case 'SET_COMPANY_PER_PAGE':
      return {
        ...state,
        companyFilters: {
          ...state.companyFilters,
          perPage: action.payload,
          page: 1,
        },
      }

    default:
      return state
  }
}

// Context interface
interface ApolloSearchContextType {
  state: SearchState
  dispatch: React.Dispatch<SearchAction>

  // Action creators
  setSearchType: (type: SearchType) => void
  setPeopleFilters: (filters: ApolloFilterInput) => void
  setCompanyFilters: (filters: CompanyFilterInput) => void
  updatePeopleFilter: (field: keyof ApolloFilterInput, value: any) => void
  updateCompanyFilter: (field: keyof CompanyFilterInput, value: any) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPeopleResults: (results: LeadSearchResult[], pagination: SearchPagination, breadcrumbs: SearchBreadcrumb[], searchId: string) => void
  setCompanyResults: (results: CompanySearchResult[], pagination: SearchPagination, breadcrumbs: SearchBreadcrumb[], searchId: string) => void
  setRateLimitInfo: (info: RateLimitInfo | null) => void
  clearResults: () => void
  resetFilters: () => void
  setPage: (page: number) => void
  setSearchResults: (results: LeadSearchResult[]) => void
  setPerPage: (perPage: number) => void

  // Per-type pagination helpers
  setPeoplePage: (page: number) => void
  setCompanyPage: (page: number) => void
  setPeoplePerPage: (perPage: number) => void
  setCompanyPerPage: (perPage: number) => void

  // Search functions
  searchPeople: () => Promise<void>
  searchCompanies: () => Promise<void>
  search: (pageNumber?: number) => Promise<void>
  searchBoth?: () => Promise<{ people: LeadSearchResult[]; companies: CompanySearchResult[] }>

  // Computed values
  currentFilters: ApolloFilterInput | CompanyFilterInput
  currentResults: LeadSearchResult[] | CompanySearchResult[]
  // Expose both sides explicitly
  peopleFilters: ApolloFilterInput
  companyFilters: CompanyFilterInput
  peopleResults: LeadSearchResult[]
  companyResults: CompanySearchResult[]
  hasActiveFilters: boolean
  isSearching: boolean
}

// Create context
const ApolloSearchContext = createContext<ApolloSearchContextType | undefined>(undefined)

// Custom hook to use the context
export function useApolloSearch() {
  const context = useContext(ApolloSearchContext)
  if (context === undefined) {
    throw new Error('useApolloSearch must be used within an ApolloSearchProvider')
  }
  return context
}

// Provider component
interface ApolloSearchProviderProps {
  children: React.ReactNode
  initialState?: Partial<SearchState>
}

export function ApolloSearchProvider({ children, initialState }: ApolloSearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, {
    ...DEFAULT_SEARCH_STATE,
    ...initialState,
  })

  // Action creators
  const setSearchType = useCallback((type: SearchType) => {
    dispatch({ type: 'SET_SEARCH_TYPE', payload: type })
  }, [])

  const setPeopleFilters = useCallback((filters: ApolloFilterInput) => {
    dispatch({ type: 'SET_PEOPLE_FILTERS', payload: filters })
  }, [])

  const setCompanyFilters = useCallback((filters: CompanyFilterInput) => {
    dispatch({ type: 'SET_COMPANY_FILTERS', payload: filters })
  }, [])

  const updatePeopleFilter = useCallback((field: keyof ApolloFilterInput, value: any) => {
    dispatch({ type: 'UPDATE_PEOPLE_FILTER', payload: { field, value } })
  }, [])

  const updateCompanyFilter = useCallback((field: keyof CompanyFilterInput, value: any) => {
    dispatch({ type: 'UPDATE_COMPANY_FILTER', payload: { field, value } })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setPeopleResults = useCallback((
    results: LeadSearchResult[],
    pagination: SearchPagination,
    breadcrumbs: SearchBreadcrumb[],
    searchId: string
  ) => {
    dispatch({
      type: 'SET_PEOPLE_RESULTS',
      payload: { results, pagination, breadcrumbs, searchId }
    })
  }, [])

  const setCompanyResults = useCallback((
    results: CompanySearchResult[],
    pagination: SearchPagination,
    breadcrumbs: SearchBreadcrumb[],
    searchId: string
  ) => {
    dispatch({
      type: 'SET_COMPANY_RESULTS',
      payload: { results, pagination, breadcrumbs, searchId }
    })
  }, [])

  const setRateLimitInfo = useCallback((info: RateLimitInfo | null) => {
    dispatch({ type: 'SET_RATE_LIMIT_INFO', payload: info })
  }, [])

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' })
  }, [])

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' })
  }, [])

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }, [])

  const setSearchResults = useCallback((results: LeadSearchResult[]) => {
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: results })
  }, [])

  const setPerPage = useCallback((perPage: number) => {
    dispatch({ type: 'SET_PER_PAGE', payload: perPage })
  }, [])

  const setPeoplePage = useCallback((page: number) => {
    dispatch({ type: 'SET_PEOPLE_PAGE', payload: page })
  }, [])

  const setCompanyPage = useCallback((page: number) => {
    dispatch({ type: 'SET_COMPANY_PAGE', payload: page })
  }, [])

  const setPeoplePerPage = useCallback((perPage: number) => {
    dispatch({ type: 'SET_PEOPLE_PER_PAGE', payload: perPage })
  }, [])

  const setCompanyPerPage = useCallback((perPage: number) => {
    dispatch({ type: 'SET_COMPANY_PER_PAGE', payload: perPage })
  }, [])

  // Search functions
  const searchPeople = useCallback(async (overridePage?: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filters: {
            orgIds: state.companyResults.map(company  => company.id.replace("apollo_company_", "")),
            ...state.peopleFilters,
        },
        page: overridePage ?? state.peopleFilters.page,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      console.log("breadCrumbs", data.data.breadcrumbs)

      if (data.success) {
        setPeopleResults(
          data.data.people || [],
          data.data.pagination,
          data.data.breadcrumbs || [],
          data.data.search_id
        )

        // Update rate limit info if available
        if (data.meta?.rate_limit_info) {
          setRateLimitInfo(data.meta.rate_limit_info)
        }
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('People search error:', error)
    } finally {
      setLoading(false)
    }
  }, [state.peopleFilters, setLoading, setError, setPeopleResults, setRateLimitInfo])

  const searchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Implement company search API endpoint
      // For now, we'll create a placeholder
      const response = await fetch('/api/companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: state.companyFilters,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Company search failed')
      }

      const data = await response.json()

      if (data.success) {
        setCompanyResults(
          data.data.companies || [],
          data.data.pagination,
          data.data.breadcrumbs || [],
          data.data.search_id
        )

        if (data.meta?.rate_limit_info) {
          setRateLimitInfo(data.meta.rate_limit_info)
        }
      } else {
        throw new Error(data.error || 'Company search failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Company search error:', error)
    } finally {
      setLoading(false)
    }
  }, [state.companyFilters, setLoading, setError, setCompanyResults, setRateLimitInfo])

  const search = useCallback(async (overidePage?: number) => {
    if (state.searchType === 'people') {
      await searchPeople(overidePage)
    } else {
      await searchCompanies()
    }
  }, [state.searchType, searchPeople, searchCompanies])

  const searchBoth = useCallback(async () => {
    // run both searches in parallel and return results
    setLoading(true)
    setError(null)
    try {
      const [peopleRes, companyRes] = await Promise.all([searchPeople(), searchCompanies()])
      return {
        people: state.peopleResults,
        companies: state.companyResults,
      }
    } catch (err) {
      // errors are handled inside searchPeople/searchCompanies
      return {
        people: state.peopleResults,
        companies: state.companyResults,
      }
    } finally {
      setLoading(false)
    }
  }, [searchPeople, searchCompanies, setLoading, setError, state.peopleResults, state.companyResults])

  // Computed values
  const currentFilters = state.searchType === 'people' ? state.peopleFilters : state.companyFilters
  const currentResults = state.searchType === 'people' ? state.peopleResults : state.companyResults

  const hasPeopleFilters = React.useMemo(() => {
    const f = state.peopleFilters
    return !!(
      (Array.isArray(f.jobTitles) && f.jobTitles.length > 0) ||
      (Array.isArray(f.seniorities) && f.seniorities.length > 0) ||
      (Array.isArray(f.personLocations) && f.personLocations.length > 0) ||
      (Array.isArray(f.organizationLocations) && f.organizationLocations.length > 0) ||
      (Array.isArray(f.companyHeadcount) && f.companyHeadcount.length > 0) ||
      (Array.isArray(f.technologyUids) && f.technologyUids.length > 0) ||
      (Array.isArray(f.excludeTechnologyUids) && f.excludeTechnologyUids.length > 0) ||
      (Array.isArray(f.organizationJobTitles) && f.organizationJobTitles.length > 0) ||
      (Array.isArray(f.organizationJobLocations) && f.organizationJobLocations.length > 0) ||
      (f.organizationNumJobsMin !== null && f.organizationNumJobsMin !== undefined) ||
      (f.organizationNumJobsMax !== null && f.organizationNumJobsMax !== undefined) ||
      (f.revenueMin !== null && f.revenueMin !== undefined) ||
      (f.revenueMax !== null && f.revenueMax !== undefined)
    )
  }, [state.peopleFilters])

  const hasCompanyFilters = React.useMemo(() => {
    const f = state.companyFilters as any
    return !!(
      (Array.isArray(f.organizationNumEmployeesRange) && f.organizationNumEmployeesRange.length > 0) ||
      (Array.isArray(f.organizationLocations) && f.organizationLocations.length > 0) ||
      (Array.isArray(f.excludeOrganization) && f.excludeOrganization.length > 0) ||
      (f.revenueRangeMin !== null && f.revenueRangeMin !== undefined) ||
      (f.revenueRangeMax !== null && f.revenueRangeMax !== undefined) ||
      (Array.isArray(f.companyTechnologies) && f.companyTechnologies.length > 0) ||
      (Array.isArray(f.companyKeywords) && f.companyKeywords.length > 0) ||
      (typeof f.organizationName === 'string' && f.organizationName.length > 0) ||
      (Array.isArray(f.organizationIds) && f.organizationIds.length > 0) ||
      (f.latestFundingAmountMin !== null && f.latestFundingAmountMin !== undefined) ||
      (f.latestFundingAmountMax !== null && f.latestFundingAmountMax !== undefined) ||
      (f.totalFundingMin !== null && f.totalFundingMin !== undefined) ||
      (f.totalFundingMax !== null && f.totalFundingMax !== undefined) ||
      (f.latestFundingDateRangeMin !== null && f.latestFundingDateRangeMin !== undefined) ||
      (f.latestFundingDateRangeMax !== null && f.latestFundingDateRangeMax !== undefined) ||
      (Array.isArray(f.organizationJobTitles) && f.organizationJobTitles.length > 0) ||
      (Array.isArray(f.organizationJobLocations) && f.organizationJobLocations.length > 0) ||
      (f.organizationJobsMin !== null && f.organizationJobsMin !== undefined) ||
      (f.organizationJobsMax !== null && f.organizationJobsMax !== undefined)
    )
  }, [state.companyFilters])

  const hasActiveFilters = state.searchType === 'people' ? hasPeopleFilters : hasCompanyFilters

  const isSearching = state.loading

  // Context value
  const contextValue: ApolloSearchContextType = {
    state,
    dispatch,

    // Action creators
    setSearchType,
    setPeopleFilters,
    setCompanyFilters,
    updatePeopleFilter,
    updateCompanyFilter,
    setLoading,
    setError,
    setPeopleResults,
    setCompanyResults,
    setRateLimitInfo,
    clearResults,
    resetFilters,
    setPage,
    setSearchResults,
    setPerPage,
  setPeoplePage,
  setCompanyPage,
  setPeoplePerPage,
  setCompanyPerPage,

    // Search functions
    searchPeople,
    searchCompanies,
    search,
  searchBoth,

    // Computed values
    currentFilters,
    currentResults,
    hasActiveFilters,
    isSearching,
  // expose both explicitly
  peopleFilters: state.peopleFilters,
  companyFilters: state.companyFilters,
  peopleResults: state.peopleResults,
  companyResults: state.companyResults,
  }

  return (
    <ApolloSearchContext.Provider value={contextValue}>
      {children}
    </ApolloSearchContext.Provider>
  )
}

// Additional hook for easier access to search results
export function useSearchResults() {
  const { state, currentResults } = useApolloSearch()

  return {
    results: currentResults,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    searchId: state.searchId,
    searchType: state.searchType,
    companyResults: state.companyResults,
    peopleResults: state.peopleResults
  }
}

// Hook for managing filters
export function useSearchFilters() {
  const {
    state,
    currentFilters,
    hasActiveFilters,
    updatePeopleFilter,
    updateCompanyFilter,
    resetFilters,
    setSearchType
  } = useApolloSearch()

  const updateFilter = useCallback((field: string, value: any) => {
    if (state.searchType === 'people') {
      updatePeopleFilter(field as keyof ApolloFilterInput, value)
    } else {
      updateCompanyFilter(field as keyof CompanyFilterInput, value)
    }
  }, [state.searchType, updatePeopleFilter, updateCompanyFilter])

  return {
  filters: currentFilters,
    hasActiveFilters,
    searchType: state.searchType,
    updateFilter,
    resetFilters,
    setSearchType,
  // explicit accessors
  peopleFilters: state.peopleFilters,
  companyFilters: state.companyFilters,
  }
}

// Hook for pagination
export function useSearchPagination() {
  const { state, setPage, setPerPage, search, setLoading } = useApolloSearch()

  const goToPage = useCallback(async (page: number) => {
    setPage(page)
    await search(page)
  }, [setPage, search])

  const nextPage = useCallback(async () => {
    if (state.pagination && state.pagination.page < state.pagination.total_pages) {
      await goToPage(state.pagination.page + 1)
    }
  }, [state.pagination, goToPage])

  const prevPage = useCallback(async () => {
    if (state.pagination && state.pagination.page > 1) {
      await goToPage(state.pagination.page - 1)
    }
  }, [state.pagination, goToPage])

  return {
    pagination: state.pagination,
    goToPage,
    nextPage,
    prevPage,

    setPerPage, // Expose setPerPage
    // per-type pagination helpers
    setPeoplePage: (page: number) => {
      // @ts-ignore
      // use setPeoplePage exposed on context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(useApolloSearch() as any).setPeoplePage(page)
    },
    setCompanyPage: (page: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(useApolloSearch() as any).setCompanyPage(page)
    },
    setPeoplePerPage: (perPage: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(useApolloSearch() as any).setPeoplePerPage(perPage)
    },
    setCompanyPerPage: (perPage: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(useApolloSearch() as any).setCompanyPerPage(perPage)
    },
    canGoNext: (state.pagination?.page || 1) < (state.pagination?.total_pages || 1),
    canGoPrev: (state.pagination?.page || 1) > 1
  }
}