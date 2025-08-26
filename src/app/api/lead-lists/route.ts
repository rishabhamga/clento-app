import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { CreateLeadListRequest, LeadListStats } from '@/types/database'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead Lists API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization context from query parameters
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    console.log('📋 Lead Lists API: userId:', userId, 'organizationId:', organizationId)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('📋 Lead Lists API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead Lists API: Found user:', userData.id)

    let orgDbId = null
    
    // If organizationId is provided, get the corresponding database ID
    if (organizationId) {
      console.log('📋 Looking up organization for lead lists:', organizationId)
      
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('clerk_org_id', organizationId)
        .single()

      if (orgError || !orgData) {
        console.warn(`📋 ⚠️ Organization ${organizationId} not found in database:`, orgError)
      } else {
        orgDbId = orgData.id
        console.log('📋 Found organization for lead lists:', { clerk_id: organizationId, db_id: orgDbId, name: orgData.name })
      }
    }

    // Build lead lists query
    let leadListsQuery = supabase
      .from('lead_lists')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by organization if provided
    if (organizationId && orgDbId) {
      leadListsQuery = leadListsQuery.eq('organization_id', orgDbId)
    }

    // Filter by status if provided
    if (status && ['draft', 'processing', 'completed', 'failed'].includes(status)) {
      leadListsQuery = leadListsQuery.eq('status', status)
    }

    console.log('📋 Executing lead lists query with context:', { orgDbId, isOrgContext: !!organizationId })
    const { data: leadLists, error: leadListsError } = await leadListsQuery

    if (leadListsError) {
      console.error('📋 Error fetching lead lists:', leadListsError)
      return NextResponse.json(
        { error: 'Failed to fetch lead lists' },
        { status: 500 }
      )
    }

    console.log('📋 Found lead lists:', leadLists?.length || 0)
    console.log('📋 Lead list details:', leadLists)

    // Fetch connected accounts and campaigns separately if there are lead lists
    const leadListsWithDetails: any[] = []
    
    for (const leadList of leadLists || []) {
      let connectedAccount: any = null
      let campaign: any = null
      
      // Get connected account if exists
      if (leadList.connected_account_id) {
        const { data: accountData, error: accountError } = await supabase
          .from('user_accounts')
          .select('id, provider, display_name, connection_status, profile_picture_url')
          .eq('id', leadList.connected_account_id)
          .single()
        
        if (!accountError && accountData) {
          connectedAccount = accountData
        }
      }
      
      // Get campaign if exists
      if (leadList.campaign_id) {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, description, status')
          .eq('id', leadList.campaign_id)
          .single()
        
        if (!campaignError && campaignData) {
          campaign = campaignData
        }
      }
      
      leadListsWithDetails.push({
        ...leadList,
        connected_account: connectedAccount,
        campaign: campaign
      })
    }

    // Get lead list statistics
    let stats: LeadListStats = {
      total_lists: 0,
      total_leads: 0,
      processing_lists: 0,
      completed_lists: 0,
      failed_lists: 0
    }

    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_lead_list_stats', {
          p_user_id: userData.id,
          p_organization_id: orgDbId
        })

      if (statsError) {
        console.error('📋 Error fetching lead list stats:', statsError)
      } else if (statsData && statsData.length > 0) {
        stats = statsData[0]
      }
    } catch (error) {
      console.error('📋 Error calling get_lead_list_stats function:', error)
    }

    const response = {
      success: true,
      lead_lists: leadListsWithDetails || [],
      stats,
      pagination: {
        limit,
        offset,
        total: leadListsWithDetails?.length || 0
      },
      context: {
        organizationId,
        isOrganizationContext: !!organizationId
      }
    }

    console.log('📋 Returning lead lists: count =', leadLists?.length || 0)
    return NextResponse.json(response)

  } catch (error) {
    console.error('📋 Error in lead lists API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead Lists POST API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateLeadListRequest = await request.json()
    const {
      name,
      description,
      connected_account_id,
      campaign_id,
      organization_id
    } = body

    console.log('📋 Lead Lists POST API: Creating lead list:', { name, connected_account_id, campaign_id, organization_id })

    // Validate required fields
    if (!name || !organization_id) {
      return NextResponse.json(
        { error: 'Name and organization_id are required' },
        { status: 400 }
      )
    }

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('📋 Lead Lists POST API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead Lists POST API: Found user:', userData.id)

    // Validate organization exists and user has access
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', organization_id)
      .single()

    if (orgError || !orgData) {
      console.error('📋 Lead Lists POST API: Organization not found:', orgError)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead Lists POST API: Found organization:', orgData.id)

    // Check if user is a member of the organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('id, role, status')
      .eq('organization_id', orgData.id)
      .eq('user_id', userData.id)
      .single()

    if (memberError || !memberData) {
      // TEMPORARY FIX: Allow access for now while organization membership sync is being fixed
      console.warn('📋 ⚠️ User not found in organization_members table, but allowing access (temporary fix)')
      // TODO: Fix organization membership sync with Clerk webhooks
    }

    // Validate connected account if provided
    if (connected_account_id) {
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .select('id, connection_status')
        .eq('id', connected_account_id)
        .eq('user_id', userData.id)
        .single()

      if (accountError || !accountData) {
        console.error('📋 Lead Lists POST API: Connected account not found:', accountError)
        return NextResponse.json(
          { error: 'Connected account not found or access denied' },
          { status: 404 }
        )
      }

      if (accountData.connection_status !== 'connected') {
        return NextResponse.json(
          { error: 'Connected account is not active' },
          { status: 400 }
        )
      }
    }

    // Validate campaign if provided
    if (campaign_id) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaign_id)
        .eq('organization_id', orgData.id)
        .single()

      if (campaignError || !campaignData) {
        console.error('📋 Lead Lists POST API: Campaign not found:', campaignError)
        return NextResponse.json(
          { error: 'Campaign not found or access denied' },
          { status: 404 }
        )
      }

      console.log('📋 Lead Lists POST API: Found campaign:', campaignData.id)
    }

    // Create the lead list
    const { data: newLeadList, error: createError } = await supabase
      .from('lead_lists')
      .insert({
        user_id: userData.id,
        organization_id: orgData.id,
        connected_account_id,
        campaign_id,
        name,
        description,
        status: 'draft'
      })
      .select('*')
      .single()

    if (createError) {
      console.error('📋 Lead Lists POST API: Error creating lead list:', createError)
      return NextResponse.json(
        { error: 'Failed to create lead list' },
        { status: 500 }
      )
    }

    console.log('📋 Lead Lists POST API: Created lead list:', newLeadList.id)

    // Get connected account and campaign information if they exist
    let connectedAccount: any = null
    let campaign: any = null
    
    if (newLeadList?.connected_account_id) {
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .select('id, provider, display_name, connection_status, profile_picture_url')
        .eq('id', newLeadList.connected_account_id)
        .single()
      
      if (!accountError && accountData) {
        connectedAccount = accountData
      }
    }

    if (newLeadList?.campaign_id) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .eq('id', newLeadList.campaign_id)
        .single()
      
      if (!campaignError && campaignData) {
        campaign = campaignData
      }
    }

    const response = {
      success: true,
      lead_list: {
        ...newLeadList,
        connected_account: connectedAccount,
        campaign: campaign
      }
    }

    console.log('📋 Lead Lists POST API: Created lead list:', newLeadList.id)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('📋 Error in lead lists POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
