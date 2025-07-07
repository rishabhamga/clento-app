import { useState, useEffect } from 'react'

interface Lead {
  id: string
  full_name: string
  email: string
  linkedin_url?: string
  company?: string
  title?: string
  location?: string
  phone?: string
  source: string
  created_at: string
  enrichment_data?: any
}

interface UseLeadsResult {
  leads: Lead[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

interface UseLeadsOptions {
  campaignId?: string
  limit?: number
  offset?: number
}

export function useLeads(options: UseLeadsOptions = {}): UseLeadsResult {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.campaignId) params.append('campaignId', options.campaignId)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`/api/leads?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const data = await response.json()
      setLeads(data.leads)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [options.campaignId, options.limit, options.offset])

  return {
    leads,
    total,
    loading,
    error,
    refetch: fetchLeads
  }
} 