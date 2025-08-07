import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization context from query parameters
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

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

    let orgDbId = null
    
    // If organizationId is provided, get the corresponding database ID
    if (organizationId) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', organizationId)
        .single()

      if (orgError || !orgData) {
        // Only log as warning, not error, since this is expected for new organizations
        console.warn(`⚠️ Organization ${organizationId} not found in database, attempting to sync from Clerk...`)
        
        // Try to sync the missing organization from Clerk
        const syncedOrgId = await syncMissingOrganization(organizationId, userId)
        
        if (syncedOrgId) {
          orgDbId = syncedOrgId
          console.log(`✅ Organization ${organizationId} successfully synced with ID: ${syncedOrgId}`)
        } else {
          console.warn(`⚠️ Failed to sync organization ${organizationId}, using personal context`)
        }
      } else {
        orgDbId = orgData.id
      }
    }

    // Build campaign query based on organization context
    let campaignQuery = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId && orgDbId) {
      // Organization context: show organization campaigns
      campaignQuery = campaignQuery.eq('organization_id', orgDbId)
    } else {
      // Personal context: show personal campaigns (null organization_id)
      campaignQuery = campaignQuery
        .eq('user_id', userData.id)
        .is('organization_id', null)
    }

    const { data: campaigns, error: campaignsError } = await campaignQuery

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Get campaign stats for the same context
    const stats = await getCampaignStats(userData.id, orgDbId)

    return NextResponse.json({
      success: true,
      campaigns,
      stats,
      context: {
        organizationId,
        isOrganizationContext: !!organizationId
      }
    })

  } catch (error) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get aggregated campaign stats with organization context
async function getCampaignStats(userId: string, orgDbId: string | null = null) {
  try {
    // Build campaigns query based on context
    let campaignQuery = supabase
      .from('campaigns')
      .select('id')

    if (orgDbId) {
      // Organization context
      campaignQuery = campaignQuery.eq('organization_id', orgDbId)
    } else {
      // Personal context
      campaignQuery = campaignQuery
        .eq('user_id', userId)
        .is('organization_id', null)
    }

    const { data: campaigns, error: campaignsError } = await campaignQuery

    if (campaignsError || !campaigns || campaigns.length === 0) {
      console.error('Error fetching campaigns for stats:', campaignsError)
      return {
        totalMessages: 0,
        responseRate: 0
      }
    }

    const campaignIds = campaigns.map(c => c.id)

    // Get leads and their steps for these campaigns
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, steps, linkedin_connection_status, campaign_info')
      .not('steps', 'eq', '[]')

    if (leadsError) {
      console.error('Error fetching leads stats:', leadsError)
      return {
        totalMessages: 0,
        responseRate: 0
      }
    }

    // Calculate messages and response rate from steps
    let totalOutbound = 0
    let totalInbound = 0

    leadsData?.forEach(lead => {
      const steps = Array.isArray(lead.steps) ? lead.steps : []
      
      steps.forEach((step: any) => {
        if (step.stepType && (step.stepType.includes('message') || step.stepType.includes('connect'))) {
          if (step.stepType.includes('send') || step.stepType.includes('invite')) {
            totalOutbound++
          } else if (step.stepType.includes('reply') || step.stepType.includes('received')) {
            totalInbound++
          }
        }
      })

      // Also count connection status as indicators
      if (lead.linkedin_connection_status === 'replied') {
        totalInbound++
      }
    })

    const responseRate = totalOutbound > 0 ? Math.round((totalInbound / totalOutbound) * 100) : 0

    return {
      totalMessages: totalOutbound,
      responseRate
    }
  } catch (error) {
    console.error('Error calculating campaign stats:', error)
    return {
      totalMessages: 0,
      responseRate: 0
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 