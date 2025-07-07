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

// Helper function to normalize lead data for campaign creation
function normalizeCampaignLead(lead: any): {
  external_id: string
  first_name: string | null
  last_name: string | null
  full_name: string
  email: string
  phone: string | null
  title: string | null
  company: string
  industry: string | null
  location: string | null
  linkedin_url: string | null
  employee_count: number | null
  revenue: number | null
  source: string
  verified: boolean
  confidence: number
  technologies: any
} {
  const firstName = lead.firstName || lead.first_name || ''
  const lastName = lead.lastName || lead.last_name || ''
  const fullName = lead.full_name || 
    (firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown')
  
  // Generate a unique external_id if not provided
  const externalId = lead.id || 
    `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    external_id: externalId,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: fullName,
    email: lead.email || '',
    phone: lead.phone || null,
    title: lead.title || null,
    company: lead.company || 'Unknown',
    industry: lead.industry || null,
    location: lead.location || null,
    linkedin_url: lead.linkedinUrl || lead.linkedin_url || lead.linkedin || null,
    employee_count: lead.employeeCount || lead.employee_count || null,
    revenue: lead.revenue || null,
    source: lead.source || lead.data_source || 'campaign',
    verified: lead.verified || false,
    confidence: lead.confidence || 1.0,
    technologies: Array.isArray(lead.technologies) ? lead.technologies : []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      campaignName,
      targeting,
      pitch,
      outreach,
      workflow,
      launch,
      selectedLeads,
      organizationId
    } = await request.json()

    // Validate required fields
    if (!campaignName?.trim()) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
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

    const userDbId = userData.id

    // Get organization ID if organizationId is provided
    let orgDbId = null
    if (organizationId) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', organizationId)
        .maybeSingle() // Use maybeSingle() to handle cases where no organization is found

      if (orgError) {
        console.error('Error fetching organization:', orgError)
        // Don't return error - just log it and continue without organization
        console.log('Continuing campaign creation without organization context')
      } else if (orgData) {
        orgDbId = orgData.id
      } else {
        console.log(`Organization with clerk_org_id ${organizationId} not found in database. Creating campaign without organization context.`)
      }
    }

    // Create the campaign with all settings from the launch page
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([{
        user_id: userDbId,
        organization_id: orgDbId,
        name: campaignName,
        description: pitch?.offeringDescription || '',
        status: launch?.autopilot ? 'active' : 'draft',
        sequence_template: workflow?.templateId || 'custom',
        settings: {
          autopilot: launch?.autopilot || false,
          dailyLimit: launch?.dailyLimit || 50,
          timezone: launch?.timezone || 'UTC',
          startDate: launch?.startDate || new Date().toISOString().split('T')[0],
          reviewRequired: launch?.reviewRequired !== false,
          trackingEnabled: launch?.trackingEnabled !== false,
          doNotContact: launch?.doNotContact || [],
          targeting,
          pitch,
          outreach,
          workflow,
          totalLeads: selectedLeads?.length || 0,
          leadCount: 0,
          startedAt: launch?.autopilot ? new Date().toISOString() : null,
          // Store additional campaign metadata
          campaignType: targeting?.source || 'b2b',
          industry: targeting?.industry || null,
          country: targeting?.country || 'US',
          language: outreach?.campaignLanguage || 'English (United States)'
        }
      }])
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign', details: campaignError.message },
        { status: 500 }
      )
    }

    let leadsProcessed = 0
    let leadsErrors: Array<{lead: any, error: string}> = []

    // Add selected leads to the campaign
    if (selectedLeads && selectedLeads.length > 0 && campaign) {
      // Normalize and validate leads
      const normalizedLeads = selectedLeads.map(normalizeCampaignLead)
      
      // Use the new upsert_lead function for each lead
      const insertedLeadIds: string[] = []
      
      for (const lead of normalizedLeads) {
        try {
          const { data: leadId, error: leadError } = await supabase
            .rpc('upsert_lead', {
              p_external_id: lead.external_id,
              p_first_name: lead.first_name,
              p_last_name: lead.last_name,
              p_full_name: lead.full_name,
              p_email: lead.email,
              p_phone: lead.phone,
              p_title: lead.title,
              p_company: lead.company,
              p_industry: lead.industry,
              p_location: lead.location,
              p_linkedin_url: lead.linkedin_url,
              p_employee_count: lead.employee_count,
              p_revenue: lead.revenue,
              p_source: lead.source,
              p_verified: lead.verified,
              p_confidence: lead.confidence,
              p_technologies: lead.technologies
            })

          if (leadError) {
            console.error('Error upserting lead:', leadError)
            leadsErrors.push({ lead: lead.external_id, error: leadError.message })
          } else {
            insertedLeadIds.push(leadId)
          }
        } catch (error) {
          console.error('Error processing lead:', error)
          leadsErrors.push({ 
            lead: lead.external_id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      // Associate successfully inserted leads with the campaign
      for (const leadId of insertedLeadIds) {
        try {
          const { data: associationId, error: associationError } = await supabase
            .rpc('associate_lead_with_campaign', {
              p_campaign_id: campaign.id,
              p_lead_id: leadId,
              p_assigned_by: userId
            })

          if (associationError) {
            console.error('Error associating lead with campaign:', associationError)
            leadsErrors.push({ 
              lead: leadId, 
              error: `Association failed: ${associationError.message}` 
            })
          } else {
            leadsProcessed++
          }
        } catch (error) {
          console.error('Error processing campaign association:', error)
          leadsErrors.push({ 
            lead: leadId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      }

      // If workflow steps are defined, create sequence steps for each successfully associated lead
      if (workflow?.customSteps && workflow.customSteps.length > 0 && insertedLeadIds.length > 0) {
        const sequenceSteps: any[] = []
        
        for (const leadId of insertedLeadIds) {
          for (let i = 0; i < workflow.customSteps.length; i++) {
            const step = workflow.customSteps[i]
            const sendDate = new Date()
            
            // Add delay in days to the send date
            if (step.delay) {
              sendDate.setDate(sendDate.getDate() + step.delay)
            }
            
            // Map workflow channel to database-allowed channel
            let dbChannel = step.channel || 'email'
            if (step.channel === 'linkedin') {
              if (step.actionType === 'connect') {
                dbChannel = 'linkedin_invite'
              } else if (step.actionType === 'message') {
                dbChannel = 'linkedin_message'
              } else {
                dbChannel = 'linkedin'
              }
            }

            sequenceSteps.push({
              campaign_id: campaign.id,
              lead_id: leadId,
              step_number: i + 1,
              channel: dbChannel,
              status: launch?.autopilot ? 'scheduled' : 'pending',
              send_time: sendDate.toISOString(),
              payload: {
                template: step.template,
                subject: step.subject,
                personalized: outreach?.messagePersonalization !== false,
                tone: outreach?.toneOfVoice || 'Professional',
                callToAction: step.callToAction || (outreach?.callsToAction && outreach.callsToAction[0]) || null,
                signOff: outreach?.signOffs && outreach.signOffs[0] || 'Best',
                coaching: outreach?.coachingPoints || []
              }
            })
          }
        }
        
        if (sequenceSteps.length > 0) {
          const { error: stepsError } = await supabase
            .from('sequence_steps')
            .insert(sequenceSteps)
            
          if (stepsError) {
            console.error('Error creating sequence steps:', stepsError)
            // Don't fail the campaign creation for sequence step errors
          }
        }
      }
    }

    // Update campaign with actual lead count
    if (leadsProcessed > 0) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          settings: {
            ...campaign.settings,
            leadCount: leadsProcessed,
            totalLeads: leadsProcessed
          }
        })
        .eq('id', campaign.id)

      if (updateError) {
        console.error('Error updating campaign lead count:', updateError)
      }
    }

    // Clean up campaign draft if it exists
    if (campaignName) {
      await supabase
        .from('campaign_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('campaign_name', campaignName)
    }

    const response = {
      success: true,
      campaign: {
        ...campaign,
        leadsProcessed,
        leadsErrors: leadsErrors.length
      },
      summary: {
        totalLeads: selectedLeads?.length || 0,
        processedLeads: leadsProcessed,
        errorCount: leadsErrors.length
      },
      errors: leadsErrors.length > 0 ? leadsErrors : undefined
    }

    return NextResponse.json(response, { 
      status: leadsErrors.length > 0 ? 207 : 200 
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}