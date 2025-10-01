import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, this is normal for first-time users
      return NextResponse.json({ 
        profile: null,
        isNewUser: true 
      })
    }

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // CRITICAL FIX: Also check for latest website analysis data
    const { data: latestAnalysis, error: analysisError } = await supabase
      .from('website_analysis')
      .select('*')
      .eq('user_id', user.id)
      .eq('analysis_status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (analysisError && analysisError.code !== 'PGRST116') {
      console.warn('Error fetching latest analysis:', analysisError)
    }


    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist yet, but we might have analysis data
      const defaultProfile = {
        company_name: user.company_name || '',
        website_url: user.website_url || latestAnalysis?.website_url || '',
        site_summary: '',
        icp: {},
        linkedin_connected: false,
        completed: false,
        onboarding_completed: false,
        onboarding_step_completed: {}
      }

      // REMOVED: No longer storing analysis data in user_profile
      // Analysis data comes directly from website_analysis table

      return NextResponse.json({ profile: defaultProfile })
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // SIMPLIFIED: user_profile only contains profile data, not analysis
    // Analysis data is fetched separately from website_analysis table

    return NextResponse.json({
      profile: {
        company_name: profile.company_name || user.company_name || '',
        website_url: profile.website_url || user.website_url || '',
        site_summary: profile.site_summary || '',
        linkedin_connected: profile.linkedin_connected || false,
        completed: profile.completed || false,
        onboarding_completed: profile.onboarding_completed || false,
        onboarding_step_completed: profile.onboarding_step_completed || {}
      },
      // Include latest analysis as separate field
      latestAnalysis: latestAnalysis ? {
        id: latestAnalysis.id,
        website_url: latestAnalysis.website_url,
        core_offer: latestAnalysis.core_offer,
        industry: latestAnalysis.industry,
        business_model: latestAnalysis.business_model,
        icp_summary: latestAnalysis.icp_summary,
        target_personas: latestAnalysis.target_personas || [],
        case_studies: latestAnalysis.case_studies || [],
        lead_magnets: latestAnalysis.lead_magnets || [],
        competitive_advantages: latestAnalysis.competitive_advantages || [],
        tech_stack: latestAnalysis.tech_stack || [],
        social_proof: latestAnalysis.social_proof || { testimonials: [], client_logos: [], metrics: [] },
        confidence_score: latestAnalysis.confidence_score,
        pages_analyzed: latestAnalysis.pages_analyzed,
        completed_at: latestAnalysis.completed_at
      } : null
    })

  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      company_name,
      website_url,
      site_summary,
      linkedin_connected,
      completed,
      onboarding_completed,
      onboarding_step_completed
    } = body
    
    // REMOVED: No longer accepting 'icp' field in user_profile
    // Analysis data is stored only in website_analysis table

    // Get user record or create if doesn't exist
    const { data: initialUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single()
    
    let user = initialUser

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create new user
      // We need email from Clerk, but for now we'll create with minimal data
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email: `${clerkUserId}@temp.com`, // This should be replaced with actual email from Clerk
          company_name,
          website_url
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      user = newUser
    } else if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Update user basic info
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        company_name,
        website_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Error updating user:', updateUserError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Upsert user profile (CLEANED: removed analysis fields)
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .upsert({
        user_id: user.id,
        company_name,
        website_url,
        site_summary,
        linkedin_connected: linkedin_connected || false,
        completed: completed || false,
        onboarding_completed: onboarding_completed || false,
        onboarding_step_completed: onboarding_step_completed || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        company_name: profile.company_name,
        website_url: profile.website_url,
        site_summary: profile.site_summary,
        linkedin_connected: profile.linkedin_connected,
        completed: profile.completed,
        onboarding_completed: profile.onboarding_completed,
        onboarding_step_completed: profile.onboarding_step_completed
      }
    })

  } catch (error) {
    console.error('Profile POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Get user from Supabase based on Clerk ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('user_profile')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    })

  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 