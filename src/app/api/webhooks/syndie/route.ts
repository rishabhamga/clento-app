import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import {
  SyndieWebhookPayload,
  WebhookProcessingResult,
  LinkedInConnectionStatus,
  SyndieLeadStep,
  SyndieCampaignInfo,
  SyndieSeatInfo
} from '@/types/syndie'
import { Database } from '@/types/database'
import { entryToCrm } from '../../../../lib/utils'

// Environment variables for webhook validation
const SYNDIE_WEBHOOK_SECRET = process.env.SYNDIE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  try {
    console.log('Syndie webhook received')

    // Optional: Verify webhook signature if Syndie provides one
    if (SYNDIE_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-syndie-signature')
      // Implement signature verification here based on Syndie's documentation
      // This is a placeholder for the actual verification logic
      if (!signature) {
        console.error('Missing Syndie webhook signature')
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        )
      }
    }

    // Parse the webhook payload
    const payload: SyndieWebhookPayload = await req.json()
    console.log('full request', JSON.stringify(payload));
    console.log('Syndie webhook payload received:', {
      id: payload.id,
      connectionStatus: payload.connectionStatus,
      stepsCount: payload.steps?.length || 0
    })

    // Validate required fields
    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          operation: 'error',
          message: 'Missing required field: id',
          errors: ['id is required']
        } as WebhookProcessingResult,
        { status: 400 }
      )
    }

    // Process the webhook
    const result = await processLeadWebhook(payload)

    // Return success response
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    })

  } catch (error) {
    console.error('Error processing Syndie webhook:', error)

    const errorResult: WebhookProcessingResult = {
      success: false,
      operation: 'error',
      message: 'Internal server error processing webhook',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}

async function processLeadWebhook(payload: SyndieWebhookPayload): Promise<WebhookProcessingResult> {
  try {
    // Check if lead already exists by syndie_lead_id
    const { data: existingLead, error: queryError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('syndie_lead_id', payload.id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new leads
      throw new Error(`Error querying existing lead: ${queryError.message}`)
    }

    // Find campaign where syndie_campaign_ids array contains the payload.campaign.id
    const { data: clentoCampaign, error: clentoCampaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, organization_id')
      .contains('syndie_campaign_ids', [payload.campaign?.id])
      .single()

    const leadData = mapSyndiePayloadToLead(payload, existingLead, clentoCampaign?.id, clentoCampaign?.organization_id)

    let result: WebhookProcessingResult

    if (existingLead) {
      // Update existing lead
      if(leadData.linkedin_connection_status === "replied"){
          if(existingLead.crm_entry === 0){
              await entryToCrm({ companyName: leadData.company || undefined, firstName: leadData.full_name?.split(" ")[0], lastName: leadData.full_name?.split(" ")[1], email: leadData.email || "not nope", source: "SYNDIE_REPLY", linkedIn: leadData.linkedin_url || undefined })
              await supabaseAdmin
                .from('leads')
                .update({ crm_entry: 1 })
                .eq('syndie_lead_id', payload.id)
                .select()
                .single()
          }
      }
      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('leads')
        .update(leadData)
        .eq('syndie_lead_id', payload.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Error updating lead: ${updateError.message}`)
      }

      result = {
        success: true,
        leadId: updatedLead.id,
        operation: 'updated',
        message: `Lead ${payload.firstName} ${payload.lastName} updated successfully`
      }

      console.log('Lead updated:', { leadId: updatedLead.id, syndieId: payload.id })

    } else {
      // Create new lead - we need to find the user_id
      // For now, we'll use a placeholder approach where we try to match by campaign info
      // In production, you might need a different strategy to associate leads with users

      // Try to find user by campaign info or implement your user association logic
      const userId = await findUserForLead(payload)

      if (!userId) {
        throw new Error('Unable to determine user for lead - no user association strategy implemented')
      }

      const newLeadData = {
        ...leadData,
        // user_id: userId, //This breaks -- yash
      }

      if(leadData.linkedin_connection_status === "replied"){
              await entryToCrm({ companyName: leadData.company || undefined, firstName: leadData.full_name?.split(" ")[0], lastName: leadData.full_name?.split(" ")[1], email: leadData.email || "not nope", source: "SYNDIE_REPLY", linkedIn: leadData.linkedin_url || undefined })
              await supabaseAdmin
                .from('leads')
                .update({ crm_entry: 1 })
                .eq('syndie_lead_id', payload.id);
      }

      const { data: newLead, error: insertError } = await supabaseAdmin
        .from('leads')
        .insert(newLeadData)
        .select()
        .single()

      if (insertError) {
        throw new Error(`Error creating lead: ${insertError.message}`)
      }

      result = {
        success: true,
        leadId: newLead.id,
        operation: 'created',
        message: `Lead ${payload.firstName} ${payload.lastName} created successfully`
      }

      console.log('Lead created:', { leadId: newLead.id, syndieId: payload.id })
    }

    return result

  } catch (error) {
    console.error('Error processing lead webhook:', error)
    return {
      success: false,
      operation: 'error',
      message: 'Failed to process lead webhook',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

function mapSyndiePayloadToLead(
  payload: SyndieWebhookPayload,
  existingLead?: any,
  clentoCampaignId?: string,
  clentoOrgId?: string
): Partial<Database['public']['Tables']['leads']['Update']> {

  // Map Syndie payload to our lead structure
  const leadData: Partial<Database['public']['Tables']['leads']['Update']> = {
    // Basic lead information
    full_name: `${payload.firstName} ${payload.lastName}`.trim(),
    email: payload.email || null,
    linkedin_url: payload.linkedinUrl || null,
    company: payload.company || null,
    title: payload.headline || null,
    location: payload.location || null,
    phone: payload.phone || null,
    source: 'syndie',
    syndie_campaign_id: payload.campaign?.id || null,
    clento_campaign_id: clentoCampaignId || null,
    organization_id: clentoOrgId,

    // Syndie-specific fields
    syndie_lead_id: payload.id,
    linkedin_connection_status: payload.connectionStatus,
    steps: (payload.steps || []) as unknown as Record<string, unknown>[],
    campaign_info: payload.campaign ? {
      id: payload.campaign.id,
      name: payload.campaign.name,
      description: payload.campaign.description,
      status: payload.campaign.status,
    } : {},
    seat_info: payload.campaign?.seat ? {
      id: payload.campaign.seat.id,
      providerId: payload.campaign.seat.providerId,
      firstName: payload.campaign.seat.firstName,
      lastName: payload.campaign.seat.lastName,
      publicIdentifier: payload.campaign.seat.publicIdentifier,
      accountType: payload.campaign.seat.accountType,
    } : {},

    // Metadata
    updated_at: new Date().toISOString(),
  }

  // Only set created_at for new leads
  if (!existingLead) {
    leadData.created_at = payload.createdAt || new Date().toISOString()
  }

  // Merge steps with existing steps if updating
  if (existingLead && existingLead.steps && Array.isArray(existingLead.steps)) {
    const existingSteps = existingLead.steps as SyndieLeadStep[]
    const newSteps = payload.steps || []

    // Combine and deduplicate steps by stepNodeId + timestamp
    const allSteps = [...existingSteps, ...newSteps]
    const uniqueSteps = allSteps.filter((step, index, self) =>
      index === self.findIndex(s =>
        s.stepNodeId === step.stepNodeId && s.timestamp === step.timestamp
      )
    )

    leadData.steps = uniqueSteps.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) as unknown as Record<string, unknown>[]
  }

  return leadData
}

async function findUserForLead(payload: SyndieWebhookPayload): Promise<string | null> {
  // TODO: Implement user association strategy
  // This is where you would implement logic to determine which user this lead belongs to
  // Options:
  // 1. Use campaign info to match with existing campaigns
  // 2. Use seat info to match with LinkedIn accounts
  // 3. Use a default user for all Syndie leads
  // 4. Use organization mapping

  try {
    // Example strategy 1: Find user by matching campaign name or other criteria
    if (payload.campaign?.name) {
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('user_id')
        .ilike('name', `%${payload.campaign.name}%`)
        .limit(1)
        .single()

      if (campaign) {
        return campaign.user_id
      }
    }

    // Example strategy 2: Use the first user as default (for development)
    // In production, you should implement proper user association
    const { data: defaultUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .single()

    return defaultUser?.id || null

  } catch (error) {
    console.error('Error finding user for lead:', error)
    return null
  }
}

// Optional: Add GET method for webhook verification if needed by Syndie
export async function GET(req: NextRequest) {
  // Some webhook providers require GET endpoint verification
  const challenge = req.nextUrl.searchParams.get('challenge')

  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({
    message: 'Syndie webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}