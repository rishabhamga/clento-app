import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Validate campaignId format
    if (!isValidUUID(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID format' },
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
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userData.id)
      .single()

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get campaign leads stats
    const { data: leadsData, error: leadsError } = await supabase
      .from('campaign_leads')
      .select('status')
      .eq('campaign_id', campaignId)

    if (leadsError) {
      console.error('Error fetching campaign leads stats:', leadsError)
      // Continue without leads stats rather than failing
    }

    // Calculate lead statistics
    const totalLeads = leadsData?.length || 0
    const leadsStatusCount = leadsData?.reduce((acc: any, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get sequence steps stats
    const { data: stepsData, error: stepsError } = await supabase
      .from('sequence_steps')
      .select('status')
      .eq('campaign_id', campaignId)

    if (stepsError) {
      console.error('Error fetching sequence steps stats:', stepsError)
    }

    const stepsStatusCount = stepsData?.reduce((acc: any, step: any) => {
      acc[step.status] = (acc[step.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get messages stats - fix the UUID error by ensuring proper query
    let messagesStatusCount = {}
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('status')
        .eq('campaign_id', campaignId)

      if (messagesError) {
        console.error('Error fetching messages stats:', messagesError)
      } else {
        messagesStatusCount = messagesData?.reduce((acc: any, message: any) => {
          acc[message.status] = (acc[message.status] || 0) + 1
          return acc
        }, {}) || {}
      }
    } catch (error) {
      console.error('Error fetching messages stats:', error)
    }

    // Calculate progress metrics
    const completionPercentage = totalLeads > 0 
      ? Math.round(((leadsStatusCount.contacted || 0) + (leadsStatusCount.replied || 0) + (leadsStatusCount.converted || 0)) / totalLeads * 100)
      : 0

    const responseRate = (leadsStatusCount.contacted || 0) > 0 
      ? Math.round(((leadsStatusCount.replied || 0) + (leadsStatusCount.converted || 0)) / (leadsStatusCount.contacted || 0) * 100)
      : 0

    // Get recent activity - limit to last 10 activities
    let recentActivity: any[] = []
    let activityWithLeadDetails: any[] = []
    
    try {
      const { data: recentActivityData, error: activityError } = await supabase
        .from('sequence_steps')
        .select('*, lead_id')
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(10)

      if (activityError) {
        console.error('Error fetching recent activity:', activityError)
      } else {
        recentActivity = recentActivityData || []
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }

    // Get lead details for recent activity
    if (recentActivity && recentActivity.length > 0) {
      const leadIds = recentActivity.map(activity => activity.lead_id).filter(Boolean)
      
      if (leadIds.length > 0) {
        try {
          const { data: leads, error: leadsDetailError } = await supabase
            .from('leads')
            .select('id, full_name, email, company, title')
            .in('id', leadIds)
          
          if (leadsDetailError) {
            console.error('Error fetching lead details:', leadsDetailError)
          } else if (leads) {
            activityWithLeadDetails = recentActivity.map(activity => {
              const lead = leads.find(l => l.id === activity.lead_id)
              return {
                ...activity,
                lead
              }
            })
          }
        } catch (error) {
          console.error('Error fetching lead details:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
      progress: {
        totalLeads,
        completionPercentage,
        responseRate,
        leadsByStatus: leadsStatusCount,
        stepsByStatus: stepsStatusCount,
        messageStats: messagesStatusCount,
        startDate: campaign.created_at,
        lastActivity: campaign.updated_at,
        recentActivity: activityWithLeadDetails
      }
    })

  } catch (error) {
    console.error('Error in campaign progress API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, status, settings } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
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
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if campaign exists and belongs to user
    const { data: existingCampaign, error: checkError } = await supabase
      .from('campaigns')
      .select('id, settings, status')
      .eq('id', campaignId)
      .eq('user_id', userData.id)
      .single()

    if (checkError || !existingCampaign) {
      console.error('Error checking campaign:', checkError)
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    // Update status if provided
    if (status) {
      updateData.status = status
      
      // If activating a campaign that was paused or draft, update sequence steps
      if (status === 'active' && (existingCampaign.status === 'paused' || existingCampaign.status === 'draft')) {
        // Update sequence steps that are pending to scheduled
        const { error: updateStepsError } = await supabase
          .from('sequence_steps')
          .update({ status: 'scheduled' })
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
        
        if (updateStepsError) {
          console.error('Error updating sequence steps:', updateStepsError)
        }
        
        // Add startedAt timestamp to settings if not already present
        if (!existingCampaign.settings.startedAt) {
          if (!updateData.settings) {
            updateData.settings = { ...existingCampaign.settings }
          }
          updateData.settings.startedAt = new Date().toISOString()
        }
      }
      
      // If pausing an active campaign, update sequence steps
      if (status === 'paused' && existingCampaign.status === 'active') {
        // Update scheduled steps to pending
        const { error: pauseStepsError } = await supabase
          .from('sequence_steps')
          .update({ status: 'pending' })
          .eq('campaign_id', campaignId)
          .eq('status', 'scheduled')
        
        if (pauseStepsError) {
          console.error('Error pausing sequence steps:', pauseStepsError)
        }
        
        // Add pausedAt timestamp to settings
        if (!updateData.settings) {
          updateData.settings = { ...existingCampaign.settings }
        }
        updateData.settings.pausedAt = new Date().toISOString()
      }
    }
    
    // Update settings if provided
    if (settings) {
      // Merge with existing settings
      updateData.settings = {
        ...(existingCampaign.settings || {}),
        ...settings
      }
    }

    // Only update if we have data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to apply'
      })
    }

    // Update campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      message: 'Campaign updated successfully'
    })

  } catch (error) {
    console.error('Error in campaign progress API:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 