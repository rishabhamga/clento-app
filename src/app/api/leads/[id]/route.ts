import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { LeadWithSyndieData, LeadActivityTimeline, StepTimelineItem } from '@/types/syndie'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params

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

    // Fetch the specific lead with all related data
    // Note: Showing all leads regardless of user, organization, or campaign
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError)
      return NextResponse.json(
        { error: 'Lead not found or access denied' },
        { status: 404 }
      )
    }

    // Transform the lead data
    const transformedLead = transformDetailedLeadData(lead)

    // Generate activity timeline
    const timeline = generateActivityTimeline(lead)

    return NextResponse.json({
      success: true,
      data: {
        lead: transformedLead,
        timeline
      }
    })

  } catch (error) {
    console.error('Error fetching lead details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params

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

    // Remove fields that shouldn't be updated directly
    delete updateData.id
    delete updateData.user_id
    delete updateData.created_at

    // Update the lead
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select('*')
      .single()

    if (updateError || !updatedLead) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead or lead not found' },
        { status: updateError?.code === 'PGRST116' ? 404 : 500 }
      )
    }

    const transformedLead = transformDetailedLeadData(updatedLead)
    const timeline = generateActivityTimeline(updatedLead)

    return NextResponse.json({
      success: true,
      data: {
        lead: transformedLead,
        timeline
      },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params

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

    // Delete the lead (this will cascade to related records)
    const { error: deleteError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (deleteError) {
      console.error('Error deleting lead:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function transformDetailedLeadData(lead: any): LeadWithSyndieData {
  const steps = Array.isArray(lead.steps) ? lead.steps : []
  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null
  
  // Calculate next step due date (this would depend on your automation logic)
  const nextStepDue = calculateNextStepDue(steps, lead.linkedin_connection_status)
  
  return {
    ...lead,
    lastStepAt: lastStep?.timestamp || null,
    nextStepDue,
    totalSteps: steps.length,
    completedSteps: steps.filter((s: any) => s.success).length,
    failedSteps: steps.filter((s: any) => !s.success).length,
    isActive: lead.status !== 'unsubscribed' && lead.linkedin_connection_status !== 'not_interested',
    connectionProgress: calculateConnectionProgress(lead.linkedin_connection_status)
  }
}

function generateActivityTimeline(lead: any): LeadActivityTimeline {
  const steps = Array.isArray(lead.steps) ? lead.steps : []
  
  console.log('🔍 Lead Steps Raw Data:', JSON.stringify(steps, null, 2))
  
  // Convert steps to timeline items
  const stepItems: StepTimelineItem[] = steps.map((step: any, index: number) => {
    const timelineItem = {
      id: `step-${index}`,
      stepType: step.stepType || 'automation',
      timestamp: step.timestamp,
      success: step.success,
      title: getStepTitle(step),
      description: getStepDescription(step),
      details: step.details,
      errorMessage: step.errorMessage
    }
    
    console.log('🔍 Generated Timeline Item:', JSON.stringify(timelineItem, null, 2))
    
    return timelineItem
  })

  // Sort timeline items by timestamp
  const allItems = stepItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const lastActivity = allItems.length > 0 ? allItems[allItems.length - 1].timestamp : undefined

  return {
    leadId: lead.id,
    steps: allItems,
    totalSteps: steps.length,
    completedSteps: steps.filter((s: any) => s.success).length,
    failedSteps: steps.filter((s: any) => !s.success).length,
    lastActivity
  }
}

function calculateConnectionProgress(connectionStatus: string): number {
  const progressMap: Record<string, number> = {
    'not_connected': 0,
    'pending': 25,
    'connected': 50,
    'replied': 100,
    'bounced': 0,
    'not_interested': 0
  }
  
  return progressMap[connectionStatus] || 0
}

function calculateNextStepDue(steps: any[], connectionStatus: string): string | undefined {
  // This is a placeholder - implement based on your automation logic
  if (connectionStatus === 'connected' || connectionStatus === 'pending') {
    const lastStep = steps[steps.length - 1]
    if (lastStep) {
      const lastDate = new Date(lastStep.timestamp)
      const nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
      return nextDate.toISOString()
    }
  }
  
  return undefined
}

function getStepTitle(step: any): string {
  const actionMap: Record<string, string> = {
    'linkedin_invite': 'LinkedIn Connection Request',
    'linkedin_message': 'LinkedIn Message',
    'linkedin_reply_received': 'LinkedIn Reply Received',
    'linkedin_connection_accepted': 'LinkedIn Connection Accepted',
    'email': 'Email Sent',
    'follow_up': 'Follow-up Action',
    'profile_view': 'Profile Viewed',
    'linkedin_reply': 'LinkedIn Reply Received'
  }
  
  // Check step.action first, then step.details.action, then stepType
  const action = step.action || step.details?.action || step.stepType
  
  return actionMap[action] || step.stepType || 'Automation Step'
}

function getStepDescription(step: any): string {
  if (step.success) {
    // For replies, show the actual message content
    if (step.details?.message) {
      return `"${step.details.message}"`
    }
    // For other actions, show the response or default
    return step.response || 'Step completed successfully'
  } else {
    return step.errorMessage || 'Step failed'
  }
}

