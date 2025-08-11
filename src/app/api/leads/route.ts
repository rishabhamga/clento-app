import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import {
  LeadFilters,
  LeadSearchParams,
  LeadListResponse,
  LeadStats,
  LinkedInConnectionStatus
} from '@/types/syndie'

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const params = parseLeadSearchParams(searchParams)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Note: Showing all leads regardless of user, organization, or campaign

    const { data: organizationData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .maybeSingle();

    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      if (!organizationData) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }
      const stats = await getLeadStats(organizationData)
      return NextResponse.json({ success: true, data: stats })
    }

    let baseQuery = supabaseAdmin
      .from('leads')
      .select('*')
      .eq('organization_id', organizationData?.id)

    // Apply filters
    baseQuery = applyLeadFilters(baseQuery, params.filters)

    // Apply sorting
    const sortField = params.sortBy || 'created_at'
    const sortOrder = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false }
    baseQuery = baseQuery.order(sortField, sortOrder)

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const offset = (page - 1) * limit
    baseQuery = baseQuery.range(offset, offset + limit - 1)

    const { data: leads, error: leadsError } = await baseQuery

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    // Count only filtered leads for pagination
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationData?.id)

    countQuery = applyLeadFilters(countQuery, params.filters)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching leads count:', countError)
    }

    // Transform leads data to include computed fields
    // Transform leads data to include computed fields
    const transformedLeads = leads?.map(transformLeadData) || []

    const response: LeadListResponse = {
      leads: transformedLeads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: params.filters || {}
    }

    return NextResponse.json({ success: true, data: response })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT method for updating leads
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Update the lead
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .eq('user_id', userData.id) // Ensure user can only update their own leads
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Lead not found or access denied' },
        { status: 404 }
      )
    }

    const transformedLead = transformLeadData(updatedLead)

    return NextResponse.json({
      success: true,
      data: transformedLead,
      message: 'Lead updated successfully'
    })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function parseLeadSearchParams(searchParams: URLSearchParams): LeadSearchParams {
  const filters: LeadFilters = {}

  // Parse status filters
  const status = searchParams.get('status')
  if (status) {
    filters.status = status.split(',')
  }

  // Parse connection status filters
  const connectionStatus = searchParams.get('connectionStatus')
  if (connectionStatus) {
    filters.connectionStatus = connectionStatus.split(',') as LinkedInConnectionStatus[]
  }

  // Parse campaign filter
  const campaign = searchParams.get('campaign')
  if (campaign) {
    filters.campaign = campaign
  }

  // Parse account filter
  const account = searchParams.get('account')
  if (account) {
    filters.account = account
  }



  // Parse date range
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  if (startDate && endDate) {
    filters.dateRange = {
      start: startDate,
      end: endDate
    }
  }

  // Parse search query
  const search = searchParams.get('search')
  if (search) {
    filters.search = search
  }



  return {
    filters,
    sortBy: searchParams.get('sortBy') as any,
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  }
}

function applyLeadFilters(query: any, filters?: LeadFilters) {
  if (!filters) return query

  // Apply status filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  // Apply connection status filters
  if (filters.connectionStatus && filters.connectionStatus.length > 0) {
    query = query.in('linkedin_connection_status', filters.connectionStatus)
  }

  // Apply account filters (from seat_info)
  if (filters.account) {
    query = query.contains('seat_info', { account: filters.account })
  }

  // Apply campaign filters (from campaign_info)
  if (filters.campaign) {
    query = query.contains('campaign_info', { name: filters.campaign })
  }

  // Apply date range
  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end)
  }

  // Apply search query
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
  }



  return query
}

function transformLeadData(lead: any) {
  const steps = Array.isArray(lead.steps) ? lead.steps : []
  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null

  // Calculate connection progress based on steps
  const connectionProgress = steps.length > 0 ?
    Math.round((steps.filter((s: any) => s.success).length / steps.length) * 100) : 0

  return {
    ...lead,
    lastStepAt: lastStep?.timestamp || null,
    totalSteps: steps.length,
    completedSteps: steps.filter((s: any) => s.success).length,
    failedSteps: steps.filter((s: any) => !s.success).length,
    connectionProgress,
    isActive: lead.status !== 'unsubscribed' && lead.linkedin_connection_status !== 'not_interested',
    // Remove campaign_leads since we don't have that table
    campaign_leads: []
  }
}

async function getLeadStats(organizationData: {id: string}): Promise<LeadStats> {
  try {
    // Get total leads count (all leads, not filtered by user)
    const { count: totalCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationData?.id)

    // Get leads by connection status (all leads, not filtered by user)
    const { data: connectionStatusData } = await supabaseAdmin
      .from('leads')
      .select('linkedin_connection_status')
      .eq('organization_id', organizationData?.id)

    // Get leads by source (all leads, not filtered by user)
    const { data: sourceData } = await supabaseAdmin
      .from('leads')
      .select('source')
      .eq('organization_id', organizationData?.id)

    // Get recent activity count (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: recentActivityCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationData?.id)
      .gte('updated_at', weekAgo.toISOString())

    // Get active automations (leads with steps)
    const { count: activeAutomationsCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationData?.id)
      .not('steps', 'eq', '[]')

    // Get new leads this week
    const { count: newThisWeekCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationData?.id)
      .gte('created_at', weekAgo.toISOString())

    // Get replied this week
    const { count: repliedThisWeekCount } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('linkedin_connection_status', 'replied')
      .eq('organization_id', organizationData?.id)
      .gte('updated_at', weekAgo.toISOString())

    // Process connection status counts
    const byConnectionStatus: Record<LinkedInConnectionStatus, number> = {
      'not_connected': 0,
      'pending': 0,
      'connected': 0,
      'replied': 0,
      'bounced': 0,
      'not_interested': 0
    }

    connectionStatusData?.forEach(lead => {
      const status = lead.linkedin_connection_status as LinkedInConnectionStatus
      if (status && byConnectionStatus.hasOwnProperty(status)) {
        byConnectionStatus[status]++
      }
    })

    // Process source counts
    const bySource: Record<string, number> = {}
    sourceData?.forEach(lead => {
      const source = lead.source || 'unknown'
      bySource[source] = (bySource[source] || 0) + 1
    })

    return {
      total: totalCount || 0,
      byConnectionStatus,
      bySource,
      recentActivity: recentActivityCount || 0,
      activeAutomations: activeAutomationsCount || 0,
      newThisWeek: newThisWeekCount || 0,
      repliedThisWeek: repliedThisWeekCount || 0
    }

  } catch (error) {
    console.error('Error getting lead stats:', error)
    throw error
  }
}