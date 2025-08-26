import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead List [id] API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('📋 Lead List [id] API: userId:', userId, 'leadListId:', id)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('📋 Lead List [id] API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead List [id] API: Found user:', userData.id)

    // Fetch the specific lead list
    const { data: leadList, error: leadListError } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userData.id)
      .single()

    if (leadListError || !leadList) {
      console.error('📋 Lead List [id] API: Error fetching lead list:', leadListError)
      return NextResponse.json(
        { error: 'Lead list not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead List [id] API: Found lead list:', leadList.id)

    // Get connected account if exists
    let connectedAccount: any = null
    if (leadList.connected_account_id) {
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .select('id, provider, display_name, connection_status, profile_picture_url')
        .eq('id', leadList.connected_account_id)
        .single()
      
      if (!accountError && accountData) {
        connectedAccount = accountData
        console.log('📋 Lead List [id] API: Found connected account:', accountData.id)
      }
    }
    
    // Get campaign if exists
    let campaign: any = null
    if (leadList.campaign_id) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .eq('id', leadList.campaign_id)
        .single()
      
      if (!campaignError && campaignData) {
        campaign = campaignData
        console.log('📋 Lead List [id] API: Found campaign:', campaignData.id)
      }
    }

    // Fetch recent leads for this lead list
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_list_id', id)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(10) // Get last 10 leads

    if (leadsError) {
      console.error('📋 Lead List [id] API: Error fetching leads:', leadsError)
    } else {
      console.log('📋 Lead List [id] API: Found leads:', recentLeads?.length || 0)
    }

    const response = {
      success: true,
      lead_list: {
        ...leadList,
        connected_account: connectedAccount,
        campaign: campaign,
        recent_leads: recentLeads || []
      }
    }

    console.log('📋 Lead List [id] API: Returning lead list:', leadList.id, 'with', recentLeads?.length || 0, 'recent leads')
    return NextResponse.json(response)

  } catch (error) {
    console.error('📋 Error in lead list [id] API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead List [id] PUT API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    console.log('📋 Lead List [id] PUT API: userId:', userId, 'leadListId:', id, 'body:', body)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('📋 Lead List [id] PUT API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead List [id] PUT API: Found user:', userData.id)

    // Update the lead list
    const { data: updatedLeadList, error: updateError } = await supabase
      .from('lead_lists')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userData.id)
      .select()
      .single()

    if (updateError || !updatedLeadList) {
      console.error('📋 Lead List [id] PUT API: Error updating lead list:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead list or access denied' },
        { status: updateError?.code === 'PGRST116' ? 404 : 500 }
      )
    }

    console.log('📋 Lead List [id] PUT API: Updated lead list:', updatedLeadList.id)

    // Get connected account if exists
    let connectedAccount: any = null
    if (updatedLeadList.connected_account_id) {
      const { data: accountData, error: accountError } = await supabase
        .from('user_accounts')
        .select('id, provider, display_name, connection_status, profile_picture_url')
        .eq('id', updatedLeadList.connected_account_id)
        .single()
      
      if (!accountError && accountData) {
        connectedAccount = accountData
      }
    }
    
    // Get campaign if exists
    let campaign: any = null
    if (updatedLeadList.campaign_id) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, description, status')
        .eq('id', updatedLeadList.campaign_id)
        .single()
      
      if (!campaignError && campaignData) {
        campaign = campaignData
      }
    }

    const response = {
      success: true,
      lead_list: {
        ...updatedLeadList,
        connected_account: connectedAccount,
        campaign: campaign
      }
    }

    console.log('📋 Lead List [id] PUT API: Updated lead list:', updatedLeadList.id)
    return NextResponse.json(response)

  } catch (error) {
    console.error('📋 Error in lead list [id] PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead List [id] DELETE API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('📋 Lead List [id] DELETE API: userId:', userId, 'leadListId:', id)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('📋 Lead List [id] DELETE API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead List [id] DELETE API: Found user:', userData.id)

    // Delete the lead list
    const { error: deleteError } = await supabase
      .from('lead_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.id)

    if (deleteError) {
      console.error('📋 Lead List [id] DELETE API: Error deleting lead list:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete lead list' },
        { status: 500 }
      )
    }

    console.log('📋 Lead List [id] DELETE API: Successfully deleted lead list:', id)

    return NextResponse.json({
      success: true,
      message: 'Lead list deleted successfully'
    })

  } catch (error) {
    console.error('📋 Error in lead list [id] DELETE API:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
