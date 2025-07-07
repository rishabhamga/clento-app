import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
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

    const userDbId = userData.id

    let query: any

    // If campaignId is provided, filter by campaign
    if (campaignId) {
      query = supabase
        .from('campaign_leads')
        .select(`
          *,
          leads(*)
        `)
        .eq('campaign_id', campaignId)
        .order('added_at', { ascending: false })
        .range(offset, offset + limit - 1)
    } else {
      // Get all leads for campaigns that belong to this user
      query = supabase
        .from('campaign_leads')
        .select(`
          *,
          leads(*),
          campaigns!inner(user_id)
        `)
        .eq('campaigns.user_id', userDbId)
        .order('added_at', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    const { data: campaignLeads, error: leadsError } = await query

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get total count
    let count: number | null = null
    let countError: any = null
    
    if (campaignId) {
      const countResult = await supabase
        .from('campaign_leads')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
      
      count = countResult.count
      countError = countResult.error
    } else {
      const countResult = await supabase
        .from('campaign_leads')
        .select('id, campaigns!inner(user_id)', { count: 'exact', head: true })
        .eq('campaigns.user_id', userDbId)
      
      count = countResult.count
      countError = countResult.error
    }

    if (countError) {
      console.error('Error fetching leads count:', countError)
    }

    // Extract leads from campaign_leads relationship
    const leads = campaignLeads?.map((cl: any) => cl.leads).filter(Boolean) || []

    return NextResponse.json({
      leads: leads,
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 