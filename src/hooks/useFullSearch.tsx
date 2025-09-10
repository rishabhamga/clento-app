'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import {
  type CompanyFilterInput,
  type ApolloFilterInput,
  type CompanySearchResult,
  type LeadSearchResult,
  type SearchPagination,
  DEFAULT_SEARCH_STATE,
} from '@/types/apollo'

// A minimal, opinionated "full search" hook that:
// 1) runs a company search using company filters
// 2) extracts company ids
// 3) runs a people search including the company ids
// This is intentionally small so you can modify field names / payloads to match your API.

type FullSearchState = {
  companyFilters: CompanyFilterInput
  peopleFilters: ApolloFilterInput
  companyResults: CompanySearchResult[]
  peopleResults: LeadSearchResult[]
  pagination: SearchPagination | null
  loading: boolean
  error: string | null
}

type FullSearchAction =
  | { type: 'SET_COMPANY_FILTERS'; payload: CompanyFilterInput }
  | { type: 'SET_PEOPLE_FILTERS'; payload: ApolloFilterInput }
  | { type: 'SET_COMPANY_RESULTS'; payload: CompanySearchResult[] }
  | { type: 'SET_PEOPLE_RESULTS'; payload: { results: LeadSearchResult[]; pagination?: SearchPagination } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_RESULTS' }

function reducer(state: FullSearchState, action: FullSearchAction): FullSearchState {
  switch (action.type) {
    case 'SET_COMPANY_FILTERS':
      return { ...state, companyFilters: action.payload, error: null }
    case 'SET_PEOPLE_FILTERS':
      return { ...state, peopleFilters: action.payload, error: null }
    case 'SET_COMPANY_RESULTS':
      return { ...state, companyResults: action.payload, error: null }
    case 'SET_PEOPLE_RESULTS':
      return { ...state, peopleResults: action.payload.results, pagination: action.payload.pagination ?? state.pagination, loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: action.payload ? null : state.error }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'CLEAR_RESULTS':
      return { ...state, companyResults: [], peopleResults: [], pagination: null, error: null }
    default:
      return state
  }
}

interface UseFullSearchReturn {
  state: FullSearchState
  setCompanyFilters: (f: CompanyFilterInput) => void
  setPeopleFilters: (f: ApolloFilterInput) => void
  clearResults: () => void
  // Runs company search, then people search. Returns people results and company ids used.
  runFullSearch: (overrideCompanyPage?: number) => Promise<{ companyIds: string[]; peopleResults: LeadSearchResult[] }>
}

const FullSearchContext = createContext<UseFullSearchReturn | undefined>(undefined)

export function useFullSearch() {
  const ctx = useContext(FullSearchContext)
  if (!ctx) throw new Error('useFullSearch must be used within a FullSearchProvider')
  return ctx
}

export function FullSearchProvider({ children, initialState }: { children: React.ReactNode; initialState?: Partial<FullSearchState> }) {
  const initialCompanyFilters = (DEFAULT_SEARCH_STATE.companyFilters as CompanyFilterInput)
  const initialPeopleFilters = (DEFAULT_SEARCH_STATE.peopleFilters as ApolloFilterInput)

  const [state, dispatch] = useReducer(reducer, {
    companyFilters: initialState?.companyFilters ?? initialCompanyFilters,
    peopleFilters: initialState?.peopleFilters ?? initialPeopleFilters,
    companyResults: initialState?.companyResults ?? [],
    peopleResults: initialState?.peopleResults ?? [],
    pagination: initialState?.pagination ?? null,
    loading: false,
    error: null,
  } as FullSearchState)

  const setCompanyFilters = useCallback((filters: CompanyFilterInput) => dispatch({ type: 'SET_COMPANY_FILTERS', payload: filters }), [])
  const setPeopleFilters = useCallback((filters: ApolloFilterInput) => dispatch({ type: 'SET_PEOPLE_FILTERS', payload: filters }), [])
  const clearResults = useCallback(() => dispatch({ type: 'CLEAR_RESULTS' }), [])

  // Helper to extract company id from result — adjust if your API uses a different field (uid, organization_id, etc.)
  const getCompanyId = (c: CompanySearchResult) => (c as any).id ?? (c as any).uid ?? (c as any).organization_id

  // The main flow: company search -> people search
  const runFullSearch = useCallback(async (overrideCompanyPage?: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 1) Company search
      const companyBody = { filters: { ...state.companyFilters, page: overrideCompanyPage ?? (state.companyFilters as any).page } }

      const companyRes = await fetch('/api/companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyBody),
      })

      if (!companyRes.ok) {
        const err = await companyRes.json().catch(() => ({}))
        throw new Error(err.error || 'Company search failed')
      }

      const companyData = await companyRes.json()
      if (!companyData.success) throw new Error(companyData.error || 'Company search returned failure')

      const companies: CompanySearchResult[] = companyData.data.companies || []
      dispatch({ type: 'SET_COMPANY_RESULTS', payload: companies })

      // Extract ids for chaining
      const companyIds: string[] = companies.map(getCompanyId).filter(Boolean) as string[]

      // 2) People search (include the company ids in the people filters)
      // NOTE: adjust the key ('company_ids') to whatever your people API expects. This is a common pattern.
      const peopleFiltersForRequest: any = { ...state.peopleFilters, company_ids: companyIds }

      const peopleBody = { filters: peopleFiltersForRequest, page: (state.peopleFilters as any).page }

      const peopleRes = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peopleBody),
      })

      if (!peopleRes.ok) {
        const err = await peopleRes.json().catch(() => ({}))
        throw new Error(err.error || 'People search failed')
      }

      const peopleData = await peopleRes.json()
      if (!peopleData.success) throw new Error(peopleData.error || 'People search returned failure')

      const peopleResults: LeadSearchResult[] = peopleData.data.people || []
      const pagination: SearchPagination | undefined = peopleData.data.pagination

      dispatch({ type: 'SET_PEOPLE_RESULTS', payload: { results: peopleResults, pagination } })

      return { companyIds, peopleResults }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred'
      dispatch({ type: 'SET_ERROR', payload: message })
      console.error('Full search error:', err)
      return { companyIds: [], peopleResults: [] }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.companyFilters, state.peopleFilters])

  const value = useMemo(() => ({ state, setCompanyFilters, setPeopleFilters, clearResults, runFullSearch }), [state, setCompanyFilters, setPeopleFilters, clearResults, runFullSearch])

  return <FullSearchContext.Provider value={value}>{children}</FullSearchContext.Provider>
}
