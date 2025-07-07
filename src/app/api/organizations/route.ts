import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's organizations using the helper function
    const { data: organizations, error } = await supabase
      .rpc('get_user_organizations', { user_clerk_id: userId })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      organizations: organizations || []
    })

  } catch (error) {
    console.error('Error in organizations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, clerkOrgId, logoUrl, websiteUrl, industry, companySize } = body

    if (!name || !clerkOrgId) {
      return NextResponse.json({ error: 'Name and Clerk organization ID are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create organization with admin user
    const { data: orgId, error } = await supabase
      .rpc('create_organization_with_admin', {
        p_clerk_org_id: clerkOrgId,
        p_name: name,
        p_slug: slug,
        p_user_clerk_id: userId,
        p_logo_url: logoUrl,
        p_website_url: websiteUrl
      })

    if (error) {
      console.error('Error creating organization:', error)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Update organization with additional details if provided
    if (industry || companySize) {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          industry,
          company_size: companySize
        })
        .eq('id', orgId)

      if (updateError) {
        console.error('Error updating organization details:', updateError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      organizationId: orgId,
      message: 'Organization created successfully'
    })

  } catch (error) {
    console.error('Error in organizations POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 