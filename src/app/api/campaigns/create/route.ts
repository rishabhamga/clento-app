import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { saveWorkflowToGCS } from '@/lib/services/workflow-storage'
import { FlowData } from '@/components/workflow/types/WorkflowTypes'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to sync missing organization from Clerk to database
async function syncMissingOrganization(clerkOrgId: string, userId: string) {
  try {
    console.log(`🔄 Attempting to sync missing organization: ${clerkOrgId}`)

    // Get organization data from Clerk
    const clerk = await clerkClient()
    const organization = await clerk.organizations.getOrganization({
      organizationId: clerkOrgId
    })

    if (!organization) {
      console.error(`❌ Organization ${clerkOrgId} not found in Clerk`)
      return null
    }

    // Create organization using the database function
    const { data: orgId, error } = await supabase
      .rpc('create_organization_with_admin', {
        p_clerk_org_id: organization.id,
        p_name: organization.name,
        p_slug: organization.slug,
        p_user_clerk_id: userId,
        p_logo_url: organization.imageUrl || null,
        p_website_url: null
      })

    if (error) {
      console.error('❌ Error creating organization in database:', error)
      return null
    }

    console.log(`✅ Successfully synced organization ${clerkOrgId} with database ID: ${orgId}`)
    return orgId
  } catch (error) {
    console.error(`❌ Error syncing organization ${clerkOrgId}:`, error)
    return null
  }
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
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
      organizationId,
      leadListId
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
        // Organization not found in database, try to sync from Clerk
        console.warn(`⚠️ Organization ${organizationId} not found in database, attempting to sync from Clerk...`)

        const syncedOrgId = await syncMissingOrganization(organizationId, userId)

        if (syncedOrgId) {
          orgDbId = syncedOrgId
          console.log(`✅ Organization ${organizationId} successfully synced with ID: ${syncedOrgId}`)
        } else {
          console.warn(`⚠️ Failed to sync organization ${organizationId}, creating campaign without organization context`)
        }
      }
    }

    // Save workflow to Google Cloud Storage if workflow data exists
    let workflowFileName: string | null = null;
    if (workflow?.flowData && Object.keys(workflow.flowData).length > 0) {
      console.log('💾 Saving workflow to Google Cloud Storage...');

      const workflowData: FlowData = workflow.flowData;
      const storageResult = await saveWorkflowToGCS(workflowData);

      if (storageResult.success) {
        workflowFileName = storageResult.fileName || null;
        console.log('✅ Workflow saved to GCS:', workflowFileName);
      } else {
        console.error('❌ Failed to save workflow to GCS:', storageResult.error);
        // Continue with campaign creation but log the error
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
        workflow_json_file: workflowFileName, // Store GCS file path
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
          workflow, // Keep for backward compatibility
          startedAt: launch?.autopilot ? new Date().toISOString() : null,
          // Store additional campaign metadata
          campaignType: targeting?.searchType || 'b2b',
          industry: targeting?.filters?.industries?.[0] || null,
          country: targeting?.filters?.locations?.[0] || 'US',
          language: outreach?.campaignLanguage || 'English (United States)'
        },
        lead_list_id: leadListId
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

    // Clean up campaign draft if it exists
    if (campaignName) {
      await supabase
        .from('campaign_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('campaign_name', campaignName)
    }

    console.log('✅ Campaign created successfully:', {
      id: campaign.id,
      name: campaign.name,
      targeting: targeting?.searchType || 'unknown',
      filtersApplied: Object.keys(targeting?.filters || {}).length
    })

    const response = {
      success: true,
      campaign: {
        ...campaign,
        targeting: targeting
      },
      message: 'Campaign created successfully with targeting filters'
    }

    return NextResponse.json(response, { status: 200 })

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